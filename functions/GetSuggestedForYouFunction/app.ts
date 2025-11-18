import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    validateLocaleQuery,
    handleSpaceLocalization,
    ISectionGame,
    checkRequestParams,
    patchVentureName,
    handlePersonalizedGames,
    IMlPersonalizedSection,
    getVentureId,
    validators,
    errorResponseHandler,
} from 'os-client';
import { handleMissingMLRecommendations } from './lib/personalisedSections';

/**
 * GetSuggestedForYouFunction
 * Version: 1.0.1
 * Purpose: Delivers personalized game suggestions based on user preferences.
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
    const SECTION_TYPE = 'personal-suggested-games';

    //path param
    const platform = event.pathParameters?.platform as string;
    const siteNameFromParams = event.pathParameters?.sitename as string;
    const siteName = patchVentureName(siteNameFromParams);

    //query param
    const memberId = event.queryStringParameters?.memberid as string;
    const userLocale: string = validateLocaleQuery(event.queryStringParameters?.locale);

    try {
        const client = getClient();

        const spaceLocale = handleSpaceLocalization();
        const ventureId = await getVentureId(client, siteName, spaceLocale, platform);

        checkRequestParams(
            [siteName, validators.siteName],
            [platform, validators.platform],
            [memberId, validators.memberId],
        );

        const sectionGamesPayload: ISectionGame[] = await handlePersonalizedGames({
            client,
            sectionType: SECTION_TYPE as IMlPersonalizedSection,
            memberId,
            siteName,
            spaceLocale,
            localeOverride: userLocale,
            platform,
            handleEmptyRecommendation: handleMissingMLRecommendations.bind(
                null,
                client,
                userLocale,
                spaceLocale,
                platform,
                ventureId,
                siteName,
            ),
            showWebComponent: false,
        });

        return {
            statusCode: 200,
            body: JSON.stringify(sectionGamesPayload),
        };
    } catch (err) {
        const errorLogParams = {
            eventReqId,
            siteName,
            platform,
            memberId,
            userLocale,
        };
        return errorResponseHandler(err, [], errorLogParams);
    }
};
