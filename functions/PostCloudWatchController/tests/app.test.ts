import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { BatchGetCommand, GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { lambdaHandler, setBreakerStateManually } from '../src/app';
import { _resetSettingsCacheForTests } from '../src/settings';
import { ControllerAction } from '../src/types';

const mockSend = jest.fn();

jest.mock('dynamoClient', () => {
    const actual = jest.requireActual<Record<string, unknown>>('dynamoClient');
    return {
        ...actual,
        getDdbClient: jest.fn(() => ({ send: mockSend })),
        _resetDdbClientCacheForTests: jest.fn(),
    };
});

// Settings come from SSM in production; here we provide all six via env vars
// so loadBreakerSettings short-circuits and never reaches the SDK. The values
// match the previously-hardcoded BreakerSettings const so the existing
// test expectations (holdUntil offsets, TTL deltas, etc.) remain valid.
const SETTINGS_ENV: Record<string, string> = {
    BREAKER_OPEN_HOLD_MS: '60000',
    BREAKER_HALF_OPEN_MAX_MS: '120000',
    BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE: '1',
    BREAKER_EVENT_HISTORY_TTL_SEC: String(14 * 24 * 60 * 60),
    BREAKER_STATE_HISTORY_TTL_SEC: String(30 * 24 * 60 * 60),
    BREAKER_STALE_EVENT_MS: '600000',
};

type TransactPut = {
    Put?: {
        Item?: Record<string, unknown>;
        ConditionExpression?: string;
        ExpressionAttributeNames?: Record<string, string>;
        ExpressionAttributeValues?: Record<string, unknown>;
    };
};

type CommandWithInput = {
    input?: {
        TransactItems?: TransactPut[];
    };
};

function getTransactItems(command: unknown): TransactPut[] {
    return (command as CommandWithInput | undefined)?.input?.TransactItems ?? [];
}

// NOTE on test naming and routing
//
// Every alarm-driven test below uses alarm names in the production shape
// (`breaker:GLOBAL:[...label...]:<signal>`) and asserts that the handler routes
// to the single `BREAKER#GLOBAL` partition. That matches the defensive-collapse
// behaviour in parseAlarmName — see the comment block on that function in
// src/app.ts for the design rationale.
//
// The setBreakerStateManually tests intentionally still pass `service: 'GetGamesFunction'`
// to exercise the manual-override escape hatch — which DOES accept any service
// on purpose, so operators can reach non-GLOBAL partitions if needed.

describe('PostCloudWatchController lambdaHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        _resetSettingsCacheForTests();
        process.env.CB_DDB_TABLE = 'CircuitControl-test';
        process.env.AWS_REGION = 'eu-west-1';
        for (const [k, v] of Object.entries(SETTINGS_ENV)) process.env[k] = v;
    });

    afterEach(() => {
        delete process.env.CB_DDB_TABLE;
        delete process.env.AWS_REGION;
        for (const k of Object.keys(SETTINGS_ENV)) delete process.env[k];
        _resetSettingsCacheForTests();
        jest.restoreAllMocks();
    });

    it('opens on critical alarm', async () => {
        process.env.BREAKER_STALE_EVENT_MS = '0';

        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return { Responses: { 'CircuitControl-test': [] } };
            }

            if (command instanceof TransactWriteCommand) {
                return {};
            }

            throw new Error(
                `Unexpected command: ${String((command as { constructor?: { name?: string } }).constructor?.name)}`,
            );
        });

        const event = {
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:GetGamesFunction:os-search-rejections',
                previousState: { value: 'OK', timestamp: '2026-03-31T09:59:00.000Z' },
                state: {
                    value: 'ALARM',
                    reason: 'rejections too high',
                    timestamp: '2026-03-31T10:00:00.000Z',
                },
            },
        };

        const result = await lambdaHandler(event);

        expect(result).toEqual({ action: ControllerAction.Opened, service: 'GLOBAL' });
        expect(mockSend).toHaveBeenCalledTimes(2);

        const txCommand = mockSend.mock.calls.find(([command]) => command instanceof TransactWriteCommand)?.[0];
        const items = getTransactItems(txCommand);
        const written = items.map((item) => item.Put?.Item);
        const breakerState = written.find((item) => item?.entityType === 'BREAKER_STATE');
        const signalState = written.find((item) => item?.entityType === 'SIGNAL_STATE');
        const alarmEvent = written.find((item) => item?.entityType === 'ALARM_EVENT');

        expect(breakerState).toMatchObject({
            PK: 'BREAKER#GLOBAL',
            SK: 'STATE#CURRENT',
            state: 'OPEN',
            mode: 'protect',
            reason: `${ControllerAction.Opened}:critical_signal:os-search-rejections`,
            tripCount: 1,
        });
        expect(signalState).toMatchObject({
            service: 'GLOBAL',
            signals: {
                'os-search-rejections': {
                    updatedAt: '2026-03-31T10:00:00.000Z',
                },
            },
        });
        expect(alarmEvent).toMatchObject({
            service: 'GLOBAL',
            alarmName: 'breaker:GLOBAL:GetGamesFunction:os-search-rejections',
            currentState: 'ALARM',
        });
    });

    it('ignores stale events', async () => {
        jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-31T10:20:00.000Z').getTime());

        const event = {
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:cpu-high',
                previousState: { value: 'OK' },
                state: {
                    value: 'ALARM',
                    timestamp: '2026-03-31T10:00:00.000Z',
                },
            },
        };

        const result = await lambdaHandler(event);

        expect(result).toEqual({ action: ControllerAction.IgnoredStaleEvent, service: 'GLOBAL' });
        expect(mockSend).not.toHaveBeenCalled();
    });

    it('tick OPEN to HALF_OPEN', async () => {
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'STATE#CURRENT',
                                entityType: 'BREAKER_STATE',
                                service: 'GLOBAL',
                                state: 'OPEN',
                                mode: 'protect',
                                updatedAt: '2026-03-31T10:00:00.000Z',
                                updatedBy: 'controller',
                                reason: 'compound_open:critical_signal:os-search-rejections',
                                holdUntil: '2026-03-31T10:01:00.000Z',
                                version: 3,
                                tripCount: 1,
                                healthyProbeCount: 0,
                            },
                        ],
                    },
                };
            }

            if (command instanceof TransactWriteCommand) {
                return {};
            }

            throw new Error(
                `Unexpected command: ${String((command as { constructor?: { name?: string } }).constructor?.name)}`,
            );
        });

        const result = await lambdaHandler({
            source: 'aws.scheduler',
            'detail-type': 'Scheduled Event',
            time: '2026-03-31T10:02:00.000Z',
            detail: {},
        });

        expect(result).toEqual({
            action: ControllerAction.CooldownExpiredProbe,
            transitioned: 1,
        });

        const txCommand = mockSend.mock.calls.find(([command]) => command instanceof TransactWriteCommand)?.[0];
        const items = getTransactItems(txCommand);
        const currentState = items.find((item) => item.Put?.Item?.entityType === 'BREAKER_STATE')?.Put?.Item;

        expect(currentState).toMatchObject({
            service: 'GLOBAL',
            state: 'HALF_OPEN',
            mode: 'protect',
            reason: ControllerAction.CooldownExpiredProbe,
            holdUntil: '2026-03-31T10:04:00.000Z',
        });
    });

    it('ignores unknown event', async () => {
        const result = await lambdaHandler({
            source: 'custom.source',
            'detail-type': 'Other Event',
            time: '2026-03-31T10:00:00.000Z',
            detail: {},
        });

        expect(result).toEqual({ action: ControllerAction.IgnoredUnknownEvent });
        expect(mockSend).not.toHaveBeenCalled();
    });

    it('manually forces breaker state', async () => {
        // Manual-override path: operators can target any service partition,
        // including non-GLOBAL ones. This is the intentional escape hatch
        // (see setBreakerStateManually in src/app.ts).
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof GetCommand) {
                return { Item: undefined };
            }
            if (command instanceof TransactWriteCommand) {
                return {};
            }
            throw new Error('Unexpected command');
        });

        await setBreakerStateManually({
            service: 'GetGamesFunction',
            state: 'OPEN',
            reason: 'maintenance window',
            actor: 'operator',
            holdUntil: '2026-04-01T00:00:00.000Z',
        });

        expect(mockSend).toHaveBeenCalledTimes(2);
        const txCommand = mockSend.mock.calls[1][0];
        const items = getTransactItems(txCommand);
        const breakerItem = items.find((item) => item.Put?.Item?.entityType === 'BREAKER_STATE')?.Put?.Item;

        expect(breakerItem).toMatchObject({
            service: 'GetGamesFunction',
            state: 'OPEN',
            mode: 'protect',
            updatedBy: 'operator',
            reason: 'manual:maintenance window',
        });
    });

    it('throws missing CB_DDB_TABLE', async () => {
        delete process.env.CB_DDB_TABLE;

        await expect(
            lambdaHandler({
                source: 'aws.cloudwatch',
                'detail-type': 'CloudWatch Alarm State Change',
                time: '2026-03-31T10:00:00.000Z',
                detail: {
                    alarmName: 'breaker:GLOBAL:cpu-high',
                    previousState: { value: 'OK' },
                    state: { value: 'ALARM', timestamp: '2026-03-31T10:00:00.000Z' },
                },
            }),
        ).rejects.toThrow('Missing required environment variable: CB_DDB_TABLE');
    });

    it('routes 4-part alarm', async () => {
        // Template-emitted shape: `breaker:GLOBAL:<label>:<signal>`. The <label>
        // segment (e.g. the API name) is informational and must not alter routing.
        process.env.BREAKER_STALE_EVENT_MS = '0';
        const pkKeysRead: string[] = [];
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                const keys = (
                    command as unknown as {
                        input: { RequestItems: Record<string, { Keys: Array<{ PK: string; SK: string }> }> };
                    }
                ).input.RequestItems['CircuitControl-test'].Keys;
                for (const k of keys) pkKeysRead.push(k.PK);
                return { Responses: { 'CircuitControl-test': [] } };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-04-21T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:lobby-v2:os-search-rejections',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-04-21T10:00:00.000Z' },
            },
        });

        // Signal is the trailing `os-search-rejections`, which is CRITICAL, so the
        // breaker opens — and it opens on BREAKER#GLOBAL regardless of the label.
        expect(result).toEqual({ action: ControllerAction.Opened, service: 'GLOBAL' });
        expect(pkKeysRead.every((pk) => pk === 'BREAKER#GLOBAL')).toBe(true);
    });

    it('collapses non-GLOBAL alarm', async () => {
        // Suppose a future template edit ships `breaker:lobby-v2:api-p99` by
        // accident (missing the GLOBAL segment). Without the defensive collapse
        // this would create a stuck non-GLOBAL partition. Assert it still
        // routes to BREAKER#GLOBAL instead.
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) return { Responses: { 'CircuitControl-test': [] } };
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-04-21T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:lobby-v2:api-p99',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-04-21T10:00:00.000Z' },
            },
        });

        expect(result).toMatchObject({ service: 'GLOBAL' });
    });

    it('collapses 2-part alarm', async () => {
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) return { Responses: { 'CircuitControl-test': [] } };
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GetGamesFunction',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toMatchObject({ service: 'GLOBAL' });
    });

    it('handles colon-less alarm', async () => {
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) return { Responses: { 'CircuitControl-test': [] } };
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'plain-alarm-name',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toMatchObject({ service: 'GLOBAL' });
    });

    it('stays CLOSED single warning', async () => {
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) return { Responses: { 'CircuitControl-test': [] } };
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:lobby-v2:api-p99',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: ControllerAction.InitializedClosed, service: 'GLOBAL' });
    });

    it('opens on compound warning', async () => {
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'SIGNAL_STATE#CURRENT',
                                entityType: 'SIGNAL_STATE',
                                service: 'GLOBAL',
                                signals: {
                                    'cpu-high': { updatedAt: '2026-03-31T09:55:00.000Z' },
                                },
                                updatedAt: '2026-03-31T09:55:00.000Z',
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:lobby-v2:api-5xx',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: ControllerAction.Opened, service: 'GLOBAL' });
    });

    it('closes on all-clear', async () => {
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) return { Responses: { 'CircuitControl-test': [] } };
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:cpu-high',
                previousState: { value: 'ALARM' },
                state: { value: 'OK', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: ControllerAction.InitializedClosed, service: 'GLOBAL' });
    });

    it('HALF_OPEN closes on OK', async () => {
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'STATE#CURRENT',
                                entityType: 'BREAKER_STATE',
                                service: 'GLOBAL',
                                state: 'HALF_OPEN',
                                mode: 'protect',
                                updatedAt: '2026-03-31T09:58:00.000Z',
                                updatedBy: 'controller',
                                reason: 'cooldown_expired_probe',
                                holdUntil: '2026-03-31T10:05:00.000Z',
                                version: 2,
                                tripCount: 1,
                                healthyProbeCount: 0,
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:os-search-rejections',
                previousState: { value: 'ALARM' },
                state: { value: 'OK', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: ControllerAction.Closed, service: 'GLOBAL' });
    });

    it('HALF_OPEN first OK progress', async () => {
        // Production v1 default is 2 — closing on a single OK is the classic
        // flap pattern (recover one probe → close → traffic surges → collapse →
        // re-open). With threshold 2 the first healthy OK only increments the
        // probe counter; a second OK is required to close. See template.yaml
        // `BreakerSettingsJson` (HEALTHY_OK_EVENTS_TO_CLOSE) for the rationale.
        process.env.BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE = '2';
        process.env.BREAKER_STALE_EVENT_MS = '0';
        _resetSettingsCacheForTests();

        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'STATE#CURRENT',
                                entityType: 'BREAKER_STATE',
                                service: 'GLOBAL',
                                state: 'HALF_OPEN',
                                mode: 'protect',
                                updatedAt: '2026-03-31T09:58:00.000Z',
                                updatedBy: 'controller',
                                reason: 'cooldown_expired_probe',
                                holdUntil: '2026-03-31T10:05:00.000Z',
                                version: 2,
                                tripCount: 1,
                                healthyProbeCount: 0,
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:os-search-rejections',
                previousState: { value: 'ALARM' },
                state: { value: 'OK', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: ControllerAction.HalfOpenProgress, service: 'GLOBAL' });

        // The breaker stays HALF_OPEN with healthyProbeCount bumped to 1, ready
        // for the next OK to close it. holdUntil is preserved from the prior
        // state (probe window does not restart on a healthy probe).
        const txCommand = mockSend.mock.calls.find(([command]) => command instanceof TransactWriteCommand)?.[0];
        const items = getTransactItems(txCommand);
        const breakerState = items.find((i) => i.Put?.Item?.entityType === 'BREAKER_STATE')?.Put?.Item;
        expect(breakerState).toMatchObject({
            state: 'HALF_OPEN',
            mode: 'protect',
            healthyProbeCount: 1,
            holdUntil: '2026-03-31T10:05:00.000Z',
        });
    });

    it('HALF_OPEN second OK closes', async () => {
        // Continuation of the above: probeCount=1 already (from a prior OK),
        // a fresh OK arrives, threshold (2) is met, breaker closes. This is
        // the production v1 success path for HALF_OPEN → CLOSED via probes.
        process.env.BREAKER_HEALTHY_OK_EVENTS_TO_CLOSE = '2';
        process.env.BREAKER_STALE_EVENT_MS = '0';
        _resetSettingsCacheForTests();

        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'STATE#CURRENT',
                                entityType: 'BREAKER_STATE',
                                service: 'GLOBAL',
                                state: 'HALF_OPEN',
                                mode: 'protect',
                                updatedAt: '2026-03-31T09:58:00.000Z',
                                updatedBy: 'controller',
                                reason: 'half_open_progress:breaker:GLOBAL:os-search-rejections',
                                holdUntil: '2026-03-31T10:05:00.000Z',
                                version: 3,
                                tripCount: 1,
                                healthyProbeCount: 1,
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:os-search-rejections',
                previousState: { value: 'ALARM' },
                state: { value: 'OK', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: ControllerAction.Closed, service: 'GLOBAL' });
    });

    it('HALF_OPEN retrips on ALARM', async () => {
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'STATE#CURRENT',
                                entityType: 'BREAKER_STATE',
                                service: 'GLOBAL',
                                state: 'HALF_OPEN',
                                mode: 'protect',
                                updatedAt: '2026-03-31T09:58:00.000Z',
                                updatedBy: 'controller',
                                reason: 'cooldown_expired_probe',
                                holdUntil: '2026-03-31T10:05:00.000Z',
                                version: 2,
                                tripCount: 1,
                                healthyProbeCount: 0,
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:lobby-v2:api-p99',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: ControllerAction.HalfOpenRetried, service: 'GLOBAL' });
    });

    it('OPEN partial-clear on drop', async () => {
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'STATE#CURRENT',
                                entityType: 'BREAKER_STATE',
                                service: 'GLOBAL',
                                state: 'OPEN',
                                mode: 'protect',
                                updatedAt: '2026-03-31T09:55:00.000Z',
                                updatedBy: 'controller',
                                reason: 'compound_open:compound_warning:cpu-high,api-5xx',
                                holdUntil: '2026-03-31T10:10:00.000Z',
                                version: 1,
                                tripCount: 1,
                                healthyProbeCount: 0,
                            },
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'SIGNAL_STATE#CURRENT',
                                entityType: 'SIGNAL_STATE',
                                service: 'GLOBAL',
                                signals: {
                                    'cpu-high': { updatedAt: '2026-03-31T09:55:00.000Z' },
                                    'api-5xx': { updatedAt: '2026-03-31T09:56:00.000Z' },
                                },
                                updatedAt: '2026-03-31T09:56:00.000Z',
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:cpu-high',
                previousState: { value: 'ALARM' },
                state: { value: 'OK', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: ControllerAction.OpenPartialClear, service: 'GLOBAL' });
    });

    it('stale OPEN OK clears', async () => {
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'STATE#CURRENT',
                                entityType: 'BREAKER_STATE',
                                service: 'GLOBAL',
                                state: 'OPEN',
                                mode: 'protect',
                                updatedAt: '2026-03-31T07:55:00.000Z',
                                updatedBy: 'controller',
                                reason: 'compound_open:compound_warning:cpu-high,api-5xx',
                                // holdUntil expired 2 hours before the event time
                                holdUntil: '2026-03-31T08:00:00.000Z',
                                version: 3,
                                tripCount: 2,
                                healthyProbeCount: 0,
                            },
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'SIGNAL_STATE#CURRENT',
                                entityType: 'SIGNAL_STATE',
                                service: 'GLOBAL',
                                signals: {},
                                updatedAt: '2026-03-31T07:56:00.000Z',
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:cpu-high',
                previousState: { value: 'ALARM' },
                state: { value: 'OK', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        // Stale OPEN is discarded — no prior state → initialized_closed, not open_partial_clear
        expect(result).toEqual({ action: ControllerAction.InitializedClosed, service: 'GLOBAL' });
    });

    it('stale OPEN ALARM reopens', async () => {
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'STATE#CURRENT',
                                entityType: 'BREAKER_STATE',
                                service: 'GLOBAL',
                                state: 'OPEN',
                                mode: 'protect',
                                updatedAt: '2026-03-31T07:55:00.000Z',
                                updatedBy: 'controller',
                                reason: 'compound_open:compound_warning:cpu-high,api-5xx',
                                holdUntil: '2026-03-31T08:00:00.000Z',
                                version: 3,
                                tripCount: 2,
                                healthyProbeCount: 0,
                            },
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'SIGNAL_STATE#CURRENT',
                                entityType: 'SIGNAL_STATE',
                                service: 'GLOBAL',
                                signals: {
                                    'cpu-high': { updatedAt: '2026-03-31T09:58:00.000Z' },
                                    'api-5xx': { updatedAt: '2026-03-31T09:59:00.000Z' },
                                },
                                updatedAt: '2026-03-31T09:59:00.000Z',
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:cpu-high',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        // Stale OPEN discarded → treated as fresh trip, NOT open_sustained
        expect(result).toEqual({ action: ControllerAction.Opened, service: 'GLOBAL' });
    });

    it('stale HALF_OPEN OK clears', async () => {
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'STATE#CURRENT',
                                entityType: 'BREAKER_STATE',
                                service: 'GLOBAL',
                                state: 'HALF_OPEN',
                                mode: 'protect',
                                updatedAt: '2026-03-31T07:55:00.000Z',
                                updatedBy: 'controller',
                                reason: 'cooldown_expired_probe',
                                holdUntil: '2026-03-31T08:00:00.000Z',
                                version: 4,
                                tripCount: 2,
                                healthyProbeCount: 0,
                            },
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'SIGNAL_STATE#CURRENT',
                                entityType: 'SIGNAL_STATE',
                                service: 'GLOBAL',
                                signals: {},
                                updatedAt: '2026-03-31T07:56:00.000Z',
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:cpu-high',
                previousState: { value: 'ALARM' },
                state: { value: 'OK', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        // Stale HALF_OPEN discarded → no prior state → initialized_closed, NOT half_open_progress
        expect(result).toEqual({ action: ControllerAction.InitializedClosed, service: 'GLOBAL' });
    });

    it('stale HALF_OPEN ALARM trips', async () => {
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'STATE#CURRENT',
                                entityType: 'BREAKER_STATE',
                                service: 'GLOBAL',
                                state: 'HALF_OPEN',
                                mode: 'protect',
                                updatedAt: '2026-03-31T07:55:00.000Z',
                                updatedBy: 'controller',
                                reason: 'cooldown_expired_probe',
                                holdUntil: '2026-03-31T08:00:00.000Z',
                                version: 4,
                                tripCount: 2,
                                healthyProbeCount: 0,
                            },
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'SIGNAL_STATE#CURRENT',
                                entityType: 'SIGNAL_STATE',
                                service: 'GLOBAL',
                                signals: {
                                    'cpu-high': { updatedAt: '2026-03-31T09:58:00.000Z' },
                                    'api-5xx': { updatedAt: '2026-03-31T09:59:00.000Z' },
                                },
                                updatedAt: '2026-03-31T09:59:00.000Z',
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:cpu-high',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        // Stale HALF_OPEN discarded → fresh trip, NOT half_open_retripped
        expect(result).toEqual({ action: ControllerAction.Opened, service: 'GLOBAL' });
    });

    it('removes signal on OK', async () => {
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'SIGNAL_STATE#CURRENT',
                                entityType: 'SIGNAL_STATE',
                                service: 'GLOBAL',
                                signals: {
                                    'cpu-high': { updatedAt: '2026-03-31T09:55:00.000Z' },
                                },
                                updatedAt: '2026-03-31T09:55:00.000Z',
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:cpu-high',
                previousState: { value: 'ALARM' },
                state: { value: 'OK', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        const txCommand = mockSend.mock.calls.find(([command]) => command instanceof TransactWriteCommand)?.[0];
        const items = getTransactItems(txCommand);
        const signalState = items.find((item) => item.Put?.Item?.entityType === 'SIGNAL_STATE')?.Put?.Item;

        expect(signalState).toMatchObject({
            service: 'GLOBAL',
            signals: {},
        });
    });

    it('INSUFFICIENT_DATA clears signal', async () => {
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'SIGNAL_STATE#CURRENT',
                                entityType: 'SIGNAL_STATE',
                                service: 'GLOBAL',
                                signals: {
                                    'cpu-high': { updatedAt: '2026-03-31T09:55:00.000Z' },
                                    'api-5xx': { updatedAt: '2026-03-31T09:56:00.000Z' },
                                },
                                updatedAt: '2026-03-31T09:56:00.000Z',
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:lobby-v2:api-5xx',
                previousState: { value: 'ALARM' },
                state: { value: 'INSUFFICIENT_DATA', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: ControllerAction.InitializedClosed, service: 'GLOBAL' });

        const txCommand = mockSend.mock.calls.find(([command]) => command instanceof TransactWriteCommand)?.[0];
        const items = getTransactItems(txCommand);
        const signalState = items.find((item) => item.Put?.Item?.entityType === 'SIGNAL_STATE')?.Put?.Item;

        expect(signalState).toMatchObject({
            service: 'GLOBAL',
            signals: {
                'cpu-high': { updatedAt: '2026-03-31T09:55:00.000Z' },
            },
        });
        expect((signalState?.signals as Record<string, unknown>)['api-5xx']).toBeUndefined();
    });

    it('tick HALF_OPEN timeout reopen', async () => {
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'STATE#CURRENT',
                                entityType: 'BREAKER_STATE',
                                service: 'GLOBAL',
                                state: 'HALF_OPEN',
                                mode: 'protect',
                                updatedAt: '2026-03-31T09:58:00.000Z',
                                updatedBy: 'controller',
                                reason: 'cooldown_expired_probe',
                                holdUntil: '2026-03-31T10:01:00.000Z',
                                version: 3,
                                tripCount: 1,
                                healthyProbeCount: 0,
                            },
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'SIGNAL_STATE#CURRENT',
                                entityType: 'SIGNAL_STATE',
                                service: 'GLOBAL',
                                signals: { 'os-search-rejections': { updatedAt: '2026-03-31T09:50:00.000Z' } },
                                updatedAt: '2026-03-31T09:50:00.000Z',
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.scheduler',
            'detail-type': 'Scheduled Event',
            time: '2026-03-31T10:02:00.000Z',
            detail: {},
        });

        expect(result).toEqual({ action: ControllerAction.HalfOpenTimeout, transitioned: 1 });

        const txCommand = mockSend.mock.calls.find(([command]) => command instanceof TransactWriteCommand)?.[0];
        const items = getTransactItems(txCommand);
        const signalStateItem = items.find((i) => i.Put?.Item?.entityType === 'SIGNAL_STATE')?.Put?.Item;
        expect(signalStateItem).toMatchObject({
            PK: 'BREAKER#GLOBAL',
            SK: 'SIGNAL_STATE#CURRENT',
            service: 'GLOBAL',
            signals: { 'os-search-rejections': expect.any(Object) },
        });
    });

    it('tick no-op no breaker', async () => {
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return { Responses: { 'CircuitControl-test': [] } };
            }
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.scheduler',
            'detail-type': 'Scheduled Event',
            time: '2026-03-31T10:00:00.000Z',
            detail: {},
        });

        expect(result).toEqual({ action: ControllerAction.TickNoOp, transitioned: 0 });
    });

    it('tick rethrows DDB errors', async () => {
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                throw new Error('ProvisionedThroughputExceededException');
            }
            throw new Error('Unexpected command');
        });

        await expect(
            lambdaHandler({
                source: 'aws.scheduler',
                'detail-type': 'Scheduled Event',
                time: '2026-03-31T10:00:00.000Z',
                detail: {},
            }),
        ).rejects.toThrow('ProvisionedThroughputExceededException');
    });

    it('tick HALF_OPEN timeout close', async () => {
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'STATE#CURRENT',
                                entityType: 'BREAKER_STATE',
                                service: 'GLOBAL',
                                state: 'HALF_OPEN',
                                mode: 'protect',
                                updatedAt: '2026-03-31T09:58:00.000Z',
                                updatedBy: 'controller',
                                reason: 'cooldown_expired_probe',
                                holdUntil: '2026-03-31T10:01:00.000Z',
                                version: 3,
                                tripCount: 1,
                                healthyProbeCount: 0,
                            },
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'SIGNAL_STATE#CURRENT',
                                entityType: 'SIGNAL_STATE',
                                service: 'GLOBAL',
                                signals: {},
                                updatedAt: '2026-03-31T09:55:00.000Z',
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.scheduler',
            'detail-type': 'Scheduled Event',
            time: '2026-03-31T10:02:00.000Z',
            detail: {},
        });

        expect(result).toEqual({ action: ControllerAction.HalfOpenTimeout, transitioned: 1 });

        const txCommand = mockSend.mock.calls.find(([command]) => command instanceof TransactWriteCommand)?.[0];
        const items = getTransactItems(txCommand);
        const currentState = items.find((item) => item.Put?.Item?.entityType === 'BREAKER_STATE')?.Put?.Item;

        expect(currentState).toMatchObject({
            service: 'GLOBAL',
            state: 'CLOSED',
            mode: 'normal',
            reason: ControllerAction.HalfOpenTimeout,
        });
        expect(currentState?.holdUntil).toBeUndefined();

        const signalStateItem = items.find((i) => i.Put?.Item?.entityType === 'SIGNAL_STATE')?.Put?.Item;
        expect(signalStateItem).toMatchObject({
            PK: 'BREAKER#GLOBAL',
            SK: 'SIGNAL_STATE#CURRENT',
            service: 'GLOBAL',
            signals: {},
        });
    });

    it('prunes stale signals', async () => {
        // A zombie signal sits in the map from 30 minutes ago (well past the
        // default staleEventMs=10m × 2 prune window). A fresh incoming ALARM
        // for a different signal should not tip the breaker into a compound
        // warning, because the zombie should be dropped during severity eval.
        jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-31T10:30:00.000Z').getTime());
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'SIGNAL_STATE#CURRENT',
                                entityType: 'SIGNAL_STATE',
                                service: 'GLOBAL',
                                signals: {
                                    'cpu-high': { updatedAt: '2026-03-31T10:00:00.000Z' }, // zombie: 30m old
                                },
                                updatedAt: '2026-03-31T10:00:00.000Z',
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:30:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:lobby-v2:api-p99',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-03-31T10:30:00.000Z' },
            },
        });

        // Zombie pruned → only api-p99 active → single warning → no compound trip.
        expect(result).toEqual({ action: ControllerAction.InitializedClosed, service: 'GLOBAL' });

        // Written SIGNAL_STATE should NOT contain the pruned cpu-high zombie.
        const txCommand = mockSend.mock.calls.find(([command]) => command instanceof TransactWriteCommand)?.[0];
        const items = getTransactItems(txCommand);
        const signalState = items.find((i) => i.Put?.Item?.entityType === 'SIGNAL_STATE')?.Put?.Item;
        expect(signalState?.signals).toMatchObject({ 'api-p99': expect.any(Object) });
        expect((signalState?.signals as Record<string, unknown>)['cpu-high']).toBeUndefined();
    });

    it('tick prunes zombie signals', async () => {
        // Breaker is HALF_OPEN, holdUntil expired, one zombie signal in the map
        // from 30 minutes ago. Without pruning, the tick would see signals and
        // reopen. With pruning, it should close (no real active signals remain).
        jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-31T10:30:00.000Z').getTime());
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'STATE#CURRENT',
                                entityType: 'BREAKER_STATE',
                                service: 'GLOBAL',
                                state: 'HALF_OPEN',
                                mode: 'protect',
                                updatedAt: '2026-03-31T10:25:00.000Z',
                                updatedBy: 'controller',
                                reason: 'cooldown_expired_probe',
                                holdUntil: '2026-03-31T10:27:00.000Z',
                                version: 3,
                                tripCount: 1,
                                healthyProbeCount: 0,
                            },
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'SIGNAL_STATE#CURRENT',
                                entityType: 'SIGNAL_STATE',
                                service: 'GLOBAL',
                                signals: {
                                    'cpu-high': { updatedAt: '2026-03-31T10:00:00.000Z' }, // 30m old zombie
                                },
                                updatedAt: '2026-03-31T10:00:00.000Z',
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.scheduler',
            'detail-type': 'Scheduled Event',
            time: '2026-03-31T10:30:00.000Z',
            detail: {},
        });

        expect(result).toEqual({ action: ControllerAction.HalfOpenTimeout, transitioned: 1 });

        const txCommand = mockSend.mock.calls.find(([command]) => command instanceof TransactWriteCommand)?.[0];
        const items = getTransactItems(txCommand);
        const currentState = items.find((i) => i.Put?.Item?.entityType === 'BREAKER_STATE')?.Put?.Item;

        // Zombie pruned → no active signals → close the breaker, not reopen.
        expect(currentState).toMatchObject({
            state: 'CLOSED',
            mode: 'normal',
            reason: ControllerAction.HalfOpenTimeout,
        });

        // Pruned SIGNAL_STATE (zombie removed) must be written atomically with the transition.
        const signalStateItem = items.find((i) => i.Put?.Item?.entityType === 'SIGNAL_STATE')?.Put?.Item;
        expect(signalStateItem).toMatchObject({
            PK: 'BREAKER#GLOBAL',
            SK: 'SIGNAL_STATE#CURRENT',
            service: 'GLOBAL',
            signals: {},
        });
        expect((signalStateItem?.signals as Record<string, unknown>)?.['cpu-high']).toBeUndefined();
    });

    it('guards first-ever write', async () => {
        // When no STATE#CURRENT exists yet, the ConditionExpression should be
        // `attribute_not_exists(PK)` so two concurrent first-writes cannot
        // both succeed (one wins, the loser retries against the fresh state).
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) return { Responses: { 'CircuitControl-test': [] } };
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-04-21T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:os-search-rejections',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-04-21T10:00:00.000Z' },
            },
        });

        const txCommand = mockSend.mock.calls.find(([command]) => command instanceof TransactWriteCommand)?.[0];
        const items = getTransactItems(txCommand);
        const breakerPut = items.find((i) => i.Put?.Item?.entityType === 'BREAKER_STATE')?.Put;
        expect(breakerPut?.ConditionExpression).toMatch(/attribute_not_exists\(/);
        const notExistsNames = Object.values(breakerPut?.ExpressionAttributeNames ?? {});
        expect(notExistsNames).toContain('PK');
        expect(breakerPut?.ExpressionAttributeValues).toBeUndefined();
    });

    it('guards version condition', async () => {
        // When STATE#CURRENT already exists the write must require the stored
        // `version` still equal the one we observed during the BatchGet,
        // otherwise a racing writer could silently overwrite our decision.
        process.env.BREAKER_STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return {
                    Responses: {
                        'CircuitControl-test': [
                            {
                                PK: 'BREAKER#GLOBAL',
                                SK: 'STATE#CURRENT',
                                entityType: 'BREAKER_STATE',
                                service: 'GLOBAL',
                                state: 'HALF_OPEN',
                                mode: 'protect',
                                updatedAt: '2026-04-21T09:58:00.000Z',
                                updatedBy: 'controller',
                                reason: 'cooldown_expired_probe',
                                holdUntil: '2026-04-21T10:05:00.000Z',
                                version: 7,
                                tripCount: 1,
                                healthyProbeCount: 0,
                            },
                        ],
                    },
                };
            }
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-04-21T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:os-search-rejections',
                previousState: { value: 'ALARM' },
                state: { value: 'OK', timestamp: '2026-04-21T10:00:00.000Z' },
            },
        });

        const txCommand = mockSend.mock.calls.find(([command]) => command instanceof TransactWriteCommand)?.[0];
        const items = getTransactItems(txCommand);
        const breakerPut = items.find((i) => i.Put?.Item?.entityType === 'BREAKER_STATE')?.Put;
        const versionNames = Object.values(breakerPut?.ExpressionAttributeNames ?? {});
        const versionValues = Object.values(breakerPut?.ExpressionAttributeValues ?? {});
        expect(breakerPut?.ConditionExpression).toMatch(/=/);
        expect(versionNames).toContain('version');
        expect(versionValues).toContain(7);
    });

    it('retries on version conflict', async () => {
        // First TransactWrite attempt fails with the exact shape the SDK emits
        // for a cancelled transaction where a ConditionExpression rejected an
        // item. The handler should re-run the full read-compute-write and the
        // second attempt should commit. Two TransactWrites + two BatchGets
        // (one per attempt) prove we truly re-read the fresh state.
        process.env.BREAKER_STALE_EVENT_MS = '0';
        let attempts = 0;
        let batchGets = 0;
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                batchGets += 1;
                return { Responses: { 'CircuitControl-test': [] } };
            }
            if (command instanceof TransactWriteCommand) {
                attempts += 1;
                if (attempts === 1) {
                    const err = Object.assign(new Error('conflict'), {
                        name: 'TransactionCanceledException',
                        CancellationReasons: [{ Code: 'None' }, { Code: 'ConditionalCheckFailed' }],
                    });
                    throw err;
                }
                return {};
            }
            throw new Error('Unexpected command');
        });

        const result = await lambdaHandler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-04-21T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:os-search-rejections',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-04-21T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: ControllerAction.Opened, service: 'GLOBAL' });
        expect(attempts).toBe(2);
        expect(batchGets).toBe(2);
    });

    it('rethrows after retry', async () => {
        // Both attempts fail with ConditionalCheckFailed → handler gives up,
        // throws. The Lambda DLQ (configured in template.yaml) catches it.
        // We intentionally don't retry-loop: continuous conflict means an
        // alarm storm, which we want to surface loudly rather than mask.
        process.env.BREAKER_STALE_EVENT_MS = '0';
        let attempts = 0;
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) return { Responses: { 'CircuitControl-test': [] } };
            if (command instanceof TransactWriteCommand) {
                attempts += 1;
                const err = Object.assign(new Error('conflict'), {
                    name: 'TransactionCanceledException',
                    CancellationReasons: [{ Code: 'None' }, { Code: 'ConditionalCheckFailed' }],
                });
                throw err;
            }
            throw new Error('Unexpected command');
        });

        await expect(
            lambdaHandler({
                source: 'aws.cloudwatch',
                'detail-type': 'CloudWatch Alarm State Change',
                time: '2026-04-21T10:00:00.000Z',
                detail: {
                    alarmName: 'breaker:GLOBAL:os-search-rejections',
                    previousState: { value: 'OK' },
                    state: { value: 'ALARM', timestamp: '2026-04-21T10:00:00.000Z' },
                },
            }),
        ).rejects.toThrow('conflict');

        expect(attempts).toBe(2);
    });

    it('no retry unrelated errors', async () => {
        // A cancelled transaction whose reasons do NOT include
        // ConditionalCheckFailed (e.g. ThrottlingError, ItemCollectionSizeLimit)
        // is not a race — retrying it would just compound the problem.
        // Surface it immediately.
        process.env.BREAKER_STALE_EVENT_MS = '0';
        let attempts = 0;
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) return { Responses: { 'CircuitControl-test': [] } };
            if (command instanceof TransactWriteCommand) {
                attempts += 1;
                const err = Object.assign(new Error('throttled'), {
                    name: 'TransactionCanceledException',
                    CancellationReasons: [{ Code: 'None' }, { Code: 'ThrottlingError' }],
                });
                throw err;
            }
            throw new Error('Unexpected command');
        });

        await expect(
            lambdaHandler({
                source: 'aws.cloudwatch',
                'detail-type': 'CloudWatch Alarm State Change',
                time: '2026-04-21T10:00:00.000Z',
                detail: {
                    alarmName: 'breaker:GLOBAL:os-search-rejections',
                    previousState: { value: 'OK' },
                    state: { value: 'ALARM', timestamp: '2026-04-21T10:00:00.000Z' },
                },
            }),
        ).rejects.toThrow('throttled');

        expect(attempts).toBe(1);
    });

    it('manually writes no holdUntil', async () => {
        // Manual-override path; service is intentionally kept free-form.
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof GetCommand) return { Item: undefined };
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        await setBreakerStateManually({
            service: 'GetGamesFunction',
            state: 'OPEN',
            reason: 'no-holdUntil',
            actor: 'operator',
        });

        const txCommand = mockSend.mock.calls[1][0];
        const items = getTransactItems(txCommand);
        const breakerItem = items.find((item) => item.Put?.Item?.entityType === 'BREAKER_STATE')?.Put?.Item;
        expect(breakerItem).toMatchObject({
            state: 'OPEN',
            mode: 'protect',
            updatedBy: 'operator',
        });
    });
});
