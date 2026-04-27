import { APIGatewayProxyEvent } from 'aws-lambda';
import nock from 'nock';
import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { lambdaHandler } from '../app';
import { mockApiEvent, API_GATEWAY_PROXY_MOCK } from './mocks/gatewayMocks';
import {
    activeVariantDocument,
    mismatchVariantDocument,
    missingExpiryVariantDocument,
    expiredVariantDocument,
    invalidExpiryVariantDocument,
} from './mocks/responses';
import * as osClient from 'os-client';

process.env.HOST = 'http://localhost:9200';

const HOST = process.env.HOST as string;

describe('GetVariantFunction lambdaHandler', () => {
    beforeEach(() => {
        process.env.EXECUTION_ENVIRONMENT = 'staging';
        jest.restoreAllMocks();
        nock.cleanAll();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('returns the active variant when the document is valid and not expired', async () => {
        const memberId = '123456';
        const logSpy = jest.spyOn(osClient, 'logMessage');
        nock(HOST).get(`/${osClient.AB_VARIANT_INDEX_ALIAS}/_doc/${memberId}`).reply(200, {
            _index: osClient.AB_VARIANT_INDEX_ALIAS,
            _id: memberId,
            found: true,
            _source: activeVariantDocument(),
        });

        const response = await lambdaHandler(mockApiEvent('rainbowrichescasino', memberId));

        expect(response.statusCode).toBe(200);
        expect(osClient.parseCompressedBody(response)).toEqual({ variant: 'treatment' });
        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockRestore();
    });

    it('returns unaffected when no variant document is found', async () => {
        const memberId = '123456';
        const logSpy = jest.spyOn(osClient, 'logMessage');
        nock(HOST).get(`/${osClient.AB_VARIANT_INDEX_ALIAS}/_doc/${memberId}`).reply(200, {
            _index: osClient.AB_VARIANT_INDEX_ALIAS,
            _id: memberId,
            found: false,
        });

        const response = await lambdaHandler(mockApiEvent('rainbowriches', memberId));

        expect(response.statusCode).toBe(200);
        expect(osClient.parseCompressedBody(response)).toEqual({ variant: 'unaffected' });
        expect(logSpy).toHaveBeenCalledWith(
            'warn',
            osClient.ErrorCode.MissingVariant,
            expect.objectContaining({ memberId, siteName: 'rainbowriches' }),
        );
        logSpy.mockRestore();
    });

    it('returns unaffected when variant document is missing an expiry', async () => {
        const memberId = '123456';
        nock(HOST).get(`/${osClient.AB_VARIANT_INDEX_ALIAS}/_doc/${memberId}`).reply(200, {
            _index: osClient.AB_VARIANT_INDEX_ALIAS,
            _id: memberId,
            found: true,
            _source: missingExpiryVariantDocument(),
        });

        const response = await lambdaHandler(mockApiEvent('rainbowriches', memberId));

        expect(response.statusCode).toBe(200);
        expect(osClient.parseCompressedBody(response)).toEqual({ variant: 'unaffected' });
    });

    it('returns unaffected when variant document is expired', async () => {
        const memberId = '123456';
        nock(HOST).get(`/${osClient.AB_VARIANT_INDEX_ALIAS}/_doc/${memberId}`).reply(200, {
            _index: osClient.AB_VARIANT_INDEX_ALIAS,
            _id: memberId,
            found: true,
            _source: expiredVariantDocument(),
        });

        const response = await lambdaHandler(mockApiEvent('rainbowriches', memberId));

        expect(response.statusCode).toBe(200);
        expect(osClient.parseCompressedBody(response)).toEqual({ variant: 'unaffected' });
    });

    it('returns unaffected when variant expiry is invalid', async () => {
        const memberId = '123456';
        nock(HOST).get(`/${osClient.AB_VARIANT_INDEX_ALIAS}/_doc/${memberId}`).reply(200, {
            _index: osClient.AB_VARIANT_INDEX_ALIAS,
            _id: memberId,
            found: true,
            _source: invalidExpiryVariantDocument(),
        });

        const response = await lambdaHandler(mockApiEvent('rainbowriches', memberId));

        expect(response.statusCode).toBe(200);
        expect(osClient.parseCompressedBody(response)).toEqual({ variant: 'unaffected' });
    });

    it('warns when venture does not match but returns the variant from the document', async () => {
        const memberId = '123456';
        const logSpy = jest.spyOn(osClient, 'logMessage');
        nock(HOST).get(`/${osClient.AB_VARIANT_INDEX_ALIAS}/_doc/${memberId}`).reply(200, {
            _index: osClient.AB_VARIANT_INDEX_ALIAS,
            _id: memberId,
            found: true,
            _source: mismatchVariantDocument(),
        });

        const response = await lambdaHandler(mockApiEvent('rainbowriches', memberId));

        expect(response.statusCode).toBe(200);
        expect(osClient.parseCompressedBody(response)).toEqual({ variant: 'treatment' });
        expect(logSpy).toHaveBeenCalledWith(
            'warn',
            osClient.ErrorCode.VariantMemberVentureMismatch,
            expect.objectContaining({
                memberId,
                siteName: 'rainbowriches',
                variantVenture: mismatchVariantDocument().venture,
            }),
        );
        logSpy.mockRestore();
    });

    it('returns 500 when OpenSearch responds with an error', async () => {
        const memberId = '123456';
        nock(HOST)
            .get(`/${osClient.AB_VARIANT_INDEX_ALIAS}/_doc/${memberId}`)
            .reply(500, { error: 'Unexpected error' });

        const response = await lambdaHandler(mockApiEvent('rainbowriches', memberId));

        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body)).toEqual({
            code: osClient.ErrorCode.ServerError,
            message: osClient.getErrorMessage(osClient.ErrorCode.ServerError),
        });
    });

    it('returns a 400 response when required path parameters are missing', async () => {
        const response = await lambdaHandler({
            ...API_GATEWAY_PROXY_MOCK,
            pathParameters: null,
        } as unknown as APIGatewayProxyEvent);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toEqual({
            code: osClient.ErrorCode.InvalidRequest,
            message: osClient.getErrorMessage(osClient.ErrorCode.InvalidRequest),
        });
    });
});
