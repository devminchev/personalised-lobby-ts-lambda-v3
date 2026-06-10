import { jest, describe, beforeEach, it, expect, beforeAll } from '@jest/globals';
import { Client } from '@opensearch-project/opensearch';
import { getClient } from '../lib/osClient';

jest.mock('@opensearch-project/opensearch', () => {
    return {
        Client: jest.fn(),
    };
});

// Stub BreakerClient so getClient() doesn't trigger real DDB calls.
jest.mock('../lib/breakerClient', () => ({
    BreakerClient: jest.fn().mockImplementation(() => ({
        init: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        withOsCall: jest.fn(<T>(fn: () => Promise<T>) => fn()),
        getGlobalState: jest.fn().mockReturnValue('CLOSED'),
    })),
    BreakerOpenError: class BreakerOpenError extends Error {},
    SlowOsCallError: class SlowOsCallError extends Error {},
}));

const MockedClient = Client as jest.MockedClass<typeof Client>;

describe('getClient', () => {
    beforeAll(() => {
        process.env.HOST = 'http://localhost:9200';
        process.env.OS_USER = 'test-user';
        process.env.OS_PASS = 'test-pass';
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it('should return a Client instance and call the constructor with correct parameters the first time', () => {
        const client = getClient();
        expect(MockedClient).toHaveBeenCalledTimes(1);
        expect(client).toBeInstanceOf(Client);
        expect(MockedClient).toHaveBeenCalledWith({
            node: process.env.HOST,
            auth: {
                username: process.env.OS_USER,
                password: process.env.OS_PASS,
            },
            agent: {
                keepAlive: true,
                keepAliveMsecs: 240000,
                maxSockets: 50,
            },
        });
    });

    it('should return the same Client instance when called multiple times', () => {
        const client1 = getClient();
        const client2 = getClient();
        expect(client1).toBe(client2);
    });
});
