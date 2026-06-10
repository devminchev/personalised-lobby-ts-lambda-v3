// ---------------------------------------------------------------------------
// Key helpers
// ---------------------------------------------------------------------------

import { ActiveSignalEntry } from './types';

export function pk(service: string): string {
    return `BREAKER#${service}`;
}

// PK = BREAKER#<service>, SK = STATE#CURRENT — the live breaker posture.
export const CURR_STATE_SK = 'STATE#CURRENT';

// PK = BREAKER#<service>, SK = SIGNAL_STATE#CURRENT — map of currently-active
// alarm signals feeding the compound-severity score.
export const SIGNAL_STATE_SK = 'SIGNAL_STATE#CURRENT';

export function stateHistorySk(ts: string): string {
    return `STATE#${ts}`;
}

export function eventSk(ts: string, alarmName: string): string {
    return `EVENT#${ts}#${alarmName}`;
}

export function nowIso(): string {
    return new Date().toISOString();
}

export function toEpochSeconds(date: Date): number {
    return Math.floor(date.getTime() / 1000);
}

export function addMs(iso: string, ms: number): string {
    return new Date(new Date(iso).getTime() + ms).toISOString();
}

/**
 * Removes signal entries that have not been refreshed within `maxAgeMs`.
 *
 * CloudWatch alarm state changes are edge-triggered and delivered via EventBridge.
 * In rare failure modes a closing OK event can be lost (EventBridge drop, Lambda
 * DLQ'd, stale-event guard, signal renamed in the template without cleanup, etc).
 * Without pruning, that signal sits in the map forever and keeps the breaker
 * stuck OPEN on every tick because `Object.keys(signals).length > 0` stays true.
 *
 * Pruning is off when `maxAgeMs <= 0` (used by tests that disable the stale-event
 * guard entirely — we don't want those tests to randomly drop their seeded data).
 *
 * Returns a new map; does not mutate the input.
 */
export function pruneStaleSignals(
    signals: Record<string, ActiveSignalEntry>,
    nowMs: number,
    maxAgeMs: number,
): Record<string, ActiveSignalEntry> {
    if (maxAgeMs <= 0) {
        return { ...signals };
    }
    const out: Record<string, ActiveSignalEntry> = {};
    for (const [name, entry] of Object.entries(signals)) {
        if (nowMs - new Date(entry.updatedAt).getTime() <= maxAgeMs) {
            out[name] = entry;
        }
    }
    return out;
}
