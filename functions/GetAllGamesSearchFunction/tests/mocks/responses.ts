import { FullApiResponse, LocalizedField } from 'os-client';
import { SECTION_DOCUMENTS_PER_AGGREGATED_LAYOUT_LIMIT } from '../../app';
import { Sys } from 'os-client/lib/sharedInterfaces/common';

interface VentureSearchResponse {
    hits: {
        hits: Array<{ _source: { id: string } }>;
    };
}

export const VENTURE_SUCCESS_RESP: VentureSearchResponse = {
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

interface NavigationResponse {
    hits: {
        hits: Array<{
            _source: {
                id: string;
                entryTitle: { [key: string]: string };
                venture: { [key: string]: { sys: { type: string; linkType: string; id: string } } };
                links?: { [key: string]: Array<{ sys: { type: string; linkType: string; id: string } }> };
                bottomNavLinks?: { [key: string]: Array<{ sys: { type: string; linkType: string; id: string } }> };
            };
        }>;
    };
}

export const NAV_SUCCESS_RESPONSE: NavigationResponse = {
    hits: {
        hits: [
            {
                _source: {
                    id: 'cat-id-1',
                    entryTitle: { 'en-GB': 'Category 1' },
                    links: { 'en-GB': [{ sys: { type: 'Link', linkType: 'Entry', id: 'link-id-1' } }] },
                    venture: {
                        'en-GB': { sys: { type: 'Link', linkType: 'Entry', id: 'venture-id-123' } },
                    },
                },
            },
        ],
    },
};

interface LinkResponse {
    hits: {
        hits: Array<{
            _source: {
                id: string;
                contentType?: string;
                entryTitle: { [key: string]: string };
                label: { [key: string]: string };
                view: { [key: string]: { sys: { type: string; linkType: string; id: string } } };
                image: { [key: string]: string };
                externalUrl: { [key: string]: string };
                internalUrl: { [key: string]: string };
                liveHidden: { [key: string]: boolean };
            };
        }>;
    };
}

export const LINK_SUCCESS_RESPONSE: LinkResponse = {
    hits: {
        hits: [
            {
                _source: {
                    id: 'link-id-1',
                    contentType: 'igLink',
                    entryTitle: { 'en-GB': 'Test Monopoly' },
                    label: {
                        'en-GB': 'slots',
                    },
                    view: {
                        'en-GB': { sys: { type: 'Link', linkType: 'Entry', id: 'view-id-123' } },
                    },
                    image: { 'en-GB': 'http://example.com/bg.png' },
                    externalUrl: { 'en-GB': 'http://example.com' },
                    internalUrl: { 'en-GB': 'http://example.com' },
                    liveHidden: { 'en-GB': false },
                },
            },
        ],
    },
};

interface ViewResponse {
    hits: {
        hits: Array<{
            _source: {
                id: string;
                primaryContent: LocalizedField<Sys[]>;
                liveHidden: LocalizedField<boolean>;
                classification: LocalizedField<string>;
            };
        }>;
    };
}

export const VIEW_SUCCESS_RESPONSE: ViewResponse = {
    hits: {
        hits: [
            {
                _source: {
                    id: 'view-id-123',
                    primaryContent: { 'en-GB': [{ sys: { type: 'Link', linkType: 'Entry', id: 'link-id-1' } }] },
                    liveHidden: { 'en-GB': false },
                    classification: { 'en-GB': 'general' },
                },
            },
        ],
    },
};

interface AllSectionsResponse {
    hits: {
        hits: Array<{
            _source: {
                games: { [key: string]: Array<{ sys: { linkType: string; id: string; type: string } }> };
                id: string;
                title: { [key: string]: string };
                classification: { [key: string]: string };
                entryTitle: { [key: string]: string };
            };
        }>;
    };
}

export const ALL_SECTIONS_RESPONSE: AllSectionsResponse = {
    hits: {
        hits: [
            {
                _source: {
                    id: 'link-id-1',
                    title: {
                        'en-GB': 'All Slots',
                        'en-US': 'All Slots',
                    },
                    classification: {
                        'en-GB': 'GameSection',
                        'en-US': 'GameSection',
                    },
                    entryTitle: {
                        'en-GB': 'All Slots  [ballybetri]',
                        'en-US': 'All Slots  [ballybetri]',
                    },
                    games: {
                        'en-GB': [
                            { sys: { linkType: 'Entry', id: '37NY6w39viFoOzkoi6b0XV', type: 'Link' } },
                            { sys: { linkType: 'Entry', id: '4OOeX5LNHHt9QR8aRQaCiD', type: 'Link' } },
                            { sys: { linkType: 'Entry', id: 'qKOglgrOFlHMm0WQ8RxNs', type: 'Link' } },
                            { sys: { linkType: 'Entry', id: '37NY6w39viFoOzkoi6b0XV', type: 'Link' } },
                            { sys: { linkType: 'Entry', id: '4OOeX5LNHHt9QR8aRQaCiD', type: 'Link' } },
                            { sys: { linkType: 'Entry', id: 'qKOglgrOFlHMm0WQ8RxNs', type: 'Link' } },
                        ],
                    },
                },
            },
        ],
    },
};

interface OpenSearchAggregationResponse {
    hits: { total: { value: number }; hits: unknown[] };
    aggregations?: {
        group_by_category?: {
            buckets?: Record<
                string,
                {
                    doc_count: number;
                    top_documents?: { hits: { total: { value: number }; hits: unknown[] } };
                }
            >;
        };
    };
}

// Logged out Mocks
export const SECTION_SUCCESS_RESP_LOGGED_OUT: OpenSearchAggregationResponse = {
    hits: {
        total: {
            value: 4,
        },
        hits: [],
    },
    aggregations: {
        group_by_category: {
            buckets: {
                bingo: {
                    doc_count: 2,
                    top_documents: {
                        hits: {
                            total: {
                                value: 2,
                            },
                            hits: [
                                {
                                    _id: '38HWSMK43HEWl9SZT0bSqO',
                                    _source: {
                                        show: {
                                            'en-GB': ['loggedIn', 'loggedOut'],
                                        },
                                        games: {
                                            'en-GB': [
                                                {
                                                    sys: {
                                                        linkType: 'Entry',
                                                        id: '4OOeX5LNHHt9QR8aRQaCiD',
                                                        type: 'Link',
                                                    },
                                                },
                                                {
                                                    sys: {
                                                        linkType: 'Entry',
                                                        id: '6Is8CcYbvNpldK9U3vmkhK',
                                                        type: 'Link',
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
                homepage: {
                    doc_count: 2,
                    top_documents: {
                        hits: {
                            total: {
                                value: 2,
                            },
                            hits: [
                                {
                                    _id: 'vrKJW22VxUiuLeBJM9mBg',
                                    _source: {
                                        show: {
                                            'en-GB': ['loggedIn'],
                                        },
                                        games: {
                                            'en-GB': [
                                                {
                                                    sys: {
                                                        linkType: 'Entry',
                                                        id: '2fKAETmOt7OaqbRtMad7bx',
                                                        type: 'Link',
                                                    },
                                                },
                                                {
                                                    sys: {
                                                        linkType: 'Entry',
                                                        id: 'qKOglgrOFlHMm0WQ8RxNs',
                                                        type: 'Link',
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
                'live-casino': {
                    doc_count: 0,
                    top_documents: {
                        hits: {
                            total: {
                                value: 0,
                            },
                            hits: [],
                        },
                    },
                },
                slots: {
                    doc_count: 1,
                    top_documents: {
                        hits: {
                            total: {
                                value: 1,
                            },
                            hits: [
                                {
                                    _id: '2RNDFzyTj3xBLM8mtSBhX1',
                                    _source: {
                                        show: {
                                            'en-GB': ['loggedIn'],
                                        },
                                        games: {
                                            'en-GB': [
                                                {
                                                    sys: {
                                                        linkType: 'Entry',
                                                        id: '37NY6w39viFoOzkoi6b0XV',
                                                        type: 'Link',
                                                    },
                                                },
                                                {
                                                    sys: {
                                                        linkType: 'Entry',
                                                        id: 'qKOglgrOFlHMm0WQ8RxNs',
                                                        type: 'Link',
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        },
    },
};

interface GameSearchOpenSearchHit {
    _id: string;
    _routing?: string;
    _source: {
        siteGame: {
            id: string;
            gameId: string;
            headlessJackpot?: Record<string, unknown>;
            liveHidden?: Record<string, boolean>;
            tags?: Record<string, string[]>;
        };
    };
    inner_hits?: {
        game?: {
            hits: {
                total: { value: number };
                hits: Array<{
                    _id: string;
                    _source: {
                        game: Record<string, unknown>;
                    };
                }>;
            };
        };
    };
}

interface GamesSearchOpenSearchResponse {
    hits: {
        total: { value: number };
        hits: GameSearchOpenSearchHit[];
    };
}

export const GAMES_SEARCH_SUCCESS_RESP_LOGGED_OUT: GamesSearchOpenSearchResponse = {
    hits: {
        total: {
            value: 262,
        },
        hits: [
            {
                _id: '37NY6w39viFoOzkoi6b0XV',
                _routing: '3xbhCjIOoPN0m5TF0il3RJ',
                _source: {
                    siteGame: {
                        id: '37NY6w39viFoOzkoi6b0XV',
                        gameId: '5KbFMEx7dZwCq5A5lPHu0o',
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            total: {
                                value: 1,
                            },
                            hits: [
                                {
                                    _id: '3xbhCjIOoPN0m5TF0il3RJ',
                                    _source: {
                                        game: {
                                            gameSkin: 'play-bounty-raid',
                                            gameName: 'play-bounty-raid',
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-bounty-raid',
                                                gameType: {
                                                    winLineType: 'L2R',
                                                    maxMultiplier: '1',
                                                    type: 'Slots',
                                                    winLines: 10,
                                                    symbolType: ['Suits'],
                                                    reel: '5-3',
                                                    isPersistence: false,
                                                    themes: ['Wild West'],
                                                    features: [
                                                        'Sticky Wilds',
                                                        'Respins',
                                                        'Multipliers (With or without wilds)',
                                                    ],
                                                    isJackpotFixedPrize: false,
                                                    isJackpotInGameProgressive: false,
                                                    waysToWin: 'Other',
                                                    symbolCount: '1',
                                                    brand: '',
                                                    isJackpot: true,
                                                    isJackpotPlatformProgressive: false,
                                                },
                                                gameStudio: 'Red Tiger',
                                                gameLoaderFileName: 'play-bounty-raid',
                                                gameProvider: 'Evolution Gaming',
                                                realUrl: '/service/game/play/play-bounty-raid',
                                            },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/bounty-raid-logged-out/scale-s%s/bounty-raid-tile-r%s-w%s.jpg',
                                            },
                                            title: {
                                                'en-GB': 'Bounty Raid',
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                _id: '4OOeX5LNHHt9QR8aRQaCiD',
                _routing: '3UqIRcQQckIWgVSkz9qAW5',
                _source: {
                    siteGame: {
                        id: '4OOeX5LNHHt9QR8aRQaCiD',
                        gameId: '1hEc1VFYe9W6Qpj0oyBXfo',
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            total: {
                                value: 1,
                            },
                            hits: [
                                {
                                    _id: '3UqIRcQQckIWgVSkz9qAW5',
                                    _source: {
                                        game: {
                                            gameSkin: 'play-dond-instant',
                                            gameName: 'play-dond-instant',
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-dond-instant',
                                                gameType: {
                                                    themes: ['Branded'],
                                                    features: [],
                                                    type: 'Instant Win',
                                                },
                                                gameStudio: '',
                                                gameLoaderFileName: 'play-dond-instant',
                                                gameProvider: 'Anaxi',
                                                realUrl: '/service/game/play/play-dond-instant',
                                            },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/deal-or-no-deal-instant/scale-s%s/deal-or-no-deal-instant-tile-r%s-w%s.jpg',
                                            },
                                            title: {
                                                'en-GB': 'Deal or No Deal Instant',
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                _id: 'qKOglgrOFlHMm0WQ8RxNs',
                _routing: '2Jphopg3n5eHYsiYJRCX4U',
                _source: {
                    siteGame: {
                        id: 'qKOglgrOFlHMm0WQ8RxNs',
                        gameId: '5uZ7AcoH7EEzkJCSNzhCM',
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            total: {
                                value: 1,
                            },
                            hits: [
                                {
                                    _id: '2Jphopg3n5eHYsiYJRCX4U',
                                    _source: {
                                        game: {
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/double-bubble-jackpot-logged-out/scale-s%s/double-bubble-jackpot-tile-r%s-w%s.jpg',
                                            },
                                            gameSkin: 'play-double-bubble-progressive',
                                            gameName: 'play-double-bubble-progressive',
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-double-bubble-progressive',
                                                gameType: {
                                                    winLineType: 'L2R',
                                                    maxMultiplier: '1',
                                                    type: 'Slots',
                                                    winLines: 20,
                                                    symbolType: ['Fruits'],
                                                    reel: '5-3',
                                                    isPersistence: false,
                                                    themes: ['Fruit', 'Bubble'],
                                                    features: [
                                                        'Free Spins',
                                                        'Scatter Wilds/Symbols',
                                                        'Multipliers (With or without wilds)',
                                                        'Bonus Game',
                                                    ],
                                                    isJackpotFixedPrize: false,
                                                    isJackpotInGameProgressive: false,
                                                    waysToWin: 'Other',
                                                    symbolCount: '1',
                                                    brand: '',
                                                    isJackpot: true,
                                                    isJackpotPlatformProgressive: false,
                                                },
                                                gameStudio: '',
                                                gameLoaderFileName: 'play-double-bubble-progressive',
                                                gameProvider: 'Anaxi',
                                                realUrl: '/service/game/play/play-double-bubble-progressive',
                                            },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/double-bubble-jackpot-logged-out/scale-s%s/double-bubble-jackpot-tile-r%s-w%s.jpg',
                                            },
                                            title: {
                                                'en-GB': 'Double Bubble Jackpot',
                                                es: 'Duble Buble Bote',
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        ],
    },
};

/** Matches IGameSearchRecord from app.ts – entryId, gameId, navigation required; rest optional */
export interface GameSearchResponse {
    entryId: string;
    gameId: string;
    navigation: string[];
    name?: string;
    title?: string;
    gameSkin?: string;
    mobileGameName?: string;
    demoUrl?: string;
    realUrl?: string;
    imgUrlPattern?: string;
    sash?: string;
    representativeColor?: string;
    headlessJackpot?: { id: string; name: string };
    tags?: string[];
    animationMedia?: string;
    foregroundLogoMedia?: unknown;
    backgroundMedia?: unknown;
    liveHidden?: boolean;
}

export const GET_ALL_GAMES_SEARCH_SUCCESS_RESP_LOGGED_OUT: GameSearchResponse[] = [
    {
        entryId: '37NY6w39viFoOzkoi6b0XV',
        gameId: '5KbFMEx7dZwCq5A5lPHu0o',
        name: 'play-bounty-raid',
        navigation: ['slots'],
        gameSkin: 'play-bounty-raid',
        demoUrl: '/service/game/demo/play-bounty-raid',
        realUrl: '/service/game/play/play-bounty-raid',
        title: 'Bounty Raid',
    },
    {
        entryId: '4OOeX5LNHHt9QR8aRQaCiD',
        gameId: '1hEc1VFYe9W6Qpj0oyBXfo',
        name: 'play-dond-instant',
        gameSkin: 'play-dond-instant',
        navigation: ['slots'],
        demoUrl: '/service/game/demo/play-dond-instant',
        realUrl: '/service/game/play/play-dond-instant',
        title: 'Deal or No Deal Instant',
    },
    {
        entryId: 'qKOglgrOFlHMm0WQ8RxNs',
        gameId: '5uZ7AcoH7EEzkJCSNzhCM',
        name: 'play-double-bubble-progressive',
        gameSkin: 'play-double-bubble-progressive',
        navigation: ['slots'],
        demoUrl: '/service/game/demo/play-double-bubble-progressive',
        realUrl: '/service/game/play/play-double-bubble-progressive',
        title: 'Double Bubble Jackpot',
        imgUrlPattern:
            '/api/content/gametiles/double-bubble-jackpot-logged-out/scale-s%s/double-bubble-jackpot-tile-r%s-w%s.jpg',
    },
];

/** Base game shape shared by constructGameSearchResponse fallback mocks */
const baseGameHitSiteGame = {
    id: 'game1',
    entryTitle: { 'en-GB': 'Game Entry Title 1' },
    environment: 'production',
    maxBet: { 'en-GB': '100' },
    minBet: { 'en-GB': '1' },
    liveHidden: { 'en-GB': false },
    sash: { 'en-GB': 'New' },
    headlessJackpot: { 'en-GB': { id: '1', name: 'Hello' } },
    contentType: '',
    gameId: 'game1a',
    updatedAt: '',
    game: [],
};

const baseGameHitGame = {
    id: '',
    contentType: '',
    updatedAt: '',
    entryTitle: '',
    gameName: 'Game Name 1',
    gameSkin: 'skin1',
    vendor: '',
    progressiveJackpot: false,
    showNetPosition: false,
    operatorBarDisabled: false,
    funPanelEnabled: false,
    rgpEnabled: false,
    gamePlatformConfig: {
        gameSkin: 'skin1',
        demoUrl: 'http://demo1.com',
        realUrl: 'http://real1.com',
        mobileOverride: false,
        name: 'Game Name 1',
        gameLoaderFileName: '',
        gameProvider: '',
        gameType: { type: 'type1' },
        rtp: 97.3,
        subGameType: 'Slots',
        federalGameType: 'Slots',
    },
    funPanelBackgroundImage: '',
    title: { 'en-GB': 'Game Title 1' },
    infoImgUrlPattern: { 'en-GB': '' },
    maxBet: { 'en-GB': '' },
    minBet: { 'en-GB': '' },
};

/** Game hit with only logged-out image URL (imgUrlPattern missing) – for fallback tests */
export const MOCK_GAME_HITS_ONLY_LOGGED_OUT_IMG: FullApiResponse[] = [
    {
        hit: { siteGame: baseGameHitSiteGame },
        innerHit: {
            game: {
                ...baseGameHitGame,
                gameName: 'Game Name 1',
                gameSkin: 'skin1',
                imgUrlPattern: undefined,
                loggedOutImgUrlPattern: { 'en-GB': 'http://only-logged-out.com' },
            },
        },
    },
];

/** Game hit with only logged-in image URL (loggedOutImgUrlPattern missing) – for fallback tests */
export const MOCK_GAME_HITS_ONLY_LOGGED_IN_IMG: FullApiResponse[] = [
    {
        hit: { siteGame: baseGameHitSiteGame },
        innerHit: {
            game: {
                ...baseGameHitGame,
                gameName: 'Game Name 1',
                gameSkin: 'skin1',
                imgUrlPattern: { 'en-GB': 'http://only-logged-in.com' },
                loggedOutImgUrlPattern: undefined,
            },
        },
    },
];

/** Minimal Bynder asset for foreground logo fallback test – exported so tests can derive expected sanitized value */
export const BYNDER_FOREGROUND_FALLBACK = [
    {
        id: 'fg1',
        name: 'foreground-logo-fallback',
        thumbnails: { transformBaseUrl: 'https://bynder/fg', original: 'https://bynder/fg-orig' },
    },
];

/** Game hit with only logged-out foreground logo media (foregroundLogoMedia missing) – for fallback tests */
export const MOCK_GAME_HITS_ONLY_LOGGED_OUT_FOREGROUND_LOGO: FullApiResponse[] = [
    {
        hit: { siteGame: baseGameHitSiteGame },
        innerHit: {
            game: {
                ...baseGameHitGame,
                gameName: 'Game Name 1',
                gameSkin: 'skin1',
                imgUrlPattern: { 'en-GB': 'http://image1.com' },
                loggedOutImgUrlPattern: { 'en-GB': 'http://loggedout1.com' },
                foregroundLogoMedia: undefined,
                loggedOutForegroundLogoMedia: { 'en-GB': BYNDER_FOREGROUND_FALLBACK },
            },
        },
    },
];

/** Minimal Bynder asset for background media fallback test – exported so tests can derive expected sanitized value */
export const BYNDER_BACKGROUND_FALLBACK = [
    {
        id: 'bg1',
        name: 'background-media-fallback',
        thumbnails: { transformBaseUrl: 'https://bynder/bg', original: 'https://bynder/bg-orig' },
    },
];

/** Game hit with only logged-out background media (backgroundMedia missing) – for fallback tests */
export const MOCK_GAME_HITS_ONLY_LOGGED_OUT_BACKGROUND: FullApiResponse[] = [
    {
        hit: { siteGame: baseGameHitSiteGame },
        innerHit: {
            game: {
                ...baseGameHitGame,
                gameName: 'Game Name 1',
                gameSkin: 'skin1',
                imgUrlPattern: { 'en-GB': 'http://image1.com' },
                loggedOutImgUrlPattern: { 'en-GB': 'http://loggedout1.com' },
                backgroundMedia: undefined,
                loggedOutBackgroundMedia: { 'en-GB': BYNDER_BACKGROUND_FALLBACK },
            },
        },
    },
];

/** Logged-in side Bynder assets – used by both-present and opposite-direction fallback tests */
export const BYNDER_FOREGROUND_PRIMARY = [
    {
        id: 'fg-in',
        name: 'foreground-logo-primary',
        thumbnails: { transformBaseUrl: 'https://bynder/fg-in', original: 'https://bynder/fg-in-orig' },
    },
];

export const BYNDER_BACKGROUND_PRIMARY = [
    {
        id: 'bg-in',
        name: 'background-media-primary',
        thumbnails: { transformBaseUrl: 'https://bynder/bg-in', original: 'https://bynder/bg-in-orig' },
    },
];

/** Game hit with only logged-in foreground logo media (loggedOutForegroundLogoMedia missing) – fallback in the opposite direction */
export const MOCK_GAME_HITS_ONLY_LOGGED_IN_FOREGROUND_LOGO: FullApiResponse[] = [
    {
        hit: { siteGame: baseGameHitSiteGame },
        innerHit: {
            game: {
                ...baseGameHitGame,
                gameName: 'Game Name 1',
                gameSkin: 'skin1',
                imgUrlPattern: { 'en-GB': 'http://image1.com' },
                loggedOutImgUrlPattern: { 'en-GB': 'http://loggedout1.com' },
                foregroundLogoMedia: { 'en-GB': BYNDER_FOREGROUND_PRIMARY },
                loggedOutForegroundLogoMedia: undefined,
            },
        },
    },
];

/** Game hit with only logged-in background media (loggedOutBackgroundMedia missing) – fallback in the opposite direction */
export const MOCK_GAME_HITS_ONLY_LOGGED_IN_BACKGROUND: FullApiResponse[] = [
    {
        hit: { siteGame: baseGameHitSiteGame },
        innerHit: {
            game: {
                ...baseGameHitGame,
                gameName: 'Game Name 1',
                gameSkin: 'skin1',
                imgUrlPattern: { 'en-GB': 'http://image1.com' },
                loggedOutImgUrlPattern: { 'en-GB': 'http://loggedout1.com' },
                backgroundMedia: { 'en-GB': BYNDER_BACKGROUND_PRIMARY },
                loggedOutBackgroundMedia: undefined,
            },
        },
    },
];

/** Game hit with both logged-in and logged-out fg/bg media populated – preference tests */
export const MOCK_GAME_HITS_BOTH_FG_BG_MEDIA: FullApiResponse[] = [
    {
        hit: { siteGame: baseGameHitSiteGame },
        innerHit: {
            game: {
                ...baseGameHitGame,
                gameName: 'Game Name 1',
                gameSkin: 'skin1',
                imgUrlPattern: { 'en-GB': 'http://image1.com' },
                loggedOutImgUrlPattern: { 'en-GB': 'http://loggedout1.com' },
                foregroundLogoMedia: { 'en-GB': BYNDER_FOREGROUND_PRIMARY },
                loggedOutForegroundLogoMedia: { 'en-GB': BYNDER_FOREGROUND_FALLBACK },
                backgroundMedia: { 'en-GB': BYNDER_BACKGROUND_PRIMARY },
                loggedOutBackgroundMedia: { 'en-GB': BYNDER_BACKGROUND_FALLBACK },
            },
        },
    },
];

interface EmptyOpenSearchResponse {
    hits?: { hits: unknown[] };
}

// Invalid responses
export const SEARCH_NO_GAMES_RESP: EmptyOpenSearchResponse = {};

export const NOT_FOUND_RESPONSE: { hits: { hits: unknown[] } } = {
    hits: {
        hits: [],
    },
};

export const AGGREGATE_QUERY_EXPECTED_MOCK = {
    size: 0,
    query: {
        bool: {
            must: [{ terms: { _id: ['1', '2', '3'] } }, { term: { 'show.en-GB.keyword': 'loggedOut' } }],
        },
    },
    aggs: {
        group_by_category: {
            filters: {
                filters: {
                    section1: { terms: { _id: ['1', '10', '11'] } },
                    section2: { terms: { _id: ['2', '20', '21'] } },
                },
            },
            aggs: {
                top_documents: {
                    top_hits: {
                        _source: {
                            includes: ['games', 'show', '_id'],
                        },
                        size: SECTION_DOCUMENTS_PER_AGGREGATED_LAYOUT_LIMIT,
                    },
                },
            },
        },
    },
};
