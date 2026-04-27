import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler } from './control/handler';
import { AB_VARIANT_HEADER, AbVariant, isAbVariant, LogCode, logMessage } from 'os-client';

/**
 * GetGamesFunction
 * Version: 1.0.1
 * Purpose: Retrieves a list of games available to the user.
 * Last updated: 2025-04-01-7
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 * lobby variants:
 *  - treatment: x percent of users using new adaptive feature
 *  - control: x percent of user using current feature
 *  - unaffected: not affected but still using current feature
 */

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const lobbyVariant = event.headers?.[AB_VARIANT_HEADER];

    if (isAbVariant(lobbyVariant)) {
        logMessage('log', LogCode.VariantUsed, {}, lobbyVariant);
    }

    if (lobbyVariant === AbVariant.Treatment) {
        //TODO: change to treatment handler logic
        return handler(event);
    }

    // return control / unaffected variant
    return handler(event);
};
