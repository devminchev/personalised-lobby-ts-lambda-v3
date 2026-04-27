import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { ErrorCode, GAME_V2_TYPE, IG_GAMES_V2_WRITE_ALIAS, logMessage } from 'os-client';
import { indexToOpenSearch } from '../lib/writeToOS';

jest.mock('os-client', () => {
    const actual = jest.requireActual<typeof import('os-client')>('os-client');
    return {
        ...actual,
        logMessage: jest.fn(),
    };
});

const logMessageMock = jest.mocked(logMessage);

const makePayload = () => ({
    id: 'game-1',
    cmsEnv: 'staging',
    contentType: GAME_V2_TYPE,
    updatedAt: '2026-01-10T10:00:00.000Z',
    createdAt: '2026-01-09T10:00:00.000Z',
    cmsChangeVersion: 7,
    entryTitle: 'Mega Spin Entry',
    gameName: 'Mega Spin',
    gameSkin: 'mega-skin',
    mobileGameName: 'Mega Spin Mobile',
    mobileGameSkin: 'mega-mobile-skin',
    platformVisibility: ['ios', 'android', 'web'],
    gamePlatformConfig: {
        demoUrl: 'demo',
        realUrl: 'real',
        gameLoaderFileName: 'loader.js',
        gameProvider: 'provider',
        gameType: { type: 'slots' },
        subGameType: 'sub-type',
        federalGameType: 'federal-type',
    },
});

describe('indexToOpenSearch', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('logs success when OpenSearch write succeeds', async () => {
        const index = jest.fn(async (_request: Record<string, unknown>) => undefined);
        const client = { index } as unknown as Parameters<typeof indexToOpenSearch>[0];
        const payload = makePayload();

        await indexToOpenSearch(client, payload, IG_GAMES_V2_WRITE_ALIAS);

        expect(logMessageMock).toHaveBeenCalledWith(
            'log',
            expect.anything(),
            expect.objectContaining({ entryId: 'game-1', indexName: IG_GAMES_V2_WRITE_ALIAS }),
            expect.stringContaining('game-1'),
        );
    });

    it('writes the transformed document to OpenSearch with external versioning', async () => {
        const index = jest.fn(async (_request: Record<string, unknown>) => undefined);
        const client = { index } as unknown as Parameters<typeof indexToOpenSearch>[0];
        const payload = makePayload();

        await indexToOpenSearch(client, payload, IG_GAMES_V2_WRITE_ALIAS);

        expect(index).toHaveBeenCalledTimes(1);
        const request = index.mock.calls[0][0];
        expect(request.index).toBe(IG_GAMES_V2_WRITE_ALIAS);
        expect(request.id).toBe(payload.id);
        expect(request.version_type).toBe('external');
        expect(request.refresh).toBe(false);
        expect(request.body).toEqual({
            game_to_sitegame: { name: 'game' },
            game: payload,
        });
    });

    it('skips indexing when payload content type is not game v2', async () => {
        const index = jest.fn();
        const client = { index } as unknown as Parameters<typeof indexToOpenSearch>[0];
        const payload = { ...makePayload(), contentType: 'not-a-game-v2' };

        await indexToOpenSearch(client, payload, IG_GAMES_V2_WRITE_ALIAS);

        expect(index).not.toHaveBeenCalled();
    });

    it('treats OpenSearch version conflict (409) as idempotent success', async () => {
        const index = jest.fn(async () => {
            throw { meta: { statusCode: 409 } };
        });
        const client = { index } as unknown as Parameters<typeof indexToOpenSearch>[0];

        await expect(indexToOpenSearch(client, makePayload(), IG_GAMES_V2_WRITE_ALIAS)).resolves.toBeUndefined();
        expect(index).toHaveBeenCalledTimes(1);
    });

    it('throws a typed throttling error when OpenSearch returns 429', async () => {
        const index = jest.fn(async () => {
            throw { meta: { statusCode: 429 } };
        });
        const client = { index } as unknown as Parameters<typeof indexToOpenSearch>[0];

        await expect(indexToOpenSearch(client, makePayload(), IG_GAMES_V2_WRITE_ALIAS)).rejects.toMatchObject({
            code: ErrorCode.OpenSearchThrottled,
            statusCode: 429,
        });
    });

    it('returns 503 for retryable OpenSearch failures and relies on sender redelivery', async () => {
        const index = jest.fn(async () => {
            throw { meta: { statusCode: 503 } };
        });
        const client = { index } as unknown as Parameters<typeof indexToOpenSearch>[0];

        await expect(indexToOpenSearch(client, makePayload(), IG_GAMES_V2_WRITE_ALIAS)).rejects.toMatchObject({
            code: ErrorCode.OpenSearchTemporaryFailure,
            statusCode: 503,
        });
        expect(index).toHaveBeenCalledTimes(1);
    });

    it('throws a typed indexing error for non-retryable OpenSearch failures', async () => {
        const index = jest.fn(async () => {
            throw { meta: { statusCode: 500 }, message: 'boom' };
        });
        const client = { index } as unknown as Parameters<typeof indexToOpenSearch>[0];

        await expect(indexToOpenSearch(client, makePayload(), IG_GAMES_V2_WRITE_ALIAS)).rejects.toMatchObject({
            code: ErrorCode.OpenSearchIndexingError,
            statusCode: 500,
        });
    });
});
