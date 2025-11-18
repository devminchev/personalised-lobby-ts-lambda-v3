import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SysLink } from 'contentful-management';
import {
    getClient,
    IClient,
    getHits,
    ErrorCode,
    validateLocaleQuery,
    tryGetValueFromLocalised,
    handleSpaceLocalization,
    checkRequestParams,
    getVentureId,
    FullApiResponse,
    getGamesSiteGames,
    patchVentureName,
    getLambdaExecutionEnvironment,
    ALL_SECTIONS_SHARED_READ_ALIAS,
    LocalizedField,
    GAMES_INDEX_V2_ALIAS,
    VIEW_INDEX_READ_ALIAS,
    createError,
    IBynderAsset,
    errorResponseHandler,
    logMessage,
} from 'os-client';
import { Sys } from 'os-client/lib/sharedInterfaces/common';
import { extractBynderObject, pickGameOrSiteGameValue, validators } from 'os-client/lib/utils';

/**
 * GetMiniGamesFunction
 * Version: 1.0.1
 * Purpose: Retrieves mini-games that provide a quick gaming experience.
 * Last updated: 2025-04-01-7
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

interface IGameObject {
    entryId: string;
    gameId: string;
    name?: string;
    mobileName?: string;
    title?: string;
    realUrl?: string;
    mobileRealUrl?: string;
    demoUrl?: string;
    mobileDemoUrl?: string;
    gameSkin?: string;
    mobileGameSkin?: string;
    imgUrlPattern?: string;
    animationMedia?: string;
    representativeColor?: string;
    foregroundLogoMedia?: IBynderAsset;
    backgroundMedia?: IBynderAsset;
    sash?: string;
}
export interface IMinigameSectionInfo {
    entryId: string;
    title: string;
    name: string;
    layoutType: string;
    games: string[] | IGameObject[];
}

export interface IMinigamesResponse extends IMinigameSectionInfo {
    games: string[] | IGameObject[];
}

export interface IMinigameSectionResp {
    sitegameIds: string[];
    sectionData: IMinigameSectionInfo[];
}

const MINI_GAMES_SITEGAMES_LIMIT = 100;

interface IGSection {
    id: string;
    title: LocalizedField<string>;
    slug: LocalizedField<string>;
    layoutType: LocalizedField<string>;
    games?: LocalizedField<Array<Sys>>;
}

interface IGMiniGameView {
    id: string;
    sections: LocalizedField<SysLink[]>;
    entryTitle: LocalizedField<string>;
}

export const getMinigamesSections = async (
    client: IClient,
    sectionIds: string[],
    spaceLocale: string,
    userLocale: string,
    platform: string,
    siteName: string,
): Promise<IMinigameSectionResp> => {
    const envKey = `environmentVisibility.${spaceLocale}.keyword`;
    const platformKey = `platformVisibility.${spaceLocale}.keyword`;

    const minigameSectionQuery = {
        _source: ['id', 'title', 'slug', 'layoutType', 'games'],
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [
                            {
                                terms: {
                                    _id: sectionIds,
                                },
                            },
                            {
                                term: {
                                    [envKey]: getLambdaExecutionEnvironment(),
                                },
                            },
                            {
                                term: { [platformKey]: platform },
                            },
                        ],
                    },
                },
            },
        },
        size: 100,
    };
    const hits: IGSection[] = await getHits(client, minigameSectionQuery, ALL_SECTIONS_SHARED_READ_ALIAS);
    if (hits.length === 0) {
        logMessage('warn', ErrorCode.MissingSection, { siteName, platform, hits });
        throw createError(ErrorCode.MissingSection, 404);
    }
    const sitegameIdsSet = new Set<string>();
    const sectionData = hits.map((section) => {
        const title = tryGetValueFromLocalised(userLocale, spaceLocale, section?.title, '');
        const games =
            section?.games?.[spaceLocale].map((game: Sys) => {
                const gameId = game.sys.id;
                sitegameIdsSet.add(gameId); // Add to Set to ensure uniqueness
                return gameId;
            }) || [];

        return {
            entryId: section.id,
            title,
            name: section?.slug?.[spaceLocale]?.toLowerCase() || '',
            layoutType: section?.layoutType?.[spaceLocale] || '',
            games: games,
        };
    });

    const sitegameIds = Array.from(sitegameIdsSet);

    return { sitegameIds, sectionData };
};

export const getMinigames = async (
    client: IClient,
    sitegameIds: string[],
    platform: string,
    spaceLocale: string,
    ventureId: string,
    siteName: string,
): Promise<FullApiResponse[]> => {
    const platformKey = `siteGame.platformVisibility.${spaceLocale}.keyword`;
    const environmentKey = `siteGame.environmentVisibility.${spaceLocale}.keyword`;
    const minigamesQuery = {
        _source: ['siteGame.id', 'siteGame.sash', 'siteGame.tags'],
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [
                            {
                                has_parent: {
                                    parent_type: 'game',
                                    query: {
                                        match_all: {},
                                    },
                                    inner_hits: {
                                        _source: [
                                            'game.id',
                                            'game.gamePlatformConfig',
                                            'game.title',
                                            'game.imgUrlPattern',
                                            'game.representativeColor',
                                            'game.animationMedia',
                                            'game.foregroundLogoMedia',
                                            'game.backgroundMedia',
                                            'game.tags',
                                            'game.vendor',
                                        ],
                                    },
                                },
                            },
                            {
                                terms: {
                                    _id: sitegameIds,
                                },
                            },
                            {
                                term: {
                                    [environmentKey]: getLambdaExecutionEnvironment(),
                                },
                            },
                            {
                                term: {
                                    [platformKey]: platform,
                                },
                            },
                        ],
                    },
                },
            },
        },
        size: MINI_GAMES_SITEGAMES_LIMIT,
    };

    return await getGamesSiteGames(client, minigamesQuery, GAMES_INDEX_V2_ALIAS, ventureId, siteName, platform);
};

export const createMinigamesLobby = (
    sectionData: IMinigameSectionInfo[],
    minigames: FullApiResponse[],
    spaceLocale: string,
    userLocale: string,
): IMinigamesResponse[] => {
    const sanitizedMinigames = minigames.reduce<{ [key: string]: IGameObject }>((acc, item) => {
        const siteGameData = item.hit?.siteGame;
        const gameData = item.innerHit?.game;
        const gamePlatformObject = gameData?.gamePlatformConfig[spaceLocale] || {};
        const tags = pickGameOrSiteGameValue(siteGameData?.tags?.[spaceLocale], gameData?.tags?.[spaceLocale], null);
        const localizedGameTitle = tryGetValueFromLocalised(userLocale, spaceLocale, gameData?.title, null);
        const imgUrlPattern = tryGetValueFromLocalised(userLocale, spaceLocale, gameData?.imgUrlPattern, null);
        const representativeColor = tryGetValueFromLocalised(
            userLocale,
            spaceLocale,
            gameData?.representativeColor,
            null,
        );
        const animationMedia = tryGetValueFromLocalised(userLocale, spaceLocale, gameData?.animationMedia, null);
        const foregroundLogoMedia = tryGetValueFromLocalised(
            userLocale,
            spaceLocale,
            gameData?.foregroundLogoMedia,
            null,
        );
        const backgroundMedia = tryGetValueFromLocalised(userLocale, spaceLocale, gameData?.backgroundMedia, null);

        const foregroundLogoMediaObj = extractBynderObject(foregroundLogoMedia);
        const backgroundMediaObj = extractBynderObject(backgroundMedia);
        const vendor = gameData?.vendor?.[spaceLocale];

        const gameObject: IGameObject = {
            entryId: siteGameData.id,
            gameId: gameData.id,
            ...(gamePlatformObject?.name && { name: gamePlatformObject.name }), // gamePlatformObject
            ...(localizedGameTitle && { title: localizedGameTitle }),
            ...(gamePlatformObject?.realUrl && { realUrl: gamePlatformObject.realUrl }), // gamePlatformObject
            ...(gamePlatformObject?.demoUrl && { demoUrl: gamePlatformObject.demoUrl }), // gamePlatformObject
            ...(gamePlatformObject?.gameSkin && { gameSkin: gamePlatformObject.gameSkin }), // gamePlatformObject
            ...(imgUrlPattern && { imgUrlPattern }), // game
            ...(animationMedia && { animationMedia }), // game
            ...(representativeColor && { representativeColor }), // game
            ...(siteGameData?.sash?.[spaceLocale] && { sash: siteGameData?.sash?.[spaceLocale] }), // siteGame
            ...(foregroundLogoMediaObj && { foregroundLogoMedia: foregroundLogoMediaObj }), // game
            ...(backgroundMediaObj && { backgroundMedia: backgroundMediaObj }), // game
            // Those overrides are there if the mobileOvveride field is checked in in Contentful. Adding this lookign forward to when apps need to use it.
            ...(gamePlatformObject?.mobileName && { mobileName: gamePlatformObject.mobileName }), // gamePlatformObject
            ...(gamePlatformObject?.mobileRealUrl && { mobileRealUrl: gamePlatformObject.mobileRealUrl }), // gamePlatformObject
            ...(gamePlatformObject?.mobileDemoUrl && { mobileDemoUrl: gamePlatformObject.mobileDemoUrl }), // gamePlatformObject
            ...(gamePlatformObject?.mobileGameSkin && { mobileGameSkin: gamePlatformObject.mobileGameSkin }), // gamePlatformObject
            ...(tags && { tags }),
            ...(vendor && { vendor }),
        };

        acc[siteGameData.id] = gameObject;
        return acc;
    }, {});

    sectionData.forEach((section) => {
        if (typeof section.games[0] === 'string') {
            section.games = section.games
                .map((id) => sanitizedMinigames[id as string])
                .filter((game) => game !== undefined) as IGameObject[];
        }
    });

    return sectionData;
};

export const getMiniGamesView = async (
    client: IClient,
    ventureId: string,
    platform: string,
    locale: string,
    siteName: string,
): Promise<IGMiniGameView[]> => {
    const envKey = `environmentVisibility.${locale}.keyword`;
    const platformKey = `platformVisibility.${locale}.keyword`;
    const ventureKey = `venture.${locale}.sys.id`;
    const viewQuery = {
        _source: ['id', 'sections', 'entryTitle'],
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [
                            {
                                match: {
                                    contentType: 'igMiniGames',
                                },
                            },
                            {
                                match: {
                                    [ventureKey]: ventureId,
                                },
                            },
                        ],
                        filter: [
                            {
                                term: {
                                    [envKey]: getLambdaExecutionEnvironment(),
                                },
                            },
                            {
                                term: { [platformKey]: platform },
                            },
                        ],
                    },
                },
            },
        },
        size: 1000,
    };

    const hits: IGMiniGameView[] = await getHits(client, viewQuery, VIEW_INDEX_READ_ALIAS);
    if (hits.length === 0) {
        logMessage('warn', ErrorCode.InvalidView, { siteName, platform, hits });
        throw createError(ErrorCode.InvalidView, 404);
    }
    return hits;
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

        checkRequestParams([siteNameFromParams, validators.siteName], [platform, validators.platform]);

        const ventureId = await getVentureId(client, siteName, spaceLocale, platform);

        const views = await getMiniGamesView(client, ventureId, platform, spaceLocale, siteName);

        const sectionIds = views
            .map((view) => view.sections[spaceLocale].map((section: SysLink) => section.sys.id))
            .flat();

        const { sitegameIds, sectionData } = await getMinigamesSections(
            client,
            sectionIds,
            spaceLocale,
            userLocale,
            platform,
            siteName,
        );

        const minigames = await getMinigames(client, sitegameIds, platform, spaceLocale, ventureId, siteName);

        const minigamesLobby = createMinigamesLobby(sectionData, minigames, spaceLocale, userLocale);

        return {
            statusCode: 200,
            body: JSON.stringify(minigamesLobby),
        };
    } catch (err) {
        const errorLogParams = {
            eventReqId,
            siteName,
            platform,
            userLocale,
        };
        return errorResponseHandler(err, [], errorLogParams);
    }
};
