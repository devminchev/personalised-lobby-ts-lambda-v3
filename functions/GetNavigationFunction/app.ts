import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    IClient,
    getHits,
    handleSpaceLocalization,
    checkRequestParams,
    LocalizedField,
    getVentureId,
    patchVentureName,
    getLambdaExecutionEnvironment,
    NAVIGATION_INDEX_READ_ALIAS,
    VIEW_INDEX_READ_ALIAS,
    validateLocaleQuery,
    tryGetValueFromLocalised,
    logMessage,
    LogCode,
    validators,
    EmptyNavResponse,
    errorResponseHandler,
} from 'os-client';
import { getNavigation } from 'os-client/lib/commonOsRequests';
import { Sys } from 'os-client/lib/sharedInterfaces/common';

/**
 * GetNavigationFunction
 * Version: 1.0.1
 * Purpose: Retrieves game navigation and classification data.
 * Last updated: 2025-04-01-7
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

interface LinkData {
    id: string;
    entryTitle?: LocalizedField<string>;
    label?: LocalizedField<string>;
    view?: LocalizedField<Sys>;
    externalUrl?: LocalizedField<string>;
    internalUrl?: LocalizedField<string>;
    bynderImage?: LocalizedField<null>;
    image?: LocalizedField<string>;
    liveHidden?: LocalizedField<boolean>;
}

interface ViewData {
    id: string;
    viewSlug: LocalizedField<string>;
}

type LinkDataWithEntryId = Omit<LinkData, 'id'> & {
    entryId: string;
    viewSlug?: string;
};

type LinkResponse = {
    entryId: string;
    label: string;
    viewSlug?: string;
    externalUrl?: string;
    internalUrl?: string;
    image?: string;
    bynderImage?: Record<string, unknown>;
    liveHidden?: boolean;
};

interface NavigationResponse {
    links: LinkResponse[];
    bottomNavLinks: LinkResponse[];
}

const getLinks = async (
    client: IClient,
    linksIds: string[],
    bottomLinkIds: string[],
    locale: string,
    platform: string,
): Promise<LinkDataWithEntryId[]> => {
    const allLinksIds = [...linksIds, ...bottomLinkIds];
    if (allLinksIds.length === 0) {
        return [];
    }

    const envKey = `environmentVisibility.${locale}`;
    const platformKey = `platformVisibility.${locale}`;

    const getLinkDataQuery = {
        _source: [
            'id',
            'entryTitle',
            'label',
            'view',
            'externalUrl',
            'internalUrl',
            'bynderImage',
            'image',
            'liveHidden',
        ],
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [{ match: { contentType: 'igLink' } }],
                        filter: [
                            { term: { [envKey]: getLambdaExecutionEnvironment() } },
                            { term: { [platformKey]: platform } },
                            { ids: { values: allLinksIds } },
                        ],
                    },
                },
            },
        },
        size: 100,
    };

    // fetch raw link entries
    const navLinks: LinkData[] = await getHits(client, getLinkDataQuery, NAVIGATION_INDEX_READ_ALIAS);

    // build a map of viewId → entry, and collect entries
    const result: LinkDataWithEntryId[] = [];
    const viewIdToLink = new Map<string, LinkDataWithEntryId>();

    navLinks.forEach((linkData) => {
        const entry: LinkDataWithEntryId = { entryId: linkData.id, ...linkData };
        const vid = linkData.view?.[locale]?.sys?.id;
        if (vid) {
            viewIdToLink.set(vid, entry);
        }
        result.push(entry);
    });

    // fetch view objects
    const viewIds = Array.from(viewIdToLink.keys());
    const views = await getViews(client, viewIds);

    // stamp each entry with its viewSlug
    for (const view of views) {
        const entry = viewIdToLink.get(view.id);
        if (entry) {
            entry.viewSlug = view.viewSlug?.[locale];
        }
    }

    // reorder to match allLinksIds exactly
    const entryById = new Map(result.map((e) => [e.entryId, e]));
    const ordered = allLinksIds.map((id) => entryById.get(id)).filter((e): e is LinkDataWithEntryId => !!e);

    return ordered;
};

const getViews = async (client: IClient, viewIds: string[]): Promise<ViewData[]> => {
    const getViewDataQuery = {
        _source: ['id', 'viewSlug'],
        query: {
            constant_score: {
                filter: {
                    ids: { values: viewIds },
                },
            },
        },
        size: 100,
    };

    const viewData: ViewData[] = await getHits(client, getViewDataQuery, VIEW_INDEX_READ_ALIAS);
    return viewData;
};

const prepareResponse = (
    navLinks: LinkDataWithEntryId[],
    linksIds: string[],
    bottomLinkIds: string[],
    locale: string,
    spaceLocale: string,
): NavigationResponse => {
    const navResponse: NavigationResponse = {
        links: [],
        bottomNavLinks: [],
    };

    navLinks.forEach((entry) => {
        const entryLabel = tryGetValueFromLocalised(locale, spaceLocale, entry.label, '');
        const entryImage = tryGetValueFromLocalised(locale, spaceLocale, entry.image, '');
        const entryBynderImage = tryGetValueFromLocalised(locale, spaceLocale, entry.bynderImage, '');
        const entryInternalUrl = entry.internalUrl?.[spaceLocale];
        const entryExternalUrl = entry.externalUrl?.[spaceLocale];
        const entryViewSlug = entry?.viewSlug;
        const entryLiveHidden = entry.liveHidden?.[spaceLocale];

        const payload: any = {
            entryId: entry.entryId,
            label: entryLabel,
            ...(entryViewSlug && { viewSlug: entryViewSlug }),
            ...(entryInternalUrl && { internalUrl: entryInternalUrl }),
            ...(entryExternalUrl && { externalUrl: entryExternalUrl }),
            ...(entryImage && { image: entryImage }),
            ...(entryBynderImage ? { bynderImage: entryBynderImage } : {}),
            ...(entryLiveHidden === true && { liveHidden: entryLiveHidden }),
        };

        if (linksIds.includes(entry.entryId)) {
            navResponse.links.push(payload);
        } else if (bottomLinkIds.includes(entry.entryId)) {
            navResponse.bottomNavLinks.push(payload);
        }
    });

    return navResponse;
};

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const eventReqId = event?.requestContext?.requestId;

    //path param
    const siteNameFromParams = event.pathParameters?.sitename as string;
    const siteName = patchVentureName(siteNameFromParams);
    const platform = event.pathParameters?.platform as string;

    //query param
    const userLocale: string = validateLocaleQuery(event.queryStringParameters?.locale);

    try {
        const client = getClient();

        const spaceLocale = handleSpaceLocalization();

        checkRequestParams([siteName, validators.siteName], [platform, validators.platform]); // returns 400

        const ventureId = await getVentureId(client, siteName, spaceLocale, platform); // return 404
        const { allLinkIds, bottomLinkIds } = await getNavigation(client, ventureId, spaceLocale, platform, siteName); // return 404
        if ([...allLinkIds, ...bottomLinkIds].length === 0) {
            logMessage('warn', LogCode.EmptyNavigation, { siteName, platform, eventReqId });
        }
        const navLinks = await getLinks(client, allLinkIds, bottomLinkIds, spaceLocale, platform);
        const linkData = prepareResponse(navLinks, allLinkIds, bottomLinkIds, userLocale, spaceLocale);
        return {
            statusCode: 200,
            body: JSON.stringify(linkData),
        };
    } catch (err) {
        const expectedEmptyBody: EmptyNavResponse = { links: [], bottomNavLinks: [] };
        const errorLogParams = {
            eventReqId,
            siteName,
            platform,
            userLocale,
        };
        return errorResponseHandler(err, expectedEmptyBody, errorLogParams);
    }
};
