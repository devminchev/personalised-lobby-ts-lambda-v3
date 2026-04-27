process.env.HOST = 'http://localhost:9200';
process.env.OS_USER = 'your-username';
process.env.OS_PASS = 'your-password';

import { lambdaHandler } from '../app';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import nock from 'nock';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { mockApiEvent } from './mocks/gatewayMocks';
import {
    VENTURE_SUCCESS_RESP,
    NOT_FOUND_RESPONSE,
    MINIGAMES_SECTIONS_SUCCESS_RESP,
    MINIGAMES_GAMES_SUCCESS_RESP,
    MINIGAMES_ENDPOINT_SUCCESS_RESP,
    MINIGAMES_SECTIONS_INVALID_GAMES_RESP,
    MINI_GAMES_VIEW_SUCCESS_RESP,
} from './mocks/responses';
import {
    ErrorCode,
    getErrorMessage,
    VENTURES_INDEX_ALIAS,
    IG_GAMES_V2_READ_ALIAS,
    ALL_SECTIONS_SHARED_READ_ALIAS,
    VIEW_INDEX_READ_ALIAS,
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

    it('should return sections for a valid sitename, and platform', async () => {
        const sitename = 'jackpotjoy';
        const platform = 'web';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${VIEW_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, MINI_GAMES_VIEW_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, MINIGAMES_SECTIONS_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, MINIGAMES_GAMES_SUCCESS_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(parseCompressedBody(result)).toEqual(MINIGAMES_ENDPOINT_SUCCESS_RESP);
    });

    it('should return (204) for invalid site name', async () => {
        const sitename = 'jpj';
        const platform = 'web';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, NOT_FOUND_RESPONSE);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform);

        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(204);
        expect(result.statusCode).toBe(204);
        expect(result.headers?.['Cache-Control']).toBe('no-cache');
    });

    it('should return (204) if no sections are returned', async () => {
        const sitename = 'jackpotjoy';
        const platform = 'web';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${VIEW_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, MINI_GAMES_VIEW_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, NOT_FOUND_RESPONSE);

        nock('http://localhost:9200')
            .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, NOT_FOUND_RESPONSE);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform);

        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(204);
        expect(result.statusCode).toBe(204);
        expect(result.headers?.['Cache-Control']).toBe('no-cache');
    });

    it('should return (204) if no games are returned', async () => {
        const sitename = 'jackpotjoy';
        const platform = 'web';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${VIEW_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, MINI_GAMES_VIEW_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, MINIGAMES_SECTIONS_INVALID_GAMES_RESP);

        nock('http://localhost:9200')
            .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, NOT_FOUND_RESPONSE);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform);

        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(204);
        expect(result.statusCode).toBe(204);
        expect(result.headers?.['Cache-Control']).toBe('no-cache');
    });

    it('should return (400) to the client if any of the path parameters are missing', async () => {
        const platform = 'web';

        const event: APIGatewayProxyEvent = mockApiEvent(undefined, platform);

        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(400);
        const body = JSON.parse(result.body);
        expect(body.code).toBe(ErrorCode.InvalidRequest);
        expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
    });

    it('should return 500 for an unexpected error', async () => {
        const sitename = 'jackpotjoy';
        const platform = 'web';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(500, 'Unexpected error');

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, platform);

        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(500);
        const body = JSON.parse(result.body);
        expect(body.message).toBe('Internal Server Error');
    });
});
