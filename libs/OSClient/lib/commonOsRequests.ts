import { IClient } from './osClient';
import { getGameHits, getHits } from './requestUtils';
import {
    VentureIndex,
    IOpenSearchQuery,
    Navigation,
    Sys,
    GetNavResult,
    ViewData,
    LinkData,
} from './sharedInterfaces/common';
import { logError, createError, ErrorCode } from './errors';
import { ILayout, FullApiResponse } from './sharedInterfaces/interfaces';
import {
    LAYOUTS_INDEX_ALIAS,
    NAVIGATION_INDEX_READ_ALIAS,
    VENTURES_INDEX_ALIAS,
    VIEW_INDEX_READ_ALIAS,
} from './constants';
import { getLambdaExecutionEnvironment } from './utils';
import { LogCode, logMessage } from './logger';

const VIEW_DEPTH = 2; // The depth of the view to fetch, can be adjusted based on requirements

export const getVentureId = async (
    client: IClient,
    siteName: string,
    locale: string,
    platform: string,
): Promise<string> => {
    const key = `name.${locale}`;
    const matchExpression: { match: { [key: string]: string } } = {
        match: {},
    };
    matchExpression.match[key] = siteName;

    const getVenturesQuery = {
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: matchExpression,
                    },
                },
            },
        },
        _source: ['id'],
    };

    const hits: VentureIndex[] = await getHits(client, getVenturesQuery, VENTURES_INDEX_ALIAS);

    if (hits.length !== 1) {
        // We want to end execution with the appropriate error
        logMessage('warn', ErrorCode.InvalidVenture, { siteName, platform });
        throw createError(ErrorCode.InvalidVenture, 404);
    }

    return hits[0].id;
};

export const getGamesSiteGames = async (
    client: IClient,
    sectionGamesListQuery: IOpenSearchQuery,
    game_index: string,
    ventureId: string,
    siteName: string,
    platform: string,
): Promise<FullApiResponse[]> => {
    const hits: FullApiResponse[] = await getGameHits(client, sectionGamesListQuery, game_index, ventureId, platform);

    if (hits.length === 0) {
        logMessage('warn', ErrorCode.NoGamesReturned, { siteName, platform, sectionGamesListQuery, hits });
        throw createError(ErrorCode.NoGamesReturned, 404);
    }

    return hits;
};

export const getNavigation = async (
    client: IClient,
    ventureId: string,
    locale: string,
    siteName: string,
    platform: string,
): Promise<GetNavResult> => {
    const ventureKey = `venture.${locale}.sys.id`;

    const getNavQuery = {
        _source: ['id', 'entryTitle', 'venture', 'links', 'bottomNavLinks'],
        query: {
            bool: {
                must: [{ match: { [ventureKey]: ventureId } }, { match: { contentType: 'igNavigation' } }],
            },
        },
        size: 1,
    };

    const navigation: Navigation[] = await getHits(client, getNavQuery, NAVIGATION_INDEX_READ_ALIAS);

    if (navigation.length === 0) {
        logMessage('warn', LogCode.EmptyNavigation, { siteName, platform, navigation });
        throw createError(ErrorCode.MissingNavigation, 404);
    }

    const allLinkIds: string[] = [];
    const bottomLinkIds: string[] = [];
    navigation.forEach((item: Navigation) => {
        const linkIds = (item.links?.[locale] ?? []).map((link: Sys) => link.sys.id);
        const bottomNavLinkIds = (item.bottomNavLinks?.[locale] ?? []).map((link: Sys) => link.sys.id);

        allLinkIds.push(...linkIds);
        bottomLinkIds.push(...bottomNavLinkIds);
    });

    return { allLinkIds, bottomLinkIds };
};

export const getViews = async (
    client: IClient,
    viewIds: string[],
    locale: string,
    platform: string,
    userLoggedIn?: boolean,
): Promise<ViewData[]> => {
    const userSession = userLoggedIn ? 'loggedIn' : 'loggedOut';
    const sessionKey = `sessionVisibility.${locale}.keyword`;
    const envKey = `environmentVisibility.${locale}.keyword`;
    const platformKey = `platformVisibility.${locale}.keyword`;
    const getViewDataQuery = {
        _source: ['id', 'primaryContent', 'topContent', 'liveHidden', 'classification', 'name'],
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [{ match: { contentType: 'igView' } }],
                        filter: [
                            { term: { [envKey]: getLambdaExecutionEnvironment() } },
                            { term: { [platformKey]: platform } },
                            { term: { [sessionKey]: userSession } },
                            { ids: { values: viewIds } },
                        ],
                    },
                },
            },
        },
        size: 100,
    };

    const viewData: ViewData[] = await getHits(client, getViewDataQuery, VIEW_INDEX_READ_ALIAS);
    return viewData;
};

export const getLinks = async (
    client: IClient,
    linksIds: string[],
    locale: string,
    platform: string,
    userLoggedIn?: boolean,
    depth: number = VIEW_DEPTH,
): Promise<Map<string, LinkData>> => {
    if (depth < 0) {
        return new Map<string, LinkData>();
    }
    // This returns a map of sectionId → LinkData
    const sectionToLinkData = new Map<string, LinkData>();
    if (linksIds.length === 0) {
        return sectionToLinkData;
    }

    const userSession = userLoggedIn ? 'loggedIn' : 'loggedOut';
    const sessionKey = `sessionVisibility.${locale}.keyword`;
    const envKey = `environmentVisibility.${locale}.keyword`;
    const platformKey = `platformVisibility.${locale}.keyword`;

    const getLinkDataQuery = {
        _source: ['view', 'label', 'id', 'links', 'contentType'],
        query: {
            constant_score: {
                filter: {
                    bool: {
                        should: [{ match: { contentType: 'igLink' } }, { match: { contentType: 'igQuickLinks' } }],
                        filter: [
                            { term: { [envKey]: getLambdaExecutionEnvironment() } },
                            { term: { [platformKey]: platform } },
                            { term: { [sessionKey]: userSession } },
                            { ids: { values: linksIds } },
                        ],
                    },
                },
            },
        },
        size: 100,
    };

    // fetch raw link entries
    const navLinks: LinkData[] = await getHits(client, getLinkDataQuery, NAVIGATION_INDEX_READ_ALIAS);

    // TODO: Handle the case where no links are found
    const quickLinkLinks = new Set<string>();

    // build a map of viewId → entry, and collect entries
    const viewIdToLink = new Map<string, LinkData>();
    // Capture the label for each link to be used later
    navLinks.forEach((linkData) => {
        // If the link is a quick link, we need to handle it differently
        if (linkData.contentType === 'igQuickLinks') {
            const quickLinks = linkData.links?.[locale] || [];
            quickLinks.forEach((quickLink) => {
                const quickLinkId = quickLink.sys.id;
                quickLinkLinks.add(quickLinkId);
            });
        } else if (linkData.contentType === 'igLink') {
            // For regular links, we store the link data directly
            const vid = linkData.view?.[locale]?.sys?.id;
            if (vid) {
                viewIdToLink.set(vid, linkData);
            }
        }
    });

    const c2LinkQuickLink = await getLinks(client, Array.from(quickLinkLinks), locale, platform, userLoggedIn, depth);

    c2LinkQuickLink.forEach((value, key) => {
        if (!sectionToLinkData.has(key)) {
            sectionToLinkData.set(key, value);
        }
    });
    // fetch view objects
    const viewIds = Array.from(viewIdToLink.keys());
    const views = await getViews(client, viewIds, locale, platform, userLoggedIn);
    const topContentLinks = new Set<string>();
    views.forEach((viewData: ViewData) => {
        const primaryContent = viewData.primaryContent?.[locale]?.map((item) => item.sys.id) || [];
        const topContent = viewData.topContent?.[locale]?.map((item) => item.sys.id) || [];
        const viewId = viewData.id;
        const linkData = viewIdToLink.get(viewId);
        if (primaryContent.length > 0 && linkData) {
            primaryContent.forEach((sectionId) => {
                sectionToLinkData.set(sectionId, linkData);
            });
        }

        topContent.forEach((item) => topContentLinks.add(item));
    });

    const c2Link = await getLinks(client, Array.from(topContentLinks), locale, platform, userLoggedIn, depth - 1);

    // Merge the new links into the existing map
    c2Link.forEach((value, key) => {
        if (!sectionToLinkData.has(key)) {
            sectionToLinkData.set(key, value);
        }
    });

    return sectionToLinkData;
};
