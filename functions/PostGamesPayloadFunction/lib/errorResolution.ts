import { ErrorCode, getErrorMessage } from 'os-client';

export type NoopReason =
    | 'MissingRequestBody'
    | 'UnsupportedBodyEncoding'
    | 'UnauthorizedWebhook'
    | 'InvalidWebhookPayload'
    | 'IncompletePlatformConfig'
    | 'MissingGamePayload'
    | 'MissingEnvironmentId'
    | 'MissingRuntimeConfig'
    | 'OpenSearchThrottled'
    | 'OpenSearchTemporaryFailure'
    | 'ExecutionError';

export type WebhookLogLevel = 'error' | 'warn';

export class WebhookFlowError extends Error {
    constructor(
        readonly reason: NoopReason,
        readonly statusCode: number,
        readonly errorCode: ErrorCode,
        message: string,
        readonly logLevel: WebhookLogLevel = 'error',
        readonly logContext?: Record<string, unknown>,
        readonly logStatusCode: number = statusCode,
    ) {
        super(message);
        this.name = 'WebhookFlowError';
    }
}

export type ResolvedErrorResponse = {
    statusCode: number;
    reason: NoopReason;
    message: string;
    errorCode: ErrorCode;
    logStatusCode: number;
    logLevel: WebhookLogLevel;
    logContext?: Record<string, unknown>;
};

const asStatusCode = (error: unknown): number => {
    const status = (error as { statusCode?: unknown })?.statusCode;
    return typeof status === 'number' && status >= 400 && status <= 599 ? status : 500;
};

const isErrorCode = (value: unknown): value is ErrorCode =>
    typeof value === 'string' && Object.values(ErrorCode).includes(value as ErrorCode);

export const resolveWebhookError = (error: unknown): ResolvedErrorResponse => {
    if (error instanceof WebhookFlowError) {
        return {
            statusCode: error.statusCode,
            reason: error.reason,
            message: error.message,
            errorCode: error.errorCode,
            logStatusCode: error.logLevel === 'warn' ? 202 : error.logStatusCode,
            logLevel: error.logLevel,
            logContext: error.logContext,
        };
    }

    const statusCode = asStatusCode(error);
    const code = (error as { code?: unknown })?.code;
    const message = error instanceof Error ? error.message : getErrorMessage(ErrorCode.ServerError);
    const resolvedErrorCode = isErrorCode(code) ? code : ErrorCode.ExecutionError;

    const resolutionKey: 'OpenSearchThrottled' | 'OpenSearchTemporaryFailure' | 'ExecutionError' = (() => {
        switch (true) {
            case statusCode === 429 || code === ErrorCode.OpenSearchThrottled:
                return 'OpenSearchThrottled';
            case statusCode === 503 || code === ErrorCode.OpenSearchTemporaryFailure:
                return 'OpenSearchTemporaryFailure';
            default:
                return 'ExecutionError';
        }
    })();

    switch (resolutionKey) {
        case 'OpenSearchThrottled':
            return {
                statusCode: 429,
                reason: 'OpenSearchThrottled',
                message,
                errorCode: ErrorCode.OpenSearchThrottled,
                logStatusCode: 429,
                logLevel: 'error',
            };
        case 'OpenSearchTemporaryFailure':
            return {
                statusCode: 503,
                reason: 'OpenSearchTemporaryFailure',
                message,
                errorCode: ErrorCode.OpenSearchTemporaryFailure,
                logStatusCode: 503,
                logLevel: 'error',
            };
        default:
            return {
                statusCode,
                reason: 'ExecutionError',
                message,
                errorCode: resolvedErrorCode,
                logStatusCode: statusCode,
                logLevel: 'error',
            };
    }
};

export const toNoopPayloadOptions = (
    resolved: ResolvedErrorResponse,
): { message?: string; entryId?: string } | undefined => {
    const message = resolved.message;
    const entryId = resolved.reason === 'IncompletePlatformConfig' ? resolved.logContext?.entryId : undefined;

    const options = {
        ...(typeof message === 'string' && message.length > 0 ? { message } : {}),
        ...(typeof entryId === 'string' && entryId.length > 0 ? { entryId } : {}),
    };

    return Object.keys(options).length > 0 ? options : undefined;
};
