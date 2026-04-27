process.env.API_KEY = 'API-KEY-FOR-THE-AGES';
process.env.HOST = 'http://localhost:9200';
process.env.OS_USER = 'your-username';
process.env.OS_PASS = 'your-password';

import { lambdaHandler } from '../app';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import nock from 'nock';
import { describe, beforeEach, it, expect } from '@jest/globals';
import {
    VIEW_SUCCESS_RESP,
    SECTION_SUCCESS_RESP,
    GET_SECTIONS_SUCCESS_RESPONSE,
    NOT_FOUND_RESPONSE,
    VENTURE_SUCCESS_RESP,
    THEME_SUCCESS_RESP,
} from './mocks/responses';
import { mockApiEvent } from './mocks/gatewayMocks';
import {
    ErrorCode,
    getErrorMessage,
    VENTURES_INDEX_ALIAS,
    VIEW_INDEX_READ_ALIAS,
    ALL_SECTIONS_SHARED_READ_ALIAS,
    THEME_INDEX_READ_ALIAS,
    extendedViewSlugProp,
    getClient,
    parseCompressedBody,
} from 'os-client';
import { buildSectionsQuery, getSections } from '../control/lib/processSections';
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
} from '../control/lib/sectionBuilders';
import {
    IBannerSectionOS,
    IDFGSectionOS,
    IGameSectionOS,
    IJackpotSectionOS,
    IJackpotSectionsBlockOS,
    IMarketingSectionOS,
    IPersonalisedSectionOS,
    IQuickLinksSectionOS,
    ISearchPlaceholderSectionOS,
} from '../control/lib/types';
import { getView, GetViewParams } from '../control/lib/processViews';
import { getTheme } from '../control/lib/processTheme';

const EMPTY_BODY_RESP = {
    name: '',
    viewSlug: '',
    classification: 'general',
    topContent: [],
    primaryContent: [],
};

describe('sectionBuilders', () => {
    const spaceLocale = 'en-GB';
    const userLocale = 'en-GB';

    describe('buildQuickLinksSection', () => {
        it('should build quick links section with children', () => {
            const section: IQuickLinksSectionOS = {
                id: 'sec1',
                classification: { 'en-GB': 'QuickLinksSection' },
                layoutType: { 'en-GB': 'carousel-pill' },
                contentType: '',
                links: {},
            };
            const children = [
                {
                    id: 'child1',
                    label: { 'en-GB': 'Label1' },
                    linkedViewSlug: 'slug1',
                    internalUrl: { 'en-GB': '/internal' },
                    image: { 'en-GB': 'img1' },
                },
            ];
            const result = buildQuickLinksSection({ section, children, spaceLocale, userLocale });

            expect(result).toMatchObject({
                entryId: 'sec1',
                classification: 'QuickLinksSection',
                layoutType: 'carousel-pill',
                links: [
                    expect.objectContaining({
                        entryId: 'child1',
                        label: 'Label1',
                        viewSlug: 'slug1',
                        internalUrl: '/internal',
                        image: 'img1',
                    }),
                ],
            });
        });
    });

    describe('buildMarketingSection', () => {
        it('should build marketing section with children', () => {
            const section: IMarketingSectionOS & extendedViewSlugProp = {
                id: 'sec2',
                classification: { 'en-GB': 'MarketingSection' },
                title: { 'en-GB': 'Marketing' },
                linkedViewSlug: 'slug2',
                viewAllType: { 'en-GB': 'auto' },
                viewAllActionText: { 'en-GB': 'See All' },
                contentType: 'marketing',
                displayType: { 'en-GB': 'full' },
                banners: {},
            };
            const children: IBannerSectionOS[] = [
                {
                    id: 'banner1',
                    title: { 'en-GB': 'Banner1' },
                    contentType: 'banner',
                    classification: { 'en-GB': 'BannerSection' },
                    displaySize: { 'en-GB': 'medium' },
                },
            ];
            const result = buildMarketingSection({ section, children, spaceLocale, userLocale });
            expect(result).toMatchObject({
                entryId: 'sec2',
                classification: 'MarketingSection',
                title: 'Marketing',
                displayType: 'full',
                elements: [
                    expect.objectContaining({
                        entryId: 'banner1',
                        title: 'Banner1',
                    }),
                ],
                viewAll: {
                    viewAllActionSlug: 'slug2',
                    viewAllActionType: 'section',
                    viewAllActionText: 'See All',
                },
            });
        });
    });

    describe('buildJackpotSectionsBlock', () => {
        it('should build jackpot sections block with children', () => {
            const section: IJackpotSectionsBlockOS = {
                id: 'sec3',
                classification: { 'en-GB': 'JackpotSectionsBlock' },
                title: { 'en-GB': 'Jackpots' },
                layoutType: { 'en-GB': 'block' },
                jackpots: {},
            };
            const children: (IJackpotSectionOS & extendedViewSlugProp)[] = [
                {
                    id: 'jackpot1',
                    classification: { 'en-GB': 'JackpotSection' },
                    title: { 'en-GB': 'Jackpot1' },
                    jackpotType: { 'en-GB': 'bingo-jackpots' },
                    slug: { 'en-GB': 'jackpot1-slug' },
                    linkedViewSlug: 'slug3',
                    viewAllType: { 'en-GB': 'auto' },
                    viewAllActionText: { 'en-GB': 'All Jackpots' },
                },
            ];
            const result = buildJackpotSectionsBlock({ section, children, spaceLocale, userLocale });
            expect(result).toMatchObject({
                entryId: 'sec3',
                classification: 'JackpotSectionsBlock',
                title: 'Jackpots',
                layoutType: 'block',
                jackpots: [
                    expect.objectContaining({
                        entryId: 'jackpot1',
                        classification: 'JackpotSection',
                        title: 'Jackpot1',
                        hasGames: true,
                        type: 'bingo-jackpots',
                        viewAll: {
                            viewAllActionSlug: 'slug3',
                            viewAllActionType: 'section',
                            viewAllActionText: 'All Jackpots',
                        },
                    }),
                ],
            });
        });
    });

    describe('buildPersonalisedSection', () => {
        it('should build personalised section', () => {
            const section: IPersonalisedSectionOS & extendedViewSlugProp = {
                id: 'sec4',
                classification: { 'en-GB': 'PersonalisedSection' },
                title: { 'en-GB': 'Personal' },
                slug: { 'en-GB': 'personalised-section-slug' },
                layoutType: { 'en-GB': 'carousel-a' },
                type: { 'en-GB': 'personal' },
                linkedViewSlug: 'slug4',
                viewAllType: { 'en-GB': 'auto' },
                viewAllActionText: { 'en-GB': 'All Personal' },
            };
            const result = buildPersonalisedSection({ section, spaceLocale, userLocale });
            expect(result).toMatchObject({
                entryId: 'sec4',
                classification: 'PersonalisedSection',
                title: 'Personal',
                layoutType: 'carousel-a',
                type: 'personal',
                hasGames: true,
                viewAll: {
                    viewAllActionSlug: 'slug4',
                    viewAllActionType: 'section',
                    viewAllActionText: 'All Personal',
                },
            });
        });
    });

    describe('buildBrazePromosSection', () => {
        it('should build braze promos section', () => {
            const section = {
                id: 'sec5',
                classification: { 'en-GB': 'BrazePromosSection' },
            };
            const result = buildBrazePromosSection({ section, spaceLocale, userLocale });
            expect(result).toEqual({
                entryId: 'sec5',
                classification: 'BrazePromosSection',
            });
        });
    });

    describe('buildBannerSection', () => {
        it('should build banner section with optional fields', () => {
            const section: IBannerSectionOS & extendedViewSlugProp = {
                id: 'sec6',
                classification: { 'en-GB': 'BannerSection' },
                title: { 'en-GB': 'Banner' },
                imageUrl: { 'en-GB': 'img3' },
                videoUrl: { 'en-GB': 'vid1' },
                bannerLink: { 'en-GB': '/banner' },
                displaySize: { 'en-GB': 'small' },
                contentType: 'banner',
            };
            const result = buildBannerSection({ section, spaceLocale, userLocale });
            expect(result).toMatchObject({
                entryId: 'sec6',
                classification: 'BannerSection',
                title: 'Banner',
                image: 'img3',
                video: 'vid1',
                bannerLink: '/banner',
                displaySize: 'small',
            });
        });
    });

    describe('buildGameSection', () => {
        it('should build game section for loggedIn', () => {
            const section: IGameSectionOS & extendedViewSlugProp = {
                id: 'sec7',
                classification: { 'en-GB': 'GameSection' },
                title: { 'en-GB': 'Game' },
                layoutType: { 'en-GB': 'grid-a' },
                image: { 'en-GB': 'img4' },
                slug: { 'en-GB': 'game-section-slug' },
                linkedViewSlug: 'slug5',
                viewAllType: { 'en-GB': 'auto' },
                viewAllActionText: { 'en-GB': 'All Games' },
            };
            const result = buildGameSection({
                section,
                spaceLocale,
                userLocale,
                sessionVisibility: 'loggedIn',
            });
            expect(result).toMatchObject({
                entryId: 'sec7',
                classification: 'GameSection',
                title: 'Game',
                layoutType: 'grid-a',
                hasGames: true,
                media: 'img4',
                viewAll: {
                    viewAllActionSlug: 'slug5',
                    viewAllActionType: 'section',
                    viewAllActionText: 'All Games',
                },
            });
        });
    });

    describe('buildJackpotSection', () => {
        it('should build jackpot section with all optional fields', () => {
            const section: IJackpotSectionOS & extendedViewSlugProp = {
                id: 'sec8',
                classification: { 'en-GB': 'JackpotSection' },
                title: { 'en-GB': 'Jackpot' },
                jackpotType: { 'en-GB': 'bingo-jackpots' },
                headlessJackpot: { 'en-GB': { id: 100, name: 'headless' } },
                headerImage: { 'en-GB': 'header1' },
                backgroundImage: { 'en-GB': 'bg1' },
                pot1Image: { 'en-GB': 'pot1' },
                pot2Image: { 'en-GB': 'pot2' },
                pot3Image: { 'en-GB': 'pot3' },
                pot4Image: { 'en-GB': 'pot4' },
                slug: { 'en-GB': 'jackpot-slug' },
                linkedViewSlug: 'slug6',
                viewAllType: { 'en-GB': 'auto' },
                viewAllActionText: { 'en-GB': 'All Jackpots' },
            };
            const result = buildJackpotSection({ section, spaceLocale, userLocale });
            expect(result).toMatchObject({
                entryId: 'sec8',
                classification: 'JackpotSection',
                title: 'Jackpot',
                type: 'bingo-jackpots',
                hasGames: true,
                headlessJackpot: { id: 100, name: 'headless' },
                headerImage: 'header1',
                // bynderHeaderImage: 'bynderHeader1',
                backgroundImage: 'bg1',
                // bynderBackgroundImage: 'bynderBg1',
                pot1Image: 'pot1',
                // bynderPot1Image: 'bynderPot1',
                pot2Image: 'pot2',
                // bynderPot2Image: 'bynderPot2',
                pot3Image: 'pot3',
                // bynderPot3Image: 'bynderPot3',
                pot4Image: 'pot4',
                // bynderPot4Image: 'bynderPot4',
                viewAll: {
                    viewAllActionSlug: 'slug6',
                    viewAllActionType: 'section',
                    viewAllActionText: 'All Jackpots',
                },
            });
        });
    });

    describe('buildDFGSection', () => {
        it('should build DFG section with all optional fields', () => {
            const section: IDFGSectionOS = {
                id: 'sec9',
                classification: { 'en-GB': 'DFGSection' },
                title: { 'en-GB': 'DFG' },
                media: { 'en-GB': 'media1' },
                dynamicBackground: { 'en-GB': 'bg2' },
                dynamicLogo: { 'en-GB': 'logo1' },
                link: { 'en-GB': '/dfg' },
            };
            const result = buildDFGSection({ section, spaceLocale, userLocale });
            expect(result).toMatchObject({
                entryId: 'sec9',
                classification: 'DFGSection',
                title: 'DFG',
                hasGames: true,
                media: 'media1',
                dynamicBackground: 'bg2',
                dynamicLogo: 'logo1',
                link: '/dfg',
            });
        });
    });

    describe('buildSearchResultsSection', () => {
        it('should build search results section', () => {
            const section: ISearchPlaceholderSectionOS = {
                id: 'sec10',
                classification: { 'en-GB': 'SearchResultsSection' },
                title: { 'en-GB': 'Search' },
                layoutType: { 'en-GB': 'search' },
            };
            const result = buildSearchResultsSection({ section, spaceLocale, userLocale });
            expect(result).toEqual({
                entryId: 'sec10',
                classification: 'SearchResultsSection',
                title: 'Search',
                layoutType: 'search',
            });
        });
    });
});

describe('buildSectionsQuery', () => {
    it('should build a query with all parameters', () => {
        const params = {
            sectionIds: ['id1', 'id2'],
            platform: 'web',
            spaceLocale: 'en-GB',
            sessionVisibility: 'loggedIn',
            envVisibility: 'production',
        };
        const result = buildSectionsQuery(params);

        expect(result).toHaveProperty('_source');
        expect(result._source.excludes).toContain('cmsEnv');
        expect(result.query.constant_score.filter.bool.must[0].ids.values).toEqual(['id1', 'id2']);
        expect(result.query.constant_score.filter.bool.filter).toEqual([
            { term: { 'platformVisibility.en-GB.keyword': 'web' } },
            { term: { 'environmentVisibility.en-GB.keyword': 'production' } },
            { term: { 'sessionVisibility.en-GB.keyword': 'loggedIn' } },
        ]);
        expect(result.size).toBe(100);
    });

    it('should handle empty sectionIds', () => {
        const params = {
            sectionIds: [],
            platform: 'mobile',
            spaceLocale: 'fr-FR',
            sessionVisibility: 'loggedOut',
            envVisibility: 'staging',
        };
        const result = buildSectionsQuery(params);

        expect(result.query.constant_score.filter.bool.must[0].ids.values).toEqual([]);
        expect(result.query.constant_score.filter.bool.filter).toEqual([
            { term: { 'platformVisibility.fr-FR.keyword': 'mobile' } },
            { term: { 'environmentVisibility.fr-FR.keyword': 'staging' } },
            { term: { 'sessionVisibility.fr-FR.keyword': 'loggedOut' } },
        ]);
    });

    it('should build correct field names for different locales', () => {
        const params = {
            sectionIds: ['idX'],
            platform: 'ios',
            spaceLocale: 'es-ES',
            sessionVisibility: 'guest',
            envVisibility: 'dev',
        };
        const result = buildSectionsQuery(params);

        expect(result.query.constant_score.filter.bool.filter).toEqual([
            { term: { 'platformVisibility.es-ES.keyword': 'ios' } },
            { term: { 'environmentVisibility.es-ES.keyword': 'dev' } },
            { term: { 'sessionVisibility.es-ES.keyword': 'guest' } },
        ]);
    });

    it('should build a query with correct filters and section IDs', () => {
        const sectionIds = ['id1', 'id2'];
        const platform = 'web';
        const spaceLocale = 'en-US';
        const sessionVisibility = 'public';
        const envVisibility = 'prod';

        const query = buildSectionsQuery({
            sectionIds,
            platform,
            spaceLocale,
            sessionVisibility,
            envVisibility,
        });

        // Check that the query contains the section IDs
        expect(query.query.constant_score.filter.bool.must[0].ids.values).toEqual(sectionIds);

        // Check that the filter terms include platform, environment, and session visibility with correct keys
        const filterTerms = query.query.constant_score.filter.bool.filter;
        expect(filterTerms).toEqual(
            expect.arrayContaining([
                { term: { [`platformVisibility.${spaceLocale}.keyword`]: platform } },
                { term: { [`environmentVisibility.${spaceLocale}.keyword`]: envVisibility } },
                { term: { [`sessionVisibility.${spaceLocale}.keyword`]: sessionVisibility } },
            ]),
        );

        // Size should be 100 as per your function
        expect(query.size).toBe(100);

        // _source.excludes should be an array containing expected fields (optional check)
        expect(query._source.excludes).toContain('cmsEnv');
    });
});

describe('getView with nock', () => {
    const client = getClient();
    const params: GetViewParams = {
        client,
        viewSlug: 'home',
        ventureId: 'venture1',
        platform: 'ios',
        spaceLocale: 'en-GB',
        userLocale: 'en-GB',
        sessionVisibility: 'loggedIn',
        envVisibility: 'prod',
        siteName: 'jackpotjoy',
    };

    beforeEach(() => {
        process.env.EXECUTION_ENVIRONMENT = 'staging';
        nock.cleanAll();
    });

    it('should return view layout when hit is found', async () => {
        nock('http://localhost:9200')
            .post(`/${VIEW_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, {
                hits: {
                    hits: [
                        {
                            _id: 'view1',
                            _source: {
                                id: 'view1',
                                name: { 'en-GB': 'Home View' },
                                viewSlug: { 'en-GB': 'home' },
                                classification: { 'en-GB': 'MainView' },
                                topContent: { 'en-GB': [{ sys: { id: 'top1' } }, { sys: { id: 'top2' } }] },
                                primaryContent: { 'en-GB': [{ sys: { id: 'prim1' } }] },
                                liveHidden: { 'en-GB': true },
                                theme: { 'en-GB': { sys: { id: 'theme1' } } },
                            },
                        },
                    ],
                },
            });

        const result = await getView(params);
        console.log('result', result);
        expect(result).toEqual({
            topContent: ['top1', 'top2'],
            primaryContent: ['prim1'],
            name: 'Home View',
            slug: 'home',
            liveHidden: true,
            classification: 'MainView',
            entryId: 'view1',
            themeId: 'theme1',
        });
    });

    it('should throw InvalidView error and log if no hits', async () => {
        nock('http://localhost:9200')
            .post(`/${VIEW_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, {
                hits: {
                    hits: [],
                },
            });

        await expect(getView(params)).rejects.toMatchObject({ code: ErrorCode.InvalidView });
        // You can spy on your logger if it's accessible, or check side effects accordingly
    });

    it('should throw UnprocessableEntity error if topContent or primaryContent is not array', async () => {
        nock('http://localhost:9200')
            .post(`/${VIEW_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, {
                hits: {
                    hits: [
                        {
                            _id: 'view2',
                            _source: {
                                id: 'view2',
                                name: { 'en-GB': 'Broken View' },
                                viewSlug: { 'en-GB': 'broken' },
                                classification: { 'en-GB': 'MainView' },
                                topContent: { 'en-GB': 'not-an-array' }, // Invalid type
                                primaryContent: { 'en-GB': [{ sys: { id: 'prim1' } }] },
                                liveHidden: { 'en-GB': false },
                            },
                        },
                    ],
                },
            });

        await expect(getView(params)).rejects.toMatchObject({ code: ErrorCode.UnprocessableEntity });
    });

    it('should handle missing theme gracefully', async () => {
        nock('http://localhost:9200')
            .post(`/${VIEW_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, {
                hits: {
                    hits: [
                        {
                            _id: 'view3',
                            _source: {
                                id: 'view3',
                                name: { 'en-GB': 'No Theme' },
                                viewSlug: { 'en-GB': 'no-theme' },
                                classification: { 'en-GB': 'MainView' },
                                topContent: { 'en-GB': [{ sys: { id: 'top1' } }] },
                                primaryContent: { 'en-GB': [{ sys: { id: 'prim1' } }] },
                                liveHidden: { 'en-GB': false },
                            },
                        },
                    ],
                },
            });

        const result = await getView(params);
        expect(result.themeId).toBeUndefined();
    });
});

describe('getSections with nock', () => {
    const client = getClient();
    beforeEach(() => {
        process.env.EXECUTION_ENVIRONMENT = 'staging';
        nock.cleanAll();
    });

    const spaceLocale = 'en-GB';
    const userLocale = 'en-GB';
    const sessionVisibility = 'loggedIn';
    const envVisibility = 'prod';
    const platform = 'web';

    it('should return topContent and primaryContent with correct builder calls', async () => {
        nock('http://localhost:9200')
            .post(`/${VIEW_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, {
                hits: {
                    hits: [
                        {
                            _id: 'view3',
                            _source: {
                                id: 'view3',
                                name: { 'en-GB': 'No Theme' },
                                viewSlug: { 'en-GB': 'no-theme' },
                                classification: { 'en-GB': 'MainView' },
                                topContent: { 'en-GB': [{ sys: { id: 'top1' } }] },
                                primaryContent: { 'en-GB': [{ sys: { id: 'prim1' } }] },
                                liveHidden: { 'en-GB': false },
                            },
                        },
                    ],
                },
            });

        nock('http://localhost:9200')
            .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, {
                hits: {
                    hits: [
                        {
                            _id: 'top1',
                            _source: {
                                id: 'top1',
                                classification: { 'en-GB': 'GameSection' },
                                contentType: 'igCarouselA',
                                entryTitle: {
                                    'en-GB': 'Loggedout-Top-Arcade-Games [arcade] [rainbowriches]',
                                },
                                slug: {
                                    'en-GB': 'loggedout-top-arcade-games',
                                },
                                viewAllType: {
                                    'en-GB': 'auto',
                                },
                                expandedSectionLayoutType: {
                                    'en-GB': 'grid-a',
                                },
                            },
                        },
                        {
                            _id: 'primary1',
                            _source: {
                                id: 'primary1',
                                classification: { 'en-GB': 'GameSection' },
                                contentType: 'igCarouselA',
                                entryTitle: {
                                    'en-GB': 'Loggedout-Top-Arcade-Games [arcade] [rainbowriches]',
                                },
                                slug: {
                                    'en-GB': 'loggedout-top-arcade-games',
                                },
                                viewAllType: {
                                    'en-GB': 'auto',
                                },
                                expandedSectionLayoutType: {
                                    'en-GB': 'grid-a',
                                },
                            },
                        },
                    ],
                },
            })
            .persist();

        const result = await getSections({
            client,
            siteName: 'testsite',
            topContent: ['top1'],
            primaryContent: ['primary1'],
            spaceLocale,
            userLocale,
            sessionVisibility,
            envVisibility,
            platform,
        });

        expect(result.topContent[0]).toMatchObject({
            classification: 'GameSection',
            entryId: 'top1',
            hasGames: true,
            layoutType: undefined,
            title: '',
            viewAll: {
                viewAllActionSlug: 'loggedout-top-arcade-games',
                viewAllActionText: '',
                viewAllActionType: 'section',
            },
        });
        expect(result.primaryContent[0]).toMatchObject({
            classification: 'GameSection',
            entryId: 'primary1',
            hasGames: true,
            layoutType: undefined,
            title: '',
            viewAll: {
                viewAllActionSlug: 'loggedout-top-arcade-games',
                viewAllActionText: '',
                viewAllActionType: 'section',
            },
        });
    });

    it('should throw and log error if no sections found', async () => {
        nock('http://localhost:9200')
            .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, {
                hits: {
                    hits: [],
                },
            });

        await expect(
            getSections({
                client,
                siteName: 'testsite',
                topContent: ['top1'],
                primaryContent: [],
                spaceLocale,
                userLocale,
                sessionVisibility,
                envVisibility,
                platform,
            }),
        ).rejects.toMatchObject({ code: ErrorCode.MissingSections });
    });

    // TODO: This test is skipped because the classification is not known
    // and the function should handle it gracefully.
    it('should handle unknown classification gracefully', async () => {
        nock('http://localhost:9200')
            .post(`/${VIEW_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, {
                hits: {
                    hits: [
                        {
                            _id: 'view3',
                            _source: {
                                id: 'view3',
                                name: { 'en-GB': 'No Theme' },
                                viewSlug: { 'en-GB': 'no-theme' },
                                classification: { 'en-GB': 'MainView' },
                                topContent: { 'en-GB': [{ sys: { id: 'top1' } }] },
                                primaryContent: { 'en-GB': [{ sys: { id: 'prim1' } }] },
                                liveHidden: { 'en-GB': false },
                            },
                        },
                    ],
                },
            });
        nock('http://localhost:9200')
            .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, {
                hits: {
                    hits: [
                        {
                            _id: 'top1',
                            _source: {
                                id: 'top1',
                                classification: { 'en-GB': 'UnknownSection' },
                            },
                        },
                    ],
                },
            })
            .persist();

        const result = await getSections({
            client,
            siteName: 'testsite',
            topContent: ['top1'],
            primaryContent: [],
            spaceLocale,
            userLocale,
            sessionVisibility,
            envVisibility,
            platform,
        });

        expect(result.topContent[0]).toMatchObject({
            entryId: 'top1',
            classification: 'UnknownSection',
        });
    });
});

describe('getTheme', () => {
    const client = getClient();
    beforeEach(() => {
        process.env.EXECUTION_ENVIRONMENT = 'staging';
    });
    const siteName = 'jackpotjoy';
    const platform = 'web';
    const themeId = '121esdadfereafzdf12';
    const spaceLocale = 'en-GB';
    const viewId = 'view123';

    it('should return theme when found', async () => {
        const mockResponse = {
            hits: {
                hits: [
                    {
                        _id: themeId,
                        _source: {
                            primaryColor: { 'en-GB': '#123456' },
                            secondaryColor: { 'en-GB': '#abcdef' },
                            image: { 'en-GB': 'https://example.com/image.jpg' },
                        },
                    },
                ],
            },
        };

        nock('http://localhost:9200')
            .post(`/${THEME_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, mockResponse);

        const theme = await getTheme(client, themeId, spaceLocale, viewId, siteName, platform);

        expect(theme).toEqual({
            primaryColor: '#123456',
            secondaryColor: '#abcdef',
            image: 'https://example.com/image.jpg',
        });
    });

    it('should return default theme if no results found', async () => {
        nock('http://localhost:9200')
            .post(`/${THEME_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, {
                hits: {
                    hits: [],
                },
            });

        const theme = await getTheme(client, themeId, spaceLocale, viewId, siteName, platform);

        expect(theme).toEqual({ primaryColor: '' });
    });
});

// -- Integration Tests --

describe('Integration Test for Lambda Handler', () => {
    beforeEach(() => {
        process.env.EXECUTION_ENVIRONMENT = 'staging';
        nock.cleanAll();
    });

    it.skip('should return page view for a valid sitename, viewSlug and platform', async () => {
        const sitename = 'jackpotjoy';
        const viewslug = 'casino-home';
        const platform = 'ios';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP)
            .persist();
        nock('http://localhost:9200')
            .post(`/${VIEW_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, VIEW_SUCCESS_RESP)
            .persist();

        nock('http://localhost:9200')
            .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, SECTION_SUCCESS_RESP)
            .persist();

        nock('http://localhost:9200')
            .post(`/${THEME_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, THEME_SUCCESS_RESP);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, viewslug, platform);

        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(parseCompressedBody(result)).toEqual(GET_SECTIONS_SUCCESS_RESPONSE);
    });

    it('should return (204) for non existing site name', async () => {
        const sitename = 'jpj';
        const viewslug = 'casino-home';
        const platform = 'web';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, NOT_FOUND_RESPONSE);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, viewslug, platform);

        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(204);
        expect(result.statusCode).toBe(204);
        expect(result.headers?.['Cache-Control']).toBe('no-cache');
    });

    it('should return (204) for invalid slug name', async () => {
        const sitename = 'jackpotjoy';
        const viewslug = 'invalid-slug';
        const platform = 'web';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${VIEW_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, NOT_FOUND_RESPONSE)
            .persist();

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, viewslug, platform);

        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(204);
        expect(result.statusCode).toBe(204);
        expect(result.headers?.['Cache-Control']).toBe('no-cache');
    });

    it('should return (400) with empty body for invalid platform', async () => {
        const sitename = 'jackpotjoy';
        const viewslug = 'casino-home';
        const platform = 'invalidplatform';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);
        nock('http://localhost:9200')
            .post(`/${VIEW_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, NOT_FOUND_RESPONSE);

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, viewslug, platform);

        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(400);
        const body = JSON.parse(result.body);
        expect(body.code).toBe(ErrorCode.InvalidRequest);
        expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
    });

    it('should return (400) to the client if any of the path parameters are missing', async () => {
        const sitename = 'jackpotjoy';
        const platform = 'web';

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, undefined, platform);

        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(400);
        const body = JSON.parse(result.body);
        expect(body.code).toBe(ErrorCode.InvalidRequest);
        expect(body.message).toBe(getErrorMessage(ErrorCode.InvalidRequest));
    });

    it('should return 500 for an unexpected error', async () => {
        const sitename = 'jpj';
        const viewslug = 'casino-home';
        const platform = 'web';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(500, 'Unexpected error');

        const event: APIGatewayProxyEvent = mockApiEvent(sitename, viewslug, platform);

        const result = await lambdaHandler(event);

        expect(result.statusCode).toBe(500);
        const body = JSON.parse(result.body);
        expect(body.message).toBe('Internal Server Error');
    });
});
