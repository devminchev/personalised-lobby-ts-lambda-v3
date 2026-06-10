import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { GetParameterCommand } from '@aws-sdk/client-ssm';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-ssm', () => {
    const actual = jest.requireActual<typeof import('@aws-sdk/client-ssm')>('@aws-sdk/client-ssm');
    return {
        ...actual,
        SSMClient: jest.fn(() => ({ send: mockSend })),
    };
});

import { loadBreakerSettings, _resetSettingsCacheForTests } from '../src/settings';

const ALL_ENV_VARS = [
    'BREAKER_OPEN_HOLD_MS',
    'BREAKER_HALF_OPEN_MAX_MS',
    'BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE',
    'BREAKER_EVENT_HISTORY_TTL_SEC',
    'BREAKER_STATE_HISTORY_TTL_SEC',
    'BREAKER_STALE_EVENT_MS',
    'BREAKER_SETTINGS_PARAMETER_NAME',
];

const PARAM_NAME = 'personalisation-lobby-test-breaker.json';

const FULL_JSON_VALUE = JSON.stringify({
    OPEN_HOLD_MS: 60000,
    HALF_OPEN_MAX_MS: 120000,
    HEALTHY_OK_EVENTS_TO_CLOSE: 1,
    EVENT_HISTORY_TTL_SEC: 1209600,
    STATE_HISTORY_TTL_SEC: 2592000,
    STALE_EVENT_MS: 600000,
});

function ssmResponse(value: string) {
    return { Parameter: { Name: PARAM_NAME, Value: value } };
}

function clearAllSettingEnv(): void {
    for (const key of ALL_ENV_VARS) delete process.env[key];
}

describe('loadBreakerSettings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        _resetSettingsCacheForTests();
        clearAllSettingEnv();
    });

    afterEach(() => {
        clearAllSettingEnv();
        _resetSettingsCacheForTests();
    });

    it('reads every setting from env vars and skips SSM entirely', async () => {
        process.env.BREAKER_OPEN_HOLD_MS = '111';
        process.env.BREAKER_HALF_OPEN_MAX_MS = '222';
        process.env.BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE = '3';
        process.env.BREAKER_EVENT_HISTORY_TTL_SEC = '444';
        process.env.BREAKER_STATE_HISTORY_TTL_SEC = '555';
        process.env.BREAKER_STALE_EVENT_MS = '666';

        const settings = await loadBreakerSettings();

        // signalMaxAgeMs is derived (2× staleEventMs) when SIGNAL_MAX_AGE_MS env
        // isn't set — see the dedicated derivation test below.
        expect(settings).toEqual({
            openHoldMs: 111,
            halfOpenMaxMs: 222,
            healthyOkEventsToClose: 3,
            eventHistoryTtlSec: 444,
            stateHistoryTtlSec: 555,
            staleEventMs: 666,
            signalMaxAgeMs: 1332,
        });
        expect(mockSend).not.toHaveBeenCalled();
    });

    it('fetches all settings from the JSON parameter when no env vars are set', async () => {
        process.env.BREAKER_SETTINGS_PARAMETER_NAME = PARAM_NAME;
        mockSend.mockImplementation(async (command: unknown) => {
            if (!(command instanceof GetParameterCommand)) throw new Error('Unexpected command');
            return ssmResponse(FULL_JSON_VALUE);
        });

        const settings = await loadBreakerSettings();

        expect(settings).toMatchObject({
            openHoldMs: 60000,
            halfOpenMaxMs: 120000,
            healthyOkEventsToClose: 1,
            eventHistoryTtlSec: 1209600,
            stateHistoryTtlSec: 2592000,
            staleEventMs: 600000,
        });
        expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('mixes env-var overrides with the JSON parameter for the remainder', async () => {
        process.env.BREAKER_SETTINGS_PARAMETER_NAME = PARAM_NAME;
        // Two overridden via env, four expected from the JSON document. Asserts
        // that env values win when present.
        process.env.BREAKER_OPEN_HOLD_MS = '999';
        process.env.BREAKER_STALE_EVENT_MS = '111';

        mockSend.mockImplementation(async (command: unknown) => {
            if (!(command instanceof GetParameterCommand)) throw new Error('Unexpected command');
            return ssmResponse(FULL_JSON_VALUE);
        });

        const settings = await loadBreakerSettings();

        expect(settings.openHoldMs).toBe(999);
        expect(settings.staleEventMs).toBe(111);
        // Values that came from the JSON document still flow through.
        expect(settings.halfOpenMaxMs).toBe(120000);
        expect(settings.healthyOkEventsToClose).toBe(1);
    });

    it('returns the cached snapshot within the TTL window', async () => {
        // Three consecutive calls within the TTL must produce a single SSM call —
        // this is the cost-amortisation contract for the loader.
        process.env.BREAKER_SETTINGS_PARAMETER_NAME = PARAM_NAME;
        mockSend.mockImplementation(async () => ssmResponse(FULL_JSON_VALUE));

        await loadBreakerSettings();
        await loadBreakerSettings();
        await loadBreakerSettings();

        expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('throws when SSM returns no Parameter for the requested name', async () => {
        // SSM responses don't always populate Parameter (mid-failover, IAM
        // refusal masked as empty, etc). Surface loud rather than partial-load.
        process.env.BREAKER_SETTINGS_PARAMETER_NAME = PARAM_NAME;
        mockSend.mockImplementation(async () => ({ Parameter: undefined }));

        await expect(loadBreakerSettings()).rejects.toThrow(
            /SSM did not return a value for breaker settings parameter/,
        );
    });

    it('throws when the JSON parameter value is not parseable JSON', async () => {
        process.env.BREAKER_SETTINGS_PARAMETER_NAME = PARAM_NAME;
        mockSend.mockImplementation(async () => ssmResponse('not { valid json'));

        await expect(loadBreakerSettings()).rejects.toThrow(/Failed to parse JSON in breaker settings parameter/);
    });

    it('throws when the JSON parameter value is a non-object (array or scalar)', async () => {
        process.env.BREAKER_SETTINGS_PARAMETER_NAME = PARAM_NAME;
        mockSend.mockImplementation(async () => ssmResponse('[1,2,3]'));

        await expect(loadBreakerSettings()).rejects.toThrow(/must be a JSON object/);
    });

    it('throws when the JSON document is missing a required key', async () => {
        process.env.BREAKER_SETTINGS_PARAMETER_NAME = PARAM_NAME;
        const partial = JSON.stringify({
            // OPEN_HOLD_MS deliberately omitted.
            HALF_OPEN_MAX_MS: 120000,
            HEALTHY_OK_EVENTS_TO_CLOSE: 1,
            EVENT_HISTORY_TTL_SEC: 1209600,
            STATE_HISTORY_TTL_SEC: 2592000,
            STALE_EVENT_MS: 600000,
        });
        mockSend.mockImplementation(async () => ssmResponse(partial));

        await expect(loadBreakerSettings()).rejects.toThrow(/Missing key "OPEN_HOLD_MS"/);
    });

    it('throws when a JSON field has an unsupported type (e.g. boolean)', async () => {
        process.env.BREAKER_SETTINGS_PARAMETER_NAME = PARAM_NAME;
        const wrongType = JSON.stringify({
            OPEN_HOLD_MS: true,
            HALF_OPEN_MAX_MS: 120000,
            HEALTHY_OK_EVENTS_TO_CLOSE: 1,
            EVENT_HISTORY_TTL_SEC: 1209600,
            STATE_HISTORY_TTL_SEC: 2592000,
            STALE_EVENT_MS: 600000,
        });
        mockSend.mockImplementation(async () => ssmResponse(wrongType));

        await expect(loadBreakerSettings()).rejects.toThrow(/Invalid type for "OPEN_HOLD_MS"/);
    });

    it('accepts numeric strings in the JSON document', async () => {
        // Numbers can be hand-quoted in the document; both round-trip the
        // same through parseNumeric → Number().
        process.env.BREAKER_SETTINGS_PARAMETER_NAME = PARAM_NAME;
        const quoted = JSON.stringify({
            OPEN_HOLD_MS: '60000',
            HALF_OPEN_MAX_MS: '120000',
            HEALTHY_OK_EVENTS_TO_CLOSE: '1',
            EVENT_HISTORY_TTL_SEC: '1209600',
            STATE_HISTORY_TTL_SEC: '2592000',
            STALE_EVENT_MS: '600000',
        });
        mockSend.mockImplementation(async () => ssmResponse(quoted));

        const settings = await loadBreakerSettings();
        expect(settings.openHoldMs).toBe(60000);
        expect(settings.healthyOkEventsToClose).toBe(1);
    });

    it('throws when an env-var override is non-numeric', async () => {
        process.env.BREAKER_OPEN_HOLD_MS = 'not-a-number';
        process.env.BREAKER_HALF_OPEN_MAX_MS = '120000';
        process.env.BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE = '1';
        process.env.BREAKER_EVENT_HISTORY_TTL_SEC = '1209600';
        process.env.BREAKER_STATE_HISTORY_TTL_SEC = '2592000';
        process.env.BREAKER_STALE_EVENT_MS = '600000';

        await expect(loadBreakerSettings()).rejects.toThrow(/Invalid numeric value for openHoldMs/);
    });

    it('throws when parameter-name env var is missing and SSM is needed', async () => {
        // No env vars and no parameter name — there is no way to load anything, fail loud.
        await expect(loadBreakerSettings()).rejects.toThrow(/BREAKER_SETTINGS_PARAMETER_NAME env var is required/);
    });

    it('rejects negative env-var values rather than passing them through', async () => {
        // A negative duration would silently break breaker behaviour (e.g.
        // immediately-expired holdUntil) instead of failing visibly. The loader
        // is the right place to catch this — see parseNumeric in src/settings.ts.
        process.env.BREAKER_OPEN_HOLD_MS = '-1000';
        process.env.BREAKER_HALF_OPEN_MAX_MS = '120000';
        process.env.BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE = '1';
        process.env.BREAKER_EVENT_HISTORY_TTL_SEC = '1209600';
        process.env.BREAKER_STATE_HISTORY_TTL_SEC = '2592000';
        process.env.BREAKER_STALE_EVENT_MS = '600000';

        await expect(loadBreakerSettings()).rejects.toThrow(/Negative value not allowed for openHoldMs/);
    });

    it('rejects negative SSM values rather than passing them through', async () => {
        // Same guard, source = SSM rather than env. Useful if an operator
        // typos a negative value during an emergency tuning push.
        process.env.BREAKER_SETTINGS_PARAMETER_NAME = PARAM_NAME;
        const negative = JSON.stringify({
            OPEN_HOLD_MS: -1000,
            HALF_OPEN_MAX_MS: 120000,
            HEALTHY_OK_EVENTS_TO_CLOSE: 1,
            EVENT_HISTORY_TTL_SEC: 1209600,
            STATE_HISTORY_TTL_SEC: 2592000,
            STALE_EVENT_MS: 600000,
        });
        mockSend.mockImplementation(async () => ssmResponse(negative));

        await expect(loadBreakerSettings()).rejects.toThrow(/Negative value not allowed for openHoldMs/);
    });

    it('still allows zero (staleEventMs=0 disables the freshness guard)', async () => {
        // Defensive baseline: the negative-rejection must not have been so
        // aggressive that it broke `BREAKER_STALE_EVENT_MS=0`, the documented
        // way to disable the stale-event filter (used by tests + local-run).
        process.env.BREAKER_OPEN_HOLD_MS = '60000';
        process.env.BREAKER_HALF_OPEN_MAX_MS = '120000';
        process.env.BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE = '1';
        process.env.BREAKER_EVENT_HISTORY_TTL_SEC = '1209600';
        process.env.BREAKER_STATE_HISTORY_TTL_SEC = '2592000';
        process.env.BREAKER_STALE_EVENT_MS = '0';

        const settings = await loadBreakerSettings();
        expect(settings.staleEventMs).toBe(0);
    });

    it('derives signalMaxAgeMs as 2× staleEventMs when SIGNAL_MAX_AGE_MS env is unset', async () => {
        // Default contract: signalMaxAgeMs is not in SETTING_DEFS — it is
        // derived from staleEventMs once the rest of the settings have loaded.
        process.env.BREAKER_OPEN_HOLD_MS = '60000';
        process.env.BREAKER_HALF_OPEN_MAX_MS = '120000';
        process.env.BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE = '1';
        process.env.BREAKER_EVENT_HISTORY_TTL_SEC = '1209600';
        process.env.BREAKER_STATE_HISTORY_TTL_SEC = '2592000';
        process.env.BREAKER_STALE_EVENT_MS = '600000';

        const settings = await loadBreakerSettings();

        expect(settings.signalMaxAgeMs).toBe(1200000);
    });

    it('uses SIGNAL_MAX_AGE_MS env override over the staleEventMs-derived default', async () => {
        // The override env var must win even when staleEventMs would otherwise
        // produce a different value. This is the path used by tests + e2e where
        // staleEventMs=0 (freshness guard off) but pruning needs to stay on.
        process.env.BREAKER_OPEN_HOLD_MS = '60000';
        process.env.BREAKER_HALF_OPEN_MAX_MS = '120000';
        process.env.BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE = '1';
        process.env.BREAKER_EVENT_HISTORY_TTL_SEC = '1209600';
        process.env.BREAKER_STATE_HISTORY_TTL_SEC = '2592000';
        process.env.BREAKER_STALE_EVENT_MS = '0';
        process.env.SIGNAL_MAX_AGE_MS = '900000';

        const settings = await loadBreakerSettings();

        expect(settings.signalMaxAgeMs).toBe(900000);
        // Cleanup — SIGNAL_MAX_AGE_MS isn't in ALL_ENV_VARS because it's
        // not a BREAKER_* var, so afterEach won't reset it for us.
        delete process.env.SIGNAL_MAX_AGE_MS;
    });

    it('rejects a negative SIGNAL_MAX_AGE_MS env override', async () => {
        process.env.BREAKER_OPEN_HOLD_MS = '60000';
        process.env.BREAKER_HALF_OPEN_MAX_MS = '120000';
        process.env.BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE = '1';
        process.env.BREAKER_EVENT_HISTORY_TTL_SEC = '1209600';
        process.env.BREAKER_STATE_HISTORY_TTL_SEC = '2592000';
        process.env.BREAKER_STALE_EVENT_MS = '600000';
        process.env.SIGNAL_MAX_AGE_MS = '-1';

        await expect(loadBreakerSettings()).rejects.toThrow(/Negative value not allowed for signalMaxAgeMs/);

        delete process.env.SIGNAL_MAX_AGE_MS;
    });

    it('treats whitespace-only env-var values as unset and falls back to SSM', async () => {
        // Trim-empty env vars are a common artefact of templating tools that
        // emit `BREAKER_OPEN_HOLD_MS=   ` rather than leaving the var unset.
        // Treat them as not provided so SSM still answers, instead of failing
        // the numeric parse on whitespace.
        process.env.BREAKER_SETTINGS_PARAMETER_NAME = PARAM_NAME;
        process.env.BREAKER_OPEN_HOLD_MS = '   ';
        mockSend.mockImplementation(async () => ssmResponse(FULL_JSON_VALUE));

        const settings = await loadBreakerSettings();

        expect(settings.openHoldMs).toBe(60000);
    });
});
