import { gzipSync } from 'zlib';
import { ErrorCode, errorMessages, logError } from './errors';
import { jsonResponse } from './responseCompression';

interface IRespLogParams {
    eventReqId?: string;
    siteName?: string;
    platform?: string;
    userLocale?: string;
}

export type EmptyNavResponse = {
    links: [];
    bottomNavLinks: [];
};

export type EmptyPageViewResponse = {
    name: string;
    viewSlug: string;
    classification: string;
    topContent: [];
    primaryContent: [];
};

export type EmptySectionViewResponse = {
    title: string;
    classification: string;
    layoutType: string;
    games: [];
};

export type EmptySectionGamesResponse = never[];

export type EmptyDataResponse = Record<string, never>;

const defaultHeaders = {
    'Content-Type': 'application/json',
    'Content-Encoding': 'gzip',
    Vary: 'Accept-Encoding',
};

/**
 * Builds a gzip-compressed API Gateway response.
 */
export const gzipResponse = (
    payload: unknown,
    statusCode = 200,
    headers: Record<string, string> = {},
): { statusCode: number; headers: Record<string, string>; body: string; isBase64Encoded: boolean } => {
    const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const compressed = gzipSync(bodyString);
    return {
        statusCode,
        headers: { ...defaultHeaders, ...headers },
        // API Gateway expects binary payloads to be base64-wrapped; it will decode this and forward gzip bytes.
        body: compressed.toString('base64'),
        isBase64Encoded: true,
    };
};

/**
 * Creates a structured response for downstream clients when OSClient calls fail whilst logging the failure context.
 * Error responses are intentionally NOT compressed - they are small payloads where compression overhead outweighs benefits.
 * @param {unknown} error - The error thrown by the upstream request.
 * @param {EmptyNavResponse | EmptyPageViewResponse | EmptySectionViewResponse | EmptySectionGamesResponse | EmptyDataResponse} [_expectedEmptyBody] -
 * Optional empty payload shape returned when no content is expected (e.g. 404 scenarios).
 * @param {IRespLogParams} [params] - Optional metadata describing the request for enriched error logs.
 * @returns {{ statusCode: number; headers?: Record<string, string>; body: string }} A Lambda-compatible response containing either a 204 empty body or a 4xx/5xx error payload.
 */
export const errorResponseHandler = (
    error: unknown,
    _expectedEmptyBody?:
        | EmptyNavResponse
        | EmptyPageViewResponse
        | EmptySectionViewResponse
        | EmptySectionGamesResponse
        | EmptyDataResponse,
    params?: IRespLogParams,
) => {
    const errorCode = (error as any).code;
    const statusCode = (error as any).statusCode || 500;
    const { message: clientErrorMessage, code: clientErrorCode } = clientErrorsFromStatus(statusCode);

    const isNoContentResp = statusCode === 404;

    const baseHeaders = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Request-Id-timestamp': `Lambda invoked at: ${new Date().toISOString()} - API Gateway Request ID: ${params?.eventReqId}s`,
    };

    const emptyRespBody = jsonResponse('', 204, baseHeaders);

    const errorRespBody = jsonResponse(
        {
            code: clientErrorCode,
            message: clientErrorMessage,
        },
        statusCode,
        baseHeaders,
    );

    logError(ErrorCode.ExecutionError, statusCode, {
        internalErrorCode: errorCode,
        ...params,
        error,
    });

    return isNoContentResp ? emptyRespBody : errorRespBody;
};

const clientErrorsFromStatus = (status: number): Record<string, string> => {
    switch (status) {
        case 400:
            return { message: errorMessages[ErrorCode.InvalidRequest], code: ErrorCode.InvalidRequest };
        case 404:
            return { message: errorMessages[ErrorCode.NoResults], code: ErrorCode.NoResults };
        case 500:
            return { message: errorMessages[ErrorCode.ServerError], code: ErrorCode.ServerError };
        default:
            return { message: errorMessages[ErrorCode.InvalidRequest], code: ErrorCode.InvalidRequest };
    }
};
