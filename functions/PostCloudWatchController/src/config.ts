import { BreakerSettings } from './types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const SETTINGS: BreakerSettings = {
    openHoldMs: 60_000,
    halfOpenMaxMs: 120_000,
    healthyOkEventsToClose: 1,
    eventHistoryTtlSec: 14 * 24 * 60 * 60,
    stateHistoryTtlSec: 30 * 24 * 60 * 60,
    staleEventMs: 10 * 60_000, // 10 minutes
};

/**
 * Signals that individually trigger OPEN.
 * They map to the signal suffix of the alarm name: breaker:<service>:<signal>
 */
export const CRITICAL_SIGNALS = new Set(['os-search-rejections', 'os-write-rejections']);

/** Signals that trigger OPEN only when two or more are in ALARM simultaneously. */
export const WARNING_SIGNALS = new Set(['api-p99', 'api-5xx', 'jvm-pressure', 'cpu-high']);
