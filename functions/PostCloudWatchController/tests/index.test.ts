import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { BatchGetCommand, GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { handler, setBreakerStateManually } from '../src/index';

const mockSend = jest.fn();

jest.mock('../src/db', () => ({
    getDdbClient: jest.fn(() => ({ send: mockSend })),
}));

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
    return ((command as CommandWithInput).input?.TransactItems ?? []) as TransactPut[];
}

// NOTE on test naming and routing.
//
// Every alarm-driven test below uses alarm names in the production shape
// (`breaker:GLOBAL:[...label...]:<signal>`) and asserts that the handler routes
// to the single `BREAKER#GLOBAL` partition. That matches the defensive-collapse
// behaviour in parseAlarmName — see the comment block on that function in
// src/index.ts for the design rationale.
//
// The setBreakerStateManually tests intentionally still pass `service: 'GetGamesFunction'`
// to exercise the manual-override escape hatch — which DOES accept any service
// on purpose, so operators can reach non-GLOBAL partitions if needed.

describe('PostCloudWatchController handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.TABLE_NAME = 'CircuitControl-test';
        process.env.STALE_EVENT_MS = '600000';
        process.env.AWS_REGION = 'eu-west-1';
    });

    afterEach(() => {
        delete process.env.TABLE_NAME;
        delete process.env.STALE_EVENT_MS;
        delete process.env.AWS_REGION;
        jest.restoreAllMocks();
    });

    it('opens the breaker when a critical alarm enters ALARM', async () => {
        process.env.STALE_EVENT_MS = '0';

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

        const result = await handler(event);

        expect(result).toEqual({ action: 'opened', service: 'GLOBAL' });
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
            reason: 'compound_open:critical_signal:os-search-rejections',
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

    it('ignores stale alarm events without writing to DynamoDB', async () => {
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

        const result = await handler(event);

        expect(result).toEqual({ action: 'ignored_stale_event', service: 'GLOBAL' });
        expect(mockSend).not.toHaveBeenCalled();
    });

    it('moves expired open breakers to HALF_OPEN on scheduled ticks', async () => {
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

        const result = await handler({
            source: 'aws.scheduler',
            'detail-type': 'Scheduled Event',
            time: '2026-03-31T10:02:00.000Z',
            detail: {},
        });

        expect(result).toEqual({
            action: 'scheduled_recovery_tick',
            transitioned: 1,
        });

        const txCommand = mockSend.mock.calls.find(([command]) => command instanceof TransactWriteCommand)?.[0];
        const items = getTransactItems(txCommand);
        const currentState = items.find((item) => item.Put?.Item?.entityType === 'BREAKER_STATE')?.Put?.Item;

        expect(currentState).toMatchObject({
            service: 'GLOBAL',
            state: 'HALF_OPEN',
            mode: 'protect',
            reason: 'cooldown_expired_probe',
            holdUntil: '2026-03-31T10:04:00.000Z',
        });
    });

    it('returns ignored_unknown_event for unsupported sources', async () => {
        const result = await handler({
            source: 'custom.source',
            'detail-type': 'Other Event',
            time: '2026-03-31T10:00:00.000Z',
            detail: {},
        });

        expect(result).toEqual({ action: 'ignored_unknown_event' });
        expect(mockSend).not.toHaveBeenCalled();
    });

    it('setBreakerStateManually forces the breaker state with actor attribution', async () => {
        // Manual-override path: operators can target any service partition,
        // including non-GLOBAL ones. This is the intentional escape hatch
        // (see setBreakerStateManually in src/index.ts).
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

    it('throws when TABLE_NAME is missing', async () => {
        delete process.env.TABLE_NAME;

        await expect(
            handler({
                source: 'aws.cloudwatch',
                'detail-type': 'CloudWatch Alarm State Change',
                time: '2026-03-31T10:00:00.000Z',
                detail: {
                    alarmName: 'breaker:GLOBAL:cpu-high',
                    previousState: { value: 'OK' },
                    state: { value: 'ALARM', timestamp: '2026-03-31T10:00:00.000Z' },
                },
            }),
        ).rejects.toThrow('Missing required environment variable: TABLE_NAME');
    });

    it('routes a 4-part alarm name to BREAKER#GLOBAL and extracts the trailing signal', async () => {
        // Template-emitted shape: `breaker:GLOBAL:<label>:<signal>`. The <label>
        // segment (e.g. the API name) is informational and must not alter routing.
        process.env.STALE_EVENT_MS = '0';
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

        const result = await handler({
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
        expect(result).toEqual({ action: 'opened', service: 'GLOBAL' });
        expect(pkKeysRead.every((pk) => pk === 'BREAKER#GLOBAL')).toBe(true);
    });

    it('defensively routes a non-GLOBAL alarm name to BREAKER#GLOBAL (template-drift guard)', async () => {
        // Suppose a future template edit ships `breaker:lobby-v2:api-p99` by
        // accident (missing the GLOBAL segment). Without the defensive collapse
        // this would create a stuck non-GLOBAL partition. Assert it still
        // routes to BREAKER#GLOBAL instead.
        process.env.STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) return { Responses: { 'CircuitControl-test': [] } };
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await handler({
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

    it('handles alarm names with 2 parts by collapsing service to GLOBAL', async () => {
        process.env.STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) return { Responses: { 'CircuitControl-test': [] } };
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await handler({
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

    it('handles alarm names with no colon as GLOBAL', async () => {
        process.env.STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) return { Responses: { 'CircuitControl-test': [] } };
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await handler({
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

    it('keeps breaker CLOSED for a single warning signal', async () => {
        process.env.STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) return { Responses: { 'CircuitControl-test': [] } };
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await handler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:lobby-v2:api-p99',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: 'initialized_closed', service: 'GLOBAL' });
    });

    it('opens breaker on compound warning score with two warning alarms', async () => {
        process.env.STALE_EVENT_MS = '0';
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

        const result = await handler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:lobby-v2:api-5xx',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: 'opened', service: 'GLOBAL' });
    });

    it('handles all-clear path when an alarm transitions to OK', async () => {
        process.env.STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) return { Responses: { 'CircuitControl-test': [] } };
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        const result = await handler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:cpu-high',
                previousState: { value: 'ALARM' },
                state: { value: 'OK', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: 'initialized_closed', service: 'GLOBAL' });
    });

    it('closes HALF_OPEN breaker on OK event', async () => {
        process.env.STALE_EVENT_MS = '0';
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

        const result = await handler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:os-search-rejections',
                previousState: { value: 'ALARM' },
                state: { value: 'OK', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: 'closed', service: 'GLOBAL' });
    });

    it('retrips HALF_OPEN breaker when an alarm comes back', async () => {
        process.env.STALE_EVENT_MS = '0';
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

        const result = await handler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:lobby-v2:api-p99',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: 'half_open_retripped', service: 'GLOBAL' });
    });

    it('keeps OPEN breaker in open_partial_clear when severity drops below open threshold', async () => {
        process.env.STALE_EVENT_MS = '0';
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

        const result = await handler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:cpu-high',
                previousState: { value: 'ALARM' },
                state: { value: 'OK', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: 'open_partial_clear', service: 'GLOBAL' });
    });

    it('removes a signal from SIGNAL_STATE when the alarm returns to OK', async () => {
        process.env.STALE_EVENT_MS = '0';
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

        await handler({
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

    it('treats INSUFFICIENT_DATA as an inactive signal in SIGNAL_STATE', async () => {
        process.env.STALE_EVENT_MS = '0';
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

        const result = await handler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-03-31T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:lobby-v2:api-5xx',
                previousState: { value: 'ALARM' },
                state: { value: 'INSUFFICIENT_DATA', timestamp: '2026-03-31T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: 'initialized_closed', service: 'GLOBAL' });

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

    it('scheduled tick re-opens expired HALF_OPEN breakers when signals still active', async () => {
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

        const result = await handler({
            source: 'aws.scheduler',
            'detail-type': 'Scheduled Event',
            time: '2026-03-31T10:02:00.000Z',
            detail: {},
        });

        expect(result).toEqual({ action: 'scheduled_recovery_tick', transitioned: 1 });
    });

    it('scheduled tick returns no-op when no active breaker exists', async () => {
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                return { Responses: { 'CircuitControl-test': [] } };
            }
            throw new Error('Unexpected command');
        });

        const result = await handler({
            source: 'aws.scheduler',
            'detail-type': 'Scheduled Event',
            time: '2026-03-31T10:00:00.000Z',
            detail: {},
        });

        expect(result).toEqual({ action: 'scheduled_recovery_tick', transitioned: 0 });
    });

    it('scheduled tick rethrows unexpected DynamoDB errors', async () => {
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) {
                throw new Error('ProvisionedThroughputExceededException');
            }
            throw new Error('Unexpected command');
        });

        await expect(
            handler({
                source: 'aws.scheduler',
                'detail-type': 'Scheduled Event',
                time: '2026-03-31T10:00:00.000Z',
                detail: {},
            }),
        ).rejects.toThrow('ProvisionedThroughputExceededException');
    });

    it('scheduled tick closes expired HALF_OPEN breakers when no active signals', async () => {
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

        const result = await handler({
            source: 'aws.scheduler',
            'detail-type': 'Scheduled Event',
            time: '2026-03-31T10:02:00.000Z',
            detail: {},
        });

        expect(result).toEqual({ action: 'scheduled_recovery_tick', transitioned: 1 });

        const txCommand = mockSend.mock.calls.find(([command]) => command instanceof TransactWriteCommand)?.[0];
        const items = getTransactItems(txCommand);
        const currentState = items.find((item) => item.Put?.Item?.entityType === 'BREAKER_STATE')?.Put?.Item;

        expect(currentState).toMatchObject({
            service: 'GLOBAL',
            state: 'CLOSED',
            mode: 'normal',
            reason: 'half_open_timeout_no_signals',
        });
        expect(currentState?.holdUntil).toBeUndefined();
    });

    it('prunes stale signals from SIGNAL_STATE before computing severity', async () => {
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

        const result = await handler({
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
        expect(result).toEqual({ action: 'initialized_closed', service: 'GLOBAL' });

        // Written SIGNAL_STATE should NOT contain the pruned cpu-high zombie.
        const txCommand = mockSend.mock.calls.find(([command]) => command instanceof TransactWriteCommand)?.[0];
        const items = getTransactItems(txCommand);
        const signalState = items.find((i) => i.Put?.Item?.entityType === 'SIGNAL_STATE')?.Put?.Item;
        expect(signalState?.signals).toMatchObject({ 'api-p99': expect.any(Object) });
        expect((signalState?.signals as Record<string, unknown>)['cpu-high']).toBeUndefined();
    });

    it('scheduled tick prunes zombie signals before the HALF_OPEN expiry decision', async () => {
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

        const result = await handler({
            source: 'aws.scheduler',
            'detail-type': 'Scheduled Event',
            time: '2026-03-31T10:30:00.000Z',
            detail: {},
        });

        expect(result).toEqual({ action: 'scheduled_recovery_tick', transitioned: 1 });

        const txCommand = mockSend.mock.calls.find(([command]) => command instanceof TransactWriteCommand)?.[0];
        const items = getTransactItems(txCommand);
        const currentState = items.find((i) => i.Put?.Item?.entityType === 'BREAKER_STATE')?.Put?.Item;

        // Zombie pruned → no active signals → close the breaker, not reopen.
        expect(currentState).toMatchObject({
            state: 'CLOSED',
            mode: 'normal',
            reason: 'half_open_timeout_no_signals',
        });
    });

    it('guards the first-ever breaker write with attribute_not_exists(PK)', async () => {
        // When no STATE#CURRENT exists yet, the ConditionExpression should be
        // `attribute_not_exists(PK)` so two concurrent first-writes cannot
        // both succeed (one wins, the loser retries against the fresh state).
        process.env.STALE_EVENT_MS = '0';
        mockSend.mockImplementation(async (command: unknown) => {
            if (command instanceof BatchGetCommand) return { Responses: { 'CircuitControl-test': [] } };
            if (command instanceof TransactWriteCommand) return {};
            throw new Error('Unexpected command');
        });

        await handler({
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
        expect(breakerPut?.ConditionExpression).toBe('attribute_not_exists(PK)');
        expect(breakerPut?.ExpressionAttributeValues).toBeUndefined();
    });

    it('guards a breaker update with a version-based ConditionExpression', async () => {
        // When STATE#CURRENT already exists the write must require the stored
        // `version` still equal the one we observed during the BatchGet,
        // otherwise a racing writer could silently overwrite our decision.
        process.env.STALE_EVENT_MS = '0';
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

        await handler({
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
        expect(breakerPut?.ConditionExpression).toBe('#v = :prevVersion');
        expect(breakerPut?.ExpressionAttributeNames).toEqual({ '#v': 'version' });
        expect(breakerPut?.ExpressionAttributeValues).toEqual({ ':prevVersion': 7 });
    });

    it('retries once when the first transact-write loses the version guard', async () => {
        // First TransactWrite attempt fails with the exact shape the SDK emits
        // for a cancelled transaction where a ConditionExpression rejected an
        // item. The handler should re-run the full read-compute-write and the
        // second attempt should commit. Two TransactWrites + two BatchGets
        // (one per attempt) prove we truly re-read the fresh state.
        process.env.STALE_EVENT_MS = '0';
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

        const result = await handler({
            source: 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            time: '2026-04-21T10:00:00.000Z',
            detail: {
                alarmName: 'breaker:GLOBAL:os-search-rejections',
                previousState: { value: 'OK' },
                state: { value: 'ALARM', timestamp: '2026-04-21T10:00:00.000Z' },
            },
        });

        expect(result).toEqual({ action: 'opened', service: 'GLOBAL' });
        expect(attempts).toBe(2);
        expect(batchGets).toBe(2);
    });

    it('stops after one retry and rethrows if the race persists', async () => {
        // Both attempts fail with ConditionalCheckFailed → handler gives up,
        // throws. The Lambda DLQ (configured in template.yaml) catches it.
        // We intentionally don't retry-loop: continuous conflict means an
        // alarm storm, which we want to surface loudly rather than mask.
        process.env.STALE_EVENT_MS = '0';
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
            handler({
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

    it('does not retry on unrelated TransactionCanceledException reasons', async () => {
        // A cancelled transaction whose reasons do NOT include
        // ConditionalCheckFailed (e.g. ThrottlingError, ItemCollectionSizeLimit)
        // is not a race — retrying it would just compound the problem.
        // Surface it immediately.
        process.env.STALE_EVENT_MS = '0';
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
            handler({
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

    it('setBreakerStateManually without holdUntil writes breaker state', async () => {
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
