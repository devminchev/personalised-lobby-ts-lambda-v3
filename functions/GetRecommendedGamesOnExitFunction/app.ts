import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    checkRequestParams,
    patchVentureName,
    validateLocaleQuery,
    handleSpaceLocalization,
    validators,
    errorResponseHandler,
    gzipResponse,
} from 'os-client';
import { getGamebyGameSkin } from './lib/index';

/**
 * GetRecommendedGamesOnExitFunction
 * Version: 1.0.1
 * Purpose: Retrieves additional get recommended games data for enhanced user experience.
 * Last updated: 2025-04-01-7
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const eventReqId = event?.requestContext?.requestId;

    const siteNameFromParams = event.pathParameters?.sitename as string;
    const platform = event.pathParameters?.platform as string;
    const gameSkin = event.pathParameters?.gameskin as string;
    const siteName = patchVentureName(siteNameFromParams);
    const locale: string = validateLocaleQuery(event.queryStringParameters?.locale);

    try {
        const client = getClient();

        checkRequestParams([siteNameFromParams, validators.siteName], [platform, validators.platform], gameSkin);

        const spaceLocale = handleSpaceLocalization();

        const extraData = await getGamebyGameSkin(client, siteName, gameSkin, locale, spaceLocale, platform);

        return gzipResponse(extraData);
    } catch (err) {
        const errorLogParams = {
            eventReqId,
            siteName,
            platform,
            gameSkin,
            locale,
        };
        return errorResponseHandler(err, [], errorLogParams);
    }
};
