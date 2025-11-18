import { IBynderAsset, IGLinkItem, IIGTheme, IViewAll, LocalizedField, SysReference, SystemLink } from 'os-client';
import { IViewAllOS } from 'os-client/lib/sharedInterfaces/interfaces';

export type topContent =
    | IJackpotSection
    | IJackpotSectionsBlock
    | IDFGSection
    | IBannerSection
    | IMarketingSection
    | IBrazePromosSection
    | IPersonalisedSection
    | IQuickLinksSection
    | IGameSection
    | ISearchPlaceholderSection;

export type primaryContent =
    | IJackpotSection
    | IJackpotSectionsBlock
    | IDFGSection
    | IBannerSection
    | IMarketingSection
    | IBrazePromosSection
    | IPersonalisedSection
    // | IQuickLinksSection
    | IGameSection
    | ISearchPlaceholderSection;

export interface ViewSectionResponse {
    topContent: topContent[];
    primaryContent: primaryContent[];
}

export interface IViewApiResponse extends ViewSectionResponse {
    entryId: string;
    name: string;
    viewSlug: string;
    classification: string;
    liveHidden?: boolean;
    theme?: IIGTheme;
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

export interface IJackpotSectionOS extends IViewAllOS {
    id: string;
    classification: LocalizedField<string>;
    title: LocalizedField<string>;
    jackpotType: LocalizedField<JackpotType>;
    slug: LocalizedField<string>;
    headlessJackpot?: LocalizedField<{
        id: number;
        name: string;
    }>;
    headerImage?: LocalizedField<string>;
    headerImageBynder?: LocalizedField<IBynderAsset>;
    backgroundImage?: LocalizedField<string>;
    backgroundImageBynder?: LocalizedField<IBynderAsset>;
    pot1Image?: LocalizedField<string>;
    pot1ImageBynder?: LocalizedField<IBynderAsset>;
    pot2Image?: LocalizedField<string>;
    pot2ImageBynder?: LocalizedField<IBynderAsset>;
    pot3Image?: LocalizedField<string>;
    pot3ImageBynder?: LocalizedField<IBynderAsset>;
    pot4Image?: LocalizedField<string>;
    pot4ImageBynder?: LocalizedField<IBynderAsset>;
}

export interface IJackpotSection {
    entryId: string;
    classification: string;
    title: string;
    type: JackpotType;
    hasGames: boolean;
    headlessJackpot?: {
        id: number;
        name: string;
    };
    headerImage?: string;
    bynderHeaderImage?: IBynderAsset;
    backgroundImage?: string;
    bynderBackgroundImage?: IBynderAsset;
    pot1Image?: string;
    bynderPot1Image?: IBynderAsset;
    pot2Image?: string;
    bynderPot2Image?: IBynderAsset;
    pot3Image?: string;
    bynderPot3Image?: IBynderAsset;
    pot4Image?: string;
    bynderPot4Image?: IBynderAsset;
    viewAll?: IViewAll;
}

export interface IJackpotSectionsBlockOS {
    id: string;
    classification: LocalizedField<string>;
    title: LocalizedField<string>;
    layoutType: LocalizedField<string>;
    jackpots: LocalizedField<SysReference<SystemLink>[]>;
}

export interface IJackpotSectionsBlock {
    entryId: string;
    classification: string;
    title: string;
    layoutType: string;
    jackpots: IJackpotSection[];
}

export interface IDFGSectionOS {
    id: string;
    classification: LocalizedField<string>;
    title: LocalizedField<string>;
    media?: LocalizedField<string>;
    dynamicBackground?: LocalizedField<string>;
    dynamicLogo?: LocalizedField<string>;
    bynderMedia?: LocalizedField<IBynderAsset>;
    bynderDynamicBackground?: LocalizedField<IBynderAsset>;
    bynderDynamicLogo?: LocalizedField<IBynderAsset>;
    link?: LocalizedField<string>;
}

export interface IDFGSection {
    entryId: string;
    classification: string;
    title: string;
    hasGames?: boolean;
    media?: string;
    dynamicBackground?: string;
    dynamicLogo?: string;
    bynderMedia?: IBynderAsset;
    bynderDynamicBackground?: IBynderAsset;
    bynderDynamicLogo?: IBynderAsset;
    link?: string;
}

export interface IBannerSectionOS {
    id: string;
    title: LocalizedField<string>;
    contentType: string;
    classification: LocalizedField<string>;
    displaySize: LocalizedField<string>;
    bynderMedia?: LocalizedField<IBynderAsset>;
    imageUrl?: LocalizedField<string>;
    videoUrl?: LocalizedField<string>;
    bannerLink?: LocalizedField<string>;
    representativeColor?: LocalizedField<string>;
    bannerType?: LocalizedField<string>;
}

export interface IBannerSection {
    entryId: string;
    classification?: string;
    title: string;
    displaySize?: string;
    image?: string;
    video?: string;
    bynderMedia?: IBynderAsset;
    bannerLink?: string;
    bannerType?: string;
}

export interface IMarketingSectionOS extends IViewAllOS {
    id: string;
    title: LocalizedField<string>;
    contentType: string;
    classification: LocalizedField<string>;
    displayType: LocalizedField<string>;
    banners: LocalizedField<SysReference<SystemLink>[]>;
    // viewAllAction?: LocalizedField<string>;
    // viewAllActionText?: LocalizedField<string>;
    // viewAllType?: LocalizedField<string>;
}

export interface IMarketingSection {
    entryId: string;
    classification: string;
    title: string;
    displayType: string;
    elements: IBannerSection[];
    viewAll?: IViewAll;
}

export interface IBrazePromosSectionOS {
    id: string;
    title?: LocalizedField<string>;
    classification: LocalizedField<string>;
}

export interface IBrazePromosSection {
    entryId: string;
    title?: string;
    classification: string;
}

export interface IPersonalisedSectionOS extends IViewAllOS {
    id: string;
    classification: LocalizedField<string>;
    title: LocalizedField<string>;
    slug: LocalizedField<string>;
    layoutType: LocalizedField<'carousel-a' | 'carousel-b'>;
    type: LocalizedField<string>;
}

export interface IPersonalisedSection {
    entryId: string;
    classification: string;
    title: string;
    hasGames: boolean;
    layoutType: 'carousel-a' | 'carousel-b';
    type: string;
    viewAll?: IViewAll;
}

export interface IQuickLinksSectionOS {
    id: string;
    classification: LocalizedField<string>;
    layoutType: LocalizedField<string>;
    contentType: string;
    links: LocalizedField<SysReference<SystemLink>[]>;
}

export type QuickLinksLayoutType = 'carousel-pill' | 'carousel' | 'grid' | 'list';

export interface IQuickLinksSection {
    entryId: string;
    layoutType: QuickLinksLayoutType;
    classification: string;
    links: IGLinkItem[];
}

export type GamesLayoutType =
    | 'grid-a'
    | 'grid-b'
    | 'grid-c'
    | 'grid-d'
    | 'grid-e'
    | 'grid-g'
    | 'carousel-a'
    | 'carousel-b';

export interface IGameSectionOS extends IViewAllOS {
    id: string;
    classification: LocalizedField<string>;
    title: LocalizedField<string>;
    slug: LocalizedField<string>;
    hasGames?: boolean;
    layoutType: LocalizedField<GamesLayoutType>;

    // only grid-a & grid-e
    sectionTruncation?: LocalizedField<string>;

    // only grid-c
    media?: LocalizedField<string>;
    image?: LocalizedField<string>;
    bynderMedia?: LocalizedField<IBynderAsset>;
    mediaLoggedIn?: LocalizedField<IBynderAsset>;
    mediaLoggedOut?: LocalizedField<IBynderAsset>;
}

export interface IGameSection {
    entryId: string;
    classification: string;
    title: string;
    hasGames?: boolean;
    layoutType: GamesLayoutType;

    // only grid-a & grid-e
    neverTruncate?: boolean;

    // only grid-c
    media?: string;
    bynderMedia?: IBynderAsset;

    // both carousels & all grids
    viewAll?: IViewAll;
}

export interface ISearchPlaceholderSectionOS {
    id: string;
    classification: LocalizedField<'SearchResultsSection'>;
    title: LocalizedField<string>;
    layoutType: LocalizedField<string>;
}

export interface ISearchPlaceholderSection {
    entryId: string;
    classification: 'SearchResultsSection';
    title?: string;
    layoutType: string;
}

export interface IPromotionsGridSectionOS {
    id: string;
    classification: LocalizedField<'PromotionsGridSection'>;
    title: LocalizedField<string>;
}

export interface IPromotionsGridSection {
    entryId: string;
    classification: 'PromotionsGridSection';
    title?: string;
}

export interface IGameShuffleOS {
    id: string;
    classification: LocalizedField<'GameShuffleSection'>;
    title: LocalizedField<string>;
    name: LocalizedField<string>;
}

export interface IGameShuffleSection {
    entryId: string;
    classification: 'GameShuffleSection';
    title: string;
    name: string;
}
