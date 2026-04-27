import { IG_GAMES_V2_READ_ALIAS } from '../../constants';
import { ErrorCode, logError } from '../../errors';
import { LogCode, logMessage } from '../../logger';
import { IClient } from '../../osClient';
import { getHits, getSiteGameHits } from '../../requestUtils';
import { IMlPersonalizedSection, ML_RECOMMENDED_GAMES_SIZE } from './mappings';
import { getMlIndexForSection } from './helpers';
import { IContentBased, IRecommendations } from '../common/interfaces';
import { FullApiResponseByGame } from '../../sharedInterfaces/interfaces';
import { sortByRanking } from '../../utils';

const ML_CONTENT_INDEX_ACCEPTED_SUGGESTIONS_PER_USER = 2;
const EMPTY_CONTENT_RESPONSE: [string, string[]] = ['', []];

// For Suggested For You Games
export const getMlSuggestedGamesGames = async (
    client: IClient,
    siteName: string,
    sectionType: IMlPersonalizedSection,
    memberId: string,
    platform: string,
): Promise<string[]> => {
    logMessage('log', LogCode.HandlePersonalised, { sectionType });
    const recommendedIndex = getMlIndexForSection(sectionType);
    const idKey = `${memberId}_${siteName}`;
    const recommendedQuery = {
        _source: ['recommendations'],
        query: {
            constant_score: {
                filter: {
                    term: {
                        _id: idKey,
                    },
                },
            },
        },
        size: ML_RECOMMENDED_GAMES_SIZE,
    };

    const hits: IRecommendations[] = await getHits<IRecommendations>(client, recommendedQuery, recommendedIndex);

    if (hits.length === 0) {
        logMessage(
            'warn',
            ErrorCode.NoMlGameRecommendations,
            { siteName, platform, memberId, hits },
            'No recommendations for user, using default recommended games',
        );
        return [];
    } else if (hits.length > 1) {
        logError(
            ErrorCode.MultipleMlGameReccomendations,
            500,
            { siteName, platform, memberId, sectionType, hits },
            // Multiple hits, returning 1st record
            'ML Index Returned more than one recommendation for the account_id for the same venture',
        );
    }

    const mlGameIds = hits[0]?.recommendations
        ?.slice() // clone to avoid mutating the original
        .sort((a, b) => {
            const aScore = typeof a.score === 'number' ? a.score : parseFloat(a.score);
            const bScore = typeof b.score === 'number' ? b.score : parseFloat(b.score);
            return bScore - aScore;
        })
        .map((item) => {
            // Check if 'infinity' vendor exists, otherwise use the first available vendor
            const vendorKey = item.vendor?.infinity ? 'infinity' : Object.keys(item.vendor)[0];
            return item.vendor[vendorKey]?.contentful_game_id;
        });

    return mlGameIds;
};

// For Because You Played
export const getMlContentBasedGames = async (
    client: IClient,
    siteName: string,
    sectionType: IMlPersonalizedSection,
    memberId: string,
    platform: string,
): Promise<[string, string[]]> => {
    logMessage('log', LogCode.HandlePersonalised, { siteName, platform, memberId, sectionType });

    const mlIndex = getMlIndexForSection(sectionType);

    if (mlIndex === '') {
        return EMPTY_CONTENT_RESPONSE;
    }

    const idKey = `${memberId}_${siteName}`;
    const mlQuery = {
        _source: [
            'account_id',
            'because_you_played.source_game_skin_name',
            'because_you_played.contentful_game_id',
            'because_you_played.contentful_game_title',
            'recommendations',
        ],
        query: {
            constant_score: {
                filter: {
                    term: {
                        _id: idKey,
                    },
                },
            },
        },
        size: ML_CONTENT_INDEX_ACCEPTED_SUGGESTIONS_PER_USER,
    };

    const hits: IContentBased[] = await getHits<IContentBased>(client, mlQuery, mlIndex);

    if (hits.length === 0) {
        logMessage(
            'warn',
            ErrorCode.NoMlGameRecommendations,
            { siteName, platform, memberId, hits },
            'No recommendations for user, using default recommended games',
        );
        return EMPTY_CONTENT_RESPONSE;
    } else if (hits.length > 1) {
        logError(
            ErrorCode.MultipleMlGameReccomendations,
            500,
            { siteName, platform, memberId, sectionType },
            // Multiple hits, returning 1st record
            'ML Index Returned more than one recommendation for the account_id for the same venture',
        );
    }

    const recGameName = hits[0]?.because_you_played?.contentful_game_title || '';
    const mlRecGameSkins = sortByRanking(hits[0]?.recommendations || [], 'distance', 'asc').map(
        (item) => item.source_game_skin_name,
    );

    return [recGameName, mlRecGameSkins];
};

export const getMLRecommendedGamesFromGamesIndexBySkin = async (
    client: IClient,
    gameSkinNames: string[],
    ventureId: string,
    spaceLocale: string,
    siteName: string,
    platform: string,
): Promise<FullApiResponseByGame[]> => {
    const ventureKey = `siteGame.venture.${spaceLocale}.sys.id`;
    const ventureMatchExpression: any = {
        match: {},
    };
    ventureMatchExpression.match[ventureKey] = ventureId;
    const gameSkinKey = `game.gameSkin`;
    const gameDataQuery = {
        _source: [
            'game.id',
            'game.metadataTags',
            'game.title',
            'game.infoImgUrlPattern',
            'game.imgUrlPattern',
            'game.loggedOutImgUrlPattern',
            'game.progressiveJackpot',
            'game.representativeColor',
            'game.videoUrlPattern',
            'game.tags',
            'game.webComponentData',
            'game.launchCode',
            'game.animationMedia',
            'game.foregroundLogoMedia',
            'game.backgroundMedia',
            'game.gameName',
            'game.gameSkin',
            'game.mobileGameName',
            'game.mobileGameSkin',
            'game.mobileOverride',
            `game.gamePlatformConfig.gameType.type`,
            `game.gamePlatformConfig.demoUrl`,
            `game.gamePlatformConfig.realUrl`,
            `game.gamePlatformConfig.mobileDemoUrl`,
            `game.gamePlatformConfig.mobileRealUrl`,
        ],
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [
                            {
                                terms: {
                                    [gameSkinKey]: gameSkinNames,
                                },
                            },
                            {
                                has_child: {
                                    type: 'sitegame',
                                    query: {
                                        ...ventureMatchExpression,
                                    },
                                    inner_hits: {
                                        _source: [
                                            'siteGame.sash',
                                            'siteGame.id',
                                            'siteGame.headlessJackpot',
                                            'siteGame.tags',
                                            'siteGame.liveHidden',
                                        ],
                                        size: 1,
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        },
        size: ML_RECOMMENDED_GAMES_SIZE,
    };

    const hits: FullApiResponseByGame[] = await getSiteGameHits(
        client,
        gameDataQuery,
        IG_GAMES_V2_READ_ALIAS,
        siteName,
        platform,
    );

    if (hits.length === 0) {
        logError(ErrorCode.NoGamesReturned, 404, {
            gameDataQuery,
            hits,
        });
        return [];
    }

    return hits;
};

// after we get the recommended game ids from ML call the games index to get the game data
export const getMLRecommendedGamesFromGamesIndex = async (
    client: IClient,
    mlGameIds: string[],
    ventureId: string,
    spaceLocale: string,
    siteName: string,
    platform: string,
): Promise<FullApiResponseByGame[]> => {
    const ventureKey = `siteGame.venture.${spaceLocale}.sys.id`;
    const ventureMatchExpression: any = {
        match: {},
    };
    ventureMatchExpression.match[ventureKey] = ventureId;
    const gameDataQuery = {
        _source: [
            'game.id',
            'game.title',
            'game.dfgWeeklyImgUrlPattern',
            'game.infoImgUrlPattern',
            'game.imgUrlPattern',
            'game.loggedOutImgUrlPattern',
            'game.progressiveJackpot',
            'game.progressiveBackgroundColor',
            'game.representativeColor',
            'game.videoUrlPattern',
            'game.tags',
            'game.webComponentData',
            'game.launchCode',
            'game.animationMedia',
            'game.loggedOutAnimationMedia',
            'game.foregroundLogoMedia',
            'game.loggedOutForegroundLogoMedia',
            'game.backgroundMedia',
            'game.loggedOutBackgroundMedia',
            'game.gameName',
            'game.gameSkin',
            'game.mobileGameName',
            'game.mobileGameSkin',
            'game.mobileOverride',
            `game.gamePlatformConfig.demoUrl`,
            `game.gamePlatformConfig.realUrl`,
            `game.gamePlatformConfig.mobileDemoUrl`,
            `game.gamePlatformConfig.mobileRealUrl`,
        ],
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [
                            {
                                terms: {
                                    _id: mlGameIds,
                                },
                            },
                            {
                                has_child: {
                                    type: 'sitegame',
                                    query: {
                                        ...ventureMatchExpression,
                                    },
                                    inner_hits: {
                                        _source: [
                                            'siteGame.sash',
                                            'siteGame.id',
                                            'siteGame.headlessJackpot',
                                            'siteGame.tags',
                                        ],
                                        size: 1,
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        },
        size: ML_RECOMMENDED_GAMES_SIZE,
    };

    const hits: FullApiResponseByGame[] = await getSiteGameHits(
        client,
        gameDataQuery,
        IG_GAMES_V2_READ_ALIAS,
        siteName,
        platform,
    );

    if (hits.length === 0) {
        logError(ErrorCode.NoGamesReturned, 404, { siteName, platform, gameDataQuery, hits });
        return [];
    }

    return hits;
};
