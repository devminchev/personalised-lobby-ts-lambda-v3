process.env.HOST = 'http://localhost:9200';
process.env.OS_USER = 'your-username';
process.env.OS_PASS = 'your-password';

import { lambdaHandler } from '../app';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import nock from 'nock';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { mockApiEvent } from './mocks/gatewayMocks';
import { NOT_FOUND_RESPONSE, VENTURE_SUCCESS_RESP } from './mocks/responses';
import {
    ErrorCode,
    getErrorMessage,
    VENTURES_INDEX_ALIAS,
    CATEGORIES_INDEX_ALIAS,
    NAVIGATION_INDEX,
    NAVIGATION_INDEX_READ_ALIAS,
} from 'os-client';

const SITE_NAME = 'jackpotjoy';
const PLATFORM = 'web';

jest.mock('@opensearch-project/opensearch', () => {
    const actualOpenSearch: any = jest.requireActual('@opensearch-project/opensearch');
    return {
        Client: actualOpenSearch.Client,
    };
});

describe('Integration Test for Lambda Handler', () => {
    beforeEach(() => {
        process.env.EXECUTION_ENVIRONMENT = 'staging';
        nock.cleanAll();
    });

    it('should return 404 if navigation query returns no results', async () => {
        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${NAVIGATION_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, NOT_FOUND_RESPONSE);

        const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM);
        const result: APIGatewayProxyResult = await lambdaHandler(event);
        expect(result.statusCode).toEqual(404);

        const body = JSON.parse(result.body);
        expect(body.code).toBe(ErrorCode.MissingNavigation);
    });

    it('should return 400 to the client if any of the path parameters are missing', async () => {
        const event: APIGatewayProxyEvent = mockApiEvent(undefined);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(400);
        const body = JSON.parse(result.body);
        expect(body.code).toBe(ErrorCode.MissingParams);
        expect(body.message).toBe(getErrorMessage(ErrorCode.MissingParams));
    });

    it('should return 500 for an unexpected error', async () => {
        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(500, 'Unexpected error');

        const event: APIGatewayProxyEvent = mockApiEvent(SITE_NAME, PLATFORM);
        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(500);
        const body = JSON.parse(result.body);
        expect(body.message).toBe('Internal Server Error');
    });
});
