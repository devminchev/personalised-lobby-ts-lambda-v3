/* eslint-disable prettier/prettier */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    handleSpaceLocalization,
    checkRequestParams,
    getVentureId,
    patchVentureName,
    getLambdaExecutionEnvironment,
    validateLocaleQuery,
    errorResponseHandler,
    EmptyPageViewResponse,
    validators,
    gzipResponse,
} from 'os-client';
import { getView } from './lib/processViews';
import { getSections } from './lib/processSections';
import { getTheme } from './lib/processTheme';
import { IViewApiResponse } from './lib/types';

/**
 * Control handler for GetViewFunction
 * Contains the main business logic for retrieving View data
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const eventReqId = event?.requestContext?.requestId;

    // Path params
    const siteNameFromParams = event.pathParameters?.sitename as string;
    const siteName = patchVentureName(siteNameFromParams);
    const platform = event.pathParameters?.platform as string;
    const viewSlug = event.pathParameters?.viewslug as string;

    // Query params
    const authenticated = event.queryStringParameters?.auth || '';
    const userLocale: string = validateLocaleQuery(event.queryStringParameters?.locale);

    try {
        const client = getClient();

        // Runtime Params
        const envVisibility = getLambdaExecutionEnvironment();
        const spaceLocale = handleSpaceLocalization();

        const sessionVisibility = authenticated.trim().toLowerCase() === 'true' ? 'loggedIn' : 'loggedOut';

        checkRequestParams(
            [siteName, validators.siteName],
            [platform, validators.platform],
            [viewSlug, validators.viewSlug],
        );

        const ventureId = await getVentureId(client, siteName, spaceLocale, platform);

        const { topContent, primaryContent, name, slug, liveHidden, classification, entryId, themeId } = await getView({
            client,
            viewSlug,
            ventureId,
            platform,
            spaceLocale,
            userLocale,
            sessionVisibility,
            envVisibility,
            siteName,
        }); // 404 or 422

        const { topContent: top, primaryContent: primary } = await getSections({
            client,
            topContent,
            primaryContent,
            siteName,
            spaceLocale,
            userLocale,
            platform,
            sessionVisibility,
            envVisibility,
        }); // 404

        const viewTheme = themeId && (await getTheme(client, themeId, spaceLocale, entryId, siteName, platform));

        const viewResponse: IViewApiResponse = {
            entryId,
            name,
            viewSlug: slug,
            classification,
            topContent: top,
            primaryContent: primary,
            liveHidden,
            ...(viewTheme && {
                theme: viewTheme,
            }),
        };

        return gzipResponse(viewResponse);
    } catch (err) {
        const expectedEmptyBody: EmptyPageViewResponse = {
            name: '',
            viewSlug: '',
            classification: 'general',
            topContent: [],
            primaryContent: [],
        };
        const errorLogParams = {
            eventReqId,
            siteName,
            platform,
            viewSlug,
            userLocale,
        };
        return errorResponseHandler(err, expectedEmptyBody, errorLogParams);
    }
};
