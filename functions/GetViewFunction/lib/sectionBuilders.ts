import { tryGetValueFromLocalised, IGLinkItemWithViewSlug, extendedViewSlugProp } from 'os-client';
import {
    IBannerSection,
    IBannerSectionOS,
    IBrazePromosSection,
    IBrazePromosSectionOS,
    IDFGSection,
    IDFGSectionOS,
    IGameSection,
    IGameSectionOS,
    IJackpotSection,
    IJackpotSectionOS,
    IJackpotSectionsBlock,
    IJackpotSectionsBlockOS,
    IMarketingSection,
    IMarketingSectionOS,
    IPersonalisedSection,
    IPersonalisedSectionOS,
    IQuickLinksSection,
    IQuickLinksSectionOS,
    ISearchPlaceholderSection,
    ISearchPlaceholderSectionOS,
    IPromotionsGridSection,
    IPromotionsGridSectionOS,
    QuickLinksLayoutType,
    IGameShuffleOS,
    IGameShuffleSection,
} from './types';

type QuickLinksParams = {
    section: IQuickLinksSectionOS;
    children: IGLinkItemWithViewSlug[];
    spaceLocale: string;
    userLocale: string;
};
type ViewAllActionTypeText = 'none' | 'section' | 'view';
const getViewAllActionTypeText = (viewAllActionType?: string): ViewAllActionTypeText => {
    if (viewAllActionType === 'auto') {
        return 'section';
    }
    if (viewAllActionType === 'view') {
        return 'view';
    }
    return 'none';
};

/**
 * Decide whether to show the “View All” link for a game section.
 *
 * @param isTruncated - Whether the section is truncated (defaults to false)
 * @param viewAllActionTypeText - Already-mapped action type text ('none', 'section', or 'view')
 * @returns `true` if the View All link should be shown
 *
 * Logic:
 *   1. If isTruncated === false AND actionTypeText === 'none' → HIDE (return false)
 *   2. If isTruncated === false (and actionTypeText !== 'none') → SHOW (return true)
 *   3. If isTruncated === true AND actionTypeText === 'view' → SHOW (return true)
 *   4. Default case (truncated + actionTypeText !== 'view') → HIDE (return false)
 */
const shouldShowGameSectionViewAll = (isTruncated = false, viewAllActionTypeText: string) => {
    if (isTruncated) {
        return viewAllActionTypeText !== 'none';
    }
    if (isTruncated === false && viewAllActionTypeText === 'view') {
        return true;
    }
    return false;
};

export const buildQuickLinksSection = ({
    section,
    children,
    spaceLocale,
    userLocale,
}: QuickLinksParams): IQuickLinksSection => {
    return {
        entryId: section.id,
        classification: section.classification[spaceLocale],
        layoutType: section?.layoutType?.[spaceLocale] as QuickLinksLayoutType, // e.g. 'carousel-pill'
        links: children.map((child) => ({
            entryId: child.id,
            label: tryGetValueFromLocalised(userLocale, spaceLocale, child?.label, ''),
            ...(child?.linkedViewSlug && { viewSlug: child?.linkedViewSlug }),
            ...(child.externalUrl?.[spaceLocale] && { externalUrl: child.internalUrl?.[spaceLocale] }),
            ...(child.internalUrl?.[spaceLocale] && { internalUrl: child.internalUrl?.[spaceLocale] }),
            ...(child.image?.[spaceLocale] && {
                image: tryGetValueFromLocalised(userLocale, spaceLocale, child.image, ''),
            }),
            ...(child.bynderImage?.[spaceLocale] && {
                bynderImage: tryGetValueFromLocalised(userLocale, spaceLocale, child.bynderImage, {}),
            }),
            ...(child.liveHidden?.[spaceLocale] && { liveHidden: child.liveHidden?.[spaceLocale] }),
        })),
    };
};

type MarketingParams = {
    section: IMarketingSectionOS & extendedViewSlugProp;
    children: IBannerSectionOS[];
    spaceLocale: string;
    userLocale: string;
};
export const buildMarketingSection = ({
    section,
    children,
    spaceLocale,
    userLocale,
}: MarketingParams): IMarketingSection => {
    const viewAllActionTypeText = getViewAllActionTypeText(section?.viewAllType?.[spaceLocale]);
    const showViewAll = viewAllActionTypeText !== 'none';
    const viewAllObj = {
        viewAllActionSlug: section?.linkedViewSlug || '',
        viewAllActionType: viewAllActionTypeText,
        viewAllActionText: section?.viewAllActionText?.[spaceLocale] || '',
    };

    return {
        entryId: section.id,
        classification: section.classification[spaceLocale],
        title: tryGetValueFromLocalised(userLocale, spaceLocale, section.title, ''),
        displayType: section?.displayType?.[spaceLocale] || '',
        elements: children.map((child) => ({
            entryId: child.id,
            title: tryGetValueFromLocalised(userLocale, spaceLocale, child.title, ''),
            ...(child.imageUrl?.[spaceLocale] && { image: child.imageUrl?.[spaceLocale] }),
            ...(child.videoUrl?.[spaceLocale] && { video: child.videoUrl?.[spaceLocale] }),
            ...(child.bynderMedia?.[spaceLocale] && { bynderMedia: child.bynderMedia?.[spaceLocale] }),
            ...(child.bannerLink?.[spaceLocale] && { bannerLink: child.bannerLink?.[spaceLocale] }),
        })),
        ...(showViewAll && { viewAll: viewAllObj }),
        // TODO: revisit below for EU
        // "layoutType": "carousel-a",
    };
};

type JackpotSectionsBlockParams = {
    section: IJackpotSectionsBlockOS;
    children: (IJackpotSectionOS & extendedViewSlugProp)[];
    spaceLocale: string;
    userLocale: string;
};
export const buildJackpotSectionsBlock = ({
    section,
    children,
    spaceLocale,
    userLocale,
}: JackpotSectionsBlockParams): IJackpotSectionsBlock => {
    return {
        entryId: section.id,
        classification: section.classification[spaceLocale],
        title: tryGetValueFromLocalised(userLocale, spaceLocale, section.title, ''),
        layoutType: section?.layoutType?.[spaceLocale],
        jackpots: children.map((child) => {
            const viewAllActionTypeText = getViewAllActionTypeText(child?.viewAllType?.[spaceLocale]);
            const showViewAll = viewAllActionTypeText !== 'none';
            const viewAllObj = {
                viewAllActionSlug: child?.linkedViewSlug || child?.slug?.[spaceLocale],
                viewAllActionType: viewAllActionTypeText,
                viewAllActionText: child.viewAllActionText?.[spaceLocale] || '',
            };

            return {
                entryId: child.id,
                classification: child.classification[spaceLocale],
                title: tryGetValueFromLocalised(userLocale, spaceLocale, child.title, ''),
                type: child?.jackpotType?.[spaceLocale],
                hasGames: true,
                ...(child.headlessJackpot?.[spaceLocale] && {
                    headlessJackpot: child.headlessJackpot[spaceLocale],
                }),

                ...(child.headerImage?.[spaceLocale] && {
                    headerImage: child.headerImage[spaceLocale],
                }),
                ...(child.headerImageBynder?.[spaceLocale] && {
                    bynderHeaderImage: child.headerImageBynder[spaceLocale],
                }),

                ...(child.backgroundImage?.[spaceLocale] && {
                    backgroundImage: child.backgroundImage[spaceLocale],
                }),
                ...(child.backgroundImageBynder?.[spaceLocale] && {
                    bynderBackgroundImage: child.backgroundImageBynder[spaceLocale],
                }),

                ...(child.pot1Image?.[spaceLocale] && {
                    pot1Image: child.pot1Image[spaceLocale],
                }),
                ...(child.pot1ImageBynder?.[spaceLocale] && {
                    bynderPot1Image: child.pot1ImageBynder[spaceLocale],
                }),

                ...(child.pot2Image?.[spaceLocale] && {
                    pot2Image: child.pot2Image[spaceLocale],
                }),
                ...(child.pot2ImageBynder?.[spaceLocale] && {
                    bynderPot2Image: child.pot2ImageBynder[spaceLocale],
                }),

                ...(child.pot3Image?.[spaceLocale] && {
                    pot3Image: child.pot3Image[spaceLocale],
                }),
                ...(child.pot3ImageBynder?.[spaceLocale] && {
                    bynderPot3Image: child.pot3ImageBynder[spaceLocale],
                }),

                ...(child.pot4Image?.[spaceLocale] && {
                    pot4Image: child.pot4Image[spaceLocale],
                }),
                ...(child.pot4ImageBynder?.[spaceLocale] && {
                    bynderPot4Image: child.pot4ImageBynder[spaceLocale],
                }),

                ...(showViewAll && { viewAll: viewAllObj }),
            };
        }),
    };
};

type PersonalisedParams = {
    section: IPersonalisedSectionOS & extendedViewSlugProp;
    spaceLocale: string;
    userLocale: string;
};
export const buildPersonalisedSection = ({
    section,
    spaceLocale,
    userLocale,
}: PersonalisedParams): IPersonalisedSection => {
    const viewAllActionTypeText = getViewAllActionTypeText(section?.viewAllType?.[spaceLocale]);
    const showViewAll = viewAllActionTypeText !== 'none';
    const viewAllObj = {
        viewAllActionSlug: section?.linkedViewSlug ?? section?.slug?.[spaceLocale],
        viewAllActionType: viewAllActionTypeText,
        viewAllActionText: section.viewAllActionText?.[spaceLocale] ?? '',
    };

    return {
        entryId: section.id,
        classification: section?.classification?.[spaceLocale],
        title: tryGetValueFromLocalised(userLocale, spaceLocale, section.title, ''),
        hasGames: true,
        layoutType: section?.layoutType?.[spaceLocale] as 'carousel-a' | 'carousel-b',
        type: section?.type?.[spaceLocale],
        ...(showViewAll && { viewAll: viewAllObj }),
    };
};

type BrazePromosParams = {
    section: IBrazePromosSectionOS;
    spaceLocale: string;
    userLocale: string;
};

export const buildBrazePromosSection = ({
    section,
    spaceLocale,
    userLocale,
}: BrazePromosParams): IBrazePromosSection => {
    const title = tryGetValueFromLocalised(userLocale, spaceLocale, section.title, '');
    return {
        entryId: section.id,
        ...(title && { title: title }),
        classification: section.classification[spaceLocale],
    };
};

type BannerParams = {
    section: IBannerSectionOS & extendedViewSlugProp;
    spaceLocale: string;
    userLocale: string;
};

export const buildBannerSection = ({ section, spaceLocale, userLocale }: BannerParams): IBannerSection => {
    const bannerType = section?.bannerType?.[spaceLocale];

    // can be hero banner or default to media banner
    if (bannerType === 'hero') {
        return {
            entryId: section.id,
            classification: section?.classification?.[spaceLocale],
            title: tryGetValueFromLocalised(userLocale, spaceLocale, section.title, ''),
            displaySize: section?.displaySize?.[spaceLocale] || '',

            // only include if present
            ...(section?.bannerType?.[spaceLocale] && {
                bannerType: section.bannerType[spaceLocale],
            }),
            ...(section?.imageUrl?.[spaceLocale] && {
                image: section.imageUrl[spaceLocale],
            }),
            ...(section?.bannerLink?.[spaceLocale] && {
                bannerLink: section.bannerLink[spaceLocale],
            }),
        };
    } else {
        return {
            entryId: section.id,
            classification: section?.classification?.[spaceLocale],
            title: tryGetValueFromLocalised(userLocale, spaceLocale, section.title, ''),
            displaySize: section?.displaySize?.[spaceLocale] || '',

            // only include if present
            ...(section?.imageUrl?.[spaceLocale] && {
                image: section.imageUrl[spaceLocale],
            }),
            ...(section?.videoUrl?.[spaceLocale] && {
                video: section.videoUrl[spaceLocale],
            }),
            ...(section?.bynderMedia?.[spaceLocale] && {
                bynderMedia: section.bynderMedia[spaceLocale],
            }),
            ...(section?.bannerLink?.[spaceLocale] && {
                bannerLink: section.bannerLink[spaceLocale],
            }),
            ...(section?.bannerType?.[spaceLocale] && {
                bannerType: section.bannerType[spaceLocale],
            }),
        };
    }
};

type GameParams = {
    section: IGameSectionOS & extendedViewSlugProp;
    spaceLocale: string;
    userLocale: string;
    sessionVisibility: string;
};

export const buildGameSection = ({ section, spaceLocale, userLocale, sessionVisibility }: GameParams): IGameSection => {
    const neverTruncate = section?.sectionTruncation?.[spaceLocale]?.includes('never') ?? false;
    const isTruncated = !neverTruncate;

    const gridCBynderMedia =
        sessionVisibility === 'loggedIn'
            ? section?.mediaLoggedIn?.[spaceLocale]
            : section?.mediaLoggedOut?.[spaceLocale];
    // ViewAll logic
    const viewActionTypeText = getViewAllActionTypeText(section?.viewAllType?.[spaceLocale]);
    const shouldShow = shouldShowGameSectionViewAll(isTruncated, viewActionTypeText);

    return {
        entryId: section.id,
        classification: section?.classification?.[spaceLocale],
        title: tryGetValueFromLocalised(userLocale, spaceLocale, section.title, ''),
        hasGames: true,
        layoutType: section?.layoutType?.[spaceLocale],

        // only for grid-a & grid-e sections that never truncate
        ...(neverTruncate && {
            neverTruncate: true,
        }),

        // only for grid-c sections
        ...(section?.image?.[spaceLocale] && {
            media: section?.image?.[spaceLocale],
        }),
        ...(gridCBynderMedia && {
            bynderMedia: gridCBynderMedia,
        }),
        ...(shouldShow && {
            viewAll: {
                viewAllActionSlug: section?.linkedViewSlug || section?.slug?.[spaceLocale],
                viewAllActionType: viewActionTypeText,
                viewAllActionText: section?.viewAllActionText?.[spaceLocale] || '',
            },
        }),
    };
};

type JackpotParams = {
    section: IJackpotSectionOS & extendedViewSlugProp;
    spaceLocale: string;
    userLocale: string;
};

export const buildJackpotSection = ({ section, spaceLocale, userLocale }: JackpotParams): IJackpotSection => {
    const viewAllActionTypeText = getViewAllActionTypeText(section?.viewAllType?.[spaceLocale]);
    const showViewAll = viewAllActionTypeText !== 'none';
    const viewAllObj = {
        viewAllActionSlug: section?.linkedViewSlug || section?.slug?.[spaceLocale],
        viewAllActionType: viewAllActionTypeText,
        viewAllActionText: section.viewAllActionText?.[spaceLocale] || '',
    };
    return {
        entryId: section.id,
        classification: section?.classification?.[spaceLocale],
        title: tryGetValueFromLocalised(userLocale, spaceLocale, section.title, ''),
        type: section?.jackpotType?.[spaceLocale],
        hasGames: true,

        ...(section.headlessJackpot?.[spaceLocale] && {
            headlessJackpot: section.headlessJackpot[spaceLocale],
        }),

        ...(section?.headerImage?.[spaceLocale] && {
            headerImage: section.headerImage[spaceLocale],
        }),
        ...(section?.headerImageBynder?.[spaceLocale] && {
            bynderHeaderImage: section.headerImageBynder[spaceLocale],
        }),

        ...(section?.backgroundImage?.[spaceLocale] && {
            backgroundImage: section.backgroundImage[spaceLocale],
        }),
        ...(section?.backgroundImageBynder?.[spaceLocale] && {
            bynderBackgroundImage: section.backgroundImageBynder[spaceLocale],
        }),

        ...(section?.pot1Image?.[spaceLocale] && {
            pot1Image: section.pot1Image[spaceLocale],
        }),
        ...(section?.pot1ImageBynder?.[spaceLocale] && {
            bynderPot1Image: section.pot1ImageBynder[spaceLocale],
        }),

        ...(section?.pot2Image?.[spaceLocale] && {
            pot2Image: section.pot2Image[spaceLocale],
        }),
        ...(section?.pot2ImageBynder?.[spaceLocale] && {
            bynderPot2Image: section.pot2ImageBynder[spaceLocale],
        }),

        ...(section?.pot3Image?.[spaceLocale] && {
            pot3Image: section.pot3Image[spaceLocale],
        }),
        ...(section?.pot3ImageBynder?.[spaceLocale] && {
            bynderPot3Image: section.pot3ImageBynder[spaceLocale],
        }),

        ...(section?.pot4Image?.[spaceLocale] && {
            pot4Image: section.pot4Image[spaceLocale],
        }),
        ...(section?.pot4ImageBynder?.[spaceLocale] && {
            bynderPot4Image: section.pot4ImageBynder[spaceLocale],
        }),

        ...(showViewAll && { viewAll: viewAllObj }),
    };
};

type DFGParams = {
    section: IDFGSectionOS;
    spaceLocale: string;
    userLocale: string;
};

export const buildDFGSection = ({ section, spaceLocale, userLocale }: DFGParams): IDFGSection => {
    return {
        entryId: section.id,
        classification: section?.classification[spaceLocale],
        title: tryGetValueFromLocalised(userLocale, spaceLocale, section.title, ''),
        hasGames: true,

        // optional simple fields
        ...(section?.media?.[spaceLocale] && {
            media: section.media[spaceLocale],
        }),
        ...(section?.dynamicBackground?.[spaceLocale] && {
            dynamicBackground: section.dynamicBackground[spaceLocale],
        }),
        ...(section?.dynamicLogo?.[spaceLocale] && {
            dynamicLogo: section.dynamicLogo[spaceLocale],
        }),

        // optional Bynder assets
        ...(section?.bynderMedia?.[spaceLocale] && {
            bynderMedia: section.bynderMedia[spaceLocale],
        }),
        ...(section?.bynderDynamicBackground?.[spaceLocale] && {
            bynderDynamicBackground: section.bynderDynamicBackground[spaceLocale],
        }),
        ...(section?.bynderDynamicLogo?.[spaceLocale] && {
            bynderDynamicLogo: section.bynderDynamicLogo[spaceLocale],
        }),

        // optional link
        ...(section?.link?.[spaceLocale] && {
            link: section.link[spaceLocale],
        }),
    };
};

type SearchResultsParams = {
    section: ISearchPlaceholderSectionOS;
    spaceLocale: string;
    userLocale: string;
};

/**
 * Build a simple “Search Results” section payload.
 */
export const buildSearchResultsSection = ({
    section,
    spaceLocale,
    userLocale,
}: SearchResultsParams): ISearchPlaceholderSection => {
    return {
        entryId: section.id,
        classification: section.classification?.[spaceLocale],
        title: tryGetValueFromLocalised(userLocale, spaceLocale, section.title, ''),
        layoutType: section?.layoutType?.[spaceLocale],
    };
};

type PromotionGridsParams = {
    section: IPromotionsGridSectionOS;
    spaceLocale: string;
    userLocale: string;
};

export const buildPromotionGridSection = ({
    section,
    spaceLocale,
    userLocale,
}: PromotionGridsParams): IPromotionsGridSection => {
    return {
        entryId: section.id,
        classification: section.classification?.[spaceLocale],
        title: tryGetValueFromLocalised(userLocale, spaceLocale, section.title, ''),
    };
};

type GameShuffleParams = {
    section: IGameShuffleOS;
    spaceLocale: string;
    userLocale: string;
};

export const buildGameShuffleSection = ({
    section,
    spaceLocale,
    userLocale,
}: GameShuffleParams): IGameShuffleSection => {
    return {
        entryId: section.id,
        classification: section.classification?.[spaceLocale],
        title: tryGetValueFromLocalised(userLocale, spaceLocale, section.title, ''),
        name: section.name?.[spaceLocale] || '',
    };
};
