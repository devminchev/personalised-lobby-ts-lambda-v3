process.env.API_KEY = 'API-KEY-FOR-THE-AGES';
process.env.HOST = 'http://localhost:9200';
process.env.OS_USER = 'your-username';
process.env.OS_PASS = 'your-password';

import { lambdaHandler } from '../app';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import nock from 'nock';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { mockApiEvent } from './mocks/gatewayMock';
import { NOT_FOUND_RESPONSE, SUCCESSFUL_GAME_RESPONSE, DUPLICATE_GAME_SKIN_RESPONSE } from './mocks/responses';
import { ErrorCode, getErrorMessage, parseCompressedBody, IG_GAMES_V2_READ_ALIAS } from 'os-client';
import { EXPECTED_WEB_RESP } from './mocks/expectedAPIResponses';

jest.mock('@opensearch-project/opensearch', () => {
    const actualOpenSearch: any = jest.requireActual('@opensearch-project/opensearch');
    return {
        Client: actualOpenSearch.Client,
    };
});

const GAME_SKIN = 'MGSD_GOLD_BLITZ';

describe('Integration Test for Lambda Handler', () => {
    beforeEach(() => {
        nock.cleanAll();
    });
    describe('Successful response for 2xx status codes', () => {
        it('Should return (200) response when AWS OS returns one entry', async () => {
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SUCCESSFUL_GAME_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(GAME_SKIN);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            const body = parseCompressedBody(result);
            expect(result.statusCode).toEqual(200);
            expect(body).toEqual(EXPECTED_WEB_RESP);
        });

        it('should log a duplicate warning and still return (200) when OS returns multiple hits with the same gameSkin', async () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(jest.fn());

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, DUPLICATE_GAME_SKIN_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(GAME_SKIN);
            const result: APIGatewayProxyResult = await lambdaHandler(event);
            const body = parseCompressedBody(result);

            expect(result.statusCode).toEqual(200);
            expect(body).toEqual(EXPECTED_WEB_RESP);
            expect(warnSpy).toHaveBeenCalledWith(
                `Expected 1 entry, received 2 entries. Only considering the first entry...`,
            );

            warnSpy.mockRestore();
        });

        it('should return (204) when no game was returned', async () => {
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(GAME_SKIN);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toEqual(204);
            expect(result.statusCode).toBe(204);
            expect(result.headers?.['Cache-Control']).toBe('no-cache');
        });
    });

    describe('Client error handling for 4xx status codes', () => {
        it('should return (204) when AWS OS returns no entries with no locale provided', async () => {
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(GAME_SKIN);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toBe(204);
            expect(result.headers?.['Cache-Control']).toBe('no-cache');
        });

        it('Should return (400) when siteName is not "all"', async () => {
            const event: APIGatewayProxyEvent = mockApiEvent(GAME_SKIN, 'jackpotjoy');
            const result: APIGatewayProxyResult = await lambdaHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toEqual(400);
            expect(body.code).toBe(ErrorCode.InvalidRequest);
            expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
        });

        it('Should return (400) when no gameSkin is given', async () => {
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(undefined);
            const result: APIGatewayProxyResult = await lambdaHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toEqual(400);
            expect(body.code).toBe(ErrorCode.InvalidRequest);
            expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
        });
    });

    describe('Client error handling for 5xx status codes', () => {
        it('Should return INTERNAL SERVER ERROR (500) when AWS OS returns a 401/403 status code', async () => {
            nock('http://localhost:9200').post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`).reply(401, []);

            const event: APIGatewayProxyEvent = mockApiEvent(GAME_SKIN);
            const result: APIGatewayProxyResult = await lambdaHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(500);
            expect(body.code).toBe(ErrorCode.ServerError);
            expect(body.message).toBe('Internal Server Error');
        });

        it('Should return INTERNAL SERVER ERROR (500) when AWS OS returns a 500 status code', async () => {
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(500, 'Internal Server Error');

            const event: APIGatewayProxyEvent = mockApiEvent(GAME_SKIN);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(500);
            expect(body.code).toBe(ErrorCode.ServerError);
            expect(body.message).toBe('Internal Server Error');
        });

        it('Should return should return (500) for an unexpected error', async () => {
            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(500, 'Unexpected error');

            const event: APIGatewayProxyEvent = mockApiEvent(GAME_SKIN);

            const result = await lambdaHandler(event);

            expect(result.statusCode).toBe(500);
            const body = JSON.parse(result.body);
            expect(body.message).toBe('Internal Server Error');
        });
    });
});
