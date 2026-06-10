import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { BreakerClient, BreakerOpenError, BreakerServiceConfig, SlowOsCallError } from '../lib/breakerClient';

const ddbMock = mockClient(DynamoDBDocumentClient);

const TABLE = 'CircuitControl-test';

// ---------------------------------------------------------------------------
// DDB fixtures — state field drives the new GlobalBreakerState
// ---------------------------------------------------------------------------

const closedItem = {
    PK: 'BREAKER#GLOBAL',
    SK: 'STATE#CURRENT',
    entityType: 'BREAKER_STATE',
    service: 'GLOBAL',
    state: 'CLOSED',
    mode: 'normal',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'test',
    reason: 'test',
    version: 1,
    tripCount: 0,
    healthyProbeCount: 0,
};

const openItem = {
    PK: 'BREAKER#GLOBAL',
    SK: 'STATE#CURRENT',
    entityType: 'BREAKER_STATE',
    service: 'GLOBAL',
    state: 'OPEN',
    mode: 'protect',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'test',
    reason: 'test',
    version: 1,
    tripCount: 1,
    healthyProbeCount: 0,
};

const halfOpenItem = {
    PK: 'BREAKER#GLOBAL',
    SK: 'STATE#CURRENT',
    entityType: 'BREAKER_STATE',
    service: 'GLOBAL',
    state: 'HALF_OPEN',
    mode: 'protect',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'test',
    reason: 'recovery attempt',
    version: 2,
    tripCount: 1,
    healthyProbeCount: 0,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a BreakerClient with Tier A defaults + optional overrides. */
function makeBreaker(config: Partial<BreakerServiceConfig> = {}): BreakerClient {
    return new BreakerClient({ tableName: TABLE, tier: 'A', ...config });
}

beforeEach(() => {
    ddbMock.reset();
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// BreakerClient.init()
// ---------------------------------------------------------------------------

describe('BreakerClient.init()', () => {
    it('globalState is CLOSED after init with a CLOSED DDB item', async () => {
        ddbMock.on(GetCommand).resolves({ Item: closedItem });
        const breaker = makeBreaker();
        await breaker.init();
        expect(breaker.getGlobalState()).toBe('CLOSED');
    });

    it('globalState is OPEN after init with an OPEN DDB item', async () => {
        ddbMock.on(GetCommand).resolves({ Item: openItem });
        const breaker = makeBreaker();
        await breaker.init();
        expect(breaker.getGlobalState()).toBe('OPEN');
    });

    it('globalState is HALF_OPEN after init with a HALF_OPEN DDB item', async () => {
        ddbMock.on(GetCommand).resolves({ Item: halfOpenItem });
        const breaker = makeBreaker();
        await breaker.init();
        expect(breaker.getGlobalState()).toBe('HALF_OPEN');
    });

    it('fails open (globalState stays CLOSED) when DDB throws', async () => {
        ddbMock.on(GetCommand).rejects(new Error('DDB unavailable'));
        const breaker = makeBreaker();
        await breaker.init();
        expect(breaker.getGlobalState()).toBe('CLOSED');
    });

    it('defaults globalState to CLOSED when DDB item is missing', async () => {
        ddbMock.on(GetCommand).resolves({ Item: undefined });
        const breaker = makeBreaker();
        await breaker.init();
        expect(breaker.getGlobalState()).toBe('CLOSED');
    });

    it('reads the `state` field (not `mode`) from DDB', async () => {
        // Item has mode='normal' but state='OPEN' — the state field must win
        const contradictoryItem = { ...openItem, mode: 'normal' };
        ddbMock.on(GetCommand).resolves({ Item: contradictoryItem });
        const breaker = makeBreaker();
        await breaker.init();
        expect(breaker.getGlobalState()).toBe('OPEN');
    });

    it('queries BREAKER#GLOBAL / STATE#CURRENT', async () => {
        ddbMock.on(GetCommand).resolves({ Item: closedItem });
        const breaker = makeBreaker();
        await breaker.init();
        const calls = ddbMock.commandCalls(GetCommand);
        expect(calls[0].args[0].input.Key).toEqual({ PK: 'BREAKER#GLOBAL', SK: 'STATE#CURRENT' });
    });

    it('each BreakerClient instance holds independent global state', async () => {
        ddbMock.on(GetCommand).resolves({ Item: openItem });
        const breakerA = makeBreaker();
        await breakerA.init();

        // Second instance — DDB now returns closed
        ddbMock.reset();
        ddbMock.on(GetCommand).resolves({ Item: closedItem });
        const breakerB = makeBreaker();
        await breakerB.init();

        expect(breakerA.getGlobalState()).toBe('OPEN');
        expect(breakerB.getGlobalState()).toBe('CLOSED');
    });
});

// ---------------------------------------------------------------------------
// withOsCall — normal path
// ---------------------------------------------------------------------------

describe('BreakerClient.withOsCall() — normal path', () => {
    it('returns the fn result when fn resolves within threshold', async () => {
        const breaker = makeBreaker({ thresholdMs: 1000 });
        const fn = jest.fn<() => Promise<string>>().mockResolvedValue('result');
        const resultPromise = breaker.withOsCall(fn);
        jest.runAllTimers();
        expect(await resultPromise).toBe('result');
    });

    it('propagates non-slow errors from fn without retrying', async () => {
        const breaker = makeBreaker({ thresholdMs: 1000 });
        const boom = new Error('OS error');
        const fn = jest.fn<() => Promise<never>>().mockRejectedValue(boom);
        await expect(breaker.withOsCall(fn)).rejects.toBe(boom);
        expect(fn).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// withOsCall — global gate (OPEN posture)
// ---------------------------------------------------------------------------

describe('BreakerClient.withOsCall() — global OPEN gate', () => {
    it('throws BreakerOpenError immediately for Tier A when globalState is OPEN', async () => {
        ddbMock.on(GetCommand).resolves({ Item: openItem });
        const breaker = makeBreaker({ tier: 'A', thresholdMs: 1000 });
        await breaker.init();

        const fn = jest.fn<() => Promise<string>>();
        await expect(breaker.withOsCall(fn)).rejects.toBeInstanceOf(BreakerOpenError);
        expect(fn).not.toHaveBeenCalled();
    });

    it('throws BreakerOpenError immediately for Tier B when globalState is OPEN', async () => {
        ddbMock.on(GetCommand).resolves({ Item: openItem });
        const breaker = makeBreaker({ tier: 'B', thresholdMs: 1000 });
        await breaker.init();

        const fn = jest.fn<() => Promise<string>>();
        await expect(breaker.withOsCall(fn)).rejects.toBeInstanceOf(BreakerOpenError);
        expect(fn).not.toHaveBeenCalled();
    });

    it('throws BreakerOpenError immediately for Tier C when globalState is OPEN', async () => {
        ddbMock.on(GetCommand).resolves({ Item: openItem });
        const breaker = makeBreaker({ tier: 'C', thresholdMs: 1000 });
        await breaker.init();

        const fn = jest.fn<() => Promise<string>>();
        await expect(breaker.withOsCall(fn)).rejects.toBeInstanceOf(BreakerOpenError);
        expect(fn).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// withOsCall — global gate (HALF_OPEN posture, tier-aware)
// ---------------------------------------------------------------------------

describe('BreakerClient.withOsCall() — global HALF_OPEN gate (tier-aware)', () => {
    it('Tier A is allowed through when globalState is HALF_OPEN', async () => {
        ddbMock.on(GetCommand).resolves({ Item: halfOpenItem });
        const breaker = makeBreaker({ tier: 'A', thresholdMs: 1000 });
        await breaker.init();

        const fn = jest.fn<() => Promise<string>>().mockResolvedValue('serving');
        const result = breaker.withOsCall(fn);
        jest.runAllTimers();
        expect(await result).toBe('serving');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('Tier B is blocked when globalState is HALF_OPEN', async () => {
        ddbMock.on(GetCommand).resolves({ Item: halfOpenItem });
        const breaker = makeBreaker({ tier: 'B', thresholdMs: 1000 });
        await breaker.init();

        const fn = jest.fn<() => Promise<string>>();
        await expect(breaker.withOsCall(fn)).rejects.toBeInstanceOf(BreakerOpenError);
        expect(fn).not.toHaveBeenCalled();
    });

    it('Tier C is blocked when globalState is HALF_OPEN', async () => {
        ddbMock.on(GetCommand).resolves({ Item: halfOpenItem });
        const breaker = makeBreaker({ tier: 'C', thresholdMs: 1000 });
        await breaker.init();

        const fn = jest.fn<() => Promise<string>>();
        await expect(breaker.withOsCall(fn)).rejects.toBeInstanceOf(BreakerOpenError);
        expect(fn).not.toHaveBeenCalled();
    });

    it('BreakerOpenError message includes the blocked tier', async () => {
        ddbMock.on(GetCommand).resolves({ Item: halfOpenItem });
        const breaker = makeBreaker({ tier: 'B' });
        await breaker.init();

        const err = await breaker.withOsCall(jest.fn<() => Promise<never>>()).catch((e: unknown) => e);
        expect(err).toBeInstanceOf(BreakerOpenError);
        expect((err as BreakerOpenError).message).toContain('Tier B');
    });
});

// ---------------------------------------------------------------------------
// withOsCall — slow / retry path
// ---------------------------------------------------------------------------

describe('BreakerClient.withOsCall() — slow OS + exponential backoff', () => {
    it('retries after a slow response and returns result on second attempt', async () => {
        let call = 0;
        const fn = jest.fn<() => Promise<string>>().mockImplementation(() => {
            call++;
            if (call === 1) return new Promise<string>(() => undefined); // never resolves on first attempt
            return Promise.resolve('recovered');
        });

        const breaker = makeBreaker({ thresholdMs: 100, maxRetries: 3, initialDelayMs: 50, maxDelayMs: 1000 });
        const resultPromise = breaker.withOsCall(fn);

        await jest.runAllTimersAsync();

        expect(await resultPromise).toBe('recovered');
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('throws SlowOsCallError after maxRetries exhausted', async () => {
        const fn = jest.fn<() => Promise<never>>().mockImplementation(() => new Promise<never>(() => undefined));
        const breaker = makeBreaker({ thresholdMs: 100, maxRetries: 2, initialDelayMs: 50, maxDelayMs: 1000 });

        const resultPromise = breaker.withOsCall(fn);

        await Promise.all([
            expect(resultPromise).rejects.toMatchObject({ name: 'SlowOsCallError' }),
            jest.runAllTimersAsync(),
        ]);
        expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('SlowOsCallError is an instance of SlowOsCallError', async () => {
        const fn = jest.fn<() => Promise<never>>().mockImplementation(() => new Promise<never>(() => undefined));
        const breaker = makeBreaker({ thresholdMs: 100, maxRetries: 0 });

        const resultPromise = breaker.withOsCall(fn);
        await Promise.all([expect(resultPromise).rejects.toBeInstanceOf(SlowOsCallError), jest.runAllTimersAsync()]);
    });

    it('aborts retry loop with BreakerOpenError when local breaker trips during backoff', async () => {
        const fn = jest.fn<() => Promise<never>>().mockImplementation(() => new Promise<never>(() => undefined));
        // consecutiveSlowToOpen = 3, maxRetries = 3: local breaker trips on 3rd slow attempt
        // then the 4th retry loop iteration checks localState === OPEN and throws BreakerOpenError
        const breaker = makeBreaker({
            thresholdMs: 100,
            maxRetries: 3,
            initialDelayMs: 50,
            maxDelayMs: 1000,
        });

        const resultPromise = breaker.withOsCall(fn);
        await Promise.all([expect(resultPromise).rejects.toBeInstanceOf(BreakerOpenError), jest.runAllTimersAsync()]);
    });
});

// ---------------------------------------------------------------------------
// Local state machine — CLOSED → OPEN transitions
// ---------------------------------------------------------------------------

describe('BreakerClient.withOsCall() — local state machine (CLOSED → OPEN)', () => {
    it('trips locally after N consecutive slow calls', async () => {
        const fn = jest.fn<() => Promise<never>>().mockImplementation(() => new Promise<never>(() => undefined));
        const breaker = makeBreaker({
            thresholdMs: 100,
            maxRetries: 0,
            consecutiveSlowToOpen: 2,
            localOpenHoldMs: 5000,
        });

        const call1 = breaker.withOsCall(fn);
        await Promise.all([expect(call1).rejects.toMatchObject({ name: 'SlowOsCallError' }), jest.runAllTimersAsync()]);
        expect(fn).toHaveBeenCalledTimes(1);

        const call2 = breaker.withOsCall(fn);
        await Promise.all([expect(call2).rejects.toMatchObject({ name: 'SlowOsCallError' }), jest.runAllTimersAsync()]);

        // 2 slow calls → local OPEN; next call throws BreakerOpenError without calling fn
        const call3 = breaker.withOsCall(fn);
        await expect(call3).rejects.toBeInstanceOf(BreakerOpenError);
        expect(fn).toHaveBeenCalledTimes(2); // fn was NOT called on call3
    });

    it('next call after local open throws BreakerOpenError without calling fn', async () => {
        const fn = jest.fn<() => Promise<never>>().mockImplementation(() => new Promise<never>(() => undefined));
        const breaker = makeBreaker({
            thresholdMs: 100,
            maxRetries: 0,
            consecutiveSlowToOpen: 1,
            localOpenHoldMs: 30000,
        });

        // One slow call → local OPEN
        const slowCall = breaker.withOsCall(fn);
        await Promise.all([
            expect(slowCall).rejects.toMatchObject({ name: 'SlowOsCallError' }),
            jest.runAllTimersAsync(),
        ]);

        // Next call must fail fast — fn never invoked
        const fnFast = jest.fn<() => Promise<string>>();
        await expect(breaker.withOsCall(fnFast)).rejects.toBeInstanceOf(BreakerOpenError);
        expect(fnFast).not.toHaveBeenCalled();
    });

    it('success resets the consecutive slow counter', async () => {
        let call = 0;
        const fn = jest.fn<() => Promise<string>>().mockImplementation(() => {
            call++;
            // first two calls are slow, third succeeds immediately
            if (call <= 2) return new Promise<string>(() => undefined);
            return Promise.resolve('ok');
        });
        const breaker = makeBreaker({
            thresholdMs: 100,
            maxRetries: 0,
            consecutiveSlowToOpen: 3,
            localOpenHoldMs: 5000,
        });

        // Two slow calls (counter = 2, threshold = 3 — not yet tripped)
        const c1 = breaker.withOsCall(fn);
        await Promise.all([expect(c1).rejects.toMatchObject({ name: 'SlowOsCallError' }), jest.runAllTimersAsync()]);
        const c2 = breaker.withOsCall(fn);
        await Promise.all([expect(c2).rejects.toMatchObject({ name: 'SlowOsCallError' }), jest.runAllTimersAsync()]);

        // Success → counter resets; breaker stays CLOSED
        const c3 = breaker.withOsCall(fn);
        await jest.runAllTimersAsync();
        expect(await c3).toBe('ok');

        // One more slow call (counter = 1, not 3) — breaker still CLOSED
        call = 1; // reset call counter so fn is slow again
        const fnSlow = jest.fn<() => Promise<never>>().mockImplementation(() => new Promise<never>(() => undefined));
        const c4 = breaker.withOsCall(fnSlow);
        await Promise.all([expect(c4).rejects.toMatchObject({ name: 'SlowOsCallError' }), jest.runAllTimersAsync()]);
        // If counter had NOT reset after c3, this would throw BreakerOpenError on the 4th call
        expect(c4).rejects.toMatchObject({ name: 'SlowOsCallError' });
    });

    it('hard OS error increments the counter and can trip the local breaker', async () => {
        const boom = new Error('OS connection refused');
        const fn = jest.fn<() => Promise<never>>().mockRejectedValue(boom);
        const breaker = makeBreaker({
            thresholdMs: 100,
            maxRetries: 0,
            consecutiveSlowToOpen: 1,
            localOpenHoldMs: 5000,
        });

        // Hard rejection — counter incremented, threshold reached immediately
        await expect(breaker.withOsCall(fn)).rejects.toBe(boom);
        expect(fn).toHaveBeenCalledTimes(1); // hard errors are not retried

        // Breaker is now OPEN — next call must be blocked
        await expect(breaker.withOsCall(jest.fn<() => Promise<never>>())).rejects.toBeInstanceOf(BreakerOpenError);
    });

    it('each instance holds independent local state', async () => {
        const fn = jest.fn<() => Promise<never>>().mockImplementation(() => new Promise<never>(() => undefined));
        const opts = { thresholdMs: 100, maxRetries: 0, consecutiveSlowToOpen: 1, localOpenHoldMs: 5000 };

        const breakerA = makeBreaker(opts);
        const breakerB = makeBreaker(opts);

        // Trip breakerA
        const slow = breakerA.withOsCall(fn);
        await Promise.all([expect(slow).rejects.toMatchObject({ name: 'SlowOsCallError' }), jest.runAllTimersAsync()]);

        // breakerA is OPEN
        await expect(breakerA.withOsCall(jest.fn<() => Promise<string>>())).rejects.toBeInstanceOf(BreakerOpenError);

        // breakerB is still CLOSED — fn should be called
        const okFn = jest.fn<() => Promise<string>>().mockResolvedValue('ok');
        const result = breakerB.withOsCall(okFn);
        jest.runAllTimers();
        expect(await result).toBe('ok');
        expect(okFn).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// Local state machine — HALF_OPEN probe
// ---------------------------------------------------------------------------

describe('BreakerClient.withOsCall() — local HALF_OPEN probe', () => {
    it('transitions to HALF_OPEN and allows one probe after hold expires', async () => {
        const fn = jest.fn<() => Promise<never>>().mockImplementation(() => new Promise<never>(() => undefined));
        const breaker = makeBreaker({
            thresholdMs: 100,
            maxRetries: 0,
            consecutiveSlowToOpen: 1,
            localOpenHoldMs: 5000,
        });

        // Trip the local breaker
        const slow = breaker.withOsCall(fn);
        await Promise.all([expect(slow).rejects.toMatchObject({ name: 'SlowOsCallError' }), jest.runAllTimersAsync()]);

        // Still within hold window → BreakerOpenError, fn not called
        const blocked = breaker.withOsCall(fn);
        await expect(blocked).rejects.toBeInstanceOf(BreakerOpenError);

        // Advance past hold window so OPEN → HALF_OPEN
        jest.setSystemTime(Date.now() + 6000);

        // Probe call — fn is now invoked (HALF_OPEN allows it)
        const probeFn = jest.fn<() => Promise<string>>().mockResolvedValue('recovered');
        const probe = breaker.withOsCall(probeFn);
        await jest.runAllTimersAsync();
        expect(await probe).toBe('recovered');
        expect(probeFn).toHaveBeenCalledTimes(1);
    });

    it('probe success closes the local breaker', async () => {
        const slowFn = jest.fn<() => Promise<never>>().mockImplementation(() => new Promise<never>(() => undefined));
        const breaker = makeBreaker({
            thresholdMs: 100,
            maxRetries: 0,
            consecutiveSlowToOpen: 1,
            localOpenHoldMs: 5000,
        });

        // Trip → advance past hold → probe succeeds
        const slow = breaker.withOsCall(slowFn);
        await Promise.all([expect(slow).rejects.toMatchObject({ name: 'SlowOsCallError' }), jest.runAllTimersAsync()]);
        jest.setSystemTime(Date.now() + 6000);

        const probeFn = jest.fn<() => Promise<string>>().mockResolvedValue('ok');
        const probe = breaker.withOsCall(probeFn);
        await jest.runAllTimersAsync();
        await probe;

        // Breaker is CLOSED — a subsequent call goes through immediately
        const nextFn = jest.fn<() => Promise<string>>().mockResolvedValue('normal');
        const next = breaker.withOsCall(nextFn);
        await jest.runAllTimersAsync();
        expect(await next).toBe('normal');
        expect(nextFn).toHaveBeenCalledTimes(1);
    });

    it('probe timeout re-opens the local breaker with a fresh hold', async () => {
        const slowFn = jest.fn<() => Promise<never>>().mockImplementation(() => new Promise<never>(() => undefined));
        const breaker = makeBreaker({
            thresholdMs: 100,
            maxRetries: 0,
            consecutiveSlowToOpen: 1,
            localOpenHoldMs: 5000,
        });

        // Trip → advance past hold → probe is also slow
        const slow = breaker.withOsCall(slowFn);
        await Promise.all([expect(slow).rejects.toMatchObject({ name: 'SlowOsCallError' }), jest.runAllTimersAsync()]);
        jest.setSystemTime(Date.now() + 6000);

        const probe = breaker.withOsCall(slowFn);
        await Promise.all([expect(probe).rejects.toMatchObject({ name: 'SlowOsCallError' }), jest.runAllTimersAsync()]);

        // Breaker re-opened — next call throws BreakerOpenError
        const nextFn = jest.fn<() => Promise<string>>();
        await expect(breaker.withOsCall(nextFn)).rejects.toBeInstanceOf(BreakerOpenError);
        expect(nextFn).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Stale counter reset (freeze/thaw safety)
// ---------------------------------------------------------------------------

describe('BreakerClient.withOsCall() — stale counter reset', () => {
    it('resets the consecutive counter when the gap since last slow call exceeds localOpenHoldMs', async () => {
        const slowFn = jest.fn<() => Promise<never>>().mockImplementation(() => new Promise<never>(() => undefined));
        const breaker = makeBreaker({
            thresholdMs: 100,
            maxRetries: 0,
            consecutiveSlowToOpen: 3,
            localOpenHoldMs: 5000,
        });

        // Two slow calls (counter = 2, threshold = 3 — not yet tripped)
        const c1 = breaker.withOsCall(slowFn);
        await Promise.all([expect(c1).rejects.toMatchObject({ name: 'SlowOsCallError' }), jest.runAllTimersAsync()]);
        const c2 = breaker.withOsCall(slowFn);
        await Promise.all([expect(c2).rejects.toMatchObject({ name: 'SlowOsCallError' }), jest.runAllTimersAsync()]);

        // Simulate container freeze: advance time past localOpenHoldMs
        jest.setSystemTime(Date.now() + 6000);

        // Next call: stale counter should be reset → fn is called, not blocked
        const okFn = jest.fn<() => Promise<string>>().mockResolvedValue('post-freeze ok');
        const result = breaker.withOsCall(okFn);
        await jest.runAllTimersAsync();
        expect(await result).toBe('post-freeze ok');
        expect(okFn).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// Feature flag — enabled: false
// ---------------------------------------------------------------------------

describe('BreakerClient — feature flag (enabled: false)', () => {
    it('init() is a no-op and makes no DDB calls', async () => {
        ddbMock.on(GetCommand).resolves({ Item: openItem }); // would set OPEN if called
        const breaker = makeBreaker({ enabled: false });
        await breaker.init();
        // DDB was never consulted — state stays CLOSED
        expect(ddbMock.commandCalls(GetCommand)).toHaveLength(0);
        expect(breaker.getGlobalState()).toBe('CLOSED');
    });

    it('withOsCall is a pure passthrough — fn result returned directly', async () => {
        const breaker = makeBreaker({ enabled: false });
        const fn = jest.fn<() => Promise<string>>().mockResolvedValue('result');
        expect(await breaker.withOsCall(fn)).toBe('result');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('withOsCall does not block even when globalState would be OPEN', async () => {
        ddbMock.on(GetCommand).resolves({ Item: openItem });
        const breaker = makeBreaker({ enabled: false, tier: 'C' });
        // init() is skipped, but even if we force globalState somehow, passthrough wins
        const fn = jest.fn<() => Promise<string>>().mockResolvedValue('ok');
        expect(await breaker.withOsCall(fn)).toBe('ok');
    });

    it('withOsCall propagates fn errors without retrying', async () => {
        const breaker = makeBreaker({ enabled: false });
        const boom = new Error('hard fail');
        const fn = jest.fn<() => Promise<never>>().mockRejectedValue(boom);
        await expect(breaker.withOsCall(fn)).rejects.toBe(boom);
        expect(fn).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// BreakerClient.init() — holdUntil staleness promotion
// ---------------------------------------------------------------------------

describe('BreakerClient.init() — holdUntil staleness promotion', () => {
    // ISO timestamps relative to a fixed "now" so comparisons are deterministic
    const NOW_ISO = '2026-06-08T12:00:00.000Z';
    const ELAPSED_HOLD = '2026-06-08T11:59:00.000Z'; // 1 min before now
    const FUTURE_HOLD = '2026-06-08T12:01:00.000Z'; // 1 min after now

    beforeEach(() => {
        jest.setSystemTime(new Date(NOW_ISO));
    });

    it('OPEN with elapsed holdUntil reads as HALF_OPEN', async () => {
        ddbMock.on(GetCommand).resolves({ Item: { ...openItem, holdUntil: ELAPSED_HOLD } });
        const breaker = makeBreaker();
        await breaker.init();
        expect(breaker.getGlobalState()).toBe('HALF_OPEN');
    });

    it('OPEN with future holdUntil stays OPEN', async () => {
        ddbMock.on(GetCommand).resolves({ Item: { ...openItem, holdUntil: FUTURE_HOLD } });
        const breaker = makeBreaker();
        await breaker.init();
        expect(breaker.getGlobalState()).toBe('OPEN');
    });

    it('OPEN with no holdUntil stays OPEN', async () => {
        ddbMock.on(GetCommand).resolves({ Item: openItem });
        const breaker = makeBreaker();
        await breaker.init();
        expect(breaker.getGlobalState()).toBe('OPEN');
    });

    it('HALF_OPEN with elapsed holdUntil reads as CLOSED', async () => {
        ddbMock.on(GetCommand).resolves({ Item: { ...halfOpenItem, holdUntil: ELAPSED_HOLD } });
        const breaker = makeBreaker();
        await breaker.init();
        expect(breaker.getGlobalState()).toBe('CLOSED');
    });

    it('HALF_OPEN with future holdUntil stays HALF_OPEN', async () => {
        ddbMock.on(GetCommand).resolves({ Item: { ...halfOpenItem, holdUntil: FUTURE_HOLD } });
        const breaker = makeBreaker();
        await breaker.init();
        expect(breaker.getGlobalState()).toBe('HALF_OPEN');
    });

    it('HALF_OPEN with no holdUntil stays HALF_OPEN', async () => {
        ddbMock.on(GetCommand).resolves({ Item: halfOpenItem });
        const breaker = makeBreaker();
        await breaker.init();
        expect(breaker.getGlobalState()).toBe('HALF_OPEN');
    });

    it('stale OPEN (promoted to HALF_OPEN) allows Tier A through', async () => {
        ddbMock.on(GetCommand).resolves({ Item: { ...openItem, holdUntil: ELAPSED_HOLD } });
        const breaker = makeBreaker({ tier: 'A', thresholdMs: 1000 });
        await breaker.init();
        const fn = jest.fn<() => Promise<string>>().mockResolvedValue('ok');
        const result = breaker.withOsCall(fn);
        jest.runAllTimers();
        expect(await result).toBe('ok');
    });

    it('stale OPEN (promoted to HALF_OPEN) still blocks Tier B', async () => {
        ddbMock.on(GetCommand).resolves({ Item: { ...openItem, holdUntil: ELAPSED_HOLD } });
        const breaker = makeBreaker({ tier: 'B', thresholdMs: 1000 });
        await breaker.init();
        await expect(breaker.withOsCall(jest.fn<() => Promise<string>>())).rejects.toBeInstanceOf(BreakerOpenError);
    });

    it('stale OPEN (promoted to HALF_OPEN) still blocks Tier C', async () => {
        ddbMock.on(GetCommand).resolves({ Item: { ...openItem, holdUntil: ELAPSED_HOLD } });
        const breaker = makeBreaker({ tier: 'C', thresholdMs: 1000 });
        await breaker.init();
        await expect(breaker.withOsCall(jest.fn<() => Promise<string>>())).rejects.toBeInstanceOf(BreakerOpenError);
    });

    it('stale HALF_OPEN (promoted to CLOSED) allows all tiers through', async () => {
        for (const tier of ['A', 'B', 'C'] as const) {
            ddbMock.reset();
            ddbMock.on(GetCommand).resolves({ Item: { ...halfOpenItem, holdUntil: ELAPSED_HOLD } });
            const breaker = makeBreaker({ tier, thresholdMs: 1000 });
            await breaker.init();
            const fn = jest.fn<() => Promise<string>>().mockResolvedValue('ok');
            const result = breaker.withOsCall(fn);
            jest.runAllTimers();
            expect(await result).toBe('ok');
        }
    });
});

// ---------------------------------------------------------------------------
// reset() — internal test helper
// ---------------------------------------------------------------------------

describe('BreakerClient.reset()', () => {
    it('clears globalState back to CLOSED', async () => {
        ddbMock.on(GetCommand).resolves({ Item: openItem });
        const breaker = makeBreaker();
        await breaker.init();
        expect(breaker.getGlobalState()).toBe('OPEN');

        breaker.reset();
        expect(breaker.getGlobalState()).toBe('CLOSED');
    });

    it('clears local breaker state so calls go through again', async () => {
        const fn = jest.fn<() => Promise<never>>().mockImplementation(() => new Promise<never>(() => undefined));
        const breaker = makeBreaker({
            thresholdMs: 100,
            maxRetries: 0,
            consecutiveSlowToOpen: 1,
            localOpenHoldMs: 30000,
        });

        // Trip
        const slow = breaker.withOsCall(fn);
        await Promise.all([expect(slow).rejects.toMatchObject({ name: 'SlowOsCallError' }), jest.runAllTimersAsync()]);
        await expect(breaker.withOsCall(jest.fn<() => Promise<string>>())).rejects.toBeInstanceOf(BreakerOpenError);

        // Reset → next call goes through
        breaker.reset();
        const okFn = jest.fn<() => Promise<string>>().mockResolvedValue('ok');
        const result = breaker.withOsCall(okFn);
        jest.runAllTimers();
        expect(await result).toBe('ok');
        expect(okFn).toHaveBeenCalledTimes(1);
    });
});
