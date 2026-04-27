import { BatchGetCommand, GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import {
    ActiveSignalEntry,
    AlarmEventItem,
    AlarmState,
    BreakerHistoryItem,
    BreakerState,
    BreakerStateItem,
    CloudWatchAlarmEvent,
    EntityType,
    RuntimeConfig,
    ScheduledTickEvent,
    SeverityResult,
    SignalStateItem,
} from './types';
import { SETTINGS, CRITICAL_SIGNALS, WARNING_SIGNALS } from './config';
import { getDdbClient } from './db';
import {
    pk,
    CURR_STATE_SK,
    SIGNAL_STATE_SK,
    stateHistorySk,
    eventSk,
    nowIso,
    toEpochSeconds,
    addMs,
    pruneStaleSignals,
} from './helpers';
import { buildStateItem, determineNextState } from './statemachine';

function getRequiredEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function getRuntimeConfig(): RuntimeConfig {
    const staleEventMs = Number(process.env.STALE_EVENT_MS ?? SETTINGS.staleEventMs);
    return {
        tableName: getRequiredEnv('TABLE_NAME'),
        staleEventMs,
        // Signals are pruned if unseen for 2× the staleEventMs window. Rationale:
        // any OK event older than `staleEventMs` would have been dropped by the
        // isExpired guard, so if a signal has sat in the map for longer than 2×
        // that window without a refresh we assume the closing OK was lost and
        // garbage-collect it defensively. See pruneStaleSignals in helpers.ts.
        signalMaxAgeMs: Number(process.env.SIGNAL_MAX_AGE_MS ?? staleEventMs * 2),
        awsRegion: process.env.AWS_REGION?.trim() || process.env.AWS_DEFAULT_REGION?.trim() || undefined,
        ddbEndpoint: process.env.DDB_ENDPOINT?.trim() || undefined,
    };
}

// ---------------------------------------------------------------------------
// Event type guards
// ---------------------------------------------------------------------------

function isCloudWatchAlarmEvent(input: unknown): input is CloudWatchAlarmEvent {
    return (
        typeof input === 'object' &&
        input !== null &&
        ((input as CloudWatchAlarmEvent).source === 'aws.cloudwatch' ||
            (input as CloudWatchAlarmEvent).source === 'aws.monitoring')
    );
}

function isScheduledTickEvent(input: unknown): input is ScheduledTickEvent {
    return (
        typeof input === 'object' &&
        input !== null &&
        ((input as ScheduledTickEvent).source === 'aws.events' ||
            (input as ScheduledTickEvent).source === 'aws.scheduler')
    );
}

function isExpired(eventTime: string, staleEventMs: number): boolean {
    return staleEventMs > 0 && Date.now() - new Date(eventTime).getTime() > staleEventMs;
}

// ---------------------------------------------------------------------------
// Optimistic-concurrency retry
// ---------------------------------------------------------------------------

/**
 * Returns true when `err` is a DynamoDB "another writer got there first" error.
 *
 * The SDK surfaces the same underlying situation in two shapes depending on
 * whether the failing write was a standalone Put or part of a transaction:
 *   - Standalone Put  → `ConditionalCheckFailedException` on the top-level error.
 *   - TransactWriteItems → `TransactionCanceledException` with a
 *     `CancellationReasons` entry whose `Code` is `ConditionalCheckFailed`.
 *
 * All of our write paths currently use TransactWriteItems, but we match both
 * shapes so a future refactor to a plain `PutCommand` does not silently break
 * the retry semantics.
 */
function isConditionalCheckFailure(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false;
    const e = err as { name?: string; CancellationReasons?: Array<{ Code?: string } | undefined> };
    if (e.name === 'ConditionalCheckFailedException') return true;
    if (e.name === 'TransactionCanceledException') {
        return Boolean(e.CancellationReasons?.some((r) => r?.Code === 'ConditionalCheckFailed'));
    }
    return false;
}

/**
 * Runs a read-compute-write operation with one-shot retry on the
 * optimistic-concurrency guard. See `transactWriteEvaluation` for the full
 * race scenario this exists to fix.
 *
 * ## Retry policy: exactly one retry, then throw
 *
 * On a `ConditionalCheckFailed` outcome another writer committed between our
 * read and our write, and the whole operation needs to be re-run against the
 * fresh state — there is no way to "merge" locally because the compute
 * depends on the prior state that just changed underneath us.
 *
 * We retry the operation exactly once. Reasons for the fixed-bound retry
 * rather than a loop:
 *   - Single contender: one retry almost always succeeds because two-way
 *     races are rare and three-way races rarer still.
 *   - Many contenders (alarm storm): retrying in a loop amplifies contention
 *     and slows recovery when the system is already stressed. Better to fail
 *     the invocation, let it land in the DLQ, and surface the storm loudly.
 *   - Circuit-breaker decisions are event-driven. If we lose a race the very
 *     next alarm event (often within seconds) will re-observe the world and
 *     produce the correct posture anyway, so brief eventual correctness is
 *     safe even without retry.
 */
async function withOptimisticRetry<T>(op: () => Promise<T>): Promise<T> {
    try {
        return await op();
    } catch (err) {
        if (!isConditionalCheckFailure(err)) throw err;
        // Fresh attempt. `op` does its own read — this MUST read again so the
        // compute is based on the post-race state, otherwise we would retry
        // with the same losing snapshot.
        return await op();
    }
}

// ---------------------------------------------------------------------------
// Signal parsing
// ---------------------------------------------------------------------------

/**
 * Parses a CloudWatch alarm name into the fields the state machine needs.
 *
 * Alarm-name convention, as emitted by template.yaml:
 *   - 3-part: `breaker:GLOBAL:<signal>`            e.g. breaker:GLOBAL:os-search-rejections
 *   - 4-part: `breaker:GLOBAL:<label>:<signal>`    e.g. breaker:GLOBAL:lobby-v2:api-p99
 *
 * The optional <label> segment is a human-readable identifier (usually a service
 * or API name) kept in the alarm name for CloudWatch console readability and
 * log/audit searches. It is intentionally ignored by the routing here.
 *
 * ## Why `service` is always forced to 'GLOBAL' (defensive collapse)
 *
 * Per-service routing — one breaker per service under `BREAKER#<service>` — was
 * removed as a deliberate design decision:
 *
 *   1. The scheduled recovery tick (`handleScheduledTick`) only reads the
 *      `BREAKER#GLOBAL` partition. Any alarm that wrote to a different partition
 *      would trip a breaker that could never be transitioned back to HALF_OPEN
 *      or CLOSED — it would be stuck OPEN forever.
 *   2. The consolidated model treats the lobby stack as a single circuit: any
 *      critical or compound signal anywhere in the stack sheds at the same gate.
 *      That matches how callers consume the breaker state (one read, one
 *      decision).
 *
 * Forcing `service = 'GLOBAL'` here — regardless of what the parsed alarm name
 * says — protects against template drift. A future typo like
 * `breaker:lobbyv2:api-p99` (missing the GLOBAL segment) still routes to
 * BREAKER#GLOBAL instead of silently creating a stuck orphan partition.
 *
 * Manual operator overrides against arbitrary partitions still exist via
 * `setBreakerStateManually` — that is the intentional escape hatch.
 */
function parseAlarmName(alarmName: string): { service: string; signal: string } {
    const parts = alarmName.split(':');
    // Signal is always the last `:`-separated segment. This correctly handles
    // both the 3-part GLOBAL-only shape (`breaker:GLOBAL:<signal>`) and the
    // 4-part labelled shape (`breaker:GLOBAL:<label>:<signal>`), because the
    // signal is the trailing segment in either case.
    const signal = parts.length >= 2 ? parts[parts.length - 1] : alarmName;
    return { service: 'GLOBAL', signal };
}

// ---------------------------------------------------------------------------
// Compound severity scoring
// ---------------------------------------------------------------------------

/**
 * Computes a compound severity score from the current signals snapshot.
 *
 * Policy:
 *  - Any CRITICAL active signal    -> score HIGH,        shouldOpen = true
 *  - 2+ WARNING active signals     -> score MEDIUM_HIGH, shouldOpen = true
 *  - 1 WARNING active signal       -> score LOW,         shouldOpen = false
 *  - No active signals             -> score NONE,        shouldOpen = false
 */
function computeSeverityScore(signals: Record<string, ActiveSignalEntry>): SeverityResult {
    const alarmSignals = Object.keys(signals);

    const criticalAlarms = alarmSignals.filter((s) => CRITICAL_SIGNALS.has(s));
    if (criticalAlarms.length > 0) {
        return {
            score: 'HIGH',
            shouldOpen: true,
            reason: `critical_signal:${criticalAlarms.join(',')}`,
        };
    }

    const warningAlarms = alarmSignals.filter((s) => WARNING_SIGNALS.has(s));
    if (warningAlarms.length >= 2) {
        return {
            score: 'MEDIUM_HIGH',
            shouldOpen: true,
            reason: `compound_warning:${warningAlarms.join(',')}`,
        };
    }

    if (warningAlarms.length === 1) {
        return {
            score: 'LOW',
            shouldOpen: false,
            reason: `single_warning:${warningAlarms[0]}`,
        };
    }

    return { score: 'NONE', shouldOpen: false, reason: 'all_signals_ok' };
}

// ---------------------------------------------------------------------------
// DynamoDB helpers
// ---------------------------------------------------------------------------

async function getBreakerAndSignalState(
    config: RuntimeConfig,
    service: string,
): Promise<{
    breaker: BreakerStateItem | undefined;
    signalState: SignalStateItem | undefined;
}> {
    const ddb = getDdbClient(config);
    const response = await ddb.send(
        new BatchGetCommand({
            RequestItems: {
                [config.tableName]: {
                    // ConsistentRead=true: the controller can be invoked in rapid
                    // succession for the same partition (two alarms flipping within
                    // the same second, or an alarm arriving immediately after a tick
                    // write). Eventually-consistent reads occasionally return the
                    // pre-write snapshot and cause the next decision to be based on
                    // stale state. Strong reads cost 2× the RCU; for 2 keys per
                    // invocation that is negligible and bought us correctness.
                    ConsistentRead: true,
                    Keys: [
                        { PK: pk(service), SK: CURR_STATE_SK },
                        { PK: pk(service), SK: SIGNAL_STATE_SK },
                    ],
                },
            },
        }),
    );

    const items = response.Responses?.[config.tableName] ?? [];
    let breaker: BreakerStateItem | undefined;
    let signalState: SignalStateItem | undefined;

    for (const item of items) {
        if (item['SK'] === CURR_STATE_SK) {
            breaker = item as BreakerStateItem;
        } else if (item['SK'] === SIGNAL_STATE_SK) {
            signalState = item as SignalStateItem;
        }
    }

    return { breaker, signalState };
}

async function getCurrentState(service: string, config: RuntimeConfig): Promise<BreakerStateItem | undefined> {
    const ddb = getDdbClient(config);
    const out = await ddb.send(
        new GetCommand({
            TableName: config.tableName,
            Key: { PK: pk(service), SK: CURR_STATE_SK },
        }),
    );
    return out.Item as BreakerStateItem | undefined;
}

type DdbTransactItem = {
    Put: {
        TableName: string;
        Item: Record<string, unknown>;
        ConditionExpression?: string;
        ExpressionAttributeNames?: Record<string, string>;
        ExpressionAttributeValues?: Record<string, unknown>;
    };
};

/**
 * Builds the optimistic-concurrency `ConditionExpression` for a breaker-state
 * `Put`. See the header comment on `transactWriteEvaluation` for the full
 * rationale. In short:
 *
 *   - prevVersion === undefined (we didn't see a prior STATE#CURRENT during
 *     the read): require that no STATE#CURRENT exists yet. This stops two
 *     simultaneous first-writes from both "winning" and stomping each other.
 *   - prevVersion is a number (we did see a prior STATE#CURRENT): require
 *     that the stored `version` still matches that number. If any other
 *     writer has committed since our read the version will have been bumped,
 *     our condition fails, and DynamoDB rejects the whole transaction so the
 *     caller can retry against the fresh state.
 */
function breakerStateCondition(prevVersion: number | undefined): {
    ConditionExpression: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, unknown>;
} {
    if (prevVersion === undefined) {
        return { ConditionExpression: 'attribute_not_exists(PK)' };
    }
    return {
        ConditionExpression: '#v = :prevVersion',
        ExpressionAttributeNames: { '#v': 'version' },
        ExpressionAttributeValues: { ':prevVersion': prevVersion },
    };
}

/**
 * Transactionally writes all items for an alarm-driven evaluation:
 *  1. Updated SIGNAL_STATE#CURRENT
 *  2. Updated STATE#CURRENT      (optimistic-concurrency guarded)
 *  3. Historical STATE#<ts> copy
 *  4. Optional EVENT audit entry
 *
 * ## Why we guard STATE#CURRENT with `ConditionExpression`
 *
 * Under the consolidated GLOBAL-only design every alarm (and the scheduled
 * tick) writes to the same `BREAKER#GLOBAL` partition. When two alarm
 * transitions arrive within a narrow window (an incident often flips several
 * metrics at once, and EventBridge will deliver them in parallel) the
 * handler does a read, a local compute, and a write. Without a guard:
 *
 *   T0  Writer A:  BatchGet → signals={},  version=5
 *   T0  Writer B:  BatchGet → signals={},  version=5   (same snapshot)
 *   T1  Writer A:  TransactWrite → signals={A}, version=6
 *   T2  Writer B:  TransactWrite → signals={B}, version=6   ← overwrites A
 *
 * Writer A's signal quietly disappears from the map even though both writes
 * "succeeded". That loses the compound-warning signal and under-trips the
 * breaker on real incidents.
 *
 * The condition guards against this. Writer B's TransactWrite fails with
 * ConditionalCheckFailed (because A already bumped the version to 6), the
 * whole transaction rolls back including its intended SIGNAL_STATE write,
 * and the caller (`handleAlarmEvent` via `withOptimisticRetry`) re-runs the
 * full read-compute-write against the fresh state — where it will see
 * signals={A} and correctly merge in its own signal to produce {A, B}.
 *
 * We only guard STATE#CURRENT (not SIGNAL_STATE#CURRENT) because DynamoDB
 * transactions are all-or-nothing: if the breaker-state Put's condition
 * fails the SIGNAL_STATE Put in the same transaction is also rolled back.
 * One guard is sufficient to protect both items.
 */
async function transactWriteEvaluation(
    opts: {
        signalState: SignalStateItem;
        breaker: BreakerStateItem;
        prevVersion: number | undefined;
        audit?: AlarmEventItem;
    },
    config: RuntimeConfig,
): Promise<void> {
    const ddb = getDdbClient(config);
    const items: DdbTransactItem[] = [
        {
            Put: {
                TableName: config.tableName,
                Item: opts.signalState as unknown as Record<string, unknown>,
            },
        },
        {
            Put: {
                TableName: config.tableName,
                Item: opts.breaker as unknown as Record<string, unknown>,
                ...breakerStateCondition(opts.prevVersion),
            },
        },
    ];

    const history: BreakerHistoryItem = {
        ...opts.breaker,
        SK: stateHistorySk(opts.breaker.updatedAt),
        entityType: EntityType.BREAKER_STATE_HISTORY,
        ttl: toEpochSeconds(new Date(opts.breaker.updatedAt)) + SETTINGS.stateHistoryTtlSec,
    };
    items.push({
        Put: {
            TableName: config.tableName,
            Item: history as unknown as Record<string, unknown>,
        },
    });

    if (opts.audit) {
        items.push({
            Put: {
                TableName: config.tableName,
                Item: opts.audit as unknown as Record<string, unknown>,
            },
        });
    }

    await ddb.send(new TransactWriteCommand({ TransactItems: items }));
}

/**
 * Writes a new breaker state + history entry atomically. Used by the
 * scheduled tick (no signal-window change) and by manual overrides.
 *
 * Same optimistic-concurrency guard as `transactWriteEvaluation` — the tick
 * and manual override both read STATE#CURRENT then write a transition, so
 * they are vulnerable to the same lost-update race against concurrent alarm
 * events. The condition on STATE#CURRENT causes the caller to retry when an
 * alarm handler commits between our read and our write.
 */
async function putStateAndHistory(
    current: BreakerStateItem,
    prevVersion: number | undefined,
    config: RuntimeConfig,
): Promise<void> {
    const ddb = getDdbClient(config);
    const history: BreakerHistoryItem = {
        ...current,
        SK: stateHistorySk(current.updatedAt),
        entityType: EntityType.BREAKER_STATE_HISTORY,
        ttl: toEpochSeconds(new Date(current.updatedAt)) + SETTINGS.stateHistoryTtlSec,
    };

    await ddb.send(
        new TransactWriteCommand({
            TransactItems: [
                {
                    Put: {
                        TableName: config.tableName,
                        Item: current as unknown as Record<string, unknown>,
                        ...breakerStateCondition(prevVersion),
                    },
                },
                {
                    Put: {
                        TableName: config.tableName,
                        Item: history as unknown as Record<string, unknown>,
                    },
                },
            ],
        }),
    );
}

// ---------------------------------------------------------------------------
// Alarm event handler
// ---------------------------------------------------------------------------
interface HandlerOutput {
    action: string;
    service: string;
}
/**
 * Processes a CloudWatch alarm state transition using compound severity scoring.
 *
 *  1. BatchGet: current breaker state + SIGNAL_STATE#CURRENT in one round-trip.
 *  2. Mutate the active-alarms map for the incoming alarm.
 *  3. Compute compound severity score across ALL currently active signals.
 *  4. Drive state-machine transitions from the aggregate score.
 *  5. Transactionally write: SIGNAL_STATE, STATE current, STATE history,
 *     EVENT audit.
 */
async function handleAlarmEvent(event: CloudWatchAlarmEvent, config: RuntimeConfig): Promise<HandlerOutput> {
    const alarmName = event.detail.alarmName;
    const previousAlarmState: AlarmState | 'UNKNOWN' = (event.detail.previousState?.value ?? 'UNKNOWN') as
        | AlarmState
        | 'UNKNOWN';
    const nextAlarmState: AlarmState | 'UNKNOWN' = (event.detail.state?.value ?? 'UNKNOWN') as AlarmState | 'UNKNOWN';
    const stateChangeTime = event.detail.state?.timestamp ?? event.time;
    const { service, signal } = parseAlarmName(alarmName);

    if (isExpired(stateChangeTime, config.staleEventMs)) {
        return { action: 'ignored_stale_event', service };
    }

    // 1. Read current breaker state + signal snapshot in one round-trip
    const { breaker: prev, signalState: prevSignalState } = await getBreakerAndSignalState(config, service);

    // 2. Update active-alarms snapshot for the incoming alarm, then prune any
    //    signals that have gone stale. Pruning protects against orphaned entries
    //    — e.g. a closing OK that was dropped by EventBridge or filtered as stale
    //    — that would otherwise keep the breaker perpetually OPEN because they
    //    would never leave the map under normal event-driven flow.
    const mergedSignals: Record<string, ActiveSignalEntry> = { ...(prevSignalState?.signals ?? {}) };

    if (nextAlarmState === 'ALARM') {
        mergedSignals[signal] = { updatedAt: stateChangeTime };
    } else {
        delete mergedSignals[signal];
    }

    const updatedSignals = pruneStaleSignals(mergedSignals, Date.now(), config.signalMaxAgeMs);

    // 3. Compound severity score across all active signals
    const severity = computeSeverityScore(updatedSignals);

    // 4. Determine next state from severity and current state
    const now = stateChangeTime;
    const transition = determineNextState(severity, prev, now, alarmName, previousAlarmState, nextAlarmState);

    const nextBreaker = buildStateItem({
        service,
        prev,
        state: transition.nextBreakerState,
        mode: transition.nextMode,
        updatedAt: now,
        reason: transition.reason,
        holdUntil: transition.holdUntil,
        openedByAlarm: transition.openedByAlarm,
        healthyProbeOverride: transition.healthyProbeOverride,
    });

    const updatedSignalState: SignalStateItem = {
        PK: pk(service),
        SK: SIGNAL_STATE_SK,
        entityType: EntityType.SIGNAL_STATE,
        service,
        signals: updatedSignals,
        updatedAt: now,
    };

    const audit: AlarmEventItem = {
        PK: pk(service),
        SK: eventSk(stateChangeTime, alarmName),
        entityType: EntityType.ALARM_EVENT,
        service,
        alarmName,
        previousState: previousAlarmState,
        currentState: nextAlarmState,
        stateChangeTime,
        rawEvent: event,
        ttl: toEpochSeconds(new Date(stateChangeTime)) + SETTINGS.eventHistoryTtlSec,
    };

    await transactWriteEvaluation(
        {
            signalState: updatedSignalState,
            breaker: nextBreaker,
            // Thread the version we read through to the write's
            // ConditionExpression. See transactWriteEvaluation for why.
            prevVersion: prev?.version,
            audit,
        },
        config,
    );

    return { action: transition.action, service };
}

// ---------------------------------------------------------------------------
// Scheduled tick handler
// ---------------------------------------------------------------------------

/*
Drives timeout-based transitions without requiring raw datapoint streams.

Transitions the tick can produce:
  - OPEN      + holdUntil expired                                 -> HALF_OPEN
  - HALF_OPEN + holdUntil expired + no active signals (pruned)    -> CLOSED
  - HALF_OPEN + holdUntil expired + signals still active (pruned) -> OPEN

CloudWatch alarm events are edge-triggered:
  - The Lambda does not continuously poll metrics. Without the tick, a breaker
    could stay OPEN forever because nothing would move it into probe mode.
  - The HALF_OPEN → CLOSED transition above closes the loop when OKs arrived
    while the breaker was still OPEN (a common real pattern given edge-
    triggered alarms): the signal was dropped from the map, so the probe
    window expires with an empty signals map and the tick closes the breaker.
  - Zombie signals (entries whose closing OK event was lost) are pruned by
    SIGNAL_MAX_AGE_MS before the "active signals?" check so they cannot keep
    the breaker perpetually OPEN.
 */
async function handleScheduledTick(
    event: ScheduledTickEvent,
    config: RuntimeConfig,
): Promise<{ action: string; transitioned: number }> {
    const service = 'GLOBAL';
    const currentTime = event.time && event.time !== '' ? event.time : nowIso();
    const currentTimeMs = new Date(currentTime).getTime();

    const { breaker: item, signalState } = await getBreakerAndSignalState(config, service);
    if (!item || item.state === 'CLOSED') {
        return { action: 'scheduled_recovery_tick', transitioned: 0 };
    }

    if (item.state === 'OPEN' && item.holdUntil && currentTimeMs >= new Date(item.holdUntil).getTime()) {
        const next = buildStateItem({
            service: item.service,
            prev: item,
            state: 'HALF_OPEN',
            mode: 'protect',
            updatedAt: currentTime,
            reason: 'cooldown_expired_probe',
            holdUntil: addMs(currentTime, SETTINGS.halfOpenMaxMs),
        });
        // Pass item.version as prevVersion so an alarm that commits between
        // our read and our write (e.g. the incident cleared via OK events)
        // causes this tick write to fail ConditionalCheck rather than
        // overwriting the fresher, alarm-driven state.
        await putStateAndHistory(next, item.version, config);
        return { action: 'scheduled_recovery_tick', transitioned: 1 };
    }

    if (item.state === 'HALF_OPEN' && item.holdUntil && currentTimeMs >= new Date(item.holdUntil).getTime()) {
        // Prune stale signal entries before deciding. Without this, an orphan
        // signal in the map (closing OK event never arrived) would re-open the
        // breaker forever every time the HALF_OPEN window expires.
        const prunedSignals = pruneStaleSignals(signalState?.signals ?? {}, currentTimeMs, config.signalMaxAgeMs);
        const hasActiveSignals = Object.keys(prunedSignals).length > 0;
        const next = buildStateItem({
            service: item.service,
            prev: item,
            state: hasActiveSignals ? 'OPEN' : 'CLOSED',
            mode: hasActiveSignals ? 'protect' : 'normal',
            updatedAt: currentTime,
            reason: hasActiveSignals ? 'half_open_timeout_reopen' : 'half_open_timeout_no_signals',
            holdUntil: hasActiveSignals ? addMs(currentTime, SETTINGS.openHoldMs) : undefined,
        });
        // Same optimistic-concurrency guard as the OPEN→HALF_OPEN branch above.
        await putStateAndHistory(next, item.version, config);
        return { action: 'scheduled_recovery_tick', transitioned: 1 };
    }

    return { action: 'scheduled_recovery_tick', transitioned: 0 };
}

// ---------------------------------------------------------------------------
// Manual override
// ---------------------------------------------------------------------------

/**
 * Optional helper for on-call or pipeline manual override.
 * Operators can force the circuit open or closed independently of alarm state.
 *
 * Wrapped in `withOptimisticRetry` for the same reason as the automatic
 * paths: another writer (operator, alarm handler, tick) might commit between
 * our read and our write. One retry is enough for the common case of a
 * single concurrent contender; if the override still loses the second race
 * we throw and the caller can decide whether to retry from the outside
 * after reconsidering the current posture.
 */
export async function setBreakerStateManually(input: {
    service: string;
    state: BreakerState;
    reason: string;
    actor: string;
    holdUntil?: string;
}): Promise<void> {
    const config = getRuntimeConfig();
    await withOptimisticRetry(async () => {
        const prev = await getCurrentState(input.service, config);
        const next = buildStateItem({
            service: input.service,
            prev,
            state: input.state,
            mode: input.state === 'CLOSED' ? 'normal' : 'protect',
            updatedAt: nowIso(),
            reason: `manual:${input.reason}`,
            holdUntil: input.holdUntil,
        });
        next.updatedBy = input.actor;
        // Pass the version we just read so the write's ConditionExpression
        // catches a racing writer. See `breakerStateCondition` for the two
        // condition shapes (`attribute_not_exists(PK)` when prev is undefined
        // vs. `version = :prevVersion` when prev exists).
        await putStateAndHistory(next, prev?.version, config);
    });
}

// ---------------------------------------------------------------------------
// Lambda entrypoint
// ---------------------------------------------------------------------------

/**
 * Lambda handler. Supported event sources:
 *  1) EventBridge -- CloudWatch Alarm State Change  (source: aws.cloudwatch)
 *  2) EventBridge Scheduler / rate rule tick        (source: aws.scheduler | aws.events)
 */
export const handler = async (event: CloudWatchAlarmEvent | ScheduledTickEvent): Promise<object> => {
    const config = getRuntimeConfig();

    // Each handler is wrapped in `withOptimisticRetry` so a losing race on the
    // BREAKER#GLOBAL partition's version guard re-runs the full read-compute-
    // write against the fresh state exactly once. See `withOptimisticRetry` for
    // why retry is bounded rather than looping.
    if (isCloudWatchAlarmEvent(event)) {
        return withOptimisticRetry(() => handleAlarmEvent(event, config));
    }

    if (isScheduledTickEvent(event)) {
        return withOptimisticRetry(() => handleScheduledTick(event, config));
    }

    return { action: 'ignored_unknown_event' };
};
