import {
    ALL_SECTIONS_SHARED_READ_ALIAS,
    createError,
    ErrorCode,
    FullApiResponse,
    GAMES_INDEX_V2_ALIAS,
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
): Promise<string[]> => {
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

    // some sections do not have games so we skip them
    const gameIds = sectionHits.flatMap((item) => {
        return item?.games?.[spaceLocale].map((game) => game.sys.id) ?? [];
    });

    return gameIds;
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

    const gameHits: FullApiResponse[] = await getGameHits(client, query, GAMES_INDEX_V2_ALIAS, siteName, platform);
    if (gameHits.length === 0) {
        const errorCode = ErrorCode.NoGamesReturned;
        logError(errorCode, 404, { siteName, platform, gameHits });
        throw createError(errorCode, 404);
    }

    return gameHits;
};
