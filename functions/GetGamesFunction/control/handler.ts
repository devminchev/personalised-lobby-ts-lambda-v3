import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    validateLocaleQuery,
    handleSpaceLocalization,
    ISectionGame,
    checkRequestParams,
    patchVentureName,
    IMlPersonalizedSection,
    checkAndGuardSectionType,
    handlePersonalizedGames,
    getLambdaExecutionEnvironment,
    LogCode,
    logMessage,
    validators,
    errorResponseHandler,
    ORDER_CRITERIA_TO_FIELD,
    OrderCriteria,
    gzipResponse,
    createError,
    ErrorCode,
} from 'os-client';
import { handleNonPersonalised } from './lib/genericGamesSections';
import { getGamesListForSection } from './lib/core';
import { handleMissingMLRecommendations } from './lib/personalisedSections';

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
 * Controlled version for AB Testing: Using the original v3 implementation
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
    const memberId = event.queryStringParameters?.memberid as string;
    const userLocale: string = validateLocaleQuery(event.queryStringParameters?.locale);

    const isLoggedIn = memberId !== undefined && memberId !== '';

    try {
        const offset = parsePaginationParam(event.queryStringParameters?.offset);
        const limit = parsePaginationParam(event.queryStringParameters?.limit);

        const client = getClient();

        const spaceLocale = handleSpaceLocalization();
        const showWebComponent: boolean = shouldIncludeWebComponentData(viewSlug);

        // we only need this for personalised sections. At this point if the user requests the sectionID the choice if they are authenticated or not is already decided on the previous flow.
        // this endpoint can't be hit in another user flow. Games don't have `sessionVisibility` property.
        checkRequestParams(
            [siteName, validators.siteName],
            [platform, validators.platform],
            [viewSlug, validators.viewSlug],
            [sectionId, validators.sectionId],
        );

        const envVisibility = getLambdaExecutionEnvironment();

        const {
            sectionGameIds,
            sectionType,
            sortCriteria = 'none',
        } = await getGamesListForSection(client, sectionId, spaceLocale, siteName, platform, envVisibility, {
            offset,
            limit,
        }); // 404

        const isPersonalised = checkAndGuardSectionType(isLoggedIn, sectionType, siteName, platform);

        const orderCriteria: OrderCriteria = (sortCriteria && ORDER_CRITERIA_TO_FIELD[sortCriteria]) || 'margin_rank';

        //This only matters for generic sections. personalised sections are currently the same for all platforms!!
        // const platform = extractPlatformFromTitle(sectionEntryTitle);

        logMessage('log', LogCode.info, {
            eventReqId: event.requestContext.requestId,
            siteName,
            platform,
            sectionId,
            isPersonalised,
            sectionType,
            memberId,
        });

        const sectionGamesPayload: ISectionGame[] = (await isPersonalised)
            ? await handlePersonalizedGames({
                  client,
                  sectionType: sectionType as IMlPersonalizedSection,
                  memberId,
                  siteName,
                  spaceLocale,
                  localeOverride: userLocale,
                  platform,
                  handleEmptyRecommendation: handleMissingMLRecommendations.bind(
                      null, // we don't need to pass this
                      client,
                      userLocale,
                      spaceLocale,
                      showWebComponent,
                      platform,
                      sectionGameIds,
                  ),
                  orderCriteria,
                  showWebComponent,
              })
            : await handleNonPersonalised({
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
            memberId,
            viewSlug,
            isLoggedIn,
            userLocale,
        };
        return errorResponseHandler(err, [], errorLogParams);
    }
};
