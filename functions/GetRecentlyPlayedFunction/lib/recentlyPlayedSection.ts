import {
    IClient,
    logMessage,
    getGameHits,
    IOpenSearchQuery,
    FullApiResponse,
    ErrorCode,
    getHits,
    createError,
    SUGGESTED_GAMES_DEFAULTS_INDEX_ALIAS,
    IG_GAMES_V2_READ_ALIAS,
    ML_SECTIONS_READ_ALIAS,
    LocalizedField,
    OrderCriteriaContentful,
    ORDER_CRITERIA_TO_FIELD,
} from 'os-client';

const SUGGESTED_GAMES_DEFAULTS_QUERY_SIZE = 10;
const SIMILARITY_CONTENT_TYPE = 'igSimilarityBasedPersonalisedSection';
const DEFAULT_ORDER_CRITERIA: OrderCriteriaContentful = 'margin';

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
        console.warn(ErrorCode.NoGamesReturned, 404, {
            sectionGamesListQuery,
            hits,
            internal_message: 'Client received statusCode 200 with empty games array',
        });
        return [];
    }

    return hits;
};

export const getSuggestedGames = async (
    client: IClient,
    ventureId: string,
    spaceLocale: string,
    siteName: string,
    platform: string,
): Promise<string[]> => {
    const ventureKey = `venture.${spaceLocale}.sys.id`;
    const suggestedGameQuery = {
        _source: ['games'],
        query: {
            constant_score: {
                filter: {
                    match: { [ventureKey]: ventureId },
                },
            },
        },
        size: SUGGESTED_GAMES_DEFAULTS_QUERY_SIZE,
    };

    const hits: any[] = await getHits(client, suggestedGameQuery, SUGGESTED_GAMES_DEFAULTS_INDEX_ALIAS);

    if (hits.length === 0) {
        logMessage('warn', ErrorCode.MissingSection, { siteName, platform, hits });
        throw createError(ErrorCode.MissingSection, 404);
    }

    const suggestedGamesIds = hits.flatMap(
        (item: any) => item?.games?.[spaceLocale]?.map((game: { sys: { id: string } }) => game.sys.id) || [],
    );

    return suggestedGamesIds;
};

export interface IRPSectionParams {
    client: IClient;
    ventureId: string;
    platform: string;
    spaceLocale: string;
    envVisibility: string;
    sectionType: string;
}

export interface ISimilaritySection {
    id: string;
    type: LocalizedField<string>;
    sort: LocalizedField<string>;
}

export const getRpOrderCriteria = async ({
    client,
    ventureId,
    platform,
    spaceLocale,
    envVisibility,
    sectionType,
}: IRPSectionParams) => {
    const osQuery = buildQuery({
        ventureId,
        platform,
        spaceLocale,
        envVisibility,
        sectionType,
        contentType: SIMILARITY_CONTENT_TYPE,
    });

    const section: ISimilaritySection[] = (await getHits(client, osQuery, ML_SECTIONS_READ_ALIAS)) || [];

    const orderCriteria: OrderCriteriaContentful =
        (section?.[0]?.sort?.[spaceLocale] as OrderCriteriaContentful) || DEFAULT_ORDER_CRITERIA;

    return ORDER_CRITERIA_TO_FIELD[orderCriteria];
};

export type BuildRPQueryParams = Omit<IRPSectionParams, 'client'> & { contentType: string };

const buildQuery = ({
    ventureId,
    platform,
    spaceLocale,
    envVisibility,
    sectionType,
    contentType,
}: BuildRPQueryParams) => {
    const platformField = `platformVisibility.${spaceLocale}.keyword`;
    const environmentField = `environmentVisibility.${spaceLocale}.keyword`;
    const typeField = `type.${spaceLocale}.keyword`;
    const contentTypeField = `contentType.keyword`;
    const ventureField = `venture.${spaceLocale}.sys.id.keyword`;
    return {
        track_total_hits: false,
        _source: ['id', 'sort', 'type', 'sessionVisibility'],
        size: 1,
        query: {
            bool: {
                filter: [
                    { term: { [platformField]: platform } },
                    { term: { [environmentField]: envVisibility } },
                    { term: { [typeField]: sectionType } },
                    { term: { [ventureField]: ventureId } },
                    { term: { [contentTypeField]: contentType } },
                ],
            },
        },
    };
};
