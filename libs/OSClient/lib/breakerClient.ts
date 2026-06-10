import { GetItemCommand } from 'dynamodb-toolbox';
import { getDdbClient, getEntities } from 'dynamoClient';
import { LogCode, logMessage } from './logger';

const MAX_DELAY_MS = Number(process.env.BREAKER_MAX_DELAY_MS ?? 8000);
const SLOW_CALL_THRESHOLD_MS = Number(process.env.BREAKER_SLOW_THRESHOLD_MS ?? 2000);
const MAX_RETRIES = Number(process.env.BREAKER_MAX_RETRIES ?? 3);
const INITIAL_DELAY_MS = Number(process.env.BREAKER_INITIAL_DELAY_MS ?? 100);
const CONSECUTIVE_SLOW_OPEN_LIMIT = Number(process.env.BREAKER_CONSECUTIVE_SLOW_TO_OPEN ?? 3);

/** CLOSED = normal, OPEN = hard block all tiers, HALF_OPEN = Tier A probe only. */
export type GlobalBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

type LocalBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/** A = Core, B = Important, C = Enrichment — see docs/resilience/service-tiers.mdx. */
export type ServiceTier = 'A' | 'B' | 'C';

/** Per-Lambda breaker config. All threshold fields fall back to BREAKER_* env vars. */
export interface BreakerServiceConfig {
    /** CircuitControl DynamoDB table name. */
    tableName: string;
    /** Service tier — controls behaviour when global posture is `HALF_OPEN`. */
    tier: ServiceTier;
    /**
     * Master on/off switch for this breaker instance.
     * When `false`, `init()` skips the DDB read and `withOsCall` is a pure
     * passthrough — no blocking, no retries, no DDB calls. Defaults to `false`.
     * Must be explicitly set to `true` to activate the breaker for a given
     * Lambda — safe-by-default so new consumers don't accidentally enable it.
     */
    enabled?: boolean;
    /** Per-call OS timeout that counts as slow (ms). Default: `BREAKER_SLOW_THRESHOLD_MS` ?? 2000. */
    thresholdMs?: number;
    /** Max within-invocation retry attempts. Default: `BREAKER_MAX_RETRIES` ?? 3. */
    maxRetries?: number;
    /** Initial exponential backoff delay (ms). Default: `BREAKER_INITIAL_DELAY_MS` ?? 100. */
    initialDelayMs?: number;
    /** Backoff cap (ms). Default: `BREAKER_MAX_DELAY_MS` ?? 8000. */
    maxDelayMs?: number;
    /** Consecutive slow-or-hard-error calls required to trip the local breaker. Default: `BREAKER_CONSECUTIVE_SLOW_TO_OPEN` ?? 3. */
    consecutiveSlowToOpen?: number;
    /** How long to stay locally `OPEN` before allowing a `HALF_OPEN` probe (ms). Default: `BREAKER_LOCAL_OPEN_HOLD_MS` ?? 10000. */
    localOpenHoldMs?: number;
}

export class BreakerOpenError extends Error {
    statusCode = 503;
    constructor(message = 'Circuit breaker is open — OpenSearch call blocked') {
        super(message);
        this.name = 'BreakerOpenError';
    }
}

export class SlowOsCallError extends Error {
    statusCode = 503;
    constructor(message = 'OpenSearch did not respond within the configured threshold') {
        super(message);
        this.name = 'SlowOsCallError';
    }
}

/**
 * Wraps an error that should propagate to the caller but must NOT count
 * toward the breaker's failure threshold. Use for 4xx responses from
 * OpenSearch — the cluster is healthy and responding; the fault is in the
 * request, not the infrastructure.
 *
 * The breaker unwraps this and rethrows `trueError` without calling
 * `recordFailure()`.
 */
export class NonTrippableError extends Error {
    statusCode = 400;

    constructor(public readonly trueError: Error) {
        super(trueError.message);
        this.name = 'NonTrippableError';
    }
}

async function timeoutWithFailure(ms: number): Promise<never> {
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
    throw new SlowOsCallError();
}

async function sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, Math.random() * ms));
}

// ---------------------------------------------------------------------------
// BreakerClient
// ---------------------------------------------------------------------------

// See docs/resilience/breaker-client-design.mdx for the two-layer architecture.
export class BreakerClient {
    // Layer 1 — global posture seeded from DDB at cold start
    private globalState: GlobalBreakerState = 'CLOSED';

    // Layer 2 — local observation-driven state machine
    private localState: LocalBreakerState = 'CLOSED';
    private consecutiveSlowCalls = 0;
    private lastSlowCallAt = 0; // epoch ms of the most recent slow call (freeze/thaw staleness check)
    private localOpenUntilMs = 0; // epoch ms when local OPEN transitions to HALF_OPEN

    // Resolved thresholds — config overrides env-var defaults, computed once at
    // construction so the hot-path withOsCall() does no repeated ?? resolution.
    private readonly thresholdMs: number;
    private readonly maxRetries: number;
    private readonly initialDelayMs: number;
    private readonly maxDelayMs: number;
    private readonly consecutiveSlowToOpen: number;
    private readonly localOpenHoldMs: number;

    constructor(private readonly config: BreakerServiceConfig) {
        this.thresholdMs = config.thresholdMs ?? SLOW_CALL_THRESHOLD_MS;
        this.maxRetries = config.maxRetries ?? MAX_RETRIES;
        this.initialDelayMs = config.initialDelayMs ?? INITIAL_DELAY_MS;
        this.maxDelayMs = config.maxDelayMs ?? MAX_DELAY_MS;
        this.consecutiveSlowToOpen = config.consecutiveSlowToOpen ?? CONSECUTIVE_SLOW_OPEN_LIMIT;
        this.localOpenHoldMs = config.localOpenHoldMs ?? Number(process.env.BREAKER_LOCAL_OPEN_HOLD_MS ?? 10000);
    }

    /**
     * Reads the global circuit-breaker state from DynamoDB and caches it in
     * this instance. Call once on cold start (fire-and-forget is fine).
     * Fails open — if the DDB read errors, `globalState` stays `'CLOSED'`.
     * No-op when `config.enabled` is `false`.
     */
    async init(): Promise<void> {
        if (this.config.enabled === false) return;
        try {
            this.globalState = await this.fetchGlobalState();
            logMessage(
                'log',
                LogCode.BreakerInitSuccess,
                undefined,
                `globalState=${this.globalState} tier=${this.config.tier}`,
            );
        } catch (err) {
            logMessage('warn', LogCode.BreakerInitFailed, undefined, err instanceof Error ? err.message : String(err));
        }
    }

    /** Returns the current global circuit-breaker posture. */
    getGlobalState(): GlobalBreakerState {
        return this.globalState;
    }

    async withOsCall<T>(fn: () => Promise<T>): Promise<T> {
        if (this.config.enabled === false) {
            try {
                return await fn();
            } catch (err) {
                // Always unwrap NonTrippableError even when the breaker is disabled.
                if (err instanceof NonTrippableError) throw err.trueError;
                throw err;
            }
        }

        this.resetStaleCounter();
        this.checkGlobalGate();
        this.checkLocalGate();

        let delay = this.initialDelayMs;
        let lastError: unknown = new SlowOsCallError();

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            if (attempt > 0) {
                await sleep(delay);
                delay = Math.min(delay * 2, this.maxDelayMs);
                if (this.localState === 'OPEN') {
                    throw new BreakerOpenError('Local breaker opened during retry backoff');
                }
            }

            try {
                const result = await Promise.race([fn(), timeoutWithFailure(this.thresholdMs)]);
                this.consecutiveSlowCalls = 0;
                if (this.localState === 'HALF_OPEN') {
                    this.localState = 'CLOSED';
                    logMessage('log', LogCode.BreakerProbeSuccess);
                }
                return result;
            } catch (err) {
                // 4xx client errors: OpenSearch is healthy — don't trip the breaker.
                if (err instanceof NonTrippableError) {
                    throw err.trueError;
                }
                this.recordFailure();
                // Slow call: record and retry.
                if (err instanceof SlowOsCallError) {
                    lastError = err;
                    continue;
                }
                // Hard error: abort immediately without retrying.
                throw err;
            }
        }

        throw lastError;
    }

    /** @internal Only for use in tests — resets all instance state to initial values. */
    reset(): void {
        this.globalState = 'CLOSED';
        this.localState = 'CLOSED';
        this.consecutiveSlowCalls = 0;
        this.lastSlowCallAt = 0;
        this.localOpenUntilMs = 0;
    }

    /**
     * Clears a stale slow-call counter so a recovering OS isn't falsely penalised
     * after a long container idle / freeze period.
     */
    private resetStaleCounter(): void {
        if (this.consecutiveSlowCalls > 0 && Date.now() - this.lastSlowCallAt > this.localOpenHoldMs) {
            this.consecutiveSlowCalls = 0;
        }
    }

    /** Throws `BreakerOpenError` if the global posture blocks this tier. */
    private checkGlobalGate(): void {
        if (this.globalState === 'OPEN') {
            logMessage('warn', LogCode.BreakerBlocked, undefined, `globalState=OPEN tier=${this.config.tier}`);
            throw new BreakerOpenError('Global breaker OPEN — all tiers blocked');
        }
        if (this.globalState === 'HALF_OPEN' && this.config.tier !== 'A') {
            logMessage('warn', LogCode.BreakerBlocked, undefined, `globalState=HALF_OPEN tier=${this.config.tier}`);
            throw new BreakerOpenError(`Global breaker HALF_OPEN — Tier ${this.config.tier} blocked`);
        }
    }

    /**
     * Throws `BreakerOpenError` if the local breaker is within its hold window.
     * Advances local state from `OPEN` → `HALF_OPEN` once the window lapses.
     */
    private checkLocalGate(): void {
        if (this.localState !== 'OPEN') return;
        if (Date.now() < this.localOpenUntilMs) {
            logMessage(
                'warn',
                LogCode.BreakerBlocked,
                undefined,
                `localState=OPEN holdRemainingMs=${this.localOpenUntilMs - Date.now()}`,
            );
            throw new BreakerOpenError('Local breaker is open — consecutive slow calls exceeded threshold');
        }
        // Hold window elapsed: allow one probe through.
        this.localState = 'HALF_OPEN';
    }

    /**
     * Increments the failure counter and trips the local breaker when thresholds
     * are exceeded or a `HALF_OPEN` probe fails.
     * Both slow calls (`SlowOsCallError`) and hard OS errors count toward the threshold.
     */
    private recordFailure(): void {
        this.lastSlowCallAt = Date.now();
        this.consecutiveSlowCalls++;
        const probeFailure = this.localState === 'HALF_OPEN';
        if (probeFailure || this.consecutiveSlowCalls >= this.consecutiveSlowToOpen) {
            this.localState = 'OPEN';
            this.localOpenUntilMs = Date.now() + this.localOpenHoldMs;
            logMessage(
                'warn',
                probeFailure ? LogCode.BreakerProbeFailure : LogCode.BreakerTripped,
                undefined,
                probeFailure ? undefined : `consecutiveSlowCalls=${this.consecutiveSlowCalls}`,
            );
        }
    }

    private async fetchGlobalState(): Promise<GlobalBreakerState> {
        const { BreakerStateEntity } = getEntities(getDdbClient(), this.config.tableName);
        const { Item } = await BreakerStateEntity.build(GetItemCommand)
            .key({ PK: 'BREAKER#GLOBAL', SK: 'STATE#CURRENT' })
            .send();
        const state = (Item?.state as GlobalBreakerState) ?? 'CLOSED';
        // See docs/resilience/circuit-breaker-stale-prev-guard.mdx — same holdUntil invariant as resolveEffectivePrev.
        if (Item?.holdUntil) {
            const now = new Date().toISOString();
            if (state === 'OPEN' && Item.holdUntil < now) return 'HALF_OPEN';
            if (state === 'HALF_OPEN' && Item.holdUntil < now) return 'CLOSED';
        }
        return state;
    }
}
