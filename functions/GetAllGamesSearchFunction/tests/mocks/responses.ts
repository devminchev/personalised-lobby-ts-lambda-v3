import { LocalizedField } from 'os-client';
import { SECTION_DOCUMENTS_PER_AGGREGATED_LAYOUT_LIMIT } from '../../app';
import { Sys } from 'os-client/lib/sharedInterfaces/common';

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
                    entryTitle: { 'en-GB': 'Test Monopoly' },
                    label: {
                        'en-GB': 'search',
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
                    games: {
                        'en-US': [
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '6QC4uUhyL8FkEJftMbtCX0',
                                    type: 'Link',
                                },
                            },
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '4zXHhwUx4LV8f9XcKOIeoT',
                                    type: 'Link',
                                },
                            },
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '3A6tNALdPTpwOFCSb7764L',
                                    type: 'Link',
                                },
                            },
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '3XcmzPknUGvwZ6jpHYpigi',
                                    type: 'Link',
                                },
                            },
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: 'AvXktWFf2j5MI4aLCLK4P',
                                    type: 'Link',
                                },
                            },
                        ],
                    },
                    id: '41eSB85ytFfnyLrq0Y2jkJ',
                    title: {
                        'en-US': 'All Slots',
                    },
                    classification: {
                        'en-US': 'GameSection',
                    },
                    entryTitle: {
                        'en-US': 'All Slots  [ballybetri]',
                    },
                },
            },
        ],
    },
};

// Logged out Mocks
export const SECTION_SUCCESS_RESP_LOGGED_OUT: any = {
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

export const GAMES_SEARCH_SUCCESS_RESP_LOGGED_OUT: any = {
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
                                            gamePlatformConfig: {
                                                'en-GB': {
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
                                                    gameSkin: 'play-bounty-raid',
                                                    gameStudio: 'Red Tiger',
                                                    gameLoaderFileName: 'play-bounty-raid',
                                                    gameProvider: 'Evolution Gaming',
                                                    name: 'play-bounty-raid',
                                                    realUrl: '/service/game/play/play-bounty-raid',
                                                },
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
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    demoUrl: '/service/game/demo/play-dond-instant',
                                                    gameType: {
                                                        themes: ['Branded'],
                                                        features: [],
                                                        type: 'Instant Win',
                                                    },
                                                    gameSkin: 'play-dond-instant',
                                                    gameStudio: '',
                                                    gameLoaderFileName: 'play-dond-instant',
                                                    gameProvider: 'Anaxi',
                                                    name: 'play-dond-instant',
                                                    realUrl: '/service/game/play/play-dond-instant',
                                                },
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
                                            gamePlatformConfig: {
                                                'en-GB': {
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
                                                    gameSkin: 'play-double-bubble-progressive',
                                                    gameStudio: '',
                                                    gameLoaderFileName: 'play-double-bubble-progressive',
                                                    gameProvider: 'Anaxi',
                                                    name: 'play-double-bubble-progressive',
                                                    realUrl: '/service/game/play/play-double-bubble-progressive',
                                                },
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

interface GameSearchResponse {
    entryId: string;
    gameId: string;
    name: string;
    navigation: string[];
    gameSkin: string;
    demoUrl: string;
    realUrl: string;
    title: string;
    imgUrlPattern?: string;
}

export const GET_ALL_GAMES_SEARCH_SUCCESS_RESP_LOGGED_OUT: GameSearchResponse[] = [
    {
        entryId: '37NY6w39viFoOzkoi6b0XV',
        gameId: '5KbFMEx7dZwCq5A5lPHu0o',
        name: 'play-bounty-raid',
        navigation: [],
        gameSkin: 'play-bounty-raid',
        demoUrl: '/service/game/demo/play-bounty-raid',
        realUrl: '/service/game/play/play-bounty-raid',
        title: 'Bounty Raid',
    },
    {
        entryId: '4OOeX5LNHHt9QR8aRQaCiD',
        gameId: '1hEc1VFYe9W6Qpj0oyBXfo',
        name: 'play-dond-instant',
        navigation: [],
        gameSkin: 'play-dond-instant',
        demoUrl: '/service/game/demo/play-dond-instant',
        realUrl: '/service/game/play/play-dond-instant',
        title: 'Deal or No Deal Instant',
    },
    {
        entryId: 'qKOglgrOFlHMm0WQ8RxNs',
        gameId: '5uZ7AcoH7EEzkJCSNzhCM',
        name: 'play-double-bubble-progressive',
        navigation: [],
        gameSkin: 'play-double-bubble-progressive',
        demoUrl: '/service/game/demo/play-double-bubble-progressive',
        realUrl: '/service/game/play/play-double-bubble-progressive',
        title: 'Double Bubble Jackpot',
        imgUrlPattern:
            '/api/content/gametiles/double-bubble-jackpot-logged-out/scale-s%s/double-bubble-jackpot-tile-r%s-w%s.jpg',
    },
];

// Invalid responses
export const SEARCH_NO_GAMES_RESP: any = {};

export const NOT_FOUND_RESPONSE: any = {
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
