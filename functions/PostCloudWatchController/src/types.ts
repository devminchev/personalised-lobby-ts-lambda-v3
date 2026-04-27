// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export enum EntityType {
    BREAKER_STATE = 'BREAKER_STATE',
    BREAKER_STATE_HISTORY = 'BREAKER_STATE_HISTORY',
    SIGNAL_STATE = 'SIGNAL_STATE',
    ALARM_EVENT = 'ALARM_EVENT',
}

export type BreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export type BreakerMode = 'normal' | 'protect';
export type AlarmState = 'ALARM' | 'OK' | 'INSUFFICIENT_DATA';

export interface AlarmConfig {
    periodSec?: number;
    evaluationPeriods?: number;
    datapointsToAlarm?: number;
}

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
    alarmConfig?: AlarmConfig;
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
    detail?: { service?: string };
}

export interface BreakerSettings {
    openHoldMs: number;
    halfOpenMaxMs: number;
    healthyOkEventsToClose: number;
    eventHistoryTtlSec: number;
    stateHistoryTtlSec: number;
    staleEventMs: number;
}

/** Compound severity scoring result. */
export interface SeverityResult {
    score: 'HIGH' | 'MEDIUM_HIGH' | 'LOW' | 'NONE';
    shouldOpen: boolean;
    reason: string;
}

export interface RuntimeConfig {
    tableName: string;
    staleEventMs: number;
    /**
     * Signals in SIGNAL_STATE#CURRENT that haven't been refreshed within this
     * window are pruned on the next evaluation. Defaults to 2× staleEventMs —
     * i.e. if events older than X ms are dropped, signals unseen for 2X ms are
     * assumed stale. Set to 0 to disable pruning (primarily for tests).
     */
    signalMaxAgeMs: number;
    awsRegion?: string;
    /**
     * DynamoDB endpoint override. Leave unset for real AWS; set to something
     * like `http://localhost:8000` for local testing with DynamoDB Local.
     * Reads from the `DDB_ENDPOINT` env var (see getRuntimeConfig).
     */
    ddbEndpoint?: string;
}
