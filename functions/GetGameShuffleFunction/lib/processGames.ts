import {
    createError,
    ErrorCode,
    FullApiResponse,
    IG_GAMES_V2_READ_ALIAS,
    getGamesSiteGames,
    getHitsWithIndex,
    getLambdaExecutionEnvironment,
    IClient,
    LogCode,
    logMessage,
    ML_GAME_SHUFFLE_ALIAS,
} from 'os-client';
import { GameShuffle } from './interface';
import { timed } from './utils';

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

    const [firstBucketResult, secondBucketResult] = await timed('game-shuffle-queries', { siteName, platform }, () =>
        Promise.allSettled([
            getHitsWithIndex<GameShuffle>(client, queryFirstBucketList, ML_GAME_SHUFFLE_ALIAS),
            getHitsWithIndex<GameShuffle>(client, querySecondThirdBucketList, ML_GAME_SHUFFLE_ALIAS),
        ]),
    );

    if (firstBucketResult.status !== 'fulfilled' || secondBucketResult.status !== 'fulfilled') {
        logMessage('warn', LogCode.NoGameShuffleData, {
            siteName,
            platform,
            firstBucketStatus: firstBucketResult.status,
            secondBucketStatus: secondBucketResult.status,
        });
        throw createError(ErrorCode.NoGameShuffleData, 404);
    }

    const firstBucketHits = firstBucketResult.value;
    const secondThirdBucketHits = secondBucketResult.value;

    if (firstBucketHits.length === 0 || secondThirdBucketHits.length === 0) {
        logMessage('warn', LogCode.NoGameShuffleData, { siteName, platform });
        throw createError(ErrorCode.NoGameShuffleData, 404);
    }

    const firstBucketRtp = firstBucketHits.map((item) => item.source);
    const secondThirdBucketRtp = secondThirdBucketHits.map((item) => item.source);

    const firstBucketSkins = new Set(firstBucketRtp.map((item) => item.game_skin));
    const uniqueSecondThirdBucketRtp = secondThirdBucketRtp.filter((item) => !firstBucketSkins.has(item.game_skin));

    return {
        firstBucket: firstBucketRtp,
        secondThirdBucket: uniqueSecondThirdBucketRtp,
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
    const gameSkinKey = `game.gameSkin`;
    const platformKey = `siteGame.platformVisibility.${spaceLocale}.keyword`;
    const environmentKey = `siteGame.environmentVisibility.${spaceLocale}.keyword`;
    const ventureKey = `siteGame.venture.${spaceLocale}.sys.id.keyword`;

    const gameSkins = gameShuffleList.map((game) => game.game_skin);
    const gameOnGameSkinQuery = {
        size: Math.min(gameSkins.length, 3000),
        track_total_hits: false,
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
                                                `game.gamePlatformConfig.demoUrl`,
                                                `game.gamePlatformConfig.realUrl`,
                                                `game.gameSkin`,
                                                `game.gameName`,
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

    const gameSiteGameResponse = await timed(
        'site-games-query-gamesV2-index',
        { siteName, platform, requestedGameSkins: gameSkins.length },
        () => getGamesSiteGames(client, gameOnGameSkinQuery, IG_GAMES_V2_READ_ALIAS, ventureId, siteName, platform),
    );

    return gameSiteGameResponse;
};
