import {
    IClient,
    ISectionGame,
    createGamesQuery,
    orderedPayload,
    logMessage,
    LogCode,
    gamesPayloadBySiteGame,
    getGameHits,
    IOpenSearchQuery,
    FullApiResponse,
    ErrorCode,
    getHits,
    logError,
    createError,
    SUGGESTED_GAMES_DEFAULTS_INDEX_ALIAS,
    IG_GAMES_V2_READ_ALIAS,
} from 'os-client';

const SUGGESTED_GAMES_DEFAULTS_QUERY_SIZE = 10;

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

export const handleMissingMLRecommendations = async (
    client: IClient,
    locale: string,
    spaceLocale: string,
    platform: string,
    ventureId: string | undefined,
    siteName: string,
): Promise<ISectionGame[]> => {
    logMessage('log', LogCode.NoMLRecordDefaulting, { siteName, platform });

    // Check if ventureId is provided, if not, log an error and return an empty array as a fallback
    if (!ventureId) {
        logError(
            ErrorCode.MissingVenture,
            404,
            { siteName, platform, ventureId },
            'Missing ventureId in handleMissingMLSuggestedGames, returning empty response to the client',
        );
        return [];
    }

    const siteGameIds = await getSuggestedGames(client, ventureId, spaceLocale, siteName, platform);
    const sectionGamesListQuery = createGamesQuery(siteGameIds, spaceLocale, platform);

    const sectionGames = await getGamesSiteGames(client, sectionGamesListQuery, siteName, platform);
    const sectionGamesPayload = gamesPayloadBySiteGame(sectionGames, spaceLocale, locale, false, platform);

    return orderedPayload<ISectionGame>(sectionGamesPayload, siteGameIds);
};
