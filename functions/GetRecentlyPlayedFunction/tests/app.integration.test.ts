process.env.API_KEY = 'API-KEY-FOR-THE-AGES';
process.env.HOST = 'http://localhost:9200';
process.env.OS_USER = 'your-username';
process.env.OS_PASS = 'your-password';

import { lambdaHandler } from '../app';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import nock from 'nock';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { mockApiEvent } from './mocks/gatewayMocks';
import {
    GAME_SITE_GAME_RESP,
    INDEX_EMPTY_RESP,
    RECENTLY_PLAYED_RESP,
    VENTURE_SUCCESS_RESP,
    RP_SECTION_RESP,
    ML_RECENTLY_PLAYED_INDEX_RESP,
} from './mocks/personalizationMocks';
import {
    ErrorCode,
    getErrorMessage,
    VENTURES_INDEX_ALIAS,
    GAMES_V2_INDEX_ALIAS,
    ML_RECENTLY_PLAYED_ALIAS,
    ML_SECTIONS_READ_ALIAS,
    ML_GAMES_RECOMMENDER_INDEX_ALIAS,
} from 'os-client';

jest.mock('@opensearch-project/opensearch', () => {
    const actualOpenSearch: any = jest.requireActual('@opensearch-project/opensearch');
    return {
        Client: actualOpenSearch.Client,
    };
});

describe('Integration Test for Lambda Handler', () => {
    beforeEach(() => {
        nock.cleanAll();
    });

    it('should return ML Suggested games for logged in user, with ML data available on personalized section', async () => {
        const sitename = 'doublebubblebingo';
        const platform = 'web';
        const memberid = '18530334';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_SECTIONS_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, RP_SECTION_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_RECENTLY_PLAYED_ALIAS}/_search?request_cache=true`)
            .reply(200, ML_RECENTLY_PLAYED_INDEX_RESP);

        nock('http://localhost:9200')
            .post(`/${GAMES_V2_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, GAME_SITE_GAME_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, memberid);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(JSON.parse(result.body)).toEqual(RECENTLY_PLAYED_RESP);
    });

    it('should exclude games flagged with the recently played exclusion tag', async () => {
        const sitename = 'doublebubblebingo';
        const platform = 'web';
        const memberid = '18530334';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_SECTIONS_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, RP_SECTION_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_RECENTLY_PLAYED_ALIAS}/_search?request_cache=true`)
            .reply(200, ML_RECENTLY_PLAYED_INDEX_RESP);

        nock('http://localhost:9200')
            .post(`/${GAMES_V2_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, GAME_SITE_GAME_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, memberid);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        const games = JSON.parse(result.body) as Array<{ gameId: string }>;
        expect(games.some((game) => game.gameId === 'game-5')).toBe(false);
    });

    it('should keep games whose metadata tags do not match the exclusion tag', async () => {
        const sitename = 'doublebubblebingo';
        const platform = 'web';
        const memberid = '18530334';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_SECTIONS_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, RP_SECTION_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_RECENTLY_PLAYED_ALIAS}/_search?request_cache=true`)
            .reply(200, ML_RECENTLY_PLAYED_INDEX_RESP);

        nock('http://localhost:9200')
            .post(`/${GAMES_V2_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, GAME_SITE_GAME_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, memberid);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        const games = JSON.parse(result.body) as Array<{ gameId: string }>;
        expect(games.some((game) => game.gameId === 'game-6')).toBe(true);
    });

    it('should return an empty list when no ML data is available for the user', async () => {
        const sitename = 'doublebubblebingo';
        const platform = 'web';
        const memberid = '18530334';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_SECTIONS_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, RP_SECTION_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_RECENTLY_PLAYED_ALIAS}/_search?request_cache=true`)
            .reply(200, INDEX_EMPTY_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, memberid);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(JSON.parse(result.body)).toEqual([]);
    });

    it('should return an empty list when games from ML are not found in the games index', async () => {
        const sitename = 'doublebubblebingo';
        const platform = 'web';
        const memberid = '18530334';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_GAMES_RECOMMENDER_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, []);

        nock('http://localhost:9200')
            .post(`/${ML_SECTIONS_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, RP_SECTION_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_RECENTLY_PLAYED_ALIAS}/_search?request_cache=true`)
            .reply(200, ML_RECENTLY_PLAYED_INDEX_RESP);

        nock('http://localhost:9200')
            .post(`/${GAMES_V2_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, INDEX_EMPTY_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, memberid);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(JSON.parse(result.body)).toEqual([]);
    });

    it('should return (400) to the client if memberid is missing', async () => {
        const sitename = 'jackpotjoy';
        const platform = 'web';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, undefined);

        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(400);
        const body = JSON.parse(result.body);
        expect(body.code).toBe(ErrorCode.InvalidRequest);
        expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
    });

    it('should return 200 with an empty response for an unexpected error while processing recommendations', async () => {
        const sitename = 'jackpotjoy';
        const platform = 'web';
        const memberid = '1234';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_SECTIONS_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, RP_SECTION_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_RECENTLY_PLAYED_ALIAS}/_search?request_cache=true`)
            .reply(200, ML_RECENTLY_PLAYED_INDEX_RESP);

        nock('http://localhost:9200')
            .post(`/${GAMES_V2_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(500, { error: 'unexpected error' });

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, memberid);

        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual([]);
    });
});
