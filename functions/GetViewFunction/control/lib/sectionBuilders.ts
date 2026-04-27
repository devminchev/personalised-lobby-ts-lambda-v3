import {
    tryGetValueFromLocalised,
    IGLinkItemWithViewSlug,
    extendedViewSlugProp,
    sanitiseBynderAssets,
    extractBynderObject,
} from 'os-client';
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
        links: children.map((child) => {
            const bynderImage = tryGetValueFromLocalised(userLocale, spaceLocale, child?.bynderImage, null);
            const bynderImageObj = extractBynderObject(bynderImage);
            return {
                entryId: child.id,
                label: tryGetValueFromLocalised(userLocale, spaceLocale, child?.label, ''),
                ...(child?.linkedViewSlug && { viewSlug: child?.linkedViewSlug }),
                ...(child.externalUrl?.[spaceLocale] && { externalUrl: child.internalUrl?.[spaceLocale] }),
                ...(child.internalUrl?.[spaceLocale] && { internalUrl: child.internalUrl?.[spaceLocale] }),
                ...(child.image?.[spaceLocale] && {
                    image: tryGetValueFromLocalised(userLocale, spaceLocale, child.image, ''),
                }),
                ...(bynderImage && {
                    bynderImage: bynderImageObj,
                }),
                ...(child.liveHidden?.[spaceLocale] && { liveHidden: child.liveHidden?.[spaceLocale] }),
            };
        }),
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
        elements: children.map((child) => {
            const bynderMedia = child.bynderMedia?.[spaceLocale] || null;
            const bynderMediaAssets = sanitiseBynderAssets(bynderMedia);
            return {
                entryId: child.id,
                title: tryGetValueFromLocalised(userLocale, spaceLocale, child.title, ''),
                ...(child.imageUrl?.[spaceLocale] && { image: child.imageUrl?.[spaceLocale] }),
                ...(child.videoUrl?.[spaceLocale] && { video: child.videoUrl?.[spaceLocale] }),
                ...(bynderMediaAssets && { bynderMedia: bynderMediaAssets }),
                ...(child.bannerLink?.[spaceLocale] && { bannerLink: child.bannerLink?.[spaceLocale] }),
            };
        }),
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

            const bynderHeaderImageAsset = child?.headerImageBynder?.[spaceLocale] || null;
            const bynderHeaderImage = sanitiseBynderAssets(bynderHeaderImageAsset);

            const bynderBackgroundImageAsset = child?.backgroundImageBynder?.[spaceLocale] || null;
            const bynderBackgroundImage = sanitiseBynderAssets(bynderBackgroundImageAsset);

            const pot1BynderImageAsset = child?.pot1ImageBynder?.[spaceLocale] || null;
            const pot1BynderImage = sanitiseBynderAssets(pot1BynderImageAsset);

            const pot2BynderImageAsset = child?.pot2ImageBynder?.[spaceLocale] || null;
            const pot2BynderImage = sanitiseBynderAssets(pot2BynderImageAsset);

            const pot3BynderImageAsset = child.pot3ImageBynder?.[spaceLocale] || null;
            const pot3BynderImage = sanitiseBynderAssets(pot3BynderImageAsset);

            const pot4BynderImageAsset = child.pot4ImageBynder?.[spaceLocale] || null;
            const pot4BynderImage = sanitiseBynderAssets(pot4BynderImageAsset);

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
                ...(bynderHeaderImage && {
                    bynderHeaderImage,
                }),

                ...(child.backgroundImage?.[spaceLocale] && {
                    backgroundImage: child.backgroundImage[spaceLocale],
                }),
                ...(bynderBackgroundImage && {
                    bynderBackgroundImage,
                }),

                ...(child.pot1Image?.[spaceLocale] && {
                    pot1Image: child.pot1Image[spaceLocale],
                }),
                ...(pot1BynderImage && {
                    bynderPot1Image: pot1BynderImage,
                }),

                ...(child.pot2Image?.[spaceLocale] && {
                    pot2Image: child.pot2Image[spaceLocale],
                }),
                ...(pot2BynderImage && {
                    bynderPot2Image: pot2BynderImage,
                }),

                ...(child.pot3Image?.[spaceLocale] && {
                    pot3Image: child.pot3Image[spaceLocale],
                }),
                ...(pot3BynderImage && {
                    bynderPot3Image: pot3BynderImage,
                }),

                ...(child.pot4Image?.[spaceLocale] && {
                    pot4Image: child.pot4Image[spaceLocale],
                }),
                ...(pot4BynderImage && {
                    bynderPot4Image: pot4BynderImage,
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
        const bynderMediaAssets = section?.bynderMedia?.[spaceLocale] || null;
        const bynderMedia = sanitiseBynderAssets(bynderMediaAssets);
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
            ...(bynderMedia && {
                bynderMedia: bynderMedia,
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
        (sessionVisibility === 'loggedIn'
            ? section?.mediaLoggedIn?.[spaceLocale]
            : section?.mediaLoggedOut?.[spaceLocale]) || null;

    const gridCBynderMediaAsset = sanitiseBynderAssets(gridCBynderMedia);
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
        ...(gridCBynderMediaAsset && {
            bynderMedia: gridCBynderMediaAsset,
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

    const bynderHeaderImageAsset = section?.headerImageBynder?.[spaceLocale] || null;
    const bynderHeaderImage = sanitiseBynderAssets(bynderHeaderImageAsset);

    const bynderBackgroundImageAsset = section?.backgroundImageBynder?.[spaceLocale] || null;
    const bynderBackgroundImage = sanitiseBynderAssets(bynderBackgroundImageAsset);

    const pot1BynderImageAsset = section?.pot1ImageBynder?.[spaceLocale] || null;
    const pot1BynderImage = sanitiseBynderAssets(pot1BynderImageAsset);

    const pot2BynderImageAsset = section?.pot2ImageBynder?.[spaceLocale] || null;
    const pot2BynderImage = sanitiseBynderAssets(pot2BynderImageAsset);

    const pot3BynderImageAsset = section.pot3ImageBynder?.[spaceLocale] || null;
    const pot3BynderImage = sanitiseBynderAssets(pot3BynderImageAsset);

    const pot4BynderImageAsset = section.pot4ImageBynder?.[spaceLocale] || null;
    const pot4BynderImage = sanitiseBynderAssets(pot4BynderImageAsset);

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
        ...(bynderHeaderImage && {
            bynderHeaderImage,
        }),

        ...(section?.backgroundImage?.[spaceLocale] && {
            backgroundImage: section.backgroundImage[spaceLocale],
        }),
        ...(bynderBackgroundImage && {
            bynderBackgroundImage,
        }),

        ...(section?.pot1Image?.[spaceLocale] && {
            pot1Image: section.pot1Image[spaceLocale],
        }),
        ...(pot1BynderImage && {
            bynderPot1Image: pot1BynderImage,
        }),

        ...(section?.pot2Image?.[spaceLocale] && {
            pot2Image: section.pot2Image[spaceLocale],
        }),
        ...(pot2BynderImage && {
            bynderPot2Image: pot2BynderImage,
        }),

        ...(section?.pot3Image?.[spaceLocale] && {
            pot3Image: section.pot3Image[spaceLocale],
        }),
        ...(pot3BynderImage && {
            bynderPot3Image: pot3BynderImage,
        }),

        ...(section?.pot4Image?.[spaceLocale] && {
            pot4Image: section.pot4Image[spaceLocale],
        }),
        ...(pot4BynderImage && {
            bynderPot4Image: pot4BynderImage,
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
    const bynderMediaAssets = section?.bynderMedia?.[spaceLocale] || null;
    const bynderMedia = sanitiseBynderAssets(bynderMediaAssets);
    const bynderDynamicBackgroundAssets = section.bynderDynamicBackground?.[spaceLocale] || null;
    const bynderDynamicBackground = sanitiseBynderAssets(bynderDynamicBackgroundAssets);
    const bynderDynamicLogoAssets = section.bynderDynamicLogo?.[spaceLocale] || null;
    const bynderDynamicLogo = sanitiseBynderAssets(bynderDynamicLogoAssets);

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
        ...(bynderMedia && {
            bynderMedia,
        }),
        ...(bynderDynamicBackground && {
            bynderDynamicBackground,
        }),
        ...(bynderDynamicLogo && {
            bynderDynamicLogo,
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
