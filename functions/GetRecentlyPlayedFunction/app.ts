import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    validateLocaleQuery,
    handleSpaceLocalization,
    ISectionGame,
    checkRequestParams,
    patchVentureName,
    IMlPersonalizedSection,
    getVentureId,
    validators,
    errorResponseHandler,
    handleRecentlyPlayed,
    getLambdaExecutionEnvironment,
    OrderCriteria,
    gzipResponse,
} from 'os-client';
import { getRpOrderCriteria } from './lib/recentlyPlayedSection';

/**
 * GetRecentlyPlayedFunction
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
    const SECTION_TYPE = 'recently-played';

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
        const envVisibility = getLambdaExecutionEnvironment();
        const ventureId = await getVentureId(client, siteName, spaceLocale, platform);

        checkRequestParams(
            [siteName, validators.siteName],
            [platform, validators.platform],
            [memberId, validators.memberId],
        );

        const orderCriteria: OrderCriteria = await getRpOrderCriteria({
            client,
            ventureId,
            platform,
            spaceLocale,
            envVisibility,
            sectionType: SECTION_TYPE,
        });

        const recentlyPlayedPayload: ISectionGame[] = await handleRecentlyPlayed({
            client,
            sectionType: SECTION_TYPE as IMlPersonalizedSection,
            ventureId,
            memberId,
            siteName,
            spaceLocale,
            userLocale,
            platform,
            orderCriteria,
        });

        return gzipResponse(recentlyPlayedPayload);
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
