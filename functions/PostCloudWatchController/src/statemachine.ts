// ---------------------------------------------------------------------------
// State machine decision logic
// ---------------------------------------------------------------------------

import { SETTINGS } from './config';
import { addMs, CURR_STATE_SK, pk } from './helpers';
import {
    AlarmConfig,
    AlarmState,
    BreakerMode,
    BreakerState,
    BreakerStateItem,
    EntityType,
    OpenedByAlarm,
    SeverityResult,
} from './types';

interface StateTransitionResult {
    nextBreakerState: BreakerState;
    nextMode: BreakerMode;
    reason: string;
    holdUntil: string | undefined;
    openedByAlarm: OpenedByAlarm | undefined;
    action: string;
    healthyProbeOverride: number | undefined;
}

function buildOpenTransition(input: {
    prev: BreakerStateItem | undefined;
    now: string;
    reason: string;
    alarmName: string;
    previousAlarmState: AlarmState | 'UNKNOWN';
    nextAlarmState: AlarmState | 'UNKNOWN';
    action: string;
}): StateTransitionResult {
    return {
        nextBreakerState: 'OPEN',
        nextMode: 'protect',
        holdUntil: input.prev?.state === 'OPEN' ? input.prev.holdUntil : addMs(input.now, SETTINGS.openHoldMs),
        reason: input.reason,
        openedByAlarm: {
            alarmName: input.alarmName,
            fromState: input.previousAlarmState,
            toState: input.nextAlarmState,
        },
        action: input.action,
        healthyProbeOverride: undefined,
    };
}

function buildHalfOpenProgressTransition(prev: BreakerStateItem, alarmName: string): StateTransitionResult {
    const probeCount = (prev.healthyProbeCount ?? 0) + 1;
    const closeNow = probeCount >= SETTINGS.healthyOkEventsToClose;

    return {
        nextBreakerState: closeNow ? 'CLOSED' : 'HALF_OPEN',
        nextMode: closeNow ? 'normal' : 'protect',
        holdUntil: closeNow ? undefined : prev.holdUntil,
        reason: closeNow ? `recovered:${alarmName}` : `half_open_progress:${alarmName}`,
        action: closeNow ? 'closed' : 'half_open_progress',
        openedByAlarm: undefined,
        healthyProbeOverride: closeNow ? 0 : probeCount,
    };
}

export function buildStateItem(input: {
    service: string;
    prev?: BreakerStateItem;
    state: BreakerState;
    mode: BreakerMode;
    updatedAt: string;
    reason: string;
    holdUntil?: string;
    openedByAlarm?: OpenedByAlarm;
    alarmConfig?: AlarmConfig;
    healthyProbeOverride?: number;
}): BreakerStateItem {
    const isNewTrip = input.state === 'OPEN' && input.prev?.state !== 'OPEN';

    return {
        PK: pk(input.service),
        SK: CURR_STATE_SK,
        entityType: EntityType.BREAKER_STATE,
        service: input.service,
        state: input.state,
        mode: input.mode,
        updatedAt: input.updatedAt,
        updatedBy: 'controller',
        reason: input.reason,
        holdUntil: input.holdUntil,
        version: (input.prev?.version ?? 0) + 1,
        tripCount: (input.prev?.tripCount ?? 0) + (isNewTrip ? 1 : 0),
        healthyProbeCount:
            input.healthyProbeOverride ??
            (input.state === 'CLOSED' || input.state === 'OPEN' ? 0 : (input.prev?.healthyProbeCount ?? 0)),
        openedByAlarm:
            input.state === 'OPEN' || input.state === 'HALF_OPEN'
                ? (input.openedByAlarm ?? input.prev?.openedByAlarm)
                : undefined,
        alarmConfig: input.alarmConfig ?? input.prev?.alarmConfig,
    };
}

/**
 * Determines the next breaker state based on current state and severity score.
 */
export const determineNextState = (
    severity: SeverityResult,
    prev: BreakerStateItem | undefined,
    now: string,
    alarmName: string,
    previousAlarmState: AlarmState | 'UNKNOWN',
    nextAlarmState: AlarmState | 'UNKNOWN',
): StateTransitionResult => {
    if (severity.shouldOpen) {
        return buildOpenTransition({
            prev,
            now,
            reason: `compound_open:${severity.reason}`,
            alarmName,
            previousAlarmState,
            nextAlarmState,
            action: prev?.state === 'OPEN' ? 'open_sustained' : 'opened',
        });
    }

    if (prev?.state === 'HALF_OPEN' && nextAlarmState === 'ALARM') {
        return buildOpenTransition({
            prev: undefined,
            now,
            reason: `half_open_retrip:${severity.reason}`,
            alarmName,
            previousAlarmState,
            nextAlarmState,
            action: 'half_open_retripped',
        });
    }

    if (prev?.state === 'HALF_OPEN') {
        return buildHalfOpenProgressTransition(prev, alarmName);
    }

    if (prev?.state === 'OPEN') {
        return {
            nextBreakerState: 'OPEN',
            nextMode: 'protect',
            holdUntil: prev.holdUntil,
            reason: `open_partial_clear:${severity.reason}`,
            action: 'open_partial_clear',
            openedByAlarm: undefined,
            healthyProbeOverride: undefined,
        };
    }

    return {
        nextBreakerState: 'CLOSED',
        nextMode: 'normal',
        holdUntil: undefined,
        reason: `all_clear:${severity.reason}`,
        action: prev ? 'closed_no_change' : 'initialized_closed',
        openedByAlarm: undefined,
        healthyProbeOverride: undefined,
    };
};
