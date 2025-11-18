export const GAMES_SUCCESS_RESP: any = {
    took: 3,
    timed_out: false,
    _shards: {
        total: 1,
        successful: 1,
        skipped: 0,
        failed: 0,
    },
    hits: {
        total: {
            value: 6,
            relation: 'eq',
        },
        max_score: 1,
        hits: [
            {
                _index: 'games-v2',
                _id: '4vlxSOhkyXjfpS4kTo9Dv1',
                _score: 1,
                _routing: '6Zaylk8JyjuvgAkpnZKJLc',
                _source: {
                    game_to_sitegame: {
                        name: 'sitegame',
                        parent: '6Zaylk8JyjuvgAkpnZKJLc',
                    },
                    siteGame: {
                        entryTitle: { 'en-GB': 'play-micro-massive-gold-maxxd [jackpotjoy]' },
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
                        chat: { 'en-GB': { isEnabled: true, controlMobileChat: true } },
                        maxBet: { 'en-CA': '-', 'en-GB': '', es: '-', sv: '-', 'en-US': '-' },
                        minBet: { 'en-CA': '-', 'en-GB': '', es: '-', sv: '-', 'en-US': '-' },
                        headlessJackpot: { 'en-GB': null },
                        liveHidden: { 'en-GB': false },
                        environmentVisibility: { 'en-GB': ['staging', 'production'] },
                        platformVisibility: { 'en-GB': ['web', 'ios', 'android'] },
                        id: '4vlxSOhkyXjfpS4kTo9Dv1',
                        contentType: 'siteGameV2',
                        cmsEnv: 'iGamingMigrationsEU',
                        gameId: '6Zaylk8JyjuvgAkpnZKJLc',
                        createdAt: '2025-03-17T17:25:13.535Z',
                        updatedAt: '2025-04-18T02:25:19.811Z',
                        version: 16,
                        publishedAt: '2025-04-15T10:30:31.954Z',
                        publishedVersion: 13,
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            total: { value: 1, relation: 'eq' },
                            max_score: 1,
                            hits: [
                                {
                                    _index: 'games-v2',
                                    _id: '6Zaylk8JyjuvgAkpnZKJLc',
                                    _score: 1,
                                    _source: {
                                        game_to_sitegame: { name: 'game' },
                                        game: {
                                            entryTitle: { 'en-GB': 'MGSD_MASSIVE_GOLD_MAXXED' },
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    name: 'play-micro-massive-gold-maxxd',
                                                    demoUrl: '/service/game/demo/play-micro-massive-gold-maxxd',
                                                    realUrl: '/service/game/play/play-micro-massive-gold-maxxd',
                                                    gameSkin: 'MGSD_MASSIVE_GOLD_MAXXED',
                                                    gameType: {
                                                        reel: '5-3',
                                                        type: 'Slots',
                                                        brand: '',
                                                        themes: ['Other', 'Gems'],
                                                        features: [
                                                            'Free Spins',
                                                            'Multipliers (With or without wilds)',
                                                            'Bonus Game',
                                                            'Cash Collect',
                                                        ],
                                                        winLines: '20',
                                                        isJackpot: false,
                                                        waysToWin: 'Other',
                                                        symbolType: ['Other', 'Gems'],
                                                        symbolCount: '10',
                                                        winLineType: 'L2R',
                                                        isPersistence: false,
                                                        maxMultiplier: '7000',
                                                        isJackpotFixedPrize: false,
                                                        isJackpotPlatformProgressive: false,
                                                        isJackpotInGameProgressive: false,
                                                    },
                                                    gameStudio: '',
                                                    mobileName: 'play-micro-massive-gold-maxxd-m',
                                                    gameProvider: 'Games Global',
                                                    mobileDemoUrl: '/service/game/demo/play-micro-massive-gold-maxxd-m',
                                                    mobileRealUrl: '/service/game/play/play-micro-massive-gold-maxxd-m',
                                                    mobileGameSkin: 'MGSM_MASSIVE_GOLD_MAXXED',
                                                    mobileOverride: true,
                                                    gameLoaderFileName: 'MGSD_MASSIVE_GOLD_MAXXED',
                                                    mobileGameLoaderFileName: 'MGSM_MASSIVE_GOLD_MAXXED',
                                                },
                                            },
                                            platform: ['Phone', 'Tablet', 'Desktop'],
                                            vendor: { 'en-GB': 'infinity' },
                                            showGameName: { 'en-GB': false },
                                            progressiveJackpot: { 'en-GB': false },
                                            operatorBarDisabled: { 'en-GB': false },
                                            rgpEnabled: { 'en-GB': true },
                                            funPanelEnabled: { 'en-GB': false },
                                            funPanelDefaultCategory: { 'en-GB': '' },
                                            representativeColor: { 'en-GB': '#530B00' },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/massive-gold-maxxed-logged-out/scale-s%s/massive-gold-maxxed-logged-out-tile-r%s-w%s.jpg',
                                            },
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/massive-gold-maxxed-logged-out/scale-s%s/massive-gold-maxxed-logged-out-tile-r%s-w%s.jpg',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/massive-gold-maxxed/scale-s%s/massive-gold-maxxed-tile-r%s-w%s.jpg',
                                            },
                                            title: { 'en-GB': 'Massive Gold Maxxd' },
                                            maxBet: { 'en-CA': '-', 'en-GB': '£5', es: '-', sv: '-', 'en-US': '-' },
                                            minBet: { 'en-CA': '-', 'en-GB': '20p', es: '-', sv: '-', 'en-US': '-' },
                                            infoDetails: {
                                                'en-GB':
                                                    '<dt>Paylines:</dt><dd>20</dd><dt>Max Win:</dt><dd>x7,000</dd><dt>Features:</dt><dd>Maxxed Free Spins, Collect Wins, Boosters</dd>',
                                            },
                                            introductionContent: {
                                                'en-GB': '<p>Get ready for Massive Gold MAXXED™!...</p>',
                                            },
                                            nativeRequirement: { 'en-GB': null },
                                            showNetPosition: { 'en-GB': true, es: false },
                                            platformVisibility: { 'en-GB': ['web', 'ios', 'android'] },
                                            contentType: 'gameV2',
                                            id: '6Zaylk8JyjuvgAkpnZKJLc',
                                            cmsEnv: 'iGamingMigrationsEU',
                                            updatedAt: '2025-04-16T23:28:43.846Z',
                                            publishedAt: '2025-04-16T23:28:43.846Z',
                                            version: 46,
                                            publishedVersion: 45,
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
                _id: 'TvL4bljNtRPRV1RvFnFWr',
                _score: 1,
                _routing: '6JdG7QQH7s1AnttaOgnTNf',
                _source: {
                    game_to_sitegame: { name: 'sitegame', parent: '6JdG7QQH7s1AnttaOgnTNf' },
                    siteGame: {
                        entryTitle: { 'en-GB': 'play-igt-lucky-larry-lobstermania-2 [jackpotjoy]' },
                        venture: {
                            'en-GB': { sys: { type: 'Link', linkType: 'Entry', id: '259MUOgLpQf5hVGxjNM5f2' } },
                        },
                        environment: ['staging', 'production'],
                        chat: { 'en-GB': { isEnabled: true, controlMobileChat: true } },
                        maxBet: { 'en-CA': '-', 'en-GB': '', es: '-', sv: '-', 'en-US': '-' },
                        minBet: { 'en-CA': '-', 'en-GB': '', es: '-', sv: '-', 'en-US': '-' },
                        headlessJackpot: { 'en-GB': null },
                        liveHidden: { 'en-GB': false },
                        environmentVisibility: { 'en-GB': ['staging', 'production'] },
                        platformVisibility: { 'en-GB': ['web', 'ios', 'android'] },
                        id: 'TvL4bljNtRPRV1RvFnFWr',
                        contentType: 'siteGameV2',
                        cmsEnv: 'iGamingMigrationsEU',
                        gameId: '6JdG7QQH7s1AnttaOgnTNf',
                        createdAt: '2025-03-14T10:55:05.114Z',
                        updatedAt: '2025-04-18T02:23:12.244Z',
                        version: 12,
                        publishedAt: '2025-04-18T02:23:12.244Z',
                        publishedVersion: 11,
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            total: { value: 1, relation: 'eq' },
                            max_score: 1,
                            hits: [
                                {
                                    _index: 'games-v2',
                                    _id: '6JdG7QQH7s1AnttaOgnTNf',
                                    _score: 1,
                                    _source: {
                                        game_to_sitegame: { name: 'game' },
                                        game: {
                                            entryTitle: { 'en-GB': 'IGT_LUCKY_LARRYS_LOBSTERMANIA_2' },
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    name: 'play-igt-lucky-larry-lobstermania-2',
                                                    demoUrl: '/service/game/demo/play-igt-lucky-larry-lobstermania-2',
                                                    realUrl: '/service/game/play/play-igt-lucky-larry-lobstermania-2',
                                                    gameSkin: 'IGT_LUCKY_LARRYS_LOBSTERMANIA_2',
                                                    gameType: {
                                                        reel: '5-4',
                                                        type: 'Slots',
                                                        brand: '',
                                                        themes: ['Fishing', 'Water'],
                                                        features: ['Free Spins'],
                                                        winLines: '40',
                                                        isJackpot: false,
                                                        waysToWin: 'Other',
                                                        symbolType: ['Royals', 'Other'],
                                                        symbolCount: '12',
                                                        winLineType: 'L2R',
                                                        isPersistence: false,
                                                        maxMultiplier: '8000',
                                                        isJackpotFixedPrize: false,
                                                        isJackpotPlatformProgressive: false,
                                                        isJackpotInGameProgressive: false,
                                                    },
                                                    gameStudio: '',
                                                    mobileName: '',
                                                    gameProvider: 'IGT',
                                                    mobileDemoUrl: '',
                                                    mobileRealUrl: '',
                                                    mobileGameSkin: '',
                                                    mobileOverride: false,
                                                    gameLoaderFileName: 'IGT_LUCKY_LARRYS_LOBSTERMANIA_2',
                                                    mobileGameLoaderFileName: '',
                                                },
                                            },
                                            platform: ['Desktop', 'Tablet', 'Phone'],
                                            vendor: { 'en-GB': 'infinity' },
                                            showGameName: { 'en-GB': false },
                                            progressiveJackpot: { 'en-GB': false },
                                            operatorBarDisabled: { 'en-GB': false },
                                            rgpEnabled: { 'en-GB': true },
                                            funPanelEnabled: { 'en-GB': false },
                                            funPanelDefaultCategory: { 'en-GB': '' },
                                            representativeColor: { 'en-GB': '#3876E9' },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/lucky-larrys-lobstermania-2-logged-out/scale-s%s/lucky-larrys-lobstermania-2-logged-out-tile-r%s-w%s.jpg',
                                            },
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/lucky-larrys-lobstermania-2-logged-out/scale-s%s/lucky-larrys-lobstermania-2-logged-out-tile-r%s-w%s.jpg',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/lucky-larrys-lobstermania-2/scale-s%s/lucky-larrys-lobstermania-2-tile-r%s-w%s.jpg',
                                            },
                                            title: { 'en-GB': 'Lucky Larry Lobstermania 2' },
                                            maxBet: { 'en-CA': '-', 'en-GB': '£3', es: '-', sv: '-', 'en-US': '-' },
                                            minBet: { 'en-CA': '-', 'en-GB': '60p', es: '-', sv: '-', 'en-US': '-' },
                                            infoDetails: {
                                                'en-GB':
                                                    '<dt>Paylines:</dt><dd>40</dd><dt>Max Win:</dt><dd>x50,000</dd><dt>Features:</dt><dd>Free Spins, Stacked Wilds, Multipliers</dd>',
                                            },
                                            introductionContent: {
                                                'en-GB':
                                                    '<p>Clack those claws for Lucky Larry&rsquo;s Lobstermania 2!...</p>',
                                            },
                                            nativeRequirement: { 'en-GB': null },
                                            showNetPosition: { 'en-GB': true, es: false },
                                            platformVisibility: { 'en-GB': ['web', 'ios', 'android'] },
                                            contentType: 'gameV2',
                                            id: '6JdG7QQH7s1AnttaOgnTNf',
                                            cmsEnv: 'iGamingMigrationsEU',
                                            updatedAt: '2025-04-16T23:28:21.438Z',
                                            publishedAt: '2025-04-16T23:28:21.438Z',
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
            {
                _index: 'games-v2',
                _id: '75yHQezU5gUvcUHuApO0fy',
                _score: 1,
                _routing: '2UkyvrNwT2bHnWq1uuvG2V',
                _source: {
                    game_to_sitegame: { name: 'sitegame', parent: '2UkyvrNwT2bHnWq1uuvG2V' },
                    siteGame: {
                        entryTitle: { 'en-GB': 'play-micro-treasures-of-kilauea-2 [jackpotjoy]' },
                        venture: {
                            'en-GB': { sys: { type: 'Link', linkType: 'Entry', id: '259MUOgLpQf5hVGxjNM5f2' } },
                        },
                        environment: ['staging', 'production'],
                        chat: { 'en-GB': { isEnabled: true, controlMobileChat: true } },
                        maxBet: { 'en-CA': '-', 'en-GB': '', es: '-', sv: '-', 'en-US': '-' },
                        minBet: { 'en-CA': '-', 'en-GB': '', es: '-', sv: '-', 'en-US': '-' },
                        headlessJackpot: {
                            'en-GB': {
                                id: 1,
                                name: 'JACKPOT_BLAST',
                                activeEnv: 'live-eu',
                            },
                        },
                        liveHidden: { 'en-GB': false },
                        environmentVisibility: { 'en-GB': ['staging', 'production'] },
                        platformVisibility: { 'en-GB': ['web', 'ios', 'android'] },
                        id: '75yHQezU5gUvcUHuApO0fy',
                        contentType: 'siteGameV2',
                        cmsEnv: 'iGamingMigrationsEU',
                        gameId: '2UkyvrNwT2bHnWq1uuvG2V',
                        createdAt: '2025-03-14T09:48:19.701Z',
                        updatedAt: '2025-04-18T02:22:48.143Z',
                        version: 14,
                        publishedAt: '2025-04-18T02:22:48.143Z',
                        publishedVersion: 13,
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            total: { value: 1, relation: 'eq' },
                            max_score: 1,
                            hits: [
                                {
                                    _index: 'games-v2',
                                    _id: '2UkyvrNwT2bHnWq1uuvG2V',
                                    _score: 1,
                                    _source: {
                                        game_to_sitegame: { name: 'game' },
                                        game: {
                                            entryTitle: { 'en-GB': 'MGSD_TREASURES_OF_KILAUEA_2' },
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    name: 'play-micro-treasures-of-kilauea-2',
                                                    demoUrl: '/service/game/demo/play-micro-treasures-of-kilauea-2',
                                                    realUrl: '/service/game/play/play-micro-treasures-of-kilauea-2',
                                                    gameSkin: 'MGSD_TREASURES_OF_KILAUEA_2',
                                                    gameType: {
                                                        reel: '5-4',
                                                        type: 'Slots',
                                                        brand: '',
                                                        themes: ['Mayan/Aztec', 'Fantasy'],
                                                        features: [
                                                            'Free Spins',
                                                            'Mystery Symbols',
                                                            'Multipliers (With or without wilds)',
                                                            'Bonus Game',
                                                        ],
                                                        winLines: '20',
                                                        isJackpot: true,
                                                        waysToWin: 'Other',
                                                        symbolType: ['Other'],
                                                        symbolCount: '15',
                                                        winLineType: 'L2R',
                                                        isPersistence: false,
                                                        maxMultiplier: '5000',
                                                        isJackpotFixedPrize: false,
                                                        isJackpotPlatformProgressive: false,
                                                        isJackpotInGameProgressive: false,
                                                    },
                                                    gameStudio: '',
                                                    mobileName: 'play-micro-treasures-of-kilauea-2-m',
                                                    gameProvider: 'Games Global',
                                                    mobileDemoUrl:
                                                        '/service/game/demo/play-micro-treasures-of-kilauea-2-m',
                                                    mobileRealUrl:
                                                        '/service/game/play/play-micro-treasures-of-kilauea-2-m',
                                                    mobileGameSkin: 'MGSM_TREASURES_OF_KILAUEA_2',
                                                    mobileOverride: true,
                                                    gameLoaderFileName: 'MGSD_TREASURES_OF_KILAUEA_2',
                                                    mobileGameLoaderFileName: 'MGSM_TREASURES_OF_KILAUEA_2',
                                                },
                                            },
                                            platform: ['Phone', 'Tablet', 'Desktop'],
                                            vendor: { 'en-GB': 'infinity' },
                                            showGameName: { 'en-GB': false },
                                            progressiveJackpot: { 'en-GB': false },
                                            operatorBarDisabled: { 'en-GB': false },
                                            rgpEnabled: { 'en-GB': true },
                                            funPanelEnabled: { 'en-GB': false },
                                            funPanelDefaultCategory: { 'en-GB': '' },
                                            representativeColor: { 'en-GB': '#C62BD1' },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/treasures-of-kilauea-2/scale-s%s/treasures-of-kilauea-2-tile-r%s-w%s.jpg',
                                            },
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/treasures-of-kilauea-2/scale-s%s/treasures-of-kilauea-2-tile-r%s-w%s.jpg',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/treasures-of-kilauea-2/scale-s%s/treasures-of-kilauea-2-tile-r%s-w%s.jpg',
                                            },
                                            title: { 'en-GB': 'Treasures of Kilauea 2' },
                                            maxBet: { 'en-CA': '-', 'en-GB': '£5', es: '-', sv: '-', 'en-US': '-' },
                                            minBet: { 'en-CA': '-', 'en-GB': '20p', es: '-', sv: '-', 'en-US': '-' },
                                            infoDetails: {
                                                'en-GB':
                                                    '<dt>Paylines:</dt><dd>20</dd><dt>Max Win:</dt><dd>x5,000</dd><dt>Features:</dt><dd>Wild Burst, Bonuts Pots, Bonus Wheel Gamble, Increasing Jackpots</dd>',
                                            },
                                            introductionContent: {
                                                'en-GB':
                                                    '<p>Embark on a daring quest in search of the Treasures of Kilauea 2!...</p>',
                                            },
                                            nativeRequirement: { 'en-GB': null },
                                            showNetPosition: { 'en-GB': true, es: false },
                                            platformVisibility: { 'en-GB': ['web', 'ios', 'android'] },
                                            contentType: 'gameV2',
                                            id: '2UkyvrNwT2bHnWq1uuvG2V',
                                            cmsEnv: 'iGamingMigrationsEU',
                                            updatedAt: '2025-04-16T23:28:16.382Z',
                                            publishedAt: '2025-04-16T23:28:16.382Z',
                                            version: 36,
                                            publishedVersion: 35,
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

export const JACKPOT_GAMES_SUCCESS_RESP: any = {
    took: 1,
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
                _id: '4JJAHVvRozAV5PNY5WAB61',
                _score: 1,
                _routing: '22BTTFeBTl1lKdHzmpvnwL',
                _source: {
                    game_to_sitegame: {
                        name: 'sitegame',
                        parent: '22BTTFeBTl1lKdHzmpvnwL',
                    },
                    siteGame: {
                        entryTitle: { 'en-GB': 'play-bp-fishin-frenzy-even-bigger-fish-rapid-fire [jackpotjoy]' },
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
                        chat: { 'en-GB': { isEnabled: true, controlMobileChat: true } },
                        maxBet: { 'en-CA': '-', 'en-GB': '', es: '-', sv: '-', 'en-US': '-' },
                        minBet: { 'en-CA': '-', 'en-GB': '', es: '-', sv: '-', 'en-US': '-' },
                        headlessJackpot: { 'en-GB': null },
                        liveHidden: { 'en-GB': false },
                        environmentVisibility: { 'en-GB': ['staging', 'production'] },
                        platformVisibility: { 'en-GB': ['web', 'ios', 'android'] },
                        id: '4JJAHVvRozAV5PNY5WAB61',
                        contentType: 'siteGameV2',
                        cmsEnv: 'iGamingMigrationsEU',
                        gameId: '22BTTFeBTl1lKdHzmpvnwL',
                        createdAt: '2025-02-25T12:19:03.530Z',
                        updatedAt: '2025-04-18T02:11:38.624Z',
                        version: 17,
                        publishedAt: '2025-04-18T02:11:38.624Z',
                        publishedVersion: 16,
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            total: { value: 1, relation: 'eq' },
                            max_score: 1,
                            hits: [
                                {
                                    _index: 'games-v2',
                                    _id: '22BTTFeBTl1lKdHzmpvnwL',
                                    _score: 1,
                                    _source: {
                                        game_to_sitegame: { name: 'game' },
                                        game: {
                                            entryTitle: { 'en-GB': 'BP_FISHIN_FRENZY_EVEN_BIGGER_FISH_RAPID_FIRE' },
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    name: 'play-bp-fishin-frenzy-even-bigger-fish-rapid-fire',
                                                    demoUrl:
                                                        '/service/game/demo/play-bp-fishin-frenzy-even-bigger-fish-rapid-fire',
                                                    realUrl:
                                                        '/service/game/play/play-bp-fishin-frenzy-even-bigger-fish-rapid-fire',
                                                    gameSkin: 'BP_FISHIN_FRENZY_EVEN_BIGGER_FISH_RAPID_FIRE',
                                                    gameType: {
                                                        reel: '6-4',
                                                        type: 'Slots',
                                                        brand: '',
                                                        themes: ['Nature', 'Fishing'],
                                                        features: ['Free Spins'],
                                                        winLines: 'Other',
                                                        isJackpot: false,
                                                        waysToWin: '4096',
                                                        symbolType: ['Suits', 'Other'],
                                                        symbolCount: '13',
                                                        winLineType: 'L2R',
                                                        isPersistence: false,
                                                        maxMultiplier: '500',
                                                        isJackpotFixedPrize: false,
                                                        isJackpotPlatformProgressive: false,
                                                        isJackpotInGameProgressive: false,
                                                    },
                                                    gameStudio: '',
                                                    mobileName: '',
                                                    gameProvider: 'Blueprint',
                                                    mobileDemoUrl: '',
                                                    mobileRealUrl: '',
                                                    mobileGameSkin: '',
                                                    mobileOverride: false,
                                                    gameLoaderFileName: 'BP_FISHIN_FRENZY_EVEN_BIGGER_FISH_RAPID_FIRE',
                                                    mobileGameLoaderFileName: '',
                                                },
                                            },
                                            platform: ['Desktop', 'Phone', 'Tablet'],
                                            vendor: { 'en-GB': 'infinity' },
                                            showGameName: { 'en-GB': false },
                                            progressiveJackpot: { 'en-GB': false },
                                            operatorBarDisabled: { 'en-GB': false },
                                            rgpEnabled: { 'en-GB': true },
                                            funPanelEnabled: { 'en-GB': false },
                                            funPanelDefaultCategory: { 'en-GB': '' },
                                            representativeColor: { 'en-GB': '#041F3C' },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/fishin-frenzy-even-bigger-fish-rapid-fire-logged-out/scale-s%s/fishin-frenzy-even-bigger-fish-rapid-fire-logged-out-tile-r%s-w%s.jpg',
                                            },
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/fishin-frenzy-even-bigger-fish-rapid-fire-logged-out/scale-s%s/fishin-frenzy-even-bigger-fish-rapid-fire-logged-out-tile-r%s-w%s.jpg',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/fishin-frenzy-even-bigger-fish-rapid-fire/scale-s%s/fishin-frenzy-even-bigger-fish-rapid-fire-tile-r%s-w%s.jpg',
                                            },
                                            title: { 'en-GB': 'Fishin Frenzy Even Bigger Fish Rapid Fire' },
                                            maxBet: { 'en-CA': '-', 'en-GB': '£5', es: '-', sv: '-', 'en-US': '-' },
                                            minBet: { 'en-CA': '-', 'en-GB': '10p', es: '-', sv: '-', 'en-US': '-' },
                                            infoDetails: {
                                                'en-GB':
                                                    '<dt>Paylines:</dt><dd>4096 Ways</dd><dt>Max Win:</dt><dd>x500</dd><dt>Features:</dt><dd>Free Spins Bonus, Rapid Fire Jackpots</dd>',
                                            },
                                            introductionContent: {
                                                'en-GB':
                                                    '<p>Net a big catch on Fishin&rsquo; Frenzy Even Bigger Fish Rapid Fire!... Time for fishing!</p>',
                                            },
                                            nativeRequirement: { 'en-GB': null },
                                            showNetPosition: { 'en-GB': true, es: false },
                                            platformVisibility: { 'en-GB': ['web', 'ios', 'android'] },
                                            contentType: 'gameV2',
                                            id: '22BTTFeBTl1lKdHzmpvnwL',
                                            cmsEnv: 'iGamingMigrationsEU',
                                            updatedAt: '2025-04-16T23:26:02.625Z',
                                            publishedAt: '2025-04-16T23:26:02.625Z',
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
            {
                _index: 'games-v2',
                _id: '1pMF7ymfJ68tV8sgwzxDhU',
                _score: 1,
                _routing: '1B7Tk43Wv6QMClTvgFkw8b',
                _source: {
                    game_to_sitegame: {
                        name: 'sitegame',
                        parent: '1B7Tk43Wv6QMClTvgFkw8b',
                    },
                    siteGame: {
                        entryTitle: { 'en-GB': 'play-bp-dond-megaways-rapid-fire [jackpotjoy]' },
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
                        sash: { 'en-GB': '' },
                        chat: { 'en-GB': { isEnabled: true, controlMobileChat: true } },
                        maxBet: { 'en-CA': '-', 'en-GB': '', es: '-', sv: '-', 'en-US': '-' },
                        minBet: { 'en-CA': '-', 'en-GB': '', es: '-', sv: '-', 'en-US': '-' },
                        headlessJackpot: { 'en-GB': null },
                        liveHidden: { 'en-GB': false },
                        environmentVisibility: { 'en-GB': ['staging', 'production'] },
                        platformVisibility: { 'en-GB': ['web', 'ios', 'android'] },
                        id: '1pMF7ymfJ68tV8sgwzxDhU',
                        contentType: 'siteGameV2',
                        cmsEnv: 'iGamingMigrationsEU',
                        gameId: '1B7Tk43Wv6QMClTvgFkw8b',
                        createdAt: '2025-02-25T12:02:20.405Z',
                        updatedAt: '2025-04-18T02:11:18.369Z',
                        version: 12,
                        publishedAt: '2025-04-18T02:11:18.369Z',
                        publishedVersion: 11,
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            total: { value: 1, relation: 'eq' },
                            max_score: 1,
                            hits: [
                                {
                                    _index: 'games-v2',
                                    _id: '1B7Tk43Wv6QMClTvgFkw8b',
                                    _score: 1,
                                    _source: {
                                        game_to_sitegame: { name: 'game' },
                                        game: {
                                            entryTitle: { 'en-GB': 'BP_DEAL_OR_NO_DEAL_MEGAWAYS_RAPID_FIRE' },
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    name: 'play-bp-dond-megaways-rapid-fire',
                                                    demoUrl: '/service/game/demo/play-bp-dond-megaways-rapid-fire',
                                                    realUrl: '/service/game/play/play-bp-dond-megaways-rapid-fire',
                                                    gameSkin: 'BP_DEAL_OR_NO_DEAL_MEGAWAYS_RAPID_FIRE',
                                                    gameType: {
                                                        reel: 'Megaways',
                                                        type: 'Slots',
                                                        brand: '',
                                                        themes: ['Branded'],
                                                        features: ['Free Spins', 'Mystery Symbols'],
                                                        winLines: 'Other',
                                                        isJackpot: false,
                                                        waysToWin: '117649',
                                                        symbolType: ['Royals', 'Other'],
                                                        symbolCount: '13',
                                                        winLineType: 'Megaways',
                                                        isPersistence: false,
                                                        maxMultiplier: '50000',
                                                        isJackpotFixedPrize: false,
                                                        isJackpotPlatformProgressive: false,
                                                        isJackpotInGameProgressive: false,
                                                    },
                                                    gameStudio: '',
                                                    mobileName: '',
                                                    gameProvider: 'Blueprint',
                                                    mobileDemoUrl: '',
                                                    mobileRealUrl: '',
                                                    mobileGameSkin: '',
                                                    mobileOverride: false,
                                                    gameLoaderFileName: 'BP_DEAL_OR_NO_DEAL_MEGAWAYS_RAPID_FIRE',
                                                    mobileGameLoaderFileName: '',
                                                },
                                            },
                                            platform: ['Desktop', 'Phone', 'Tablet'],
                                            vendor: { 'en-GB': 'infinity' },
                                            showGameName: { 'en-GB': false },
                                            progressiveJackpot: { 'en-GB': false },
                                            operatorBarDisabled: { 'en-GB': false },
                                            rgpEnabled: { 'en-GB': true },
                                            funPanelEnabled: { 'en-GB': false },
                                            funPanelDefaultCategory: { 'en-GB': '' },
                                            representativeColor: { 'en-GB': '#131024' },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/deal-or-no-deal-megaways-rapid-fire-logged-out/scale-s%s/deal-or-no-deal-megaways-rapid-fire-logged-out-tile-r%s-w%s.jpg',
                                            },
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/deal-or-no-deal-megaways-rapid-fire-logged-out/scale-s%s/deal-or-no-deal-megaways-rapid-fire-logged-out-tile-r%s-w%s.jpg',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/deal-or-no-deal-megaways-rapid-fire/scale-s%s/deal-or-no-deal-megaways-rapid-fire-tile-r%s-w%s.jpg',
                                            },
                                            title: { 'en-GB': 'Deal Or No Deal Megaways Rapid Fire' },
                                            maxBet: { 'en-CA': '-', 'en-GB': '£5', sv: '-', 'en-US': '-' },
                                            minBet: { 'en-CA': '-', 'en-GB': '10p', sv: '-', 'en-US': '-' },
                                            infoDetails: {
                                                'en-GB':
                                                    '<dt>Paylines:</dt><dd>117,649 Ways</dd><dt>Max Win:</dt><dd>x50,000</dd><dt>Features:</dt><dd>Free Spins, Mystery Symbol, Deal or No Deal Bet, Rapid Fire Jackpots</dd>',
                                            },
                                            introductionContent: {
                                                'en-GB':
                                                    '<p>The iconic game show meets Megaways&trade; in Deal or No Deal Megaways Rapid Fire, where every spin could lead to the ultimate showdown with the Banker!... Will you make a deal?</p>',
                                            },
                                            nativeRequirement: { 'en-GB': null },
                                            showNetPosition: { 'en-GB': true, es: false },
                                            platformVisibility: { 'en-GB': ['web', 'ios', 'android'] },
                                            contentType: 'gameV2',
                                            id: '1B7Tk43Wv6QMClTvgFkw8b',
                                            cmsEnv: 'iGamingMigrationsEU',
                                            updatedAt: '2025-04-16T23:26:01.723Z',
                                            publishedAt: '2025-04-16T23:26:01.723Z',
                                            version: 46,
                                            publishedVersion: 45,
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
                _id: '3kg384W5gyopOEQxDsAHLz',
                _score: 1,
                _routing: 'EBZqHbN1mpA25wfMdrpJw',
                _source: {
                    game_to_sitegame: {
                        name: 'sitegame',
                        parent: 'EBZqHbN1mpA25wfMdrpJw',
                    },
                    siteGame: {
                        entryTitle: { 'en-GB': 'play-bp-big-catch-even-bigger-bass-rapid-fire [jackpotjoy]' },
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
                        sash: { 'en-GB': '' },
                        chat: { 'en-GB': { isEnabled: true, controlMobileChat: true } },
                        maxBet: { 'en-CA': '-', 'en-GB': '', es: '-', sv: '-', 'en-US': '-' },
                        minBet: { 'en-CA': '-', 'en-GB': '', es: '-', sv: '-', 'en-US': '-' },
                        headlessJackpot: { 'en-GB': null },
                        liveHidden: { 'en-GB': false },
                        environmentVisibility: { 'en-GB': ['staging', 'production'] },
                        platformVisibility: { 'en-GB': ['web', 'ios', 'android'] },
                        id: '3kg384W5gyopOEQxDsAHLz',
                        contentType: 'siteGameV2',
                        cmsEnv: 'iGamingMigrationsEU',
                        gameId: 'EBZqHbN1mpA25wfMdrpJw',
                        createdAt: '2025-01-09T14:23:00.641Z',
                        updatedAt: '2025-04-18T01:57:20.272Z',
                        version: 14,
                        publishedAt: '2025-04-18T01:57:20.272Z',
                        publishedVersion: 13,
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            total: { value: 1, relation: 'eq' },
                            max_score: 1,
                            hits: [
                                {
                                    _index: 'games-v2',
                                    _id: 'EBZqHbN1mpA25wfMdrpJw',
                                    _score: 1,
                                    _source: {
                                        game_to_sitegame: { name: 'game' },
                                        game: {
                                            entryTitle: { 'en-GB': 'BP_BIG_CATCH_EVEN_BIGGER_FISH_RAPID_FIRE' },
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    name: 'play-bp-big-catch-even-bigger-bass-rapid-fire',
                                                    demoUrl:
                                                        '/service/game/demo/play-bp-big-catch-even-bigger-bass-rapid-fire',
                                                    realUrl:
                                                        '/service/game/play/play-bp-big-catch-even-bigger-bass-rapid-fire',
                                                    gameSkin: 'BP_BIG_CATCH_EVEN_BIGGER_FISH_RAPID_FIRE',
                                                    gameType: {
                                                        reel: '6-4',
                                                        type: 'Slots',
                                                        brand: '',
                                                        themes: ['Nature', 'Fishing', 'Water'],
                                                        features: ['Cash Collect', 'Hold and Win', 'Free Spins'],
                                                        winLines: 'Other',
                                                        isJackpot: true,
                                                        waysToWin: '4096',
                                                        symbolType: ['Suits', 'Other'],
                                                        symbolCount: '13',
                                                        winLineType: 'L2R',
                                                        isPersistence: false,
                                                        maxMultiplier: '10000',
                                                        isJackpotFixedPrize: false,
                                                        isJackpotPlatformProgressive: false,
                                                        isJackpotInGameProgressive: false,
                                                    },
                                                    gameStudio: '',
                                                    mobileName: '',
                                                    gameProvider: 'Blueprint',
                                                    mobileDemoUrl: '',
                                                    mobileRealUrl: '',
                                                    mobileGameSkin: '',
                                                    mobileOverride: false,
                                                    gameLoaderFileName: 'BP_BIG_CATCH_EVEN_BIGGER_FISH_RAPID_FIRE',
                                                    mobileGameLoaderFileName: '',
                                                },
                                            },
                                            platform: ['Desktop', 'Phone', 'Tablet'],
                                            vendor: { 'en-GB': 'infinity' },
                                            showGameName: { 'en-GB': false },
                                            progressiveJackpot: { 'en-GB': false },
                                            operatorBarDisabled: { 'en-GB': false },
                                            rgpEnabled: { 'en-GB': true },
                                            funPanelEnabled: { 'en-GB': false },
                                            funPanelDefaultCategory: { 'en-GB': '' },
                                            representativeColor: { 'en-GB': '#4B275D' },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/big-catch-even-bigger-bass-rapid-fire-logged-out/scale-s%s/big-catch-even-bigger-bass-rapid-fire-logged-out-tile-r%s-w%s.jpg',
                                            },
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/big-catch-even-bigger-bass-rapid-fire-logged-out/scale-s%s/big-catch-even-bigger-bass-rapid-fire-logged-out-tile-r%s-w%s.jpg',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/big-catch-even-bigger-bass-rapid-fire/scale-s%s/big-catch-even-bigger-bass-rapid-fire-tile-r%s-w%s.jpg',
                                            },
                                            title: { 'en-GB': 'Big Catch Even Bigger Bass Rapid Fire' },
                                            maxBet: { 'en-CA': '-', 'en-GB': '£5', es: '-', sv: '-', 'en-US': '-' },
                                            minBet: { 'en-CA': '-', 'en-GB': '10p', es: '-', sv: '-', 'en-US': '-' },
                                            infoDetails: {
                                                'en-GB':
                                                    '<dt>Paylines:</dt><dd>4096 Ways</dd><dt>Max Win:</dt><dd>x10,000</dd><dt>Features:</dt><dd>Cash Collect, Lock & Spin, Pick a Win, Big Splash, Free Spins, Rapid Fire Jackpots</dd>',
                                            },
                                            introductionContent: {
                                                'en-GB':
                                                    '<p>Be as bold as Bass on Big Catch Even Bigger Bass Rapid Fire!... All aboard.</p>',
                                            },
                                            nativeRequirement: { 'en-GB': null },
                                            showNetPosition: { 'en-GB': true, es: false },
                                            platformVisibility: { 'en-GB': ['web', 'ios', 'android'] },
                                            contentType: 'gameV2',
                                            id: 'EBZqHbN1mpA25wfMdrpJw',
                                            cmsEnv: 'iGamingMigrationsEU',
                                            updatedAt: '2025-04-16T23:23:15.104Z',
                                            publishedAt: '2025-04-16T23:23:15.104Z',
                                            version: 62,
                                            publishedVersion: 61,
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

export const SUGGESTED_GAME_SUCCESS_RESPONSE: any = {
    took: 3,
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
                _id: '3ioWI5VNJXl7SROYQf7vtQ',
                _score: 1,
                _routing: '41KX7IaizJ5FscFd2UAOzy',
                _source: {
                    game_to_sitegame: {
                        name: 'sitegame',
                        parent: '41KX7IaizJ5FscFd2UAOzy',
                    },
                    siteGame: {
                        entryTitle: {
                            'en-GB': 'play-bp-fishin-frenzy-big-catch-92 [jackpotjoy]',
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
                            'en-GB': '',
                        },
                        minBet: {
                            'en-GB': '',
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
                        id: '3ioWI5VNJXl7SROYQf7vtQ',
                        contentType: 'siteGameV2',
                        cmsEnv: 'iGamingMigrationsEU',
                        gameId: '41KX7IaizJ5FscFd2UAOzy',
                        createdAt: '2024-08-27T03:42:05.519Z',
                        updatedAt: '2025-04-17T23:40:24.629Z',
                        version: 194,
                        publishedAt: '2025-04-17T23:40:24.629Z',
                        publishedVersion: 193,
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
                                    _id: '41KX7IaizJ5FscFd2UAOzy',
                                    _score: 1,
                                    _source: {
                                        game_to_sitegame: {
                                            name: 'game',
                                        },
                                        game: {
                                            entryTitle: {
                                                'en-GB': 'BP_FISHING_FRENZY_BIG_CATCH_V92',
                                            },
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    name: 'play-bp-fishin-frenzy-big-catch-92',
                                                    demoUrl: '/service/game/demo/play-bp-fishin-frenzy-big-catch-92',
                                                    realUrl: '/service/game/play/play-bp-fishin-frenzy-big-catch-92',
                                                    gameSkin: 'BP_FISHING_FRENZY_BIG_CATCH_V92',
                                                    gameType: {
                                                        reel: '5-3',
                                                        type: 'Slots',
                                                        brand: '',
                                                        themes: ['Other'],
                                                        features: [
                                                            'Free Spins',
                                                            'Other Wilds',
                                                            'Mystery Symbols',
                                                            'Bonus Game',
                                                            'Cash Collect',
                                                        ],
                                                        winLines: '10',
                                                        isJackpot: false,
                                                        waysToWin: 'Other',
                                                        symbolType: ['Gems', 'BarX', 'Other'],
                                                        symbolCount: '12',
                                                        winLineType: 'L2R',
                                                        isPersistence: false,
                                                        maxMultiplier: '50000',
                                                        isJackpotFixedPrize: false,
                                                        isJackpotPlatformProgressive: false,
                                                        isJackpotInGameProgressive: false,
                                                    },
                                                    gameStudio: '',
                                                    mobileName: '',
                                                    gameProvider: 'Blueprint',
                                                    mobileDemoUrl: '',
                                                    mobileRealUrl: '',
                                                    mobileGameSkin: '',
                                                    mobileOverride: false,
                                                    gameLoaderFileName: 'BP_FISHING_FRENZY_BIG_CATCH_V92',
                                                    mobileGameLoaderFileName: '',
                                                },
                                            },
                                            platform: ['Desktop', 'Phone', 'Tablet'],
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
                                                'en-GB': '#0A0566',
                                            },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/fishin-frenzy-the-big-catch-logged-out/scale-s%s/fishin-frenzy-the-big-catch-tile-r%s-w%s.jpg',
                                            },
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/fishin-frenzy-the-big-catch-logged-out/scale-s%s/fishin-frenzy-the-big-catch-tile-r%s-w%s.jpg',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/fishin-frenzy-big-catch/scale-s%s/fishin-frenzy-big-catch-tile-r%s-w%s.jpg',
                                            },
                                            title: {
                                                'en-GB': 'Fishin Frenzy Big Catch',
                                            },
                                            maxBet: {
                                                'en-GB': '£10',
                                            },
                                            minBet: {
                                                'en-GB': '10p',
                                            },
                                            infoDetails: {
                                                'en-GB':
                                                    '<dt>Paylines:</dt><dd>10</dd><dt>Top line Payout:</dt><dd>200 x total bet</dd><dt>Features:</dt><dd>Wilds, Scatters, Free Spins, The Big Catch</dd>',
                                            },
                                            howToPlayContent: {
                                                'en-GB':
                                                    '<p>1. Choose your stake.</p><p>2. Press the &ldquo;Spin&rdquo; button.</p><p>3. If the symbols align in a winning combination as per game rules, you win!</p><p>4. Return to Player &ndash; 92%</p>',
                                            },
                                            introductionContent: {
                                                'en-GB':
                                                    '<p>Go fishing for chances to land big wins with&nbsp;<strong>Fishin&rsquo; Frenzy: The Big Catch!</strong>&nbsp;</p><p>Play with up to 20 Free Spins when you land 3 or more Scatter symbols on the reels as you play.&nbsp;</p><p>Plus, land fisherman symbols on the reels for chances to win up to 5,000x your bet on any spin!&nbsp;</p><p>Reel it in!&nbsp;</p>',
                                            },
                                            nativeRequirement: {
                                                'en-GB': null,
                                            },
                                            showNetPosition: {
                                                'en-GB': true,
                                                es: false,
                                            },
                                            platformVisibility: {
                                                'en-GB': ['web', 'ios', 'android'],
                                            },
                                            contentType: 'gameV2',
                                            id: '41KX7IaizJ5FscFd2UAOzy',
                                            cmsEnv: 'iGamingMigrationsEU',
                                            updatedAt: '2025-04-16T22:58:17.420Z',
                                            publishedAt: '2025-04-16T22:58:17.420Z',
                                            version: 23,
                                            publishedVersion: 22,
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
                _id: '7HDwT1NK2DrGCHKTlqV5tA',
                _score: 1,
                _routing: '5hF2CQqHc4KoSMjlp9rI6L',
                _source: {
                    game_to_sitegame: {
                        name: 'sitegame',
                        parent: '5hF2CQqHc4KoSMjlp9rI6L',
                    },
                    siteGame: {
                        entryTitle: {
                            'en-GB': 'play-double-bubble-triple [jackpotjoy]',
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
                            'en-GB': 'EXCLUSIVE',
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
                        headlessJackpot: {
                            'en-GB': {
                                id: 2,
                                name: 'LIVE_HIDDEN_TEST_USER',
                            },
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
                        id: '7HDwT1NK2DrGCHKTlqV5tA',
                        contentType: 'siteGameV2',
                        cmsEnv: 'iGamingMigrationsEU',
                        gameId: '5hF2CQqHc4KoSMjlp9rI6L',
                        createdAt: '2024-08-27T01:18:45.158Z',
                        updatedAt: '2025-04-17T17:47:58.946Z',
                        version: 26,
                        publishedAt: '2025-04-10T13:08:12.391Z',
                        publishedVersion: 22,
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
                                    _id: '5hF2CQqHc4KoSMjlp9rI6L',
                                    _score: 1,
                                    _source: {
                                        game_to_sitegame: {
                                            name: 'game',
                                        },
                                        game: {
                                            entryTitle: {
                                                'en-GB': 'play-double-bubble-triple',
                                            },
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    name: 'play-double-bubble-triple',
                                                    demoUrl: '/service/game/demo/play-double-bubble-triple',
                                                    realUrl: '/service/game/play/play-double-bubble-triple',
                                                    gameSkin: 'play-double-bubble-triple',
                                                    gameType: {
                                                        reel: '5-3',
                                                        type: 'Slots',
                                                        brand: '',
                                                        themes: ['Fruit', 'Bubble'],
                                                        features: ['Bonus Game', 'Pick Me'],
                                                        winLines: 20,
                                                        isJackpot: true,
                                                        waysToWin: 'Other',
                                                        symbolType: ['Fruits'],
                                                        symbolCount: '1',
                                                        winLineType: 'L2R',
                                                        isPersistence: false,
                                                        maxMultiplier: '1',
                                                        isJackpotFixedPrize: false,
                                                        isJackpotInGameProgressive: false,
                                                        isJackpotPlatformProgressive: false,
                                                    },
                                                    gameStudio: '',
                                                    mobileName: '',
                                                    gameProvider: 'Anaxi',
                                                    mobileDemoUrl: '',
                                                    mobileRealUrl: '',
                                                    mobileGameSkin: '',
                                                    mobileOverride: false,
                                                    gameLoaderFileName: 'play-double-bubble-triple',
                                                    mobileGameLoaderFileName: '',
                                                },
                                            },
                                            platform: ['Phone', 'Tablet', 'Desktop'],
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
                                            progressiveBackgroundColor: {
                                                'en-GB': '#298556',
                                            },
                                            representativeColor: {
                                                'en-GB': '#40c37f',
                                                es: '#40C37F',
                                            },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/double-bubble-triple-jackpot-logged-out/scale-s%s/dbtj-loggedout-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/double-bubble-triple-jackpot-es-logged-out/scale-s%s/dbtj-es-tile-r%s-w%s.jpg',
                                            },
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/double-bubble-triple-jackpot-logged-out/scale-s%s/dbtj-loggedout-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/double-bubble-triple-jackpot-es-logged-out/scale-s%s/dbtj-es-tile-r%s-w%s.jpg',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/double-bubble-triple-jackpot/scale-s%s/dbtj-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/double-bubble-triple-jackpot-es/scale-s%s/dbtj-es-tile-r%s-w%s.jpg',
                                            },
                                            title: {
                                                'en-GB': 'Double Bubble Triple Jackpot',
                                                es: 'Duble Buble Triple Bote',
                                            },
                                            maxBet: {
                                                'en-GB': '£10',
                                                es: '20€',
                                            },
                                            minBet: {
                                                'en-GB': '1p',
                                                es: '1c',
                                            },
                                            infoDetails: {
                                                'en-GB':
                                                    '<dt>Coin Size:</dt><dd>1p - £10</dd><dt>Paylines:</dt><dd>20</dd><dt>Top line Payout:</dt><dd>20000 Coins</dd><dt>Features:</dt><dd>Wilds, Bubble Line Wins, Bubble Popper Bonus, progressive Jackpots</dd>',
                                                es: '<dt>Líneas de pago:</dt><dd>hasta 20</dd><dt>Premio máximo (1 línea):</dt><dd>valor moneda x 20.000 </dd><dt>Características:</dt><dd>Línea Buble, Fase de Bono Buble Pop y tres Botes Progresivos.</dd><dt>Tirada automática:</dt><dd>Sí</dd>',
                                            },
                                            howToPlayContent: {
                                                'en-GB':
                                                    '<p>1. Choose your stake.<br />2. Press the &ldquo;Spin&rdquo; button.<br />3. If the symbols align in a winning combination as per game rules, you win! 4. Return to Player &ndash;93.51% + 0.49%%</p>',
                                                es: '<h3>C&oacute;mo jugar a los Juegos de Slots Multil&iacute;nea</h3><p>Los Juegos de Slots multil&iacute;nea te permiten apostar en varias l&iacute;neas de premio a la vez. Para ganar en un Juego de Slots, deber&aacute;s combinar s&iacute;mbolos en las l&iacute;neas de premio. Tu apuesta equivale al valor de la moneda multiplicado por el n&uacute;mero de l&iacute;neas de juego activas. Es decir, si apuestas 20 c&eacute;ntimos por l&iacute;nea en 15 l&iacute;neas, ganar&aacute;s 3 &euro; por tirada.</p><p>En los Juegos de Slots multil&iacute;nea, las combinaciones de s&iacute;mbolos ganadoras deben aparecer por completo en una l&iacute;nea de premio. Las l&iacute;neas de premio se leen de izquierda a derecha en rodillos consecutivos, empezando por la primera columna de la izquierda. Un solo s&iacute;mbolo puede formar parte de varias combinaciones ganadoras en diferentes l&iacute;neas de premio al mismo tiempo. Las l&iacute;neas de premio son l&iacute;neas de apuesta o l&iacute;neas de juego activas que forman parte de una combinaci&oacute;n ganadora tras una tirada. Puede ocurrir que determinados s&iacute;mbolos de premio, como los Scatter o Dispersos, formen combinaciones ganadoras sin la necesidad de formar parte de una l&iacute;nea de premio. La informaci&oacute;n completa de los premios de este juego est&aacute; en su Tabla de Pagos.</p><h3>Juego Inicial</h3><p>Duble Buble Triple Bote es un Juego de Slots con 5 rodillos, 3 filas, 20 l&iacute;neas de premio, Wilds, s&iacute;mbolos de Bono, una l&iacute;nea de premio extra (L&iacute;nea Buble), una Fase de Bono Buble Pop con premios en met&aacute;lico y tres Botes Progresivos.</p><p><strong>Acciones del juego</strong></p><p><strong>Tirada</strong> &ndash; Dale al s&iacute;mbolo de Girar para empezar a jugar.</p><p><strong>Tirada Autom&aacute;tica </strong>&ndash; Dale al s&iacute;mbolo Auto para poder configurar Tiradas Autom&aacute;ticas. Podr&aacute;s escoger el n&uacute;mero de tiradas y otras opciones para cuando parar el juego autom&aacute;tico.</p><p><strong>Valor Moneda</strong> &ndash; Pulsa al s&iacute;mbolo de suma (+) para aumentarlo. Pulsa el s&iacute;mbolo de resta (-) para reducirlo. El valor moneda es importante porque se te pagar&aacute;n los premios en m&uacute;ltiplos de la moneda elegida. La Apuesta Total equivale al valor moneda multiplicado por las l&iacute;neas de premio activas.</p><p><strong>L&iacute;neas</strong> &ndash; Pulsa al s&iacute;mbolo de suma (+) para aumentarlas. Pulsa el s&iacute;mbolo de resta (-) para reducirlas. Este juego dispone de un m&aacute;ximo de 20 l&iacute;neas de premio activas.</p><p>Dale al s&iacute;mbolo de Informaci&oacute;n para acceder a los ajustes e informaci&oacute;n del juego y la Tabla de Pagos.</p><h3>S&iacute;mbolos Wild</h3><p>El s&iacute;mbolo Wild es el s&iacute;mbolo de los rodillos que aparece con la palabra Duble Buble Comod&iacute;n.</p><p>El s&iacute;mbolo Wild (Duble Buble Comod&iacute;n) sustituye a cualquier s&iacute;mbolo de los rodillos, excepto al de Bonificaci&oacute;n (Bono), de manera que aumentan tus posibilidades de conseguir m&aacute;s combinaciones de premio.</p><p>El s&iacute;mbolo Wild (Duble Buble Comod&iacute;n) puede aparecer en cualquier parte de los rodillos.</p><p>Adem&aacute;s, el s&iacute;mbolo Wild (Duble Buble Comod&iacute;n) forma parte de una combinaci&oacute;n de premio con su s&iacute;mbolo como tal.</p><h3>S&iacute;mbolos de Bono</h3><p>El s&iacute;mbolo de Bono es el s&iacute;mbolo de los rodillos que aparece con la palabra Bono.</p><p>El s&iacute;mbolo de Bono (con la palabra Bono) solo aparece en los rodillos 1, 3 y 5.</p><p>Tres s&iacute;mbolos de Bono (con la palabra Bono) en los rodillos 1, 3 y 5 respectivamente, en cualquier tirada del Juego Inicial, activan la Fase de Bono Buble Pop.</p><h3>S&iacute;mbolos con Burbuja</h3><p>Los s&iacute;mbolos de los rodillos con una burbuja se contabilizan en la l&iacute;nea de premio extra, L&iacute;nea Buble. Esta l&iacute;nea aparece en la parte inferior de los rodillos y puede conceder m&aacute;s premios, de acuerdo con la Tabla de Pagos.&nbsp;</p><h3>L&iacute;nea Buble</h3><p>Tras cualquier tirada del Juego Inicial, los s&iacute;mbolos de los rodillos con una burbuja se colocan en la l&iacute;nea Buble que aparece al pie de los rodillos. Los s&iacute;mbolos se colocan de acuerdo con el orden en el que han aparecido en los rodillos. En caso de formar una combinaci&oacute;n de premio, de acuerdo con la Tabla de Pagos, el premio se contabilizar&aacute; del siguiente modo: Multiplicador que aparece en la Tabla de Pagos para esa combinaci&oacute;n x Valor Moneda x L&iacute;neas de Premio Activas. En caso de jugar con 20 l&iacute;neas de juego activas, se concede un Multiplicador Extra de x22 y no de x20.</p><h3>Fase de Bono Buble Pop / Bote Progresivo</h3><p>Si consigues 3 s&iacute;mbolos de Bono (con la palabra Bono) en los rodillos 1, 3 y 5 respectivamente, en cualquier tirada del Juego Inicial, se iniciar&aacute; la Fase de Bono Buble Pop en la que podr&aacute;s ganar los Botes Progresivos del juego.</p><p>Ir&aacute;s a parar a una pantalla con burbujas con interrogantes. Pincha las burbujas que desees y en caso de conseguir tres s&iacute;mbolos iguales, te llevar&aacute;s ese premio. Los premios pueden ser cantidades en monedas (valores en n&uacute;meros) o uno de los Botes Progresivos: tres diamantes azules conceden el Bote Gran, tres diamantes verdes conceden el Bote Mayor y tres diamantes rojos conceden el Bote Mini.</p><p>En caso de obtener un valor en monedas, se multiplica ese premio por el valor moneda activo en el Juego Inicial.</p><p>Este juego consta de tres Botes Progresivos: Mini, Gran y Mayor.</p><p>Nos esforzamos por mostrar, en todo momento, el valor actual de los Botes Progresivos. Pero esto no siempre es posible ya que pueden producirse demoras.</p><p>En caso extremadamente raros, el valor de uno de los Botes Progresivos obtenidos podr&iacute;a ser el inicial. Esto sucede cuando un jugador se lleva el Bote justo despu&eacute;s de que otro lo haya hecho y el marcador del Bote no haya podido reiniciarse. El Bote Progresivo solo se lo puede llevar un jugador, su valor nunca ser&aacute; dividido entre varios jugadores a la vez.</p><p>Puedes ganar uno de los Botes Progresivos jugando con cualquiera de las apuestas. Sin embargo, tus probabilidades de obtener uno de los Botes Progresivos son proporcionales al valor de la Apuesta Total.</p><p>El porcentaje de tu/s apuesta/s que contribuye a los Botes Progresivos es siempre de 0,49%, independientemente del valor de tu apuesta.</p><p>Los Botes Progresivos de Duble Buble Triple Bote son compartidos con los Botes Progresivos de Duble Buble Triple Bote en Boteman&iacute;a, Canal Bingo y MONOPOLY Casino, en caso de figurar en estos operadores. Adem&aacute;s, el Bote Gran de Duble Buble Triple Bote es compartido con Duble Buble Bote y Duble Buble Megaways en Boteman&iacute;a, Canal Bingo y MONOPOLY Casino, en caso de figurar en estos operadores. Asimismo, el Bote Mayor de Duble Buble Triple Bote es compartido con el Bote de Burbujas Saltarinas en Boteman&iacute;a, Canal Bingo y MONOPOLY Casino, en caso de figurar en estos operadores. En caso de caer los Botes Progresivos en alguno de los juegos de las webs descritas con anterioridad, estos Botes se reiniciar&aacute;n a la vez de acuerdo con su valor inicial.</p><p>Una vez adjudicado el Bote Progresivo, su nuevo valor se reinicia desde los 0&euro;.</p><p>En caso de problema t&eacute;cnico o de p&eacute;rdida de conexi&oacute;n durante la ganancia del Bote Progresivo, este ser&aacute; adjudicado igualmente.</p><p>En caso de problema t&eacute;cnico o de p&eacute;rdida de conexi&oacute;n durante la partida, el dinero recaudado para el Bote Progresivo ir&aacute; destinado al Bote Progresivo siempre y cuando no lo hayas obtenido en esa tirada interrumpida.</p><p>Asimismo, en caso de retirar este juego de la web y con el Bote Progresivo con una cantidad acumulada distinta de cero, se te reintegrar&aacute; en tu cuenta la contribuci&oacute;n al Bote Progresivo que hayas realizado, desde que el importe del Bote se reinici&oacute; desde 0&euro; por &uacute;ltima vez.</p><h3>Reglas</h3><p>Puedes jugar en hasta 20 l&iacute;neas de premio.</p><p>La Apuesta Total corresponde al n&uacute;mero de l&iacute;neas de juego activas multiplicadas por el valor de la moneda.</p><p>Los premios por una l&iacute;nea de premio se conceden en l&iacute;neas de premio activas, de izquierda a derecha de los rodillos, en rodillos consecutivos, empezando por el rodillo de m&aacute;s a la izquierda y de acuerdo con la Tabla de Pagos.</p><p>Las combinaciones de premio con s&iacute;mbolos Scatter pueden aparecer en cualquier parte de los rodillos, de acuerdo con la Tabla de Pagos.</p><p>Solo se entrega el premio m&aacute;ximo en cualquiera de las l&iacute;neas de pago activas.</p><p>Se pagan a la vez las distintas combinaciones de premio, dentro de una misma tirada.</p><p>Las combinaciones ganadoras se pagan multiplicando el valor moneda por el multiplicador de apuesta que pertenece a esa combinaci&oacute;n ganadora y aparece en la Tabla de Pagos.</p><p>Durante una partida en curso, que se desconecte de Internet o de una red de telefon&iacute;a m&oacute;vil, la apuesta se mantendr&aacute; en los servidores y los resultados se ver&aacute;n reflejados en el saldo de tu cuenta.</p><p>Si la desconexi&oacute;n se produce durante una Fase de Bono (Slots) u otra fase de m&uacute;ltiples etapas, cuando vuelvas a conectarte al juego (con el mismo valor de moneda) la partida seguir&aacute; en el punto en que la dejaste. Si el juego no es de m&uacute;ltiples etapas, se completar&aacute; la partida en su ausencia y se le asignar&aacute; el premio en su cuenta, en caso de haberla. Si la Fase de Bono no se puede reanudar, esto se considerar&aacute; un mal funcionamiento, a menos que se especifique en el mismo juego.</p><p>Si se produce un error de funcionamiento, se anular&aacute;n todas las jugadas y pagos.</p><h3>Porcentaje de Retorno al Jugador (RTP)</h3><p>Porcentaje de Retorno al Jugador (RTP): 91.51% (RTP Base)</p><p>Contribuci&oacute;n al Bote: 0,49%</p><p>El porcentaje de retorno es la cantidad que pagamos a los jugadores en proporci&oacute;n con la cantidad apostada en el juego.</p><p>Por ejemplo, si obtenemos 100 &euro; en apuestas, pagaremos un promedio de 91,51 &euro; en premios. Adem&aacute;s, tendr&aacute;s la oportunidad de ganar el Bote.</p><p>En caso de consulta, duda o reclamaci&oacute;n relacionada con nuestra p&aacute;gina, por favor clica <a href="https://help.botemania.es/hc/es-es/articles/360009813300 "><u>aqu&iacute;</u></a>. Y para m&aacute;s informaci&oacute;n sobre nuestra pol&iacute;tica de reclamaciones, clica <a href=" https://www.botemania.es/terms#reclamaciones "><u>aqu&iacute;</u></a>.</p>',
                                            },
                                            introductionContent: {
                                                'en-GB':
                                                    '<p>Enjoy Wilds, Multipliers and the chance to pop 1 of 3 huge jackpots on this classic Slot!</p><p>Enjoy classic Wilds and Multipliers that are sure to land you even more bubbly wins!</p><p>With three amazing jackpots; Minor, Major and Grand, you just need to trigger the Bubble Pop game and match up the symbols for your chance to win.</p><p>Get popping!</p>',
                                                es: '<p>&iexcl;Pop! &iexcl;Pop! &iexcl;Y pop! As&iacute; suenan los Botes Progresivos en Duble Buble Triple Bote, un Juego de Slots con Wilds, Scatters, una l&iacute;nea de premio extra (L&iacute;nea Buble) y&hellip; &iexcl;Tres Botes Progresivos!</p>',
                                            },
                                            nativeRequirement: {
                                                'en-GB': null,
                                            },
                                            showNetPosition: {
                                                'en-GB': true,
                                                es: false,
                                            },
                                            platformVisibility: {
                                                'en-GB': ['web', 'ios', 'android'],
                                            },
                                            contentType: 'gameV2',
                                            id: '5hF2CQqHc4KoSMjlp9rI6L',
                                            cmsEnv: 'iGamingMigrationsEU',
                                            updatedAt: '2025-04-16T21:36:01.334Z',
                                            publishedAt: '2025-04-16T21:36:01.334Z',
                                            version: 29,
                                            publishedVersion: 28,
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
                _id: '6nEU5zeEOE7w1fRLJfZDBa',
                _score: 1,
                _routing: '6Iv65NPalevUDEHpcRlZp7',
                _source: {
                    game_to_sitegame: {
                        name: 'sitegame',
                        parent: '6Iv65NPalevUDEHpcRlZp7',
                    },
                    siteGame: {
                        entryTitle: {
                            'en-GB': 'play-bouncy-bubbles [jackpotjoy]',
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
                            'en-GB': '',
                        },
                        minBet: {
                            'en-GB': '',
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
                        id: '6nEU5zeEOE7w1fRLJfZDBa',
                        contentType: 'siteGameV2',
                        cmsEnv: 'iGamingMigrationsEU',
                        gameId: '6Iv65NPalevUDEHpcRlZp7',
                        createdAt: '2024-08-27T01:18:24.576Z',
                        updatedAt: '2025-04-17T17:47:06.249Z',
                        version: 10,
                        publishedAt: '2025-04-17T17:47:06.249Z',
                        publishedVersion: 9,
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
                                    _id: '6Iv65NPalevUDEHpcRlZp7',
                                    _score: 1,
                                    _source: {
                                        game_to_sitegame: {
                                            name: 'game',
                                        },
                                        game: {
                                            entryTitle: {
                                                'en-GB': 'play-bouncy-bubbles',
                                            },
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    name: 'play-bouncy-bubbles',
                                                    demoUrl: '/service/game/demo/play-bouncy-bubbles',
                                                    realUrl: '/service/game/play/play-bouncy-bubbles',
                                                    gameSkin: 'play-bouncy-bubbles',
                                                    gameType: {
                                                        reel: 'Other',
                                                        type: 'Slots',
                                                        brand: '',
                                                        themes: ['Bubble'],
                                                        features: [
                                                            'Multipliers (With or without wilds)',
                                                            'Bonus Game',
                                                            'Cascading Reels',
                                                        ],
                                                        winLines: 10,
                                                        isJackpot: true,
                                                        waysToWin: 'Other',
                                                        symbolType: ['Other'],
                                                        symbolCount: '1',
                                                        winLineType: 'Cluster pays',
                                                        isPersistence: false,
                                                        maxMultiplier: '1',
                                                        isJackpotFixedPrize: false,
                                                        isJackpotInGameProgressive: false,
                                                        isJackpotPlatformProgressive: false,
                                                    },
                                                    gameStudio: '',
                                                    mobileName: '',
                                                    gameProvider: 'Anaxi',
                                                    mobileDemoUrl: '',
                                                    mobileRealUrl: '',
                                                    mobileGameSkin: '',
                                                    mobileOverride: false,
                                                    gameLoaderFileName: 'play-bouncy-bubbles',
                                                    mobileGameLoaderFileName: '',
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
                                            progressiveBackgroundColor: {
                                                'en-GB': '#2ea977',
                                            },
                                            representativeColor: {
                                                'en-GB': '#206060',
                                                es: '#206060',
                                            },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/bouncy-bubbles-logged-out/scale-s%s/bouncy-bubbles-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/bouncy-bubbles-es-logged-out/scale-s%s/bouncy-bubbles-tile-r%s-w%s.jpg',
                                            },
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/bouncy-bubbles-logged-out/scale-s%s/bouncy-bubbles-tile-r%s-w%s.jpg',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/bouncy-bubbles/scale-s%s/bouncy-bubbles-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/bouncy-bubbles-es-logged-out/scale-s%s/bouncy-bubbles-tile-r%s-w%s.jpg',
                                            },
                                            title: {
                                                'en-GB': 'Bouncy Bubbles',
                                                es: 'Burbujas Saltarinas',
                                            },
                                            maxBet: {
                                                'en-GB': '£10',
                                                es: '20€',
                                            },
                                            minBet: {
                                                'en-GB': '10p',
                                                es: '10c.',
                                            },
                                            infoDetails: {
                                                'en-GB':
                                                    '<dt>Paylines:</dt><dd>Mega Match Cluster</dd><dt>Top Payout:</dt><dd>7,000 Coins</dd><dt>Features:</dt><dd>Bubble Popper Bonus</dd>',
                                                es: '<dt>Premio máximo (1 Pago en Grupo):</dt><dd>valor moneda x 7.000</dd><dt>Características:</dt><dd>Rodillos en Cascada con Multiplicadores de hasta x5, Bonificación Buble Pop con premios en metálico, Bote Progresivo y Megacoincidencias (Pagos en Grupo).</dd><dt>Tirada Automática:</dt><dd>Sí</dd>',
                                            },
                                            introductionContent: {
                                                'en-GB':
                                                    '<p>Pop a huge Progressive Jackpot on <strong>Bouncy Bubbles </strong>and enjoy bubbling Multipliers, a Mega Match feature and more<strong>!</strong></p><p>Match adjacent symbols to score big wins with Mega Match and look out for Multipliers too.</p><p>Plus, enter the Bubble Popper Bonus for a chance to win the Progressive Jackpot!</p><p>Ready to pop?</p>',
                                                es: '<p>&iexcl;Nunca explotar burbujas fue tan divertido! Disfruta de sus rodillos en cascada, enlaza cinco tiradas ganadoras y te podr&aacute;s llevar el Bote del Juego. Pop, pop, pop&hellip;</p>',
                                            },
                                            nativeRequirement: {
                                                'en-GB': null,
                                            },
                                            showNetPosition: {
                                                'en-GB': true,
                                                es: false,
                                            },
                                            platformVisibility: {
                                                'en-GB': ['web', 'ios', 'android'],
                                            },
                                            contentType: 'gameV2',
                                            id: '6Iv65NPalevUDEHpcRlZp7',
                                            cmsEnv: 'iGamingMigrationsEU',
                                            updatedAt: '2025-04-16T21:35:12.652Z',
                                            publishedAt: '2025-04-16T21:35:12.652Z',
                                            version: 27,
                                            publishedVersion: 26,
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

export const BECAUSE_YOU_PLAYED_GAME_SUCCESS_RESPONSE: any = {
    took: 3,
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
                _id: '3U267ZCKjKoZSJG5o4HazN',
                _score: 1,
                _routing: '7paW8HFuSLA4DZuptNacez',
                _source: {
                    game_to_sitegame: {
                        name: 'sitegame',
                        parent: '7paW8HFuSLA4DZuptNacez',
                    },
                    siteGame: {
                        entryTitle: {
                            'en-GB': 'play-payday [doublebubblebingo]',
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
                            'en-GB': '',
                        },
                        minBet: {
                            'en-GB': '',
                        },
                        headlessJackpot: {
                            'en-GB': {
                                id: 1,
                                name: 'JACKPOT_BLAST',
                                activeEnv: 'live-eu',
                            },
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
                        id: '3U267ZCKjKoZSJG5o4HazN',
                        contentType: 'siteGameV2',
                        cmsEnv: 'iGamingMigrationsEU',
                        gameId: '7paW8HFuSLA4DZuptNacez',
                        createdAt: '2024-08-27T03:22:22.575Z',
                        updatedAt: '2025-04-17T22:50:33.739Z',
                        version: 16,
                        publishedAt: '2025-04-17T22:50:33.739Z',
                        publishedVersion: 15,
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
                                    _id: '7paW8HFuSLA4DZuptNacez',
                                    _score: 1,
                                    _source: {
                                        game_to_sitegame: {
                                            name: 'game',
                                        },
                                        game: {
                                            entryTitle: {
                                                'en-GB': 'play-payday',
                                            },
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    name: 'play-payday',
                                                    demoUrl: '/service/game/demo/play-payday',
                                                    realUrl: '/service/game/play/play-payday',
                                                    gameSkin: 'play-payday',
                                                    gameType: {
                                                        reel: '5-3',
                                                        type: 'Slots',
                                                        brand: '',
                                                        themes: ['Bank'],
                                                        features: ['Free Spins', 'Scatter Wilds/Symbols', 'Gamble'],
                                                        winLines: 30,
                                                        isJackpot: false,
                                                        waysToWin: 'Other',
                                                        symbolType: ['Fruits'],
                                                        symbolCount: '1',
                                                        winLineType: 'L2R',
                                                        isPersistence: false,
                                                        maxMultiplier: '1',
                                                        isJackpotFixedPrize: false,
                                                        isJackpotInGameProgressive: false,
                                                        isJackpotPlatformProgressive: false,
                                                    },
                                                    gameStudio: '',
                                                    mobileName: '',
                                                    gameProvider: 'Greentube',
                                                    mobileDemoUrl: '',
                                                    mobileRealUrl: '',
                                                    mobileGameSkin: '',
                                                    mobileOverride: false,
                                                    gameLoaderFileName: 'play-payday',
                                                    mobileGameLoaderFileName: '',
                                                },
                                            },
                                            platform: ['Desktop', 'Phone', 'Tablet'],
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
                                                'en-GB': '#280770',
                                            },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/payday/scale-s%s/pay-day-tile-r%s-w%s.jpg',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/payday/scale-s%s/pay-day-tile-r%s-w%s.jpg',
                                            },
                                            title: {
                                                'en-GB': 'Payday',
                                            },
                                            maxBet: {
                                                'en-GB': '£4.50',
                                            },
                                            minBet: {
                                                'en-GB': '30p',
                                            },
                                            infoDetails: {
                                                'en-GB': `<dt>Paylines:</dt><dd>30</dd><dt>Top Line Payout:</dt><dd>4000 x total bet</dd><dt>Features:</dt><dd>Payday Prizes, Free Spins, static jackpots.</dd>`,
                                            },
                                            introductionContent: {
                                                'en-GB': `<p>Come and play <strong>Pay Day</strong> and enjoy Free Spins and a Pay Day bonus!</p><p>Land 3 Bonus symbols and enjoy up to 20 Free Spins with a x3 Multiplier.</p><p>Plus, if you land the Pay Day symbols, you’ll win the Pay Day top prize above the reels!</p><p>Celebrate, it’s Pay Day!</p>`,
                                            },
                                            nativeRequirement: {
                                                'en-GB': null,
                                            },
                                            showNetPosition: {
                                                'en-GB': true,
                                                es: false,
                                            },
                                            platformVisibility: {
                                                'en-GB': ['web', 'ios', 'android'],
                                            },
                                            contentType: 'gameV2',
                                            id: '7paW8HFuSLA4DZuptNacez',
                                            cmsEnv: 'iGamingMigrationsEU',
                                            updatedAt: '2025-04-16T21:38:41.162Z',
                                            publishedAt: '2025-04-16T21:38:41.162Z',
                                            version: 27,
                                            publishedVersion: 26,
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
                _id: '3B85c5P1HoSuYPSIpiC72D',
                _score: 1,
                _routing: '2yzWOM2zE6CcGHJWPQPyH',
                _source: {
                    game_to_sitegame: {
                        name: 'sitegame',
                        parent: '2yzWOM2zE6CcGHJWPQPyH',
                    },
                    siteGame: {
                        entryTitle: {
                            'en-GB': 'play-gmr-slingo-cascade [doublebubblebingo]',
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
                        environment: ['staging', 'production'],
                        sash: {
                            'en-GB': '',
                        },
                        chat: {
                            'en-GB': {
                                isEnabled: true,
                                controlMobileChat: false,
                            },
                        },
                        maxBet: {
                            'en-GB': '',
                        },
                        minBet: {
                            'en-GB': '',
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
                        id: '3B85c5P1HoSuYPSIpiC72D',
                        contentType: 'siteGameV2',
                        cmsEnv: 'iGamingMigrationsEU',
                        gameId: '2yzWOM2zE6CcGHJWPQPyH',
                        createdAt: '2024-08-27T03:15:09.584Z',
                        updatedAt: '2025-04-17T22:32:28.773Z',
                        version: 14,
                        publishedAt: '2025-04-17T22:32:28.773Z',
                        publishedVersion: 13,
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
                                    _id: '2yzWOM2zE6CcGHJWPQPyH',
                                    _score: 1,
                                    _source: {
                                        game_to_sitegame: {
                                            name: 'game',
                                        },
                                        game: {
                                            entryTitle: {
                                                'en-GB': 'GMR_SLINGO_CASCADE',
                                            },
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    name: 'play-gmr-slingo-cascade',
                                                    demoUrl: '/service/game/demo/play-gmr-slingo-cascade',
                                                    realUrl: '/service/game/play/play-gmr-slingo-cascade',
                                                    gameSkin: 'GMR_SLINGO_CASCADE',
                                                    gameType: {
                                                        type: 'Slingo',
                                                        themes: ['Pirate'],
                                                        features: [
                                                            'Free Spins',
                                                            'Scatter Wilds/Symbols',
                                                            'Cascading Reels',
                                                        ],
                                                        winLines: '12',
                                                    },
                                                    gameStudio: '',
                                                    mobileName: '',
                                                    gameProvider: 'Gaming Realms',
                                                    mobileDemoUrl: '',
                                                    mobileRealUrl: '',
                                                    mobileGameSkin: '',
                                                    mobileOverride: false,
                                                    gameLoaderFileName: 'GMR_SLINGO_CASCADE',
                                                    mobileGameLoaderFileName: '',
                                                },
                                            },
                                            platform: ['Desktop', 'Phone', 'Tablet'],
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
                                                'en-GB': '#12577E',
                                            },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/cascade-slingo-logged-out/scale-s%s/cascade-slingo-tile-r%s-w%s.jpg',
                                            },
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/cascade-slingo-logged-out/scale-s%s/cascade-slingo-tile-r%s-w%s.jpg',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/cascade-slingo/scale-s%s/cascade-slingo-tile-r%s-w%s.jpg',
                                            },
                                            title: {
                                                'en-GB': 'Slingo Cascade',
                                            },
                                            maxBet: {
                                                'en-GB': '£2',
                                            },
                                            minBet: {
                                                'en-GB': '10p',
                                            },
                                            infoDetails: {
                                                'en-GB': `<dt>Paylines:</dt><dd>12</dd><dt>Top Line Payout:</dt><dd>5,000 x initial bet</dd><dt>Features:</dt><dd>Free spins symbols, wild jokers and 5,000x Jackpot</dd>`,
                                            },
                                            introductionContent: {
                                                'en-GB': `<p>Welcome aboard <strong>Cascade Slingo</strong> and unlock cash prizes when you reveal lines!&nbsp;</p><p>Match the numbers you spin with those on the grid and unlock lines to win cash prizes!</p><p>Look out for the Cherubs who’ll tick off extra barrels too.</p><p>Let’s play!</p><p>&nbsp;</p>`,
                                            },
                                            nativeRequirement: {
                                                'en-GB': null,
                                            },
                                            showNetPosition: {
                                                'en-GB': true,
                                                es: false,
                                            },
                                            platformVisibility: {
                                                'en-GB': ['web', 'ios', 'android'],
                                            },
                                            contentType: 'gameV2',
                                            id: '2yzWOM2zE6CcGHJWPQPyH',
                                            cmsEnv: 'iGamingMigrationsEU',
                                            updatedAt: '2025-04-16T22:37:57.343Z',
                                            publishedAt: '2025-04-16T22:37:57.343Z',
                                            version: 20,
                                            publishedVersion: 19,
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
                _id: '7q1Ls1JyWwSsD7dSaOIkel',
                _score: 1,
                _routing: '2OWWKVgtT5qhrL2Q9f2XG9',
                _source: {
                    game_to_sitegame: {
                        name: 'sitegame',
                        parent: '2OWWKVgtT5qhrL2Q9f2XG9',
                    },
                    siteGame: {
                        entryTitle: {
                            'en-GB': 'play-eye-very-merry-christmas [doublebubblebingo]',
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
                            'en-GB': '',
                        },
                        minBet: {
                            'en-GB': '',
                        },
                        headlessJackpot: {
                            'en-GB': {
                                id: 1,
                                name: 'JACKPOT_BLAST',
                                activeEnv: 'live-eu',
                            },
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
                        id: '7q1Ls1JyWwSsD7dSaOIkel',
                        contentType: 'siteGameV2',
                        cmsEnv: 'iGamingMigrationsEU',
                        gameId: '2OWWKVgtT5qhrL2Q9f2XG9',
                        createdAt: '2024-08-27T03:10:21.432Z',
                        updatedAt: '2025-04-17T22:20:24.875Z',
                        version: 16,
                        publishedAt: '2025-04-17T22:20:24.875Z',
                        publishedVersion: 15,
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
                                    _id: '2OWWKVgtT5qhrL2Q9f2XG9',
                                    _score: 1,
                                    _source: {
                                        game_to_sitegame: {
                                            name: 'game',
                                        },
                                        game: {
                                            entryTitle: {
                                                'en-GB': 'EYE_VERY_MERRY_CHRISTMAS',
                                            },
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    name: 'play-eye-very-merry-christmas',
                                                    demoUrl: '/service/game/demo/play-eye-very-merry-christmas',
                                                    realUrl: '/service/game/play/play-eye-very-merry-christmas',
                                                    gameSkin: 'EYE_VERY_MERRY_CHRISTMAS',
                                                    gameType: {
                                                        reel: '5-3',
                                                        type: 'Slots',
                                                        brand: '',
                                                        themes: ['Christmas'],
                                                        features: ['Free Spins', 'Scatter Wilds/Symbols', 'Gamble'],
                                                        winLines: 25,
                                                        isJackpot: false,
                                                        waysToWin: 'Other',
                                                        symbolType: ['Other'],
                                                        symbolCount: '1',
                                                        winLineType: 'L2R',
                                                        isPersistence: false,
                                                        maxMultiplier: '1',
                                                        isJackpotFixedPrize: false,
                                                        isJackpotInGameProgressive: false,
                                                        isJackpotPlatformProgressive: false,
                                                    },
                                                    gameStudio: '',
                                                    mobileName: 'play-eye-very-merry-christmas-m',
                                                    gameProvider: 'Eyecon',
                                                    mobileDemoUrl: '/service/game/demo/play-eye-very-merry-christmas-m',
                                                    mobileRealUrl: '/service/game/play/play-eye-very-merry-christmas-m',
                                                    mobileGameSkin: 'EYEM_VERY_MERRY_CHRISTMAS',
                                                    mobileOverride: true,
                                                    gameLoaderFileName: 'EYE_VERY_MERRY_CHRISTMAS',
                                                    mobileGameLoaderFileName: 'EYEM_VERY_MERRY_CHRISTMAS',
                                                },
                                            },
                                            platform: ['Phone', 'Tablet', 'Desktop'],
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
                                                'en-GB': '#772a30',
                                            },
                                            infoImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/very-merry-christmas/scale-s%s/very-merry-christmas-tile-r%s-w%s.jpg',
                                            },
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/very-merry-christmas/scale-s%s/very-merry-christmas-tile-r%s-w%s.jpg',
                                            },
                                            title: {
                                                'en-GB': 'Very Merry Christmas',
                                            },
                                            maxBet: {
                                                'en-GB': '£25',
                                            },
                                            minBet: {
                                                'en-GB': '1p',
                                            },
                                            infoDetails: {
                                                'en-GB': `<dt>Coin Size:</dt><dd>1p - £1</dd><dt>Paylines:</dt><dd>25</dd><dt>Top Line Payout:</dt><dd>3000 Coins</dd><dt>Features:</dt><dd>Free spins, pick bonus and word bonus</dd>`,
                                            },
                                            introductionContent: {
                                                'en-GB': `<p>Have a Very Merry Christmas on our Slot game!</p><p>Land 3 or more Green Parcels to earn up to 10 Free Spins and 100x your bet!</p><p>Plus, with Match and Win, you’ll be awarded a cash amount, which will be multiplied by your bet!</p><p>Get your amazing Christmas started!</p>`,
                                            },
                                            nativeRequirement: {
                                                'en-GB': null,
                                            },
                                            showNetPosition: {
                                                'en-GB': true,
                                                es: false,
                                            },
                                            platformVisibility: {
                                                'en-GB': ['web', 'ios', 'android'],
                                            },
                                            contentType: 'gameV2',
                                            id: '2OWWKVgtT5qhrL2Q9f2XG9',
                                            cmsEnv: 'iGamingMigrationsEU',
                                            updatedAt: '2025-04-16T22:47:08.377Z',
                                            publishedAt: '2025-04-16T22:47:08.377Z',
                                            version: 16,
                                            publishedVersion: 15,
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
