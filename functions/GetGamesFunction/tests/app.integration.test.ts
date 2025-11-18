// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
process.env.API_KEY = 'API-KEY-FOR-THE-AGES';
process.env.HOST = 'http://localhost:9200';
process.env.OS_USER = 'your-username';
process.env.OS_PASS = 'your-password';

import { lambdaHandler } from '../app';
import nock from 'nock';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { mockApiEvent } from './mocks/gatewayMocks';
import { NOT_FOUND_RESPONSE, VENTURE_SUCCESS_RESP } from './mocks/responses';
import { GAMES_SUCCESS_RESP, GAMES_NO_INNER_HITS_RESP } from './mocks/gameResponses';
import { SECTION_SUCCESS_RESP } from './mocks/sectionResponses';
import {
    SECTION_GAMES_SUCCESS_RESPONSE,
    MOBILE_SECTION_GAMES_SUCCESS_RESPONSE,
    EXPECTED_ML_SUGGESTED_RESPONSE,
} from './mocks/expectedAPIResponse';
import {
    BECAUSE_YOU_PLAYED_GAME_SUCCESS_RESPONSE_V2,
    ML_BECAUSE_YOU_PLAYED_INDEX_RESP_V2,
    ML_SUGGESTED_INDEX_RESP,
    SUGGESTED_SECTION_RESP,
    SUGGESTED_GAME_SUCCESS_RESPONSE,
    BECAUSE_YOU_PLAYED_SECTION_RESP,
    NO_PERSONALISED_NO_GAMES_RESP,
    RECENTLY_PLAYED_SECTION_RESP,
    ML_RECENTLY_PLAYED_INDEX_RESP,
    RECENTLY_PLAYED_GAME_SUCCESS_RESPONSE,
} from './mocks/personalizationMocks';
import {
    ErrorCode,
    getErrorMessage,
    ML_GAMES_RECOMMENDER_INDEX_ALIAS,
    ALL_SECTIONS_SHARED_READ_ALIAS,
    GAMES_INDEX_V2_ALIAS,
    VENTURES_INDEX_ALIAS,
    ML_BECAUSE_YOU_PLAYED_X_ALIAS,
    ML_RECENTLY_PLAYED_ALIAS,
} from 'os-client';

jest.mock('@opensearch-project/opensearch', () => {
    const actualOpenSearch: any = jest.requireActual('@opensearch-project/opensearch');
    return {
        Client: actualOpenSearch.Client,
    };
});

const SITE_NAME = 'doublebubblebingo';
const VIEW_SLUG = 'homepage';
const SECTION_ID = '7H8um3qZjY7dpedPoL5tw';
const PLATFORM = 'web';
const PLATFORM_MOBILE = 'ios';

const SECTION_SUGGESTED_FOR_YOU_ID = '4nfvX6HkrV8pAJKBlTl8Q4';
const SECTION_BECAUSE_YOU_PLAYED_ID = 'QS7inszdk83OHGhwX3iSp';
const SECTION_RECENTLY_PLAYED_ID = '6NBGF7dCAX3silldblHBlI';
const MEMBER_ID = '21551306';

describe('Integration Test for Lambda Handler', () => {
    beforeEach(() => {
        process.env.EXECUTION_ENVIRONMENT = 'staging';
        nock.cleanAll();
    });

    describe('Client Success for 2xx status codes', () => {
        it('Should return (200) for a successful web section games response', async () => {
            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SECTION_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${GAMES_INDEX_V2_ALIAS}/_search?request_cache=true`)
                .reply(200, GAMES_SUCCESS_RESP);

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM, VIEW_SLUG, SECTION_ID);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toEqual(200);
            expect(result.body).toEqual(JSON.stringify(SECTION_GAMES_SUCCESS_RESPONSE));
        });

        it('Should return (200) for a successful mobile section games response', async () => {
            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SECTION_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${GAMES_INDEX_V2_ALIAS}/_search?request_cache=true`)
                .reply(200, GAMES_SUCCESS_RESP);

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM_MOBILE, VIEW_SLUG, SECTION_ID);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toEqual(200);
            expect(result.body).toEqual(JSON.stringify(MOBILE_SECTION_GAMES_SUCCESS_RESPONSE));
        });

        it('Should return (200) for ML Suggested section games response', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SUGGESTED_SECTION_RESP);

            nock('http://localhost:9200')
                .post(`/${ML_GAMES_RECOMMENDER_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, ML_SUGGESTED_INDEX_RESP);

            nock('http://localhost:9200')
                .post(`/${GAMES_INDEX_V2_ALIAS}/_search?request_cache=true`)
                .reply(200, SUGGESTED_GAME_SUCCESS_RESPONSE);

            nock('http://localhost:9200')
                .post(`/${GAMES_INDEX_V2_ALIAS}/_search?request_cache=true`)
                .reply(200, SUGGESTED_GAME_SUCCESS_RESPONSE);
            const event = mockApiEvent(SITE_NAME, PLATFORM, VIEW_SLUG, SECTION_SUGGESTED_FOR_YOU_ID, MEMBER_ID);
            const result = await lambdaHandler(event);

            expect(result.statusCode).toEqual(200);
            expect(result.body).toEqual(JSON.stringify(EXPECTED_ML_SUGGESTED_RESPONSE));
        });

        it('Should return (200) for a ML Because you played section games response', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, BECAUSE_YOU_PLAYED_SECTION_RESP);

            nock('http://localhost:9200')
                .post(`/${ML_BECAUSE_YOU_PLAYED_X_ALIAS}/_search?request_cache=true`)
                .reply(200, ML_BECAUSE_YOU_PLAYED_INDEX_RESP_V2);

            nock('http://localhost:9200')
                .post(`/${GAMES_INDEX_V2_ALIAS}/_search?request_cache=true`)
                .reply(200, BECAUSE_YOU_PLAYED_GAME_SUCCESS_RESPONSE_V2);

            const event = mockApiEvent(SITE_NAME, PLATFORM, VIEW_SLUG, SECTION_BECAUSE_YOU_PLAYED_ID, MEMBER_ID);
            const result = await lambdaHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toEqual(200);
            expect(Array.isArray(body)).toBe(true);
            expect(body.length).toBeGreaterThanOrEqual(4);
            expect(body[0]).toHaveProperty('entryId');
            expect(body[0]).toHaveProperty('gameId');
            expect(body[0]).toHaveProperty('gameSkin');
        });

        it('Should return (200) for a ML Recently played section games response', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, RECENTLY_PLAYED_SECTION_RESP);

            nock('http://localhost:9200')
                .post(`/${ML_RECENTLY_PLAYED_ALIAS}/_search?request_cache=true`)
                .reply(200, ML_RECENTLY_PLAYED_INDEX_RESP);

            nock('http://localhost:9200')
                .post(`/${GAMES_INDEX_V2_ALIAS}/_search?request_cache=true`)
                .reply(200, RECENTLY_PLAYED_GAME_SUCCESS_RESPONSE);

            const event = mockApiEvent(SITE_NAME, PLATFORM, VIEW_SLUG, SECTION_RECENTLY_PLAYED_ID, MEMBER_ID);
            const result = await lambdaHandler(event);
            expect(result.statusCode).toEqual(200);
            const body = JSON.parse(result.body);
            expect(Array.isArray(body)).toBe(true);
            expect(body.some((game) => game.gameId === 'excluded-game-id')).toBe(false);
            expect(body.some((game) => game.gameId === 'allowed-game-id')).toBe(true);
        });

        it('should keep correct wager order for recently played recommendations', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, RECENTLY_PLAYED_SECTION_RESP);

            nock('http://localhost:9200')
                .post(`/${ML_RECENTLY_PLAYED_ALIAS}/_search?request_cache=true`)
                .reply(200, ML_RECENTLY_PLAYED_INDEX_RESP);

            nock('http://localhost:9200')
                .post(`/${GAMES_INDEX_V2_ALIAS}/_search?request_cache=true`)
                .reply(200, RECENTLY_PLAYED_GAME_SUCCESS_RESPONSE);

            const event = mockApiEvent(SITE_NAME, PLATFORM, VIEW_SLUG, SECTION_RECENTLY_PLAYED_ID, MEMBER_ID);
            const result = await lambdaHandler(event);

            expect(result.statusCode).toEqual(200);
            const body = JSON.parse(result.body);

            const orderedGameIds = body.map((game: { gameId: string }) => game.gameId);
            expect(orderedGameIds).toEqual([
                'default-game-id',
                'allowed-game-id',
                'allowed-game-id-2',
                'allowed-game-id-3',
            ]);
        });
    });

    describe('Client error handling for 4xx status codes', () => {
        // We console log internal_message: 'Client received statusCode 204 with empty games array' for us only
        // since we dont want to spam client as some sections don't have games anyways
        it('Should return empty array[] if no games and siteGames are returned', async () => {
            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SECTION_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${GAMES_INDEX_V2_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM, VIEW_SLUG, SECTION_ID);
            const result: APIGatewayProxyResult = await lambdaHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toEqual(200);
            expect(body).toEqual([]);
        });

        it('should return (204) if no games in inner_hits are returned', async () => {
            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SECTION_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${GAMES_INDEX_V2_ALIAS}/_search?request_cache=true`)
                .reply(200, GAMES_NO_INNER_HITS_RESP);

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM, VIEW_SLUG, SECTION_ID);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toEqual(204);
            expect(result.statusCode).toBe(204);
            expect(result.headers?.['Cache-Control']).toBe('no-cache');
        });

        it('should return (204) for invalid SECTION_ID', async () => {
            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM, VIEW_SLUG, 'invalid');
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toEqual(204);
            expect(result.statusCode).toBe(204);
            expect(result.headers?.['Cache-Control']).toBe('no-cache');
        });

        it('Should return (400) to the client if sitename is missing', async () => {
            const event: APIGatewayProxyEvent = mockApiEvent(undefined, PLATFORM, VIEW_SLUG, SECTION_ID);
            const result: APIGatewayProxyResult = await lambdaHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toEqual(400);
            expect(body.code).toBe(ErrorCode.InvalidRequest);
            expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
        });

        it('Should return (400) to the client if platform is missing', async () => {
            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, undefined, VIEW_SLUG, SECTION_ID);
            const result: APIGatewayProxyResult = await lambdaHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toEqual(400);
            expect(body.code).toBe(ErrorCode.InvalidRequest);
            expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
        });

        it('Should return (400) to the client if viewslug is missing', async () => {
            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM, undefined, SECTION_ID);
            const result: APIGatewayProxyResult = await lambdaHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toEqual(400);
            expect(body.code).toBe(ErrorCode.InvalidRequest);
            expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
        });

        it('Should return (400) for unauthenticated request for personalised section', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SUGGESTED_SECTION_RESP);

            nock('http://localhost:9200')
                .post(`/${ML_GAMES_RECOMMENDER_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, NO_PERSONALISED_NO_GAMES_RESP);

            const event = mockApiEvent(SITE_NAME, PLATFORM, VIEW_SLUG, SECTION_SUGGESTED_FOR_YOU_ID, '');
            const result = await lambdaHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toEqual(400);
            expect(body.code).toBe(ErrorCode.InvalidRequest);
            expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
        });
    });

    describe('Client error handling for 5xx status codes', () => {
        it('Should return (500) for an unexpected error', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(500, 'Unexpected error');

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM, VIEW_SLUG, SECTION_ID);
            const result = await lambdaHandler(event);
            const body = JSON.parse(result.body);

            expect(result.statusCode).toBe(500);
            expect(body.message).toBe('Internal Server Error');
        });
    });
});
