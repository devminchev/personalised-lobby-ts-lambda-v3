process.env.API_KEY = 'API-KEY-FOR-THE-AGES';
process.env.HOST = 'http://localhost:9200';
process.env.OS_USER = 'your-username';
process.env.OS_PASS = 'your-password';

import { lambdaHandler } from '../app';
import { APIGatewayProxyEvent } from 'aws-lambda';
import nock from 'nock';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { mockApiEvent, API_GATEWAY_PROXY_MOCK } from './mocks/gatewayMocks';
import {
    VENTURE_SUCCESS_RESP,
    NOT_FOUND_RESPONSE,
    NAVIGATION_SUCCESS_RESP,
    LINK_SUCCESS_RESPONSE,
    MISSING_LINK_TYPE_IN_NAV_RESP,
    VIEW_SUCCESS_RESPONSE,
} from './mocks/responses';
import {
    ErrorCode,
    getErrorMessage,
    VENTURES_INDEX_ALIAS,
    NAVIGATION_INDEX_READ_ALIAS,
    VIEW_INDEX_READ_ALIAS,
    parseCompressedBody,
} from 'os-client';

jest.mock('@opensearch-project/opensearch', () => {
    const actualOpenSearch: any = jest.requireActual('@opensearch-project/opensearch');
    return {
        Client: actualOpenSearch.Client,
    };
});

const EMPTY_BODY_RESP = { bottomNavLinks: [], links: [] };

describe('Integration Test for Lambda Handler', () => {
    beforeEach(() => {
        process.env.EXECUTION_ENVIRONMENT = 'staging';
        nock.cleanAll();
    });

    it('should return navigations links for a valid site name', async () => {
        const siteName = 'testsite';
        const platform = 'ios';
        // Mock the getVentures OpenSearch response
        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        // Mock the getNavigation OpenSearch response
        nock('http://localhost:9200')
            .post(`/${NAVIGATION_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, NAVIGATION_SUCCESS_RESP);

        // Mock the getLink OpenSearch response
        nock('http://localhost:9200')
            .post(`/${NAVIGATION_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, LINK_SUCCESS_RESPONSE);

        // Mock the getViews OpenSearch response
        nock('http://localhost:9200')
            .post(`/${VIEW_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, VIEW_SUCCESS_RESPONSE);

        const event: APIGatewayProxyEvent = mockApiEvent(siteName, platform);
        const result = await lambdaHandler(event);
        expect(result.statusCode).toBe(200);
        const body = parseCompressedBody<{ links: Array<{ entryId: string }> }>(result);
        expect(body.links).toHaveLength(1);
        expect(body.links[0].entryId).toBe('link-id-1');
    });

    it('should return (204) for invalid site name', async () => {
        const siteName = 'invalidsite';
        const platform = 'ios';

        // Mock the getVentures OpenSearch response with no hits
        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, NOT_FOUND_RESPONSE);

        const event: APIGatewayProxyEvent = mockApiEvent(siteName, platform);

        const result = await lambdaHandler(event);

        expect(result.statusCode).toEqual(204);
        expect(result.statusCode).toBe(204);
        expect(result.headers?.['Cache-Control']).toBe('no-cache');
    });

    it('should return (204) if no links are returned', async () => {
        const siteName = 'testsite';
        const platform = 'ios';

        // Mock the getVentures OpenSearch response
        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        // Mock the getNavigation OpenSearch response with no hits
        nock('http://localhost:9200')
            .post(`/${NAVIGATION_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, NOT_FOUND_RESPONSE);

        const event: APIGatewayProxyEvent = mockApiEvent(siteName, platform);

        const result = await lambdaHandler(event);

        expect(result.statusCode).toEqual(204);
        expect(result.statusCode).toBe(204);
        expect(result.headers?.['Cache-Control']).toBe('no-cache');
    });

    it('should return 200 but with empty links if links are missing in the response', async () => {
        const siteName = 'testsite';
        const platform = 'ios';

        // Mock the getVentures OpenSearch response
        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        // Mock the getNavigation OpenSearch response
        nock('http://localhost:9200')
            .post(`/${NAVIGATION_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, MISSING_LINK_TYPE_IN_NAV_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(siteName, platform);

        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(200);
        const body = parseCompressedBody<{ links: Array<unknown>; bottomNavLinks: Array<unknown> }>(result);
        expect(body).toEqual({
            links: [],
            bottomNavLinks: [],
        });
    });

    it('should return (400) to the client if the sitename path param is missing', async () => {
        const event: APIGatewayProxyEvent = API_GATEWAY_PROXY_MOCK;

        const result = await lambdaHandler(event);

        expect(result.statusCode).toEqual(400);
        const body = parseCompressedBody<{ code: string; message: string }>(result);
        expect(body.code).toBe(ErrorCode.InvalidRequest);
        expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
    });

    it('should return 500 for an unexpected error', async () => {
        const siteName = 'testsite';
        const platform = 'ios';

        // Mock the getVentures OpenSearch response with an unexpected error
        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(500, 'Unexpected error');

        const event: APIGatewayProxyEvent = mockApiEvent(siteName, platform);

        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(500);
        const body = parseCompressedBody<{ message: string }>(result);
        expect(body.message).toBe('Internal Server Error');
    });
});
