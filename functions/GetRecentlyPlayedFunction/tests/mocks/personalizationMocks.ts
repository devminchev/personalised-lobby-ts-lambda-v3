export const VENTURE_SUCCESS_RESP: any = {
    hits: {
        hits: [
            {
                _source: {
                    id: '1fd1fhxDoqK6YigBiamFIe',
                },
            },
        ],
    },
};

export const ML_RECENTLY_PLAYED_INDEX_RESP = {
    hits: {
        total: {
            value: 1,
            relation: 'eq',
        },
        hits: [
            {
                _index: 'vitruvian-ml-eu-games-recommender-v2',
                _id: '18530334_doublebubblebingo',
                _score: 7.8897095,
                _source: {
                    recently_played_games: [
                        {
                            game_skin: 'play-double-bubble-super-7',
                            margin: 0.08,
                            margin_rank: 1,
                            rounds: 341,
                            rtp: 92,
                            wager: 108.8,
                        },
                        {
                            game_skin: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                            margin: 0.07,
                            margin_rank: 2,
                            rounds: 210,
                            rtp: 97,
                            wager: 80.2,
                        },
                        {
                            game_skin: 'play-double-bubble-triple',
                            margin: 0.06,
                            margin_rank: 3,
                            rounds: 145,
                            rtp: 91,
                            wager: 55.6,
                        },
                        {
                            game_skin: 'PP_BIG_BASS_SPLASH',
                            margin: 0.05,
                            margin_rank: 4,
                            rounds: 98,
                            rtp: 94,
                            wager: 42.3,
                        },
                    ],
                },
            },
        ],
    },
};

export const RP_SECTION_RESP = {
    hits: {
        max_score: 0,
        hits: [
            {
                _index: 'ml-personalised-sections',
                _id: '6NBGF7dCAX3silldblHBlI',
                _score: 0,
                _source: {
                    sessionVisibility: {
                        'en-GB': ['loggedIn'],
                    },
                    sort: {
                        'en-GB': 'margin',
                    },
                    id: '6NBGF7dCAX3silldblHBlI',
                    type: {
                        'en-GB': 'recently-played',
                    },
                },
            },
        ],
    },
};

export const INDEX_EMPTY_RESP = {
    hits: {
        total: {
            value: 0,
            relation: 'eq',
        },
        max_score: 7.8897095,
        hits: [],
    },
};

export const GAME_SITE_GAME_RESP = {
    hits: {
        total: {
            value: 4,
            relation: 'eq',
        },
        max_score: 2.0,
        hits: [
            {
                _index: 'games',
                _id: 'game-1',
                _score: 2.0,
                _source: {
                    game: {
                        entryTitle: 'play-double-bubble-super-7',
                        gameName: 'play-double-bubble-super-7',
                        gameSkin: 'play-double-bubble-super-7',
                        mobileGameName: '',
                        mobileGameSkin: '',
                        mobileOverride: false,
                        vendor: 'gamesys',
                        progressiveJackpot: true,
                        showNetPosition: false,
                        operatorBarDisabled: false,
                        funPanelEnabled: false,
                        rgpEnabled: false,
                        id: 'game-1',
                        title: {
                            'en-GB': 'Double Bubble Super 7',
                        },
                        imgUrlPattern: {
                            'en-GB': '/assets/double-bubble-super-7.jpg',
                        },
                        videoUrlPattern: {
                            'en-GB': 'https://cdn.example.com/double-bubble-super-7.mp4',
                        },
                        representativeColor: {
                            'en-GB': '#8CC8AC',
                        },
                        progressiveBackgroundColor: {
                            'en-GB': '#8CC8AC',
                        },
                        animationMedia: {
                            'en-GB': 'default',
                        },
                        tags: ['new'],
                        metadataTags: [],
                        gamePlatformConfig: {
                            name: 'play-double-bubble-super-7',
                            demoUrl: '/service/game/demo/play-double-bubble-super-7',
                            realUrl: '/service/game/play/play-double-bubble-super-7',
                            mobileDemoUrl: '',
                            mobileRealUrl: '',
                            gameType: {
                                type: 'Slots',
                            },
                        },
                        foregroundLogoMedia: {
                            'en-GB': [
                                {
                                    archive: 0,
                                    brandId: 'F4D1429C-9A8C-4F26-AEEC595722828461',
                                    copyright: '',
                                    dateCreated: '2025-11-07T13:22:53Z',
                                    dateModified: '2025-11-07T13:22:55Z',
                                    datePublished: '2025-11-07T13:22:53Z',
                                    description: '',
                                    extension: ['webp'],
                                    fileSize: 25422,
                                    height: 264,
                                    id: 'C417C874-AB45-4F1E-A76678A9D13E9C2A',
                                    isPublic: 0,
                                    limited: 0,
                                    name: 'es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444',
                                    orientation: 'landscape',
                                    original:
                                        'https://assets.ballys.com/m/6c2c6f6a0d8907c6/original/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.webp',
                                    thumbnails: {
                                        webimage:
                                            'https://assets.ballys.com/m/6c2c6f6a0d8907c6/webimage-es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.jpg',
                                        thul: 'https://assets.ballys.com/m/6c2c6f6a0d8907c6/thul-es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.jpg',
                                        mini: 'https://assets.ballys.com/m/6c2c6f6a0d8907c6/mini-es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.jpg',
                                        transformBaseUrl:
                                            'https://assets.ballys.com/transform/c417c874-ab45-4f1e-a766-78a9d13e9c2a/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444',
                                        BlurBackground:
                                            'https://assets.ballys.com/transform/BlurBackground/c417c874-ab45-4f1e-a766-78a9d13e9c2a/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444',
                                        LPhone600x1200:
                                            'https://assets.ballys.com/transform/LPhone600x1200/c417c874-ab45-4f1e-a766-78a9d13e9c2a/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444',
                                        original:
                                            'https://assets.ballys.com/m/6c2c6f6a0d8907c6/original/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.webp',
                                        JPJ_Thumbnail:
                                            'https://assets.ballys.com/transform/JPJ_Thumbnail/c417c874-ab45-4f1e-a766-78a9d13e9c2a/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444',
                                    },
                                    type: 'image',
                                    watermarked: 0,
                                    width: 888,
                                    videoPreviewURLs: [],
                                    tags: [],
                                    textMetaproperties: [],
                                    src: 'https://assets.ballys.com/m/6c2c6f6a0d8907c6/webimage-es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.jpg',
                                },
                            ],
                        },
                        backgroundMedia: {
                            'en-GB': [
                                {
                                    archive: 0,
                                    brandId: 'F4D1429C-9A8C-4F26-AEEC595722828461',
                                    copyright: '',
                                    dateCreated: '2025-11-07T13:22:53Z',
                                    dateModified: '2025-11-07T13:22:55Z',
                                    datePublished: '2025-11-07T13:22:53Z',
                                    description: '',
                                    extension: ['webp'],
                                    fileSize: 25422,
                                    height: 264,
                                    id: 'C417C874-AB45-4F1E-A76678A9D13E9C2A',
                                    isPublic: 0,
                                    limited: 0,
                                    name: 'es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444',
                                    orientation: 'landscape',
                                    original:
                                        'https://assets.ballys.com/m/6c2c6f6a0d8907c6/original/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.webp',
                                    thumbnails: {
                                        webimage:
                                            'https://assets.ballys.com/m/6c2c6f6a0d8907c6/webimage-es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.jpg',
                                        thul: 'https://assets.ballys.com/m/6c2c6f6a0d8907c6/thul-es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.jpg',
                                        mini: 'https://assets.ballys.com/m/6c2c6f6a0d8907c6/mini-es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.jpg',
                                        transformBaseUrl:
                                            'https://assets.ballys.com/transform/c417c874-ab45-4f1e-a766-78a9d13e9c2a/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444',
                                        BlurBackground:
                                            'https://assets.ballys.com/transform/BlurBackground/c417c874-ab45-4f1e-a766-78a9d13e9c2a/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444',
                                        LPhone600x1200:
                                            'https://assets.ballys.com/transform/LPhone600x1200/c417c874-ab45-4f1e-a766-78a9d13e9c2a/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444',
                                        original:
                                            'https://assets.ballys.com/m/6c2c6f6a0d8907c6/original/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.webp',
                                        JPJ_Thumbnail:
                                            'https://assets.ballys.com/transform/JPJ_Thumbnail/c417c874-ab45-4f1e-a766-78a9d13e9c2a/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444',
                                    },
                                    type: 'image',
                                    watermarked: 0,
                                    width: 888,
                                    videoPreviewURLs: [],
                                    tags: [],
                                    textMetaproperties: [],
                                    src: 'https://assets.ballys.com/m/6c2c6f6a0d8907c6/webimage-es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.jpg',
                                },
                            ],
                        },
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            total: {
                                value: 1,
                                relation: 'eq',
                            },
                            hits: [
                                {
                                    _source: {
                                        siteGame: {
                                            id: 'sitegame-1',
                                            sash: {
                                                'en-GB': 'FEATURED',
                                            },
                                            liveHidden: {
                                                'en-GB': false,
                                            },
                                            headlessJackpot: {
                                                'en-GB': {
                                                    id: 'hj-1',
                                                    name: 'HJ 1',
                                                },
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
                _id: 'game-2',
                _score: 1.9,
                _source: {
                    game: {
                        entryTitle: 'play-ev-signature-speed-blackjack-2',
                        gameName: 'play-ev-signature-speed-blackjack-2',
                        gameSkin: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                        mobileGameName: '',
                        mobileGameSkin: '',
                        mobileOverride: false,
                        vendor: 'evolution',
                        progressiveJackpot: false,
                        showNetPosition: false,
                        operatorBarDisabled: false,
                        funPanelEnabled: false,
                        rgpEnabled: false,
                        id: 'game-2',
                        title: {
                            'en-GB': 'Signature Speed Blackjack 2',
                        },
                        imgUrlPattern: {
                            'en-GB': '/assets/signature-speed-blackjack-2.jpg',
                        },
                        representativeColor: {
                            'en-GB': '#000B1D',
                        },
                        metadataTags: [],
                        gamePlatformConfig: {
                            name: 'play-ev-signature-speed-blackjack-2',
                            demoUrl: '/service/game/demo/play-ev-signature-speed-blackjack-2',
                            realUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                            mobileDemoUrl: '',
                            mobileRealUrl: '',
                            gameType: {
                                type: 'Table',
                            },
                        },
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            total: {
                                value: 1,
                                relation: 'eq',
                            },
                            hits: [
                                {
                                    _source: {
                                        siteGame: {
                                            id: 'sitegame-2',
                                            sash: {
                                                'en-GB': '',
                                            },
                                            liveHidden: {
                                                'en-GB': false,
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
                _id: 'game-3',
                _score: 1.8,
                _source: {
                    game: {
                        entryTitle: 'play-double-bubble-triple',
                        gameName: 'play-double-bubble-triple',
                        gameSkin: 'play-double-bubble-triple',
                        mobileGameName: '',
                        mobileGameSkin: '',
                        mobileOverride: false,
                        vendor: 'gamesys',
                        progressiveJackpot: true,
                        showNetPosition: false,
                        operatorBarDisabled: false,
                        funPanelEnabled: false,
                        rgpEnabled: false,
                        id: 'game-3',
                        title: {
                            'en-GB': 'Double Bubble Triple Jackpot',
                        },
                        imgUrlPattern: {
                            'en-GB': '/assets/double-bubble-triple-jackpot.jpg',
                        },
                        representativeColor: {
                            'en-GB': '#40C37F',
                        },
                        metadataTags: [],
                        gamePlatformConfig: {
                            name: 'play-double-bubble-triple',
                            demoUrl: '/service/game/demo/play-double-bubble-triple',
                            realUrl: '/service/game/play/play-double-bubble-triple',
                            mobileDemoUrl: '',
                            mobileRealUrl: '',
                            gameType: {
                                type: 'Slots',
                            },
                        },
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            total: {
                                value: 1,
                                relation: 'eq',
                            },
                            hits: [
                                {
                                    _source: {
                                        siteGame: {
                                            id: 'sitegame-3',
                                            sash: {
                                                'en-GB': 'EXCLUSIVE',
                                            },
                                            liveHidden: {
                                                'en-GB': false,
                                            },
                                            headlessJackpot: {
                                                'en-GB': {
                                                    id: 'hj-3',
                                                    name: 'HJ 3',
                                                },
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
                _id: 'game-4',
                _score: 1.7,
                _source: {
                    game: {
                        entryTitle: 'play-big-bass-splash',
                        gameName: 'play-big-bass-splash',
                        gameSkin: 'PP_BIG_BASS_SPLASH',
                        mobileGameName: '',
                        mobileGameSkin: '',
                        mobileOverride: false,
                        vendor: 'pragmatic',
                        progressiveJackpot: false,
                        showNetPosition: false,
                        operatorBarDisabled: false,
                        funPanelEnabled: false,
                        rgpEnabled: false,
                        id: 'game-4',
                        title: {
                            'en-GB': 'Big Bass Splash',
                        },
                        imgUrlPattern: {
                            'en-GB': '/assets/big-bass-splash.jpg',
                        },
                        representativeColor: {
                            'en-GB': '#163850',
                        },
                        metadataTags: [],
                        gamePlatformConfig: {
                            name: 'play-big-bass-splash',
                            demoUrl: '/service/game/demo/play-big-bass-splash',
                            realUrl: '/service/game/play/play-big-bass-splash',
                            mobileDemoUrl: '',
                            mobileRealUrl: '',
                            gameType: {
                                type: 'Slots',
                            },
                        },
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            total: {
                                value: 1,
                                relation: 'eq',
                            },
                            hits: [
                                {
                                    _source: {
                                        siteGame: {
                                            id: 'sitegame-4',
                                            sash: {
                                                'en-GB': 'DROPS & WINS',
                                            },
                                            liveHidden: {
                                                'en-GB': false,
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
                _id: 'game-5',
                _score: 1.6,
                _source: {
                    game: {
                        entryTitle: 'play-excluded-game',
                        gameName: 'play-excluded-game',
                        gameSkin: 'EXCLUDED_GAME_SKIN',
                        mobileGameName: '',
                        mobileGameSkin: '',
                        mobileOverride: false,
                        vendor: 'gamesys',
                        progressiveJackpot: false,
                        showNetPosition: false,
                        operatorBarDisabled: false,
                        funPanelEnabled: false,
                        rgpEnabled: false,
                        id: 'game-5',
                        title: {
                            'en-GB': 'Excluded Recently Played Game',
                        },
                        imgUrlPattern: {
                            'en-GB': '/assets/excluded-game.jpg',
                        },
                        representativeColor: {
                            'en-GB': '#123456',
                        },
                        metadataTags: ['exclude_recently_played'],
                        gamePlatformConfig: {
                            name: 'play-excluded-game',
                            demoUrl: '/service/game/demo/play-excluded-game',
                            realUrl: '/service/game/play/play-excluded-game',
                            mobileDemoUrl: '',
                            mobileRealUrl: '',
                            gameType: {
                                type: 'Slots',
                            },
                        },
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            total: {
                                value: 1,
                                relation: 'eq',
                            },
                            hits: [
                                {
                                    _source: {
                                        siteGame: {
                                            id: 'sitegame-5',
                                            sash: {
                                                'en-GB': '',
                                            },
                                            liveHidden: {
                                                'en-GB': false,
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
                _id: 'game-6',
                _score: 1.5,
                _source: {
                    game: {
                        entryTitle: 'play-tagged-allowed',
                        gameName: 'play-tagged-allowed',
                        gameSkin: 'TAGGED_ALLOWED_SKIN',
                        mobileGameName: '',
                        mobileGameSkin: '',
                        mobileOverride: false,
                        vendor: 'gamesys',
                        progressiveJackpot: false,
                        showNetPosition: false,
                        operatorBarDisabled: false,
                        funPanelEnabled: false,
                        rgpEnabled: false,
                        id: 'game-6',
                        title: {
                            'en-GB': 'Tagged But Allowed Game',
                        },
                        imgUrlPattern: {
                            'en-GB': '/assets/tagged-allowed.jpg',
                        },
                        representativeColor: {
                            'en-GB': '#654321',
                        },
                        metadataTags: ['some_other_tag'],
                        gamePlatformConfig: {
                            name: 'play-tagged-allowed',
                            demoUrl: '/service/game/demo/play-tagged-allowed',
                            realUrl: '/service/game/play/play-tagged-allowed',
                            mobileDemoUrl: '',
                            mobileRealUrl: '',
                            gameType: {
                                type: 'Slots',
                            },
                        },
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            total: {
                                value: 1,
                                relation: 'eq',
                            },
                            hits: [
                                {
                                    _source: {
                                        siteGame: {
                                            id: 'sitegame-6',
                                            sash: {
                                                'en-GB': 'HOT',
                                            },
                                            liveHidden: {
                                                'en-GB': false,
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

export const RECENTLY_PLAYED_RESP = [
    {
        entryId: 'sitegame-1',
        gameId: 'game-1',
        name: 'play-double-bubble-super-7',
        title: 'Double Bubble Super 7',
        imgUrlPattern: '/assets/double-bubble-super-7.jpg',
        gameSkin: 'play-double-bubble-super-7',
        demoUrl: '/service/game/demo/play-double-bubble-super-7',
        realUrl: '/service/game/play/play-double-bubble-super-7',
        animationMedia: 'default',
        foregroundLogoMedia: {
            type: 'image',
            width: 888,
            height: 264,
            name: 'es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444',
            orientation: 'landscape',
            original:
                'https://assets.ballys.com/m/6c2c6f6a0d8907c6/original/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.webp',
            thumbnails: {
                transformBaseUrl:
                    'https://assets.ballys.com/transform/c417c874-ab45-4f1e-a766-78a9d13e9c2a/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444',

                original:
                    'https://assets.ballys.com/m/6c2c6f6a0d8907c6/original/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.webp',
            },
        },
        backgroundMedia: {
            type: 'image',
            width: 888,
            height: 264,
            name: 'es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444',
            orientation: 'landscape',
            original:
                'https://assets.ballys.com/m/6c2c6f6a0d8907c6/original/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.webp',
            thumbnails: {
                transformBaseUrl:
                    'https://assets.ballys.com/transform/c417c874-ab45-4f1e-a766-78a9d13e9c2a/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444',
                original:
                    'https://assets.ballys.com/m/6c2c6f6a0d8907c6/original/es-gametiles-amazing-link-catalleros-amazing-link-catalleros-tile-05-444.webp',
            },
        },
        headlessJackpot: {
            id: 'hj-1',
            name: 'HJ 1',
        },
        isProgressiveJackpot: true,
        representativeColor: '#8CC8AC',
        tags: ['new'],
        videoUrlPattern: 'https://cdn.example.com/double-bubble-super-7.mp4',
    },
    {
        entryId: 'sitegame-2',
        gameId: 'game-2',
        name: 'play-ev-signature-speed-blackjack-2',
        title: 'Signature Speed Blackjack 2',
        imgUrlPattern: '/assets/signature-speed-blackjack-2.jpg',
        gameSkin: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
        demoUrl: '/service/game/demo/play-ev-signature-speed-blackjack-2',
        realUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
        representativeColor: '#000B1D',
    },
    {
        entryId: 'sitegame-3',
        gameId: 'game-3',
        name: 'play-double-bubble-triple',
        title: 'Double Bubble Triple Jackpot',
        imgUrlPattern: '/assets/double-bubble-triple-jackpot.jpg',
        gameSkin: 'play-double-bubble-triple',
        demoUrl: '/service/game/demo/play-double-bubble-triple',
        realUrl: '/service/game/play/play-double-bubble-triple',
        headlessJackpot: {
            id: 'hj-3',
            name: 'HJ 3',
        },
        isProgressiveJackpot: true,
        representativeColor: '#40C37F',
    },
    {
        entryId: 'sitegame-4',
        gameId: 'game-4',
        name: 'play-big-bass-splash',
        title: 'Big Bass Splash',
        imgUrlPattern: '/assets/big-bass-splash.jpg',
        gameSkin: 'PP_BIG_BASS_SPLASH',
        demoUrl: '/service/game/demo/play-big-bass-splash',
        realUrl: '/service/game/play/play-big-bass-splash',
        representativeColor: '#163850',
    },
    {
        entryId: 'sitegame-6',
        gameId: 'game-6',
        name: 'play-tagged-allowed',
        title: 'Tagged But Allowed Game',
        imgUrlPattern: '/assets/tagged-allowed.jpg',
        gameSkin: 'TAGGED_ALLOWED_SKIN',
        demoUrl: '/service/game/demo/play-tagged-allowed',
        realUrl: '/service/game/play/play-tagged-allowed',
        representativeColor: '#654321',
    },
];

export const PERSONALISED_GAMES_DEFAULT_RESP: any = {
    hits: {
        total: {
            value: 1,
            relation: 'eq',
        },
        max_score: 1,
        hits: [
            {
                _index: 'personalisation-defaults',
                _id: '6PVJRb9u4c8Odm3t2NiymP',
                _score: 1,
                _source: {
                    games: {
                        'en-GB': [
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '1pD4pR0hwBxy0BELOISfhC',
                                    type: 'Link',
                                },
                            },
                            {
                                sys: {
                                    linkType: 'Entry',
                                    id: '6B7R6JSUHWSXIKPmnNRRxH',
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

export const PERSONALISED_FALLBACK_GAMES_RESP = {
    hits: {
        total: {
            value: 2,
            relation: 'eq',
        },
        max_score: 1,
        hits: [
            {
                _index: 'games',
                _id: '1pD4pR0hwBxy0BELOISfhC',
                _score: 1,
                _routing: '5hF2CQqHc4KoSMjlp9rI6L',
                _source: {
                    siteGame: {
                        sash: {
                            'en-GB': 'EXCLUSIVE',
                        },
                        id: '1pD4pR0hwBxy0BELOISfhC',
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            total: {
                                value: 1,
                                relation: 'eq',
                            },
                            max_score: 1,
                            hits: [
                                {
                                    _index: 'games',
                                    _id: '5hF2CQqHc4KoSMjlp9rI6L',
                                    _score: 1,
                                    _source: {
                                        game: {
                                            entryTitle: 'play-double-bubble-triple',
                                            gameName: 'play-double-bubble-triple',
                                            gameSkin: 'play-double-bubble-triple',
                                            mobileGameName: '',
                                            mobileGameSkin: '',
                                            mobileOverride: false,
                                            vendor: 'gamesys',
                                            showNetPosition: false,
                                            operatorBarDisabled: false,
                                            funPanelEnabled: false,
                                            rgpEnabled: false,
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/double-bubble-triple-jackpot-logged-out/scale-s%s/dbtj-loggedout-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/double-bubble-triple-jackpot-es-logged-out/scale-s%s/dbtj-es-tile-r%s-w%s.jpg',
                                            },
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-double-bubble-triple',
                                                realUrl: '/service/game/play/play-double-bubble-triple',
                                                mobileDemoUrl: '',
                                                mobileRealUrl: '',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/double-bubble-triple-jackpot/scale-s%s/dbtj-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/double-bubble-triple-jackpot-es/scale-s%s/dbtj-es-tile-r%s-w%s.jpg',
                                            },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/double-bubble-triple-jackpot-logged-out/scale-s%s/dbtj-loggedout-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/double-bubble-triple-jackpot-es-logged-out/scale-s%s/dbtj-es-tile-r%s-w%s.jpg',
                                            },
                                            representativeColor: {
                                                'en-GB': '#40c37f',
                                                es: '#40C37F',
                                            },
                                            title: {
                                                'en-GB': 'Double Bubble Triple Jackpot',
                                                es: 'Duble Buble Triple Bote',
                                            },
                                            progressiveJackpot: true,
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
                _id: '6B7R6JSUHWSXIKPmnNRRxH',
                _score: 1,
                _routing: '5YnCwTuaHcdyYw31kj3J9z',
                _source: {
                    siteGame: {
                        sash: {
                            'en-GB': 'DROPS & WINS',
                        },
                        id: '6B7R6JSUHWSXIKPmnNRRxH',
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            total: {
                                value: 1,
                                relation: 'eq',
                            },
                            max_score: 1,
                            hits: [
                                {
                                    _index: 'games',
                                    _id: '5YnCwTuaHcdyYw31kj3J9z',
                                    _score: 1,
                                    _source: {
                                        game: {
                                            entryTitle: 'play-big-bass-splash',
                                            gameName: 'play-big-bass-splash',
                                            gameSkin: 'PP_BIG_BASS_SPLASH',
                                            mobileGameName: '',
                                            mobileGameSkin: '',
                                            mobileOverride: false,
                                            vendor: 'pragmatic',
                                            showNetPosition: false,
                                            operatorBarDisabled: false,
                                            funPanelEnabled: false,
                                            rgpEnabled: false,
                                            loggedOutImgUrlPattern: {
                                                es: '/api/content/gametiles/big-bass-splash/scale-s%s/big-bass-splash-tile-r%s-w%s.jpg',
                                            },
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-big-bass-splash',
                                                realUrl: '/service/game/play/play-big-bass-splash',
                                                mobileDemoUrl: '',
                                                mobileRealUrl: '',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/big-bass-splash/scale-s%s/big-bass-splash-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/big-bass-splash/scale-s%s/big-bass-splash-tile-r%s-w%s.jpg',
                                            },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/big-bass-splash/scale-s%s/big-bass-splash-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/big-bass-splash/scale-s%s/big-bass-splash-tile-r%s-w%s.jpg',
                                            },
                                            representativeColor: {
                                                'en-GB': '#163850',
                                                es: '#173750',
                                            },
                                            title: {
                                                'en-GB': 'Big Bass Splash ',
                                                es: 'Big Bass Splash',
                                            },
                                            progressiveJackpot: false,
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

export const PERSONALISED_FALLBACK_RESP = [
    {
        entryId: '1pD4pR0hwBxy0BELOISfhC',
        name: 'play-double-bubble-triple',
        demoUrl: '/service/game/demo/play-double-bubble-triple',
        title: 'Double Bubble Triple Jackpot',
        gameSkin: 'play-double-bubble-triple',
        imgUrlPattern: '/api/content/gametiles/double-bubble-triple-jackpot/scale-s%s/dbtj-tile-r%s-w%s.jpg',
        loggedOutImgUrlPattern:
            '/api/content/gametiles/double-bubble-triple-jackpot-logged-out/scale-s%s/dbtj-loggedout-tile-r%s-w%s.jpg',
        isProgressiveJackpot: true,
        realUrl: '/service/game/play/play-double-bubble-triple',
        representativeColor: '#40c37f',
        sash: 'EXCLUSIVE',
    },
    {
        entryId: '6B7R6JSUHWSXIKPmnNRRxH',
        name: 'play-big-bass-splash',
        demoUrl: '/service/game/demo/play-big-bass-splash',
        title: 'Big Bass Splash ',
        gameSkin: 'PP_BIG_BASS_SPLASH',
        imgUrlPattern: '/api/content/gametiles/big-bass-splash/scale-s%s/big-bass-splash-tile-r%s-w%s.jpg',
        realUrl: '/service/game/play/play-big-bass-splash',
        representativeColor: '#163850',
        sash: 'DROPS & WINS',
    },
];
