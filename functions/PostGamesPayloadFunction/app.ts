import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ErrorCode, IClient, IG_GAMES_V2_WRITE_ALIAS, getClient, jsonResponse, logError } from 'os-client';
import { parseAndValidatePayload, preValidateIncomingRequest } from './lib/requestValidation';
import { modifyEventGamePayload } from './lib/gamesPayload';
import { buildNoopPayload } from './lib/noopResponse';
import { indexToOpenSearch } from './lib/writeToOS';
import { WebhookFlowError, resolveWebhookError, toNoopPayloadOptions } from './lib/errorResolution';

/**
 * PostGamesPayloadFunction
 * Version: 1.0.2
 * Purpose: Validates and processes Contentful game webhooks, transforms the game payload, and indexes it to OpenSearch.
 * Last updated: 2026-02-12-1
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * Workflow:
 * - Verifies webhook signature and rejects unauthorized requests.
 * - Validates and normalizes request payload data.
 * - Indexes game documents into the `games-v3` alias using external versioning.
 * - Retries transient OpenSearch failures and treats version conflicts as idempotent success.
 *
 * @param {Object} event - API Gateway Lambda Proxy Input Format request event.
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} API Gateway Lambda Proxy Output Format response.
 *
 */

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const signingSecret = (process.env['CONTENTFUL_WEBHOOKS_SIGNING_SECRET'] || '').trim();
    const environmentId = process.env.CONTENTFUL_ENVIRONMENT;
    const eventReqId = event?.requestContext?.requestId;

    try {
        if (!process.env.CONTENTFUL_ACCESS_TOKEN || !process.env.SPACE_ID || !process.env.CONTENTFUL_ENVIRONMENT) {
            throw new WebhookFlowError(
                'MissingRuntimeConfig',
                202,
                ErrorCode.ExecutionError,
                'Missing Contentful access token or space id or environment',
                'error',
                undefined,
                500,
            );
        }

        const osClient: IClient = getClient();

        const rawBody = preValidateIncomingRequest(event, signingSecret);
        const incomingPayload = parseAndValidatePayload(rawBody);
        const mappedPayload = modifyEventGamePayload(incomingPayload);

        await indexToOpenSearch(osClient, mappedPayload, IG_GAMES_V2_WRITE_ALIAS);
        return jsonResponse({ updated: true });
    } catch (err: unknown) {
        const resolved = resolveWebhookError(err);
        const responseBody = buildNoopPayload(resolved.reason, toNoopPayloadOptions(resolved));

        // This branch of logging is only for alarms: keep alarm-compatible error-shaped log, but business severity is warning/skip.
        if (resolved.logLevel === 'warn') {
            logError(
                resolved.errorCode,
                resolved.logStatusCode,
                { eventReqId, environmentId, ...resolved.logContext, logLevel: resolved.logLevel },
                resolved.message,
            );
        } else {
            logError(
                resolved.errorCode,
                resolved.logStatusCode,
                { eventReqId, environmentId, ...resolved.logContext, error: err },
                resolved.message,
            );
        }

        return jsonResponse(responseBody, resolved.statusCode);
    }
};
