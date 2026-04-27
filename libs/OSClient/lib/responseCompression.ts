import { gzipSync, gunzipSync } from 'zlib';

const defaultHeaders = {
    'Content-Type': 'application/json',
    'Content-Encoding': 'gzip',
    Vary: 'Accept-Encoding',
};

const defaultJsonHeaders = {
    'Content-Type': 'application/json',
};

export interface ICompressionRespResult {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    isBase64Encoded: boolean;
}

/**
 * Builds a gzip-compressed API Gateway response.
 * @param payload - The payload to compress (object or string)
 * @param statusCode - HTTP status code (default: 200)
 * @param headers - Additional headers to merge with defaults
 * @returns Lambda-compatible response with compressed body
 */
export const gzipResponse = (
    payload: unknown,
    statusCode = 200,
    headers: Record<string, string> = {},
): ICompressionRespResult => {
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
 * Builds an uncompressed JSON API Gateway response.
 * @param payload - The payload to serialize (object or string)
 * @param statusCode - HTTP status code (default: 200)
 * @param headers - Additional headers to merge with defaults
 * @returns Lambda-compatible response with uncompressed body
 */
export const jsonResponse = (
    payload: unknown,
    statusCode = 200,
    headers: Record<string, string> = {},
): ICompressionRespResult => {
    const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return {
        statusCode,
        headers: { ...defaultJsonHeaders, ...headers },
        body: bodyString,
        isBase64Encoded: false,
    };
};

interface CompressedResponse {
    body: string;
    isBase64Encoded?: boolean;
    headers?: Record<string, string | number | boolean>;
}

/**
 * Parses a gzip-compressed Lambda response body back to its original form.
 * Useful for testing Lambda handlers that return compressed responses.
 * @param response - The Lambda response object with potentially compressed body
 * @returns The parsed body as type T, or the raw body if not compressed
 */
export const parseCompressedBody = <T = unknown>(response: CompressedResponse): T => {
    const headers = response.headers ?? {};
    const contentEncodingHeader = headers['Content-Encoding'] ?? headers['content-encoding'];
    const contentTypeHeader = headers['Content-Type'] ?? headers['content-type'];
    const contentEncoding = typeof contentEncodingHeader === 'string' ? contentEncodingHeader.toLowerCase() : '';
    const contentType = typeof contentTypeHeader === 'string' ? contentTypeHeader.toLowerCase() : '';

    const isGzip = response.isBase64Encoded && contentEncoding === 'gzip';
    const rawBody = isGzip ? gunzipSync(Buffer.from(response.body, 'base64')).toString() : response.body;

    const isJson = contentType.includes('json');
    if (isJson) {
        try {
            return JSON.parse(rawBody) as T;
        } catch {
            return rawBody as unknown as T;
        }
    }

    return rawBody as unknown as T;
};
