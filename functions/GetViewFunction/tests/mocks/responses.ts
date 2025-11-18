import { IBynderAsset } from 'os-client';

export const VENTURE_SUCCESS_RESP: any = {
    hits: {
        hits: [
            {
                _source: {
                    id: 'venture-id-123',
                },
            },
        ],
    },
};

interface ViewSource {
    id?: string;
    name: { 'en-GB': string };
    viewSlug: { 'en-GB': string };
    liveHidden: { 'en-GB': boolean };
    classification: { 'en-GB': string };
    primaryContent?: {
        'en-GB': Array<{
            sys: {
                type: string;
                linkType: string;
                id: string;
            };
        }>;
    };
    topContent?: {
        'en-GB': Array<{
            sys: {
                type: string;
                linkType: string;
                id: string;
            };
        }>;
    };
    themeId?: string;
}

interface ViewHit {
    _source: ViewSource;
}

interface ViewSuccessResp {
    hits: {
        hits: ViewHit[];
    };
}

export const VIEW_SUCCESS_RESP: ViewSuccessResp = {
    hits: {
        hits: [
            {
                _source: {
                    id: '10O8lYz49d0juBEdhCwWnd',
                    name: {
                        'en-GB': 'jackpot-blast-how-to-play',
                    },
                    viewSlug: {
                        'en-GB': 'jackpot-blast-how-to-play',
                    },
                    liveHidden: {
                        'en-GB': false,
                    },
                    classification: {
                        'en-GB': 'general',
                    },
                },
            },
            {
                _source: {
                    id: '5I9WiYOYZiN4iR5euKCUOG',
                    name: {
                        'en-GB': 'jackpot-blast-how-to-play',
                    },
                    viewSlug: {
                        'en-GB': 'jackpot-blast-how-to-play',
                    },
                    liveHidden: {
                        'en-GB': false,
                    },
                    classification: {
                        'en-GB': 'general',
                    },
                },
            },
            {
                _source: {
                    name: {
                        'en-GB': 'test',
                    },
                    viewSlug: {
                        'en-GB': 'test',
                    },
                    primaryContent: {
                        'en-GB': [
                            {
                                sys: {
                                    type: 'Link',
                                    linkType: 'Entry',
                                    id: '7bYmnEbVTjpLx5aGuggUju',
                                },
                            },
                        ],
                    },
                    liveHidden: {
                        'en-GB': false,
                    },
                    classification: {
                        'en-GB': 'general',
                    },
                },
            },
        ],
    },
};

interface SectionSource {
    viewAllActionText: { 'en-GB': string };
    layoutType: { 'en-GB': string };
    viewAllType: { 'en-GB': string };
    id: string;
    title: { 'en-GB': string };
    classification: { 'en-GB': string };
    contentType: string;
    entryTitle: { 'en-GB': string };
    slug: { 'en-GB': string };
    expandedSectionLayoutType: { 'en-GB': string };
}

interface SectionHit {
    _source: SectionSource;
}

interface SectionSuccessResp {
    hits: {
        hits: SectionHit[];
    };
}

export const SECTION_SUCCESS_RESP: SectionSuccessResp = {
    hits: {
        hits: [
            {
                _source: {
                    viewAllActionText: {
                        'en-GB': 'View All',
                    },
                    layoutType: {
                        'en-GB': 'carousel-a',
                    },
                    viewAllType: {
                        'en-GB': 'auto',
                    },
                    id: '6PrO6qiEJe1nUUsDdxLHrL',
                    title: {
                        'en-GB': 'Elk',
                    },
                    classification: {
                        'en-GB': 'GameSection',
                    },
                    contentType: 'igCarouselA',
                    entryTitle: {
                        'en-GB': 'Elk-Carousel [homepage] [monopolycasinospain]',
                    },
                    slug: {
                        'en-GB': 'elk-carousel',
                    },
                    expandedSectionLayoutType: {
                        'en-GB': 'grid-a',
                    },
                },
            },
            {
                _source: {
                    viewAllActionText: {
                        'en-GB': 'View All',
                    },
                    layoutType: {
                        'en-GB': 'carousel-a',
                    },
                    viewAllType: {
                        'en-GB': 'auto',
                    },
                    id: '7FQjBY5vkziJGq3atBMP6D',
                    title: {
                        'en-GB': 'Elk',
                    },
                    classification: {
                        'en-GB': 'GameSection',
                    },
                    contentType: 'igCarouselA',
                    entryTitle: {
                        'en-GB': 'Elk-Carousel [homepage] [botemania]',
                    },
                    slug: {
                        'en-GB': 'elk-carousel-homepage-botemania-desktop',
                    },
                    expandedSectionLayoutType: {
                        'en-GB': 'grid-a',
                    },
                },
            },
            {
                _source: {
                    viewAllActionText: {
                        'en-GB': 'View All',
                    },
                    layoutType: {
                        'en-GB': 'carousel-a',
                    },
                    viewAllType: {
                        'en-GB': 'auto',
                    },
                    id: '3gq2Di4o7X8jZhvs1YR8uK',
                    title: {
                        'en-GB': 'Top Arcade Games',
                    },
                    classification: {
                        'en-GB': 'GameSection',
                    },
                    contentType: 'igCarouselA',
                    entryTitle: {
                        'en-GB': 'Loggedout-Top-Arcade-Games [arcade] [rainbowriches]',
                    },
                    slug: {
                        'en-GB': 'loggedout-top-arcade-games',
                    },
                    expandedSectionLayoutType: {
                        'en-GB': 'grid-a',
                    },
                },
            },
            {
                _source: {
                    viewAllActionText: {
                        'en-GB': 'View All',
                    },
                    layoutType: {
                        'en-GB': 'carousel-a',
                    },
                    viewAllType: {
                        'en-GB': 'auto',
                    },
                    id: '1oobkAbJK5P4GXr1yqodwp',
                    title: {
                        'en-GB': 'Top Arcade Games',
                    },
                    classification: {
                        'en-GB': 'GameSection',
                    },
                    contentType: 'igCarouselA',
                    entryTitle: {
                        'en-GB': 'Loggedout-Top-Arcade-Games [arcade] [monopolycasino]',
                    },
                    slug: {
                        'en-GB': 'loggedout-top-arcade-games',
                    },
                    expandedSectionLayoutType: {
                        'en-GB': 'grid-a',
                    },
                },
            },
            {
                _source: {
                    viewAllActionText: {
                        'en-GB': 'View All',
                    },
                    layoutType: {
                        'en-GB': 'carousel-a',
                    },
                    viewAllType: {
                        'en-GB': 'auto',
                    },
                    id: '6r0z3v2siMhEXVU5XxYqLq',
                    title: {
                        'en-GB': 'Top Arcade Games',
                    },
                    classification: {
                        'en-GB': 'GameSection',
                    },
                    contentType: 'igCarouselA',
                    entryTitle: {
                        'en-GB': 'Loggedout-Top-Arcade-Games [arcade] [doublebubblebingo]',
                    },
                    slug: {
                        'en-GB': 'loggedout-top-arcade-games',
                    },
                    expandedSectionLayoutType: {
                        'en-GB': 'grid-a',
                    },
                },
            },
        ],
    },
};

const fakeBynderAsset: IBynderAsset = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    brandId: 'brand_001',
    copyright: '© 2025 Example Corp',
    description: 'A beautiful stock photo of a mountain range during sunset.',
    extension: ['jpg'],
    height: 1080,
    isPublic: 1,
    limited: 0,
    name: 'sunset_mountain.jpg',
    orientation: 'landscape',
    original: 'https://assets.example.com/original/sunset_mountain.jpg',
    thumbnails: {
        small: 'https://assets.example.com/thumbnails/sunset_mountain_small.jpg',
        medium: 'https://assets.example.com/thumbnails/sunset_mountain_medium.jpg',
        large: 'https://assets.example.com/thumbnails/sunset_mountain_large.jpg',
    },
    type: 'image',
    watermarked: 0,
    width: 1920,
    videoPreviewURLs: [],
    tags: ['sunset', 'mountain', 'nature', 'landscape'],
    textMetaproperties: ['season:summer', 'location:Alps'],
    src: 'https://assets.example.com/original/sunset_mountain.jpg',
};

interface ThemeSource {
    entryTitle: { 'en-GB': string };
    image: { 'en-GB': IBynderAsset };
    primaryColor: { 'en-GB': string };
    secondaryColor: { 'en-GB': string };
    venture: {
        'en-GB': {
            sys: {
                id: string;
                type: string;
                linkType: string;
            };
        };
    };
}

interface ThemeHit {
    _source: ThemeSource;
}

interface ThemeSuccessResp {
    hits: {
        hits: ThemeHit[];
    };
}

export const THEME_SUCCESS_RESP: ThemeSuccessResp = {
    hits: {
        hits: [
            {
                _source: {
                    entryTitle: { 'en-GB': 'theme-id-123' },
                    image: { 'en-GB': fakeBynderAsset },
                    primaryColor: { 'en-GB': '#FFFFFF' },
                    secondaryColor: { 'en-GB': '#000000' },
                    venture: {
                        'en-GB': {
                            sys: {
                                id: 'venture-id-123',
                                type: 'Link',
                                linkType: 'Entry',
                            },
                        },
                    },
                },
            },
        ],
    },
};

export const SECTION_WITH_GAMES_SUCCESS_RESP: any = {
    hits: {
        hits: [
            {
                _source: {
                    entryTitle: { 'en-GB': 'Section 1' },
                    href: { 'en-GB': 'http://example.com' },
                    image: { 'en-GB': 'http://example.com/image.jpg' },
                    name: { 'en-GB': 'section-name' },
                    priorityOverride: { 'en-GB': 1 },
                    style: { 'en-GB': 'style-class' },
                    title: { 'en-GB': 'Section Title' },
                    videoUrl: { 'en-GB': 'http://example.com/video.mp4' },
                    id: 'section-id-1',
                    contentType: 'sectionContentType',
                    carousel: { 'en-GB': 'carousel-id' },
                    className: { 'en-GB': 'class-name' },
                    header: { 'en-GB': 'enabled' },
                    highlightColor: { 'en-GB': '#FF0000' },
                    jackpots: {
                        'en-GB': ['jackpot1', 'jackpot2'],
                    },
                    type: { 'en-GB': 'type-name' },
                    show: { 'en-GB': 'loggedIn' },
                    slides: { 'en-GB': 'slides-id' },
                    games: {
                        'en-GB': [
                            {
                                sys: {
                                    type: 'Link',
                                    linkType: 'Entry',
                                    id: '9aCxjYxyuY4kzNlF6V7kl',
                                },
                            },
                        ],
                    },
                },
            },
        ],
    },
};

export const GET_SECTIONS_SUCCESS_RESPONSE: any = [
    {
        entryId: 'section-id-1',
        href: 'http://example.com',
        name: 'section-name',
        style: 'style-class',
        title: 'Section Title',
        image: 'http://example.com/image.jpg',
        videoUrl: 'http://example.com/video.mp4',
        sectionId: 'jackpotjoy-homepage-section-name',
        sectionContentType: 'sectionContentType',
        hasGames: false,
        isPersonalized: false,
        priorityOverride: 1,
        layout: {
            carousel: 'carousel-id',
            className: 'class-name',
            header: {
                enabled: 'enabled',
            },
            highlight: {
                enabled: true,
                style: {
                    backgroundColor: '#FF0000',
                },
            },
            jackpots: ['jackpot1', 'jackpot2'],
            type: 'type-name',
            show: {
                loggedIn: true,
                loggedOut: false,
            },
            sizes: {},
        },
        slides: 'slides-id',
    },
];

export const GET_SECTIONS_WITH_GAMES_SUCCESS_RESPONSE: any = [
    {
        entryId: 'section-id-1',
        href: 'http://example.com',
        name: 'section-name',
        style: 'style-class',
        title: 'Section Title',
        image: 'http://example.com/image.jpg',
        videoUrl: 'http://example.com/video.mp4',
        sectionId: 'jackpotjoy-homepage-section-name',
        sectionContentType: 'sectionContentType',
        hasGames: true,
        isPersonalized: false,
        priorityOverride: 1,
        layout: {
            carousel: 'carousel-id',
            className: 'class-name',
            header: {
                enabled: 'enabled',
            },
            highlight: {
                enabled: true,
                style: {
                    backgroundColor: '#FF0000',
                },
            },
            jackpots: ['jackpot1', 'jackpot2'],
            type: 'type-name',
            show: {
                loggedIn: true,
                loggedOut: false,
            },
            sizes: {},
        },
        slides: 'slides-id',
    },
];

export const GET_ML_PERSONALIZED_SECTIONS_SUCCESS_RESPONSE: any = [
    {
        entryId: 'section-id-1',
        href: 'http://example.com',
        name: 'personal-suggested-games',
        style: 'style-class',
        title: 'Section Title',
        image: 'http://example.com/image.jpg',
        videoUrl: 'http://example.com/video.mp4',
        sectionId: 'jackpotjoy-homepage-personal-suggested-games',
        sectionContentType: 'sectionContentType',
        hasGames: true,
        isPersonalized: true,
        priorityOverride: 1,
        layout: {
            carousel: 'carousel-id',
            className: 'class-name',
            header: {
                enabled: 'enabled',
            },
            highlight: {
                enabled: true,
                style: {
                    backgroundColor: '#FF0000',
                },
            },
            jackpots: ['jackpot1', 'jackpot2'],
            type: 'personal-suggested-games',
            show: {
                loggedIn: true,
                loggedOut: false,
            },
            sizes: {},
        },
        slides: 'slides-id',
    },
];

// Invalid responses

export const NOT_FOUND_RESPONSE: any = {
    hits: {
        hits: [],
    },
};
