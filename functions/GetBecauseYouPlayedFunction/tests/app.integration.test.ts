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
    BECAUSE_YOU_PLAYED_ML_RESP,
    VENTURE_SUCCESS_RESP,
    ML_BECAUSE_YOU_PLAYED_INDEX_RESP,
    ML_BECAUSE_YOU_PLAYED_INDEX_RESP_BIG,
    GAME_SITE_GAME_RESP_BIG,
    BECAUSE_YOU_PLAYED_ML_RESP_BIG,
} from './mocks/personalizationMocks';
import {
    ErrorCode,
    getErrorMessage,
    VENTURES_INDEX_ALIAS,
    GAMES_V2_INDEX_ALIAS,
    ML_BECAUSE_YOU_PLAYED_INDEX_ALIAS,
} from 'os-client';

jest.mock('@opensearch-project/opensearch', () => {
    const actualOpenSearch: any = jest.requireActual('@opensearch-project/opensearch');
    return {
        Client: actualOpenSearch.Client,
    };
});

describe.skip('Integration Test for Lambda Handler', () => {
    beforeEach(() => {
        nock.cleanAll();
    });

    it('should return ML Because You Played for logged in user, with ML data available on personalized section', async () => {
        const sitename = 'doublebubblebingo';
        const platform = 'desktop';
        const memberid = '18530334';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_BECAUSE_YOU_PLAYED_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, ML_BECAUSE_YOU_PLAYED_INDEX_RESP_BIG);

        nock('http://localhost:9200')
            .post(`/${GAMES_V2_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, GAME_SITE_GAME_RESP_BIG);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, memberid);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify(BECAUSE_YOU_PLAYED_ML_RESP_BIG));
    });

    it('should return empty response to the user, when there are less than 4 games found from ML on personalized section', async () => {
        const sitename = 'doublebubblebingo';
        const platform = 'desktop';
        const memberid = '18530334';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_BECAUSE_YOU_PLAYED_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, ML_BECAUSE_YOU_PLAYED_INDEX_RESP);

        nock('http://localhost:9200')
            .post(`/${GAMES_V2_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, GAME_SITE_GAME_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, memberid);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify([]));
    });

    it('should return an empty array for ML Because You Played for logged in user, when no ML data is available for the user', async () => {
        const sitename = 'doublebubblebingo';
        const platform = 'desktop';
        const memberid = '18530334';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_BECAUSE_YOU_PLAYED_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, INDEX_EMPTY_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, memberid);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify([]));
    });

    it('should return an empty array for ML Because You Played for logged in user, when game from ML are not found in the games index', async () => {
        const sitename = 'doublebubblebingo';
        const platform = 'desktop';
        const memberid = '18530334';

        nock('http://localhost:9200')
            .post(`/${ML_BECAUSE_YOU_PLAYED_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, ML_BECAUSE_YOU_PLAYED_INDEX_ALIAS);

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${GAMES_V2_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, INDEX_EMPTY_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, memberid);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify([]));
    });

    it('should return 400 to the client if memberid is missing', async () => {
        const sitename = 'jackpotjoy';
        const platform = 'desktop';

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, undefined);

        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(400);
        const body = JSON.parse(result.body);
        expect(body.code).toBe(ErrorCode.MissingParams);
        expect(body.message).toBe(getErrorMessage(ErrorCode.MissingParams));
    });

    it('should return 200 with an empty response for an unexpected error while processing recommendations', async () => {
        const sitename = 'jackpotjoy';
        const platform = 'desktop';
        const memberid = '1234';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_BECAUSE_YOU_PLAYED_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(500, 'Unexpected error');

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, memberid);

        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body).toEqual([]);
    });
});
