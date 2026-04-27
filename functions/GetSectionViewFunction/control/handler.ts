import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    IClient,
    getHits,
    getGameHits,
    ErrorCode,
    logError,
    validateLocaleQuery,
    tryGetValueFromLocalised,
    handleSpaceLocalization,
    checkRequestParams,
    getVentureId,
    IG_GAMES_V2_READ,
    FullApiResponse,
    createError,
    IMlPersonalizedSection,
    handlePersonalizedGames,
    ISectionGame,
    getLambdaExecutionEnvironment,
    orderedPayload,
    patchVentureName,
    logMessage,
    errorResponseHandler,
    EmptySectionViewResponse,
    gzipResponse,
    extractBynderObject,
    sanitiseBynderAssets,
    IBynderAssets,
    getPreferredOrFallbackLocalised,
} from 'os-client';
import {
    ALL_SECTIONS_SHARED_READ_ALIAS,
    GAME_SECTION_CLASSIFICATION,
    JACKPOT_SECTION_CLASSIFICATION,
    PERSONALISED_SECTION_CLASSIFICATION,
    SECTION_GAMES_SECTION_RECORDS_LIMIT,
    SECTION_VIEW_SIZE,
} from 'os-client/lib/constants';
import { checkIsClassificationPersonalised } from 'os-client/lib/personalisation/common/helpers';
import { handleMissingMLRecommendations } from 'os-client/lib/personalisation/common/personalisation';
import { GamePlatformConfig, IIGSectionView } from 'os-client/lib/sharedInterfaces/interfaces';
import { resolveGameProp, validators } from 'os-client/lib/utils';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 * Controlled version for AB Testing: Using the original v3 implementation
 */
//TODO: make platfrom and session backwords compatible
interface ISectionViewResponse {
    classification: string;
    title: string;
    layoutType: string;
    games?: ISectionGame[];
}

export interface ISectionGamesList {
    sectionView: IIGSectionView[];
    sectionType: string;
    sectionGameIds: string[];
}

interface JackpotSectionResponse extends ISectionViewResponse {
    headerImage?: string | null;
    type?: string | null;
    backgroundImage?: string | null;
    pot1Image?: string | null;
    pot2Image?: string | null;
    pot3Image?: string | null;
    pot4Image?: string | null;
    pot1ImageBynder?: IBynderAssets | null;
    pot2ImageBynder?: IBynderAssets | null;
    pot3ImageBynder?: IBynderAssets | null;
    pot4ImageBynder?: IBynderAssets | null;
    headerImageBynder?: IBynderAssets | null;
    backgroundImageBynder?: IBynderAssets | null;
    headlessJackpot?: object;
    jackpotType?: string;
    expandedSectionLayoutType: string;
}

const getIgSectionView = async (
    client: IClient,
    ventureId: string,
    platform: string,
    auth: boolean,
    sectionSlug: string,
    spaceLocale: string,
    siteName: string,
): Promise<ISectionGamesList> => {
    const slug = `slug.${spaceLocale}.keyword`;
    const ventureKey = `venture.${spaceLocale}.sys.id`;
    const platformVisibilityKey = `platformVisibility.${spaceLocale}.keyword`;
    const sessionVisibilityKey = `sessionVisibility.${spaceLocale}.keyword`;
    const sessionVisibility = auth ? 'loggedIn' : 'loggedOut';
    const environmentKey = `environmentVisibility.${spaceLocale}.keyword`;

    const getISectionViewQuery = {
        size: SECTION_VIEW_SIZE,
        _source: [
            'classification',
            'title',
            'layoutType',
            'games',
            'headerImage',
            'headerImageBynder',
            'type',
            'backgroundImage',
            'backgroundImageBynder',
            'pot1Image',
            'pot1ImageBynder',
            'pot2Image',
            'pot2ImageBynder',
            'pot3Image',
            'pot3ImageBynder',
            'pot4Image',
            'pot4ImageBynder',
            'headlessJackpot',
            'expandedSectionLayoutType',
            'jackpotType',
        ],
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [
                            {
                                match: {
                                    [ventureKey]: ventureId,
                                },
                            },
                        ],
                        filter: [
                            {
                                term: {
                                    [slug]: sectionSlug,
                                },
                            },
                            {
                                term: {
                                    [platformVisibilityKey]: platform,
                                },
                            },
                            {
                                term: {
                                    [sessionVisibilityKey]: sessionVisibility,
                                },
                            },
                            {
                                term: {
                                    [environmentKey]: getLambdaExecutionEnvironment(),
                                },
                            },
                        ],
                    },
                },
            },
        },
    };
    const sectionView: IIGSectionView[] = await getHits(client, getISectionViewQuery, ALL_SECTIONS_SHARED_READ_ALIAS);
    const sectionViewHits: ISectionGamesList[] = await getHits(
        client,
        getISectionViewQuery,
        ALL_SECTIONS_SHARED_READ_ALIAS,
    );

    if (!sectionViewHits.length) {
        logMessage('warn', ErrorCode.MissingIgGameSection, { siteName, platform, auth, sectionSlug, sectionViewHits });
        throw createError(ErrorCode.MissingIgGameSection, 404);
    }

    let sectionType: IMlPersonalizedSection | string = '';
    let sectionEntryTitle = '';

    const sectionGameIds: string[] = sectionViewHits.reduce((acc: string[], section: any) => {
        sectionType = section?.type?.[spaceLocale];
        sectionEntryTitle = section?.entryTitle?.[spaceLocale] || '';

        if (section?.games?.[spaceLocale]) {
            const ids = section.games[spaceLocale].map((game: any) => game.sys.id);
            return acc.concat(ids);
        }
        return acc;
    }, []);

    return { sectionView, sectionType, sectionGameIds };
};

const getSectionViewGames = async (
    client: IClient,
    ventureId: string,
    sectionViewIds: string[],
    spaceLocale: string,
    platform: string,
    siteName: string,
): Promise<FullApiResponse[]> => {
    const getGamesFromISectionViewQuery = {
        size: SECTION_GAMES_SECTION_RECORDS_LIMIT,
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [
                            {
                                has_parent: {
                                    parent_type: 'game',
                                    query: {
                                        match_all: {},
                                    },
                                    inner_hits: {
                                        _source: [
                                            `game.title`,
                                            `game.progressiveJackpot`,
                                            `game.imgUrlPattern`,
                                            `game.bynderDFGWeeklyImage`,
                                            `game.loggedOutImgUrlPattern`,
                                            `game.progressiveBackgroundColor`,
                                            `game.representativeColor`,
                                            `game.videoUrlPattern`,
                                            `game.tags`,
                                            `game.webComponentData`,
                                            'game.animationMedia',
                                            'game.loggedOutAnimationMedia',
                                            'game.foregroundLogoMedia',
                                            'game.loggedOutForegroundLogoMedia',
                                            'game.backgroundMedia',
                                            'game.loggedOutBackgroundMedia',
                                            'game.gameName',
                                            'game.gameSkin',
                                            `game.gamePlatformConfig.demoUrl`,
                                            `game.gamePlatformConfig.realUrl`,
                                        ],
                                    },
                                },
                            },
                            {
                                terms: {
                                    _id: sectionViewIds,
                                },
                            },
                        ],
                    },
                },
            },
        },
    };
    const gameHits: FullApiResponse[] = await getGameHits(
        client,
        getGamesFromISectionViewQuery,
        IG_GAMES_V2_READ,
        ventureId,
        platform,
    );

    if (!gameHits.length) {
        logMessage('warn', ErrorCode.MissingSectionGames, { siteName, platform, gameHits, sectionViewIds });
        throw createError(ErrorCode.MissingSectionGames, 404);
    }

    return gameHits;
};

export const mapSectionGames = (
    sectionGames: FullApiResponse[],
    locale: string,
    spaceLocale: string,
    showOnlyLoggedIn: boolean,
): ISectionGame[] => {
    return sectionGames.map((sectionGame) => {
        const game = sectionGame?.innerHit?.game;
        const siteGame = sectionGame?.hit?.siteGame;
        const gamePlatformConfig = game.gamePlatformConfig || {};
        const liveHidden = siteGame?.liveHidden?.[spaceLocale];

        // This is temporary and will be removed later.
        const legacyPlatformObject = gamePlatformConfig as GamePlatformConfig & Record<string, unknown>;
        const fallbackGameName = (legacyPlatformObject?.[spaceLocale] as GamePlatformConfig)?.name;
        const fallbackGameSkin = (legacyPlatformObject?.[spaceLocale] as GamePlatformConfig)?.gameSkin;

        //--- game model ---/
        const title = tryGetValueFromLocalised(locale, spaceLocale, game.title, '');
        const bynderDFGWeeklyImage = tryGetValueFromLocalised(locale, spaceLocale, game.bynderDFGWeeklyImage, null);
        const dfgWeeklyImgUrlPattern = game.dfgWeeklyImgUrlPattern?.[spaceLocale];
        const imgUrlPattern = tryGetValueFromLocalised(locale, spaceLocale, game.imgUrlPattern, '');
        const loggedOutImgUrlPattern = tryGetValueFromLocalised(locale, spaceLocale, game.loggedOutImgUrlPattern, '');
        const progressiveBackgroundColor = resolveGameProp(game.progressiveBackgroundColor, spaceLocale, undefined);
        const representativeColor = tryGetValueFromLocalised(locale, spaceLocale, game.representativeColor, '');
        const videoUrlPattern = game.videoUrlPattern?.[spaceLocale];
        const tags = game.tags;
        const webComponentData = resolveGameProp(game.webComponentData, spaceLocale, undefined);
        const headlessJackpot = game.headlessJackpot;
        const isProgressiveJackpot = resolveGameProp(game.progressiveJackpot, spaceLocale, false);

        //--- game config ---/
        const demoUrl = gamePlatformConfig.demoUrl;
        const name = game.gameName || fallbackGameName;
        const gameSkin = game.gameSkin || fallbackGameSkin;
        const realUrl = gamePlatformConfig.realUrl;

        //--- site game model ---/
        const sash = siteGame.sash?.[spaceLocale];
        const entryId = siteGame.id;
        const gameId = siteGame.gameId;

        const animationMedia = showOnlyLoggedIn
            ? tryGetValueFromLocalised(locale, spaceLocale, game?.animationMedia, null)
            : tryGetValueFromLocalised(locale, spaceLocale, game?.loggedOutAnimationMedia, null);

        const foregroundLogoMedia = getPreferredOrFallbackLocalised(
            locale,
            spaceLocale,
            showOnlyLoggedIn,
            game?.foregroundLogoMedia,
            game?.loggedOutForegroundLogoMedia,
        );

        const backgroundMedia = getPreferredOrFallbackLocalised(
            locale,
            spaceLocale,
            showOnlyLoggedIn,
            game?.backgroundMedia,
            game?.loggedOutBackgroundMedia,
        );

        const foregroundLogoMediaObj = extractBynderObject(foregroundLogoMedia);
        const backgroundMediaObj = extractBynderObject(backgroundMedia);

        const bynderDFGWeeklyImageObj = extractBynderObject(bynderDFGWeeklyImage);

        return {
            name: name,
            gameSkin: gameSkin,
            entryId: entryId,
            title: title,
            gameId: gameId,
            isProgressiveJackpot: isProgressiveJackpot,
            realUrl: realUrl,
            ...(demoUrl && { demoUrl: demoUrl }),
            ...(dfgWeeklyImgUrlPattern && { dfgWeeklyImgUrlPattern: dfgWeeklyImgUrlPattern }),
            ...(bynderDFGWeeklyImageObj && { bynderDFGWeeklyImageObj: bynderDFGWeeklyImageObj }),
            ...(imgUrlPattern && { imgUrlPattern: imgUrlPattern }),
            ...(loggedOutImgUrlPattern && { loggedOutImgUrlPattern: loggedOutImgUrlPattern }),
            ...(progressiveBackgroundColor && { progressiveBackgroundColor: progressiveBackgroundColor }),
            ...(representativeColor && { representativeColor: representativeColor }),
            ...(videoUrlPattern && { videoUrlPattern: videoUrlPattern }),
            ...(tags && { tags: tags }),
            ...(sash && { sash: sash }),
            ...(animationMedia && { animationMedia }),
            ...(foregroundLogoMediaObj && { foregroundLogoMedia: foregroundLogoMediaObj }),
            ...(backgroundMediaObj && { backgroundMedia: backgroundMediaObj }),
            ...(webComponentData && { webComponentData }),
            ...(headlessJackpot && { headlessJackpot }),
            ...(liveHidden && { liveHidden }),
        };
    });
};

const createResponseObject = (
    locale: string,
    spaceLocale: string,
    sectionView: IIGSectionView[],
    sectionGames: ISectionGame[],
    platform: string,
    siteName: string,
): ISectionViewResponse | JackpotSectionResponse => {
    const section = sectionView[0]; // should only have 1 sectionView

    //--- Base Properties ---//
    const classification = section?.classification?.[spaceLocale];
    const title = tryGetValueFromLocalised(locale, spaceLocale, section.title, '');
    const layoutType = section.expandedSectionLayoutType?.[spaceLocale];

    //--- Jackpot Properties ---//
    const headerImage = section.headerImage?.[spaceLocale];
    const bynderHeaderImageAsset = section?.headerImageBynder?.[spaceLocale] || null;
    const bynderHeaderImage = sanitiseBynderAssets(bynderHeaderImageAsset);

    const backgroundImage = section.backgroundImage?.[spaceLocale];
    const bynderBackgroundImageAsset = section?.backgroundImageBynder?.[spaceLocale] || null;
    const bynderBackgroundImage = sanitiseBynderAssets(bynderBackgroundImageAsset);

    const type = section.jackpotType?.[spaceLocale];
    const pot1Image = section.pot1Image?.[spaceLocale];
    const pot1BynderImageAsset = section?.pot1ImageBynder?.[spaceLocale] || null;
    const pot1BynderImage = sanitiseBynderAssets(pot1BynderImageAsset);

    const pot2Image = section.pot2Image?.[spaceLocale];
    const pot2BynderImageAsset = section?.pot2ImageBynder?.[spaceLocale] || null;
    const pot2BynderImage = sanitiseBynderAssets(pot2BynderImageAsset);

    const pot3Image = section.pot3Image?.[spaceLocale];
    const pot3BynderImageAsset = section.pot3ImageBynder?.[spaceLocale] || null;
    const pot3BynderImage = sanitiseBynderAssets(pot3BynderImageAsset);

    const pot4Image = section.pot4Image?.[spaceLocale];
    const pot4BynderImageAsset = section.pot4ImageBynder?.[spaceLocale] || null;
    const pot4BynderImage = sanitiseBynderAssets(pot4BynderImageAsset);

    const headlessJackpot = tryGetValueFromLocalised(locale, spaceLocale, section.headlessJackpot, {
        id: '',
        name: '',
    });

    switch (classification) {
        case GAME_SECTION_CLASSIFICATION:
            return {
                classification: classification,
                title: title,
                layoutType: layoutType,
                games: sectionGames,
            };
        case JACKPOT_SECTION_CLASSIFICATION:
            return {
                classification: classification,
                title: title,
                layoutType: layoutType,
                ...(headerImage && { headerImage: headerImage }),
                ...(bynderHeaderImage && { bynderHeaderImage }),
                ...(backgroundImage && { backgroundImage }),
                ...(bynderBackgroundImage && { bynderBackgroundImage }),
                ...(type && { type: type }),
                ...(pot1Image && { pot1Image }),
                ...(pot1BynderImage && {
                    bynderPot1Image: pot1BynderImage,
                }),
                ...(pot2Image && { pot2Image }),
                ...(pot2BynderImage && {
                    bynderPot2Image: pot2BynderImage,
                }),
                ...(pot3Image && { pot3Image }),
                ...(pot3BynderImage && {
                    bynderPot3Image: pot3BynderImage,
                }),
                ...(pot4Image && { pot4Image }),
                ...(pot4BynderImage && {
                    bynderPot4Image: pot4BynderImage,
                }),
                ...(headlessJackpot.id && { headlessJackpot: headlessJackpot }),
                games: sectionGames,
            };
        case PERSONALISED_SECTION_CLASSIFICATION:
            return {
                classification: classification,
                title: tryGetValueFromLocalised(locale, spaceLocale, section.title, ''),
                layoutType: layoutType,
                games: sectionGames,
            };
        default:
            logError(ErrorCode.InvalidClassification, 206, { siteName, platform, sectionView, classification });
            return {
                classification: classification || '',
                title: tryGetValueFromLocalised(locale, spaceLocale, section.title, ''),
                layoutType: layoutType,
                games: [],
            };
    }
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const eventReqId = event?.requestContext?.requestId;

    //path param
    const siteNameFromParams = event.pathParameters?.sitename as string;
    const siteName = patchVentureName(siteNameFromParams);
    const platform = event.pathParameters?.platform as string;
    const sectionSlug = event.pathParameters?.sectionslug as string;

    //query param
    const memberId = event.queryStringParameters?.memberid || '';
    const authenticated = event.queryStringParameters?.auth || '';
    const isLoggedIn = memberId !== undefined && memberId !== '';
    const userLocale: string = validateLocaleQuery(event.queryStringParameters?.locale);

    try {
        const client = getClient();

        const spaceLocale = handleSpaceLocalization();
        checkRequestParams(
            [siteName, validators.siteName],
            [platform, validators.platform],
            [sectionSlug, validators.slug],
        );
        const ventureId = await getVentureId(client, siteName, spaceLocale, platform);

        const showOnlyLoggedIn = memberId.trim() !== '' || authenticated.trim().toLowerCase() === 'true';

        const { sectionView, sectionType, sectionGameIds } = await getIgSectionView(
            client,
            ventureId,
            platform,
            showOnlyLoggedIn,
            sectionSlug,
            spaceLocale,
            siteName,
        ); // 404

        const classification = tryGetValueFromLocalised(userLocale, spaceLocale, sectionView[0].classification, '');
        const isPersonalised = checkIsClassificationPersonalised(isLoggedIn, classification);

        let games: ISectionGame[];
        if (isPersonalised) {
            games = await handlePersonalizedGames({
                client,
                sectionType: sectionType as IMlPersonalizedSection,
                memberId,
                siteName,
                spaceLocale: handleSpaceLocalization(),
                localeOverride: userLocale,
                platform,
                handleEmptyRecommendation: handleMissingMLRecommendations.bind(
                    null,
                    client,
                    userLocale,
                    spaceLocale,
                    false,
                    platform,
                    sectionGameIds,
                ),
                showWebComponent: false,
            });
        } else {
            const sectionGames = await getSectionViewGames(
                client,
                ventureId,
                sectionGameIds,
                spaceLocale,
                platform,
                siteName,
            ); // 404

            const sectionGamesPayload = mapSectionGames(sectionGames, userLocale, spaceLocale, showOnlyLoggedIn);
            games = orderedPayload(sectionGamesPayload, sectionGameIds);
        }

        const response = createResponseObject(userLocale, spaceLocale, sectionView, games, platform, siteName);

        return gzipResponse(response);
    } catch (err) {
        const expectedEmptyBody: EmptySectionViewResponse = {
            title: '',
            classification: '',
            layoutType: '',
            games: [],
        };
        const errorLogParams = {
            eventReqId,
            siteName,
            platform,
            sectionSlug,
            memberId,
            isLoggedIn,
            userLocale,
        };
        return errorResponseHandler(err, expectedEmptyBody, errorLogParams);
    }
};
