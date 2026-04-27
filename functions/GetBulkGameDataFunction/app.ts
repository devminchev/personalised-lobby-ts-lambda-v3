import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    ErrorCode,
    logError,
    validateLocaleQuery,
    handleSpaceLocalization,
    checkRequestParams,
    patchVentureName,
    getVentureId,
    logMessage,
    LogCode,
    jsonResponse,
} from 'os-client';
import { FreshGameResponse } from './lib/interface';
import { getGamesFromSections, getUserVisibleGameAndSiteGames } from './lib/processSiteVisibleGames';
import { createResponseObject } from './lib/utils';
import { getLinks, getNavigation } from 'os-client/lib/commonOsRequests';

/**
 * GetBulkGameDataFunction
 * Version: 1.0.1
 * Purpose: Retrieves data for multiple games in a single request.
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

    //path param
    const siteNameFromParams = event.pathParameters?.sitename as string;
    const siteName = patchVentureName(siteNameFromParams);
    const platform = event.pathParameters?.platform as string;

    //query param
    const userLocale: string = validateLocaleQuery(event.queryStringParameters?.locale);

    try {
        checkRequestParams(siteName, platform);

        const spaceLocale = handleSpaceLocalization();
        const ventureId = await getVentureId(client, siteName, spaceLocale, platform);

        const { allLinkIds, bottomLinkIds } = await getNavigation(client, ventureId, spaceLocale, siteName, platform);
        if ([...allLinkIds, ...bottomLinkIds].length === 0) {
            logMessage('warn', LogCode.EmptyNavigation, { siteName, platform });
        }
        const linkdIds = [...allLinkIds, ...bottomLinkIds];
        const contentToLinkData = await getLinks(client, linkdIds, spaceLocale, platform);

        const sectionIds: string[] = Array.from(contentToLinkData.keys());
        const { gameIds, gameSectionsMap } = await getGamesFromSections(
            client,
            platform,
            sectionIds,
            spaceLocale,
            siteName,
        );

        const userVisisbleGames = await getUserVisibleGameAndSiteGames(
            client,
            ventureId,
            platform,
            gameIds,
            spaceLocale,
            siteName,
        );
        const response: FreshGameResponse[] = createResponseObject(
            userVisisbleGames,
            userLocale,
            spaceLocale,
            gameSectionsMap,
        );
        return jsonResponse(response);
    } catch (err) {
        const errorCode = (err as any).code;
        const statusCode = (err as any).statusCode || 500;
        const errorMessage = (err as Error).message;
        logError(ErrorCode.ExecutionError, statusCode, { siteName, platform, userLocale, err });

        return jsonResponse(
            {
                code: errorCode,
                message: errorMessage,
            },
            statusCode,
        );
    }
};
