import {
    IClient,
    ErrorCode,
    createError,
    logError,
    getHits,
    ALL_SECTIONS_SHARED_READ_ALIAS,
    LocalizedField,
    IHeadlessJackpot,
    SystemLink,
    SysReference,
    VIEW_INDEX_READ_ALIAS,
    IView,
    IGLinkItemWithViewSlug,
    extendedViewSlugProp,
    logMessage,
} from 'os-client';
import {
    buildBannerSection,
    buildBrazePromosSection,
    buildDFGSection,
    buildGameSection,
    buildJackpotSection,
    buildJackpotSectionsBlock,
    buildMarketingSection,
    buildPersonalisedSection,
    buildQuickLinksSection,
    buildSearchResultsSection,
    buildPromotionGridSection,
    buildGameShuffleSection,
} from './sectionBuilders';
import {
    IBannerSectionOS,
    IBrazePromosSectionOS,
    IDFGSectionOS,
    IGameSectionOS,
    IJackpotSectionOS,
    IJackpotSectionsBlockOS,
    IMarketingSectionOS,
    IPersonalisedSectionOS,
    IQuickLinksSectionOS,
    ISearchPlaceholderSectionOS,
    IPromotionsGridSectionOS,
    ViewSectionResponse,
    topContent as TopSectionType,
    primaryContent as PrimarySectionType,
    IGameShuffleOS,
} from './types';

export interface IGSection {
    // Core identifiers
    id: string;
    contentType: string;
    classification: LocalizedField<string>;

    // Common localized fields (from example hits)
    entryTitle?: LocalizedField<string>;
    title?: LocalizedField<string>;
    viewAllAction?: LocalizedField<SysReference<SystemLink>>;
    view?: LocalizedField<SysReference<SystemLink>>;
    viewAllActionText?: LocalizedField<string>;
    layoutType?: LocalizedField<string>;
    viewAllType?: LocalizedField<string>;
    slug?: LocalizedField<string>;
    expandedSectionLayoutType?: LocalizedField<string>;
    sectionTruncation?: LocalizedField<string[]>;

    // Relationship fields that need further resolution
    links?: LocalizedField<SysReference<SystemLink>[]>;
    banners?: LocalizedField<SysReference<SystemLink>[]>;
    jackpots?: LocalizedField<SysReference<SystemLink>[]>;

    // Other optional fields
    name?: LocalizedField<string>;
    type?: LocalizedField<string>;
    jackpotType?: LocalizedField<string>;
    videoUrl?: LocalizedField<string>;
    image?: LocalizedField<string>;
    highlightColor?: LocalizedField<string>;
    headlessJackpot?: LocalizedField<IHeadlessJackpot>;

    // mutated prop
    linkedViewSlug?: string;
}

export interface GetSectionsParams {
    client: IClient;
    topContent: string[];
    primaryContent: string[];
    siteName: string;
    spaceLocale: string;
    userLocale: string;
    envVisibility: string;
    sessionVisibility: string;
    platform: string;
}

interface BuildSectionQueryParams {
    sectionIds: string[];
    platform: string;
    spaceLocale: string;
    sessionVisibility: string;
    envVisibility: string;
}

export const buildSectionsQuery = ({
    sectionIds,
    platform,
    spaceLocale,
    sessionVisibility,
    envVisibility,
}: BuildSectionQueryParams) => {
    const platformField = `platformVisibility.${spaceLocale}.keyword`;
    const environmentField = `environmentVisibility.${spaceLocale}.keyword`;
    const sessionField = `sessionVisibility.${spaceLocale}.keyword`;

    return {
        _source: {
            excludes: [
                'cmsEnv',
                'updatedAt',
                'createdAt',
                'publishedAt',
                'games',
                'environmentVisibility',
                'platformVisibility',
                'sessionVisibility',
                'venture',
            ],
        },
        query: {
            constant_score: {
                filter: {
                    bool: {
                        must: [
                            {
                                ids: {
                                    values: sectionIds,
                                },
                            },
                        ],
                        filter: [
                            { term: { [platformField]: platform } },
                            { term: { [environmentField]: envVisibility } },
                            { term: { [sessionField]: sessionVisibility } },
                        ],
                    },
                },
            },
        },
        size: 100,
    };
};

type ParentChildMap = {
    parentToChildIds: Record<string, string[]>;
    allChildIds: string[];
};

const processComplexSections = (hits: IGSection[], spaceLocale: string): ParentChildMap => {
    const { parentToChildIds, allChildIdSet } = hits.reduce<{
        parentToChildIds: Record<string, string[]>;
        allChildIdSet: Set<string>;
    }>(
        (acc, sec) => {
            // pull the localized classification
            const cls = sec.classification?.[spaceLocale];
            let children: string[] = [];

            if (cls === 'QuickLinksSection') {
                children = (sec.links?.[spaceLocale] || []).map((l) => l.sys.id);
            } else if (cls === 'MarketingSection') {
                children = (sec.banners?.[spaceLocale] || []).map((e) => e.sys.id);
            } else if (cls === 'JackpotSectionsBlock') {
                children = (sec.jackpots?.[spaceLocale] || []).map((j) => j.sys.id);
            }

            if (children.length) {
                acc.parentToChildIds[sec.id] = children;
                children.forEach((id) => acc.allChildIdSet.add(id));
            }

            return acc;
        },
        {
            parentToChildIds: {},
            allChildIdSet: new Set<string>(),
        },
    );

    return {
        parentToChildIds,
        allChildIds: Array.from(allChildIdSet),
    };
};

interface SectionsLinkedViews {
    sectionsMap: Record<string, string>;
    allViewIds: string[];
}
// collectViewIds of the hits so we can get the viewSlug {sectionViewMap: {section: [viewAllAction]}, allviewids[]}
function collectSectionViewAllIds(hits: IGSection[], spaceLocale: string): SectionsLinkedViews {
    // We'll accumulate into a temp Set for dedupe
    const { sectionsMap, viewIdSet } = hits.reduce<{
        sectionsMap: Record<string, string>;
        viewIdSet: Set<string>;
    }>(
        (acc, sec) => {
            // pick whichever action ID exists
            const viewAllActionId = sec.viewAllAction?.[spaceLocale]?.sys?.id ?? sec.view?.[spaceLocale]?.sys?.id;

            if (viewAllActionId) {
                // only set it once per section
                if (!acc.sectionsMap[sec.id]) {
                    acc.sectionsMap[sec.id] = viewAllActionId;
                }
                // collect for global fetch
                acc.viewIdSet.add(viewAllActionId);
            }

            return acc;
        },
        { sectionsMap: {}, viewIdSet: new Set<string>() },
    );

    return {
        sectionsMap,
        allViewIds: Array.from(viewIdSet),
    };
}

const extractSectionData = async (
    client: IClient,
    osQuery: object,
    spaceLocale: string,
    userLocale: string,
    topContent: string[],
    primaryContent: string[],
    platform: string,
    sessionVisibility: string,
    envVisibility: string,
    siteName: string,
): Promise<ViewSectionResponse> => {
    const hits: IGSection[] = await getHits(client, osQuery, ALL_SECTIONS_SHARED_READ_ALIAS);

    if (hits.length === 0) {
        logMessage('warn', ErrorCode.MissingSections, {
            siteName,
            platform,
            requested: [...topContent, ...primaryContent],
            hits,
        });
        throw createError(ErrorCode.MissingSections, 404);
    }

    // collectViewIds of the hits so we can get the viewSlug {sectionViewMap: {section: [viewAllAction]}, allviewids[]}
    const { sectionsMap, allViewIds } = collectSectionViewAllIds(hits, spaceLocale);

    /* --------------------------- COLLECT parent→child IDs & FLAT LIST and FETCH CHILD SECTIONS--------------------------- */

    const { parentToChildIds, allChildIds } = processComplexSections(hits, spaceLocale);

    const childSectionQuery = buildSectionsQuery({
        sectionIds: allChildIds,
        platform,
        spaceLocale,
        sessionVisibility,
        envVisibility,
    });

    // fetch all child sections in one go
    const childRecords: IGSection[] = (await getHits(client, childSectionQuery, ALL_SECTIONS_SHARED_READ_ALIAS)) || [];

    const { sectionsMap: subsectionMap, allViewIds: subsectionViewIds } = collectSectionViewAllIds(
        childRecords,
        spaceLocale,
    );

    /* --------------------------- FETCH LINKED VIEWS --------------------------- */
    const allViewIdsToFetch = [...subsectionViewIds, ...allViewIds];

    const linkedViewsQuery = buildSectionsQuery({
        sectionIds: allViewIdsToFetch,
        platform,
        spaceLocale,
        sessionVisibility,
        envVisibility,
    });

    const linkedViewRecords: IView[] = (await getHits(client, linkedViewsQuery, VIEW_INDEX_READ_ALIAS)) || [];
    // make a map to access later as viewIdToSlug[someId]
    const viewIdToSlug: Record<string, string> = linkedViewRecords.reduce(
        (acc, rec) => {
            const slug = rec.viewSlug?.[spaceLocale];
            if (slug) {
                acc[rec.id] = slug;
            }
            return acc;
        },
        {} as Record<string, string>,
    );

    /* --------------------------- MAKE CHILD SECTIONS INTO MAP AND ADD THE SLUG INTO THE RECORD  --------------------------- */
    const childById = new Map<string, IGSection & { linkedViewSlug?: string }>(
        childRecords.map((rec) => {
            // look up the viewAllAction ID for this child
            const viewId = subsectionMap[rec.id];
            // then turn that into a slug
            const linkedViewSlug = viewIdToSlug[viewId];

            // return a tuple [key, value] where value has viewAllSlug injected if it exists
            return [rec.id, linkedViewSlug ? { ...rec, linkedViewSlug } : rec] as [
                string,
                IGSection & { linkedViewSlug?: string },
            ];
        }),
    );

    // build one section by delegating to its specific builder
    const buildSection = (id: string): TopSectionType | PrimarySectionType | null => {
        const sec = hits.find((h) => h.id === id);
        if (!sec) return null;

        // Add the viewAll slug to the section form the lookups
        if (sec?.viewAllType?.[spaceLocale] === 'view') {
            const linkedViewId = sectionsMap[id];
            // mutating in place so we have the viewSlug
            sec.linkedViewSlug = viewIdToSlug[linkedViewId];
        }

        const cls = sec?.classification?.[spaceLocale] || '';

        // only extract children for these three section classifications as they are the only ones having linked sections
        // let children: IGSection[] = [];
        let children: IGSection[] | IGLinkItemWithViewSlug[] | IBannerSectionOS[] | IJackpotSectionOS[] = [];
        if (cls === 'QuickLinksSection' || cls === 'MarketingSection' || cls === 'JackpotSectionsBlock') {
            const ids = parentToChildIds[id] || [];
            children = ids.map((cid) => childById.get(cid)).filter((item): item is IGSection => !!item);
        }

        switch (cls) {
            case 'QuickLinksSection':
                return buildQuickLinksSection({
                    section: sec as IQuickLinksSectionOS,
                    children: children as IGLinkItemWithViewSlug[],
                    spaceLocale,
                    userLocale,
                });

            case 'MarketingSection':
                return buildMarketingSection({
                    section: sec as IMarketingSectionOS & extendedViewSlugProp,
                    children: children as IBannerSectionOS[],
                    spaceLocale,
                    userLocale,
                });

            case 'JackpotSectionsBlock':
                return buildJackpotSectionsBlock({
                    section: sec as IJackpotSectionsBlockOS,
                    children: children as IJackpotSectionOS[],
                    spaceLocale,
                    userLocale,
                });

            case 'PersonalisedSection':
                return buildPersonalisedSection({ section: sec as IPersonalisedSectionOS, spaceLocale, userLocale });

            case 'BrazePromosSection':
                return buildBrazePromosSection({ section: sec as IBrazePromosSectionOS, spaceLocale, userLocale });

            case 'BannerSection':
                return buildBannerSection({ section: sec as IBannerSectionOS, spaceLocale, userLocale });

            case 'GameSection':
                return buildGameSection({
                    section: sec as IGameSectionOS,
                    spaceLocale,
                    userLocale,
                    sessionVisibility,
                });

            case 'JackpotSection':
                return buildJackpotSection({ section: sec as IJackpotSectionOS, spaceLocale, userLocale });

            case 'DFGSection':
                return buildDFGSection({ section: sec as IDFGSectionOS, spaceLocale, userLocale });

            case 'SearchResultsSection':
                return buildSearchResultsSection({
                    section: sec as ISearchPlaceholderSectionOS,
                    spaceLocale,
                    userLocale,
                });

            case 'PromotionsGridSection':
                return buildPromotionGridSection({
                    section: sec as IPromotionsGridSectionOS,
                    spaceLocale,
                    userLocale,
                });

            case 'GameShuffleSection':
                return buildGameShuffleSection({
                    section: sec as IGameShuffleOS,
                    spaceLocale,
                    userLocale,
                });

            default:
                // optionally throw or return a minimal payload
                return {
                    entryId: sec.id,
                    classification: cls,
                };
        }
    };

    // build both lists in the exact input order
    const topResults = topContent.map(buildSection).filter((r): r is TopSectionType => r !== null);
    const primaryResults = primaryContent.map(buildSection).filter((r): r is PrimarySectionType => r !== null);

    return { topContent: topResults, primaryContent: primaryResults };
};

export const getSections = async ({
    client,
    topContent,
    primaryContent,
    spaceLocale,
    userLocale,
    sessionVisibility,
    envVisibility,
    platform,
    siteName,
}: GetSectionsParams): Promise<ViewSectionResponse> => {
    const sectionIds = [...topContent, ...primaryContent];

    const getSectionsQuery = buildSectionsQuery({
        sectionIds,
        platform,
        spaceLocale,
        sessionVisibility,
        envVisibility,
    });

    return await extractSectionData(
        client,
        getSectionsQuery,
        spaceLocale,
        userLocale,
        topContent,
        primaryContent,
        platform,
        sessionVisibility,
        envVisibility,
        siteName,
    ); // 404
};
