import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    IClient,
    GamePlatformConfig,
    handleSpaceLocalization,
    checkRequestParams,
    validators,
    IGameConfig,
    IG_GAMES_V2_READ_ALIAS,
    errorResponseHandler,
    gzipResponse,
    getHits,
    IGameSkinConfigResponse,
    validateGameHits,
} from 'os-client';

/**
 * GetGameConfigFunction
 * Version: 1.0.1
 * Purpose: Retrieves game configuration settings and parameters.
 * Last updated: 2025-04-01-7
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 */

export const getGameByGameSkin = async (client: IClient, gameSkin: string): Promise<{ game: IGameConfig }> => {
    const query = {
        size: 2, // gameskins should be unique but increased size to 2 for possible edge cases with mutliple of the same gameskin
        _source: [`game.gamePlatformConfig.gameType.type`, `game.gameName`, `game.gameSkin`],
        query: {
            constant_score: {
                filter: {
                    term: {
                        [`game.gameSkin`]: gameSkin,
                    },
                },
            },
        },
    };

    const response = await getHits<{ game: IGameConfig }>(client, query, IG_GAMES_V2_READ_ALIAS);

    validateGameHits(response);

    return response[0];
};

const createResponseObject = async (gameData: { game: IGameConfig }): Promise<IGameSkinConfigResponse> => {
    const platformConfig: GamePlatformConfig = gameData.game?.gamePlatformConfig;

    return {
        gameName: gameData.game.gameName,
        gameType: platformConfig.gameType.type,
    };
};

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const eventReqId = event?.requestContext?.requestId;
    //path param
    const siteName = event?.pathParameters?.sitename as string;
    const gameSkin = event.pathParameters?.gameskin as string;

    try {
        checkRequestParams([siteName, validators.allSiteName]);

        const client = getClient();
        checkRequestParams(gameSkin);

        const models = await getGameByGameSkin(client, gameSkin);

        const responseObject: IGameSkinConfigResponse = await createResponseObject(models);

        return gzipResponse(responseObject);
    } catch (err) {
        const errorLogParams = {
            eventReqId,
            gameSkin,
        };
        return errorResponseHandler(err, {}, errorLogParams);
    }
};
