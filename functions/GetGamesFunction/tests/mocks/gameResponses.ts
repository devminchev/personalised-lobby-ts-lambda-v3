export const GAMES_NO_INNER_HITS_RESP: any = {
    hits: {
        total: {
            value: 4,
            relation: 'eq',
        },
        max_score: 2,
        hits: [
            {
                _index: 'games',
                _id: 'NFixvdNfbrwsrxPnMN4If',
                _score: 2,
                _routing: '2bMMsp3oddThFhsDYucnA5',
                _source: {
                    game_to_sitegame: {
                        name: 'sitegame',
                        parent: '2bMMsp3oddThFhsDYucnA5',
                    },
                    siteGame: {
                        entryTitle: {
                            'en-GB': 'play-razor-shark [jackpotjoy]',
                        },
                        chat: {
                            'en-GB': {
                                isEnabled: true,
                                controlMobileChat: true,
                            },
                        },
                        environment: 'development',
                        sash: {
                            'en-GB': '',
                        },
                        maxBet: {
                            'en-GB': '',
                        },
                        minBet: {
                            'en-GB': '',
                        },
                        venture: {
                            'en-GB': {
                                sys: {
                                    type: 'Link',
                                    linkType: 'Entry',
                                    id: '259MUOgLpQf5hVGxjNM5f2',
                                },
                            },
                        },
                        contentType: 'siteGameV2',
                        id: 'NFixvdNfbrwsrxPnMN4If',
                        gameId: '2bMMsp3oddThFhsDYucnA5',
                        updatedAt: '2024-05-02T12:25:33.386Z',
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            total: {
                                value: 0,
                                relation: 'eq',
                            },
                            hits: [],
                        },
                    },
                },
            },
        ],
    },
};

export const GAMES_SUCCESS_RESP: any = {
    took: 2,
    timed_out: false,
    _shards: {
        total: 1,
        successful: 1,
        skipped: 0,
        failed: 0,
    },
    hits: {
        total: {
            value: 3,
            relation: 'eq',
        },
        max_score: 1,
        hits: [
            {
                _index: 'games-v2',
                _id: '4aGKa5P7aeU82fdEftOxOW',
                _score: 1,
                _routing: '6tKrAnhhnMzjjV7zcLcfqi',
                _source: {
                    game_to_sitegame: {
                        name: 'sitegame',
                        parent: '6tKrAnhhnMzjjV7zcLcfqi',
                    },
                    siteGame: {
                        entryTitle: {
                            'en-GB': 'play-eye-fluffy-arcade-ring-toss-lucky-tap [jackpotjoy]',
                        },
                        venture: {
                            'en-GB': {
                                sys: {
                                    type: 'Link',
                                    linkType: 'Entry',
                                    id: '259MUOgLpQf5hVGxjNM5f2',
                                },
                            },
                        },
                        environment: ['staging', 'production'],
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
                            'en-CA': '-',
                            'en-GB': '',
                            es: '-',
                            sv: '-',
                            'en-US': '-',
                        },
                        minBet: {
                            'en-CA': '-',
                            'en-GB': '',
                            es: '-',
                            sv: '-',
                            'en-US': '-',
                        },
                        headlessJackpot: {
                            'en-GB': null,
                        },
                        liveHidden: {
                            'en-GB': false,
                        },
                        environmentVisibility: {
                            'en-GB': ['staging', 'production'],
                        },
                        platformVisibility: {
                            'en-GB': ['web', 'ios', 'android'],
                        },
                        id: '4aGKa5P7aeU82fdEftOxOW',
                        contentType: 'siteGameV2',
                        cmsEnv: 'iGamingMigrationsEU',
                        gameId: '6tKrAnhhnMzjjV7zcLcfqi',
                        createdAt: '2024-12-18T16:27:15.580Z',
                        updatedAt: '2025-04-18T01:49:54.279Z',
                        version: 12,
                        publishedAt: '2025-04-18T01:49:54.279Z',
                        publishedVersion: 11,
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
                                    _index: 'games-v2',
                                    _id: '6tKrAnhhnMzjjV7zcLcfqi',
                                    _score: 1,
                                    _source: {
                                        game_to_sitegame: {
                                            name: 'game',
                                        },
                                        game: {
                                            entryTitle: 'EYE_FLUFFY_ARCADE_RING_TOSS_LUCKYTAP',
                                            gameName: 'play-eye-fluffy-arcade-ring-toss-lucky-tap',
                                            mobileGameName: 'play-eye-fluffy-arcade-ring-toss-lucky-tap-m',
                                            gameSkin: 'EYE_FLUFFY_ARCADE_RING_TOSS_LUCKYTAP',
                                            mobileGameSkin: 'EYEM_FLUFFY_ARCADE_RING_TOSS_LUCKYTAP',
                                            mobileOverride: true,
                                            gamePlatformConfig: {
                                                demoUrl:
                                                    '/service/game/demo/play-eye-fluffy-arcade-ring-toss-lucky-tap',
                                                realUrl:
                                                    '/service/game/play/play-eye-fluffy-arcade-ring-toss-lucky-tap',
                                                mobileDemoUrl:
                                                    '/service/game/demo/play-eye-fluffy-arcade-ring-toss-lucky-tap-m',
                                                mobileRealUrl:
                                                    '/service/game/play/play-eye-fluffy-arcade-ring-toss-lucky-tap-m',
                                            },
                                            platform: ['Desktop', 'Phone', 'Tablet'],
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
                                                'en-GB': '#3F1D83',
                                                es: '#3F1D83',
                                            },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/fluffy-arcade-ring-toss-luckytap-logged-out/scale-s%s/fluffy-arcade-ring-toss-luckytap-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/fluffy-arcade-ring-toss-luckytap-logged-out/scale-s%s/fluffy-arcade-ring-toss-luckytap-tile-r%s-w%s.jpg',
                                            },
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/fluffy-arcade-ring-toss-luckytap-logged-out/scale-s%s/fluffy-arcade-ring-toss-luckytap-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/fluffy-arcade-ring-toss-luckytap-/scale-s%s/fluffy-arcade-ring-toss-luckytap-tile-r%s-w%s.jpg',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/fluffy-arcade-ring-toss-luckytap/scale-s%s/fluffy-arcade-ring-toss-luckytap-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/fluffy-arcade-ring-toss-luckytap-logged-out/scale-s%s/fluffy-arcade-ring-toss-luckytap-tile-r%s-w%s.jpg',
                                            },
                                            title: {
                                                'en-GB': 'Fluffy Arcade: Ring Toss Lucky Tap',
                                                es: 'Fluffy Arcade: Ring Toss Lucky Tap',
                                            },
                                            maxBet: {
                                                'en-CA': '-',
                                                'en-GB': '£5',
                                                es: '€',
                                                sv: '-',
                                                'en-US': '-',
                                            },
                                            minBet: {
                                                'en-CA': '-',
                                                'en-GB': '10p',
                                                es: 'c',
                                                sv: '-',
                                                'en-US': '-',
                                            },
                                            infoDetails: {
                                                'en-GB':
                                                    '<dt>Paylines:</dt><dd>N/A</dd><dt>Max Win:</dt><dd>x1,800</dd><dt>Features:</dt><dd>Triple Chance, Free Games, Multipliers</dd>',
                                            },
                                            introductionContent: {
                                                'en-GB':
                                                    '<p>How&rsquo;s your aim? Have a throw on Fluffy Favourites Ring Toss Lucky Tap! With a unique &lsquo;hoop throw&rsquo; playing style, just hook the bottles to win the prizes. You could even trigger Multipliers and the bonus round of Free Spins! Grab your hoops!</p>',
                                            },
                                            nativeRequirement: {
                                                'en-GB': null,
                                            },
                                            showNetPosition: true,
                                            platformVisibility: ['web', 'ios', 'android'],
                                            contentType: 'gameV2',
                                            id: '6tKrAnhhnMzjjV7zcLcfqi',
                                            cmsEnv: 'iGamingMigrationsEU',
                                            updatedAt: '2025-04-16T23:21:44.669Z',
                                            publishedAt: '2025-04-16T23:21:44.669Z',
                                            version: 61,
                                            publishedVersion: 60,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                _index: 'games-v2',
                _id: '1S6iybBG2xAbM7DEABF5KN',
                _score: 1,
                _routing: '68UdNRecbboKjD0HQ86yLv',
                _source: {
                    game_to_sitegame: {
                        name: 'sitegame',
                        parent: '68UdNRecbboKjD0HQ86yLv',
                    },
                    siteGame: {
                        entryTitle: {
                            'en-GB': 'play-micro-whack-the-bell-tap-n-cash [jackpotjoy]',
                        },
                        venture: {
                            'en-GB': {
                                sys: {
                                    type: 'Link',
                                    linkType: 'Entry',
                                    id: '259MUOgLpQf5hVGxjNM5f2',
                                },
                            },
                        },
                        environment: ['staging', 'production'],
                        chat: {
                            'en-GB': {
                                isEnabled: true,
                                controlMobileChat: true,
                            },
                        },
                        maxBet: {
                            'en-CA': '-',
                            'en-GB': '',
                            es: '-',
                            sv: '-',
                            'en-US': '-',
                        },
                        minBet: {
                            'en-CA': '-',
                            'en-GB': '',
                            es: '-',
                            sv: '-',
                            'en-US': '-',
                        },
                        headlessJackpot: {
                            'en-GB': null,
                        },
                        liveHidden: {
                            'en-GB': false,
                        },
                        environmentVisibility: {
                            'en-GB': ['staging', 'production'],
                        },
                        platformVisibility: {
                            'en-GB': ['web', 'ios', 'android'],
                        },
                        id: '1S6iybBG2xAbM7DEABF5KN',
                        contentType: 'siteGameV2',
                        cmsEnv: 'iGamingMigrationsEU',
                        gameId: '68UdNRecbboKjD0HQ86yLv',
                        createdAt: '2025-03-05T12:26:27.432Z',
                        updatedAt: '2025-04-18T02:19:15.969Z',
                        version: 12,
                        publishedAt: '2025-04-18T02:19:15.969Z',
                        publishedVersion: 11,
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
                                    _index: 'games-v2',
                                    _id: '68UdNRecbboKjD0HQ86yLv',
                                    _score: 1,
                                    _source: {
                                        game_to_sitegame: {
                                            name: 'game',
                                        },
                                        game: {
                                            entryTitle: 'MGSD_WHACK_THE_BELL_TAP_N_CASH',
                                            gameName: 'play-micro-whack-the-bell-tap-n-cash',
                                            mobileGameName: 'play-micro-whack-the-bell-tap-n-cash-m',
                                            gameSkin: 'MGSD_WHACK_THE_BELL_TAP_N_CASH',
                                            mobileGameSkin: 'MGSM_WHACK_THE_BELL_TAP_N_CASH',
                                            mobileOverride: true,
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-micro-whack-the-bell-tap-n-cash',
                                                realUrl: '/service/game/play/play-micro-whack-the-bell-tap-n-cash',
                                                mobileDemoUrl:
                                                    '/service/game/demo/play-micro-whack-the-bell-tap-n-cash-m',
                                                mobileRealUrl:
                                                    '/service/game/play/play-micro-whack-the-bell-tap-n-cash-m',
                                            },
                                            platform: ['Phone', 'Tablet', 'Desktop'],
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
                                                'en-GB': '#D2412C',
                                            },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/whack-the-bell-tap-n-cash/scale-s%s/whack-the-bell-tap-n-cash-tile-r%s-w%s.jpg',
                                            },
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/whack-the-bell-tap-n-cash/scale-s%s/whack-the-bell-tap-n-cash-tile-r%s-w%s.jpg',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/whack-the-bell-tap-n-cash/scale-s%s/whack-the-bell-tap-n-cash-tile-r%s-w%s.jpg',
                                            },
                                            title: {
                                                'en-GB': 'Whack The Bell Tap N Cash',
                                            },
                                            maxBet: {
                                                'en-CA': '-',
                                                'en-GB': '£5',
                                                es: '-',
                                                sv: '-',
                                                'en-US': '-',
                                            },
                                            minBet: {
                                                'en-CA': '-',
                                                'en-GB': '0.05p',
                                                es: '-',
                                                sv: '-',
                                                'en-US': '-',
                                            },
                                            infoDetails: {
                                                'en-GB':
                                                    '<dt>Paylines:</dt><dd>N/A</dd><dt>Max Win:</dt><dd>x7,500</dd><dt>Features:</dt><dd>Free Plays</dd>',
                                            },
                                            introductionContent: {
                                                'en-GB':
                                                    '<p><br />Test your strength on the instant-win Whack the Bell: Tap n Cash&trade;!<br />Swing the hammer for the chance win up to 7,500x your stake.<br />Plus, look out for the bonus game, which could unlock up to 12 Free Plays and a 10x multiplier.</p>',
                                            },
                                            nativeRequirement: {
                                                'en-GB': null,
                                            },
                                            showNetPosition: true,
                                            platformVisibility: ['web', 'ios', 'android'],
                                            contentType: 'gameV2',
                                            id: '68UdNRecbboKjD0HQ86yLv',
                                            cmsEnv: 'iGamingMigrationsEU',
                                            updatedAt: '2025-04-16T23:27:43.731Z',
                                            publishedAt: '2025-04-16T23:27:43.731Z',
                                            version: 35,
                                            publishedVersion: 34,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                _index: 'games-v2',
                _id: '4wTyWOTzvANE3QS8Xmz2O6',
                _score: 1,
                _routing: '2M2VCmWfqpWG8hgJyxcr3M',
                _source: {
                    game_to_sitegame: {
                        name: 'sitegame',
                        parent: '2M2VCmWfqpWG8hgJyxcr3M',
                    },
                    siteGame: {
                        entryTitle: {
                            'en-GB': 'play-pt-piggies-and-the-bank-lucky-tap [jackpotjoy]',
                        },
                        venture: {
                            'en-GB': {
                                sys: {
                                    type: 'Link',
                                    linkType: 'Entry',
                                    id: '259MUOgLpQf5hVGxjNM5f2',
                                },
                            },
                        },
                        environment: ['staging', 'production'],
                        chat: {
                            'en-GB': {
                                isEnabled: true,
                                controlMobileChat: true,
                            },
                        },
                        maxBet: {
                            'en-CA': '-',
                            'en-GB': '',
                            es: '-',
                            sv: '-',
                            'en-US': '-',
                        },
                        minBet: {
                            'en-CA': '-',
                            'en-GB': '',
                            es: '-',
                            sv: '-',
                            'en-US': '-',
                        },
                        headlessJackpot: {
                            'en-GB': null,
                        },
                        liveHidden: {
                            'en-GB': false,
                        },
                        environmentVisibility: {
                            'en-GB': ['staging', 'production'],
                        },
                        platformVisibility: {
                            'en-GB': ['web', 'ios', 'android'],
                        },
                        id: '4wTyWOTzvANE3QS8Xmz2O6',
                        contentType: 'siteGameV2',
                        cmsEnv: 'iGamingMigrationsEU',
                        gameId: '2M2VCmWfqpWG8hgJyxcr3M',
                        createdAt: '2025-03-04T17:08:42.534Z',
                        updatedAt: '2025-04-18T02:17:56.917Z',
                        version: 12,
                        publishedAt: '2025-04-18T02:17:56.917Z',
                        publishedVersion: 11,
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
                                    _index: 'games-v2',
                                    _id: '2M2VCmWfqpWG8hgJyxcr3M',
                                    _score: 1,
                                    _source: {
                                        game_to_sitegame: {
                                            name: 'game',
                                        },
                                        game: {
                                            entryTitle: 'PT_PIGGIES_AND_THE_BANK_LUCKY_TAP',
                                            gameName: 'play-pt-piggies-and-the-bank-lucky-tap',
                                            mobileGameName: '',
                                            gameSkin: 'PT_PIGGIES_AND_THE_BANK_LUCKY_TAP',
                                            mobileGameSkin: '',
                                            mobileOverride: false,
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-pt-piggies-and-the-bank-lucky-tap',
                                                realUrl: '/service/game/play/play-pt-piggies-and-the-bank-lucky-tap',
                                                mobileDemoUrl: '',
                                                mobileRealUrl: '',
                                            },
                                            platform: ['Desktop', 'Phone', 'Tablet'],
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
                                                'en-GB': '#4A2866',
                                                es: '#6B422C',
                                            },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/piggies-and-the-bank-lucky-tap-logged-out/scale-s%s/piggies-and-the-bank-lucky-tap-logged-out-tile-r%s-w%s.jpg',
                                            },
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/piggies-and-the-bank-lucky-tap-logged-out/scale-s%s/piggies-and-the-bank-lucky-tap-logged-out-tile-r%s-w%s.jpg',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/piggies-and-the-bank-lucky-tap-logged-out/scale-s%s/piggies-and-the-bank-lucky-tap-logged-out-tile-r%s-w%s.jpg',
                                            },
                                            title: {
                                                'en-GB': 'Piggies And the Bank Lucky Tap',
                                            },
                                            maxBet: {
                                                'en-CA': '-',
                                                'en-GB': '£4.80',
                                                es: '-',
                                                sv: '-',
                                                'en-US': '-',
                                            },
                                            minBet: {
                                                'en-CA': '-',
                                                'en-GB': '6p',
                                                es: '-',
                                                sv: '-',
                                                'en-US': '-',
                                            },
                                            infoDetails: {
                                                'en-GB':
                                                    '<dt>Paylines:</dt><dd>N/A</dd><dt>Max Win:</dt><dd>x877</dd><dt>Features:</dt><dd>Mystery Multiplier Feature, Free Games</dd>',
                                            },
                                            introductionContent: {
                                                'en-GB':
                                                    '<p>Trot your way to the bank on Piggies and the Bank: Lucky Tap!<br />Discover Mystery Multipliers as you spin &ndash; win between 3 and 6 coins, and your prize could be randomly multiplied by anywhere from x2 to x7!<br />Land three Bonus coins, and watch as the piggies turn to gold &ndash; this awards you 10 Free Tosses to boost your winnings.<br />Feeling lucky?</p>',
                                            },
                                            nativeRequirement: {
                                                'en-GB': null,
                                            },
                                            showNetPosition: true,
                                            platformVisibility: ['web', 'ios', 'android'],
                                            contentType: 'gameV2',
                                            id: '2M2VCmWfqpWG8hgJyxcr3M',
                                            cmsEnv: 'iGamingMigrationsEU',
                                            updatedAt: '2025-04-16T23:27:25.702Z',
                                            publishedAt: '2025-04-16T23:27:25.702Z',
                                            version: 43,
                                            publishedVersion: 42,
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
