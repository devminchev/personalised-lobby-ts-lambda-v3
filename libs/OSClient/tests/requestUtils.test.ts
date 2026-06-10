/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import {
    validateGameHits,
    getHits,
    getHitsWithIndex,
    getGameHits,
    getSiteGameHits,
    getAggregatedHits,
    extractLayoutToGameDictFromAggregation,
} from '../lib/requestUtils';
import { logMessage } from '../lib/logger';
import type { IClient, IBucket } from '../lib/osClient';
import type { IGamesSource } from '../lib/sharedInterfaces/search';

jest.mock('../lib/errors', () => ({
    logError: jest.fn(),
    createError: jest.fn().mockImplementation((errorCode, statusCode) => new Error(`${errorCode} ${statusCode}`)),
    ErrorCode: {
        NoGamesReturned: 'NoGamesReturned',
    },
}));

jest.mock('../lib/logger', () => ({
    logMessage: jest.fn(),
}));

function makeClient(searchResponse: any): IClient {
    return { searchWithHandling: jest.fn<any>().mockResolvedValue(searchResponse) } as unknown as IClient;
}

describe('validateGameHits', () => {
    const siteName = 'jackpotjoy';
    const platform = 'web';

    it('throws an error when data array is empty', () => {
        expect(() => validateGameHits([], siteName, platform)).toThrowError('NoGamesReturned 404');
        expect(logMessage).toHaveBeenCalledWith(
            'warn',
            'NoGamesReturned',
            {
                siteName,
                platform,
                data: [],
            },
            expect.any(String),
        );
    });

    it('returns the first item if the array contains one item', () => {
        const testData = [{ id: 1 }];
        expect(validateGameHits(testData, siteName, platform)).toEqual(testData[0]);
    });

    it('logs a warning and returns the first item if the array contains more than one item', () => {
        const testData = [{ id: 1 }, { id: 2 }];
        console.warn = jest.fn();
        expect(validateGameHits(testData, siteName, platform)).toEqual(testData[0]);
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Expected 1 entry, received 2 entries'));
    });
});

describe('getHits', () => {
    it('returns mapped _source items from search hits', async () => {
        const client = makeClient({
            hits: { total: { value: 2 }, hits: [{ _source: { id: 'a' } }, { _source: { id: 'b' } }] },
        });
        const result = await getHits<{ id: string }>(client, {}, 'my-index');
        expect(result).toEqual([{ id: 'a' }, { id: 'b' }]);
    });

    it('returns empty array when there are no hits', async () => {
        const client = makeClient({ hits: { total: { value: 0 }, hits: [] } });
        const result = await getHits(client, {}, 'my-index');
        expect(result).toEqual([]);
    });
});

describe('getHitsWithIndex', () => {
    it('returns {source, index} pairs for each hit', async () => {
        const client = makeClient({
            hits: {
                total: { value: 1 },
                hits: [{ _source: { id: 'x' }, _index: 'games-v1' }],
            },
        });
        const result = await getHitsWithIndex<{ id: string }>(client, {}, 'games-*');
        expect(result).toEqual([{ source: { id: 'x' }, index: 'games-v1' }]);
    });
});

describe('getGameHits', () => {
    it('extracts inner_hits.game._source from each outer hit', async () => {
        const client = makeClient({
            hits: {
                total: { value: 1 },
                hits: [
                    {
                        _source: { siteGameId: 's1' },
                        inner_hits: { game: { hits: { hits: [{ _source: { gameId: 'g1' } }] } } },
                    },
                ],
            },
        });
        const result = await getGameHits<{ siteGameId: string }, { gameId: string }>(
            client,
            {},
            'index',
            'jackpotjoy',
            'web',
        );
        expect(result).toEqual([{ hit: { siteGameId: 's1' }, innerHit: { gameId: 'g1' } }]);
    });

    it('throws NoGamesReturned when inner_hits.game is empty', async () => {
        const client = makeClient({
            hits: {
                total: { value: 1 },
                hits: [{ _source: { siteGameId: 's1' }, inner_hits: { game: { hits: { hits: [] } } } }],
            },
        });
        await expect(getGameHits(client, {}, 'index', 'jackpotjoy', 'web')).rejects.toThrow('NoGamesReturned 404');
    });

    it('falls back to empty array when inner_hits.game is missing', async () => {
        const client = makeClient({
            hits: { total: { value: 1 }, hits: [{ _source: { siteGameId: 's1' } }] },
        });
        await expect(getGameHits(client, {}, 'index', 'jackpotjoy', 'web')).rejects.toThrow('NoGamesReturned 404');
    });
});

describe('getSiteGameHits', () => {
    it('extracts inner_hits.sitegame._source from each outer hit', async () => {
        const client = makeClient({
            hits: {
                total: { value: 1 },
                hits: [
                    {
                        _source: { siteGameId: 's1' },
                        inner_hits: { sitegame: { hits: { hits: [{ _source: { sgId: 'sg1' } }] } } },
                    },
                ],
            },
        });
        const result = await getSiteGameHits<{ siteGameId: string }, { sgId: string }>(
            client,
            {},
            'index',
            'jackpotjoy',
            'web',
        );
        expect(result).toEqual([{ hit: { siteGameId: 's1' }, innerHit: { sgId: 'sg1' } }]);
    });

    it('throws when inner_hits.sitegame is empty', async () => {
        const client = makeClient({
            hits: {
                total: { value: 1 },
                hits: [{ _source: {}, inner_hits: { sitegame: { hits: { hits: [] } } } }],
            },
        });
        await expect(getSiteGameHits(client, {}, 'index', 'jackpotjoy', 'web')).rejects.toThrow('NoGamesReturned 404');
    });
});

describe('getAggregatedHits', () => {
    it('returns empty object when totalHits is 0', async () => {
        const client = makeClient({ hits: { total: { value: 0 }, hits: [] } });
        const result = await getAggregatedHits(client, {}, 'index');
        expect(result).toEqual({});
    });

    it('returns aggregation buckets when hits exist', async () => {
        const buckets = { cat1: { doc_count: 2, top_documents: { hits: { hits: [] } } } };
        const client = makeClient({
            hits: { total: { value: 1 }, hits: [] },
            aggregations: { group_by_category: { buckets } },
        });
        const result = await getAggregatedHits(client, {}, 'index');
        expect(result).toEqual(buckets);
    });

    it('returns empty object when aggregations is missing', async () => {
        const client = makeClient({ hits: { total: { value: 1 }, hits: [] } });
        const result = await getAggregatedHits(client, {}, 'index');
        expect(result).toEqual({});
    });
});

describe('extractLayoutToGameDictFromAggregation', () => {
    const locale = 'en-GB';

    it('builds inverted index mapping gameId to layout keys', () => {
        const aggregations: IBucket<IGamesSource> = {
            layout1: {
                doc_count: 1,
                top_documents: {
                    hits: {
                        hits: [
                            {
                                _index: '',
                                _type: '',
                                _id: '',
                                _score: 0,
                                _source: {
                                    games: {
                                        [locale]: [{ sys: { id: 'game-a' } }, { sys: { id: 'game-b' } }],
                                    },
                                } as any,
                            },
                        ],
                    },
                },
            },
        };
        const result = extractLayoutToGameDictFromAggregation(aggregations, locale);
        expect(result.allSiteGameIds).toContain('game-a');
        expect(result.allSiteGameIds).toContain('game-b');
        expect(result.invertedIndex['game-a']).toContain('layout1');
        expect(result.invertedIndex['game-b']).toContain('layout1');
    });

    it('returns empty when no hits in aggregation', () => {
        const aggregations: IBucket<IGamesSource> = {
            layout1: {
                doc_count: 0,
                top_documents: { hits: { hits: [] } },
            },
        };
        const result = extractLayoutToGameDictFromAggregation(aggregations, locale);
        expect(result.allSiteGameIds).toEqual([]);
        expect(result.invertedIndex).toEqual({});
    });

    it('deduplicates layout keys for the same game', () => {
        const aggregations: IBucket<IGamesSource> = {
            layout1: {
                doc_count: 2,
                top_documents: {
                    hits: {
                        hits: [
                            {
                                _index: '',
                                _type: '',
                                _id: '',
                                _score: 0,
                                _source: { games: { [locale]: [{ sys: { id: 'g1' } }] } } as any,
                            },
                            {
                                _index: '',
                                _type: '',
                                _id: '',
                                _score: 0,
                                _source: { games: { [locale]: [{ sys: { id: 'g1' } }] } } as any,
                            },
                        ],
                    },
                },
            },
        };
        const result = extractLayoutToGameDictFromAggregation(aggregations, locale);
        expect(result.invertedIndex['g1']).toEqual(['layout1']);
    });

    it('skips entries with no games for the given locale', () => {
        const aggregations: IBucket<IGamesSource> = {
            layout1: {
                doc_count: 1,
                top_documents: {
                    hits: {
                        hits: [
                            {
                                _index: '',
                                _type: '',
                                _id: '',
                                _score: 0,
                                _source: { games: {} } as any,
                            },
                        ],
                    },
                },
            },
        };
        const result = extractLayoutToGameDictFromAggregation(aggregations, locale);
        expect(result.allSiteGameIds).toEqual([]);
    });
});
