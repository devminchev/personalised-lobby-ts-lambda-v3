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
    INDEX_EMPTY_RESP,
    ML_BECAUSE_YOU_PLAYED_INDEX_RESP,
    ML_BECAUSE_YOU_PLAYED_INDEX_RESP_UNSUPPORTED_VENDOR,
    PERSONALISED_DATA_RESP_ES,
    PERSONALISED_DATA_RESP_ES_NO_LOCALE_GUARD,
    PERSONALISED_DATA_RESP_NO_GAME_INDEX,
} from './mocks/responses';
import { ErrorCode, getErrorMessage, ML_BECAUSE_YOU_PLAYED_X_Y_Z_ALIAS } from 'os-client';

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

    it('should return ML Because You Played game title for logged in user, with ML data available on personalized section', async () => {
        const sitename = 'doublebubblebingo';
        const memberid = '18530334';
        const locale = 'es-ES';

        nock('http://localhost:9200')
            .post(`/${ML_BECAUSE_YOU_PLAYED_X_Y_Z_ALIAS}/_search?request_cache=true`)
            .reply(200, ML_BECAUSE_YOU_PLAYED_INDEX_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, memberid, locale);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify(PERSONALISED_DATA_RESP_ES));
    });

    it('should return empty response for logged in user, with ML data available on personalized section, but the vendor is not infinity or roxor', async () => {
        const sitename = 'botemania';
        const memberid = '18530334';
        const locale = 'es-ES';

        nock('http://localhost:9200')
            .post(`/${ML_BECAUSE_YOU_PLAYED_X_Y_Z_ALIAS}/_search?request_cache=true`)
            .reply(200, ML_BECAUSE_YOU_PLAYED_INDEX_RESP_UNSUPPORTED_VENDOR);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, memberid, locale);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify({}));
    });

    it('should return ML Because You Played game title for logged in user when game index is unavailable, with ML data available on personalized section', async () => {
        const sitename = 'doublebubblebingo';
        const memberid = '18530334';
        const locale = 'es-ES';

        nock('http://localhost:9200')
            .post(`/${ML_BECAUSE_YOU_PLAYED_X_Y_Z_ALIAS}/_search?request_cache=true`)
            .reply(200, ML_BECAUSE_YOU_PLAYED_INDEX_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, memberid, locale);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify(PERSONALISED_DATA_RESP_NO_GAME_INDEX));
    });

    it('should return ML Because You Played game title for logged in user when locale is missing and default locale hits guard, with ML data available on personalized section', async () => {
        const sitename = 'doublebubblebingo';
        const memberid = '18530334';

        nock('http://localhost:9200')
            .post(`/${ML_BECAUSE_YOU_PLAYED_X_Y_Z_ALIAS}/_search?request_cache=true`)
            .reply(200, ML_BECAUSE_YOU_PLAYED_INDEX_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, memberid);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify(PERSONALISED_DATA_RESP_ES_NO_LOCALE_GUARD));
    });

    it('should return an empty object for ML Because You Played for logged in user, when no ML data is available for the user', async () => {
        const sitename = 'doublebubblebingo';
        const memberid = '18530334';

        nock('http://localhost:9200')
            .post(`/${ML_BECAUSE_YOU_PLAYED_X_Y_Z_ALIAS}/_search?request_cache=true`)
            .reply(200, INDEX_EMPTY_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, memberid);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify({}));
    });

    it('should return (400) to the client if memberid is missing', async () => {
        const sitename = 'jackpotjoy';

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, undefined);

        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(400);
        const body = JSON.parse(result.body);
        expect(body.code).toBe(ErrorCode.InvalidRequest);
        expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
    });

    it('should return 200 with an empty response for an unexpected error while processing recommendations', async () => {
        const sitename = 'jackpotjoy';
        const memberid = '1234';

        nock('http://localhost:9200')
            .post(`/${ML_BECAUSE_YOU_PLAYED_X_Y_Z_ALIAS}/_search?request_cache=true`)
            .reply(500, 'Unexpected error');

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, memberid);

        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body).toEqual({});
    });
});
