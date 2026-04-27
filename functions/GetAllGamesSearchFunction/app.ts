import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    IClient,
    getHits,
    validateLocaleQuery,
    tryGetValueFromLocalised,
    handleSpaceLocalization,
    checkRequestParams,
    getVentureId,
    getGamesSiteGames,
    FullApiResponse,
    patchVentureName,
    getLambdaExecutionEnvironment,
    LogCode,
    logMessage,
    ALL_SECTIONS_SHARED_READ_ALIAS,
    IG_GAMES_V2_READ_ALIAS,
    IHeadlessJackpot,
    pickGameOrSiteGameValue,
    errorResponseHandler,
    gzipResponse,
    jsonSizeInMb,
    getPreferredOrFallbackLocalised,
} from 'os-client';
import { getLinks, getNavigation } from 'os-client/lib/commonOsRequests';
import { IOpenSearchQuery, LocalizedField, Sys } from 'os-client/lib/sharedInterfaces/common';
import { extractBynderObject, GAME_SEARCH_QUERY_LIMIT, validators } from 'os-client/lib/utils';

/**
 * GetAllGamesSearchFunction
 * Version: 1.0.1
 * Purpose: Provides search functionality across the entire game catalog.
 * Last updated: 2025-04-01-7
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
interface IGameSectionDictionary {
    [key: string]: string[];
}

interface IGameSearchRecord {
    entryId: string;
    gameId: string;
    name?: string;
    title: string;
    gameSkin?: string;
    mobileGameName?: string;
    demoUrl?: string;
    realUrl?: string;
    imgUrlPattern?: string;
    sash?: string;
    representativeColor?: string;
    headlessJackpot?: IHeadlessJackpot;
    navigation: string[];
}

export const SECTION_DOCUMENTS_PER_AGGREGATED_LAYOUT_LIMIT = 100;
const SECTION_DOCUMENTS_PER_CATEGORIES_LIMIT = 100;

interface GameSection {
    id: string;
    entryTitle: string;
    title: string;
    games: LocalizedField<Sys[]>;
    classification: string;
}

export const getSections = async (
    client: IClient,
    sectionIds: string[],
    locale: string,
    platform: string,
    userLoggedIn: boolean,
): Promise<GameSection[]> => {
    const userSession = userLoggedIn ? 'loggedIn' : 'loggedOut';
    const sessionKey = `sessionVisibility.${locale}.keyword`;
    const envKey = `environmentVisibility.${locale}.keyword`;
    const platformKey = `platformVisibility.${locale}.keyword`;
    const classificationKey = `classification.${locale}.keyword`;

    const getSectionDataQuery = {
        _source: ['id', 'entryTitle', 'title', 'games', 'classification'],
        query: {
            constant_score: {
                filter: {
                    bool: {
                        should: [
                            { match: { [classificationKey]: 'JackpotSection' } },
                            { match: { [classificationKey]: 'GameSection' } },
                            { match: { [classificationKey]: 'DFGSection' } },
                        ],
                        filter: [
                            { term: { [envKey]: getLambdaExecutionEnvironment() } },
                            { term: { [platformKey]: platform } },
                            { term: { [sessionKey]: userSession } },
                            { ids: { values: sectionIds } },
                        ],
                    },
                },
            },
        },
        size: SECTION_DOCUMENTS_PER_CATEGORIES_LIMIT,
    };
    // console.log('getSectionDataQuery', JSON.stringify(getSectionDataQuery));
    const sectionItems: GameSection[] = await getHits(client, getSectionDataQuery, ALL_SECTIONS_SHARED_READ_ALIAS);

    return sectionItems;
};

export const constructGameSearchResponse = (
    gameHits: FullApiResponse[],
    spaceLocale: string,
    localeOverride: string,
    gameIdToNavName: Map<string, Set<string>>,
    platform: string,
    showOnlyLoggedIn: boolean,
): IGameSearchRecord[] => {
    const gamePayload = gameHits.map((item: FullApiResponse) => {
        const siteGameData = item.hit?.siteGame;
        const navigation = Array.from(gameIdToNavName.get(siteGameData?.id) || []);
        const gameData = item.innerHit?.game;
        const gamePlatformConfig = gameData?.gamePlatformConfig || {};
        const liveHidden = siteGameData?.liveHidden?.[spaceLocale];

        const tags = pickGameOrSiteGameValue(siteGameData?.tags?.[spaceLocale], gameData?.tags, null);

        const localizedGameTitle = tryGetValueFromLocalised(localeOverride, spaceLocale, gameData?.title, '');

        const mobileOverride = gameData?.mobileOverride || false;
        const gameNameValue = gameData?.gameName;
        const mobileGameName = gameData?.mobileGameName || null;
        const gameSkin = gameData?.gameSkin;
        const mobileGameSkin = gameData?.mobileGameSkin || null;
        const rtp = gameData?.rtp;
        const sash = tryGetValueFromLocalised(localeOverride, spaceLocale, siteGameData?.sash, null);
        const representativeColor = tryGetValueFromLocalised(
            localeOverride,
            spaceLocale,
            gameData?.representativeColor,
            null,
        );
        const headlessJackpot = siteGameData?.headlessJackpot?.[spaceLocale] || null;
        const finalImageUrl = getPreferredOrFallbackLocalised(
            localeOverride,
            spaceLocale,
            showOnlyLoggedIn,
            gameData?.imgUrlPattern,
            gameData?.loggedOutImgUrlPattern,
        );
        const gameName = platform.toLowerCase() !== 'web' && mobileOverride ? mobileGameName : gameNameValue;

        const animationMedia = showOnlyLoggedIn
            ? tryGetValueFromLocalised(localeOverride, spaceLocale, gameData?.animationMedia, null)
            : tryGetValueFromLocalised(localeOverride, spaceLocale, gameData?.loggedOutAnimationMedia, null);

        const foregroundLogoMedia = getPreferredOrFallbackLocalised(
            localeOverride,
            spaceLocale,
            showOnlyLoggedIn,
            gameData?.foregroundLogoMedia,
            gameData?.loggedOutForegroundLogoMedia,
        );
        const backgroundMedia = getPreferredOrFallbackLocalised(
            localeOverride,
            spaceLocale,
            showOnlyLoggedIn,
            gameData?.backgroundMedia,
            gameData?.loggedOutBackgroundMedia,
        );
        const foregroundLogoMediaObj = extractBynderObject(foregroundLogoMedia);

        const backgroundMediaObj = extractBynderObject(backgroundMedia);

        return {
            entryId: siteGameData.id,
            gameId: siteGameData.gameId, // Assuming gameId is the same as entryId
            name: gameName || '',
            navigation,
            ...(typeof sash === 'string' && { sash }),
            ...(typeof gameSkin === 'string' && { gameSkin }),
            ...(gamePlatformConfig && { demoUrl: gamePlatformConfig?.demoUrl }),
            ...(gamePlatformConfig && { realUrl: gamePlatformConfig?.realUrl }),
            ...(representativeColor && { representativeColor }),
            ...(gameData?.title && { title: localizedGameTitle }),
            ...(tags && { tags }),
            ...(finalImageUrl && { imgUrlPattern: finalImageUrl }),
            ...(animationMedia && { animationMedia }),
            ...(foregroundLogoMediaObj && { foregroundLogoMedia: foregroundLogoMediaObj }),
            ...(backgroundMediaObj && { backgroundMedia: backgroundMediaObj }),
            ...(headlessJackpot && { headlessJackpot }),
            ...(liveHidden && { liveHidden }),
        };
    });

    return gamePayload;
};

export const createGamesSearchQuery = (
    allSiteGameIds: string[],
    ventureId: string,
    spaceLocale: string,
    platform: string,
): IOpenSearchQuery => {
    const ventureKey = `siteGame.venture.${spaceLocale}.sys.id`;
    const platformKey = `siteGame.platformVisibility.${spaceLocale}.keyword`;
    const environmentKey = `siteGame.environmentVisibility.${spaceLocale}.keyword`;

    const sectionGamesListQuery = {
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [
                            {
                                match: {
                                    [ventureKey]: ventureId,
                                },
                            },
                            {
                                has_parent: {
                                    parent_type: 'game',
                                    query: {
                                        match_all: {},
                                    },
                                    inner_hits: {
                                        _source: [
                                            'game.gamePlatformConfig',
                                            'game.gameName',
                                            'game.gameSkin',
                                            'game.mobileGameName',
                                            'game.mobileGameSkin',
                                            'game.mobileOverride',
                                            'game.rtp',
                                            'game.title',
                                            'game.tags',
                                            'game.infoImgUrlPattern',
                                            'game.loggedOutImgUrlPattern',
                                            'game.imgUrlPattern',
                                            'game.animationMedia',
                                            'game.loggedOutAnimationMedia',
                                            'game.foregroundLogoMedia',
                                            'game.loggedOutForegroundLogoMedia',
                                            'game.backgroundMedia',
                                            'game.loggedOutBackgroundMedia',
                                        ],
                                    },
                                },
                            },
                            {
                                terms: {
                                    _id: allSiteGameIds,
                                },
                            },
                            {
                                term: {
                                    [environmentKey]: getLambdaExecutionEnvironment(),
                                },
                            },
                            { term: { [platformKey]: platform } },
                        ],
                    },
                },
            },
        },
        _source: ['siteGame.id', 'siteGame.headlessJackpot', 'siteGame.liveHidden', 'siteGame.gameId', 'siteGame.tags'],
        size: GAME_SEARCH_QUERY_LIMIT,
    };

    return sectionGamesListQuery;
};

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const eventReqId = event?.requestContext?.requestId;

    //path param
    const platform = event.pathParameters?.platform as string;
    const siteNameFromParams = event.pathParameters?.sitename as string;

    //query param
    const userLocale: string = validateLocaleQuery(event.queryStringParameters?.locale);
    const authenticated = event.queryStringParameters?.auth || '';
    const showOnlyLoggedIn = authenticated.trim().toLowerCase() === 'true';

    try {
        const client = getClient();

        checkRequestParams([siteNameFromParams, validators.siteName], [platform, validators.platform]);
        const siteName = patchVentureName(siteNameFromParams);

        /* This is needed because in contentful there is no support for platforms different than 'desktop, tablet, phone'.
            So we need to determine if the client is an app, and use that only for the call to get Categories.
            For the rest of the calls that need platform (such as layout, etc.) if the client is an app we will use platform 'phone'
        */
        const spaceLocale = handleSpaceLocalization();

        // Get venture ID
        const ventureId = await getVentureId(client, siteName, spaceLocale, platform);

        // Get Navigations
        const { allLinkIds, bottomLinkIds } = await getNavigation(client, ventureId, spaceLocale, siteName, platform);
        if ([...allLinkIds, ...bottomLinkIds].length === 0) {
            logMessage('warn', LogCode.EmptyNavigation, { siteName, ventureId, platform, authenticated });
        }
        const linkdIds = [...allLinkIds, ...bottomLinkIds];
        const contentToLinkData = await getLinks(client, linkdIds, spaceLocale, platform, showOnlyLoggedIn);

        // Get sections
        const sectionIds: string[] = Array.from(contentToLinkData.keys());
        const sections = await getSections(client, sectionIds, spaceLocale, platform, showOnlyLoggedIn);
        // This maps the siteGame IDs to the section IDs they belong to
        const gameIdToSection: IGameSectionDictionary = sections.reduce<IGameSectionDictionary>((acc, section) => {
            const sectionId = section.id;
            const games = section.games?.[spaceLocale] || [];
            games.forEach((game) => {
                const gameId = game.sys.id;
                if (!acc[gameId]) {
                    acc[gameId] = [];
                }
                // Ensure we do not add the sectionId multiple times
                if (!acc[gameId].includes(sectionId)) {
                    acc[gameId].push(sectionId);
                }
            });

            return acc;
        }, {});

        const gameIdToNavName = new Map<string, Set<string>>();
        // Iterate over the gameIdToSection mapping and populate the gameIdToNavName map
        for (const [gameId, sectionIds] of Object.entries(gameIdToSection)) {
            const navNames: Set<string> = new Set<string>();
            sectionIds.forEach((sectionId) => {
                const linkData = contentToLinkData.get(sectionId);
                if (linkData) {
                    const label = tryGetValueFromLocalised(userLocale, spaceLocale, linkData.label, '');
                    navNames.add(label);
                }
            });
            gameIdToNavName.set(gameId, navNames);
        }

        const allSiteGameIds = Object.keys(gameIdToSection);
        // Get siteGames and games data
        const sectionGamesListQuery = createGamesSearchQuery(allSiteGameIds, ventureId, spaceLocale, platform);

        const games = await getGamesSiteGames(
            client,
            sectionGamesListQuery,
            IG_GAMES_V2_READ_ALIAS,
            ventureId,
            siteName,
            platform,
        );

        const gamesResponse = constructGameSearchResponse(
            games,
            spaceLocale,
            userLocale,
            gameIdToNavName,
            platform,
            showOnlyLoggedIn,
        );

        const bodyString = JSON.stringify(gamesResponse);
        const sizeInMb = jsonSizeInMb(bodyString);
        const compressedResponse = gzipResponse(bodyString);

        console.info(
            'all-games-search-uncompressed-response-size',
            { sizeInMb },
            'all-games-search-compressed-response-size:',
            jsonSizeInMb(compressedResponse),
        );
        return compressedResponse;
    } catch (err) {
        const errorLogParams = {
            eventReqId,
            siteNameFromParams,
            platform,
            showOnlyLoggedIn,
            userLocale,
        };
        return errorResponseHandler(err, [], errorLogParams);
    }
};
