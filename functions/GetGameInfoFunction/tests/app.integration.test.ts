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
    NOT_FOUND_RESPONSE,
    SUCCESSFUL_GAME_RESPONSE,
    SUCCESS_MOBILE_GAME_OVERRIDES,
    VENTURE_SUCCESS_RESP,
} from './mocks/responses';
import {
    EXPECTED_WEB_RESP,
    EXPECTED_ES_LOCALE_RESP,
    EXPECTED_MOBILE_OVERRIDE_RESP,
} from './mocks/expectedAPIResponses';
import { VENTURES_INDEX_ALIAS, ErrorCode, getErrorMessage, parseCompressedBody } from 'os-client';
import { IG_GAMES_V2_READ_ALIAS } from 'os-client/lib/constants';

jest.mock('@opensearch-project/opensearch', () => {
    const actualOpenSearch: any = jest.requireActual('@opensearch-project/opensearch');
    return {
        Client: actualOpenSearch.Client,
    };
});

const SITENAME = 'doublebubblebingo';
const PLATFORM = 'web';
const PLATFORM_MOBILE = 'ios';
const GAME_NAME = 'play-micro-gold-blitz';
const LOCALE_GB = 'en-GB';
const LOCALE_ES = 'es-ES';

describe('Integration Test for Lambda Handler', () => {
    beforeEach(() => {
        nock.cleanAll();
    });

    describe('Successful response for 2xx status codes', () => {
        it('Should return sucesss (200) when AWS OS returns one entry with no locale provided', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SUCCESSFUL_GAME_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITENAME, PLATFORM, GAME_NAME);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            const body = parseCompressedBody(result);
            expect(result.statusCode).toEqual(200);
            expect(body).toEqual(EXPECTED_WEB_RESP);
        });

        it('Should return sucesss  (200) when AWS OS returns one entry with ES locale provided', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SUCCESSFUL_GAME_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITENAME, PLATFORM, GAME_NAME, LOCALE_ES);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            const body = parseCompressedBody(result);
            expect(result.statusCode).toEqual(200);
            expect(body).toEqual(EXPECTED_ES_LOCALE_RESP);
        });

        it('Should return sucesss (200) response when AWS OS returns one entry with no locale provided and siteGame config overrides game config', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SUCCESS_MOBILE_GAME_OVERRIDES);

            const event: APIGatewayProxyEvent = mockApiEvent(SITENAME, PLATFORM_MOBILE, GAME_NAME);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            const body = parseCompressedBody(result);
            expect(result.statusCode).toEqual(200);
            expect(body).toEqual(EXPECTED_MOBILE_OVERRIDE_RESP);
        });

        it('Should return sucess (200) default locale response when AWS OS returns one entry with invalid locale provided', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SUCCESSFUL_GAME_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITENAME, PLATFORM, GAME_NAME, 'SPINACH TREE WAS HERE!');
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            const body = parseCompressedBody(result);
            expect(result.statusCode).toEqual(200);
            expect(body).toEqual(EXPECTED_WEB_RESP);
        });

        it('Should return (200) for sucessful web response', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SUCCESSFUL_GAME_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITENAME, PLATFORM, GAME_NAME, LOCALE_GB);

            const result: APIGatewayProxyResult = await lambdaHandler(event);

            const body = parseCompressedBody(result);
            expect(result.statusCode).toEqual(200);
            expect(body).toEqual(EXPECTED_WEB_RESP);
        });

        it('Should return (200) for successful mobile response', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SUCCESS_MOBILE_GAME_OVERRIDES);

            const event: APIGatewayProxyEvent = mockApiEvent(SITENAME, PLATFORM_MOBILE, GAME_NAME, LOCALE_GB);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            const body = parseCompressedBody(result);
            expect(result.statusCode).toEqual(200);
            expect(body).toEqual(EXPECTED_MOBILE_OVERRIDE_RESP);
        });
    });

    describe('Client error handling for 4xx status codes', () => {
        it('should return (204) when AWS OS returns no entries with ES locale provided', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITENAME, PLATFORM, GAME_NAME, LOCALE_ES);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toEqual(204);
            expect(result.statusCode).toBe(204);
            expect(result.headers?.['Cache-Control']).toBe('no-cache');
        });

        it('Should return (400) when no platform is given', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITENAME, undefined, GAME_NAME);
            const result: APIGatewayProxyResult = await lambdaHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toEqual(400);
            expect(body.code).toBe(ErrorCode.InvalidRequest);
            expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
        });

        it('Should return (400) when no gamename is given', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITENAME, PLATFORM, undefined);
            const result: APIGatewayProxyResult = await lambdaHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toEqual(400);
            expect(body.code).toBe(ErrorCode.InvalidRequest);
            expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
        });
    });

    describe('Client error handling for 5xx status codes', () => {
        it('Should return INTERNAL SERVER ERROR (500) when AWS OS returns a 401/403 status code', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);
            nock('http://localhost:9200').post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`).reply(401, []);
            const event: APIGatewayProxyEvent = mockApiEvent(SITENAME, PLATFORM, GAME_NAME);
            const result: APIGatewayProxyResult = await lambdaHandler(event);
            const body = JSON.parse(result.body);
            expect(result.statusCode).toBe(500);
            expect(body.code).toBe(ErrorCode.ServerError);
            expect(body.message).toBe('Internal Server Error');
        });

        it('Should return INTERNAL SERVER ERROR (500) when AWS OS returns a 500 status code', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(500, 'INTERNAL_ERROR');
            const event: APIGatewayProxyEvent = mockApiEvent(SITENAME, PLATFORM, GAME_NAME);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(500);
            expect(body.code).toBe(ErrorCode.ServerError);
            expect(body.message).toBe('Internal Server Error');
        });

        it('Should return should return (500) for an unexpected error', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(500, 'Unexpected error');

            const event: APIGatewayProxyEvent = mockApiEvent(SITENAME, PLATFORM, GAME_NAME);

            const result = await lambdaHandler(event);

            expect(result.statusCode).toBe(500);
            const body = JSON.parse(result.body);
            expect(body.message).toBe('Internal Server Error');
        });
    });
});
