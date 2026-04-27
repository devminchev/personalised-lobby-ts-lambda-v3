import { createError, ErrorCode } from './errors';
import { logMessage } from './logger';
import { IClient, IBucket } from './osClient';
import { IGamesSource, ISiteGameToLayout } from './sharedInterfaces/search';

export const validateGameHits = <T>(data: T[], siteName?: string, platform?: string): T => {
    if (data.length <= 0) {
        logMessage(
            'warn',
            ErrorCode.NoGamesReturned,
            { siteName, platform, data },
            `Game validation check failed. No game results were found.`,
        );
        throw createError(ErrorCode.NoGamesReturned, 404);
    } else if (data.length > 1) {
        console.warn(`Expected 1 entry, received ${data.length} entries. Only considering the first entry...`);
    }
    return data[0];
};

export const getHits = async <T>(client: IClient, query: object, index: string): Promise<T[]> => {
    const response = await client.searchWithHandling<T>(query, index);

    return response.hits.hits.map((hit) => hit._source);
};

/**
 * Returns both the _source and the originating index for each hit.
 * Useful for multi-index/alias queries where the source index is needed (e.g., ML use cases).
 */
export const getHitsWithIndex = async <T>(
    client: IClient,
    query: object,
    index: string,
): Promise<Array<{ source: T; index: string }>> => {
    const response = await client.searchWithHandling<T>(query, index);
    return response.hits.hits.map((hit) => ({
        source: hit._source,
        index: hit._index,
    }));
};

export const getGameHits = async <T, S = any>(
    client: IClient,
    query: object,
    index: string,
    siteName: string,
    platform: string,
): Promise<{ hit: T; innerHit: S }[]> => {
    const response = await client.searchWithHandling<T, S>(query, index);
    return response.hits.hits.map((hits) => {
        const innerHits = hits.inner_hits?.game?.hits?.hits ?? [];
        const innerHit = validateGameHits(innerHits, siteName, platform);
        return { hit: hits._source, innerHit: innerHit._source };
    });
};

export const getSiteGameHits = async <T, S = any>(
    client: IClient,
    query: object,
    index: string,
    siteName: string,
    platform: string,
): Promise<{ hit: T; innerHit: S }[]> => {
    const response = await client.searchWithHandling<T, S>(query, index);
    return response.hits.hits.map((hits) => {
        const innerHits = hits.inner_hits?.sitegame?.hits?.hits ?? [];
        const innerHit = validateGameHits(innerHits, siteName, platform);
        return { hit: hits._source, innerHit: innerHit._source };
    });
};

export const getAggregatedHits = async <T, S = any>(
    client: IClient,
    query: object,
    index: string,
): Promise<IBucket<T>> => {
    const response = await client.searchWithHandling<T>(query, index);
    const totalHits = response.hits.total.value;

    if (totalHits === 0) return {};

    const aggregations = response?.aggregations?.group_by_category?.buckets || {};

    return aggregations;
};

export const extractLayoutToGameDictFromAggregation = (
    aggregations: IBucket<IGamesSource>,
    locale: string,
): ISiteGameToLayout => {
    const allGameIdsSet = new Set<string>();
    const invertedIndex = Object.keys(aggregations).reduce<Record<string, string[]>>((acc, key) => {
        const hits = aggregations[key]?.top_documents?.hits?.hits || [];
        hits.forEach((hit) => {
            if (hit._source?.games?.[locale] && hit._source.games[locale].length > 0) {
                const games = hit._source.games[locale];
                games.forEach((game) => {
                    const gameId = game.sys.id;
                    allGameIdsSet.add(gameId);

                    if (!acc[gameId]) {
                        acc[gameId] = [];
                    }
                    if (!acc[gameId].includes(key)) {
                        acc[gameId].push(key); // Ensure we do not add the key multiple times
                    }
                });
            }
        });

        return acc;
    }, {});

    // Convert allGameIdsSet to an array for the final output
    const allSiteGameIds = Array.from(allGameIdsSet);

    return { invertedIndex, allSiteGameIds };
};
