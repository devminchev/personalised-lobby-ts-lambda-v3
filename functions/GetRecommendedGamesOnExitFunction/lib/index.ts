import {
    IClient,
    logMessage,
    logError,
    ErrorCode,
    getHits,
    getVentureId,
    tryGetValueFromLocalised,
    IOpenSearchQuery,
    IHeadlessJackpot,
    FullApiResponse,
    getGameHits,
    LogCode,
    SanitizedBynder,
} from 'os-client';
import { IG_GAMES_V2_READ_ALIAS, ML_RECOMMENDED_GAMES_ON_EXIT_INDEX_ALIAS } from 'os-client/lib/constants';
import {
    extractBynderObject,
    GAME_SEARCH_QUERY_LIMIT,
    getLambdaExecutionEnvironment,
    pickGameOrSiteGameValue,
    resolveGameProp,
} from 'os-client/lib/utils';

const MAX_SIZE = 1_000; // Maximum size for the ML query

export const getRecommendationGamesOnExitData = async (
    client: IClient,
    gameSkin: string,
    siteName: string,
): Promise<IMLIndexResponse[]> => {
    try {
        const recGames = await getDataFromIndex(client, siteName, gameSkin);

        if (!recGames || !recGames.similar_games || recGames.similar_games.length === 0) {
            logMessage('warn', LogCode.NoMLRecordGamesOnExit, { siteName, gameSkin });
            return [];
        }
        return recGames.similar_games;
    } catch (err) {
        logError(ErrorCode.MlIndexError, 500, { err });
        return [];
    }
};

export const createGamesByGameSkinQuery = (
    gameSkinNames: string[],
    ventureId: string,
    spaceLocale: string,
    platform: string,
): IOpenSearchQuery => {
    const ventureKey = `siteGame.venture.${spaceLocale}.sys.id`;
    const platformKey = `siteGame.platformVisibility.${spaceLocale}.keyword`;
    const environmentKey = `siteGame.environmentVisibility.${spaceLocale}.keyword`;
    const gameSkinKey = `game.gameSkin`;

    const gamesListQuery: IOpenSearchQuery = {
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
                                        terms: {
                                            [gameSkinKey]: gameSkinNames,
                                        },
                                    },
                                    inner_hits: {
                                        _source: [
                                            'game.gamePlatformConfig',
                                            'game.gameName',
                                            'game.gameSkin',
                                            'game.mobileGameName',
                                            'game.mobileGameSkin',
                                            'game.mobileOverride',
                                            'game.title',
                                            'game.tags',
                                            'game.infoImgUrlPattern',
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
        _source: ['siteGame.id', 'siteGame.headlessJackpot', 'siteGame.gameId', 'siteGame.tags'],
        size: GAME_SEARCH_QUERY_LIMIT,
    };

    return gamesListQuery;
};

export const getGamebyGameSkin = async (
    client: IClient,
    siteName: string,
    gameSkin: string,
    locale: string,
    spaceLocale: string,
    platform: string,
): Promise<IGameRecommendationResponse[]> => {
    const ventureId = await getVentureId(client, siteName, spaceLocale, platform);

    const recsGames = await getRecommendationGamesOnExitData(client, gameSkin, locale);

    const gameSkins = recsGames.map((game) => game.source_game_skin_name);
    if (gameSkins.length === 0) {
        logMessage('warn', LogCode.NoMLRecordGamesOnExit, { siteName, gameSkin, platform });
        return [];
    }
    const gamesByGameSkinQuery = createGamesByGameSkinQuery(gameSkins, ventureId, spaceLocale, platform);
    const gamesByGameSkin: FullApiResponse[] = await getGameHits(
        client,
        gamesByGameSkinQuery,
        IG_GAMES_V2_READ_ALIAS,
        siteName,
        platform,
    );
    const response = gameRecommendationResponse(recsGames, gamesByGameSkin, spaceLocale, locale, platform);

    return response;
};

// eslint-disable-next-line prettier/prettier
const gameRecommendationResponse = (
    recommendedGames: IMLIndexResponse[],
    gamesByGameSkin: FullApiResponse[],
    spaceLocale: string,
    localeOverride: string,
    platform: string,
): IGameRecommendationResponse[] => {
    const response = gamesByGameSkin.map((item) => {
        const gameData = item.innerHit?.game;
        const siteGameData = item.hit?.siteGame;
        const gamePlatformObject = gameData?.gamePlatformConfig || {};
        const isMobileOverride = platform.toLowerCase() !== 'web' && gameData?.mobileOverride;
        const gameName = isMobileOverride ? gameData?.mobileGameName : gameData?.gameName;
        const computedGameSkin = isMobileOverride ? gameData?.mobileGameSkin : gameData?.gameSkin;
        const computedDemoUrl = isMobileOverride ? gamePlatformObject?.mobileDemoUrl : gamePlatformObject?.demoUrl;
        const computedRealUrl = isMobileOverride ? gamePlatformObject?.mobileRealUrl : gamePlatformObject?.realUrl;
        const imgUrlPattern = tryGetValueFromLocalised(localeOverride, spaceLocale, gameData?.imgUrlPattern, '');
        const gamePlatformConfig = gameData?.gamePlatformConfig || null;
        const tags = pickGameOrSiteGameValue(gameData?.tags, siteGameData?.tags?.[spaceLocale], null);
        const backgroundMedia = tryGetValueFromLocalised(localeOverride, spaceLocale, gameData?.backgroundMedia, null);
        const loggedOutBackgroundMedia = tryGetValueFromLocalised(
            localeOverride,
            spaceLocale,
            gameData?.loggedOutBackgroundMedia,
            null,
        );
        const foregroundLogoMedia = tryGetValueFromLocalised(
            localeOverride,
            spaceLocale,
            gameData?.foregroundLogoMedia,
            null,
        );
        const loggedOutForegroundLogoMedia = tryGetValueFromLocalised(
            localeOverride,
            spaceLocale,
            gameData?.loggedOutForegroundLogoMedia,
            null,
        );
        const localizedGameTitle = tryGetValueFromLocalised(localeOverride, spaceLocale, gameData?.title, '');
        const animationMedia = tryGetValueFromLocalised(localeOverride, spaceLocale, gameData?.animationMedia, null);
        const loggedOutAnimationMedia = tryGetValueFromLocalised(
            localeOverride,
            spaceLocale,
            gameData?.loggedOutAnimationMedia,
            null,
        );
        const headlessJackpot = tryGetValueFromLocalised(localeOverride, spaceLocale, gameData?.headlessJackpot, null);

        const foregroundLogoMediaObj = extractBynderObject(foregroundLogoMedia);
        const loggedOutForegroundLogoMediaObj = extractBynderObject(loggedOutForegroundLogoMedia);
        const backgroundMediaObj = extractBynderObject(backgroundMedia);
        const loggedOutBackgroundMediaObj = extractBynderObject(loggedOutBackgroundMedia);
        return {
            entryId: siteGameData.id,
            gameId: siteGameData.gameId,
            name: gameName,
            ...(gameData?.title && { title: localizedGameTitle }),
            ...(gameData?.progressiveJackpot && {
                isProgressiveJackpot: resolveGameProp(gameData?.progressiveJackpot, spaceLocale, false),
            }),
            ...(gamePlatformConfig && { gameSkin: computedGameSkin }),
            ...(gamePlatformConfig && { demoUrl: computedDemoUrl || gamePlatformObject?.demoUrl }),
            ...(gamePlatformConfig && { realUrl: computedRealUrl || gamePlatformConfig?.realUrl }),
            ...(imgUrlPattern && { imgUrlPattern: imgUrlPattern }),
            ...(animationMedia && { animationMedia }),
            ...(loggedOutAnimationMedia && { loggedOutAnimationMedia }),
            ...(backgroundMediaObj && { backgroundMedia: backgroundMediaObj }),
            ...(loggedOutBackgroundMediaObj && { loggedOutBackgroundMedia: loggedOutBackgroundMediaObj }),
            ...(foregroundLogoMediaObj && { foregroundLogoMedia: foregroundLogoMediaObj }),
            ...(loggedOutForegroundLogoMediaObj && { loggedOutForegroundLogoMedia: loggedOutForegroundLogoMediaObj }),
            ...(tags && { tags }),
            ...(headlessJackpot && { headlessJackpot }),
        };
    });

    // Sort the response based on the score from the recommended games
    response.sort((a, b) => {
        const recGameA = recommendedGames.find((rec) => rec.contentful_game_id === a.gameId);
        const recGameB = recommendedGames.find((rec) => rec.contentful_game_id === b.gameId);
        const scoreA = recGameA ? recGameA.distance : Number.MAX_SAFE_INTEGER;
        const scoreB = recGameB ? recGameB.distance : Number.MAX_SAFE_INTEGER;
        return scoreA - scoreB;
    });
    return response;
};

interface IGameRecommendationResponse {
    entryId: string;
    gameId: string;
    name?: string;
    title: string;
    gameSkin?: string;
    demoUrl?: string;
    realUrl?: string;
    imgUrlPattern?: string;
    isProgressiveJackpot?: boolean;
    animationMedia?: string;
    backgroundMedia?: SanitizedBynder;
    foregroundLogoMedia?: SanitizedBynder;
    tags?: string[];
    headlessJackpot?: IHeadlessJackpot;
}

interface IMLIndexResponse {
    contentful_game_id: string;
    contentful_game_title: string;
    distance: number;
    source_game_skin_name: string;
}

interface MLIndexResponse {
    contentful_game_id: string;
    similar_games: IMLIndexResponse[];
}

const matchVentureNameToTennant = (siteName: string) => {
    switch (siteName) {
        case 'botemania':
        case 'monopolycasinospain':
            return 'excite-eu-es';
        default:
            return 'excite-eu-uk';
    }
};

export const getDataFromIndex = async (
    client: IClient,
    siteName: string,
    gameSkin: string,
): Promise<MLIndexResponse> => {
    const tennant = matchVentureNameToTennant(siteName);

    const mlQuery = {
        _source: ['contentful_game_id', 'similar_games'],
        query: {
            bool: {
                filter: [
                    { term: { 'tenant_name.keyword': tennant } },
                    // at least one of these should match:
                    {
                        bool: {
                            should: [
                                { term: { 'game.source_game_skin_name.keyword': gameSkin } },
                                { term: { 'game.mobile_game_skin_name.keyword': gameSkin } },
                            ],
                            minimum_should_match: 1,
                        },
                    },
                ],
            },
        },
    };

    const hits: MLIndexResponse[] = await getHits<MLIndexResponse>(
        client,
        mlQuery,
        ML_RECOMMENDED_GAMES_ON_EXIT_INDEX_ALIAS,
    );

    const empty_response = { contentful_game_id: '', similar_games: [] };

    if (hits.length === 0) {
        logMessage('warn', LogCode.NoMLRecordGamesOnExit, { siteName, gameSkin });
        return empty_response;
    }

    return hits[0] || empty_response;
};
