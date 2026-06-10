# PostCloudWatchController

Circuit breaker controller Lambda backed by DynamoDB. It consumes CloudWatch alarm state-change events, computes compound severity across active signals, and persists breaker posture into a single DynamoDB table.

## DynamoDB single-table schema + TypeScript controller Lambda

### Design:

- CloudWatch alarm state changes arrive on EventBridge when an alarm transitions
  state (edge-triggered), not on every evaluation period while it stays in the same state.
- This Lambda maintains a `SIGNAL_STATE#CURRENT` item per service that snapshots
  only the alarms that are currently active. On each incoming alarm event the map is updated,
  a compound severity score is computed, and the breaker posture decided from the
  aggregate -- not from the single incoming alarm alone.
- A scheduled tick (rate 1 min) drives timeout-based transitions (OPEN -> HALF_OPEN,
  HALF_OPEN -> CLOSED or HALF_OPEN -> OPEN) without needing a raw datapoint stream.
- The breaker itself persists three logical states: CLOSED, OPEN, and HALF_OPEN.
  The signal snapshot keeps only alarms that are still actively in ALARM.
- The key persisted records are: current breaker posture (`STATE#CURRENT`), breaker
  history (`STATE#<isoTs>`), current signal snapshot (`SIGNAL_STATE#CURRENT`), and
  raw alarm event audit entries (`EVENT#<isoTs>#<alarmName>`). Together these let
  the function reason about compound health, recovery progression, and why a
  breaker decision was made.
- `SIGNAL_STATE#CURRENT` is the authoritative view of what is currently in ALARM.
  Because CloudWatch alarms are edge-triggered, OK events for a given alarm may have
  arrived while the breaker was OPEN (before it entered HALF_OPEN). In that case no
  further OK events will fire during the HALF_OPEN probe window. The scheduled tick
  therefore consults `SIGNAL_STATE#CURRENT` at HALF_OPEN expiry to decide the outcome:
  if there are no active signals the breaker closes immediately; if signals are still
  present it re-opens. Reconstructing this from `ALARM_EVENT` audit records is not
  feasible — DynamoDB has no GROUP BY primitive and the scan would be unbounded.

### DynamoDB entity families (single table: `CircuitControl-<stage>`)

1. Current breaker posture
   PK = `BREAKER#<service>` SK = `STATE#CURRENT`
2. Breaker state history (TTL: 30 days)
   PK = `BREAKER#<service>` SK = `STATE#<isoTs>`
3. Signal snapshot (current active alarms per service)
   PK = `BREAKER#<service>` SK = `SIGNAL_STATE#CURRENT`
4. Alarm event audit (TTL: 14 days)
   PK = `BREAKER#<service>` SK = `EVENT#<isoTs>#<alarmName>`

### Compound severity policy

Critical signals (single signal triggers OPEN immediately):
os-search-rejections, os-write-rejections

Warning signals (two or more together trigger OPEN):
api-p99, api-5xx, jvm-pressure, cpu-high

Recovery:
OPEN + holdUntil expired (tick) -> HALF_OPEN
HALF_OPEN + OK + probeCount >= threshold (alarm event) -> CLOSED
HALF_OPEN + ALARM (any signal, alarm event) -> OPEN
HALF_OPEN + holdUntil expired, no active signals (tick) -> CLOSED
HALF_OPEN + holdUntil expired, active signals remain (tick) -> OPEN

Note on the last two transitions: because CloudWatch alarms are edge-triggered, OK
events may have arrived while the breaker was still OPEN. If all signals cleared before
the probe window started, no new OK events will fire during HALF_OPEN. The tick
therefore checks SIGNAL_STATE#CURRENT at expiry rather than assuming "no OK event
received = not recovered".

Alarm naming convention (parsed by `parseAlarmName` in `src/index.ts`):

- 3-part: `breaker:GLOBAL:<signal>` — e.g. `breaker:GLOBAL:os-search-rejections`
- 4-part: `breaker:GLOBAL:<label>:<signal>` — e.g. `breaker:GLOBAL:lobby-v2:api-p99`

`GLOBAL` is a fixed routing key; the optional `<label>` segment is preserved for CloudWatch console / log searches but ignored by routing. The controller's `parseAlarmName` always returns `service: 'GLOBAL'` regardless of what the alarm name says — see `docs/resilience/adr/002-global-only-partition.mdx`.

Required IAM permissions (granted on the function's role in `template.yaml`):

- `dynamodb:GetItem`, `PutItem`, `BatchGetItem`, `TransactWriteItems` — scoped to the `CircuitControl-${StageName}` table ARN
- `sqs:SendMessage` — scoped to the controller's DLQ ARN (Lambda needs this to deliver async-invocation failures to the configured DLQ)
- `ssm:GetParameter` — scoped to `arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/personalisation-lobby-${StageName}-breaker.json`
- `AWSLambdaBasicExecutionRole` (managed policy) — for CloudWatch Logs writes

Environment variables:

- `CB_DDB_TABLE` — DynamoDB table name (required)
- `BREAKER_SETTINGS_PARAMETER_NAME` — name of the SSM parameter that holds the breaker-tuning JSON document (required unless every `BREAKER_*` env var below is set). Set in `template.yaml` to `personalisation-lobby-${StageName}-breaker.json`.

## Configuration source

The six breaker-tuning knobs (`openHoldMs`, `halfOpenMaxMs`,
`healthyOkEventsToClose`, `eventHistoryTtlSec`, `stateHistoryTtlSec`,
`staleEventMs`) live as **a single JSON document in one AWS Systems Manager
Parameter Store parameter** named `personalisation-lobby-${StageName}-breaker.json`,
fetched at runtime by `loadBreakerSettings` in [src/settings.ts](src/settings.ts).
The document shape is:

```json
{
    "OPEN_HOLD_MS": 60000,
    "HALF_OPEN_MAX_MS": 120000,
    "HEALTHY_OK_EVENTS_TO_CLOSE": 2,
    "EVENT_HISTORY_TTL_SEC": 1209600,
    "STATE_HISTORY_TTL_SEC": 2592000,
    "STALE_EVENT_MS": 600000
}
```

**Why Parameter Store + SDK instead of AppConfig or a Lambda extension** — the
full decision write-up, alternatives we considered (AppConfig, AWS Parameters
and Secrets Lambda Extension), and pricing comparison live at
[`docs/resilience/configuration-store-decision.mdx`](../../docs/resilience/configuration-store-decision.mdx).
TL;DR:

- Container-image stg/prod packaging makes any Lambda layer extension a
  Dockerfile-modification problem with divergent install paths between dev
  (zip) and stg/prod (image). The SDK + module cache is one code path across
  both packaging modes.
- Parameter Store standard tier is genuinely free at standard throughput.
  Option C (this) costs $0/month; AppConfig would cost ~$0.01/month. Both
  negligible — decision is operational, not financial.
- The validation + auto-rollback wins of AppConfig are real but pay off most
  when settings change frequently during incidents. These knobs change rarely
  enough that they don't justify the operational onboarding yet. Migration
  to AppConfig later is mechanical: `loadBreakerSettings`'s public shape stays
  stable, only the loader internals swap.

### Cache and propagation

`loadBreakerSettings` keeps an in-process cache with a 60 s TTL. After an
operator runs

```bash
aws ssm put-parameter --name personalisation-lobby-${StageName}-breaker.json \
    --type String --overwrite \
    --value '{"OPEN_HOLD_MS":90000,"HALF_OPEN_MAX_MS":120000,"HEALTHY_OK_EVENTS_TO_CLOSE":2,"EVENT_HISTORY_TTL_SEC":1209600,"STATE_HISTORY_TTL_SEC":2592000,"STALE_EVENT_MS":600000}'
```

the change propagates to every warm Lambda container within 60 s, and to a
fresh cold-start container immediately. No redeploy needed.

`put-parameter --overwrite` replaces the whole JSON document; remember to
include every key when tuning a single value, or the loader will throw on
the missing keys.

### Drift caveat — read before tuning

The SSM parameter is managed by CloudFormation in `template.yaml` (dev /
playground) and by terraform out-of-band (stg / prod). For the CFN-managed
case, each `sam deploy` resets the value to whatever the template declares.
The intended workflow during an incident is:

1. `aws ssm put-parameter ... --overwrite` to apply the emergency value.
2. After the incident, commit the same JSON into the `BreakerSettingsJson`
   resource's `Value:` field in `template.yaml` so it persists past the
   next deploy.

### Per-setting env-var overrides

Each setting may also be supplied as an env var on the function — these win
over SSM and short-circuit the SSM call entirely (so unit tests skip SSM
without mocking). The override env vars are:

- `BREAKER_OPEN_HOLD_MS`
- `BREAKER_HALF_OPEN_MAX_MS`
- `BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE`
- `BREAKER_EVENT_HISTORY_TTL_SEC`
- `BREAKER_STATE_HISTORY_TTL_SEC`
- `BREAKER_STALE_EVENT_MS`

### Failure mode

The loader is fail-loud: any error (missing parameter, malformed value, SSM
throttle, missing prefix) throws. Async invocation failures land in the
`PostCloudWatchControllerDeadLetterQueue` and surface via the
`ControllerErrorsAlarm` and `ControllerDlqDepthAlarm` alarms. There is
intentionally no fallback to hardcoded defaults — a control-plane Lambda
silently running on a wrong config is the worse failure mode.

## Local development

Install dependencies and build the function:

```bash
yarn install
yarn build
```

Copy the sample env file before running locally:

```bash
cp env_example.json env.eu.json
```

The local env file is structured the same way as the personalised-lobby project: SAM injects environment variables per function from the JSON file at invoke time, rather than from a checked-in `.env` contract.

## Test locally with DynamoDB Local

The recommended local flow invokes the built bundle directly in Node against DynamoDB Local, using the controller's `DDB_ENDPOINT` env var to redirect DynamoDB traffic to the local instance. This avoids SAM's container networking complexity and keeps the endpoint override visible in `getRuntimeConfig`.

### 1. Start DynamoDB Local

```bash
yarn local:dynamodb
```

Exposes DynamoDB Local on `http://localhost:8000`.

### 2. Create the local table

Dummy credentials are fine for DynamoDB Local — it accepts anything but the AWS CLI still requires the env vars to be set.

```bash
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
  aws dynamodb create-table \
    --table-name CircuitControl-v2 \
    --attribute-definitions \
      AttributeName=PK,AttributeType=S \
      AttributeName=SK,AttributeType=S \
    --key-schema \
      AttributeName=PK,KeyType=HASH \
      AttributeName=SK,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url http://localhost:8000 \
    --region eu-west-1
```

Optionally enable TTL for parity with the deployed stack:

```bash
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
  aws dynamodb update-time-to-live \
    --table-name CircuitControl-v2 \
    --time-to-live-specification Enabled=true,AttributeName=ttl \
    --endpoint-url http://localhost:8000 \
    --region eu-west-1
```

### 3. Build and invoke the handler

```bash
yarn build
```

Invoke the handler directly with any event file. `DDB_ENDPOINT` is honoured by `getRuntimeConfig` → `getDdbClient` and redirects DynamoDB traffic to `localhost:8000`.

Both invocations need to bypass the SSM call on `loadBreakerSettings`, otherwise the loader throws `BREAKER_SETTINGS_PARAMETER_NAME env var is required`. The simplest way is to set all six `BREAKER_*` env vars — when every setting has an env-var override the loader skips the SSM call entirely (see `src/settings.ts`). `BREAKER_STALE_EVENT_MS=0` also disables the freshness guard so the shipped fixtures (which have hardcoded timestamps) are always accepted.

Alarm open event:

```bash
CB_DDB_TABLE=CircuitControl-v2 \
BREAKER_OPEN_HOLD_MS=60000 \
BREAKER_HALF_OPEN_MAX_MS=120000 \
BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE=2 \
BREAKER_EVENT_HISTORY_TTL_SEC=1209600 \
BREAKER_STATE_HISTORY_TTL_SEC=2592000 \
BREAKER_STALE_EVENT_MS=0 \
AWS_REGION=eu-west-1 \
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
DDB_ENDPOINT=http://localhost:8000 \
  node -e 'const { handler } = require("./dist/index.js");
           const e = require("./events/alarm-open.json");
           handler(e).then(r => console.log(JSON.stringify(r, null, 2)));'
```

Scheduled recovery tick:

```bash
CB_DDB_TABLE=CircuitControl-v2 \
BREAKER_OPEN_HOLD_MS=60000 \
BREAKER_HALF_OPEN_MAX_MS=120000 \
BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE=2 \
BREAKER_EVENT_HISTORY_TTL_SEC=1209600 \
BREAKER_STATE_HISTORY_TTL_SEC=2592000 \
BREAKER_STALE_EVENT_MS=0 \
AWS_REGION=eu-west-1 \
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
DDB_ENDPOINT=http://localhost:8000 \
  node -e 'const { handler } = require("./dist/index.js");
           const e = require("./events/tick.json");
           handler(e).then(r => console.log(JSON.stringify(r, null, 2)));'
```

### 4. Inspect the table contents

```bash
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
  aws dynamodb scan \
    --table-name CircuitControl-v2 \
    --endpoint-url http://localhost:8000 \
    --region eu-west-1
```

Query a single breaker:

```bash
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
  aws dynamodb query \
    --table-name CircuitControl-v2 \
    --key-condition-expression "PK = :pk" \
    --expression-attribute-values '{":pk":{"S":"BREAKER#GLOBAL"}}' \
    --endpoint-url http://localhost:8000 \
    --region eu-west-1
```

You should see items with `SK` values like `STATE#CURRENT`, `SIGNAL_STATE#CURRENT`, and `EVENT#<timestamp>#<alarmName>`.

### Note on `sam local invoke`

`sam local invoke` is supported — the Lambda image will respect `DDB_ENDPOINT` passed via `--env-vars`. For macOS, set it to `http://host.docker.internal:8000` so the SAM container can reach the DynamoDB Local process running on the host.

## End-to-end integration test (`yarn test:e2e`)

`scripts/test-e2e.js` runs the **built bundle** against a real DynamoDB Local and asserts on the stored state after every scenario. It covers what unit tests cannot: actual `ConditionExpression` wiring, `ConsistentRead` behaviour, and concurrent handler invocations racing on a shared partition.

```bash
yarn test:e2e
```

The script will:

1. Start a `amazon/dynamodb-local` container on port 8000 (docker or podman, whichever is on PATH).
2. Create a throwaway `CircuitControl-e2e` table.
3. Require the handler from `dist/index.js` with `DDB_ENDPOINT` pointed at the container.
4. Run each scenario, wiping the table and/or seeding state between them:
    - CLOSED → OPEN on a critical signal
    - Single warning stays CLOSED
    - Compound warning opens
    - OK on an OPEN breaker clears the signal but keeps state OPEN
    - Non-GLOBAL alarm names are defensively routed to `BREAKER#GLOBAL`
    - Tick transitions: `OPEN → HALF_OPEN`, `HALF_OPEN → CLOSED/OPEN` depending on active signals
    - `HALF_OPEN` retrips on ALARM / closes on OK
    - Zombie signals older than `SIGNAL_MAX_AGE_MS` are pruned
    - Two concurrent writes on a fresh partition both land (optimistic-concurrency race proof)
    - Four concurrent writes: at least one exhausts the one-retry budget and throws — documents the DLQ path
5. Tear the container down (even on Ctrl-C / failure).

Flags:

- `--keep` — leaves the container running after the tests so you can poke at the final state with `aws dynamodb scan`.
- `--no-setup` — assumes DynamoDB Local is already running on `:8000` with the table present; useful when iterating on the script itself.

When inspecting DynamoDB Local after a `--keep` run, the AWS CLI still requires credentials to sign the request (even though the server does not check them). Prefix your commands with dummy creds or export them for the session:

```bash
export AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local AWS_REGION=eu-west-1

aws dynamodb scan --table-name CircuitControl-e2e --endpoint-url http://localhost:8000
aws dynamodb query --table-name CircuitControl-e2e \
  --key-condition-expression "PK = :pk" \
  --expression-attribute-values '{":pk":{"S":"BREAKER#GLOBAL"}}' \
  --endpoint-url http://localhost:8000
```

Prerequisites:

- `dist/index.js` must be current — the yarn script runs `yarn build` first.
- `docker` or `podman` on PATH.
- `aws` CLI on PATH (used only for table creation; the rest uses the JS SDK already in `node_modules`).

If a test fails, the script prints the failure line, the expected vs actual value, and exits non-zero. The container is still torn down so nothing leaks between runs.

## Docker image

Build the Lambda container image for this project:

```bash
docker build -t post-cloud-watch-controller .
```

This Dockerfile is specific to PostCloudWatchController. It builds the TypeScript bundle with `yarn build` and packages the Lambda with handler `dist/index.handler`.

## Environment loading

Runtime configuration is resolved lazily inside the handler path rather than at module import time, so `sam local invoke --env-vars ...` injections are picked up correctly and tests can set env per-case without module caching getting in the way.

Environment variables:

- `CB_DDB_TABLE` — required. Target DynamoDB table.
- `BREAKER_SETTINGS_PARAMETER_NAME` — required unless every `BREAKER_*` setting override below is set. Name of the SSM parameter that holds the breaker-tuning JSON document. Set in `template.yaml` to `personalisation-lobby-${StageName}-breaker.json`.
- `BREAKER_OPEN_HOLD_MS`, `BREAKER_HALF_OPEN_MAX_MS`, `BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE`, `BREAKER_EVENT_HISTORY_TTL_SEC`, `BREAKER_STATE_HISTORY_TTL_SEC`, `BREAKER_STALE_EVENT_MS` — optional per-setting overrides. Each one wins over the corresponding JSON value; setting all six skips the SSM call entirely. Used by tests and local development. `BREAKER_STALE_EVENT_MS=0` disables the freshness guard.
- `SIGNAL_MAX_AGE_MS` — optional. Signals unseen in `SIGNAL_STATE#CURRENT` for longer than this are pruned on the next evaluation. Defaults to `2 × staleEventMs`. (No `BREAKER_` prefix — pruning is treated as a runtime invariant, not a tuning knob; see `src/types.ts` BreakerSettings.signalMaxAgeMs.)
- `AWS_REGION` — standard.
- `DDB_ENDPOINT` — optional. Redirects DynamoDB traffic (used only for local DynamoDB Local testing).
