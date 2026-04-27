type VentureSuccessResp = {
    hits: {
        hits: Array<{
            _source: {
                id: string;
            };
        }>;
    };
};

export const VENTURE_SUCCESS_RESP: VentureSuccessResp = {
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

export const MINI_GAMES_VIEW_SUCCESS_RESP: any = {
    hits: {
        hits: [
            {
                _id: 'view-id-123',
                _source: {
                    id: 'view-id-123',
                    layoutType: { 'en-GB': 'carousel' },
                    entryTitle: {
                        'en-GB': 'Casino',
                    },
                    sections: {
                        'en-GB': [
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '5BmNlcRY7fpjswkFWIgcAG',
                                    type: 'Link',
                                },
                            },
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '5EL54OUsK0hAcilOLnQ7e1',
                                    type: 'Link',
                                },
                            },
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '3qEifpMca9U9KH0Gxd6B8x',
                                    type: 'Link',
                                },
                            },
                        ],
                    },
                },
            },
        ],
    },
};

export const MINIGAMES_SECTIONS_SUCCESS_RESP: any = {
    hits: {
        hits: [
            {
                _id: '5BmNlcRY7fpjswkFWIgcAG',
                _source: {
                    games: {
                        'en-GB': [
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '6Jtq8uXIyHYTWlxNE6mwoo',
                                    type: 'Link',
                                },
                            },
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '1d37PmCTEGh4uxmzfXXuCN',
                                    type: 'Link',
                                },
                            },
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '1NKiyE8lJCEpMCYaEJYnFh',
                                    type: 'Link',
                                },
                            },
                        ],
                    },
                    id: '5BmNlcRY7fpjswkFWIgcAG',
                    layoutType: { 'en-GB': 'carousel' },
                    title: {
                        'en-GB': 'Casino',
                    },
                    slug: {
                        'en-GB': 'casino-instants',
                    },
                },
            },
            {
                _id: '5EL54OUsK0hAcilOLnQ7e1',
                _source: {
                    games: {
                        'en-GB': [
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '2kbABCf2scPTwnDdmdRdQg',
                                    type: 'Link',
                                },
                            },
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '6r4regu5oPENx3XwgRjq7i',
                                    type: 'Link',
                                },
                            },
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '2Q9RdLiBMC0PsiXojtvVSv',
                                    type: 'Link',
                                },
                            },
                        ],
                    },
                    id: '5EL54OUsK0hAcilOLnQ7e1',
                    layoutType: { 'en-GB': 'carousel' },
                    title: {
                        'en-GB': 'Slots',
                    },
                    slug: {
                        'en-GB': 'Slots',
                    },
                },
            },
            {
                _id: '3qEifpMca9U9KH0Gxd6B8x',
                _source: {
                    games: {
                        'en-GB': [
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '6I8sZ6HswvkYzeDxzdK0lH',
                                    type: 'Link',
                                },
                            },
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '41fbJPCxAfOectyDY7I8fl',
                                    type: 'Link',
                                },
                            },
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '6I8sZ6HswvkYzeDxzdK0lH',
                                    type: 'Link',
                                },
                            },
                        ],
                    },
                    id: '3qEifpMca9U9KH0Gxd6B8x',
                    layoutType: { 'en-GB': 'carousel' },
                    title: {
                        'en-GB': 'Instants',
                    },
                    slug: {
                        'en-GB': 'instants',
                    },
                },
            },
        ],
    },
};

export const MINIGAMES_SECTIONS_INVALID_GAMES_RESP: any = {
    hits: {
        hits: [
            {
                _id: '5BmNlcRY7fpjswkFWIgcAG',
                _source: {
                    games: {
                        'en-GB': [
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: 'invalid-games-id-1',
                                    type: 'Link',
                                },
                            },
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: 'invalid-games-id-2',
                                    type: 'Link',
                                },
                            },
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: 'invalid-games-id-3',
                                    type: 'Link',
                                },
                            },
                        ],
                    },
                    id: '5BmNlcRY7fpjswkFWIgcAG',
                    layoutType: { 'en-GB': 'carousel' },
                    title: {
                        'en-GB': 'Casino',
                    },
                },
            },
        ],
    },
};

export const MINIGAMES_GAMES_SUCCESS_RESP: any = {
    hits: {
        hits: [
            {
                _id: '1d37PmCTEGh4uxmzfXXuCN',
                _routing: '23ZCD98T0sdDn0kjqlpaoZ',
                _source: {
                    siteGame: {
                        sash: {
                            'en-GB': '',
                        },
                        id: '1d37PmCTEGh4uxmzfXXuCN',
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            hits: [
                                {
                                    _id: '23ZCD98T0sdDn0kjqlpaoZ',
                                    _source: {
                                        game: {
                                            entryTitle: 'play-blackjack-singlehand-mini',
                                            gameName: 'play-blackjack-singlehand-mini',
                                            gameSkin: 'play-blackjack-singlehand-mini',
                                            mobileGameName: '',
                                            mobileGameSkin: '',
                                            mobileOverride: false,
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-blackjack-singlehand-mini',
                                                realUrl: '/service/game/play/play-blackjack-singlehand-mini',
                                                mobileDemoUrl: '',
                                                mobileRealUrl: '',
                                            },
                                            representativeColor: {
                                                'en-GB': '#000000',
                                            },
                                            id: '23ZCD98T0sdDn0kjqlpaoZ',
                                            title: {
                                                'en-GB': 'Single Deck Blackjack',
                                                es: 'Blackjack Clásico',
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
                _id: '3m2aXqdWymnzm3BYXvtGzD',
                _routing: 'slaqrBjg18dRvXXEObWvQ',
                _source: {
                    siteGame: {
                        sash: {
                            'en-GB': '',
                        },
                        id: '3m2aXqdWymnzm3BYXvtGzD',
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            hits: [
                                {
                                    _id: 'slaqrBjg18dRvXXEObWvQ',
                                    _source: {
                                        game: {
                                            entryTitle: 'js-dfg-doubly-bubbly',
                                            gameName: 'js-dfg-doubly-bubbly',
                                            gameSkin: 'js-dfg-doubly-bubbly',
                                            mobileGameName: '',
                                            mobileGameSkin: '',
                                            mobileOverride: false,
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/new-doubly-bubbly/scale-s%s/doubly-bubbly-tile-r%s-w%s.jpg',
                                            },
                                            gamePlatformConfig: {
                                                gameType: {
                                                    type: '',
                                                },
                                                gameStudio: '',
                                                gameProvider: '',
                                                demoUrl: '',
                                                realUrl: '/service/game/play/js-dfg-doubly-bubbly',
                                                mobileDemoUrl: '',
                                                mobileRealUrl: '',
                                                gameLoaderFileName: 'js-dfg-doubly-bubbly',
                                                mobileGameLoaderFileName: '',
                                            },
                                            representativeColor: {
                                                'en-GB': '#FAA0CC',
                                            },
                                            id: 'slaqrBjg18dRvXXEObWvQ',
                                            title: {
                                                'en-GB': 'Doubly Bubbly',
                                                es: 'Doubly Bubbly',
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
                _id: '6I8sZ6HswvkYzeDxzdK0lH',
                _routing: '14nUSaeByp2mpe1jkMJyvM',
                _source: {
                    siteGame: {
                        sash: {
                            'en-GB': '',
                        },
                        id: '6I8sZ6HswvkYzeDxzdK0lH',
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            hits: [
                                {
                                    _id: '14nUSaeByp2mpe1jkMJyvM',
                                    _source: {
                                        game: {
                                            entryTitle: 'play-diamond-ultracash-mini',
                                            gameName: 'play-diamond-ultracash-mini',
                                            gameSkin: 'play-diamond-ultracash-mini',
                                            mobileGameName: '',
                                            mobileGameSkin: '',
                                            mobileOverride: false,
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-diamond-ultracash-mini',
                                                realUrl: '/service/game/play/play-diamond-ultracash-mini',
                                                mobileDemoUrl: '',
                                                mobileRealUrl: '',
                                            },
                                            representativeColor: {
                                                'en-GB': '#180839',
                                            },
                                            id: '14nUSaeByp2mpe1jkMJyvM',
                                            title: {
                                                'en-GB': 'Diamond Ultracash Mini',
                                                es: 'Diamond Ultracash',
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
                _id: '1NKiyE8lJCEpMCYaEJYnFh',
                _routing: '5OJhvzGJZBExYQjgayuG7u',
                _source: {
                    siteGame: {
                        sash: {
                            'en-GB': '',
                        },
                        id: '1NKiyE8lJCEpMCYaEJYnFh',
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            hits: [
                                {
                                    _id: '5OJhvzGJZBExYQjgayuG7u',
                                    _source: {
                                        game: {
                                            entryTitle: 'play-hi-lo-mini',
                                            gameName: 'play-hi-lo-mini',
                                            gameSkin: 'play-hi-lo-mini',
                                            mobileGameName: '',
                                            mobileGameSkin: '',
                                            mobileOverride: false,
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-hi-lo-mini',
                                                realUrl: '/service/game/play/play-hi-lo-mini',
                                                mobileDemoUrl: '',
                                                mobileRealUrl: '',
                                            },
                                            representativeColor: {
                                                'en-GB': '#25102f',
                                            },
                                            id: '5OJhvzGJZBExYQjgayuG7u',
                                            title: {
                                                'en-GB': 'Hi-Lo',
                                                es: 'Hi-Lo',
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
                _id: '1FCg46Sb4agE2qhoYmRnrw',
                _routing: 'suuHbTushAUCfC7nAlYBi',
                _source: {
                    siteGame: {
                        sash: {
                            'en-GB': '',
                        },
                        id: '1FCg46Sb4agE2qhoYmRnrw',
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            hits: [
                                {
                                    _id: 'suuHbTushAUCfC7nAlYBi',
                                    _source: {
                                        game: {
                                            entryTitle: 'play-scratchcard-shop-mini',
                                            gameName: 'play-scratchcard-shop-mini',
                                            gameSkin: 'play-scratchcard-shop-mini',
                                            mobileGameName: '',
                                            mobileGameSkin: '',
                                            mobileOverride: false,
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-scratchcard-shop-mini',
                                                realUrl: '/service/game/play/play-scratchcard-shop-mini',
                                                mobileDemoUrl: '',
                                                mobileRealUrl: '',
                                            },
                                            representativeColor: {
                                                'en-GB': '#405f35',
                                            },
                                            id: 'suuHbTushAUCfC7nAlYBi',
                                            title: {
                                                'en-GB': 'Scratchcard Shop',
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
                _index: 'games',
                _id: '6r4regu5oPENx3XwgRjq7i',
                _score: 2.0,
                _routing: '6XyGLzOJmIVsVmQfpvfhx6',
                _source: {
                    siteGame: {
                        sash: {
                            'en-GB': '',
                        },
                        id: '6r4regu5oPENx3XwgRjq7i',
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            total: {
                                value: 1,
                                relation: 'eq',
                            },
                            max_score: 1.0,
                            hits: [
                                {
                                    _index: 'games',
                                    _id: '6XyGLzOJmIVsVmQfpvfhx6',
                                    _score: 1.0,
                                    _source: {
                                        game: {
                                            entryTitle: 'play-micro-amazing-catch',
                                            gameName: 'play-micro-amazing-catch',
                                            gameSkin: 'MGSD_AMAZING_CATCH',
                                            mobileGameName: 'play-micro-amazing-catch-m',
                                            mobileGameSkin: 'MGSM_AMAZING_CATCH',
                                            mobileOverride: true,
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/amazing-catch/scale-s%s/amazing-catch-tile-r%s-w%s.jpg',
                                            },
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-micro-amazing-catch',
                                                realUrl: '/service/game/play/play-micro-amazing-catch',
                                                mobileDemoUrl: '/service/game/demo/play-micro-amazing-catch-m',
                                                mobileRealUrl: '/service/game/play/play-micro-amazing-catch-m',
                                                gameLoaderFileName: 'MGSD_AMAZING_CATCH',
                                                mobileGameLoaderFileName: 'MGSM_AMAZING_CATCH',
                                            },
                                            representativeColor: {
                                                'en-GB': '#5CB5C0',
                                            },
                                            id: '6XyGLzOJmIVsVmQfpvfhx6',
                                            title: {
                                                'en-GB': 'Amazing Catch',
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

export const MINIGAMES_ENDPOINT_SUCCESS_RESP: any = [
    {
        entryId: '5BmNlcRY7fpjswkFWIgcAG',
        title: 'Casino',
        name: 'casino-instants',
        layoutType: 'carousel',
        games: [
            {
                entryId: '1d37PmCTEGh4uxmzfXXuCN',
                gameId: '23ZCD98T0sdDn0kjqlpaoZ',
                name: 'play-blackjack-singlehand-mini',
                title: 'Single Deck Blackjack',
                realUrl: '/service/game/play/play-blackjack-singlehand-mini',
                demoUrl: '/service/game/demo/play-blackjack-singlehand-mini',
                gameSkin: 'play-blackjack-singlehand-mini',
                representativeColor: '#000000',
            },
            {
                entryId: '1NKiyE8lJCEpMCYaEJYnFh',
                gameId: '5OJhvzGJZBExYQjgayuG7u',
                name: 'play-hi-lo-mini',
                title: 'Hi-Lo',
                realUrl: '/service/game/play/play-hi-lo-mini',
                demoUrl: '/service/game/demo/play-hi-lo-mini',
                gameSkin: 'play-hi-lo-mini',
                representativeColor: '#25102f',
            },
        ],
    },
    {
        entryId: '5EL54OUsK0hAcilOLnQ7e1',
        title: 'Slots',
        name: 'slots',
        layoutType: 'carousel',
        games: [
            {
                entryId: '6r4regu5oPENx3XwgRjq7i',
                gameId: '6XyGLzOJmIVsVmQfpvfhx6',
                name: 'play-micro-amazing-catch',
                title: 'Amazing Catch',
                realUrl: '/service/game/play/play-micro-amazing-catch',
                demoUrl: '/service/game/demo/play-micro-amazing-catch',
                gameSkin: 'MGSD_AMAZING_CATCH',
                representativeColor: '#5CB5C0',
                mobileName: 'play-micro-amazing-catch-m',
                mobileRealUrl: '/service/game/play/play-micro-amazing-catch-m',
                mobileDemoUrl: '/service/game/demo/play-micro-amazing-catch-m',
                mobileGameSkin: 'MGSM_AMAZING_CATCH',
            },
        ],
    },
    {
        entryId: '3qEifpMca9U9KH0Gxd6B8x',
        title: 'Instants',
        name: 'instants',
        layoutType: 'carousel',
        games: [
            {
                entryId: '6I8sZ6HswvkYzeDxzdK0lH',
                gameId: '14nUSaeByp2mpe1jkMJyvM',
                name: 'play-diamond-ultracash-mini',
                title: 'Diamond Ultracash Mini',
                realUrl: '/service/game/play/play-diamond-ultracash-mini',
                demoUrl: '/service/game/demo/play-diamond-ultracash-mini',
                gameSkin: 'play-diamond-ultracash-mini',
                representativeColor: '#180839',
            },
            {
                entryId: '6I8sZ6HswvkYzeDxzdK0lH',
                gameId: '14nUSaeByp2mpe1jkMJyvM',
                name: 'play-diamond-ultracash-mini',
                title: 'Diamond Ultracash Mini',
                realUrl: '/service/game/play/play-diamond-ultracash-mini',
                demoUrl: '/service/game/demo/play-diamond-ultracash-mini',
                gameSkin: 'play-diamond-ultracash-mini',
                representativeColor: '#180839',
            },
        ],
    },
];

// Invalid responses

export const NOT_FOUND_RESPONSE: any = {
    hits: {
        hits: [],
    },
};
