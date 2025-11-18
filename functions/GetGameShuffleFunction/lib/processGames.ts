import {
    createError,
    ErrorCode,
    FullApiResponse,
    GAMES_INDEX_V2_ALIAS,
    getGamesSiteGames,
    getHitsWithIndex,
    getLambdaExecutionEnvironment,
    IClient,
    LogCode,
    logMessage,
    ML_GAME_SHUFFLE_ALIAS,
} from 'os-client';
import { GameShuffle } from './interface';

export const getGameShuffleData = async (
    client: IClient,
    siteName: string,
    platform: string,
): Promise<{ firstBucket: GameShuffle[]; secondThirdBucket: GameShuffle[] }> => {
    const firstBucketRtpLimit = 93;
    const secondThirdBucketRtpLimit = 96;

    const queryFirstBucketList = {
        size: 3000,
        query: {
            constant_score: {
                filter: {
                    range: {
                        rtp: {
                            lte: firstBucketRtpLimit,
                        },
                    },
                },
            },
        },
    };

    const querySecondThirdBucketList = {
        size: 3000,
        query: {
            constant_score: {
                filter: {
                    range: {
                        rtp: {
                            lt: secondThirdBucketRtpLimit,
                        },
                    },
                },
            },
        },
    };

    const getFirstBucketHit = await getHitsWithIndex<GameShuffle>(client, queryFirstBucketList, ML_GAME_SHUFFLE_ALIAS);
    const getSecondThirdBucketHit = await getHitsWithIndex<GameShuffle>(
        client,
        querySecondThirdBucketList,
        ML_GAME_SHUFFLE_ALIAS,
    );

    if (getFirstBucketHit.length === 0 || getFirstBucketHit.length === 0) {
        logMessage('warn', LogCode.NoGameShuffleData, { siteName, platform });
        throw createError(ErrorCode.NoGameShuffleData, 404);
    }

    const firstBucketRtp = getFirstBucketHit.map((item) => item.source);
    const secondThirdBucketRtp = getSecondThirdBucketHit.map((item) => item.source);

    return {
        firstBucket: firstBucketRtp,
        secondThirdBucket: secondThirdBucketRtp,
    };
};

export const getGamesSiteGamesOnGameSkin = async (
    client: IClient,
    ventureId: string,
    siteName: string,
    platform: string,
    spaceLocale: string,
    gameShuffleList: GameShuffle[],
): Promise<FullApiResponse[]> => {
    const gameSkinKey = `game.gamePlatformConfig.${spaceLocale}.gameSkin.keyword`;
    const platformKey = `siteGame.platformVisibility.${spaceLocale}.keyword`;
    const environmentKey = `siteGame.environmentVisibility.${spaceLocale}.keyword`;
    const ventureKey = `siteGame.venture.${spaceLocale}.sys.id.keyword`;

    const gameSkins = gameShuffleList.map((game) => game.game_skin);
    const gameOnGameSkinQuery = {
        size: 3000,
        _source: ['siteGame.id', 'siteGame.entryTitle'],
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [
                            {
                                has_parent: {
                                    parent_type: 'game',
                                    query: {
                                        terms: { [gameSkinKey]: gameSkins },
                                    },
                                    inner_hits: {
                                        _source: {
                                            includes: [
                                                `game.id`,
                                                `game.gamePlatformConfig.${spaceLocale}.demoUrl`,
                                                `game.gamePlatformConfig.${spaceLocale}.realUrl`,
                                                `game.gamePlatformConfig.${spaceLocale}.gameSkin`,
                                                `game.gamePlatformConfig.${spaceLocale}.name`,
                                                `game.imgUrlPattern`,
                                                `game.loggedOutImgUrlPattern`,
                                                `game.representativeColor`,
                                                `game.headlessJackpot`,
                                                `game.animationMedia`,
                                                `game.loggedOutAnimationMedia`,
                                                `game.foregroundLogoMedia`,
                                                `game.loggedOutForegroundLogoMedia`,
                                                `game.backgroundMedia`,
                                                `game.loggedOutBackgroundMedia`,
                                                `game.title`,
                                            ],
                                        },
                                    },
                                },
                            },
                            {
                                term: {
                                    [ventureKey]: ventureId,
                                },
                            },
                            {
                                term: {
                                    [platformKey]: platform,
                                },
                            },
                            {
                                term: {
                                    [environmentKey]: getLambdaExecutionEnvironment(),
                                },
                            },
                        ],
                    },
                },
            },
        },
    };

    const gameSiteGameResponse = await getGamesSiteGames(
        client,
        gameOnGameSkinQuery,
        GAMES_INDEX_V2_ALIAS,
        ventureId,
        siteName,
        platform,
    );

    return gameSiteGameResponse;
};
