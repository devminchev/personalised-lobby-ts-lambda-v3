import {
    IClient,
    getGameHits,
    ErrorCode,
    FullApiResponse,
    IOpenSearchQuery,
    ISectionGameOnlyQuery,
    getHits,
    createError,
    IMlPersonalizedSection,
    ALL_SECTIONS_SHARED_READ_ALIAS,
    IG_GAMES_V2_READ_ALIAS,
    logMessage,
    OrderCriteriaContentful,
} from 'os-client';

const SECTION_GAMES_SECTION_RECORDS_LIMIT = 100;

export interface ISectionGamesPagination {
    offset?: number;
    limit?: number;
}

export interface ISectionGamesList {
    sectionGameIds: string[];
    sectionType: string;
    sortCriteria?: OrderCriteriaContentful | null;
}

export const getGamesListForSection = async (
    client: IClient,
    sectionId: string,
    locale: string,
    siteName: string,
    platform: string,
    envVisibility: string,
    pagination: ISectionGamesPagination = {},
): Promise<ISectionGamesList> => {
    const platformField = `platformVisibility.${locale}.keyword`;
    const environmentField = `environmentVisibility.${locale}.keyword`;
    const getSectionGamesListQuery = {
        _source: ['games', 'game', 'classification', 'type', 'sort'],
        size: SECTION_GAMES_SECTION_RECORDS_LIMIT,
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [
                            { term: { _id: sectionId } },
                            { term: { [platformField]: platform } },
                            { term: { [environmentField]: envVisibility } },
                        ],
                    },
                },
            },
        },
    };

    const hits: ISectionGameOnlyQuery[] = await getHits(
        client,
        getSectionGamesListQuery,
        ALL_SECTIONS_SHARED_READ_ALIAS,
    );

    if (hits.length === 0) {
        logMessage('warn', ErrorCode.MissingSection, { siteName, platform, sectionId, hits });
        throw createError(ErrorCode.MissingSection, 404);
    }
    let sectionType: IMlPersonalizedSection | string = '';

    const sortCriteria = hits[0]?.sort?.[locale];

    const sectionGameIds: string[] = hits.reduce((acc: string[], section: any) => {
        sectionType = section?.type?.[locale];

        const singleSectionGame = section?.game?.[locale] || null;

        if (section?.games?.[locale]) {
            const ids = section?.games?.[locale].map((game: any) => game.sys.id);
            return acc.concat(ids);
        }
        if (singleSectionGame && singleSectionGame?.sys?.id) {
            return acc.concat(singleSectionGame?.sys?.id);
        }
        return acc;
    }, []);

    const paginatedSectionGameIds = sectionGameIds.slice(
        pagination.offset ?? 0,
        pagination.limit ? (pagination.offset ?? 0) + pagination.limit : undefined,
    );

    return { sectionGameIds: paginatedSectionGameIds, sectionType, sortCriteria };
};

export const getGamesSiteGames = async (
    client: IClient,
    sectionGamesListQuery: IOpenSearchQuery,
    siteName: string,
    platform: string,
): Promise<FullApiResponse[]> => {
    const hits: FullApiResponse[] = await getGameHits(
        client,
        sectionGamesListQuery,
        IG_GAMES_V2_READ_ALIAS,
        siteName,
        platform,
    );

    if (hits.length === 0) {
        console.warn(ErrorCode.NoGamesReturned, 404, siteName, platform, {
            sectionGamesListQuery,
            hits,
            internal_message: 'Client received statusCode 204 with empty games array',
        });
        return [];
    }

    return hits;
};
