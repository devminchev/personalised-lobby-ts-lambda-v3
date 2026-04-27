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
    ML_RECOMMENDED_INDEX_RESP,
    PERSONALIZED_ML_RESP,
    VENTURE_SUCCESS_RESP,
    PERSONALISED_GAMES_DEFAULT_RESP,
    PERSONALISED_FALLBACK_RESP,
    PERSONALISED_FALLBACK_GAMES_RESP,
} from './mocks/personalizationMocks';
import {
    ErrorCode,
    getErrorMessage,
    ML_GAMES_RECOMMENDER_INDEX_ALIAS,
    SUGGESTED_GAMES_DEFAULTS_INDEX_ALIAS,
    VENTURES_INDEX_ALIAS,
    IG_GAMES_V2_READ_ALIAS,
    parseCompressedBody,
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
            .post(`/${ML_GAMES_RECOMMENDER_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, ML_RECOMMENDED_INDEX_RESP);

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, GAME_SITE_GAME_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, memberid);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(parseCompressedBody(result)).toEqual(PERSONALIZED_ML_RESP);
    });

    it('should return a list of fallback games for ML Suggested games for logged in user, when no ML data is available for the user', async () => {
        const sitename = 'doublebubblebingo';
        const platform = 'web';
        const memberid = '18530334';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_GAMES_RECOMMENDER_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, INDEX_EMPTY_RESP);

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${SUGGESTED_GAMES_DEFAULTS_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, PERSONALISED_GAMES_DEFAULT_RESP);

        nock('http://localhost:9200')
            .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, PERSONALISED_FALLBACK_GAMES_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, memberid);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(parseCompressedBody(result)).toEqual(PERSONALISED_FALLBACK_RESP);
    });

    it('should return a list of fallback games for ML Suggested games for logged in user, when game from ML are not found in the games index', async () => {
        const sitename = 'doublebubblebingo';
        const platform = 'web';
        const memberid = '18530334';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${ML_GAMES_RECOMMENDER_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, ML_RECOMMENDED_INDEX_RESP);

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, INDEX_EMPTY_RESP);

        nock('http://localhost:9200')
            .post(`/${SUGGESTED_GAMES_DEFAULTS_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, PERSONALISED_GAMES_DEFAULT_RESP);

        nock('http://localhost:9200')
            .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, PERSONALISED_FALLBACK_GAMES_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, memberid);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(parseCompressedBody(result)).toEqual(PERSONALISED_FALLBACK_RESP);
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
            .post(`/${ML_GAMES_RECOMMENDER_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, ML_RECOMMENDED_INDEX_RESP);

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(500, 'Unexpected error');

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform, memberid);

        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(200);
        const body = parseCompressedBody(result);
        expect(body).toEqual([]);
    });
});
