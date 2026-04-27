import { OrderCriteriaContentful } from '../personalisation';
import { LocalizedField, SysReference, SystemLink, Venture } from './common';
/* ----------------------------- Theme Interfaces --------------------------------- */
export interface IIGThemeOS {
    entryTitle: LocalizedField<string>;
    image: LocalizedField<IBynderAsset>;
    primaryColor: LocalizedField<string>;
    secondaryColor: LocalizedField<string>;
    venture: LocalizedField<SysReference<SystemLink>>;
}

export interface IIGTheme {
    primaryColor: string;
    secondaryColor?: string;
    image?: IBynderAsset;
}
/* ----------------------------- Link item inside QuickLinks Interfaces --------------------------------- */

export type IGLinkItem = {
    entryId: string;
    label: string;
    viewSlug?: string;
    externalUrl?: string;
    internalUrl?: string;
    image?: string;
    bynderImage?: SanitizedBynder | null;
    liveHidden?: boolean;
};

export type IGLinkItemOS = {
    id: string;
    label: LocalizedField<string>;
    view?: LocalizedField<string>;
    externalUrl?: LocalizedField<string>;
    internalUrl?: LocalizedField<string>;
    image?: LocalizedField<string>;
    bynderImage?: IBynderAssets;
    liveHidden?: LocalizedField<boolean>;
};

export type extendedViewSlugProp = {
    linkedViewSlug?: string;
};

export type IGLinkItemWithViewSlug = IGLinkItemOS & extendedViewSlugProp;
/* ----------------------------- ViewAll Interfaces --------------------------------- */
export interface IViewAllOS {
    viewAllAction?: LocalizedField<SysReference<SystemLink>>;
    viewAllType?: LocalizedField<string>;
    viewAllActionText?: LocalizedField<string>;
}

export interface IViewAll {
    viewAllActionSlug: string;
    viewAllActionType: string;
    viewAllActionText: string;
}

export interface IBynderAssets {
    [locale: string]: IBynderAsset[];
}

/* ----------------------------- Bynder Interfaces --------------------------------- */
export interface IBynderAsset {
    id: string;
    brandId?: string;
    copyright?: string;
    description?: string;
    extension?: string[];
    height?: number;
    isPublic?: number;
    limited?: number;
    name?: string;
    orientation?: string;
    original?: string;
    thumbnails?: Record<string, any>;
    type?: string;
    watermarked?: number;
    width?: number;
    videoPreviewURLs?: string[];
    tags?: string[];
    textMetaproperties?: string[];
    src?: string;
}

export type SanitizedBynder = Pick<
    IBynderAsset,
    'name' | 'type' | 'width' | 'height' | 'orientation' | 'original' | 'tags'
> & {
    thumbnails: {
        transformBaseUrl?: string;
        original?: string;
    };
};

/* ----------------------------- View Type Interfaces --------------------------------- */
interface linkedModelItem {
    sys: {
        type: string;
        linkType: string;
        id: string;
    };
}
export interface IView {
    id: string;
    name: LocalizedField<string>;
    viewSlug: LocalizedField<string>;
    classification: LocalizedField<string>;
    topContent: LocalizedField<linkedModelItem[]>;
    primaryContent: LocalizedField<linkedModelItem[]>;
    liveHidden: LocalizedField<boolean>;
    venture: LocalizedField<{
        sys: {
            type: string;
            linkType: string;
            id: string;
        };
    }>;
    theme: LocalizedField<SysReference<SystemLink>>;
}

/* ----------------------------- Layout Type Interfaces --------------------------------- */

interface LayoutSection {
    sys: {
        type: string;
        linkType: string;
        id: string;
    };
}
export interface ILayout {
    entryTitle: LocalizedField<string>;
    sections: LocalizedField<LayoutSection[]>;
    id: string;
    contentType: string;
    name: LocalizedField<string>;
    venture: LocalizedField<{
        sys: {
            type: string;
            linkType: string;
            id: string;
        };
    }>;
}

/* ----------------------------- Game Type Interfaces --------------------------------- */
export interface IHeadlessJackpot {
    id: string;
    name: string;
}

// SiteGameV2 Model Type
export interface SiteGame {
    entryTitle: LocalizedField<string>;
    chat?: LocalizedField<ChatConfig>;
    environment: string;
    sash?: LocalizedField<string>;
    maxBet: LocalizedField<string>;
    minBet: LocalizedField<string>;
    venture?: LocalizedField<Venture>;
    headlessJackpot?: LocalizedField<IHeadlessJackpot>;
    contentType: string;
    id: string;
    gameId: string;
    updatedAt: string;
    game: Game[];
    howToPlayContent?: LocalizedField<string>;
    showNetPosition?: LocalizedField<boolean>;
    liveHidden?: LocalizedField<boolean>;
    tags?: LocalizedField<string[]>;
}

interface ChatConfig {
    isEnabled: boolean;
    controlMobileChat: boolean;
}

export type ISiteGameConfig = Pick<
    SiteGame,
    'id' | 'chat' | 'minBet' | 'maxBet' | 'headlessJackpot' | 'showNetPosition' | 'liveHidden'
>;

export type ISiteGameInfo = Pick<
    SiteGame,
    'id' | 'minBet' | 'maxBet' | 'howToPlayContent' | 'showNetPosition' | 'liveHidden'
>;

// GameV2 Model Type
export interface Game {
    id: string;
    contentType: string;
    environment?: string;
    updatedAt: string;
    metadataTags?: linkedModelItem[] | string[];
    platformVisibility?: string[];
    entryTitle: string;
    // Fields pulled up from gamePlatformConfig
    mobileOverride?: false;
    gameName: string;
    mobileGameName?: string;
    gameSkin: string;
    mobileGameSkin?: string;
    rtp?: number;
    // Non-localized fields with removed default space locale
    tags?: string[];
    vendor: string;
    progressiveJackpot: boolean;
    showNetPosition: boolean;
    operatorBarDisabled: boolean;
    funPanelEnabled: boolean;
    rgpEnabled: boolean;
    webComponentData?: IWebComponentData;
    progressiveBackgroundColor?: string;
    gamePlatformConfig: GamePlatformConfig;
    funPanelDefaultCategory?: string;
    funPanelBackgroundImage: string;
    nativeRequirement?: any;
    // Localized fields for which locale is kept
    title: LocalizedField<string>;
    maxBet: LocalizedField<string>;
    minBet: LocalizedField<string>;
    howToPlayContent?: LocalizedField<string>;
    introductionContent?: LocalizedField<string>;
    infoDetails?: LocalizedField<string>;

    dfgWeeklyImgUrlPattern?: LocalizedField<string>;
    bynderDFGWeeklyImage?: LocalizedField<IBynderAsset[]>;
    infoImgUrlPattern: LocalizedField<string>;
    imgUrlPattern?: LocalizedField<string>;
    loggedOutImgUrlPattern?: LocalizedField<string>;
    representativeColor?: LocalizedField<string>;
    videoUrlPattern?: LocalizedField<string>;
    animationMedia?: LocalizedField<string>;
    loggedOutAnimationMedia?: LocalizedField<string>;
    foregroundLogoMedia?: LocalizedField<IBynderAsset[]>;
    loggedOutForegroundLogoMedia?: LocalizedField<IBynderAsset[]>;
    backgroundMedia?: LocalizedField<IBynderAsset[]>;
    loggedOutBackgroundMedia?: LocalizedField<IBynderAsset[]>;
    // Possibly legacy
    launchCode?: LocalizedField<string>;
    headlessJackpot?: LocalizedField<IHeadlessJackpot>;
}

// Game Platform Config
interface GameType_InstantWin_Slingo {
    type: string;
    themes: string[];
    features?: string[];
    brand?: string;
    winLineType: string;
    maxMultiplier: string;
    symbolType: string[];
    reel: string;
    isPersistence: boolean;
    isJackpotFixedPrize: boolean;
    isJackpotInGameProgressive: boolean;
    waysToWin: string;
    symbolCount: string;
    isJackpot: boolean;
    isJackpotPlatformProgressive: boolean;
    brandedSkin: boolean;
    languages: string[];
    sidebets: boolean;
    bonusRound: boolean;
    liveDealer: boolean;
    isMultiLanguage: boolean;
    maxExposure: number;
    traditional: boolean;
    averageGameRoundLength: string;
}

interface GameType_Poker_Bingo_LiveDealer {
    type: string;
}

interface GameType_Casino {
    type: string;
    casinoType: string;
}

interface GameType_Slots {
    type: string;
    themes: string[];
    features?: string[];
    brand?: string;
    reel: string;
    symbolType: string[];
    symbolCount: string;
    maxMultiplier: number;
    waysToWin: string;
    winLineType: string;
    winLines: string;
    isJackpot: boolean;
    isJackpotFixedPrize: boolean;
    isJackpotPlatformProgressive: boolean;
    isPersistence: boolean;
    isJackpotInGameProgressive: boolean;
}

export type GameType = GameType_InstantWin_Slingo | GameType_Poker_Bingo_LiveDealer | GameType_Casino | GameType_Slots;

export interface GamePlatformConfig {
    mobileOverride?: boolean;
    gameSkin?: string;
    name?: string;
    demoUrl: string;
    realUrl: string;
    gameLoaderFileName: string;
    mobileName?: string;
    mobileGameSkin?: string;
    mobileRealUrl?: string;
    mobileDemoUrl?: string;
    mobileGameLoaderFileName?: string;
    gameStudio?: string;
    gameProvider: string;
    gameAggregator?: string;
    gameType: GameType;
    rtp?: number;
    subGameType: string;
    federalGameType: string;
}

export type IGameConfig = Pick<
    Game,
    | 'id'
    | 'funPanelEnabled'
    | 'minBet'
    | 'maxBet'
    | 'vendor'
    | 'gamePlatformConfig'
    | 'showNetPosition'
    | 'launchCode'
    | 'gameName'
    | 'gameSkin'
    | 'mobileGameName'
    | 'mobileGameSkin'
    | 'mobileOverride'
>;

export type GameSkinConfigResponse = { game: Pick<IGameConfig, 'gamePlatformConfig'> };

export type IGameInfo = Pick<
    Game,
    | 'id'
    | 'minBet'
    | 'maxBet'
    | 'gamePlatformConfig'
    | 'gameName'
    | 'gameSkin'
    | 'mobileGameName'
    | 'mobileGameSkin'
    | 'mobileOverride'
    | 'howToPlayContent'
    | 'infoImgUrlPattern'
    | 'infoDetails'
    | 'introductionContent'
    | 'representativeColor'
    | 'title'
    | 'funPanelEnabled'
    | 'funPanelBackgroundImage'
    | 'funPanelDefaultCategory'
    | 'showNetPosition'
    | 'animationMedia'
    | 'loggedOutAnimationMedia'
    | 'foregroundLogoMedia'
    | 'loggedOutForegroundLogoMedia'
    | 'backgroundMedia'
    | 'loggedOutBackgroundMedia'
>;

export interface ApiResponse<THit, TInnerHit> {
    hit: THit;
    innerHit: TInnerHit;
}

export interface ApiPostSiteGameRequest<TInner> {
    entryId: string;
    routeId?: string;
    payload: { doc: TInner };
}

export type SiteGamePostRequest = ApiPostSiteGameRequest<SiteGame_InnerHit<SiteGame>>;

export type GamePostRequest = ApiPostSiteGameRequest<Game_Hit<PostGameV2>>;

export interface PostGameV2 {
    entryTitle?: LocalizedField<string>;
    dfgWeeklyImgUrlPattern?: LocalizedField<string>;
    howToPlayContent?: LocalizedField<string>;
    infoImgUrlPattern?: LocalizedField<string>;
    imgUrlPattern?: LocalizedField<string>;
    infoDetails?: LocalizedField<string>;
    introductionContent?: LocalizedField<string>;
    loggedOutImgUrlPattern?: LocalizedField<string>;
    maxBet?: LocalizedField<string>;
    minBet?: LocalizedField<string>;
    progressiveBackgroundColor?: LocalizedField<string>;
    progressiveJackpot?: LocalizedField<boolean>;
    representativeColor?: LocalizedField<string>;
    title?: LocalizedField<string>;
    videoUrlPattern?: LocalizedField<string>;
    gamePlatformConfig?: LocalizedField<GamePlatformConfig>;
    funPanelDefaultCategory?: LocalizedField<string>;
    funPanelEnabled?: LocalizedField<boolean>;
    operatorBarDisabled?: LocalizedField<boolean>;
    rgpEnabled?: LocalizedField<boolean>;
    vendor?: LocalizedField<string>;
    platform: string[];
    meta?: LocalizedField<string>;
    nativeRequirement?: LocalizedField<any>;
    webComponentData?: LocalizedField<IWebComponentData>;
    tags?: LocalizedField<string[]>;
    contentType: string;
    id: string;
    environment?: string;
    updatedAt: string;
    showNetPosition?: LocalizedField<boolean>;
}

// This is when we are searching by siteGame ids, so games are inside inner hits
export type FullApiResponse = ApiResponse<Hit<SiteGame>, InnerHit<Game>>;

// This is when we are searching by game ids, so siteGames are inside inner hits
export type FullApiResponseByGame = ApiResponse<Game_Hit<Game>, SiteGame_InnerHit<SiteGame>>;

export type PartialApiResponse = ApiResponse<Hit<ISiteGameConfig>, InnerHit<IGameConfig>>;

export type ExtraPersDataAPIResp = Game_Hit<Pick<Game, 'id' | 'title'>>;

export interface InnerPartialApiResponse<TSiteGame, TGame> {
    siteGame: TSiteGame;
    game: TGame;
}

export type InnerPartialApiResponseConfig = InnerPartialApiResponse<ISiteGameConfig, IGameConfig>;

export type InnerPartialApiResponseInfo = InnerPartialApiResponse<ISiteGameInfo, IGameInfo>;

interface Hit<TSiteGame> {
    game_to_sitegame?: GameToSiteGame;
    siteGame: TSiteGame;
}

interface InnerHit<TGame> {
    game_to_sitegame?: GameToSiteGame;
    game: TGame;
}

//
export interface Game_Hit<TGame> {
    game_to_sitegame?: GameToSiteGame;
    game: TGame;
}

interface SiteGame_InnerHit<TSiteGame> {
    game_to_sitegame?: GameToSiteGame;
    siteGame: TSiteGame;
}

interface GameToSiteGame {
    name: string;
    parent?: string;
}

// Game - Web Component Interfaces
export interface IWebComponentDataAttributes {
    name: string;
    locale?: string;
    stream: string;
    currency: string;
    tiletype: string;
    partnerId: string;
    ventureId: string;
    covercolor: string;
    lockoutTime?: number;
}

export interface IWebComponentData {
    name: string;
    location: string;
    attributes: IWebComponentDataAttributes;
}

// Section index response
//TODO: seperate to new interfaces
export interface ISection {
    entryTitle?: LocalizedField<string>;
    name?: LocalizedField<string>;
    type?: LocalizedField<string>;
    show?: LocalizedField<string[]>;
    className?: LocalizedField<string>;
    carousel?: LocalizedField<any>;
    header?: LocalizedField<boolean>;
    title?: LocalizedField<string>;
    href?: LocalizedField<string>;
    videoUrl?: LocalizedField<string>;
    image?: LocalizedField<string>;
    highlightColor?: LocalizedField<string>;
    sizes?: LocalizedField<any>;
    slides?: LocalizedField<Slide[]>;
    style?: LocalizedField<any>;
    jackpots?: LocalizedField<string>;
    contentType: string;
    id: string;
    priorityOverride?: LocalizedField<number>;
    environment: string;
    updatedAt: string;
    games?: LocalizedField<GameLink[]>;
    headlessJackpot?: LocalizedField<IHeadlessJackpot>;
    sort?: LocalizedField<OrderCriteriaContentful>;
}

export interface IIGSectionView extends ISection {
    classification: LocalizedField<string>;
    expandedSectionLayoutType: LocalizedField<string>;
    jackpotType: LocalizedField<JackpotType>;
    headlessJackpot?: LocalizedField<IHeadlessJackpot>;
    headerImage?: LocalizedField<string>;
    headerImageBynder?: IBynderAssets;
    backgroundImage?: LocalizedField<string>;
    backgroundImageBynder?: IBynderAssets;
    pot1Image?: LocalizedField<string>;
    pot1ImageBynder?: IBynderAssets;
    pot2Image?: LocalizedField<string>;
    pot2ImageBynder?: IBynderAssets;
    pot3Image?: LocalizedField<string>;
    pot3ImageBynder?: IBynderAssets;
    pot4Image?: LocalizedField<string>;
    pot4ImageBynder?: IBynderAssets;
}

export type JackpotType =
    | 'bingo-jackpots'
    | 'blueprint-jackpots'
    | 'everi-jackpots'
    | 'mega-moolah-jackpots'
    | 'netent-jackpots'
    | 'red-tiger-jackpots'
    | 'roxor-jackpots'
    | 'sg-digital-jackpots'
    | 'headless-jackpots';

export type ISectionGameOnlyQuery = Pick<ISection, 'games' | 'name' | 'entryTitle' | 'sort'>;

export interface Slide {
    image: string;
    link: string;
    representativeColor: string;
}

interface GameLink {
    sys: SystemLink;
}

// Lambda Contract Response interface
export interface ISectionGame {
    entryId: string;
    gameId: string;
    name?: string;
    gameType?: string;
    title?: string;
    dfgWeeklyImgUrlPattern?: string;
    gameSkin?: string;
    imgUrlPattern?: string;
    realUrl?: string;
    representativeColor?: string;
    size?: Record<string, boolean>;
    demoUrl?: string;
    isProgressiveJackpot?: boolean;
    progressiveBackgroundColor?: string;
    loggedOutImgUrlPattern?: string;
    sash?: Record<string, string> | string;
    videoUrlPattern?: string;
    tags?: string[];
    webComponentData?: IWebComponentData;
    bynderDFGWeeklyImage?: object;
    headlessJackpot?: object;
    animationMedia?: string;
    loggedOutAnimationMedia?: string;
    foregroundLogoMedia?: object;
    loggedOutForegroundLogoMedia?: object;
    backgroundMedia?: object;
    loggedOutBackgroundMedia?: object;
    liveHidden?: boolean;
}

export interface IGameConfigResponse {
    chat?: object;
    funPanelEnabled: boolean;
    vendor: string;
    minBet: string;
    maxBet: string;
    entryId: string;
    mobileOverride: boolean;
    gameName?: string;
    launchCode?: string;
    gameSkin?: string;
    demoUrl?: string;
    realUrl?: string;
    gameLoaderFileName?: string;
    mobileName?: string;
    mobileGameSkin?: string;
    mobileDemoUrl?: string;
    mobileRealUrl?: string;
    headlessJackpot?: object;
    mobileGameLoaderFileName?: string;
    gameStudio?: string;
    gameProvider?: string;
    gameType: object;
    showNetPosition: boolean;
    liveHidden?: boolean;
}

export interface IGameSkinConfigResponse {
    gameName: string;
    gameType: string;
}

export interface IGameInfoResponse {
    entryId: string;
    gameSkin: string;
    gameType?: string;
    name: string;
    realUrl: string;
    title: string;
    demoUrl?: string;
    howToPlayContent: string;
    infoDetails: string;
    infoImgUrlPattern: string;
    introductionContent: string;
    maxBet: string;
    minBet: string;
    representativeColor: string;
    animationMedia?: string;
    backgroundImage?: string;
    loggedOutAnimationMedia?: string;
    foregroundLogoMedia?: SanitizedBynder;
    loggedOutForegroundLogoMedia?: SanitizedBynder;
    backgroundMedia?: SanitizedBynder;
    loggedOutBackgroundMedia?: SanitizedBynder;
    funPanelGame: FunPanelGame | boolean;
    showNetPosition: boolean;
    liveHidden?: boolean;
}

export type FunPanelGame = { defaultCategory: string };
