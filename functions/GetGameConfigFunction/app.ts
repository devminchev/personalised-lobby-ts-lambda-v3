import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    IClient,
    validateGameHits,
    overrideGameLocaleValues,
    GamePlatformConfig,
    LocalizedField,
    tryGetValueFromLocalised,
    validateLocaleQuery,
    handleSpaceLocalization,
    checkRequestParams,
    getVentureId,
    getSiteGameHits,
    createQueryKeysForInfoAndConfig,
    patchVentureName,
    getLambdaExecutionEnvironment,
    IGameConfig,
    ISiteGameConfig,
    InnerPartialApiResponseConfig,
    IGameConfigResponse,
    coalescePropValue,
    GAMES_INDEX_V2_ALIAS,
    validators,
    errorResponseHandler,
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
export const getGameAndSiteGameByGameName = async (
    client: IClient,
    ventureId: string,
    gameName: string,
    spaceLocale: string,
    platform: string,
    siteName: string,
): Promise<InnerPartialApiResponseConfig> => {
    const environment = `siteGame.environmentVisibility.${spaceLocale}`;
    const platformKey = `siteGame.platformVisibility.${spaceLocale}`;
    const { ventureMatchExpression, nameTerm, mobileNameTerm } = createQueryKeysForInfoAndConfig(
        ventureId,
        gameName,
        spaceLocale,
    );
    const query = {
        size: 100,
        _source: [
            'game.funPanelEnabled',
            'game.vendor',
            'game.minBet',
            'game.maxBet',
            'game.id',
            'game.gamePlatformConfig',
            'game.showNetPosition',
            'game.launchCode',
        ],
        query: {
            constant_score: {
                filter: {
                    bool: {
                        should: [
                            {
                                has_child: {
                                    type: 'sitegame',
                                    query: {
                                        bool: {
                                            must: [ventureMatchExpression],
                                            filter: [
                                                {
                                                    term: {
                                                        [environment]: getLambdaExecutionEnvironment(),
                                                    },
                                                },
                                                {
                                                    term: {
                                                        [platformKey]: platform,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                    inner_hits: {
                                        _source: [
                                            'siteGame.id',
                                            'siteGame.chat',
                                            'siteGame.minBet',
                                            'siteGame.maxBet',
                                            'siteGame.headlessJackpot',
                                            'siteGame.showNetPosition',
                                            'siteGame.liveHidden',
                                        ],
                                    },
                                },
                            },
                            {
                                bool: {
                                    should: [nameTerm, mobileNameTerm],
                                    minimum_should_match: 1,
                                },
                            },
                        ],
                        minimum_should_match: 2,
                    },
                },
            },
        },
    };

    const responses = await getSiteGameHits<{ game: IGameConfig }, { siteGame: ISiteGameConfig }>(
        client,
        query,
        GAMES_INDEX_V2_ALIAS,
        siteName,
        platform,
    );
    const response = validateGameHits(responses, siteName, platform);

    return { game: response.hit.game, siteGame: response.innerHit.siteGame };
};

const createResponseObject = async (
    games: InnerPartialApiResponseConfig,
    userLocale: string,
    defaultLocale: string,
    platform: string,
): Promise<IGameConfigResponse> => {
    const { siteGame, game } = games;

    const minBet: LocalizedField<string> = overrideGameLocaleValues<string>(siteGame.minBet, game.minBet, '-');
    const maxBet: LocalizedField<string> = overrideGameLocaleValues<string>(siteGame.maxBet, game.maxBet, '-');
    const showNetPosition: boolean = coalescePropValue({
        overrideField: siteGame?.showNetPosition,
        baseField: game?.showNetPosition,
        spaceLocale: defaultLocale,
        defaultFallback: true,
    });

    const headlessJackpot = siteGame?.headlessJackpot?.[defaultLocale];

    const platformConfig: GamePlatformConfig = game?.gamePlatformConfig[defaultLocale];
    const chatData =
        (siteGame?.chat &&
            tryGetValueFromLocalised(userLocale, defaultLocale, siteGame.chat, {
                isEnabled: false,
                controlMobileChat: false,
            })) ||
        null;

    const isMobile = platform !== 'web' && platformConfig.mobileOverride;
    const liveHidden = siteGame.liveHidden?.[defaultLocale];

    const gameObject: IGameConfigResponse = {
        entryId: siteGame.id,
        ...(chatData && { chat: chatData }),
        funPanelEnabled: game.funPanelEnabled?.[defaultLocale],
        minBet: tryGetValueFromLocalised(userLocale, defaultLocale, minBet, ''),
        vendor: game.vendor?.[defaultLocale],
        maxBet: tryGetValueFromLocalised(userLocale, defaultLocale, maxBet, ''),
        showNetPosition,
        mobileOverride: platformConfig.mobileOverride,
        ...(headlessJackpot && { headlessJackpot: headlessJackpot }),
        ...(game?.launchCode?.[defaultLocale] && { launchCode: game?.launchCode?.[defaultLocale] }),
        gameSkin: isMobile ? platformConfig.mobileGameSkin : platformConfig.gameSkin,
        gameName: isMobile ? platformConfig.mobileName : platformConfig.name,
        demoUrl: isMobile ? platformConfig.mobileDemoUrl : platformConfig.demoUrl,
        realUrl: isMobile ? platformConfig.mobileRealUrl : platformConfig.realUrl,
        gameLoaderFileName: isMobile ? platformConfig.mobileGameLoaderFileName : platformConfig.gameLoaderFileName,
        mobileName: platformConfig.mobileName,
        mobileGameSkin: platformConfig.mobileGameSkin,
        mobileRealUrl: platformConfig.mobileRealUrl,
        mobileDemoUrl: platformConfig.mobileDemoUrl,
        mobileGameLoaderFileName: platformConfig.mobileGameLoaderFileName,
        gameStudio: platformConfig.gameStudio,
        gameProvider: platformConfig.gameProvider,
        gameType: platformConfig.gameType,
        ...(liveHidden && { liveHidden }),
    };
    return gameObject;
};

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const eventReqId = event?.requestContext?.requestId;

    //path param
    const siteNameFromParams = event.pathParameters?.sitename as string;
    const siteName = patchVentureName(siteNameFromParams);
    const platform = event.pathParameters?.platform as string;
    const gameName = event.pathParameters?.gamename as string;

    //query param
    const userLocale: string = validateLocaleQuery(event.queryStringParameters?.locale);

    try {
        const client = getClient();

        checkRequestParams([siteName, validators.siteName], [platform, validators.platform], gameName);

        const spaceLocale = handleSpaceLocalization();
        const ventureId = await getVentureId(client, siteName, spaceLocale, platform);
        const models: InnerPartialApiResponseConfig = await getGameAndSiteGameByGameName(
            client,
            ventureId,
            gameName,
            spaceLocale,
            platform,
            siteName,
        );
        const responseObject: IGameConfigResponse = await createResponseObject(
            models,
            userLocale,
            spaceLocale,
            platform,
        );

        return {
            statusCode: 200,
            body: JSON.stringify(responseObject),
        };
    } catch (err) {
        const errorLogParams = {
            eventReqId,
            siteName,
            platform,
            gameName,
            userLocale,
        };
        return errorResponseHandler(err, {}, errorLogParams);
    }
};
