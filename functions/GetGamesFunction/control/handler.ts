import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    validateLocaleQuery,
    handleSpaceLocalization,
    ISectionGame,
    checkRequestParams,
    patchVentureName,
    getLambdaExecutionEnvironment,
    LogCode,
    logMessage,
    validators,
    errorResponseHandler,
    gzipResponse,
    createError,
    ErrorCode,
} from 'os-client';
import { handleNonPersonalised } from './lib/genericGamesSections';
import { getGamesListForSection } from './lib/core';

/**
 * GetGamesFunction
 * Version: 1.0.1
 * Purpose: Retrieves a list of games for a non-personalised section.
 * Last updated: 2025-04-01-7
 *
 * Personalised sections are served by GetPersonalisedSectionGamesFunction.
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 */

const shouldIncludeWebComponentData = (layoutName: string): boolean =>
    layoutName === 'bingo' || layoutName === 'bingo-native' ? true : false;

const parsePaginationParam = (value: string | undefined): number | undefined => {
    if (value === undefined || value === '') {
        return undefined;
    }

    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 0) {
        throw createError(ErrorCode.InvalidRequest, 400);
    }

    return parsedValue;
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const eventReqId = event?.requestContext?.requestId;

    logMessage('log', LogCode.info, {
        eventReqId: event.requestContext.requestId,
        pathParams: event?.pathParameters,
        queryParamss: event?.queryStringParameters,
    });

    //path param
    const platform = event.pathParameters?.platform as string;
    const siteNameFromParams = event.pathParameters?.sitename as string;
    const siteName = patchVentureName(siteNameFromParams);
    const sectionId = event.pathParameters?.sectionid as string;
    const viewSlug = event.pathParameters?.viewslug as string;

    // query param
    const userLocale: string = validateLocaleQuery(event.queryStringParameters?.locale);

    try {
        const offset = parsePaginationParam(event.queryStringParameters?.offset);
        const limit = parsePaginationParam(event.queryStringParameters?.limit);

        const client = getClient();

        const spaceLocale = handleSpaceLocalization();
        const showWebComponent: boolean = shouldIncludeWebComponentData(viewSlug);

        checkRequestParams(
            [siteName, validators.siteName],
            [platform, validators.platform],
            [viewSlug, validators.viewSlug],
            [sectionId, validators.sectionId],
        );

        const envVisibility = getLambdaExecutionEnvironment();

        const { sectionGameIds } = await getGamesListForSection(
            client,
            sectionId,
            spaceLocale,
            siteName,
            platform,
            envVisibility,
            { offset, limit },
        ); // 404

        logMessage('log', LogCode.info, {
            eventReqId: event.requestContext.requestId,
            siteName,
            platform,
            sectionId,
        });

        const sectionGamesPayload: ISectionGame[] = await handleNonPersonalised({
            client,
            siteGameIdsList: sectionGameIds,
            userLocale,
            spaceLocale,
            showWebComponent,
            platform,
            siteName,
        });

        return gzipResponse(sectionGamesPayload);
    } catch (err) {
        const errorLogParams = {
            eventReqId,
            siteName,
            platform,
            sectionId,
            viewSlug,
            userLocale,
        };
        return errorResponseHandler(err, [], errorLogParams);
    }
};
