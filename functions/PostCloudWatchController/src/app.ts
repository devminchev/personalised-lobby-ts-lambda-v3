import { GetCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
    BatchGetCommand,
    BatchGetRequest,
    executeBatchGet,
    PutTransaction,
    executeTransactWrite,
} from 'dynamodb-toolbox';
import {
    ActiveSignalEntry,
    AlarmEventItem,
    AlarmState,
    BreakerHistoryItem,
    BreakerSettings,
    BreakerState,
    BreakerStateItem,
    CloudWatchAlarmEvent,
    ControllerAction,
    EntityType,
    RuntimeConfig,
    ScheduledTickEvent,
    SeverityResult,
    SignalStateItem,
} from './types';
import { CRITICAL_SIGNALS, WARNING_SIGNALS } from './config';
import { loadBreakerSettings } from './settings';
import { getDdbClient, getEntities } from 'dynamoClient';
import { LogCode, logMessage } from 'os-client';
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
    return {
        tableName: getRequiredEnv('CB_DDB_TABLE'),
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
        logMessage('warn', LogCode.ControllerOptimisticRetry);
        // Fresh attempt. `op` does its own read — this MUST read again so the
        // compute is based on the post-race state, otherwise we would retry
        // with the same losing snapshot.
        return await op();
    }
}

// ---------------------------------------------------------------------------
// Signal parsing
// ---------------------------------------------------------------------------

// Always routes to BREAKER#GLOBAL — see docs/resilience/circuit-breaker-overview.mdx (defensive collapse).
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

// See docs/resilience/circuit-breaker-alarms.mdx for scoring policy.
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
    ddb: DynamoDBDocumentClient,
    tableName: string,
    service: string,
): Promise<{
    breaker: BreakerStateItem | undefined;
    signalState: SignalStateItem | undefined;
}> {
    const { table, BreakerStateEntity, SignalStateEntity } = getEntities(ddb, tableName);

    const cmd = table
        .build(BatchGetCommand)
        .requests(
            BreakerStateEntity.build(BatchGetRequest).key({ PK: pk(service), SK: CURR_STATE_SK }),
            SignalStateEntity.build(BatchGetRequest).key({ PK: pk(service), SK: SIGNAL_STATE_SK }),
        )
        // ConsistentRead=true: the controller can be invoked in rapid succession for the
        // same partition (two alarms within the same second, or an alarm immediately after
        // a tick write). Eventually-consistent reads occasionally return the pre-write
        // snapshot. Strong reads cost 2× the RCU; for 2 keys per invocation that is
        // negligible and bought us correctness.
        .options({ consistent: true });

    const { Responses } = await executeBatchGet(cmd);
    const [cmdResponses] = Responses;

    return {
        breaker: cmdResponses?.[0] as BreakerStateItem | undefined,
        signalState: cmdResponses?.[1] as SignalStateItem | undefined,
    };
}

async function getCurrentState(
    ddb: DynamoDBDocumentClient,
    tableName: string,
    service: string,
): Promise<BreakerStateItem | undefined> {
    const out = await ddb.send(
        new GetCommand({
            TableName: tableName,
            Key: { PK: pk(service), SK: CURR_STATE_SK },
        }),
    );
    return out.Item as BreakerStateItem | undefined;
}

// See docs/resilience/consistency-and-concurrency.mdx for the optimistic-concurrency design.
async function transactWriteEvaluation(
    opts: {
        signalState: SignalStateItem;
        breaker: BreakerStateItem;
        prevVersion: number | undefined;
        audit?: AlarmEventItem;
    },
    ddb: DynamoDBDocumentClient,
    tableName: string,
    settings: BreakerSettings,
): Promise<void> {
    const { BreakerStateEntity, SignalStateEntity, BreakerHistoryEntity, AlarmEventEntity } = getEntities(
        ddb,
        tableName,
    );

    const breakerCondition =
        opts.prevVersion === undefined
            ? ({ attr: 'PK', exists: false } as const)
            : ({ attr: 'version', eq: opts.prevVersion } as const);

    const history: BreakerHistoryItem = {
        ...opts.breaker,
        SK: stateHistorySk(opts.breaker.updatedAt),
        entityType: EntityType.BREAKER_STATE_HISTORY,
        ttl: toEpochSeconds(new Date(opts.breaker.updatedAt)) + settings.stateHistoryTtlSec,
    };

    const txItems = [
        SignalStateEntity.build(PutTransaction).item(opts.signalState),
        BreakerStateEntity.build(PutTransaction).item(opts.breaker).options({ condition: breakerCondition }),
        BreakerHistoryEntity.build(PutTransaction).item(history),
        ...(opts.audit ? [AlarmEventEntity.build(PutTransaction).item(opts.audit)] : []),
    ];

    await executeTransactWrite(...txItems);
}

async function putStateAndHistory(
    current: BreakerStateItem,
    prevVersion: number | undefined,
    ddb: DynamoDBDocumentClient,
    tableName: string,
    settings: BreakerSettings,
    signalState?: SignalStateItem,
): Promise<void> {
    const { BreakerStateEntity, BreakerHistoryEntity, SignalStateEntity } = getEntities(ddb, tableName);

    const breakerCondition =
        prevVersion === undefined
            ? ({ attr: 'PK', exists: false } as const)
            : ({ attr: 'version', eq: prevVersion } as const);

    const history: BreakerHistoryItem = {
        ...current,
        SK: stateHistorySk(current.updatedAt),
        entityType: EntityType.BREAKER_STATE_HISTORY,
        ttl: toEpochSeconds(new Date(current.updatedAt)) + settings.stateHistoryTtlSec,
    };

    const txItems = [
        BreakerStateEntity.build(PutTransaction).item(current).options({ condition: breakerCondition }),
        BreakerHistoryEntity.build(PutTransaction).item(history),
        ...(signalState ? [SignalStateEntity.build(PutTransaction).item(signalState)] : []),
    ];

    await executeTransactWrite(...txItems);
}

// ---------------------------------------------------------------------------
// Alarm event handler
// ---------------------------------------------------------------------------
interface HandlerOutput {
    action: ControllerAction;
    service: string;
}
async function handleAlarmEvent(
    event: CloudWatchAlarmEvent,
    ddb: DynamoDBDocumentClient,
    config: RuntimeConfig,
    settings: BreakerSettings,
): Promise<HandlerOutput> {
    const alarmName = event.detail.alarmName;
    const previousAlarmState: AlarmState | 'UNKNOWN' = (event.detail.previousState?.value ?? 'UNKNOWN') as
        | AlarmState
        | 'UNKNOWN';
    const nextAlarmState: AlarmState | 'UNKNOWN' = (event.detail.state?.value ?? 'UNKNOWN') as AlarmState | 'UNKNOWN';
    const stateChangeTime = event.detail.state?.timestamp ?? event.time;
    const { service, signal } = parseAlarmName(alarmName);

    logMessage(
        'log',
        LogCode.ControllerAlarmReceived,
        undefined,
        `alarmName=${alarmName} signal=${signal} ${previousAlarmState}→${nextAlarmState}`,
    );

    if (isExpired(stateChangeTime, settings.staleEventMs)) {
        logMessage(
            'warn',
            LogCode.ControllerAlarmStale,
            undefined,
            `alarmName=${alarmName} stateChangeTime=${stateChangeTime}`,
        );
        return { action: ControllerAction.IgnoredStaleEvent, service };
    }

    // 1. Read current breaker state + signal snapshot in one round-trip
    const { breaker: prev, signalState: prevSignalState } = await getBreakerAndSignalState(
        ddb,
        config.tableName,
        service,
    );

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

    const updatedSignals = pruneStaleSignals(mergedSignals, Date.now(), settings.signalMaxAgeMs);

    // 3. Compound severity score across all active signals
    const severity = computeSeverityScore(updatedSignals);

    // 4. Determine next state from severity and current state
    const now = stateChangeTime;
    const transition = determineNextState(severity, prev, now, alarmName, previousAlarmState, nextAlarmState, settings);

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
        ttl: toEpochSeconds(new Date(stateChangeTime)) + settings.eventHistoryTtlSec,
    };

    await transactWriteEvaluation(
        {
            signalState: updatedSignalState,
            breaker: nextBreaker,
            prevVersion: prev?.version,
            audit,
        },
        ddb,
        config.tableName,
        settings,
    );

    logMessage(
        'log',
        LogCode.ControllerAlarmTransition,
        undefined,
        `service=${service} ${prev?.state ?? 'NEW'}→${nextBreaker.state} reason=${transition.reason} action=${transition.action}`,
    );

    return { action: transition.action, service };
}

// ---------------------------------------------------------------------------
// Scheduled tick handler
// ---------------------------------------------------------------------------

async function handleScheduledTick(
    event: ScheduledTickEvent,
    ddb: DynamoDBDocumentClient,
    config: RuntimeConfig,
    settings: BreakerSettings,
): Promise<{ action: ControllerAction; transitioned: number }> {
    const service = 'GLOBAL';
    const currentTime = event.time && event.time !== '' ? event.time : nowIso();
    const currentTimeMs = new Date(currentTime).getTime();

    const { breaker: item, signalState } = await getBreakerAndSignalState(ddb, config.tableName, service);
    if (!item || item.state === 'CLOSED') {
        logMessage('log', LogCode.ControllerTickNoOp, undefined, `service=${service} state=${item?.state ?? 'NONE'}`);
        return { action: ControllerAction.TickNoOp, transitioned: 0 };
    }

    if (item.state === 'OPEN' && item.holdUntil && currentTimeMs >= new Date(item.holdUntil).getTime()) {
        const next = buildStateItem({
            service: item.service,
            prev: item,
            state: 'HALF_OPEN',
            mode: 'protect',
            updatedAt: currentTime,
            reason: ControllerAction.CooldownExpiredProbe,
            holdUntil: addMs(currentTime, settings.halfOpenMaxMs),
        });
        await putStateAndHistory(next, item.version, ddb, config.tableName, settings);
        logMessage(
            'log',
            LogCode.ControllerTickTransition,
            undefined,
            `service=${service} OPEN→HALF_OPEN reason=${ControllerAction.CooldownExpiredProbe}`,
        );
        return { action: ControllerAction.CooldownExpiredProbe, transitioned: 1 };
    }

    if (item.state === 'HALF_OPEN' && item.holdUntil && currentTimeMs >= new Date(item.holdUntil).getTime()) {
        const prunedSignals = pruneStaleSignals(signalState?.signals ?? {}, currentTimeMs, settings.signalMaxAgeMs);
        const hasActiveSignals = Object.keys(prunedSignals).length > 0;
        const next = buildStateItem({
            service: item.service,
            prev: item,
            state: hasActiveSignals ? 'OPEN' : 'CLOSED',
            mode: hasActiveSignals ? 'protect' : 'normal',
            updatedAt: currentTime,
            reason: ControllerAction.HalfOpenTimeout,
            holdUntil: hasActiveSignals ? addMs(currentTime, settings.openHoldMs) : undefined,
        });
        const updatedSignalState: SignalStateItem = {
            PK: pk(service),
            SK: SIGNAL_STATE_SK,
            entityType: EntityType.SIGNAL_STATE,
            service,
            signals: prunedSignals,
            updatedAt: currentTime,
        };
        await putStateAndHistory(next, item.version, ddb, config.tableName, settings, updatedSignalState);
        logMessage(
            'log',
            LogCode.ControllerTickTransition,
            undefined,
            `service=${service} HALF_OPEN→${next.state} reason=${ControllerAction.HalfOpenTimeout} activeSignals=${Object.keys(prunedSignals).length}`,
        );
        return { action: ControllerAction.HalfOpenTimeout, transitioned: 1 };
    }

    logMessage(
        'log',
        LogCode.ControllerTickNoOp,
        undefined,
        `service=${service} state=${item.state} holdUntil not expired`,
    );
    return { action: ControllerAction.TickNoOp, transitioned: 0 };
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
    const settings = await loadBreakerSettings();
    const config = getRuntimeConfig();
    const ddb = getDdbClient(config);
    await withOptimisticRetry(async () => {
        const prev = await getCurrentState(ddb, config.tableName, input.service);
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
        await putStateAndHistory(next, prev?.version, ddb, config.tableName, settings);
        logMessage(
            'warn',
            LogCode.ControllerManualOverride,
            undefined,
            `service=${input.service} state=${input.state} actor=${input.actor} reason=${input.reason}`,
        );
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
export const lambdaHandler = async (event: CloudWatchAlarmEvent | ScheduledTickEvent): Promise<object> => {
    // Resolve settings BEFORE the unknown-event short-circuit so a misconfigured
    // SSM prefix or a missing parameter surfaces loudly even on event types we
    // don't act on. A silent "ignored_unknown_event" with broken config would
    // mask the real problem until the next real alarm event.
    const settings = await loadBreakerSettings();
    const config = getRuntimeConfig();
    const ddb = getDdbClient(config);

    // Each handler is wrapped in `withOptimisticRetry` so a losing race on the
    // BREAKER#GLOBAL partition's version guard re-runs the full read-compute-
    // write against the fresh state exactly once. See `withOptimisticRetry` for
    // why retry is bounded rather than looping.
    if (isCloudWatchAlarmEvent(event)) {
        return withOptimisticRetry(() => handleAlarmEvent(event, ddb, config, settings));
    }

    if (isScheduledTickEvent(event)) {
        return withOptimisticRetry(() => handleScheduledTick(event, ddb, config, settings));
    }

    return { action: ControllerAction.IgnoredUnknownEvent };
};
