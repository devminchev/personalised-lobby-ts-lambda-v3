process.env.API_KEY = 'API-KEY-FOR-THE-AGES';
process.env.HOST = 'http://localhost:9200';
process.env.OS_USER = 'your-username';
process.env.OS_PASS = 'your-password';

import { lambdaHandler } from '../app';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import nock from 'nock';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { mockApiEvent } from './mocks/gatewayMocks';
import { VENTURE_SUCCESS_RESP, GAME_TITLES_SUCCESS_RESP, NOT_FOUND_RESPONSE } from './mocks/responses';
import {
    ErrorCode,
    getErrorMessage,
    GAMES_V2_INDEX_ALIAS,
    ARCHIVED_GAMES_READ_ALIAS,
    VENTURES_INDEX_ALIAS,
    SECTIONS_INDEX_ALIAS,
} from 'os-client';

jest.mock('@opensearch-project/opensearch', () => {
    const actualOpenSearch: any = jest.requireActual('@opensearch-project/opensearch');
    return {
        Client: actualOpenSearch.Client,
    };
});

const SITENAME = 'doublebubblebingo';

describe('Integration Test for Lambda Handler', () => {
    beforeEach(() => {
        nock.cleanAll();
    });

    it('should return 400 to the client if any of the path parameters are missing', async () => {
        const event: APIGatewayProxyEvent = mockApiEvent(undefined);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(400);
        const body = JSON.parse(result.body);
        expect(body.code).toBe(ErrorCode.MissingParams);
        expect(body.message).toBe(getErrorMessage(ErrorCode.MissingParams));
    });

    it('should give 404 bad response when no games return', async () => {
        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);
        nock('http://localhost:9200')
            .post(`/${GAMES_V2_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, GAME_TITLES_SUCCESS_RESP);
        nock('http://localhost:9200')
            .post(`/${ARCHIVED_GAMES_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, GAME_TITLES_SUCCESS_RESP);
        nock('http://localhost:9200')
            .post(`/${SECTIONS_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, NOT_FOUND_RESPONSE);

        const event: APIGatewayProxyEvent = mockApiEvent(SITENAME);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(404);
        const body = JSON.parse(result.body);
        expect(body.code).toBe(ErrorCode.NoGamesReturned);
        expect(body.message).toBe(getErrorMessage(ErrorCode.NoGamesReturned));
    });

    it('should return 500 for an unexpeteced error', async () => {
        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(500, 'Unexpected error');

        const event: APIGatewayProxyEvent = mockApiEvent(SITENAME);
        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(500);
        const body = JSON.parse(result.body);
        expect(body.message).toBe('Internal Server Error');
    });
});
