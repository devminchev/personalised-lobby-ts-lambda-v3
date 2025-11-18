import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    IClient,
    validateGameHits,
    overrideGameLocaleValues,
    ISiteGameInfo,
    IGameInfo,
    GamePlatformConfig,
    FunPanelGame,
    LocalizedField,
    tryGetValueFromLocalised,
    validateLocaleQuery,
    handleSpaceLocalization,
    InnerPartialApiResponseInfo,
    checkRequestParams,
    getVentureId,
    getSiteGameHits,
    createQueryKeysForInfoAndConfig,
    patchVentureName,
    getLambdaExecutionEnvironment,
    coalescePropValue,
    IGameInfoResponse,
    errorResponseHandler,
} from 'os-client';
import { GAMES_INDEX_V2_ALIAS } from 'os-client/lib/constants';
import { extractBynderObject, validators } from 'os-client/lib/utils';

/**
 * GetGameInfoFunction
 * Version: 1.0.1
 * Purpose: Retrieves detailed information for a specific game.
 * Last updated: 2025-04-01-7
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const getGameAndSiteGameByGameName = async (
    client: IClient,
    ventureId: string,
    gameName: string,
    spaceLocale: string,
    platform: string,
    siteName: string,
): Promise<InnerPartialApiResponseInfo> => {
    const environment = `siteGame.environmentVisibility.${spaceLocale}`;
    const { ventureMatchExpression, nameTerm, mobileNameTerm } = createQueryKeysForInfoAndConfig(
        ventureId,
        gameName,
        spaceLocale,
    );
    const platformKey = `siteGame.platformVisibility.${spaceLocale}`;
    const query = {
        size: 100,
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
                                            'siteGame.minBet',
                                            'siteGame.maxBet',
                                            'siteGame.howToPlayContent',
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

    const responses = await getSiteGameHits<{ game: IGameInfo }, { siteGame: ISiteGameInfo }>(
        client,
        query,
        GAMES_INDEX_V2_ALIAS,
        siteName,
        platform,
    );

    const response = validateGameHits(responses, siteName, platform); // 404
    return { game: response.hit.game, siteGame: response.innerHit.siteGame };
};

const createResponseObject = async (
    games: InnerPartialApiResponseInfo,
    userLocale: string,
    defaultLocale: string,
    platform: string,
): Promise<IGameInfoResponse> => {
    const { siteGame, game } = games;

    const minBet: LocalizedField<string> = overrideGameLocaleValues<string>(siteGame.minBet, game.minBet, '-');
    const maxBet: LocalizedField<string> = overrideGameLocaleValues<string>(siteGame.maxBet, game.maxBet, '-');
    const howToPlayContent: LocalizedField<string> = overrideGameLocaleValues<string>(
        siteGame.howToPlayContent,
        game.howToPlayContent,
        '',
    );

    const platformConfig: GamePlatformConfig = game.gamePlatformConfig[defaultLocale];
    const gameType = platformConfig?.gameType?.type;

    const funPanelDefaultCategory: string = tryGetValueFromLocalised(
        userLocale,
        defaultLocale,
        game.funPanelDefaultCategory,
        '',
    );
    const funPanelEnabled: boolean = tryGetValueFromLocalised(userLocale, defaultLocale, game.funPanelEnabled, false);
    const funPanelGame: FunPanelGame | boolean = funPanelDefaultCategory
        ? { defaultCategory: funPanelDefaultCategory }
        : funPanelEnabled;

    const isMobile = platform !== 'web' && platformConfig.mobileOverride;
    const platformDemoUrl = isMobile ? platformConfig.mobileDemoUrl : platformConfig.demoUrl;

    const showNetPosition: boolean = coalescePropValue({
        overrideField: siteGame?.showNetPosition,
        baseField: game?.showNetPosition,
        spaceLocale: defaultLocale,
        defaultFallback: true,
    });

    const animationMedia = tryGetValueFromLocalised(userLocale, defaultLocale, game?.animationMedia, null);
    const loggedOutAnimationMedia = tryGetValueFromLocalised(
        userLocale,
        defaultLocale,
        game?.loggedOutAnimationMedia,
        null,
    );
    const foregroundLogoMedia = tryGetValueFromLocalised(userLocale, defaultLocale, game?.foregroundLogoMedia, null);
    const loggedOutForegroundLogoMedia = tryGetValueFromLocalised(
        userLocale,
        defaultLocale,
        game?.loggedOutForegroundLogoMedia,
        null,
    );
    const backgroundMedia = tryGetValueFromLocalised(userLocale, defaultLocale, game?.backgroundMedia, null);
    const loggedOutBackgroundMedia = tryGetValueFromLocalised(
        userLocale,
        defaultLocale,
        game?.loggedOutBackgroundMedia,
        null,
    );

    const foregroundLogoMediaObj = extractBynderObject(foregroundLogoMedia);
    const loggedOutForegroundLogoMediaObj = extractBynderObject(loggedOutForegroundLogoMedia);
    const backgroundMediaObj = extractBynderObject(backgroundMedia);
    const loggedOutBackgroundMediaObj = extractBynderObject(loggedOutBackgroundMedia);
    const backgroundImage = tryGetValueFromLocalised(userLocale, defaultLocale, game.funPanelBackgroundImage, '');
    const liveHidden = siteGame.liveHidden?.[defaultLocale];

    const gameInfo: IGameInfoResponse = {
        entryId: siteGame.id,
        ...(platformDemoUrl && { demoUrl: platformDemoUrl }),
        gameSkin: (isMobile ? platformConfig.mobileGameSkin : platformConfig.gameSkin) || '',
        ...(gameType && { gameType }),
        howToPlayContent: tryGetValueFromLocalised(userLocale, defaultLocale, howToPlayContent, ''),
        infoDetails: tryGetValueFromLocalised(userLocale, defaultLocale, game.infoDetails, ''),
        infoImgUrlPattern: tryGetValueFromLocalised(userLocale, defaultLocale, game.infoImgUrlPattern, ''),
        introductionContent: tryGetValueFromLocalised(userLocale, defaultLocale, game.introductionContent, ''),
        maxBet: tryGetValueFromLocalised(userLocale, defaultLocale, maxBet, ''),
        minBet: tryGetValueFromLocalised(userLocale, defaultLocale, minBet, ''),
        name: (isMobile ? platformConfig.mobileName : platformConfig.name) || '',
        realUrl: (isMobile ? platformConfig.mobileRealUrl : platformConfig.realUrl) || '',
        representativeColor: tryGetValueFromLocalised(userLocale, defaultLocale, game.representativeColor, ''),
        title: tryGetValueFromLocalised(userLocale, defaultLocale, game.title, ''),
        ...(backgroundImage && { backgroundImage }),
        ...(animationMedia && { animationMedia }),
        ...(loggedOutAnimationMedia && { loggedOutAnimationMedia }),
        ...(foregroundLogoMediaObj && { foregroundLogoMedia: foregroundLogoMediaObj }),
        ...(loggedOutForegroundLogoMediaObj && {
            loggedOutForegroundLogoMedia: loggedOutForegroundLogoMediaObj,
        }),
        ...(backgroundMediaObj && { backgroundMedia: backgroundMediaObj }),
        ...(loggedOutBackgroundMediaObj && { loggedOutBackgroundMedia: loggedOutBackgroundMediaObj }),
        funPanelGame: funPanelGame,
        showNetPosition,
        ...(liveHidden && { liveHidden }),
    };

    return gameInfo;
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

        checkRequestParams([siteNameFromParams, validators.siteName], [platform, validators.platform], gameName);

        const spaceLocale = handleSpaceLocalization();
        const ventureId = await getVentureId(client, siteName, spaceLocale, platform);

        const models: InnerPartialApiResponseInfo = await getGameAndSiteGameByGameName(
            client,
            ventureId,
            gameName,
            spaceLocale,
            platform,
            siteName,
        ); // 404

        const responseObject: IGameInfoResponse = await createResponseObject(models, userLocale, spaceLocale, platform);

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
