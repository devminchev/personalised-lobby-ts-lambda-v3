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
    BECAUSE_YOU_PLAYED_GAME_SUCCESS_RESPONSE,
    GAMES_SUCCESS_RESP,
    JACKPOT_GAMES_SUCCESS_RESP,
    SUGGESTED_GAME_SUCCESS_RESPONSE,
} from './mocks/responses/gameResponses';
import {
    SUCCESSFUL_BECAUSE_YOU_PLAYED_RESPONSE,
    SUCCESSFUL_JACKPOT_SECTION_RESPONSE,
    SUCCESSFUL_SECTION_VIEW_RESPONSE,
    SUCCESSFUL_SUGGESTED_FOR_YOU_VIEW_RESPONSE,
} from './mocks/responses/successfulAPIResponses';
import {
    DBB_VENTURE_SUCCESS_RESP,
    NOT_FOUND_RESPONSE,
    JPJ_VENTURE_SUCCESS_RESP,
} from './mocks/responses/commonResponses';
import { ML_BECAUSE_YOU_PLAYED_INDEX_RESP, ML_SUGGESTED_INDEX_RESP } from './mocks/responses/mlResponses';
import {
    IG_GAME_SECTION_SUCCESS_RESP,
    IG_JACKPOT_SECTION_SUCCESS_RESP,
    IG_PERSONAL_BECAUSE_YOU_PLAYED_SUCCESS_RESP,
    IG_PERSONAL_SUGGESTED_SUCCESS_RESP,
} from './mocks/responses/igSectionResponses';
import {
    ALL_SECTIONS_SHARED_READ_ALIAS,
    ErrorCode,
    getErrorMessage,
    IG_GAMES_V2_READ,
    VENTURES_INDEX_ALIAS,
} from 'os-client';

jest.mock('@opensearch-project/opensearch', () => {
    const actualOpenSearch: any = jest.requireActual('@opensearch-project/opensearch');
    return {
        Client: actualOpenSearch.Client,
    };
});

const SITE_NAME = 'jackpotjoy';
const GAME_SECTION_SLUG = 'new-slots';
const JACKPOT_SECTION_SLUG = 'rapid-fire';
const PERSONALISED_SUGGESTED_FOR_YOU_SLUG = 'suggested-for-you-games';
const PERSONALISED_BECAUSE_YOU_PLAYED_SLUG = 'because-you-played-suggestions';
const PLATFORM = 'web';
const AUTH = 'true';
const LOCALE = 'en-GB';
const MEMBER_ID = '21551306';

const EMPTY_BODY_RESP = {
    title: '',
    classification: '',
    layoutType: '',
    games: [],
};

describe('Integration Test for Lambda Handler', () => {
    beforeEach(() => {
        process.env.EXECUTION_ENVIRONMENT = 'staging';
        nock.cleanAll();
    });

    describe('Successful response for 2xx status codes', () => {
        it('should return 200 for successful Game Section response', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, JPJ_VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, IG_GAME_SECTION_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, IG_GAME_SECTION_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ}/_search?request_cache=true`)
                .reply(200, GAMES_SUCCESS_RESP);

            const event: APIGatewayProxyEvent = mockApiEvent(
                SITE_NAME,
                GAME_SECTION_SLUG,
                PLATFORM,
                LOCALE,
                AUTH,
                MEMBER_ID,
            );
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body).toEqual(SUCCESSFUL_SECTION_VIEW_RESPONSE);
        });

        it('should return 200 for successful Jackpot Games Section response ', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, JPJ_VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, IG_JACKPOT_SECTION_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, IG_JACKPOT_SECTION_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ}/_search?request_cache=true`)
                .reply(200, JACKPOT_GAMES_SUCCESS_RESP);

            const event: APIGatewayProxyEvent = mockApiEvent(
                SITE_NAME,
                JACKPOT_SECTION_SLUG,
                PLATFORM,
                LOCALE,
                AUTH,
                MEMBER_ID,
            );
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body).toEqual(SUCCESSFUL_JACKPOT_SECTION_RESPONSE);
        });

        it('should return 200 for successful Personalised Section (suggested-for-you-games) response ', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, JPJ_VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, IG_PERSONAL_SUGGESTED_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, IG_PERSONAL_SUGGESTED_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, ML_SUGGESTED_INDEX_RESP);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ}/_search?request_cache=true`)
                .reply(200, SUGGESTED_GAME_SUCCESS_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(
                SITE_NAME,
                PERSONALISED_SUGGESTED_FOR_YOU_SLUG,
                PLATFORM,
                LOCALE,
                AUTH,
            );
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body).toEqual(SUCCESSFUL_SUGGESTED_FOR_YOU_VIEW_RESPONSE);
        });

        it('should return 200 for successful Personalised Section (because-you-played) response ', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, DBB_VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, IG_PERSONAL_BECAUSE_YOU_PLAYED_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, IG_PERSONAL_BECAUSE_YOU_PLAYED_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, ML_BECAUSE_YOU_PLAYED_INDEX_RESP);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ}/_search?request_cache=true`)
                .reply(200, BECAUSE_YOU_PLAYED_GAME_SUCCESS_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(
                'doublebubblebingo',
                PERSONALISED_BECAUSE_YOU_PLAYED_SLUG,
                PLATFORM,
                LOCALE,
                AUTH,
            );
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body).toEqual(SUCCESSFUL_BECAUSE_YOU_PLAYED_RESPONSE);
        });
    });

    describe('Client error handling for 4xx status codes', () => {
        it('should return (400) for missing path parameters', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, JPJ_VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, IG_GAME_SECTION_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ}/_search?request_cache=true`)
                .reply(200, GAMES_SUCCESS_RESP);

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, undefined, undefined);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            expect(body.code).toBe(ErrorCode.InvalidRequest);
            expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
        });

        it('should return (400) with empty body for invalid site name', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent('invalidVenture', GAME_SECTION_SLUG, PLATFORM);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            expect(body.code).toBe(ErrorCode.InvalidRequest);
            expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
        });

        it('should return (204) with empty body for missing ig section', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, JPJ_VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, GAME_SECTION_SLUG, PLATFORM, LOCALE);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toEqual(204);
            expect(result.statusCode).toBe(204);
            expect(result.headers?.['Cache-Control']).toBe('no-cache');
        });

        it('should return (204) for missing games', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, JPJ_VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, IG_GAME_SECTION_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, IG_GAME_SECTION_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(
                SITE_NAME,
                GAME_SECTION_SLUG,
                PLATFORM,
                LOCALE,
                AUTH,
                MEMBER_ID,
            );
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toEqual(204);
            expect(result.statusCode).toBe(204);
            expect(result.headers?.['Cache-Control']).toBe('no-cache');
        });
    });

    describe('Client error handling for 5xx status codes', () => {
        it('should return 500 for an unexpected error', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(500, 'Unexpected error');

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, GAME_SECTION_SLUG, PLATFORM);

            const result = await lambdaHandler(event);

            expect(result.statusCode).toBe(500);
            const body = JSON.parse(result.body);
            expect(body.message).toBe('Internal Server Error');
        });
    });
});
