import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    IClient,
    getGameHits,
    ErrorCode,
    logError,
    validateLocaleQuery,
    tryGetValueFromLocalised,
    handleSpaceLocalization,
    checkRequestParams,
    getVentureId,
    patchVentureName,
    getLambdaExecutionEnvironment,
    GAMES_V2_INDEX_ALIAS,
    ARCHIVED_GAMES_READ_ALIAS,
} from 'os-client';
import { FullApiResponse } from 'os-client/lib/sharedInterfaces/interfaces.js';

/**
 * GetHistoricalGameTitlesFunction
 * Version: 1.0.1
 * Purpose: Retrieves historical game title data for analysis and display.
 * Last updated: 2025-04-01-7
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
export interface HistoricGameTitleResponse {
    gameSkin: string;
    title: string;
}

// Opensearch query
const getGameAndSiteGame = async (
    client: IClient,
    ventureId: string,
    spaceLocale: string,
    indexName: string,
    siteName: string,
    platform: string,
): Promise<FullApiResponse[]> => {
    const MAX_GAME_TITLES = 10000;
    const ventureKey = `siteGame.venture.${spaceLocale}.sys.id`;
    const environmentVisibility = `siteGame.environmentVisibility.${spaceLocale}`;
    const query = {
        size: MAX_GAME_TITLES,
        _source: ['siteGame.id'],
        query: {
            bool: {
                must: [
                    {
                        has_parent: {
                            parent_type: 'game',
                            query: {
                                match_all: {},
                            },
                            inner_hits: {
                                size: 1,
                                _source: [
                                    `game.gamePlatformConfig.${spaceLocale}.gameSkin`,
                                    'game.title',
                                    `game.gamePlatformConfig.${spaceLocale}.name`,
                                ],
                            },
                        },
                    },
                    {
                        match: {
                            [ventureKey]: ventureId,
                        },
                    },
                ],
                filter: [
                    {
                        term: {
                            [environmentVisibility]: getLambdaExecutionEnvironment(),
                        },
                    },
                ],
            },
        },
    };

    const hits: FullApiResponse[] = await getGameHits(client, query, indexName, siteName, platform);

    return hits;
};

interface OldGamesInner {
    venture_id: string;
    games: HistoricGameTitleResponse[];
}

interface OldHistoricGameTitleHit {
    oldGamesInner: OldGamesInner;
}

const getOldGameHits = async <T extends OldGamesInner>(client: IClient, query: object, index: string): Promise<T[]> => {
    const response = await client.searchWithHandling<OldHistoricGameTitleHit, T>(query, index);
    return response.hits.hits.map((hit) => hit._source.oldGamesInner as T);
};

const getOldGames = async (
    client: IClient,
    ventureId: string,
    indexName: string,
): Promise<HistoricGameTitleResponse[]> => {
    const query = {
        query: {
            match: {
                'oldGamesInner.venture_id': ventureId,
            },
        },
    };
    const result: OldGamesInner[] = await getOldGameHits(client, query, indexName);
    return result.map((item) => item.games).flat();
};

const createResponseObject = (
    gameHits: FullApiResponse[],
    localeOverride: string,
    spaceLocale: string,
): HistoricGameTitleResponse[] => {
    const gamePayload = gameHits.map((item: FullApiResponse) => {
        const gameData = item.innerHit?.game;
        const gameSkin = gameData?.gamePlatformConfig?.[spaceLocale]?.gameSkin || '';
        const localizedGameTitle = tryGetValueFromLocalised(localeOverride, spaceLocale, gameData?.title, '');
        return {
            gameSkin: gameSkin,
            title: localizedGameTitle,
        };
    });

    return gamePayload;
};

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const client = getClient();

    //path param
    const siteNameFromParams = event.pathParameters?.sitename as string;
    const siteName = patchVentureName(siteNameFromParams);

    //query param
    const userLocale: string = validateLocaleQuery(event.queryStringParameters?.locale);

    try {
        const spaceLocale = handleSpaceLocalization();

        checkRequestParams(siteName);

        // no platform in this lambda
        const ventureId = await getVentureId(client, siteName, spaceLocale, '');

        const games: FullApiResponse[] = await getGameAndSiteGame(
            client,
            ventureId,
            spaceLocale,
            GAMES_V2_INDEX_ALIAS,
            siteName,
            '',
        );
        const archivedGames: FullApiResponse[] = await getGameAndSiteGame(
            client,
            ventureId,
            spaceLocale,
            ARCHIVED_GAMES_READ_ALIAS,
            siteName,
            '',
        );

        const gameTitlesResp = createResponseObject(games, userLocale, spaceLocale);
        const archivedGameTitlesResp = createResponseObject(archivedGames, userLocale, spaceLocale);

        // Create a hashmap to deduplicate games, giving preference to games over archivedGames
        const gameMap = new Map<string, HistoricGameTitleResponse>();

        // First add archived games to the map
        archivedGameTitlesResp.forEach((game) => {
            if (game.gameSkin) {
                gameMap.set(game.gameSkin, game);
            }
        });

        // Then add current games, which will overwrite any duplicates from archived games
        gameTitlesResp.forEach((game) => {
            if (game.gameSkin) {
                gameMap.set(game.gameSkin, game);
            }
        });

        const oldGameTitlesResp: HistoricGameTitleResponse[] = await getOldGames(
            client,
            ventureId,
            ARCHIVED_GAMES_READ_ALIAS,
        );

        // Add old games to the map if they don't already exist
        oldGameTitlesResp.forEach((oldGame) => {
            if (oldGame.gameSkin && !gameMap.has(oldGame.gameSkin)) {
                gameMap.set(oldGame.gameSkin, oldGame);
            }
        });
        const allGameTitlesResp = Array.from(gameMap.values());

        return {
            statusCode: 200,
            body: JSON.stringify(allGameTitlesResp),
        };
    } catch (err) {
        const errorCode = (err as any).code;
        const statusCode = (err as any).statusCode || 500;
        const errorMessage = (err as Error).message;
        logError(ErrorCode.ExecutionError, statusCode, { siteName, userLocale, err });

        return {
            statusCode: statusCode,
            body: JSON.stringify({
                code: errorCode,
                message: errorMessage,
            }),
        };
    }
};
