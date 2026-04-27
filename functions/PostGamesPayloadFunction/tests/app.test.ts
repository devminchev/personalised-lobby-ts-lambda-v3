import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { ErrorCode, getClient, getErrorMessage, IG_GAMES_V2_WRITE_ALIAS, logError } from 'os-client';
import { lambdaHandler } from '../app';
import { indexToOpenSearch } from '../lib/writeToOS';
import { IncomingPayload, modifyEventGamePayload } from '../lib/gamesPayload';
import { parseAndValidatePayload, preValidateIncomingRequest } from '../lib/requestValidation';
import { WebhookFlowError } from '../lib/errorResolution';

process.env.CONTENTFUL_ACCESS_TOKEN = 'token';
process.env.SPACE_ID = 'space-id';
process.env.CONTENTFUL_ENVIRONMENT = 'staging';
process.env.CONTENTFUL_WEBHOOKS_SIGNING_SECRET = 'webhook-secret';

jest.mock('../lib/requestValidation', () => ({
    preValidateIncomingRequest: jest.fn(),
    parseAndValidatePayload: jest.fn(),
}));

jest.mock('../lib/gamesPayload', () => ({
    modifyEventGamePayload: jest.fn(),
}));

jest.mock('../lib/writeToOS', () => ({
    indexToOpenSearch: jest.fn(),
}));

jest.mock('os-client', () => {
    const actual = jest.requireActual<typeof import('os-client')>('os-client');
    return {
        ...actual,
        getClient: jest.fn(),
        logError: jest.fn(),
    };
});

const getClientMock = jest.mocked(getClient);
const preValidateIncomingRequestMock = jest.mocked(preValidateIncomingRequest);
const parseAndValidatePayloadMock = jest.mocked(parseAndValidatePayload);
const modifyEventGamePayloadMock = jest.mocked(modifyEventGamePayload);
const indexToOpenSearchMock = jest.mocked(indexToOpenSearch);
const logErrorMock = jest.mocked(logError);

const baseEvent = () => ({
    body: JSON.stringify({ game: { id: 'game-1', contentType: 'gameV2', updatedAt: '2026-01-10T10:00:00.000Z' } }),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/contentful/webhook',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
        accountId: '123456789012',
        apiId: 'api-id',
        authorizer: null,
        protocol: 'HTTP/1.1',
        httpMethod: 'POST',
        identity: {
            accessKey: null,
            accountId: null,
            apiKey: null,
            apiKeyId: null,
            caller: null,
            clientCert: null,
            cognitoAuthenticationProvider: null,
            cognitoAuthenticationType: null,
            cognitoIdentityId: null,
            cognitoIdentityPoolId: null,
            principalOrgId: null,
            sourceIp: '127.0.0.1',
            user: null,
            userAgent: 'jest-test',
            userArn: null,
        },
        path: '/contentful/webhook',
        requestId: 'req-id',
        requestTimeEpoch: 0,
        resourceId: 'resource-id',
        resourcePath: '/contentful/webhook',
        stage: 'test',
    },
    resource: '/contentful/webhook',
});

describe('PostGamesPayloadFunction lambdaHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getClientMock.mockReturnValue({} as ReturnType<typeof getClient>);
        preValidateIncomingRequestMock.mockReturnValue(
            JSON.stringify({ game: { id: 'game-1', contentType: 'gameV2', updatedAt: '2026-01-10T10:00:00.000Z' } }),
        );
        parseAndValidatePayloadMock.mockReturnValue({ game: { id: 'game-1' } } as IncomingPayload);
        modifyEventGamePayloadMock.mockReturnValue({
            id: 'game-1',
            cmsEnv: 'staging',
            contentType: 'gameV2',
            updatedAt: '2026-01-10T10:00:00.000Z',
            createdAt: '2026-01-09T10:00:00.000Z',
            cmsChangeVersion: 1,
            entryTitle: 'Mega Spin Entry',
            gameName: 'Mega Spin',
            gameSkin: 'mega-skin',
            mobileGameName: 'Mega Spin Mobile',
            mobileGameSkin: 'mega-mobile-skin',
            platformVisibility: [],
            gamePlatformConfig: {
                demoUrl: 'demo',
                realUrl: 'real',
                gameLoaderFileName: 'loader.js',
                gameProvider: 'provider',
                gameType: { type: 'slots' },
                subGameType: 'sub-type',
                federalGameType: 'federal-type',
            },
        });
        indexToOpenSearchMock.mockResolvedValue(undefined);
    });

    it('returns 202 no-op when body is missing', async () => {
        const event = { ...baseEvent(), body: null };
        preValidateIncomingRequestMock.mockImplementation(() => {
            throw new WebhookFlowError(
                'MissingRequestBody',
                202,
                ErrorCode.MissingRequestBody,
                getErrorMessage(ErrorCode.MissingRequestBody),
                'error',
                undefined,
                400,
            );
        });

        const result = await lambdaHandler(event);
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(202);
        expect(body).toEqual({
            updated: false,
            skipped: true,
            reason: 'MissingRequestBody',
            message: getErrorMessage(ErrorCode.MissingRequestBody),
        });
        expect(logErrorMock).toHaveBeenCalledWith(
            ErrorCode.MissingRequestBody,
            400,
            expect.any(Object),
            getErrorMessage(ErrorCode.MissingRequestBody),
        );
        expect(indexToOpenSearchMock).not.toHaveBeenCalled();
    });

    it('returns 202 and skips update when request body is base64 encoded', async () => {
        const event = { ...baseEvent(), isBase64Encoded: true };
        preValidateIncomingRequestMock.mockImplementation(() => {
            throw new WebhookFlowError(
                'UnsupportedBodyEncoding',
                202,
                ErrorCode.UnsupportedBodyEncoding,
                getErrorMessage(ErrorCode.UnsupportedBodyEncoding),
                'error',
                undefined,
                400,
            );
        });

        const result = await lambdaHandler(event);
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(202);
        expect(body).toEqual({
            updated: false,
            skipped: true,
            reason: 'UnsupportedBodyEncoding',
            message: getErrorMessage(ErrorCode.UnsupportedBodyEncoding),
        });
        expect(indexToOpenSearchMock).not.toHaveBeenCalled();
    });

    it('returns 202 no-op when webhook signature verification fails', async () => {
        preValidateIncomingRequestMock.mockImplementation(() => {
            throw new WebhookFlowError(
                'UnauthorizedWebhook',
                202,
                ErrorCode.UnauthorizedWebhook,
                getErrorMessage(ErrorCode.UnauthorizedWebhook),
                'error',
                undefined,
                403,
            );
        });

        const result = await lambdaHandler(baseEvent());
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(202);
        expect(body).toEqual({
            updated: false,
            skipped: true,
            reason: 'UnauthorizedWebhook',
            message: getErrorMessage(ErrorCode.UnauthorizedWebhook),
        });
        expect(logErrorMock).toHaveBeenCalledWith(
            ErrorCode.UnauthorizedWebhook,
            403,
            expect.any(Object),
            getErrorMessage(ErrorCode.UnauthorizedWebhook),
        );
        expect(indexToOpenSearchMock).not.toHaveBeenCalled();
    });

    it('returns 202 no-op when payload parsing/validation fails', async () => {
        parseAndValidatePayloadMock.mockImplementation(() => {
            throw new WebhookFlowError('InvalidWebhookPayload', 202, ErrorCode.InvalidWebhookPayload, 'Invalid JSON');
        });

        const result = await lambdaHandler(baseEvent());
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(202);
        expect(body).toEqual({
            updated: false,
            skipped: true,
            reason: 'InvalidWebhookPayload',
            message: 'Invalid JSON',
        });
        expect(logErrorMock).toHaveBeenCalledWith(
            ErrorCode.InvalidWebhookPayload,
            202,
            expect.any(Object),
            'Invalid JSON',
        );
        expect(indexToOpenSearchMock).not.toHaveBeenCalled();
    });

    it('returns 202 no-op when payload validation fails on missing createdAt', async () => {
        parseAndValidatePayloadMock.mockImplementation(() => {
            throw new WebhookFlowError(
                'InvalidWebhookPayload',
                202,
                ErrorCode.InvalidWebhookPayload,
                'Missing game id, contentType, or updatedAt',
                'error',
                undefined,
                400,
            );
        });

        const result = await lambdaHandler(baseEvent());
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(202);
        expect(body).toEqual({
            updated: false,
            skipped: true,
            reason: 'InvalidWebhookPayload',
            message: 'Missing game id, contentType, or updatedAt',
        });
        expect(indexToOpenSearchMock).not.toHaveBeenCalled();
    });

    it('returns 202 no-op when payload transform fails', async () => {
        modifyEventGamePayloadMock.mockImplementation(() => {
            throw new WebhookFlowError(
                'MissingGamePayload',
                202,
                ErrorCode.MissingGamePayload,
                getErrorMessage(ErrorCode.MissingGamePayload),
                'error',
                undefined,
                400,
            );
        });

        const result = await lambdaHandler(baseEvent());
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(202);
        expect(body).toEqual({
            updated: false,
            skipped: true,
            reason: 'MissingGamePayload',
            message: getErrorMessage(ErrorCode.MissingGamePayload),
        });
        expect(indexToOpenSearchMock).not.toHaveBeenCalled();
    });

    it('returns 200 and indexes when mapping applies warning-only field fallbacks', async () => {
        modifyEventGamePayloadMock.mockReturnValue({
            id: 'game-1',
            cmsEnv: 'master',
            contentType: 'gameV2',
            updatedAt: '2026-01-10T10:00:00.000Z',
            createdAt: '2026-01-10T10:00:00.000Z',
            cmsChangeVersion: 1,
            entryTitle: 'Mega Spin Entry',
            gameName: 'Mega Spin',
            gameSkin: 'mega-skin',
            mobileGameName: 'Mega Spin Mobile',
            mobileGameSkin: 'mega-mobile-skin',
            platformVisibility: [],
            gamePlatformConfig: {
                demoUrl: 'demo',
                realUrl: 'real',
                gameLoaderFileName: 'loader.js',
                gameProvider: 'provider',
                gameType: { type: 'slots' },
                subGameType: 'sub-type',
                federalGameType: 'federal-type',
            },
        });

        const result = await lambdaHandler(baseEvent());
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(200);
        expect(body).toEqual({
            updated: true,
        });
        expect(indexToOpenSearchMock).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({ cmsEnv: 'master', createdAt: '2026-01-10T10:00:00.000Z' }),
            IG_GAMES_V2_WRITE_ALIAS,
        );
    });

    it('returns 200 and writes transformed payload to OpenSearch on success', async () => {
        const result = await lambdaHandler(baseEvent());
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(200);
        expect(body).toEqual({ updated: true });
        expect(indexToOpenSearchMock).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({ id: 'game-1' }),
            IG_GAMES_V2_WRITE_ALIAS,
        );
    });

    it('returns 202 and skips indexing when payload mapping signals incomplete platform config', async () => {
        modifyEventGamePayloadMock.mockImplementation(() => {
            throw new WebhookFlowError(
                'IncompletePlatformConfig',
                202,
                ErrorCode.InvalidWebhookPayload,
                'Skipping OpenSearch indexing for entry game-1 due to incomplete platform config: gameName and gameSkin are required!',
                'warn',
                { entryId: 'game-1', skipReason: 'IncompletePlatformConfig' },
            );
        });

        const result = await lambdaHandler(baseEvent());
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(202);
        expect(body).toEqual({
            updated: false,
            skipped: true,
            reason: 'IncompletePlatformConfig',
            entryId: 'game-1',
            message:
                'Skipping OpenSearch indexing for entry game-1 due to incomplete platform config: gameName and gameSkin are required!',
        });
        expect(indexToOpenSearchMock).not.toHaveBeenCalled();
        expect(logErrorMock).toHaveBeenCalledWith(
            ErrorCode.InvalidWebhookPayload,
            202,
            expect.objectContaining({ entryId: 'game-1', skipReason: 'IncompletePlatformConfig', logLevel: 'warn' }),
            expect.stringContaining('gameName and gameSkin are required'),
        );
    });

    it('returns upstream status code and no-op payload when indexing throws', async () => {
        const err = Object.assign(new Error('OpenSearch temporary failure'), {
            statusCode: 503,
            code: ErrorCode.OpenSearchTemporaryFailure,
        });
        indexToOpenSearchMock.mockRejectedValue(err);

        const result = await lambdaHandler(baseEvent());
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(503);
        expect(body).toEqual({
            updated: false,
            skipped: true,
            reason: 'OpenSearchTemporaryFailure',
            message: 'OpenSearch temporary failure',
        });
    });

    it('returns 429 and no-op payload when indexing is throttled', async () => {
        const err = Object.assign(new Error('OpenSearch throttled'), {
            statusCode: 429,
            code: ErrorCode.OpenSearchThrottled,
        });
        indexToOpenSearchMock.mockRejectedValue(err);

        const result = await lambdaHandler(baseEvent());
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(429);
        expect(body).toEqual({
            updated: false,
            skipped: true,
            reason: 'OpenSearchThrottled',
            message: 'OpenSearch throttled',
        });
        expect(logErrorMock).toHaveBeenCalledWith(
            ErrorCode.OpenSearchThrottled,
            429,
            expect.any(Object),
            'OpenSearch throttled',
        );
    });

    it('returns 202 no-op when runtime environment configuration is missing', async () => {
        const originalEnv = process.env.CONTENTFUL_ENVIRONMENT;
        delete process.env.CONTENTFUL_ENVIRONMENT;

        const result = await lambdaHandler(baseEvent());
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(202);
        expect(body).toEqual({
            updated: false,
            skipped: true,
            reason: 'MissingRuntimeConfig',
            message: 'Missing Contentful access token or space id or environment',
        });
        expect(logErrorMock).toHaveBeenCalledWith(
            ErrorCode.ExecutionError,
            500,
            expect.any(Object),
            'Missing Contentful access token or space id or environment',
        );

        process.env.CONTENTFUL_ENVIRONMENT = originalEnv;
    });
});
