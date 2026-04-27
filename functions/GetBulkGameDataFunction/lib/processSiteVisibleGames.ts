import {
    ALL_SECTIONS_SHARED_READ_ALIAS,
    createError,
    ErrorCode,
    FullApiResponse,
    IG_GAMES_V2_READ_ALIAS,
    getGameHits,
    getHits,
    getLambdaExecutionEnvironment,
    IClient,
    logError,
} from 'os-client';
import { ISectionGameIds } from './interface';

const SITE_GAMES_SIZE = 3000;
const SECTION_GAMES_SIZE = 1000;

export const getGamesFromSections = async (
    client: IClient,
    platform: string,
    sectionsIds: string[],
    spaceLocale: string,
    siteName: string,
): Promise<{ gameIds: string[]; gameSectionsMap: Record<string, string[]> }> => {
    const envKey = `environmentVisibility.${spaceLocale}.keyword`;
    const platformKey = `platformVisibility.${spaceLocale}.keyword`;

    const getSectionsQuery = {
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [{ ids: { values: sectionsIds } }],
                        filter: [
                            { term: { [envKey]: getLambdaExecutionEnvironment() } },
                            { term: { [platformKey]: platform } },
                        ],
                    },
                },
            },
        },
        size: SECTION_GAMES_SIZE,
    };

    const sectionHits: ISectionGameIds[] = await getHits(client, getSectionsQuery, ALL_SECTIONS_SHARED_READ_ALIAS);

    if (sectionHits.length === 0) {
        const errorCode = ErrorCode.MissingSectionGames;
        logError(errorCode, 404, { siteName, platform, sectionsIds });
        throw createError(errorCode, 404);
    }

    const gameSectionsMap: Record<string, string[]> = {};
    const gameIds: string[] = [];
    const seenGameIds = new Set<string>();

    sectionHits.forEach((section) => {
        const sectionId = section.id;
        if (!sectionId) {
            return;
        }

        const localizedGames = section.games?.[spaceLocale] ?? [];
        localizedGames.forEach((game) => {
            const gameId = game?.sys?.id;
            if (!gameId) {
                return;
            }

            if (!gameSectionsMap[gameId]) {
                gameSectionsMap[gameId] = [];
            }

            if (!gameSectionsMap[gameId].includes(sectionId)) {
                gameSectionsMap[gameId].push(sectionId);
            }

            if (!seenGameIds.has(gameId)) {
                seenGameIds.add(gameId);
                gameIds.push(gameId);
            }
        });
    });

    return { gameIds, gameSectionsMap };
};

export const getUserVisibleGameAndSiteGames = async (
    client: IClient,
    ventureId: string,
    platform: string,
    gameIds: string[],
    spaceLocale: string,
    siteName: string,
): Promise<FullApiResponse[]> => {
    const ventureKey = `siteGame.venture.${spaceLocale}.sys.id`;
    const envKey = `siteGame.environmentVisibility.${spaceLocale}.keyword`;
    const platformKey = `siteGame.platformVisibility.${spaceLocale}.keyword`;

    const query = {
        size: SITE_GAMES_SIZE,
        _source: ['siteGame.id'],
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
                                            `game.title`,
                                            `game.launchCode`,
                                            'game.minBet',
                                            'game.maxBet',
                                            `game.gamePlatformConfig`,
                                            'game.gameName',
                                            'game.gameSkin',
                                            'game.mobileGameName',
                                            'game.mobileGameSkin',
                                            'game.rtp',
                                            'game.id',
                                            'game.contentType',
                                            'game.platformVisibility',
                                            'game.entryTitle',
                                            'game.vendor',
                                        ],
                                    },
                                },
                            },
                            { terms: { _id: gameIds } },
                            { match: { [ventureKey]: ventureId } },
                            { term: { [platformKey]: platform } },
                            { term: { [envKey]: getLambdaExecutionEnvironment() } },
                        ],
                    },
                },
            },
        },
    };

    const gameHits: FullApiResponse[] = await getGameHits(client, query, IG_GAMES_V2_READ_ALIAS, siteName, platform);
    if (gameHits.length === 0) {
        const errorCode = ErrorCode.NoGamesReturned;
        logError(errorCode, 404, { siteName, platform, gameHits });
        throw createError(errorCode, 404);
    }

    return gameHits;
};
