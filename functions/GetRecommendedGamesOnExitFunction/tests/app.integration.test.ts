process.env.API_KEY = 'API-KEY-FOR-THE-AGES';
process.env.HOST = 'http://localhost:9200';
process.env.OS_USER = 'your-username';
process.env.OS_PASS = 'your-password';

import { lambdaHandler } from '../app';
import nock from 'nock';
import { mockApiEvent } from './mocks/gatewayMocks';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { ErrorCode, IG_GAMES_V2_READ_ALIAS, VENTURES_INDEX_ALIAS, parseCompressedBody } from 'os-client';
import { ML_RECOMMENDED_GAMES_ON_EXIT_INDEX_ALIAS } from 'os-client/lib/constants';

const HOST = process.env.HOST || 'http://localhost:9200';

jest.mock('@opensearch-project/opensearch', () => {
    const actualOpenSearch: any = jest.requireActual('@opensearch-project/opensearch');
    return {
        Client: actualOpenSearch.Client,
    };
});

describe('Integration Test for Lambda Handler - recommended-games-on-exit', () => {
    beforeEach(() => {
        nock.cleanAll();
    });

    const sitename = 'jackpotjoy';
    const platform = 'web';
    const gameskin = 'MGSD_GRANNY_VS_ZOMBIES_LINK_AND_WIN';
    const locale = 'es-ES';

    it('should return 200 with empty array if ML index returns no recommendations', async () => {
        // Mock ventures index response first (this is called before ML index)
        // Use a more flexible mock that matches the actual query structure
        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search`)
            .query(true)
            .reply(200, { hits: { hits: [{ _source: { id: 'venture1' } }] } });

        // Mock ML index response with no recommendations
        nock('http://localhost:9200')
            .post(`/${ML_RECOMMENDED_GAMES_ON_EXIT_INDEX_ALIAS}/_search`)
            .query(true)
            .reply(200, { hits: { hits: [] } });

        const event = mockApiEvent(sitename, platform, gameskin, locale);
        const result = await lambdaHandler(event);
        expect(result.statusCode).toBe(200);
        expect(parseCompressedBody(result)).toEqual([]);
    });

    it('should return 200 and recommended games when ML and games index return data', async () => {
        const mlResponse = {
            hits: {
                hits: [
                    {
                        _source: {
                            contentful_game_id: '1xTEH1sTZwndl9OBKqJ03n',
                            similar_games: [
                                {
                                    contentful_game_id: 'game1',
                                    contentful_game_title: 'Game One',
                                    distance: 0.1,
                                    source_game_skin_name: 'skin1',
                                },
                                {
                                    contentful_game_id: 'game2',
                                    contentful_game_title: 'Game Two',
                                    distance: 0.2,
                                    source_game_skin_name: 'skin2',
                                },
                            ],
                        },
                    },
                ],
            },
        };

        const ventureResponse = {
            hits: {
                hits: [
                    {
                        _source: {
                            id: 'venture1',
                        },
                    },
                ],
            },
        };

        const gamesResponse = {
            hits: {
                hits: [
                    {
                        _index: 'games',
                        _id: '5b677qasjNrKLVUpXH6rdo',
                        _score: 1,
                        _routing: '1xTEH1sTZwndl9OBKqJ03n',
                        _source: {
                            siteGame: {
                                gameId: 'game1',
                                id: '5b677qasjNrKLVUpXH6rdo',
                                headlessJackpot: {
                                    'en-GB': {
                                        name: 'JACKPOT_BLAST',
                                        activeEnv: 'live-eu',
                                        id: 1,
                                    },
                                },
                            },
                        },
                        inner_hits: {
                            game: {
                                hits: {
                                    total: { value: 1, relation: 'eq' },
                                    max_score: 1,
                                    hits: [
                                        {
                                            _index: 'games',
                                            _id: '1xTEH1sTZwndl9OBKqJ03n',
                                            _score: 1,
                                            _source: {
                                                game: {
                                                    gameName: 'play-micro-amazing-link-bounty',
                                                    gameSkin: 'skin1',
                                                    mobileGameName: '',
                                                    mobileGameSkin: '',
                                                    mobileOverride: false,
                                                    tags: [],
                                                    gamePlatformConfig: {
                                                        gameType: { type: 'Slots' },
                                                        name: 'play-micro-amazing-link-bounty',
                                                        realUrl: '/service/game/play/play-micro-amazing-link-bounty',
                                                        demoUrl: '',
                                                        mobileDemoUrl: '',
                                                        mobileRealUrl:
                                                            '/service/game/play/play-micro-amazing-link-bounty-m',
                                                    },
                                                    imgUrlPattern: {
                                                        'en-GB':
                                                            '/api/content/gametiles/amazing-link-bounty/scale-s%s/amazing-link-bounty-tile-r%s-w%s.jpg',
                                                    },
                                                    title: {
                                                        'en-GB': 'Amazing Link Bounty',
                                                    },
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                ],
            },
        };

        nock('http://localhost:9200').post(`/${VENTURES_INDEX_ALIAS}/_search`).query(true).reply(200, ventureResponse);

        nock('http://localhost:9200')
            .post(`/${ML_RECOMMENDED_GAMES_ON_EXIT_INDEX_ALIAS}/_search`)
            .query(true)
            .reply(200, mlResponse);

        nock('http://localhost:9200').post(`/${IG_GAMES_V2_READ_ALIAS}/_search`).query(true).reply(200, gamesResponse);

        const event = mockApiEvent(sitename, platform, gameskin, locale);
        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(200);
        const body = parseCompressedBody<Array<{ gameId: string; title?: string }>>(result);
        expect(body).toHaveLength(1);
        expect(body[0].gameId).toBe('game1');
        expect(body[0].title).toBe('Amazing Link Bounty');
    });

    it('should return empty array if ML returns recommendations but games index returns no hits', async () => {
        const mlResponse = {
            hits: {
                hits: [
                    {
                        _source: {
                            contentful_game_id: 'game1',
                            similar_games: [
                                {
                                    contentful_game_id: 'game1',
                                    contentful_game_title: 'Game One',
                                    distance: 0.1,
                                    source_game_skin_name: 'skin1',
                                },
                            ],
                        },
                    },
                ],
            },
        };

        const ventureResponse = {
            hits: {
                hits: [
                    {
                        _source: {
                            id: 'venture1',
                        },
                    },
                ],
            },
        };

        nock('http://localhost:9200').post(`/${VENTURES_INDEX_ALIAS}/_search`).query(true).reply(200, ventureResponse);

        nock('http://localhost:9200')
            .post(`/${ML_RECOMMENDED_GAMES_ON_EXIT_INDEX_ALIAS}/_search`)
            .query(true)
            .reply(200, mlResponse);

        nock('http://localhost:9200')
            .post(`/${IG_GAMES_V2_READ_ALIAS}/_search`)
            .query(true)
            .reply(200, { hits: { hits: [] } });

        const event = mockApiEvent(sitename, platform, gameskin, locale);
        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(200);
        expect(parseCompressedBody(result)).toEqual([]);
    });

    it('should return 500 if ML index throws an error', async () => {
        nock(HOST).post(`/${VENTURES_INDEX_ALIAS}/_search`).query(true).reply(500, { error: 'Internal Server Error' });

        const event = mockApiEvent(sitename, platform, gameskin, locale);
        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).code).toBe(ErrorCode.ServerError);
    });

    it('should return 500 if ventures index throws an error', async () => {
        nock(HOST).post(`/${VENTURES_INDEX_ALIAS}/_search`).query(true).reply(500, { error: 'Internal Server Error' });

        const event = mockApiEvent(sitename, platform, gameskin, locale);
        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).code).toBe(ErrorCode.ServerError);
    });

    it('should return 500 if games index throws an error', async () => {
        const ventureResponse = {
            hits: {
                hits: [
                    {
                        _source: {
                            id: 'venture1',
                        },
                    },
                ],
            },
        };

        const mlResponse = {
            hits: {
                hits: [
                    {
                        _source: {
                            contentful_game_id: 'game1',
                            similar_games: [
                                {
                                    contentful_game_id: 'game1',
                                    contentful_game_title: 'Game One',
                                    distance: 0.1,
                                    source_game_skin_name: 'skin1',
                                },
                            ],
                        },
                    },
                ],
            },
        };

        nock(HOST).post(`/${VENTURES_INDEX_ALIAS}/_search`).query(true).reply(200, ventureResponse);

        nock(HOST).post(`/${ML_RECOMMENDED_GAMES_ON_EXIT_INDEX_ALIAS}/_search`).query(true).reply(200, mlResponse);

        nock(HOST)
            .post(`/${IG_GAMES_V2_READ_ALIAS}/_search`)
            .query(true)
            .reply(500, { error: 'Internal Server Error' });

        const event = mockApiEvent(sitename, platform, gameskin, locale);
        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).code).toBe(ErrorCode.ServerError);
    });

    it('should handle locale fallback if locale is missing', async () => {
        const mlResponse = {
            hits: {
                hits: [
                    {
                        _source: {
                            contentful_game_id: 'game1',
                            similar_games: [
                                {
                                    contentful_game_id: 'game1',
                                    contentful_game_title: 'Game One',
                                    distance: 0.1,
                                    source_game_skin_name: 'skin1',
                                },
                            ],
                        },
                    },
                ],
            },
        };

        const ventureResponse = {
            hits: {
                hits: [
                    {
                        _source: {
                            id: 'venture1',
                        },
                    },
                ],
            },
        };

        const gamesResponse = {
            hits: {
                hits: [
                    {
                        _index: 'games',
                        _id: '5b677qasjNrKLVUpXH6rdo',
                        _score: 1,
                        _routing: '1xTEH1sTZwndl9OBKqJ03n',
                        _source: {
                            siteGame: {
                                gameId: 'game1',
                                id: '5b677qasjNrKLVUpXH6rdo',
                                headlessJackpot: {
                                    'en-GB': {
                                        name: 'JACKPOT_BLAST',
                                        activeEnv: 'live-eu',
                                        id: 1,
                                    },
                                },
                            },
                        },
                        inner_hits: {
                            game: {
                                hits: {
                                    total: { value: 1, relation: 'eq' },
                                    max_score: 1,
                                    hits: [
                                        {
                                            _index: 'games',
                                            _id: '1xTEH1sTZwndl9OBKqJ03n',
                                            _score: 1,
                                            _source: {
                                                game: {
                                                    gameName: 'play-micro-amazing-link-bounty',
                                                    gameSkin: 'skin1',
                                                    mobileGameName: '',
                                                    mobileGameSkin: '',
                                                    mobileOverride: false,
                                                    tags: [],
                                                    gamePlatformConfig: {
                                                        gameType: { type: 'Slots' },
                                                        name: 'play-micro-amazing-link-bounty',
                                                        realUrl: 'url1',
                                                        demoUrl: '',
                                                        mobileDemoUrl: '',
                                                        mobileRealUrl:
                                                            '/service/game/play/play-micro-amazing-link-bounty-m',
                                                    },
                                                    imgUrlPattern: {
                                                        'en-GB':
                                                            '/api/content/gametiles/amazing-link-bounty/scale-s%s/amazing-link-bounty-tile-r%s-w%s.jpg',
                                                    },
                                                    title: {
                                                        'en-GB': 'Game One',
                                                    },
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                ],
            },
        };

        nock(HOST).post(`/${VENTURES_INDEX_ALIAS}/_search`).query(true).reply(200, ventureResponse);

        nock(HOST).post(`/${ML_RECOMMENDED_GAMES_ON_EXIT_INDEX_ALIAS}/_search`).query(true).reply(200, mlResponse);
        nock(HOST).post(`/${VENTURES_INDEX_ALIAS}/_search`).query(true).reply(200, ventureResponse);

        nock(HOST).post(`/${ML_RECOMMENDED_GAMES_ON_EXIT_INDEX_ALIAS}/_search`).query(true).reply(200, mlResponse);

        nock(HOST).post(`/${IG_GAMES_V2_READ_ALIAS}/_search`).query(true).reply(200, gamesResponse);

        const event = mockApiEvent(sitename, platform, gameskin, locale);
        const result = await lambdaHandler(event);

        console.log('result:', JSON.stringify(result));
        expect(result.statusCode).toBe(200);
        const body = parseCompressedBody<Array<{ gameId: string }>>(result);
        expect(body).toHaveLength(1);
        expect(body[0].gameId).toBe('game1');
    });

    it('should sort games by distance from ML recommendations', async () => {
        const mlResponse = {
            hits: {
                hits: [
                    {
                        _source: {
                            contentful_game_id: 'game1',
                            similar_games: [
                                {
                                    contentful_game_id: 'game1',
                                    contentful_game_title: 'Game One',
                                    distance: 0.2,
                                    source_game_skin_name: 'skin1',
                                },
                                {
                                    contentful_game_id: 'game2',
                                    contentful_game_title: 'Game Two',
                                    distance: 0.1,
                                    source_game_skin_name: 'skin2',
                                },
                            ],
                        },
                    },
                ],
            },
        };

        const ventureResponse = {
            hits: {
                hits: [
                    {
                        _source: {
                            id: 'venture1',
                        },
                    },
                ],
            },
        };

        const gamesResponse = {
            hits: {
                hits: [
                    {
                        _index: 'games',
                        _id: 'game2id',
                        _score: 1,
                        _routing: 'game2id',
                        _source: {
                            siteGame: {
                                gameId: 'game2',
                                id: 'game2id',
                            },
                        },
                        inner_hits: {
                            game: {
                                hits: {
                                    total: { value: 1, relation: 'eq' },
                                    max_score: 1,
                                    hits: [
                                        {
                                            _index: 'games',
                                            _id: 'game2id',
                                            _score: 1,
                                            _source: {
                                                game: {
                                                    gameName: 'play-micro-amazing-link-bounty',
                                                    gameSkin: 'skin2',
                                                    mobileGameName: '',
                                                    mobileGameSkin: '',
                                                    mobileOverride: false,
                                                    title: { 'en-GB': 'Game Two' },
                                                    tags: ['tag2'],
                                                    imgUrlPattern: {
                                                        'en-GB':
                                                            '/api/content/gametiles/amazing-link-bounty/scale-s%s/amazing-link-bounty-tile-r%s-w%s.jpg',
                                                    },
                                                    gamePlatformConfig: {
                                                        gameType: { type: 'Slots' },
                                                        name: 'play-micro-amazing-link-bounty',
                                                        realUrl: '/service/game/play/play-micro-amazing-link-bounty',
                                                        demoUrl: '',
                                                        mobileDemoUrl: '',
                                                        mobileRealUrl:
                                                            '/service/game/play/play-micro-amazing-link-bounty-m',
                                                    },
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    {
                        _index: 'games',
                        _id: 'game1id',
                        _score: 1,
                        _routing: 'game1id',
                        _source: {
                            siteGame: {
                                gameId: 'game1',
                                id: 'game1id',
                            },
                        },
                        inner_hits: {
                            game: {
                                hits: {
                                    total: { value: 1, relation: 'eq' },
                                    max_score: 1,
                                    hits: [
                                        {
                                            _index: 'games',
                                            _id: 'game1id',
                                            _score: 1,
                                            _source: {
                                                game: {
                                                    gameName: 'play-micro-amazing-link-bounty',
                                                    gameSkin: 'skin1',
                                                    mobileGameName: '',
                                                    mobileGameSkin: '',
                                                    mobileOverride: false,
                                                    title: { 'en-GB': 'Game One' },
                                                    tags: ['tag1'],
                                                    imgUrlPattern: {
                                                        'en-GB':
                                                            '/api/content/gametiles/amazing-link-bounty/scale-s%s/amazing-link-bounty-tile-r%s-w%s.jpg',
                                                    },
                                                    gamePlatformConfig: {
                                                        gameType: { type: 'Slots' },
                                                        name: 'play-micro-amazing-link-bounty',
                                                        realUrl: '/service/game/play/play-micro-amazing-link-bounty',
                                                        demoUrl: '',
                                                        mobileDemoUrl: '',
                                                        mobileRealUrl:
                                                            '/service/game/play/play-micro-amazing-link-bounty-m',
                                                    },
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                ],
            },
        };

        nock(HOST).post(`/${VENTURES_INDEX_ALIAS}/_search`).query(true).reply(200, ventureResponse);

        nock(HOST).post(`/${ML_RECOMMENDED_GAMES_ON_EXIT_INDEX_ALIAS}/_search`).query(true).reply(200, mlResponse);

        nock(HOST).post(`/${IG_GAMES_V2_READ_ALIAS}/_search`).query(true).reply(200, gamesResponse);

        const event = mockApiEvent(sitename, platform, gameskin, locale);
        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(200);
        const body = parseCompressedBody<Array<{ gameId: string }>>(result);
        console.log('Response body:', body);
        expect(body).toHaveLength(2);
        // Game with lower distance should come first
        expect(body[0].gameId).toBe('game2');
        expect(body[1].gameId).toBe('game1');
    });
});
