import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    ErrorCode,
    logError,
    validateLocaleQuery,
    handleSpaceLocalization,
    checkRequestParams,
    patchVentureName,
    IMlPersonalizedSection,
    becauseYouPlayedShared,
    IBecauseYouPlayedResult,
    getVentureId,
} from 'os-client';
import { createPayload } from './lib';

/**
 * GetBecauseYouPlayedFunction
 * Version: 1.0.1
 * Purpose: Provides recommendations based on user's play history.
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
    const client = getClient();
    const SECTION_TYPE = 'because-you-played';

    //path param
    const siteNameFromParams = event.pathParameters?.sitename as string;
    const siteName = patchVentureName(siteNameFromParams);
    const platform = event.pathParameters?.platform as string;

    //query param
    const memberId = event.queryStringParameters?.memberid as string;
    const userLocale: string = validateLocaleQuery(event.queryStringParameters?.locale);

    try {
        checkRequestParams(siteName, platform, memberId);

        const spaceLocale = handleSpaceLocalization();
        const ventureId = await getVentureId(client, siteName, spaceLocale, platform);

        const { gameName, mlRecommendedGameSkins, recommendedGames }: IBecauseYouPlayedResult =
            await becauseYouPlayedShared({
                client,
                sectionType: SECTION_TYPE as IMlPersonalizedSection,
                ventureId,
                memberId,
                siteName,
                spaceLocale,
                platform,
            });

        const sectionGamesPayload =
            recommendedGames.length === 0
                ? []
                : createPayload({
                      gameName,
                      mlRecommendedGameIds: mlRecommendedGameSkins,
                      recommendedGames,
                      spaceLocale,
                      localeOverride: userLocale,
                      platform,
                  });

        return {
            statusCode: 200,
            body: JSON.stringify(sectionGamesPayload),
        };
    } catch (err) {
        const errorCode = (err as any).code;
        const statusCode = (err as any).statusCode || 500;
        const errorMessage = (err as Error).message;
        logError(ErrorCode.ExecutionError, statusCode, { siteName, platform, memberId, userLocale, err });

        return {
            statusCode: statusCode,
            body: JSON.stringify({
                code: errorCode,
                message: errorMessage,
            }),
        };
    }
};
