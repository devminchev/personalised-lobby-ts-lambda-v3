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

export const ML_RECOMMENDED_INDEX_RESP = {
    hits: {
        total: {
            value: 1,
            relation: 'eq',
        },
        max_score: 7.8897095,
        hits: [
            {
                _index: 'vitruvian-ml-eu-games-recommender-v2',
                _id: '18530334_doublebubblebingo',
                _score: 7.8897095,
                _source: {
                    recommendations: [
                        {
                            score: 0.861,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '4lpZkuydT6HDe1MdBJdfr5',
                                    contentful_game_title: 'Double Bubble Super 7',
                                    source_game_skin_name: 'play-double-bubble-super-7',
                                    contentful_game_entry_title: 'play-double-bubble-super-7',
                                },
                            },
                            operator_game_name: 'DoubleBubbleSuper7',
                        },
                        {
                            score: 0.612,
                            vendor: {
                                infinity: {
                                    contentful_game_id: '2VZYZPQv9j1m0QvRhfPL7b',
                                    contentful_game_title: 'Signature Speed Blackjack 2',
                                    source_game_skin_name: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                                    contentful_game_entry_title: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                                },
                            },
                            operator_game_name: 'SignatureSpeedBlackjack2',
                        },
                    ],
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
            value: 2,
            relation: 'eq',
        },
        max_score: 2.0,
        hits: [
            {
                _index: 'games',
                _id: '4lpZkuydT6HDe1MdBJdfr5',
                _score: 2.0,
                _source: {
                    game_to_sitegame: {
                        name: 'game',
                    },
                    game: {
                        entryTitle: 'play-double-bubble-super-7',
                        gameName: 'play-double-bubble-super-7',
                        gameSkin: 'play-double-bubble-super-7',
                        mobileGameName: '',
                        mobileGameSkin: '',
                        mobileOverride: false,
                        gamePlatformConfig: {
                            name: 'play-double-bubble-super-7',
                            demoUrl: '/service/game/demo/play-double-bubble-super-7',
                            realUrl: '/service/game/play/play-double-bubble-super-7',
                            mobileDemoUrl: '',
                            mobileRealUrl: '',
                            gameLoaderFileName: 'play-double-bubble-super-7',
                        },
                        platform: ['Desktop', 'Phone', 'Tablet'],
                        vendor: 'roxor-rgp',
                        showGameName: {
                            'en-GB': false,
                        },
                        progressiveJackpot: true,
                        operatorBarDisabled: false,
                        rgpEnabled: true,
                        funPanelEnabled: false,
                        funPanelDefaultCategory: '',
                        representativeColor: {
                            'en-GB': '#8CC8AC',
                        },
                        imgUrlPattern: {
                            'en-GB':
                                '/api/content/gametiles/double-bubble-super-7/scale-s%s/double-bubble-super-7-tile-r%s-w%s.jpg',
                        },
                        infoImgUrlPattern: {
                            'en-GB':
                                '/api/content/gametiles/double-bubble-super-7-logged-out/scale-s%s/double-bubble-super-7-tile-r%s-w%s.jpg',
                        },
                        loggedOutImgUrlPattern: {
                            'en-GB':
                                '/api/content/gametiles/double-bubble-super-7-logged-out/scale-s%s/double-bubble-super-7-tile-r%s-w%s.jpg',
                        },
                        videoUrlPattern: {
                            'en-GB':
                                'https://cdn.inx01.gamesysgames.com/ucn/heart/api/content/gametiles/double-bubble-super-7/scale-s%s/double-bubble-super-7-tile-r%s-w%s.mp4',
                        },
                        title: {
                            'en-GB': 'Double Bubble Super 7',
                        },
                        maxBet: {
                            'en-GB': '£5',
                        },
                        minBet: {
                            'en-GB': '20p',
                        },
                        infoDetails: {
                            'en-GB':
                                '<dt>Paylines:</dt><dd>20</dd><dt>Top Line Payout:</dt><dd>x20000</dd><dt>Features:</dt><dd>Bubble Line, Lock & Spin, Must Win Progressive Jackpot</dd>',
                        },
                        introductionContent: {
                            'en-GB':
                                ' <p>Bubble it up with Bubble lines, must-drop jackpots and more on the new <strong>Double Bubble Super 7 </strong>Slot.&nbsp;</p> <p>Spin with the classic Bubble Line, with &lsquo;bubblified&rsquo; symbols can line up to land you a 22x Multiplier.&nbsp;</p> <p>Plus, land 2 or more Super 7 symbols in the Bubble Line, or 3 Bonus symbols on reels 1, 3 and 5 to enter the Super 7 Bonus. The bonus includes 3 spins where all super 7 unlocked positions are waiting to be filled &ndash; and that&rsquo;s where you could land that must-drop jackpot.&nbsp;</p> <p>Ready to pop?&nbsp;</p>',
                        },
                        nativeRequirement: {
                            'en-GB': null,
                        },
                        contentType: 'gameV2',
                        id: '4lpZkuydT6HDe1MdBJdfr5',
                        environment: 'lobby-pre-release',
                        updatedAt: '2024-08-09T19:12:43.220Z',
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            total: {
                                value: 1,
                                relation: 'eq',
                            },
                            max_score: 1.9337115,
                            hits: [
                                {
                                    _index: 'games',
                                    _id: 'ZKSTLFQenfWVIslf7GtW3',
                                    _score: 1.9337115,
                                    _routing: '4lpZkuydT6HDe1MdBJdfr5',
                                    _source: {
                                        game_to_sitegame: {
                                            name: 'sitegame',
                                            parent: '4lpZkuydT6HDe1MdBJdfr5',
                                        },
                                        siteGame: {
                                            entryTitle: {
                                                'en-GB': 'play-double-bubble-super-7 [doublebubblebingo]',
                                            },
                                            venture: {
                                                'en-GB': {
                                                    sys: {
                                                        type: 'Link',
                                                        linkType: 'Entry',
                                                        id: '1fd1fhxDoqK6YigBiamFIe',
                                                    },
                                                },
                                            },
                                            environment: 'lobby-pre-release',
                                            sash: {
                                                'en-GB': '',
                                            },
                                            chat: {
                                                'en-GB': {
                                                    isEnabled: true,
                                                    controlMobileChat: true,
                                                },
                                            },
                                            maxBet: {
                                                'en-GB': '',
                                            },
                                            minBet: {
                                                'en-GB': '',
                                            },
                                            contentType: 'siteGameV2',
                                            id: 'ZKSTLFQenfWVIslf7GtW3',
                                            gameId: '4lpZkuydT6HDe1MdBJdfr5',
                                            updatedAt: '2024-08-09T21:47:26.387Z',
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
                _id: '2VZYZPQv9j1m0QvRhfPL7b',
                _score: 2.0,
                _source: {
                    game_to_sitegame: {
                        name: 'game',
                    },
                    game: {
                        entryTitle: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                        gameName: 'play-ev-signature-speed-blackjack-2',
                        gameSkin: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                        mobileGameName: '',
                        mobileGameSkin: '',
                        mobileOverride: false,
                        gamePlatformConfig: {
                            name: 'play-ev-signature-speed-blackjack-2',
                            demoUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                            realUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                            mobileDemoUrl: '',
                            mobileRealUrl: '',
                            gameLoaderFileName: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                        },
                        platform: ['Phone', 'Desktop', 'Tablet'],
                        vendor: 'infinity',
                        showGameName: {
                            'en-GB': false,
                        },
                        progressiveJackpot: false,
                        operatorBarDisabled: false,
                        rgpEnabled: true,
                        funPanelEnabled: false,
                        funPanelDefaultCategory: '',
                        representativeColor: {
                            'en-GB': '#000B1D',
                        },
                        imgUrlPattern: {
                            'en-GB':
                                '/api/content/gametiles/signature-speed-blackjack-2/scale-s%s/signature-speed-blackjack-2-tile-r%s-w%s.jpg',
                        },
                        infoImgUrlPattern: {
                            'en-GB':
                                '/api/content/gametiles/signature-speed-blackjack-2/scale-s%s/signature-speed-blackjack-2-tile-r%s-w%s.jpg',
                        },
                        loggedOutImgUrlPattern: {
                            'en-GB':
                                '/api/content/gametiles/signature-speed-blackjack-2/scale-s%s/signature-speed-blackjack-2-tile-r%s-w%s.jpg',
                        },
                        title: {
                            'en-GB': 'Signature Speed Blackjack 2',
                        },
                        maxBet: {
                            'en-GB': '£2,500',
                        },
                        minBet: {
                            'en-GB': '£10',
                        },
                        infoDetails: {
                            'en-GB': '<dt>Features:</dt><dd>Perfect Pairs, 21+3, Bet Behind, VIP tables</dd>',
                        },
                        introductionContent: {
                            'en-GB':
                                '<p>Enjoy the fast-paced action on a classic with <strong>Signature Speed Blackjack!</strong>&nbsp;</p> <p>It&rsquo;s got all the fantastic features of regular Blackjack, but at a cracking Casino speed. The dealer will go to the fastest decision-maker every time, and if you&rsquo;re too slow in the round, they&rsquo;ll auto-stand or auto-hit your hand.&nbsp;</p> <p>Ready for action?&nbsp;</p>',
                        },
                        nativeRequirement: {
                            'en-GB': null,
                        },
                        contentType: 'gameV2',
                        id: '2VZYZPQv9j1m0QvRhfPL7b',
                        environment: 'lobby-pre-release',
                        updatedAt: '2024-08-09T19:12:01.746Z',
                    },
                },
                //     sitegame: {
                //         hits: {
                //             total: {
                //                 value: 1,
                //                 relation: 'eq',
                //             },
                //         },
                //         platform: ['Phone', 'Desktop', 'Tablet'],
                //         vendor: {
                //             'en-GB': 'infinity',
                //         },
                //         showGameName: {
                //             'en-GB': false,
                //         },
                //         progressiveJackpot: {
                //             'en-GB': false,
                //         },
                //         operatorBarDisabled: {
                //             'en-GB': false,
                //         },
                //         rgpEnabled: {
                //             'en-GB': true,
                //         },
                //         funPanelEnabled: {
                //             'en-GB': false,
                //         },
                //         funPanelDefaultCategory: {
                //             'en-GB': '',
                //         },
                //         representativeColor: {
                //             'en-GB': '#000B1D',
                //         },
                //         imgUrlPattern: {
                //             'en-GB':
                //                 '/api/content/gametiles/signature-speed-blackjack-2/scale-s%s/signature-speed-blackjack-2-tile-r%s-w%s.jpg',
                //         },
                //         infoImgUrlPattern: {
                //             'en-GB':
                //                 '/api/content/gametiles/signature-speed-blackjack-2/scale-s%s/signature-speed-blackjack-2-tile-r%s-w%s.jpg',
                //         },
                //         loggedOutImgUrlPattern: {
                //             'en-GB':
                //                 '/api/content/gametiles/signature-speed-blackjack-2/scale-s%s/signature-speed-blackjack-2-tile-r%s-w%s.jpg',
                //         },
                //         title: {
                //             'en-GB': 'Signature Speed Blackjack 2',
                //         },
                //         maxBet: {
                //             'en-GB': '£2,500',
                //         },
                //         minBet: {
                //             'en-GB': '£10',
                //         },
                //         infoDetails: {
                //             'en-GB': '<dt>Features:</dt><dd>Perfect Pairs, 21+3, Bet Behind, VIP tables</dd>',
                //         },
                //         introductionContent: {
                //             'en-GB':
                //                 '<p>Enjoy the fast-paced action on a classic with <strong>Signature Speed Blackjack!</strong>&nbsp;</p> <p>It&rsquo;s got all the fantastic features of regular Blackjack, but at a cracking Casino speed. The dealer will go to the fastest decision-maker every time, and if you&rsquo;re too slow in the round, they&rsquo;ll auto-stand or auto-hit your hand.&nbsp;</p> <p>Ready for action?&nbsp;</p>',
                //         },
                //         nativeRequirement: {
                //             'en-GB': null,
                //         },
                //         contentType: 'gameV2',
                //         id: '2VZYZPQv9j1m0QvRhfPL7b',
                //         environment: 'lobby-pre-release',
                //         updatedAt: '2024-08-09T19:12:01.746Z',
                //     },
                // },
                inner_hits: {
                    sitegame: {
                        hits: {
                            total: {
                                value: 1,
                                relation: 'eq',
                            },
                            max_score: 1.9294116,
                            hits: [
                                {
                                    _index: 'games',
                                    _id: '4ENk5IAY5jxd0wXIOzf7DB',
                                    _score: 1.9294116,
                                    _routing: '2VZYZPQv9j1m0QvRhfPL7b',
                                    _source: {
                                        game_to_sitegame: {
                                            name: 'sitegame',
                                            parent: '2VZYZPQv9j1m0QvRhfPL7b',
                                        },
                                        siteGame: {
                                            entryTitle: {
                                                'en-GB': 'play-ev-signature-speed-blackjack-2 [doublebubblebingo]',
                                            },
                                            venture: {
                                                'en-GB': {
                                                    sys: {
                                                        type: 'Link',
                                                        linkType: 'Entry',
                                                        id: '1fd1fhxDoqK6YigBiamFIe',
                                                    },
                                                },
                                            },
                                            environment: 'lobby-pre-release',
                                            sash: {
                                                'en-GB': '',
                                            },
                                            chat: {
                                                'en-GB': null,
                                            },
                                            maxBet: {
                                                'en-GB': '',
                                            },
                                            minBet: {
                                                'en-GB': '',
                                            },
                                            contentType: 'siteGameV2',
                                            id: '4ENk5IAY5jxd0wXIOzf7DB',
                                            gameId: '2VZYZPQv9j1m0QvRhfPL7b',
                                            updatedAt: '2024-08-09T21:44:15.670Z',
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

export const PERSONALIZED_ML_RESP = [
    {
        entryId: 'ZKSTLFQenfWVIslf7GtW3',
        gameId: '4lpZkuydT6HDe1MdBJdfr5',
        name: 'play-double-bubble-super-7',
        title: 'Double Bubble Super 7',
        imgUrlPattern: '/api/content/gametiles/double-bubble-super-7/scale-s%s/double-bubble-super-7-tile-r%s-w%s.jpg',
        gameSkin: 'play-double-bubble-super-7',
        demoUrl: '/service/game/demo/play-double-bubble-super-7',
        realUrl: '/service/game/play/play-double-bubble-super-7',
        isProgressiveJackpot: true,
        representativeColor: '#8CC8AC',
        videoUrlPattern:
            'https://cdn.inx01.gamesysgames.com/ucn/heart/api/content/gametiles/double-bubble-super-7/scale-s%s/double-bubble-super-7-tile-r%s-w%s.mp4',
    },
    {
        entryId: '4ENk5IAY5jxd0wXIOzf7DB',
        gameId: '2VZYZPQv9j1m0QvRhfPL7b',
        name: 'play-ev-signature-speed-blackjack-2',
        title: 'Signature Speed Blackjack 2',
        imgUrlPattern:
            '/api/content/gametiles/signature-speed-blackjack-2/scale-s%s/signature-speed-blackjack-2-tile-r%s-w%s.jpg',
        gameSkin: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
        demoUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
        realUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
        representativeColor: '#000B1D',
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
                                            vendor: 'roxor-rgp',
                                            operatorBarDisabled: false,
                                            rgpEnabled: true,
                                            funPanelEnabled: false,
                                            funPanelDefaultCategory: '',
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
                                                name: 'play-double-bubble-triple',
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
                                            vendor: 'infinity',
                                            operatorBarDisabled: false,
                                            rgpEnabled: true,
                                            funPanelEnabled: false,
                                            funPanelDefaultCategory: '',
                                            loggedOutImgUrlPattern: {
                                                es: '/api/content/gametiles/big-bass-splash/scale-s%s/big-bass-splash-tile-r%s-w%s.jpg',
                                            },
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-big-bass-splash',
                                                realUrl: '/service/game/play/play-big-bass-splash',
                                                mobileDemoUrl: '',
                                                mobileRealUrl: '',
                                                name: 'play-big-bass-splash',
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
