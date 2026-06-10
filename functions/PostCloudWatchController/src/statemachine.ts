import { addMs, CURR_STATE_SK, pk } from './helpers';
import {
    AlarmState,
    BreakerMode,
    BreakerSettings,
    BreakerState,
    BreakerStateItem,
    ControllerAction,
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
    action: ControllerAction;
    healthyProbeOverride: number | undefined;
}

// See docs/resilience/circuit-breaker-stale-prev-guard.mdx
function resolveEffectivePrev(prev: BreakerStateItem | undefined, now: string): BreakerStateItem | undefined {
    if (prev?.holdUntil && prev.holdUntil < now) return undefined;
    return prev;
}

function buildOpenTransition(input: {
    now: string;
    severityReason: string;
    alarmName: string;
    previousAlarmState: AlarmState | 'UNKNOWN';
    nextAlarmState: AlarmState | 'UNKNOWN';
    action: ControllerAction;
    settings: BreakerSettings;
}): StateTransitionResult {
    return {
        nextBreakerState: 'OPEN',
        nextMode: 'protect',
        holdUntil: addMs(input.now, input.settings.openHoldMs),
        reason: `${input.action}:${input.severityReason}`,
        openedByAlarm: {
            alarmName: input.alarmName,
            fromState: input.previousAlarmState,
            toState: input.nextAlarmState,
        },
        action: input.action,
        healthyProbeOverride: undefined,
    };
}

function buildHalfOpenProgressTransition(
    prev: BreakerStateItem,
    alarmName: string,
    settings: BreakerSettings,
): StateTransitionResult {
    const probeCount = (prev.healthyProbeCount ?? 0) + 1;
    const closeNow = probeCount >= settings.healthyOkEventsToClose;

    return {
        nextBreakerState: closeNow ? 'CLOSED' : 'HALF_OPEN',
        nextMode: closeNow ? 'normal' : 'protect',
        holdUntil: closeNow ? undefined : prev.holdUntil,
        reason: closeNow
            ? `${ControllerAction.Closed}:${alarmName}`
            : `${ControllerAction.HalfOpenProgress}:${alarmName}`,
        action: closeNow ? ControllerAction.Closed : ControllerAction.HalfOpenProgress,
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
    };
}

export const determineNextState = (
    severity: SeverityResult,
    prev: BreakerStateItem | undefined,
    now: string,
    alarmName: string,
    previousAlarmState: AlarmState | 'UNKNOWN',
    nextAlarmState: AlarmState | 'UNKNOWN',
    settings: BreakerSettings,
): StateTransitionResult => {
    const ep = resolveEffectivePrev(prev, now);

    if (severity.shouldOpen) {
        const action = ep?.state === 'OPEN' ? ControllerAction.OpenSustained : ControllerAction.Opened;
        return buildOpenTransition({
            now,
            severityReason: severity.reason,
            alarmName,
            previousAlarmState,
            nextAlarmState,
            action,
            settings,
        });
    }

    if (ep?.state === 'HALF_OPEN' && nextAlarmState === 'ALARM') {
        return buildOpenTransition({
            now,
            severityReason: severity.reason,
            alarmName,
            previousAlarmState,
            nextAlarmState,
            action: ControllerAction.HalfOpenRetried,
            settings,
        });
    }

    if (ep?.state === 'HALF_OPEN') {
        return buildHalfOpenProgressTransition(ep, alarmName, settings);
    }

    if (ep?.state === 'OPEN') {
        return {
            nextBreakerState: 'OPEN',
            nextMode: 'protect',
            holdUntil: ep.holdUntil,
            reason: `${ControllerAction.OpenPartialClear}:${severity.reason}`,
            action: ControllerAction.OpenPartialClear,
            openedByAlarm: undefined,
            healthyProbeOverride: undefined,
        };
    }

    const action = ep ? ControllerAction.ClosedNoChange : ControllerAction.InitializedClosed;
    return {
        nextBreakerState: 'CLOSED',
        nextMode: 'normal',
        holdUntil: undefined,
        reason: `${action}:${severity.reason}`,
        action,
        openedByAlarm: undefined,
        healthyProbeOverride: undefined,
    };
};
