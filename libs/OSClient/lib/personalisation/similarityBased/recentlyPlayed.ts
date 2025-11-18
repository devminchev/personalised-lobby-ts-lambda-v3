import { ErrorCode, logError } from '../../errors';
import { LogCode, logMessage } from '../../logger';
import { IClient } from '../../osClient';
import { IMlPersonalizedSection } from '../common/mappings';
import { ISectionGame } from '../../sharedInterfaces/interfaces';
import { orderByKey } from '../../utils';
import { getMLRecommendedGamesFromGamesIndexBySkin } from '../common/personalisationOSRequests';
import { gamesPayloadByGame, createDefaultMapperPicking } from '../../gamesPayloads';
import { IContentBasedRP, IRecentlyPlayed, OrderCriteria } from '../common/interfaces';
import { ML_RECENTLY_PLAYED_ALIAS } from '../../constants';
import { getHits } from '../../requestUtils';

export const MAX_NUMBER_OF_GAMES = 30;
export const NUMBER_OF_WANTED_GAMES = 12;
export const NUMBER_OF_MIN_GAMES = 3;
interface IRecentlyPlayedParams {
    client: IClient;
    sectionType: IMlPersonalizedSection;
    ventureId: string;
    memberId: string;
    siteName: string;
    spaceLocale: string;
    userLocale: string;
    platform: string;
    orderCriteria: OrderCriteria;
    showWebComponent?: boolean;
}

const RP_EXCLUSION_TAG = 'exclude_recently_played';

export interface IRecentlyPlayedResult {
    gameSkins: string[];
}

type IRecentlyPlayedSubset = Pick<
    IRecentlyPlayedParams,
    'client' | 'sectionType' | 'ventureId' | 'memberId' | 'siteName' | 'spaceLocale' | 'platform' | 'orderCriteria'
>;

const EMPTY_RECOMMENDATION: ISectionGame[] = [];

const EMPTY_CONTENT_BASED_RECOMMENDATION: IRecentlyPlayedResult = {
    gameSkins: [],
};

// Picker-based mapper: select only needed props from the default payload
const recentlyPlayedMapper = createDefaultMapperPicking([
    'entryId',
    'gameId',
    'name',
    'gameType',
    'title',
    'imgUrlPattern',
    'gameSkin',
    'demoUrl',
    'realUrl',
    'representativeColor',
    'videoUrlPattern',
    'animationMedia',
    'foregroundLogoMedia',
    'backgroundMedia',
    'tags',
    'headlessJackpot',
    'isProgressiveJackpot',
    'progressiveBackgroundColor',
    'liveHidden',
] as const);

interface IRPParams {
    sectionType: string;
    memberId: string;
    siteName: string;
    orderCriteria: OrderCriteria;
}
export const createRpQuery = ({ memberId, siteName, orderCriteria }: IRPParams) => {
    const idKey = `${memberId}_${siteName}`;
    const mlQuery = {
        track_total_hits: false,
        _source: [
            'id',
            'recently_played_games.game_skin',
            `recently_played_games.${orderCriteria}`,
            'recently_played_games.wager',
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
        size: 1,
    };
    return mlQuery;
};

/**
 * Sorts the provided recently-played games using the given `orderCriteria` and returns the top 30 results.
 *
 * Sorting behaviour:
 * - When `orderCriteria` is `margin_rank` we sort ascending (lower rank is better). For every other metric we sort descending.
 * - If a record is missing the requested metric we fall back to +/- infinity so that valid values always sort ahead.
 * - When the primary metric ties and the `orderCriteria` is neither `wager` nor `margin_rank`, we apply a secondary sort
 *   on `wager`, preferring the higher wager first. Wagers are guaranteed to be numeric, and non-numeric values fall back
 *   to negative infinity so they sink to the end.
 * - If both the primary metric and wager tie, the sort remains stable and preserves the original order of the items.
 *
 * The function clones the original array to avoid side effects and finally truncates the collection to the top 30 entries.
 */
export const top30Desc = (rpGames: IRecentlyPlayed[], orderCriteria: OrderCriteria) => {
    const isAscending = orderCriteria === 'margin_rank'; // Ascending order is only for margin_rank, as the ranking is already calculated based on margin, coming from databricks
    const fallbackValue = isAscending ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    const get = (val: IRecentlyPlayed) => {
        const metricValue = val[orderCriteria];
        return typeof metricValue === 'number' ? metricValue : fallbackValue;
    };
    // Logic when sorting by anything which is not wager or margin_rank to:
    //  - if the sort criteria values are the same then the rpGame with the higher wager comes first.
    const getWager = (val: IRecentlyPlayed) => (typeof val.wager === 'number' ? val.wager : Number.NEGATIVE_INFINITY);
    const shouldUseWagerTieBreaker = orderCriteria !== 'wager' && orderCriteria !== 'margin_rank';

    return rpGames
        .slice()
        .sort((a, b) => {
            const metricA = get(a);
            const metricB = get(b);

            if (shouldUseWagerTieBreaker && metricA === metricB) {
                const wagerA = getWager(a);
                const wagerB = getWager(b);

                if (wagerA !== wagerB) {
                    return wagerB - wagerA; // Order has to be descending (from higher to lower)
                }
            }

            return isAscending ? metricA - metricB : metricB - metricA;
        })
        .slice(0, 30);
};

export const getRecentlyPlayedSkins = async ({
    client,
    sectionType,
    memberId,
    siteName,
    platform,
    orderCriteria,
}: IRecentlyPlayedSubset): Promise<IRecentlyPlayedResult> => {
    try {
        logMessage('log', LogCode.HandlePersonalised, { siteName, platform, memberId, sectionType });

        // 1. Get RecentlyPlayed from the RP index - pass sort param in OS and get first 30 with that order
        const rpQuery = createRpQuery({ sectionType, memberId, siteName, orderCriteria });

        const hits: IContentBasedRP[] = await getHits<IContentBasedRP>(client, rpQuery, ML_RECENTLY_PLAYED_ALIAS);

        const rpInHits = hits?.[0]?.recently_played_games || [];

        // Check if any games returned and more than min if not exit
        if (hits.length === 0 || rpInHits.length <= NUMBER_OF_MIN_GAMES) {
            logMessage('warn', ErrorCode.NoRPGameRecommendations, { siteName, platform, memberId, hits });
            return EMPTY_CONTENT_BASED_RECOMMENDATION;
        }

        const sortedRP = top30Desc(rpInHits, orderCriteria);
        const sanitisedRpGames = sortedRP.map((item) => item.game_skin);

        return { gameSkins: sanitisedRpGames };
    } catch (err) {
        logError(ErrorCode.MlIndexError, 500, { siteName, platform, memberId, sectionType, err });
        return EMPTY_CONTENT_BASED_RECOMMENDATION;
    }
};

export const handleRecentlyPlayed = async ({
    client,
    sectionType,
    ventureId,
    memberId,
    siteName,
    spaceLocale,
    userLocale,
    platform,
    orderCriteria,
    showWebComponent,
}: IRecentlyPlayedParams): Promise<ISectionGame[]> => {
    try {
        // Get game Skins
        const { gameSkins } = await getRecentlyPlayedSkins({
            client,
            sectionType,
            ventureId,
            memberId,
            siteName,
            spaceLocale,
            orderCriteria,
            platform,
        });

        if (gameSkins.length === 0) {
            return EMPTY_RECOMMENDATION;
        }
        // Get games from games-v2 by those skins
        const recentlyPlayed = await getMLRecommendedGamesFromGamesIndexBySkin(
            client,
            gameSkins,
            ventureId,
            spaceLocale,
            siteName,
            platform,
        );

        if (recentlyPlayed.length <= 3) {
            logMessage('warn', LogCode.RpGamesLimitNotMet, { sectionType, memberId });
            return EMPTY_RECOMMENDATION;
        }

        const filteredRecentlyPlayed = recentlyPlayed.filter(
            (item) => !item.hit?.game?.metadataTags?.some((t) => t?.sys?.id === RP_EXCLUSION_TAG),
        );

        // Create games Payload
        const sectionGamesPayload = gamesPayloadByGame(
            filteredRecentlyPlayed,
            spaceLocale,
            userLocale,
            platform,
            showWebComponent,
            recentlyPlayedMapper,
        );

        const orderedPayload = orderByKey<ISectionGame>(
            sectionGamesPayload,
            gameSkins,
            (x) => x.gameSkin as string,
        ).slice(0, NUMBER_OF_WANTED_GAMES);

        return orderedPayload;
    } catch (err) {
        return EMPTY_RECOMMENDATION;
    }
};
