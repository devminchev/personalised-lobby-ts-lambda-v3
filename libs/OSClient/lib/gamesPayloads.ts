import {
    FullApiResponse,
    ISectionGame,
    SiteGame,
    Game,
    GamePlatformConfig,
    FullApiResponseByGame,
} from './sharedInterfaces/interfaces';
import { tryGetValueFromLocalised } from './localization';
import { extractBynderObject, pickGameOrSiteGameValue, resolveGameProp } from './utils';

/**
 * Module overview
 *
 * Canonical builder
 * - payloadBuilder: single source of truth that returns the default ISectionGame shape.
 *   Accepts an optional `derived` bundle; when omitted, it computes values via
 *   `computeDerivedPayload`. This preserves backward compatibility for direct callers.
 *
 * Centralised value derivation
 * - computeDerivedPayload: derives all values used by the default payload (titles, images,
 *   media, URLs, mobile overrides, tags, jackpot/liveHidden, etc.). This runs once per hit
 *   when called through the helpers below so mappers don’t duplicate any logic.
 *
 * Mappers
 * - defaultSectionGameMapper: delegates to `payloadBuilder` with a precomputed `derived`,
 *   producing the existing default payload.
 * - createDefaultMapperPicking(keys): builds a mapper that returns only the listed keys from
 *   the default payload shape. It calls `payloadBuilder` once, then returns
 *   `Pick<ISectionGame, K>`. No auto-included keys; the caller fully controls the shape.
 *
 * Public helpers (precompute derived per hit)
 * - gamesPayloadBySiteGame / gamesPayloadByGame: accept an optional `mapper`. If omitted,
 *   they use `defaultSectionGameMapper` and return the full default payload. If provided,
 *   they pass the precomputed `derived` and inputs into the mapper you supply.
 *
 * Usage notes
 * - Keep the default shape: call the helpers without a mapper.
 * - Build a small custom shape: use `createDefaultMapperPicking([...])` to list the props
 *   you want from the default payload.
 * - Build a fully custom shape: provide a mapper `(ctx) => T` and read values from
 *   `ctx.derived` + `ctx.gameData/siteGameData` as needed.
 */

// New: generic payload mapping types
export type DerivedPayload = {
    gameId: string | null;
    gameType: string | null;
    imagePattern: string | null;
    dfgWeeklyImgUrlPattern: string | null;
    loggedOutImgUrlPattern: string | null;
    representativeColor: string | null;
    videoUrlPattern: string | null;
    animationMedia: string | null;
    loggedOutAnimationMedia: string | null;
    foregroundLogoMedia: object | null;
    loggedOutForegroundLogoMedia: object | null;
    backgroundMedia: object | null;
    loggedOutBackgroundMedia: object | null;
    gameName: string | undefined;
    gameDemoUrl: string | undefined;
    gameSkin: string | undefined;
    gameRealUrl: string | undefined;
    headlessJackpot: object | undefined;
    liveHidden: boolean | undefined;
    tags: string[] | undefined;
    localizedTitle: string | undefined;
};

export type PayloadContext = {
    siteGameData: SiteGame;
    gameData: Game;
    gamePlatformObject: GamePlatformConfig;
    spaceLocale: string;
    localeOverride: string;
    platform: string;
    showWebComponent: boolean;
    derived: DerivedPayload;
};

export type PayloadMapper<T> = (ctx: PayloadContext) => T;

// Centralized derived computation
export const computeDerivedPayload = (
    siteGameData: SiteGame,
    gameData: Game,
    gamePlatformObject: GamePlatformConfig,
    spaceLocale: string,
    localeOverride: string,
    platform: string,
): DerivedPayload => {
    const gameId = gameData?.id;
    const imgUrlPattern = tryGetValueFromLocalised(localeOverride, spaceLocale, gameData?.imgUrlPattern, null);
    const infoImage = tryGetValueFromLocalised(localeOverride, spaceLocale, gameData?.infoImgUrlPattern, '');
    const imagePattern = imgUrlPattern ? imgUrlPattern : infoImage;
    const dfgWeeklyImgUrlPattern = tryGetValueFromLocalised(
        localeOverride,
        spaceLocale,
        gameData?.dfgWeeklyImgUrlPattern,
        null,
    );
    const loggedOutImgUrlPattern = tryGetValueFromLocalised(
        localeOverride,
        spaceLocale,
        gameData?.loggedOutImgUrlPattern,
        null,
    );
    const representativeColor = tryGetValueFromLocalised(
        localeOverride,
        spaceLocale,
        gameData?.representativeColor,
        null,
    );
    const videoUrlPattern = tryGetValueFromLocalised(localeOverride, spaceLocale, gameData?.videoUrlPattern, null);
    const animationMedia = tryGetValueFromLocalised(localeOverride, spaceLocale, gameData?.animationMedia, null);
    const loggedOutAnimationMedia = tryGetValueFromLocalised(
        localeOverride,
        spaceLocale,
        gameData?.loggedOutAnimationMedia,
        null,
    );
    const loggedInForegroundLogoMedia = tryGetValueFromLocalised(
        localeOverride,
        spaceLocale,
        gameData?.foregroundLogoMedia,
        null,
    );
    const loggedOutForegroundLogoMedia = tryGetValueFromLocalised(
        localeOverride,
        spaceLocale,
        gameData?.loggedOutForegroundLogoMedia,
        null,
    );
    const loggedInBackgroundMedia = tryGetValueFromLocalised(
        localeOverride,
        spaceLocale,
        gameData?.backgroundMedia,
        null,
    );
    const loggedOutBackgroundMedia = tryGetValueFromLocalised(
        localeOverride,
        spaceLocale,
        gameData?.loggedOutBackgroundMedia,
        null,
    );

    const shouldConsiderMobile = platform.toLowerCase() !== 'web' && gameData?.mobileOverride;

    const gameType = gamePlatformObject?.gameType?.type ?? null;

    const gameName = shouldConsiderMobile ? gameData?.mobileGameName : gameData?.gameName;
    const gameDemoUrl = shouldConsiderMobile ? gamePlatformObject?.mobileDemoUrl : gamePlatformObject?.demoUrl;
    const gameSkin = shouldConsiderMobile ? gameData?.mobileGameSkin : gameData?.gameSkin;
    const gameRealUrl = shouldConsiderMobile ? gamePlatformObject?.mobileRealUrl : gamePlatformObject?.realUrl;
    const headlessJackpot = siteGameData?.headlessJackpot?.[spaceLocale] as unknown as object | undefined;
    const liveHidden = siteGameData?.liveHidden?.[spaceLocale] as unknown as boolean | undefined;

    const foregroundLogoMedia = (extractBynderObject(loggedInForegroundLogoMedia) as object | null) ?? null;
    const loggedOutForegroundLogoMediaObj =
        (extractBynderObject(loggedOutForegroundLogoMedia) as object | null) ?? null;
    const backgroundMedia = (extractBynderObject(loggedInBackgroundMedia) as object | null) ?? null;
    const loggedOutBackgroundMediaObj = (extractBynderObject(loggedOutBackgroundMedia) as object | null) ?? null;
    const tagsVal = pickGameOrSiteGameValue(siteGameData?.tags?.[spaceLocale], gameData?.tags, null);
    const tags = Array.isArray(tagsVal) ? (tagsVal as string[]) : undefined;
    const localizedTitle = tryGetValueFromLocalised(localeOverride, spaceLocale, gameData?.title, '');

    return {
        gameId,
        gameType,
        imagePattern,
        dfgWeeklyImgUrlPattern,
        loggedOutImgUrlPattern,
        representativeColor,
        videoUrlPattern,
        animationMedia,
        loggedOutAnimationMedia,
        foregroundLogoMedia,
        loggedOutForegroundLogoMedia: loggedOutForegroundLogoMediaObj,
        backgroundMedia,
        loggedOutBackgroundMedia: loggedOutBackgroundMediaObj,
        gameName,
        gameDemoUrl,
        gameSkin,
        gameRealUrl,
        headlessJackpot,
        liveHidden,
        tags,
        localizedTitle,
    };
};

// Default mapper uses payloadBuilder to avoid duplication
export const defaultSectionGameMapper: PayloadMapper<ISectionGame> = ({
    siteGameData,
    gameData,
    gamePlatformObject,
    spaceLocale,
    localeOverride,
    platform,
    showWebComponent,
    derived,
}: PayloadContext): ISectionGame =>
    payloadBuilder(
        siteGameData,
        gameData,
        gamePlatformObject,
        spaceLocale,
        localeOverride,
        platform,
        showWebComponent,
        derived,
    );

// Helper: create a mapper that picks keys from the default ISectionGame payload
export const createDefaultMapperPicking = <K extends keyof ISectionGame>(
    keys: ReadonlyArray<K>,
): PayloadMapper<Pick<ISectionGame, K>> => {
    return ({
        siteGameData,
        gameData,
        gamePlatformObject,
        spaceLocale,
        localeOverride,
        platform,
        showWebComponent,
        derived,
    }) => {
        const full = payloadBuilder(
            siteGameData,
            gameData,
            gamePlatformObject,
            spaceLocale,
            localeOverride,
            platform,
            showWebComponent,
            derived,
        );

        const isDefined = <T>(x: T | undefined): x is T => x !== undefined;
        const entries = keys
            .map((key) => [key, full[key]] as const)
            .filter((item): item is [K, ISectionGame[K]] => isDefined(item[1]));
        return Object.fromEntries(entries) as Pick<ISectionGame, K>;
    };
};

type GameHitType = FullApiResponse | FullApiResponseByGame;

const constructGamesPayload = <T>(
    gameHits: GameHitType[],
    spaceLocale: string,
    localeOverride: string,
    platform: string,
    showWebComponent: boolean,
    getGameData: (item: GameHitType) => Game,
    getSiteGameData: (item: GameHitType) => SiteGame,
    mapper: PayloadMapper<T> = defaultSectionGameMapper as unknown as PayloadMapper<T>,
): T[] => {
    return gameHits.map((item: GameHitType) => {
        const gameData = getGameData(item);
        const siteGameData = getSiteGameData(item);
        const gamePlatformObject = gameData?.gamePlatformConfig || ({} as GamePlatformConfig);

        const derived = computeDerivedPayload(
            siteGameData,
            gameData,
            gamePlatformObject,
            spaceLocale,
            localeOverride,
            platform,
        );

        return mapper({
            siteGameData,
            gameData,
            gamePlatformObject,
            spaceLocale,
            localeOverride,
            platform,
            showWebComponent,
            derived,
        });
    });
};

// This is when we have queried OpenSearch by siteGame id and receive the payload in the FullApiResponse type.
export const gamesPayloadBySiteGame = <T = ISectionGame>(
    gameHits: FullApiResponse[],
    spaceLocale: string,
    localeOverride: string,
    showWebComponent: boolean,
    platform: string,
    mapper?: PayloadMapper<T>,
): T[] => {
    return constructGamesPayload<T>(
        gameHits,
        spaceLocale,
        localeOverride,
        platform,
        showWebComponent,
        (item) => (item as FullApiResponse).innerHit?.game,
        (item) => (item as FullApiResponse).hit?.siteGame,
        mapper,
    );
};

// This is when we have queried OpenSearch by gameID, as this is what we get from ML, and receive the payload in the FullApiResponseByGame type.
export const gamesPayloadByGame = <T = ISectionGame>(
    gameHits: FullApiResponseByGame[],
    spaceLocale: string,
    localeOverride: string,
    platform: string,
    showWebComponent = false,
    mapper?: PayloadMapper<T>,
): T[] => {
    return constructGamesPayload<T>(
        gameHits,
        spaceLocale,
        localeOverride,
        platform,
        showWebComponent,
        (item) => (item as FullApiResponseByGame).hit?.game,
        (item) => (item as FullApiResponseByGame).innerHit?.siteGame,
        mapper,
    );
};

// Keep legacy builder for backward compatibility
export const payloadBuilder = (
    siteGameData: SiteGame,
    gameData: Game,
    gamePlatformObject: GamePlatformConfig,
    spaceLocale: string,
    localeOverride: string,
    platform: string,
    showWebComponent = false,
    derived?: DerivedPayload,
): ISectionGame => {
    const computed =
        derived ??
        computeDerivedPayload(siteGameData, gameData, gamePlatformObject, spaceLocale, localeOverride, platform);

    return {
        entryId: siteGameData.id,
        gameId: gameData.id,
        name: computed.gameName, // mobile mobileName
        demoUrl: computed.gameDemoUrl, // mobileDemoUrl
        ...(gameData?.launchCode?.[spaceLocale] ? { launchCode: gameData.launchCode[spaceLocale] } : {}),
        ...(computed.localizedTitle ? { title: computed.localizedTitle } : {}),
        ...(computed.dfgWeeklyImgUrlPattern ? { dfgWeeklyImgUrlPattern: computed.dfgWeeklyImgUrlPattern } : {}),
        gameSkin: computed.gameSkin, // mobileGameSkin
        ...(computed.imagePattern ? { imgUrlPattern: computed.imagePattern } : {}),
        ...(computed.loggedOutImgUrlPattern ? { loggedOutImgUrlPattern: computed.loggedOutImgUrlPattern } : {}),
        ...(resolveGameProp(gameData?.progressiveJackpot, spaceLocale, false)
            ? { isProgressiveJackpot: resolveGameProp(gameData?.progressiveJackpot, spaceLocale, false) }
            : {}),
        realUrl: computed.gameRealUrl, // mobileRealUrl
        ...(computed.representativeColor ? { representativeColor: computed.representativeColor } : {}),
        ...(siteGameData.sash?.[spaceLocale] ? { sash: siteGameData.sash[spaceLocale] } : {}),
        ...(computed.videoUrlPattern ? { videoUrlPattern: computed.videoUrlPattern } : {}),
        ...(computed.animationMedia ? { animationMedia: computed.animationMedia } : {}),
        ...(computed.loggedOutAnimationMedia ? { loggedOutAnimationMedia: computed.loggedOutAnimationMedia } : {}),
        ...(computed.foregroundLogoMedia ? { foregroundLogoMedia: computed.foregroundLogoMedia } : {}),
        ...(computed.loggedOutForegroundLogoMedia
            ? { loggedOutForegroundLogoMedia: computed.loggedOutForegroundLogoMedia }
            : {}),
        ...(computed.backgroundMedia ? { backgroundMedia: computed.backgroundMedia } : {}),
        ...(computed.loggedOutBackgroundMedia ? { loggedOutBackgroundMedia: computed.loggedOutBackgroundMedia } : {}),
        ...(computed.tags ? { tags: computed.tags } : {}),
        ...(showWebComponent && resolveGameProp(gameData?.webComponentData, spaceLocale, undefined)
            ? { webComponentData: resolveGameProp(gameData?.webComponentData, spaceLocale, undefined) }
            : {}),
        ...(computed.headlessJackpot ? { headlessJackpot: computed.headlessJackpot } : {}),
        ...(computed.liveHidden ? { liveHidden: computed.liveHidden } : {}),
    };
};
