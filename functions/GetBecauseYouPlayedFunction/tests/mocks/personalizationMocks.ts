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

export const ML_BECAUSE_YOU_PLAYED_INDEX_RESP = {
    hits: {
        total: {
            value: 1,
            relation: 'eq',
        },
        max_score: 7.8897095,
        hits: [
            {
                _id: '15128492_doublebubblebingo',
                _source: {
                    venture_name: 'doublebubblebingo',
                    account_id: '15128492',
                    because_you_played: {
                        operator_game_name: 'Double Bubble',
                    },
                    recommendations: [
                        {
                            distance: 0.04693,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '2fODjYtHKAcTqKeL61adLw',
                                    contentful_game_title: 'Double Bubble Jackpot',
                                    source_game_skin_name: 'play-double-bubble-progressive',
                                    contentful_game_entry_title: 'play-double-bubble-progressive',
                                },
                            },
                            operator_game_name: 'play-double-bubble-progressive',
                        },
                        {
                            distance: 0.04704,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '6hXbOvmjoJ0A2vxalI3hqf',
                                    contentful_game_title: 'Double Bubble Jackpot Splash',
                                    source_game_skin_name: 'play-double-bubble-jackpot-splash',
                                    contentful_game_entry_title: 'play-double-bubble-jackpot-splash',
                                },
                            },
                            operator_game_name: 'Double Bubble Jackpot Splash',
                        },
                        {
                            distance: 0.10117,
                            vendor: {
                                infinity: {
                                    contentful_game_id: '1qIZtu7nxYu1AX3LWzgY2V',
                                    contentful_game_title: 'Hyper Strike',
                                    source_game_skin_name: 'MGSD_HYPER_STRIKE_V94',
                                    contentful_game_entry_title: 'MGSD_HYPER_STRIKE_V94',
                                },
                            },
                            operator_game_name: 'Hyper Strike v94',
                        },
                        {
                            distance: 0.14311,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '6k7rKcpYn5ndQDLENhJVz4',
                                    contentful_game_title: 'TBC - Game not available in this region',
                                    source_game_skin_name: 'play-9-masks-of-fire',
                                    contentful_game_entry_title: 'play-9-masks-of-fire',
                                },
                            },
                            operator_game_name: 'play-9-masks-of-fire',
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
                        entryTitle: {
                            'en-GB': 'play-double-bubble-super-7',
                        },
                        gamePlatformConfig: {
                            'en-GB': {
                                name: 'play-double-bubble-super-7',
                                demoUrl: '/service/game/demo/play-double-bubble-super-7',
                                realUrl: '/service/game/play/play-double-bubble-super-7',
                                gameLoaderFileName: 'play-double-bubble-super-7',
                                gameSkin: 'play-double-bubble-super-7',
                            },
                        },
                        platform: ['Desktop', 'Phone', 'Tablet'],
                        vendor: {
                            'en-GB': 'roxor-rgp',
                        },
                        showGameName: {
                            'en-GB': false,
                        },
                        progressiveJackpot: {
                            'en-GB': true,
                        },
                        operatorBarDisabled: {
                            'en-GB': false,
                        },
                        rgpEnabled: {
                            'en-GB': true,
                        },
                        funPanelEnabled: {
                            'en-GB': false,
                        },
                        funPanelDefaultCategory: {
                            'en-GB': '',
                        },
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
                        entryTitle: {
                            'en-GB': 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                        },
                        gamePlatformConfig: {
                            'en-GB': {
                                name: 'play-ev-signature-speed-blackjack-2',
                                demoUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                                realUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                                gameLoaderFileName: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                                gameSkin: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                            },
                        },
                        platform: ['Phone', 'Desktop', 'Tablet'],
                        vendor: {
                            'en-GB': 'infinity',
                        },
                        showGameName: {
                            'en-GB': false,
                        },
                        progressiveJackpot: {
                            'en-GB': false,
                        },
                        operatorBarDisabled: {
                            'en-GB': false,
                        },
                        rgpEnabled: {
                            'en-GB': true,
                        },
                        funPanelEnabled: {
                            'en-GB': false,
                        },
                        funPanelDefaultCategory: {
                            'en-GB': '',
                        },
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

export const GAME_SITE_GAME_RESP_BIG = {
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
                        entryTitle: {
                            'en-GB': 'play-double-bubble-super-7',
                        },
                        gamePlatformConfig: {
                            'en-GB': {
                                name: 'play-double-bubble-super-7',
                                demoUrl: '/service/game/demo/play-double-bubble-super-7',
                                realUrl: '/service/game/play/play-double-bubble-super-7',
                                gameLoaderFileName: 'play-double-bubble-super-7',
                                gameSkin: 'play-double-bubble-super-7',
                            },
                        },
                        platform: ['Desktop', 'Phone', 'Tablet'],
                        vendor: {
                            'en-GB': 'roxor-rgp',
                        },
                        showGameName: {
                            'en-GB': false,
                        },
                        progressiveJackpot: {
                            'en-GB': true,
                        },
                        operatorBarDisabled: {
                            'en-GB': false,
                        },
                        rgpEnabled: {
                            'en-GB': true,
                        },
                        funPanelEnabled: {
                            'en-GB': false,
                        },
                        funPanelDefaultCategory: {
                            'en-GB': '',
                        },
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
                        entryTitle: {
                            'en-GB': 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                        },
                        gamePlatformConfig: {
                            'en-GB': {
                                name: 'play-ev-signature-speed-blackjack-2',
                                demoUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                                realUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                                gameLoaderFileName: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                                gameSkin: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                            },
                        },
                        platform: ['Phone', 'Desktop', 'Tablet'],
                        vendor: {
                            'en-GB': 'infinity',
                        },
                        showGameName: {
                            'en-GB': false,
                        },
                        progressiveJackpot: {
                            'en-GB': false,
                        },
                        operatorBarDisabled: {
                            'en-GB': false,
                        },
                        rgpEnabled: {
                            'en-GB': true,
                        },
                        funPanelEnabled: {
                            'en-GB': false,
                        },
                        funPanelDefaultCategory: {
                            'en-GB': '',
                        },
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
            {
                _index: 'games',
                _id: '2VZYZPQv9j1m0QvRhfPL7b',
                _score: 2.0,
                _source: {
                    game_to_sitegame: {
                        name: 'game',
                    },
                    game: {
                        entryTitle: {
                            'en-GB': 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                        },
                        gamePlatformConfig: {
                            'en-GB': {
                                name: 'play-ev-signature-speed-blackjack-2',
                                demoUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                                realUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                                gameLoaderFileName: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                                gameSkin: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                            },
                        },
                        platform: ['Phone', 'Desktop', 'Tablet'],
                        vendor: {
                            'en-GB': 'infinity',
                        },
                        showGameName: {
                            'en-GB': false,
                        },
                        progressiveJackpot: {
                            'en-GB': false,
                        },
                        operatorBarDisabled: {
                            'en-GB': false,
                        },
                        rgpEnabled: {
                            'en-GB': true,
                        },
                        funPanelEnabled: {
                            'en-GB': false,
                        },
                        funPanelDefaultCategory: {
                            'en-GB': '',
                        },
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
            {
                _index: 'games',
                _id: '2VZYZPQv9j1m0QvRhfPL7b',
                _score: 2.0,
                _source: {
                    game_to_sitegame: {
                        name: 'game',
                    },
                    game: {
                        entryTitle: {
                            'en-GB': 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                        },
                        gamePlatformConfig: {
                            'en-GB': {
                                name: 'play-ev-signature-speed-blackjack-2',
                                demoUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                                realUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                                gameLoaderFileName: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                                gameSkin: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                            },
                        },
                        platform: ['Phone', 'Desktop', 'Tablet'],
                        vendor: {
                            'en-GB': 'infinity',
                        },
                        showGameName: {
                            'en-GB': false,
                        },
                        progressiveJackpot: {
                            'en-GB': false,
                        },
                        operatorBarDisabled: {
                            'en-GB': false,
                        },
                        rgpEnabled: {
                            'en-GB': true,
                        },
                        funPanelEnabled: {
                            'en-GB': false,
                        },
                        funPanelDefaultCategory: {
                            'en-GB': '',
                        },
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

export const BECAUSE_YOU_PLAYED_ML_RESP = [
    {
        'because-you-played-x': 'Double Bubble',
        games: [
            {
                entryId: 'ZKSTLFQenfWVIslf7GtW3',
                gameId: '4lpZkuydT6HDe1MdBJdfr5',
                name: 'play-double-bubble-super-7',
                demoUrl: '/service/game/demo/play-double-bubble-super-7',
                title: 'Double Bubble Super 7',
                gameSkin: 'play-double-bubble-super-7',
                imgUrlPattern:
                    '/api/content/gametiles/double-bubble-super-7/scale-s%s/double-bubble-super-7-tile-r%s-w%s.jpg',
                loggedOutImgUrlPattern:
                    '/api/content/gametiles/double-bubble-super-7-logged-out/scale-s%s/double-bubble-super-7-tile-r%s-w%s.jpg',
                isProgressiveJackpot: true,
                realUrl: '/service/game/play/play-double-bubble-super-7',
                representativeColor: '#8CC8AC',
                videoUrlPattern:
                    'https://cdn.inx01.gamesysgames.com/ucn/heart/api/content/gametiles/double-bubble-super-7/scale-s%s/double-bubble-super-7-tile-r%s-w%s.mp4',
            },
            {
                entryId: '4ENk5IAY5jxd0wXIOzf7DB',
                gameId: '2VZYZPQv9j1m0QvRhfPL7b',
                name: 'play-ev-signature-speed-blackjack-2',
                demoUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                title: 'Signature Speed Blackjack 2',
                gameSkin: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                imgUrlPattern:
                    '/api/content/gametiles/signature-speed-blackjack-2/scale-s%s/signature-speed-blackjack-2-tile-r%s-w%s.jpg',
                loggedOutImgUrlPattern:
                    '/api/content/gametiles/signature-speed-blackjack-2/scale-s%s/signature-speed-blackjack-2-tile-r%s-w%s.jpg',
                realUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                representativeColor: '#000B1D',
            },
        ],
    },
];

export const BECAUSE_YOU_PLAYED_ML_RESP_BIG = [
    {
        'because-you-played-x': 'Double Bubble',
        games: [
            {
                entryId: 'ZKSTLFQenfWVIslf7GtW3',
                gameId: '4lpZkuydT6HDe1MdBJdfr5',
                name: 'play-double-bubble-super-7',
                demoUrl: '/service/game/demo/play-double-bubble-super-7',
                title: 'Double Bubble Super 7',
                gameSkin: 'play-double-bubble-super-7',
                imgUrlPattern:
                    '/api/content/gametiles/double-bubble-super-7/scale-s%s/double-bubble-super-7-tile-r%s-w%s.jpg',
                loggedOutImgUrlPattern:
                    '/api/content/gametiles/double-bubble-super-7-logged-out/scale-s%s/double-bubble-super-7-tile-r%s-w%s.jpg',
                isProgressiveJackpot: true,
                realUrl: '/service/game/play/play-double-bubble-super-7',
                representativeColor: '#8CC8AC',
                videoUrlPattern:
                    'https://cdn.inx01.gamesysgames.com/ucn/heart/api/content/gametiles/double-bubble-super-7/scale-s%s/double-bubble-super-7-tile-r%s-w%s.mp4',
            },
            {
                entryId: '4ENk5IAY5jxd0wXIOzf7DB',
                gameId: '2VZYZPQv9j1m0QvRhfPL7b',
                name: 'play-ev-signature-speed-blackjack-2',
                demoUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                title: 'Signature Speed Blackjack 2',
                gameSkin: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                imgUrlPattern:
                    '/api/content/gametiles/signature-speed-blackjack-2/scale-s%s/signature-speed-blackjack-2-tile-r%s-w%s.jpg',
                loggedOutImgUrlPattern:
                    '/api/content/gametiles/signature-speed-blackjack-2/scale-s%s/signature-speed-blackjack-2-tile-r%s-w%s.jpg',
                realUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                representativeColor: '#000B1D',
            },
            {
                entryId: '4ENk5IAY5jxd0wXIOzf7DB',
                gameId: '2VZYZPQv9j1m0QvRhfPL7b',
                name: 'play-ev-signature-speed-blackjack-2',
                demoUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                title: 'Signature Speed Blackjack 2',
                gameSkin: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                imgUrlPattern:
                    '/api/content/gametiles/signature-speed-blackjack-2/scale-s%s/signature-speed-blackjack-2-tile-r%s-w%s.jpg',
                loggedOutImgUrlPattern:
                    '/api/content/gametiles/signature-speed-blackjack-2/scale-s%s/signature-speed-blackjack-2-tile-r%s-w%s.jpg',
                realUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                representativeColor: '#000B1D',
            },
            {
                entryId: '4ENk5IAY5jxd0wXIOzf7DB',
                gameId: '2VZYZPQv9j1m0QvRhfPL7b',
                name: 'play-ev-signature-speed-blackjack-2',
                demoUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                title: 'Signature Speed Blackjack 2',
                gameSkin: 'EVO_SIGNATURE_SPEED_BLACKJACK_2',
                imgUrlPattern:
                    '/api/content/gametiles/signature-speed-blackjack-2/scale-s%s/signature-speed-blackjack-2-tile-r%s-w%s.jpg',
                loggedOutImgUrlPattern:
                    '/api/content/gametiles/signature-speed-blackjack-2/scale-s%s/signature-speed-blackjack-2-tile-r%s-w%s.jpg',
                realUrl: '/service/game/play/play-ev-signature-speed-blackjack-2',
                representativeColor: '#000B1D',
            },
        ],
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
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/double-bubble-triple-jackpot-logged-out/scale-s%s/dbtj-loggedout-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/double-bubble-triple-jackpot-es-logged-out/scale-s%s/dbtj-es-tile-r%s-w%s.jpg',
                                            },
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    demoUrl: '/service/game/demo/play-double-bubble-triple',
                                                    gameSkin: 'play-double-bubble-triple',
                                                    mobileOverride: false,
                                                    name: 'play-double-bubble-triple',
                                                    realUrl: '/service/game/play/play-double-bubble-triple',
                                                    mobileDemoUrl: '',
                                                    mobileRealUrl: '',
                                                    mobileGameSkin: '',
                                                    mobileName: '',
                                                },
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
                                            progressiveJackpot: {
                                                'en-GB': true,
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
                                            loggedOutImgUrlPattern: {
                                                es: '/api/content/gametiles/big-bass-splash/scale-s%s/big-bass-splash-tile-r%s-w%s.jpg',
                                            },
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    demoUrl: '/service/game/demo/play-big-bass-splash',
                                                    gameSkin: 'PP_BIG_BASS_SPLASH',
                                                    mobileOverride: false,
                                                    name: 'play-big-bass-splash',
                                                    realUrl: '/service/game/play/play-big-bass-splash',
                                                    mobileDemoUrl: '',
                                                    mobileRealUrl: '',
                                                    mobileGameSkin: '',
                                                    mobileName: '',
                                                },
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
                                            progressiveJackpot: {
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

export const ML_BECAUSE_YOU_PLAYED_INDEX_RESP_BIG = {
    hits: {
        total: {
            value: 1,
            relation: 'eq',
        },
        max_score: 7.8897095,
        hits: [
            {
                _id: '15128492_doublebubblebingo',
                _source: {
                    venture_name: 'doublebubblebingo',
                    account_id: '15128492',
                    because_you_played: {
                        operator_game_name: 'Double Bubble',
                    },
                    recommendations: [
                        {
                            distance: 0.04693,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '2fODjYtHKAcTqKeL61adLw',
                                    contentful_game_title: 'Double Bubble Jackpot',
                                    source_game_skin_name: 'play-double-bubble-progressive',
                                    contentful_game_entry_title: 'play-double-bubble-progressive',
                                },
                            },
                            operator_game_name: 'play-double-bubble-progressive',
                        },
                        {
                            distance: 0.04704,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '6hXbOvmjoJ0A2vxalI3hqf',
                                    contentful_game_title: 'Double Bubble Jackpot Splash',
                                    source_game_skin_name: 'play-double-bubble-jackpot-splash',
                                    contentful_game_entry_title: 'play-double-bubble-jackpot-splash',
                                },
                            },
                            operator_game_name: 'Double Bubble Jackpot Splash',
                        },
                        {
                            distance: 0.10117,
                            vendor: {
                                infinity: {
                                    contentful_game_id: '1qIZtu7nxYu1AX3LWzgY2V',
                                    contentful_game_title: 'Hyper Strike',
                                    source_game_skin_name: 'MGSD_HYPER_STRIKE_V94',
                                    contentful_game_entry_title: 'MGSD_HYPER_STRIKE_V94',
                                },
                            },
                            operator_game_name: 'Hyper Strike v94',
                        },
                        {
                            distance: 0.14311,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '6k7rKcpYn5ndQDLENhJVz4',
                                    contentful_game_title: 'TBC - Game not available in this region',
                                    source_game_skin_name: 'play-9-masks-of-fire',
                                    contentful_game_entry_title: 'play-9-masks-of-fire',
                                },
                            },
                            operator_game_name: 'play-9-masks-of-fire',
                        },
                    ],
                },
            },
            {
                _id: '15128491_doublebubblebingo',
                _source: {
                    venture_name: 'doublebubblebingo',
                    account_id: '15128491',
                    because_you_played: {
                        operator_game_name: 'Double Bubble',
                    },
                    recommendations: [
                        {
                            distance: 0.04693,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '2fODjYtHKAcTqKeL61adLw',
                                    contentful_game_title: 'Double Bubble Jackpot',
                                    source_game_skin_name: 'play-double-bubble-progressive',
                                    contentful_game_entry_title: 'play-double-bubble-progressive',
                                },
                            },
                            operator_game_name: 'play-double-bubble-progressive',
                        },
                        {
                            distance: 0.04704,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '6hXbOvmjoJ0A2vxalI3hqf',
                                    contentful_game_title: 'Double Bubble Jackpot Splash',
                                    source_game_skin_name: 'play-double-bubble-jackpot-splash',
                                    contentful_game_entry_title: 'play-double-bubble-jackpot-splash',
                                },
                            },
                            operator_game_name: 'Double Bubble Jackpot Splash',
                        },
                        {
                            distance: 0.10117,
                            vendor: {
                                infinity: {
                                    contentful_game_id: '1qIZtu7nxYu1AX3LWzgY2V',
                                    contentful_game_title: 'Hyper Strike',
                                    source_game_skin_name: 'MGSD_HYPER_STRIKE_V94',
                                    contentful_game_entry_title: 'MGSD_HYPER_STRIKE_V94',
                                },
                            },
                            operator_game_name: 'Hyper Strike v94',
                        },
                        {
                            distance: 0.14311,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '6k7rKcpYn5ndQDLENhJVz4',
                                    contentful_game_title: 'TBC - Game not available in this region',
                                    source_game_skin_name: 'play-9-masks-of-fire',
                                    contentful_game_entry_title: 'play-9-masks-of-fire',
                                },
                            },
                            operator_game_name: 'play-9-masks-of-fire',
                        },
                    ],
                },
            },
            {
                _id: '151284920_doublebubblebingo',
                _source: {
                    venture_name: 'doublebubblebingo',
                    account_id: '151284920',
                    because_you_played: {
                        operator_game_name: 'Double Bubble',
                    },
                    recommendations: [
                        {
                            distance: 0.04693,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '2fODjYtHKAcTqKeL61adLw',
                                    contentful_game_title: 'Double Bubble Jackpot',
                                    source_game_skin_name: 'play-double-bubble-progressive',
                                    contentful_game_entry_title: 'play-double-bubble-progressive',
                                },
                            },
                            operator_game_name: 'play-double-bubble-progressive',
                        },
                        {
                            distance: 0.04704,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '6hXbOvmjoJ0A2vxalI3hqf',
                                    contentful_game_title: 'Double Bubble Jackpot Splash',
                                    source_game_skin_name: 'play-double-bubble-jackpot-splash',
                                    contentful_game_entry_title: 'play-double-bubble-jackpot-splash',
                                },
                            },
                            operator_game_name: 'Double Bubble Jackpot Splash',
                        },
                        {
                            distance: 0.10117,
                            vendor: {
                                infinity: {
                                    contentful_game_id: '1qIZtu7nxYu1AX3LWzgY2V',
                                    contentful_game_title: 'Hyper Strike',
                                    source_game_skin_name: 'MGSD_HYPER_STRIKE_V94',
                                    contentful_game_entry_title: 'MGSD_HYPER_STRIKE_V94',
                                },
                            },
                            operator_game_name: 'Hyper Strike v94',
                        },
                        {
                            distance: 0.14311,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '6k7rKcpYn5ndQDLENhJVz4',
                                    contentful_game_title: 'TBC - Game not available in this region',
                                    source_game_skin_name: 'play-9-masks-of-fire',
                                    contentful_game_entry_title: 'play-9-masks-of-fire',
                                },
                            },
                            operator_game_name: 'play-9-masks-of-fire',
                        },
                    ],
                },
            },
            {
                _id: '151284921_doublebubblebingo',
                _source: {
                    venture_name: 'doublebubblebingo',
                    account_id: '151284921',
                    because_you_played: {
                        operator_game_name: 'Double Bubble',
                    },
                    recommendations: [
                        {
                            distance: 0.04693,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '2fODjYtHKAcTqKeL61adLw',
                                    contentful_game_title: 'Double Bubble Jackpot',
                                    source_game_skin_name: 'play-double-bubble-progressive',
                                    contentful_game_entry_title: 'play-double-bubble-progressive',
                                },
                            },
                            operator_game_name: 'play-double-bubble-progressive',
                        },
                        {
                            distance: 0.04704,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '6hXbOvmjoJ0A2vxalI3hqf',
                                    contentful_game_title: 'Double Bubble Jackpot Splash',
                                    source_game_skin_name: 'play-double-bubble-jackpot-splash',
                                    contentful_game_entry_title: 'play-double-bubble-jackpot-splash',
                                },
                            },
                            operator_game_name: 'Double Bubble Jackpot Splash',
                        },
                        {
                            distance: 0.10117,
                            vendor: {
                                infinity: {
                                    contentful_game_id: '1qIZtu7nxYu1AX3LWzgY2V',
                                    contentful_game_title: 'Hyper Strike',
                                    source_game_skin_name: 'MGSD_HYPER_STRIKE_V94',
                                    contentful_game_entry_title: 'MGSD_HYPER_STRIKE_V94',
                                },
                            },
                            operator_game_name: 'Hyper Strike v94',
                        },
                        {
                            distance: 0.14311,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '6k7rKcpYn5ndQDLENhJVz4',
                                    contentful_game_title: 'TBC - Game not available in this region',
                                    source_game_skin_name: 'play-9-masks-of-fire',
                                    contentful_game_entry_title: 'play-9-masks-of-fire',
                                },
                            },
                            operator_game_name: 'play-9-masks-of-fire',
                        },
                    ],
                },
            },
        ],
    },
};
