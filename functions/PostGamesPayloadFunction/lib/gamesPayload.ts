import {
    ErrorCode,
    GamePlatformConfig,
    IBynderAsset,
    LocalizedField,
    SanitizedBynder,
    getErrorMessage,
    logError,
} from 'os-client';
import { WebhookFlowError } from './errorResolution';

export interface GameToSiteGameLink {
    name: 'game' | 'sitegame';
}

export interface GamePayloadFields {
    id: string;
    cmsEnv: string;
    contentType: string;
    updatedAt: string;
    createdAt: string;
    cmsChangeVersion: number | string;
    entryTitle: string;
    gameName: string;
    gameSkin: string;
    mobileGameName: string;
    mobileGameSkin: string;
    mobileOverride?: boolean;
    rtp?: number;
    platformVisibility: string[];
    gamePlatformConfig: SanitysedPlatformConfig;
    title?: LocalizedField<string>;
    tags?: string[];
    metadataTags?: string[];
    vendor?: string;
    showGameName?: boolean;

    operatorBarDisabled?: boolean;
    nativeRequirement?: object;
    webComponentData?: object;
    funPanelEnabled?: boolean;
    rgpEnabled?: boolean;
    funPanelDefaultCategory?: string;
    progressiveJackpot?: boolean;
    showNetPosition?: boolean;
    funPanelBackgroundImage?: string;

    // localised fields
    maxBet?: LocalizedField<string>;
    minBet?: LocalizedField<string>;

    howToPlayContent?: LocalizedField<string>;
    introductionContent?: LocalizedField<string>;
    infoDetails?: LocalizedField<string>;

    loggedOutAnimationMedia?: LocalizedField<string>;
    animationMedia?: LocalizedField<string>;
    loggedOutForegroundLogoMedia?: LocalizedField<StrictSanitizedBynder[]>;
    foregroundLogoMedia?: LocalizedField<StrictSanitizedBynder[]>;
    backgroundMedia?: LocalizedField<StrictSanitizedBynder[]>;
    loggedOutBackgroundMedia?: LocalizedField<StrictSanitizedBynder[]>;
    dfgWeeklyImgUrlPattern?: LocalizedField<string>;
    bynderDFGWeeklyImage?: LocalizedField<StrictSanitizedBynder[]>;
    videoUrlPattern?: LocalizedField<string>;

    imgUrlPattern?: LocalizedField<string>;
    infoImgUrlPattern?: LocalizedField<string>;
    loggedOutImgUrlPattern?: LocalizedField<string>;
    representativeColor?: LocalizedField<string>;
}

export interface IncomingPayload {
    game_to_sitegame: GameToSiteGameLink;
    game: IncomingGamePayload;
}

export interface IncomingGamePayload {
    id: string;
    cmsEnv: string;
    contentType: string;
    updatedAt: string;
    createdAt: string;
    cmsChangeVersion: number | string;
    rtp?: number;
    gamePlatformConfig: LocalizedField<GamePlatformConfig>;
    entryTitle: LocalizedField<string>;
    platformVisibility: LocalizedField<string[]>;
    title: LocalizedField<string>;
    launchCode?: string;
    metadataTags?: Array<{ sys?: { id?: string } }>;
    tags?: string[];
    vendor?: LocalizedField<string>;
    operatorBarDisabled: LocalizedField<boolean>;
    nativeRequirement?: LocalizedField<object | null>;
    webComponentData?: LocalizedField<object>;
    funPanelEnabled: LocalizedField<boolean>;
    rgpEnabled: LocalizedField<boolean>;
    showGameName?: LocalizedField<boolean>;
    funPanelDefaultCategory?: LocalizedField<string>;
    progressiveJackpot: LocalizedField<boolean>;
    showNetPosition: LocalizedField<boolean>;
    progressiveBackgroundColor?: LocalizedField<string>;
    funPanelBackgroundImage?: LocalizedField<string>;
    maxBet?: LocalizedField<string>;
    minBet?: LocalizedField<string>;
    howToPlayContent?: LocalizedField<string>;
    introductionContent?: LocalizedField<string>;
    infoDetails?: LocalizedField<string>;
    loggedOutAnimationMedia?: LocalizedField<string>;
    animationMedia?: LocalizedField<string>;
    loggedOutForegroundLogoMedia?: LocalizedField<IBynderAsset[]>;
    foregroundLogoMedia?: LocalizedField<IBynderAsset[]>;
    backgroundMedia?: LocalizedField<IBynderAsset[]>;
    loggedOutBackgroundMedia?: LocalizedField<IBynderAsset[]>;
    dfgWeeklyImgUrlPattern?: LocalizedField<string>;
    bynderDFGWeeklyImage?: LocalizedField<IBynderAsset[]>;
    videoUrlPattern?: LocalizedField<string>;
    imgUrlPattern?: LocalizedField<string>;
    infoImgUrlPattern?: LocalizedField<string>;
    loggedOutImgUrlPattern?: LocalizedField<string>;
    representativeColor?: LocalizedField<string> | null;
}

type SanitysedPlatformConfig = Omit<
    GamePlatformConfig,
    'name' | 'gameSkin' | 'mobileName' | 'mobileGameSkin' | 'mobileOverride' | 'rtp'
>;

export interface IncomingWebhookPayload {
    game_to_sitegame?: GameToSiteGameLink;
    game: IncomingGamePayload;
}

type StrictSanitizedBynder = Omit<SanitizedBynder, 'thumbnails'> & {
    thumbnails?: SanitizedBynder['thumbnails'];
};

const DEFAULT_SPACE_LOCALE = 'en-GB';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

type LocaleValueOptions<T> = {
    defaultValue?: T;
    logOnMissing?: boolean;
};

const getLocaleValue = <T>(
    value: unknown,
    locale: string,
    fieldName: string,
    options?: LocaleValueOptions<T>,
): T | undefined => {
    const hasDefaultValue = options ? Object.prototype.hasOwnProperty.call(options, 'defaultValue') : false;
    const shouldLogOnMissing = options?.logOnMissing ?? !hasDefaultValue;
    const handleMissing = (message: string): T | undefined => {
        if (hasDefaultValue) {
            return options?.defaultValue;
        }
        if (shouldLogOnMissing) {
            console.error(message);
        }
        return undefined;
    };

    if (!isRecord(value)) {
        return handleMissing(`Invalid localized value for "${fieldName}". Expected an object for locale "${locale}".`);
    }

    if (value[locale] === undefined) {
        return handleMissing(`Missing locale "${locale}" for "${fieldName}".`);
    }

    return value[locale] as T;
};

const parseMetadataTags = (metadataTags: IncomingGamePayload['metadataTags'] | string[] | undefined): string[] => {
    if (!metadataTags?.length) return [];
    const tags = metadataTags
        .map((tag) => (typeof tag === 'string' ? tag : tag?.sys?.id))
        .filter((id): id is string => typeof id === 'string' && id.length > 0);
    return tags.length > 0 ? tags : [];
};

const isNotNullUndefinedOrEmptyString = (value: unknown): boolean =>
    value !== null && value !== undefined && value !== '';

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const getPlatformConfigForLocale = (
    config: IncomingGamePayload['gamePlatformConfig'],
    locale: string,
): GamePlatformConfig | undefined => {
    if (!isRecord(config)) return undefined;
    const localizedConfig = config[locale];
    if (!isRecord(localizedConfig)) return undefined;
    return localizedConfig as GamePlatformConfig;
};

const validateRequiredGameFields = (game: IncomingGamePayload): void => {
    const missingRequired: string[] = [];
    if (!isNonEmptyString(game.cmsEnv)) missingRequired.push('cmsEnv');

    if (missingRequired.length > 0) {
        logError(
            ErrorCode.MissingGameRequiredFields,
            400,
            {
                skipThrow: true,
                warning: true,
                missingRequiredFields: missingRequired,
                entryId: game.id,
            },
            `Continuing indexing with fallbacks for fields: ${missingRequired.join(', ')}`,
        );
    }
};

const stripGamePlatformConfig = (config: GamePlatformConfig): SanitysedPlatformConfig => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name, gameSkin, mobileName, mobileGameSkin, mobileOverride, rtp, ...rest } = config;
    return { ...rest };
};

const sanitiseLocalizedBynderAssets = (
    value: LocalizedField<IBynderAsset[]> | undefined,
): LocalizedField<StrictSanitizedBynder[]> | undefined => {
    if (!isRecord(value)) return undefined;

    const sanitiseBynderAsset = (asset: IBynderAsset): StrictSanitizedBynder => {
        const sanitised: StrictSanitizedBynder = {};

        if (asset?.name !== undefined) sanitised.name = asset.name;
        if (asset?.type !== undefined) sanitised.type = asset.type;
        if (asset?.width !== undefined) sanitised.width = asset.width;
        if (asset?.height !== undefined) sanitised.height = asset.height;
        if (asset?.orientation !== undefined) sanitised.orientation = asset.orientation;
        if (asset?.original !== undefined) sanitised.original = asset.original;
        if (asset?.tags !== undefined) sanitised.tags = asset.tags;

        const thumbnails: SanitizedBynder['thumbnails'] = {};
        if (asset?.thumbnails?.transformBaseUrl !== undefined) {
            thumbnails.transformBaseUrl = asset.thumbnails.transformBaseUrl;
        }
        if (asset?.thumbnails?.original !== undefined) {
            thumbnails.original = asset.thumbnails.original;
        }
        if (Object.keys(thumbnails).length > 0) {
            sanitised.thumbnails = thumbnails;
        }

        return sanitised;
    };

    const sanitised = (Object.entries(value) as Array<[string, IBynderAsset[] | null | undefined]>).reduce<
        LocalizedField<StrictSanitizedBynder[]>
    >((acc, [locale, assets]) => {
        const sanitisedAssets = Array.isArray(assets)
            ? assets.map(sanitiseBynderAsset).filter((asset) => Object.keys(asset).length > 0)
            : [];
        if (sanitisedAssets.length > 0) {
            acc[locale] = sanitisedAssets;
        }
        return acc;
    }, {});

    return Object.keys(sanitised).length > 0 ? sanitised : undefined;
};

export const modifyEventGamePayload = (
    incomingPayload: IncomingPayload,
    SPACE_LOCALE = process.env.CONTENTFUL_SPACE_LOCALE || DEFAULT_SPACE_LOCALE,
): GamePayloadFields => {
    if (!incomingPayload || !incomingPayload.game) {
        throw new WebhookFlowError(
            'MissingGamePayload',
            202,
            ErrorCode.MissingGamePayload,
            getErrorMessage(ErrorCode.MissingGamePayload),
            'error',
            undefined,
            400,
        );
    }
    const game = incomingPayload.game;

    validateRequiredGameFields(game);
    const cmsEnv = isNonEmptyString(game.cmsEnv) ? game.cmsEnv : 'master';

    const platformConfig = getPlatformConfigForLocale(game.gamePlatformConfig, SPACE_LOCALE);
    const hasRequiredPlatformConfig =
        platformConfig !== undefined &&
        isNonEmptyString(platformConfig.name) &&
        isNonEmptyString(platformConfig.gameSkin);
    if (!hasRequiredPlatformConfig) {
        throw new WebhookFlowError(
            'IncompletePlatformConfig',
            202,
            ErrorCode.InvalidWebhookPayload,
            `Skipping OpenSearch indexing for entry ${game.id} due to incomplete platform config: gameName and gameSkin are required!`,
            'warn',
            { entryId: game.id, skipReason: 'IncompletePlatformConfig' },
        );
    }
    const gameName = typeof platformConfig?.name === 'string' ? platformConfig.name : undefined;
    const gameSkin = typeof platformConfig?.gameSkin === 'string' ? platformConfig.gameSkin : undefined;
    const mobileGameName = typeof platformConfig?.mobileName === 'string' ? platformConfig.mobileName : undefined;
    const mobileGameSkin =
        typeof platformConfig?.mobileGameSkin === 'string' ? platformConfig.mobileGameSkin : undefined;
    const mobileOverride =
        typeof platformConfig?.mobileOverride === 'boolean' ? platformConfig.mobileOverride : undefined;
    const rtpFromConfig = typeof platformConfig?.rtp === 'number' ? platformConfig.rtp : undefined;
    const rtp = typeof game.rtp === 'number' ? game.rtp : rtpFromConfig;
    const metadataTags = parseMetadataTags(game.metadataTags);
    const entryTitle = getLocaleValue<string>(game.entryTitle, SPACE_LOCALE, 'entryTitle', { logOnMissing: true });
    const platformVisibility = getLocaleValue<string[]>(game.platformVisibility, SPACE_LOCALE, 'platformVisibility', {
        logOnMissing: true,
        defaultValue: [],
    });
    const operatorBarDisabled = getLocaleValue<boolean>(game.operatorBarDisabled, SPACE_LOCALE, 'operatorBarDisabled');
    const funPanelEnabled = getLocaleValue<boolean>(game.funPanelEnabled, SPACE_LOCALE, 'funPanelEnabled');
    const rgpEnabled = getLocaleValue<boolean>(game.rgpEnabled, SPACE_LOCALE, 'rgpEnabled');
    const progressiveJackpot = getLocaleValue<boolean>(game.progressiveJackpot, SPACE_LOCALE, 'progressiveJackpot');
    const showNetPosition = getLocaleValue<boolean>(game.showNetPosition, SPACE_LOCALE, 'showNetPosition');
    const showGameName = getLocaleValue<boolean>(game.showGameName, SPACE_LOCALE, 'showGameName', {
        logOnMissing: false,
    });
    const vendor = getLocaleValue<string>(game.vendor, SPACE_LOCALE, 'vendor', { logOnMissing: false });
    const nativeRequirement = getLocaleValue<object | null>(game.nativeRequirement, SPACE_LOCALE, 'nativeRequirement', {
        logOnMissing: false,
    });

    const webComponentData = getLocaleValue<object>(game.webComponentData, SPACE_LOCALE, 'webComponentData', {
        logOnMissing: false,
    });
    const funPanelDefaultCategory = getLocaleValue<string>(
        game.funPanelDefaultCategory,
        SPACE_LOCALE,
        'funPanelDefaultCategory',
        { logOnMissing: false },
    );
    const funPanelBackgroundImage = getLocaleValue<string>(
        game.funPanelBackgroundImage,
        SPACE_LOCALE,
        'funPanelBackgroundImage',
        { logOnMissing: false },
    );
    const loggedOutForegroundLogoMedia = sanitiseLocalizedBynderAssets(game.loggedOutForegroundLogoMedia);
    const foregroundLogoMedia = sanitiseLocalizedBynderAssets(game.foregroundLogoMedia);
    const backgroundMedia = sanitiseLocalizedBynderAssets(game.backgroundMedia);
    const loggedOutBackgroundMedia = sanitiseLocalizedBynderAssets(game.loggedOutBackgroundMedia);
    const bynderDFGWeeklyImage = sanitiseLocalizedBynderAssets(game.bynderDFGWeeklyImage);

    const payload: GamePayloadFields = {
        id: game.id,
        cmsEnv,
        contentType: game.contentType,
        updatedAt: game.updatedAt,
        createdAt: game.createdAt,
        cmsChangeVersion: game.cmsChangeVersion,
        entryTitle: entryTitle || '',
        gameName: gameName || '',
        gameSkin: gameSkin || '',
        mobileGameName: mobileGameName || '',
        mobileGameSkin: mobileGameSkin || '',
        metadataTags,
        platformVisibility: platformVisibility || [],
        ...(rtp !== null && rtp !== undefined ? { rtp } : {}),
        gamePlatformConfig: stripGamePlatformConfig(platformConfig),
        ...(game.maxBet !== undefined ? { maxBet: game.maxBet } : {}),
        ...(game.minBet !== undefined ? { minBet: game.minBet } : {}),
        ...(isNotNullUndefinedOrEmptyString(mobileOverride) ? { mobileOverride } : { mobileOverride: false }),
        ...(isNotNullUndefinedOrEmptyString(game.title) ? { title: game.title } : {}),
        ...(isNotNullUndefinedOrEmptyString(game.tags) ? { tags: game.tags } : {}),
        ...(typeof showGameName === 'boolean' ? { showGameName } : {}),
        ...(isNotNullUndefinedOrEmptyString(vendor) ? { vendor } : {}),
        ...(isNotNullUndefinedOrEmptyString(operatorBarDisabled) ? { operatorBarDisabled } : {}),
        ...(isNotNullUndefinedOrEmptyString(nativeRequirement)
            ? { nativeRequirement: nativeRequirement ?? undefined }
            : {}),
        ...(isNotNullUndefinedOrEmptyString(webComponentData) ? { webComponentData } : {}),
        ...(isNotNullUndefinedOrEmptyString(funPanelEnabled) ? { funPanelEnabled } : {}),
        ...(isNotNullUndefinedOrEmptyString(rgpEnabled) ? { rgpEnabled } : {}),
        ...(isNotNullUndefinedOrEmptyString(funPanelDefaultCategory) ? { funPanelDefaultCategory } : {}),
        ...(isNotNullUndefinedOrEmptyString(progressiveJackpot) ? { progressiveJackpot } : {}),
        ...(isNotNullUndefinedOrEmptyString(showNetPosition) ? { showNetPosition } : {}),
        ...(isNotNullUndefinedOrEmptyString(funPanelBackgroundImage) ? { funPanelBackgroundImage } : {}),
        ...(isNotNullUndefinedOrEmptyString(game.howToPlayContent) ? { howToPlayContent: game.howToPlayContent } : {}),
        ...(isNotNullUndefinedOrEmptyString(game.introductionContent)
            ? { introductionContent: game.introductionContent }
            : {}),
        ...(isNotNullUndefinedOrEmptyString(game.infoDetails) ? { infoDetails: game.infoDetails } : {}),
        ...(isNotNullUndefinedOrEmptyString(game.loggedOutAnimationMedia)
            ? { loggedOutAnimationMedia: game.loggedOutAnimationMedia }
            : {}),
        ...(isNotNullUndefinedOrEmptyString(game.animationMedia) ? { animationMedia: game.animationMedia } : {}),
        ...(isNotNullUndefinedOrEmptyString(loggedOutForegroundLogoMedia) ? { loggedOutForegroundLogoMedia } : {}),
        ...(isNotNullUndefinedOrEmptyString(foregroundLogoMedia) ? { foregroundLogoMedia } : {}),
        ...(isNotNullUndefinedOrEmptyString(backgroundMedia) ? { backgroundMedia } : {}),
        ...(isNotNullUndefinedOrEmptyString(loggedOutBackgroundMedia) ? { loggedOutBackgroundMedia } : {}),
        ...(isNotNullUndefinedOrEmptyString(game.dfgWeeklyImgUrlPattern)
            ? { dfgWeeklyImgUrlPattern: game.dfgWeeklyImgUrlPattern }
            : {}),
        ...(isNotNullUndefinedOrEmptyString(bynderDFGWeeklyImage) ? { bynderDFGWeeklyImage } : {}),
        ...(isNotNullUndefinedOrEmptyString(game.videoUrlPattern) ? { videoUrlPattern: game.videoUrlPattern } : {}),
        ...(isNotNullUndefinedOrEmptyString(game.imgUrlPattern) ? { imgUrlPattern: game.imgUrlPattern } : {}),
        ...(isNotNullUndefinedOrEmptyString(game.infoImgUrlPattern)
            ? { infoImgUrlPattern: game.infoImgUrlPattern }
            : {}),
        ...(isNotNullUndefinedOrEmptyString(game.loggedOutImgUrlPattern)
            ? { loggedOutImgUrlPattern: game.loggedOutImgUrlPattern }
            : {}),
        ...(isNotNullUndefinedOrEmptyString(game.representativeColor)
            ? { representativeColor: game.representativeColor ?? undefined }
            : {}),
    };

    return payload;
};
