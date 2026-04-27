# PostCloudWatchController — change summary

This document explains every change made to the `PostCloudWatchController` branch during review.

The TL;DR: the controller had two correctness bugs that would have shipped (the tick only recovered `BREAKER#GLOBAL` while the write path happily created non-GLOBAL partitions; concurrent alarms on the same partition could silently lose signals). Alongside those, the branch was missing several standard operational safety nets (no DLQ, no log retention, no reserved concurrency, no PITR/deletion-protection/SSE on the table). The changes below fix those and rework the alarm definitions so tiered detection actually works: OS thread-pool rejection alarms on `DIFF(counter)` metric math (the raw metric is a lifetime counter — `Sum` returns the lifetime total every minute), API warnings gated by a request-count floor so P99 and 5xx-ratio don't flap on a handful of low-traffic requests, and JVM/CPU warnings retuned to a 3-5 min detection window so they fire _before_ critical — not after. Finally, the controller Lambda itself got a pair of self-observability alarms (Errors + DLQ depth) so a silent failure of the breaker doesn't go unnoticed.

The branch was deployed to `lobby-playground` on 2026-04-23 and the full `docs/resilience/` section was extended with two new dev docs (`circuit-breaker-alarms.mdx`, `circuit-breaker-behaviour.mdx`) that define every alarm and walk the state machine through real scenarios.

---

## 1. Routing: `parseAlarmName` now always returns `service: 'GLOBAL'`

### What changed

`src/index.ts` — `parseAlarmName` was rewritten. It used to extract `service = parts[1]` and `signal = parts.slice(2).join(':')`. It now always returns `service: 'GLOBAL'` and `signal = parts[parts.length - 1]` (the trailing segment).

`template.yaml` — the two API Gateway alarms (`BreakerAlarmApiP99`, `BreakerAlarmApi5xx`) now emit 4-part names: `breaker:GLOBAL:${ServiceName}:api-p99` / `...:api-5xx`. The four other alarms (`os-search-rejections`, `os-write-rejections`, `jvm-pressure`, `cpu-high`) were already 3-part `breaker:GLOBAL:<signal>` and are unchanged in shape.

### Why it was needed

The write path and the read-back path disagreed about how to route. `handleScheduledTick` hardcoded `const service = 'GLOBAL'` and only ever read from `BREAKER#GLOBAL`. But `parseAlarmName` on the write path extracted `parts[1]` and wrote to whatever partition that produced. Because `BreakerAlarmApiP99` was `breaker:${ServiceName}:api-p99` with `ServiceName=lobby-v2`, a compound warning would open `BREAKER#lobby-v2` — and then no tick would ever transition it back to `HALF_OPEN` or `CLOSED`. It would be stuck `OPEN` indefinitely, blocking recovery.

This was reproducible end-to-end: firing the template-emitted `breaker:lobby-v2:api-p99` + `breaker:lobby-v2:api-5xx` against a real DynamoDB Local produced a `BREAKER#lobby-v2` partition with `state=OPEN`, and a subsequent tick past `holdUntil` returned `transitioned: 0` because it only consulted `BREAKER#GLOBAL`.

### Why we collapsed instead of restoring per-service

The per-service design existed in `parseAlarmName` and in the unit-test fixtures but not in the tick (it had been in an earlier commit, removed together with a GSI in commit `a2c631d4`). Two options to make the system consistent:

- **A) Restore per-service recovery.** The tick would need to iterate all non-CLOSED partitions (either via a reintroduced GSI or a small index item tracking active services). More moving parts.
- **B) Commit to single GLOBAL breaker.** One partition, one tick read, simpler model. Product direction was "any critical or compound stress in the lobby stack sheds at the same gate", which matches a single-partition breaker well.

We picked (B). `parseAlarmName` now forces `GLOBAL` even if the alarm name disagrees — that's a defensive collapse: a future template typo like `breaker:lobbyv2:api-p99` (missing the GLOBAL segment) still routes to `BREAKER#GLOBAL` rather than silently re-creating a stuck orphan partition.

### Consequences

- Manual override via `setBreakerStateManually` still accepts any service (it's the intentional escape hatch for operators who need to reach a specific partition).
- Any pre-existing non-GLOBAL partitions in already-deployed tables are now orphans — they stay on disk until TTL (history / audit items) or manual cleanup (`STATE#CURRENT` / `SIGNAL_STATE#CURRENT` have no TTL). Harmless because nothing reads them, but worth sweeping manually for tidiness.
- Test fixtures and unit tests were updated to the new contract (more on this below).
- Two new tests were added: one for 4-part parsing, one for the drift-protection defensive collapse.

---

## 2. Consistency: `ConsistentRead: true` on the BatchGet

### What changed

`src/index.ts` — `getBreakerAndSignalState` now passes `ConsistentRead: true` on the `BatchGetCommand`.

### Why it was needed

DynamoDB reads default to eventually-consistent. Under normal conditions this is fine, but for a controller that does read → local compute → write in rapid succession (including back-to-back alarm events for the same partition), an eventually-consistent read can return the pre-write snapshot, causing the next decision to be based on stale state.

Strong reads double the RCU cost, but for two keys per invocation that is negligible. Correctness was worth the trade.

---

## 3. Signal-map pruning (zombie protection)

### What changed

`src/helpers.ts` — new `pruneStaleSignals(signals, nowMs, maxAgeMs)` helper.

`src/types.ts` — `RuntimeConfig` gained a `signalMaxAgeMs` field, defaulting to `2 × staleEventMs` and tunable via the `SIGNAL_MAX_AGE_MS` env var.

`src/index.ts` — `handleAlarmEvent` now prunes the merged signal map before computing severity. `handleScheduledTick`'s HALF_OPEN-expiry branch prunes before checking `hasActiveSignals`.

### Why it was needed

The `signals` map lives inside a single DynamoDB item, so the table-level TTL cannot prune individual entries. If a signal's closing OK event is ever dropped (EventBridge drop, stale-event guard rejects a too-old event, signal renamed in the template without a cleanup step), that signal stays in the map forever. Every subsequent tick at HALF_OPEN expiry would see `Object.keys(signals).length > 0` and re-open the breaker, effectively stranding the system in `OPEN` permanently.

The prune is conservative: entries whose `updatedAt` is older than `2 × staleEventMs` are dropped. The rationale: any OK event older than `staleEventMs` is dropped by the pre-existing `isExpired` guard, so a signal sitting unrefreshed for twice that window is evidence that its closing OK was lost and we should garbage-collect it defensively.

Pruning is disabled when `signalMaxAgeMs <= 0` (used in tests that turn off the stale-event guard entirely).

---

## 4. Optimistic concurrency (`ConditionExpression`) — lost-update race

### What changed

`src/index.ts`:

- `transactWriteEvaluation` (alarm path) now takes a `prevVersion` and adds a `ConditionExpression` to the `STATE#CURRENT` `Put`.
- `putStateAndHistory` (tick + manual override paths) also takes a `prevVersion` with the same `ConditionExpression`.
- Two condition shapes:
    - First-ever write (no `prev` read): `ConditionExpression: attribute_not_exists(PK)` so two simultaneous first-writes cannot both succeed.
    - Subsequent writes: `ConditionExpression: #v = :prevVersion` with the version we observed during the BatchGet.
- New helper `withOptimisticRetry(op)` runs the read-compute-write, retries exactly once on `ConditionalCheckFailedException` / `TransactionCanceledException` (when the cancellation reason is `ConditionalCheckFailed`), then rethrows.
- The three entry points (`handleAlarmEvent`, `handleScheduledTick`, `setBreakerStateManually`) are wrapped in `withOptimisticRetry`.

### Why it was needed

Under the consolidated GLOBAL-only design, every alarm — and the scheduled tick — writes to the same `BREAKER#GLOBAL` partition. Concurrent writes are more likely now, not less, because an incident typically flips several metrics within the same second and EventBridge delivers those events in parallel.

Without a guard, the race is:

```
T0  Writer A:  BatchGet → signals={}, version=5
T0  Writer B:  BatchGet → signals={}, version=5   (same snapshot)
T1  Writer A:  TransactWrite → signals={A}, version=6   ✓
T2  Writer B:  TransactWrite → signals={B}, version=6   ✓ (overwrites A)
```

Writer A's signal is gone from the map even though both writes "succeeded". That under-trips the breaker on real compound-warning incidents. With the guard, Writer B's transaction fails `ConditionalCheckFailed` because the stored version is 6 not 5, the whole transaction rolls back (including its `SIGNAL_STATE` Put), and `withOptimisticRetry` re-runs the full read-compute-write against the fresh state. On retry, Writer B sees `signals={A}`, merges in its own signal, and writes `signals={A,B}` cleanly.

### Why we only guard `STATE#CURRENT` (not `SIGNAL_STATE#CURRENT` too)

DynamoDB transactions are all-or-nothing. If the breaker-state Put's condition fails the `SIGNAL_STATE` Put in the same transaction is also rolled back. One guard on the monotonically-incrementing `version` protects both items, with less code.

### Why retry is bounded to one attempt

- Single contender (the common case): one retry almost always wins.
- Many contenders (alarm storm): retry-looping amplifies contention and hides the storm. Better to throw and let the Lambda DLQ catch the invocation — surfaces the real problem loudly.
- Circuit-breaker decisions are event-driven, not transactional: if an alarm event loses the race even on retry, the next alarm event (seconds later) re-observes the world and produces the correct posture. Brief eventual correctness is safe.

### Unrelated `TransactionCanceledException` reasons are not retried

`ThrottlingError`, `ItemCollectionSizeLimit`, etc. come out in the same exception shape. Retrying those would compound the problem, not fix it. The retry predicate specifically checks for `ConditionalCheckFailed` in `CancellationReasons`.

---

## 5. Local-run path — `DDB_ENDPOINT` wired

### What changed

`src/db.ts` — `getDdbClient` now reads `config.ddbEndpoint` and, when set, passes `{ endpoint }` to the `DynamoDBClient` constructor. The client cache key includes both region and endpoint so toggling between real AWS and DynamoDB Local invalidates the cached client.

`src/index.ts` — `getRuntimeConfig` reads `process.env.DDB_ENDPOINT`.

`src/types.ts` — `RuntimeConfig.ddbEndpoint?: string`.

`README.md` — the `sam local invoke` / local-run instructions now work as written. Previously they were documented but not wired (the code ignored `DDB_ENDPOINT`).

### Why it was needed

The README promised `DDB_ENDPOINT` support for local DynamoDB Local testing. The code did not read it, so `sam local invoke` against DynamoDB Local silently contacted real AWS. Small but annoying footgun for anyone following the README.

---

## 6. Infra / operational safety (`template.yaml`)

Collectively these are "the controller is now load-bearing, give it the same operational hygiene any other production Lambda gets." Each is small; together they close the gap between prototype and production.

### 6a. Dead-letter queue

Added `PostCloudWatchControllerDeadLetterQueue` (SQS), wired `DeadLetterQueue: { Type: SQS, TargetArn: ... }` on the Lambda, and granted the Lambda role `sqs:SendMessage` on it.

**Why:** EventBridge async invocations retry twice then drop silently. Without a DLQ, a controller invocation that fails (DDB throttling, code bug post-deploy, or — post this PR — a double-lost concurrency race) just vanishes. The DLQ makes those failures visible and recoverable.

Retention is 14 days on the queue, giving on-call a reasonable window to inspect before auto-cleanup.

### 6b. Explicit CloudWatch LogGroup with retention

Added `PostCloudWatchControllerLogGroup` (`AWS::Logs::LogGroup`) with `RetentionInDays: 30` and `DependsOn: PostCloudWatchControllerLogGroup` on the function.

**Why:** Lambda's implicit log group has "Never Expire" retention, which silently accumulates cost over time. The explicit `DependsOn` makes CFN create the log group before the Lambda can create one of its own — otherwise the first deploy races, Lambda creates the group first, and the CFN declaration fails because an identically-named group already exists.

### 6c. Reserved concurrency

Added `ReservedConcurrentExecutions: 5` on the function.

**Why:** Under an alarm storm (region-wide OpenSearch glitch, redeploy that flips many alarms at once) the function could otherwise scale to hundreds of concurrent invocations, all contending on the same `BREAKER#GLOBAL` partition. A small reservation bounds that contention and gives predictable worst-case cost. 5 is enough to absorb normal bursts and small enough to not cascade.

### 6d. DynamoDB table hygiene

On `CircuitControlTable`:

- `PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled: true`
- `DeletionProtectionEnabled: true`
- `SSESpecification: { SSEEnabled: true, SSEType: KMS }` (AWS-managed `aws/dynamodb` KMS key)
- `Tags` for `Service` and `Component`

**Why:**

- **PITR** — cheap insurance; data volume in this table is tiny and forensic restore after a bad controller deploy is worth the 35-day window.
- **Deletion protection** — stops `sam delete` or an accidental CFN stack deletion from wiping the breaker's entire history. To actually delete the table you must flip the flag to `false` in a prior deploy first.
- **KMS SSE** — gives CloudTrail visibility on key usage vs. the default AWS-owned keys, which aren't visible. Standard data-at-rest posture.
- **Tags** — cost allocation, ownership, and standard filtering.

---

## 7. CloudWatch alarm tuning

### 7a. OS thread-pool rejection alarms — `DIFF(counter)` metric math

`BreakerAlarmOsSearchRejections` and `BreakerAlarmOsWriteRejections` are the two critical signals: either one, alone, trips the breaker to OPEN.

The original incoming shape used `Statistic: Sum` on the raw `ThreadpoolSearchRejected` / `ThreadpoolWriteRejected` metric at `Threshold: 5` with `Period: 300`, `EvaluationPeriods: 5`, `DatapointsToAlarm: 3`, `TreatMissingData: notBreaching`. That misreads the metric entirely — and it was caught on 2026-04-23 right after the first successful deploy to `lobby-playground`, where the alarm fired immediately on a healthy domain and stayed in ALARM for 36 h.

**Why the old shape was wrong:** `AWS/ES ThreadpoolSearchRejected` is a **lifetime counter**, not a per-period rate. `Sum` over any window returns the cumulative count-since-domain-creation, not "rejections during this period". Observed on lobby-playground: the metric reported 131294.0 flat every single minute for 36+ hours. Any threshold above 5 against that statistic is in ALARM forever.

**The fix — metric math with `DIFF(counter)`:**

```
rejectionDelta = DIFF(counter)
```

where `counter` is `Sum(AWS/ES ThreadpoolSearchRejected)` at `Period: 60`. `DIFF` subtracts the previous datapoint from the current, so the alarm actually evaluates **rejections per minute**, which is what the `Threshold: 5` was meant to mean all along.

**Other tightening applied at the same time:**

- `Period 300 → 60` — now the per-minute delta is meaningful.
- `EvaluationPeriods 5 → 3`, `DatapointsToAlarm 3 → 2` — worst-case detection drops from 15 min to ~3 min, while the `2-of-3` still gives one datapoint of smoothing against genuinely transient bursts. Critical signals need to detect faster than warnings (which detect in 3–5 min, see 7d); this keeps the tiered-signal ordering intact.
- `TreatMissingData: notBreaching → breaching` — if OpenSearch stops publishing metrics (domain outage, IAM glitch) we want the breaker to trip safely rather than stay closed while Lambdas keep hammering a dead domain. Warnings stay `notBreaching` (see 7b/7c/7d) because missing data on those typically means "no traffic", not "system dead".

Only `rejectionDelta` has `ReturnData: true`; the raw `counter` is an input to the expression. Both alarms share the shape; the only differences are the metric name (`ThreadpoolSearchRejected` vs `ThreadpoolWriteRejected`) and the label text.

### 7b. `BreakerAlarmApi5xx` — count floor via metric math

Replaced the single-metric `Statistic: Average` alarm with a math alarm:

```
errorRatio = IF(requestCount >= 100, errorCount / requestCount, 0)
```

with `requestCount` = `Sum(AWS/ApiGateway Count)` and `errorCount` = `Sum(AWS/ApiGateway 5XXError)` over the same 300s window.

**Why:** `5XXError` is a 0/1 per-request metric in API Gateway, so `Average` is literally the error ratio. In quiet periods (3 AM, warm-up, synthetic checks only) 1 failing request out of 2 = `Average = 0.50 = 50 % error rate = alarm fires`. That flap would have tripped the compound-warning breaker (`api-p99 + api-5xx`) on events that are not actually user-visible incidents.

The count floor of 100 requests/period (≈ 0.33 rps sustained) suppresses the ratio computation when traffic is too low to be statistically meaningful. At normal traffic the alarm behaves identically to the old one.

### 7c. `BreakerAlarmApiP99` — count floor via metric math (same shape as api-5xx)

Symmetric gotcha on the other API warning. The original shape was `ExtendedStatistic: p99` directly on `AWS/ApiGateway Latency` at `Threshold: 5000` (5 s). P99 is a percentile computed over the sample in the evaluation period, so at very low traffic the percentile collapses to individual request outliers:

- 1 request at 5.1 s → P99 = 5.1 s → alarm fires
- 2 requests (one at 5.1 s, one at 200 ms) → P99 = 5.1 s → alarm fires

Combined with api-5xx this trips the compound-warning breaker on a single slow request during a quiet period. Replaced with the same count-floor shape:

```
p99Gated = IF(requestCount >= 100, p99Latency, 0)
```

where `requestCount` = `Sum(AWS/ApiGateway Count)`, `p99Latency` = `p99(AWS/ApiGateway Latency)`, both over the same 300 s window. Under 100 req/period the expression returns 0 (below threshold, alarm silent regardless of how slow any single request was); at/above 100 req/period it returns the true P99 and behaves identically to the old alarm.

The floor of 100 is chosen to match api-5xx exactly so the two warning signals share the same traffic gate — they can only compound-trip under statistically meaningful load.

### 7d. `BreakerAlarmJvmPressure` and `BreakerAlarmCpuHigh` — `Period: 300 → 60`

Both OpenSearch warnings were tuned to `Period: 300, EvaluationPeriods: 5, DatapointsToAlarm: 3`, which gives a 15–25 min detection window. That is strictly slower than the 2–3 min critical signals — meaning under a real load ramp the critical alarms trip _first_ and the warnings become a lagging confirmation rather than an early-warning tier. That inverts the tiered design.

Dropped both to `Period: 60` with the same `5/3` smoothing rule:

- Best case (sustained breach): 3 × 60 s = 3 min detection.
- Worst case (3-of-5 sliding): 5 × 60 s = 5 min detection.
- Critical signals for comparison: 2–3 min.

So warnings now fire ≈ 30–120 s before critical on a genuine ramp, which is the ordering the compound-warning design assumes. Statistic stays `Maximum` on the domain-level dimension (catches a single hot node even when the cluster average looks healthy). The `3-of-5` rule is the noise filter: a transient GC spike still requires 3 of the last 5 minutes above threshold, and the controller's `openHoldMs = 60 s` prevents downstream consumers from seeing any breaker whip-saw faster than once per minute.

CloudWatch alarms publish EventBridge events only on state transitions (OK↔ALARM), not on every evaluation — so faster `Period` speeds up detection without increasing steady-state event volume.

### 7e. API warnings kept at `Period: 300` — deliberate asymmetry

`BreakerAlarmApiP99` and `BreakerAlarmApi5xx` were NOT retuned to `Period: 60` in this pass. Reason: the count floor (100 req/period) makes `Period` choice semantic, not cosmetic:

- `100 / 300 s = 0.33 rps` gate — the current value.
- `100 / 60 s  = 1.67 rps` gate — what `Period: 60` would imply.

We don't have production traffic data to know whether 1.67 rps is always met outside of business hours. Dropping to `Period: 60` without adjusting the floor would risk disarmed alarms during off-peak. Decision: keep the 15–25 min API detection as the **known asymmetry**, documented in `docs/resilience/circuit-breaker-alarms.mdx`, and revisit once a real consumer lands and prod traffic is observable. _Do not retune without traffic data._

### 7f. `LobbyApi.Name` drift fix — dimension-consistency guard

`LobbyApi.Name` in the `AWS::Serverless::Api` resource was hardcoded to `"lobby-v2"`. The API alarms above (api-p99, api-5xx) use `Dimensions: ApiName = !Ref ServiceName`. If `ServiceName` is ever overridden at deploy time, the API resource name and the alarm dimension drift silently and the alarms end up watching a non-existent dimension — no metric datapoints, alarm stuck in `INSUFFICIENT_DATA` forever.

Changed `LobbyApi.Name` to `!Ref ServiceName` so the API name and the alarm dimension are sourced from the same parameter. Added an inline comment explaining why the hardcoded string is unsafe.

---

## 8. Controller self-observability alarms

Two alarms were added that watch the controller Lambda itself, not OpenSearch or the APIs. Both are deliberately **not** breaker signals, and both live in a dedicated "Controller self-observability alarms" block in `template.yaml`, right after `BreakerAlarmCpuHigh` and before the `LobbyApi` resource.

### 8a. `ControllerErrorsAlarm` — self-monitoring on the controller's own `Errors` metric

`AWS/Lambda Errors` on `FunctionName = !Ref PostCloudWatchControllerFunction`, `Statistic: Sum`, `Period: 60`, `EvaluationPeriods: 5`, `DatapointsToAlarm: 3`, `Threshold: 1`, `TreatMissingData: notBreaching`.

- `AlarmName: lobby-controller-errors-${StageName}` — **not** `breaker:`-prefixed (see 8c for why).
- Threshold 1: the controller is invoked rarely (alarm state changes + the 60 s tick), so there is no legitimate "error budget" — any error is a real signal.
- 3-of-5 smoothing filters a single transient Lambda auto-retry before paging. If the retry also fails, the DLQ alarm below catches it.
- `TreatMissingData: notBreaching`: no invocations ≠ error.

**Why it matters:** the controller is load-bearing. If it silently stops reacting to alarm transitions, downstream consumers keep reading an increasingly stale `BREAKER#GLOBAL` while real conditions have moved on — a severe but invisible failure mode without this alarm.

### 8b. `ControllerDlqDepthAlarm` — depth on the async-invocation DLQ

`AWS/SQS ApproximateNumberOfMessagesVisible` on `QueueName = !GetAtt PostCloudWatchControllerDeadLetterQueue.QueueName`, `Statistic: Maximum`, `Period: 60`, `EvaluationPeriods: 1`, `DatapointsToAlarm: 1`, `Threshold: 1`, `TreatMissingData: notBreaching`.

- `AlarmName: lobby-controller-dlq-depth-${StageName}` — **not** `breaker:`-prefixed (see 8c).
- No smoothing: the first message on the DLQ is already the incident. Messages only land here after Lambda has exhausted its async-invocation retries (initial attempt + 2 retries = 3 failures), so a non-empty DLQ means an alarm state-change event has been **permanently lost** to the controller.
- `TreatMissingData: notBreaching`: SQS may not publish depth datapoints when the queue has been empty for a while; empty and absent both mean OK.

### 8c. Why neither alarm carries a `breaker:` prefix

The EventBridge rule on `PostCloudWatchControllerFunction` matches `alarmName prefix: "breaker:"`. Any alarm whose name starts with that prefix is fed into the controller. If either self-observability alarm were ever renamed with the `breaker:` prefix:

- A controller error would fire `ControllerErrorsAlarm`.
- That alarm's state change would invoke the controller.
- The controller would fail again (same root cause).
- The alarm would stay in ALARM, keep invoking, keep failing — a runaway self-feedback loop that could mask or amplify the original problem.

The non-prefixed names are the physical guard against that loop. This is documented in a large comment block above the two alarms in `template.yaml` and cross-referenced in `docs/resilience/circuit-breaker-alarms.mdx` and the top of `docs/resilience/circuit-breaker-behaviour.mdx` (the scenario walk-throughs explicitly exclude self-observability alarms from state-transition analysis).

### 8d. Integration with the existing DLQ

The DLQ resource itself (`PostCloudWatchControllerDeadLetterQueue`) was already added in section 6a. This alarm is the consumer-facing counterpart: 6a makes failures _recoverable_, 8b makes them _visible_. Together they close the silent-failure gap.

---

## 9. Dev documentation

Two new MDX docs were added under `docs/resilience/` to make the controller's behaviour self-serve for anyone coming onto the team:

### 9a. `circuit-breaker-alarms.mdx`

Catalogues every alarm: what it measures, why it uses (or doesn't use) metric math, threshold, detection-timing table, missing-data policy, and the anti-flap levers. Covers the six breaker signals (2 critical + 4 warning) and the two self-observability alarms. Explicitly documents the api-p99 / api-5xx asymmetry (7e) so the next person who touches the template doesn't "helpfully" retune them without traffic data.

### 9b. `circuit-breaker-behaviour.mdx`

Walks the state machine through four realistic scenarios (slow ramp to critical, short critical peak, low-traffic with 3 sub-cases, warning-only ramp ± brief compound overlap) and lists 5 invariants that hold across all of them. Opens with a cross-reference clarifying that self-observability alarms (8a / 8b) are not part of any scenario — they don't participate in state transitions.

### 9c. Navigation

`docs/resilience/index.mdx` and `docs/resilience/meta.json` were extended to wire both new docs into the resilience section's navigation.

### 9d. Function-level `README.md`

The function `README.md` gained an e2e section (how to run `yarn test:e2e` against DynamoDB Local), the `DDB_ENDPOINT` local-run path (see section 5), and a note about AWS creds / `sam local invoke` configuration.

---

## 10. Cleanup

### 10a. Lockfile consolidation

Deleted `/package-lock.json` and `/functions/PostCloudWatchController/package-lock.json`. The repo is a yarn workspace; committing npm lockfiles alongside `yarn.lock` caused yarn to warn on every install and risked lockfile drift.

### 10b. `helpers.ts` comment fix

The old comment on `SIGNAL_STATE_SK` said "This is for AlarmEvent" — wrong; it's the signal snapshot, not the alarm-event audit key. Rewritten.

### 10c. Fixture additions / updates

New fixtures `events/alarm-api-p99.json` and `events/alarm-api-5xx.json` matching the template's 4-part alarm names.

`events/alarm-warning-only.json` — the 3-part `breaker:GLOBAL:api-p99` it used to carry is no longer what the template emits; rewritten to the 4-part shape for consistency with the other warning fixtures.

### 10d. Miscellaneous `template.yaml` fixes

- **`IamRoleArm` → `IamRoleArn`** — 4 typos fixed in the Outputs section (export names like `...FunctionIamRoleArm`). No semantic impact beyond making the exports match their actual ARN contents, but left unfixed it would produce confusing cross-stack import names.
- **`GetRecentlyPlayedFunctionIamRole` description** — corrected to reflect the right function name (had a copy-paste leftover).

---

## 11. Tests

### 11a. Unit tests — `tests/index.test.ts`

| Area                         | Tests                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GLOBAL routing               | Existing tests rewritten to assert `service: 'GLOBAL'`; new test: "routes a 4-part alarm name to BREAKER#GLOBAL and extracts the trailing signal"; new test: "defensively routes a non-GLOBAL alarm name to BREAKER#GLOBAL (template-drift guard)"                                                                                                                                             |
| Zombie signal pruning        | New test: "prunes stale signals from SIGNAL_STATE before computing severity"; new test: "scheduled tick prunes zombie signals before the HALF_OPEN expiry decision"                                                                                                                                                                                                                            |
| Optimistic concurrency       | New test: "guards the first-ever breaker write with attribute_not_exists(PK)"; new test: "guards a breaker update with a version-based ConditionExpression"; new test: "retries once when the first transact-write loses the version guard"; new test: "stops after one retry and rethrows if the race persists"; new test: "does not retry on unrelated TransactionCanceledException reasons" |
| Manual override escape hatch | Kept intentionally using `service: 'GetGamesFunction'` to prove the `setBreakerStateManually` path still accepts any service (documented in a comment).                                                                                                                                                                                                                                        |

30 passing tests (up from 21 on the incoming branch), 99.9 % statement coverage on the production source.

### 11b. End-to-end suite — `scripts/test-e2e.js`

A new executable harness (`yarn test:e2e`) drives the built handler against a real DynamoDB Local container. 62 assertions across 16 scenarios cover the full state machine: CLOSED → OPEN on single-critical, CLOSED → OPEN on compound-warning, HALF_OPEN transition past `holdUntil`, OK-event closure, optimistic-concurrency retry, signal pruning, manual override, the 4-part alarm-name routing, and the defensive GLOBAL collapse for drift-protection. Runs in CI against the same fixtures the unit tests use.

---

## 12. Things intentionally NOT done

- **`JVMMemoryPressure` threshold 85 %.** We flagged that 80 % is more conservative for OpenSearch GC behaviour, but you asked for this to be left at 85 %. Unchanged.
- **API alarm `Period` retune.** `BreakerAlarmApiP99` and `BreakerAlarmApi5xx` stay at `Period: 300` pending production traffic data. See 7e for the full reasoning. _Do not retune without data._
- **`GetHistoricalGameTitlesFunction` `FunctionName` removal.** This line disappeared from the incoming branch and CFN would delete and recreate the function with a generated name on deploy. Unrelated to this ticket; you asked to skip. Worth confirming with the team before final merge.
- **Per-service breaker support revival.** Explicitly replaced by "always GLOBAL". Reversible later by re-adding an index-of-active-breakers item and letting the tick iterate, if the product direction changes.
- **Persisting severity score into `BreakerStateItem`.** The controller already computes `score: 'HIGH' | 'MEDIUM_HIGH' | 'LOW' | 'NONE'` in `computeSeverityScore` but doesn't persist it. Exposing it would let consumers make tier-aware shedding decisions. Only worth doing once a real consumer lands.
- **`halfOpenMaxMs` / `healthyOkEventsToClose` retune.** Current defaults are quite permissive (1 OK closes the breaker). A classical probe pattern (3 OK events or a 2-min clean window) may be worth considering once there's real load data. `openHoldMs=60 s` + 3-of-5 alarm smoothing mitigates the risk for now.
- **SNS → PagerDuty/Slack notification pipeline.** Explicitly out of scope for this branch. Alarms fire but no paging is wired up yet. Will be handled in separate work.
- **Consumer integration (reader helper in `libs/OSClient`).** The whole point of the controller is to have lobby Lambdas read `BREAKER#GLOBAL` and shed non-critical traffic. That reader does not exist yet; it's deliberately deferred to a follow-up branch.
- **`samconfig.toml` parameter overrides.** Parameters like `OpenSearchDomainName` must be set on the deploy pipeline; not changed here because it depends on pipeline-level config we can't see from this branch.

---

## 13. Deploy considerations

The template introduces new AWS resources on next deploy. Nothing destructive but worth flagging to whoever approves:

- **New resources** — SQS DLQ (`PostCloudWatchControllerDeadLetterQueue`), CloudWatch LogGroup (`PostCloudWatchControllerLogGroup`), plus the six breaker signal alarms and the two self-observability alarms (`ControllerErrorsAlarm`, `ControllerDlqDepthAlarm`).
- **Changes on the existing `CircuitControlTable`** — enables PITR, deletion protection, and KMS SSE. PITR enablement is non-destructive. Deletion protection is a metadata flip. KMS SSE is an in-place table re-encryption done by CFN without downtime.
- **Changes on the Lambda** — adds `ReservedConcurrentExecutions: 5`, `DeadLetterQueue` config, and `DependsOn: LogGroup`.
- **Alarm changes** — same-name replacements (no CFN rename dance):
    - `BreakerAlarmOsSearchRejections` / `BreakerAlarmOsWriteRejections` — gain `DIFF(counter)` metric math, `Period 300 → 60`, `5/3 → 3/2`, `TreatMissingData: notBreaching → breaching` (7a).
    - `BreakerAlarmApiP99` — gains count-floor metric math, `ExtendedStatistic: p99` → math expression (7c).
    - `BreakerAlarmApi5xx` — gains count-floor metric math (7b), `Period` unchanged at 300.
    - `BreakerAlarmJvmPressure` / `BreakerAlarmCpuHigh` — `Period 300 → 60` (7d).
- **`LobbyApi.Name`** — changes from hardcoded `"lobby-v2"` to `!Ref ServiceName` (7f). In environments where `ServiceName` parameter defaults to `"lobby-v2"` this is a no-op. In environments that override the parameter, the API GW physical ID changes — **verify before deploying to production**.
- **Orphan log-group gotcha.** On 2026-04-23 the first `sam deploy` to `lobby-playground` failed with `AWS::EarlyValidation::ResourceExistenceCheck` because Lambda had auto-created `/aws/lambda/personalisation-lobby-games-cloudwatch-controller` during an earlier rolled-back deploy, blocking the explicit `AWS::Logs::LogGroup` resource. Fix: `aws logs delete-log-group --log-group-name /aws/lambda/<fn-name>` before retry. If this recurs on another environment, same fix applies.

Everything else (new fixtures, test updates, README tweaks, new `docs/resilience/*.mdx`, lockfile deletions) is repo-only and does not affect deployed state.

---

## 14. Verified behaviour

- `yarn typecheck` — clean.
- `yarn unit` — 30/30 passing, 99.9 % statement coverage.
- `yarn build` — bundle ≈ 8–9 kb.
- `yarn test:e2e` — 62/62 assertions pass against real DynamoDB Local across 16 scenarios.
- **`sam deploy` to `lobby-playground` succeeded on 2026-04-23** (see 13 for the orphan-log-group gotcha that needed clearing first).
- End-to-end smoke — firing the two template-emitted warning alarms in sequence opens `BREAKER#GLOBAL` with `reason: compound_open:compound_warning:api-p99,api-5xx`; the scheduled tick past `holdUntil` transitions to `HALF_OPEN`; a subsequent OK event on the critical signal closes the breaker. `version` on `STATE#CURRENT` increments monotonically across writes.
