import { APIGatewayProxyEvent } from 'aws-lambda';
import { CanonicalRequest, ErrorCode, GAME_V2_TYPE, getErrorMessage, logError, verifyRequest } from 'os-client';
import { IncomingPayload } from './gamesPayload';
import { WebhookFlowError } from './errorResolution';

type HttpMethod = 'PUT' | 'POST';

const TTL = 0;
const REQUIRED_HEADERS = ['x-contentful-signature', 'x-contentful-signed-headers', 'x-contentful-timestamp'];
const EXPECTED_GAME_CONTENT_TYPE = GAME_V2_TYPE;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export const preValidateIncomingRequest = (event: APIGatewayProxyEvent, signingSecret: string): string => {
    if (!event.body || typeof event.body !== 'string') {
        throw new WebhookFlowError(
            'MissingRequestBody',
            202,
            ErrorCode.MissingRequestBody,
            getErrorMessage(ErrorCode.MissingRequestBody),
            'error',
            undefined,
            400,
        );
    }

    if (event.isBase64Encoded) {
        throw new WebhookFlowError(
            'UnsupportedBodyEncoding',
            202,
            ErrorCode.UnsupportedBodyEncoding,
            getErrorMessage(ErrorCode.UnsupportedBodyEncoding),
            'error',
            undefined,
            400,
        );
    }

    const isVerifiedRequest = requestVerification(event, signingSecret);
    if (!isVerifiedRequest) {
        throw new WebhookFlowError(
            'UnauthorizedWebhook',
            202,
            ErrorCode.UnauthorizedWebhook,
            getErrorMessage(ErrorCode.UnauthorizedWebhook),
            'error',
            undefined,
            403,
        );
    }

    return event.body;
};

export const parseAndValidatePayload = (body: string): IncomingPayload => {
    let parsedBody: unknown;
    try {
        parsedBody = JSON.parse(body);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        throw new WebhookFlowError(
            'InvalidWebhookPayload',
            202,
            ErrorCode.InvalidWebhookPayload,
            'Invalid JSON',
            'error',
            undefined,
            400,
        );
    }

    if (!isRecord(parsedBody)) {
        throw new WebhookFlowError(
            'InvalidWebhookPayload',
            202,
            ErrorCode.InvalidWebhookPayload,
            'Invalid payload shape',
            'error',
            undefined,
            400,
        );
    }

    const game = parsedBody.game;

    if (!isRecord(game)) {
        throw new WebhookFlowError(
            'InvalidWebhookPayload',
            202,
            ErrorCode.InvalidWebhookPayload,
            'Missing game object',
            'error',
            undefined,
            400,
        );
    }

    const { id, contentType, updatedAt, createdAt } = game;
    if (
        !isNonEmptyString(id) ||
        !isNonEmptyString(contentType) ||
        !isNonEmptyString(updatedAt) ||
        !isNonEmptyString(createdAt)
    ) {
        throw new WebhookFlowError(
            'InvalidWebhookPayload',
            202,
            ErrorCode.InvalidWebhookPayload,
            'Missing game id, contentType, updatedAt or createdAt',
            'error',
            undefined,
            400,
        );
    }

    if (contentType !== EXPECTED_GAME_CONTENT_TYPE) {
        throw new WebhookFlowError(
            'InvalidWebhookPayload',
            202,
            ErrorCode.InvalidWebhookPayload,
            'Content type not valid',
            'error',
            undefined,
            400,
        );
    }

    return parsedBody as unknown as IncomingPayload;
};

export const requestVerification = (event: APIGatewayProxyEvent, secretKey: string): boolean => {
    try {
        if (event.httpMethod !== 'POST') return false;

        const headers = Object.fromEntries(
            Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v ?? '']),
        );

        // Required security headers from Contentful
        const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers[header]);

        if (missingHeaders.length > 0) {
            console.error(`Missing required headers: ${missingHeaders.join(', ')}`);
            return false;
        }

        const rawBody = event.isBase64Encoded
            ? Buffer.from(event.body ?? '', 'base64').toString('utf8')
            : (event.body ?? '');

        if (!headers['content-length']) {
            const bytes = event.isBase64Encoded
                ? Buffer.from(event.body ?? '', 'base64')
                : Buffer.from(rawBody, 'utf8');
            headers['content-length'] = String(bytes.length);
        }

        const canonicalPath = event.requestContext?.path ?? event.path;

        const canonicalReq: CanonicalRequest = {
            method: event.httpMethod as HttpMethod,
            path: canonicalPath,
            headers,
            body: rawBody,
        };

        return verifyRequest(secretKey, canonicalReq, TTL);
    } catch (e: unknown) {
        logError(ErrorCode.UnauthorizedWebhook, 403, {}, e instanceof Error ? e.message : String(e));
        return false;
    }
};
