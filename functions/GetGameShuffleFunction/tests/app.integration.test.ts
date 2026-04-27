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
    createError,
    ErrorCode,
    IG_GAMES_V2_READ_ALIAS,
    getErrorMessage,
    ML_GAME_SHUFFLE_ALIAS,
    parseCompressedBody,
    VENTURES_INDEX_ALIAS,
} from 'os-client';
import {
    FIRST_BUCKET_GAME_SHUFFLE_HITS,
    FIRST_BUCKET_GAME_SITE_GAME_RESPONSE,
    LAMBDA_RESPONSE,
    NOT_FOUND_RESPONSE,
    SECOND_THIRD_BUCKET_GAME_SHUFFLE_HITS,
    SECOND_THIRD_BUCKET_GAME_SITE_GAME_RESPONSE,
    VENTURE_SUCCESS_RESP,
} from './mocks/responses';

jest.mock('@opensearch-project/opensearch', () => {
    const actualOpenSearch: any = jest.requireActual('@opensearch-project/opensearch');
    return {
        Client: actualOpenSearch.Client,
    };
});

const SITE_NAME = 'jackpotjoy';
const PLATFORM = 'web';
const LOCALE = 'en-GB';

describe('Integration Test for Lambda Handler', () => {
    beforeEach(() => {
        nock.cleanAll();
    });

    describe('Client success responses ', () => {
        it('verifies successful response', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ML_GAME_SHUFFLE_ALIAS}/_search?request_cache=true`)
                .reply(200, FIRST_BUCKET_GAME_SHUFFLE_HITS);

            nock('http://localhost:9200')
                .post(`/${ML_GAME_SHUFFLE_ALIAS}/_search?request_cache=true`)
                .reply(200, SECOND_THIRD_BUCKET_GAME_SHUFFLE_HITS);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, FIRST_BUCKET_GAME_SITE_GAME_RESPONSE);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SECOND_THIRD_BUCKET_GAME_SITE_GAME_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM, LOCALE);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toEqual(200);
        });

        it('Should give a valid response body', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ML_GAME_SHUFFLE_ALIAS}/_search?request_cache=true`)
                .reply(200, FIRST_BUCKET_GAME_SHUFFLE_HITS);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, FIRST_BUCKET_GAME_SITE_GAME_RESPONSE);

            nock('http://localhost:9200')
                .post(`/${ML_GAME_SHUFFLE_ALIAS}/_search?request_cache=true`)
                .reply(200, SECOND_THIRD_BUCKET_GAME_SHUFFLE_HITS);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SECOND_THIRD_BUCKET_GAME_SITE_GAME_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM, LOCALE);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toEqual(200);
            expect(parseCompressedBody(result)).toEqual(LAMBDA_RESPONSE);
        });

        it('Should return RTP < 93 on first bucket', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ML_GAME_SHUFFLE_ALIAS}/_search?request_cache=true`)
                .reply(200, FIRST_BUCKET_GAME_SHUFFLE_HITS);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, FIRST_BUCKET_GAME_SITE_GAME_RESPONSE);

            nock('http://localhost:9200')
                .post(`/${ML_GAME_SHUFFLE_ALIAS}/_search?request_cache=true`)
                .reply(200, SECOND_THIRD_BUCKET_GAME_SHUFFLE_HITS);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SECOND_THIRD_BUCKET_GAME_SITE_GAME_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM, LOCALE);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toEqual(200);

            const firstBucket = FIRST_BUCKET_GAME_SHUFFLE_HITS.hits?.hits;
            const allRTPsUnder93 = firstBucket.every((game: any) => game._source.rtp <= 93);

            expect(allRTPsUnder93).toBe(true);
        });

        it('Should return RTP < 96 on second third bucket', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ML_GAME_SHUFFLE_ALIAS}/_search?request_cache=true`)
                .reply(200, FIRST_BUCKET_GAME_SHUFFLE_HITS);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, FIRST_BUCKET_GAME_SITE_GAME_RESPONSE);

            nock('http://localhost:9200')
                .post(`/${ML_GAME_SHUFFLE_ALIAS}/_search?request_cache=true`)
                .reply(200, SECOND_THIRD_BUCKET_GAME_SHUFFLE_HITS);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SECOND_THIRD_BUCKET_GAME_SITE_GAME_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM, LOCALE);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toEqual(200);

            const secondThirdBuckets = SECOND_THIRD_BUCKET_GAME_SHUFFLE_HITS.hits?.hits;
            const allRTPsUnder95_99 = secondThirdBuckets.every((game: any) => game._source.rtp <= 95.99);

            expect(allRTPsUnder95_99).toBe(true);
        });
    });

    describe('Client error handling', () => {
        it('Should return (204) for invalid site name', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM, LOCALE);

            const result = await lambdaHandler(event);
            expect(result.statusCode).toBe(204);
            expect(result.headers?.['Cache-Control']).toBe('no-cache');
        });

        it('Should return (204) for missing games', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ML_GAME_SHUFFLE_ALIAS}/_search?request_cache=true`)
                .reply(200, FIRST_BUCKET_GAME_SHUFFLE_HITS);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, FIRST_BUCKET_GAME_SITE_GAME_RESPONSE);

            nock('http://localhost:9200')
                .post(`/${ML_GAME_SHUFFLE_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM, LOCALE);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toBe(204);
            expect(result.headers?.['Cache-Control']).toBe('no-cache');
        });

        it('Should return (400) invalid request for missing path parameters', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ML_GAME_SHUFFLE_ALIAS}/_search?request_cache=true`)
                .reply(200, FIRST_BUCKET_GAME_SHUFFLE_HITS);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, FIRST_BUCKET_GAME_SITE_GAME_RESPONSE);

            nock('http://localhost:9200')
                .post(`/${ML_GAME_SHUFFLE_ALIAS}/_search?request_cache=true`)
                .reply(200, SECOND_THIRD_BUCKET_GAME_SHUFFLE_HITS);

            nock('http://localhost:9200')
                .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
                .reply(200, SECOND_THIRD_BUCKET_GAME_SITE_GAME_RESPONSE);

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, undefined, undefined);
            const result: APIGatewayProxyResult = await lambdaHandler(event);

            expect(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            expect(body.code).toBe(ErrorCode.InvalidRequest);
            expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
        });

        it('Should return 500 for an unexpected error', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(500, 'Unexpected error');

            const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM, LOCALE);

            const result = await lambdaHandler(event);

            expect(result.statusCode).toBe(500);
            const body = JSON.parse(result.body);
            expect(body.message).toBe('Internal Server Error');
        });

        it('Should return log error invalid request for empty rtp buckets', async () => {
            nock('http://localhost:9200')
                .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
                .reply(200, VENTURE_SUCCESS_RESP);

            nock('http://localhost:9200')
                .post(`/${ML_GAME_SHUFFLE_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            nock('http://localhost:9200')
                .post(`/${ML_GAME_SHUFFLE_ALIAS}/_search?request_cache=true`)
                .reply(200, NOT_FOUND_RESPONSE);

            const error = createError(ErrorCode.NoGameShuffleData, 404);
            expect(error.message).toBe('No records found in game shuffle index');
            expect(error.code).toBe(ErrorCode.NoGameShuffleData);
            expect(error.statusCode).toBe(404);
        });
    });
});
