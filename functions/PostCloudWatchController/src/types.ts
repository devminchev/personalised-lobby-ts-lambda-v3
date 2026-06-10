export enum EntityType {
    BREAKER_STATE = 'BREAKER_STATE',
    BREAKER_STATE_HISTORY = 'BREAKER_STATE_HISTORY',
    SIGNAL_STATE = 'SIGNAL_STATE',
    ALARM_EVENT = 'ALARM_EVENT',
}

/** All discrete outcomes the controller can report as an `action` field. */
export enum ControllerAction {
    // state-machine transitions (alarm event path)
    // CLOSED/unknown → OPEN, fresh trip
    Opened = 'opened',
    // OPEN → OPEN, alarm re-fired while already open
    OpenSustained = 'open_sustained',
    // OPEN → OPEN, one signal cleared but others remain
    OpenPartialClear = 'open_partial_clear',
    // HALF_OPEN → OPEN, alarm fired during probe window
    HalfOpenRetried = 'half_open_retripped',
    // HALF_OPEN → HALF_OPEN, probe count incremented
    HalfOpenProgress = 'half_open_progress',
    // HALF_OPEN → CLOSED, probe count threshold reached
    Closed = 'closed',
    // CLOSED → CLOSED, alarm cleared with no state change
    ClosedNoChange = 'closed_no_change',
    // no prior state → CLOSED written for the first time
    InitializedClosed = 'initialized_closed',
    // handler-level outcomes
    // alarm event timestamp too old, discarded
    IgnoredStaleEvent = 'ignored_stale_event',
    // unrecognised event source, discarded
    IgnoredUnknownEvent = 'ignored_unknown_event',
    // scheduled-tick outcomes
    // tick fired, no transition needed
    TickNoOp = 'scheduled_recovery_tick',
    // OPEN → HALF_OPEN, hold window elapsed
    CooldownExpiredProbe = 'cooldown_expired_probe',
    // HALF_OPEN window elapsed → OPEN (signals active) or CLOSED (no signals)
    HalfOpenTimeout = 'half_open_timeout',
}

export type BreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export type BreakerMode = 'normal' | 'protect';
export type AlarmState = 'ALARM' | 'OK' | 'INSUFFICIENT_DATA';

export interface OpenedByAlarm {
    alarmName: string;
    fromState: AlarmState | 'UNKNOWN';
    toState: AlarmState | 'UNKNOWN';
}

/** One entry in the per-service active-alarms snapshot. */
export interface ActiveSignalEntry {
    updatedAt: string;
}

/** PK = BREAKER#<service>, SK = STATE#CURRENT */
export interface BreakerStateItem {
    PK: string;
    SK: string;
    entityType: EntityType.BREAKER_STATE;
    service: string;
    state: BreakerState;
    mode: BreakerMode;
    updatedAt: string;
    updatedBy: string;
    reason: string;
    holdUntil?: string;
    version: number;
    tripCount: number;
    healthyProbeCount: number;
    openedByAlarm?: OpenedByAlarm;
}

export interface BreakerHistoryItem extends Omit<BreakerStateItem, 'SK' | 'entityType'> {
    SK: string;
    entityType: EntityType.BREAKER_STATE_HISTORY;
    ttl?: number;
}

/** PK = BREAKER#<service>, SK = SIGNAL_STATE#CURRENT */
export interface SignalStateItem {
    PK: string;
    SK: 'SIGNAL_STATE#CURRENT';
    entityType: EntityType.SIGNAL_STATE;
    service: string;
    signals: Record<string, ActiveSignalEntry>;
    updatedAt: string;
}

/** PK = BREAKER#<service>, SK = EVENT#<isoTs>#<alarmName> -- audit record. */
export interface AlarmEventItem {
    PK: string;
    SK: string;
    entityType: EntityType.ALARM_EVENT;
    service: string;
    alarmName: string;
    previousState: string;
    currentState: string;
    stateChangeTime: string;
    reason?: string;
    rawEvent: unknown;
    ttl?: number;
}

/** EventBridge CloudWatch Alarm State Change event shape. */
export interface CloudWatchAlarmEvent {
    source: string;
    'detail-type': string;
    time: string;
    detail: {
        alarmName: string;
        previousState?: { value?: string; reason?: string; timestamp?: string };
        state?: { value?: string; reason?: string; timestamp?: string };
        configuration?: { metrics?: Array<unknown> };
    };
    resources?: string[];
}

/** EventBridge Scheduler / rate rule tick event. */
export interface ScheduledTickEvent {
    source: string;
    'detail-type': string;
    time: string;
    detail?: Record<string, unknown>;
}

export interface BreakerSettings {
    openHoldMs: number;
    halfOpenMaxMs: number;
    healthyOkEventsToClose: number;
    eventHistoryTtlSec: number;
    stateHistoryTtlSec: number;
    staleEventMs: number;
    /**
     * Signals in SIGNAL_STATE#CURRENT that haven't been refreshed within this
     * window are pruned on the next evaluation. Defaults to 2× staleEventMs —
     * i.e. if events older than X ms are dropped, signals unseen for 2X ms are
     * assumed stale. Set to 0 (via SIGNAL_MAX_AGE_MS env override) to disable
     * pruning, primarily for tests that disable the freshness guard.
     *
     * Derived inside loadBreakerSettings rather than fetched from SSM: it is
     * a function of staleEventMs and is not independently tunable in
     * production. Override is supported via the SIGNAL_MAX_AGE_MS env var
     * only (no SSM key) — pruning is more of a runtime invariant than a
     * breaker tuning knob.
     */
    signalMaxAgeMs: number;
}

/** Compound severity scoring result. */
export interface SeverityResult {
    score: 'HIGH' | 'MEDIUM_HIGH' | 'LOW' | 'NONE';
    shouldOpen: boolean;
    reason: string;
}

export interface RuntimeConfig {
    tableName: string;
    awsRegion?: string;
    /**
     * DynamoDB endpoint override. Leave unset for real AWS; set to something
     * like `http://localhost:8000` for local testing with DynamoDB Local.
     * Reads from the `DDB_ENDPOINT` env var (see getRuntimeConfig).
     */
    ddbEndpoint?: string;
}
