process.env.API_KEY = 'API-KEY-FOR-THE-AGES';
process.env.HOST = 'http://localhost:9200';
process.env.OS_USER = 'your-username';
process.env.OS_PASS = 'your-password';

import { APIGatewayProxyResult } from 'aws-lambda';
import nock from 'nock';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { ErrorCode, getErrorMessage } from 'os-client';

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

    it('should return 400 to the client if any of the path parameters are missing', async () => {
        const result: APIGatewayProxyResult = {
            statusCode: 400,
            body: JSON.stringify({ code: ErrorCode.MissingParams, message: 'One or more path params are missing' }),
        };

        expect(result.statusCode).toEqual(400);
        const body = JSON.parse(result.body);
        expect(body.code).toBe(ErrorCode.MissingParams);
        expect(body.message).toBe(getErrorMessage(ErrorCode.MissingParams));
    });

    it('should give 404 bad response when no games return', async () => {
        const result: APIGatewayProxyResult = {
            statusCode: 404,
            body: JSON.stringify({ code: ErrorCode.NoGamesReturned, message: 'No games were returned' }),
        };

        expect(result.statusCode).toEqual(404);
        const body = JSON.parse(result.body);
        expect(body.code).toBe(ErrorCode.NoGamesReturned);
        expect(body.message).toBe(getErrorMessage(ErrorCode.NoGamesReturned));
    });
});
