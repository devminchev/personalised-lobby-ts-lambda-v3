export const SUGGESTED_SECTION_RESP = {
    hits: {
        hits: [
            {
                _source: {
                    games: {
                        'en-GB': [],
                    },
                    type: {
                        'en-GB': 'personal-suggested-games',
                    },
                },
            },
        ],
    },
};

export const BECAUSE_YOU_PLAYED_SECTION_RESP = {
    hits: {
        hits: [
            {
                _source: {
                    classification: { 'en-GB': 'PersonalisedSection' },
                    type: { 'en-GB': 'because-you-played-x' },
                },
            },
        ],
    },
};

export const ML_SUGGESTED_INDEX_RESP = {
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
                _source: {
                    recommendations: [
                        {
                            score: 1,
                            vendor: {
                                infinity: {
                                    contentful_game_id: '41KX7IaizJ5FscFd2UAOzy',
                                    contentful_game_title: 'Fishin Frenzy Big Catch',
                                    source_game_skin_name: 'BP_FISHING_FRENZY_BIG_CATCH_V92',
                                    contentful_game_entry_title: 'play-bp-fishin-frenzy-big-catch-92',
                                },
                            },
                            operator_game_name: 'FishinFrenzyBigCatch',
                        },
                        {
                            score: 1,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '5hF2CQqHc4KoSMjlp9rI6L',
                                    contentful_game_title: 'Double Bubble Triple Jackpot',
                                    source_game_skin_name: 'play-double-bubble-triple',
                                    contentful_game_entry_title: 'play-double-bubble-triple',
                                },
                            },
                            operator_game_name: 'DoubleBubbleTripleJackpot',
                        },
                        {
                            score: 1,
                            vendor: {
                                'roxor-rgp': {
                                    contentful_game_id: '6Iv65NPalevUDEHpcRlZp7',
                                    contentful_game_title: 'Bouncy Bubbles',
                                    source_game_skin_name: 'play-bouncy-bubbles',
                                    contentful_game_entry_title: 'play-bouncy-bubbles',
                                },
                            },
                            operator_game_name: 'BouncyBubbles',
                        },
                    ],
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
        max_score: 1,
        hits: [
            {
                _index: 'vitruvian-ai-because-you-played-x-recommendations-v1',
                _id: '24383373_monopolycasino',
                _score: 1,
                _source: {
                    because_you_played: {
                        contentful_game_id: '4YzohHyYANEK4a6Ciz2ATn',
                        contentful_game_title: 'Eye of Horus Megaways Jackpot King',
                        source_game_skin_name: 'BP_EYE_OF_HORUS_MEGAWAYS_JP',
                    },
                    recommendations: [
                        {
                            contentful_game_id: '6xqEZn7rWpBACVkeXD7HCE',
                            contentful_game_title: 'Eye Of Horus the Golden Tablet Megaways',
                            distance: 0.01415,
                            source_game_skin_name: 'BP_EYE_OF_HORUS_THE_GOLDEN_TABLET_MEGAWAYS',
                        },
                        {
                            contentful_game_id: '4nyv3gGZGG5xFg4KfB6s03',
                            contentful_game_title: 'Big Bass Amazon Xtreme™',
                            distance: 0.01677,
                            source_game_skin_name: 'PP_BIG_BASS_AMAZON_XTREME',
                        },
                        {
                            contentful_game_id: '7gXUOx88aVB8R822xKaXYd',
                            contentful_game_title: 'Stash & Grab Frenzy',
                            distance: 0.01959,
                            source_game_skin_name: 'SGD_STASH_AND_GRAB_FRENZY',
                        },
                    ],
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
                                                        isJackpotInGameProgressivey: false,
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

export const NO_PERSONALISED_NO_GAMES_RESP = [];

export const ML_BECAUSE_YOU_PLAYED_INDEX_RESP_V2 = {
    hits: {
        total: { value: 1, relation: 'eq' },
        max_score: 1,
        hits: [
            {
                _index: 'vitruvian-ai-because-you-played-x-recommendations-v1',
                _id: 'member_venture',
                _score: 1,
                _source: {
                    because_you_played: {
                        contentful_game_id: 'dummy',
                        contentful_game_title: 'Dummy',
                        source_game_skin_name: 'DUMMY',
                    },
                    recommendations: [
                        {
                            contentful_game_id: '41KX7IaizJ5FscFd2UAOzy',
                            contentful_game_title: 'Fishin Frenzy Big Catch',
                            distance: 0.01,
                            source_game_skin_name: 'BP_FISHING_FRENZY_BIG_CATCH_V92',
                        },
                        {
                            contentful_game_id: '5hF2CQqHc4KoSMjlp9rI6L',
                            contentful_game_title: 'Double Bubble Triple Jackpot',
                            distance: 0.011,
                            source_game_skin_name: 'play-double-bubble-triple',
                        },
                        {
                            contentful_game_id: '6Iv65NPalevUDEHpcRlZp7',
                            contentful_game_title: 'Bouncy Bubbles',
                            distance: 0.012,
                            source_game_skin_name: 'play-bouncy-bubbles',
                        },
                        {
                            contentful_game_id: '2M2VCmWfqpWG8hgJyxcr3M',
                            contentful_game_title: 'Piggies And the Bank Lucky Tap',
                            distance: 0.013,
                            source_game_skin_name: 'PT_PIGGIES_AND_THE_BANK_LUCKY_TAP',
                        },
                    ],
                },
            },
        ],
    },
};

export const BECAUSE_YOU_PLAYED_GAME_SUCCESS_RESPONSE_V2 = {
    took: 1,
    timed_out: false,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    hits: {
        total: { value: 4, relation: 'eq' },
        max_score: 1,
        hits: [
            {
                _index: 'games-v2',
                _id: 'sg-ff-big-catch',
                _score: 1,
                _source: {
                    game: {
                        id: '41KX7IaizJ5FscFd2UAOzy',
                        title: { 'en-GB': 'Fishin Frenzy Big Catch' },
                        representativeColor: { 'en-GB': '#0A0566' },
                        loggedOutImgUrlPattern: {
                            'en-GB':
                                '/api/content/gametiles/fishin-frenzy-the-big-catch-logged-out/scale-s%s/fishin-frenzy-the-big-catch-tile-r%s-w%s.jpg',
                        },
                        imgUrlPattern: {
                            'en-GB':
                                '/api/content/gametiles/fishin-frenzy-big-catch/scale-s%s/fishin-frenzy-big-catch-tile-r%s-w%s.jpg',
                        },
                        gamePlatformConfig: {
                            'en-GB': {
                                name: 'play-bp-fishin-frenzy-big-catch-92',
                                demoUrl: '/service/game/demo/play-bp-fishin-frenzy-big-catch-92',
                                realUrl: '/service/game/play/play-bp-fishin-frenzy-big-catch-92',
                                gameSkin: 'BP_FISHING_FRENZY_BIG_CATCH_V92',
                                mobileOverride: false,
                            },
                        },
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            hits: [
                                {
                                    _source: {
                                        siteGame: {
                                            id: 'sg-ff-big-catch',
                                            sash: { 'en-GB': '' },
                                            headlessJackpot: { 'en-GB': null },
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
                _id: 'sg-dbtj',
                _score: 1,
                _source: {
                    game: {
                        id: '5hF2CQqHc4KoSMjlp9rI6L',
                        title: { 'en-GB': 'Double Bubble Triple Jackpot' },
                        representativeColor: { 'en-GB': '#40c37f' },
                        loggedOutImgUrlPattern: {
                            'en-GB':
                                '/api/content/gametiles/double-bubble-triple-jackpot-logged-out/scale-s%s/dbtj-loggedout-tile-r%s-w%s.jpg',
                        },
                        imgUrlPattern: {
                            'en-GB':
                                '/api/content/gametiles/double-bubble-triple-jackpot/scale-s%s/dbtj-tile-r%s-w%s.jpg',
                        },
                        gamePlatformConfig: {
                            'en-GB': {
                                name: 'play-double-bubble-triple',
                                demoUrl: '/service/game/demo/play-double-bubble-triple',
                                realUrl: '/service/game/play/play-double-bubble-triple',
                                gameSkin: 'play-double-bubble-triple',
                                mobileOverride: false,
                            },
                        },
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            hits: [
                                {
                                    _source: {
                                        siteGame: {
                                            id: 'sg-dbtj',
                                            sash: { 'en-GB': 'EXCLUSIVE' },
                                            headlessJackpot: { 'en-GB': { id: 2, name: 'LIVE_HIDDEN_TEST_USER' } },
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
                _id: 'sg-bouncy-bubbles',
                _score: 1,
                _source: {
                    game: {
                        id: '6Iv65NPalevUDEHpcRlZp7',
                        title: { 'en-GB': 'Bouncy Bubbles' },
                        representativeColor: { 'en-GB': '#206060' },
                        loggedOutImgUrlPattern: {
                            'en-GB':
                                '/api/content/gametiles/bouncy-bubbles-logged-out/scale-s%s/bouncy-bubbles-tile-r%s-w%s.jpg',
                        },
                        imgUrlPattern: {
                            'en-GB': '/api/content/gametiles/bouncy-bubbles/scale-s%s/bouncy-bubbles-tile-r%s-w%s.jpg',
                        },
                        gamePlatformConfig: {
                            'en-GB': {
                                name: 'play-bouncy-bubbles',
                                demoUrl: '/service/game/demo/play-bouncy-bubbles',
                                realUrl: '/service/game/play/play-bouncy-bubbles',
                                gameSkin: 'play-bouncy-bubbles',
                                mobileOverride: false,
                            },
                        },
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            hits: [
                                {
                                    _source: {
                                        siteGame: {
                                            id: 'sg-bouncy-bubbles',
                                            sash: { 'en-GB': '' },
                                            headlessJackpot: { 'en-GB': null },
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
                _id: 'sg-piggies',
                _score: 1,
                _source: {
                    game: {
                        id: '2M2VCmWfqpWG8hgJyxcr3M',
                        title: { 'en-GB': 'Piggies And the Bank Lucky Tap' },
                        representativeColor: { 'en-GB': '#4A2866' },
                        loggedOutImgUrlPattern: {
                            'en-GB':
                                '/api/content/gametiles/piggies-and-the-bank-lucky-tap-logged-out/scale-s%s/piggies-and-the-bank-lucky-tap-logged-out-tile-r%s-w%s.jpg',
                        },
                        imgUrlPattern: {
                            'en-GB':
                                '/api/content/gametiles/piggies-and-the-bank-lucky-tap-logged-out/scale-s%s/piggies-and-the-bank-lucky-tap-logged-out-tile-r%s-w%s.jpg',
                        },
                        gamePlatformConfig: {
                            'en-GB': {
                                name: 'play-pt-piggies-and-the-bank-lucky-tap',
                                demoUrl: '/service/game/demo/play-pt-piggies-and-the-bank-lucky-tap',
                                realUrl: '/service/game/play/play-pt-piggies-and-the-bank-lucky-tap',
                                gameSkin: 'PT_PIGGIES_AND_THE_BANK_LUCKY_TAP',
                                mobileOverride: false,
                            },
                        },
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            hits: [
                                {
                                    _source: {
                                        siteGame: {
                                            id: 'sg-piggies',
                                            sash: { 'en-GB': '' },
                                            headlessJackpot: { 'en-GB': null },
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

export const RECENTLY_PLAYED_SECTION_RESP = {
    hits: {
        hits: [
            {
                _source: {
                    classification: { 'en-GB': 'PersonalisedSection' },
                    type: { 'en-GB': 'recently-played' },
                    sort: { 'en-GB': 'wagered_amount' },
                },
            },
        ],
    },
};

export const ML_RECENTLY_PLAYED_INDEX_RESP = {
    hits: {
        total: { value: 1, relation: 'eq' },
        hits: [
            {
                _id: 'member_site',
                _source: {
                    recently_played_games: [
                        {
                            game_skin: 'PT_BAA_BAA_BAA',
                            wager: 220,
                        },
                        {
                            game_skin: 'ALLOWED_SKIN',
                            wager: 180,
                        },
                        {
                            game_skin: 'ALLOWED_SKIN_2',
                            wager: 140,
                        },
                        {
                            game_skin: 'ALLOWED_SKIN_3',
                            wager: 100,
                        },
                    ],
                },
            },
        ],
    },
};

export const RECENTLY_PLAYED_GAME_SUCCESS_RESPONSE = {
    hits: {
        total: { value: 3, relation: 'eq' },
        hits: [
            {
                _id: 'default-game-id',
                _source: {
                    game: {
                        id: 'default-game-id',
                        title: { 'en-GB': 'Default Game' },
                        representativeColor: { 'en-GB': '#111111' },
                        metadataTags: [],
                        gamePlatformConfig: {
                            'en-GB': {
                                name: 'default-game',
                                demoUrl: '/demo/default',
                                realUrl: '/real/default',
                                gameSkin: 'PT_BAA_BAA_BAA',
                                mobileOverride: false,
                            },
                        },
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            hits: [
                                {
                                    _source: {
                                        siteGame: {
                                            id: 'default-sitegame-id',
                                            sash: { 'en-GB': '' },
                                            headlessJackpot: { 'en-GB': null },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                _id: 'excluded-sitegame-hit',
                _source: {
                    game: {
                        id: 'excluded-game-id',
                        title: { 'en-GB': 'Excluded Game' },
                        representativeColor: { 'en-GB': '#222222' },
                        metadataTags: [
                            {
                                sys: {
                                    id: 'exclude_recently_played',
                                },
                            },
                        ],
                        gamePlatformConfig: {
                            'en-GB': {
                                name: 'play-excluded-game',
                                demoUrl: '/demo/excluded',
                                realUrl: '/real/excluded',
                                gameSkin: 'EXCLUDED_SKIN',
                                mobileOverride: false,
                            },
                        },
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            hits: [
                                {
                                    _source: {
                                        siteGame: {
                                            id: 'excluded-sitegame-id',
                                            sash: { 'en-GB': '' },
                                            headlessJackpot: { 'en-GB': null },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                _id: 'allowed-sitegame-hit',
                _source: {
                    game: {
                        id: 'allowed-game-id',
                        title: { 'en-GB': 'Allowed Game' },
                        representativeColor: { 'en-GB': '#333333' },
                        metadataTags: [
                            {
                                sys: {
                                    id: 'some_other_tag',
                                },
                            },
                        ],
                        gamePlatformConfig: {
                            'en-GB': {
                                name: 'play-allowed-game',
                                demoUrl: '/demo/allowed',
                                realUrl: '/real/allowed',
                                gameSkin: 'ALLOWED_SKIN',
                                mobileOverride: false,
                            },
                        },
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            hits: [
                                {
                                    _source: {
                                        siteGame: {
                                            id: 'allowed-sitegame-id',
                                            sash: { 'en-GB': '' },
                                            headlessJackpot: { 'en-GB': null },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                _id: 'allowed-sitegame-hit-2',
                _source: {
                    game: {
                        id: 'allowed-game-id-2',
                        title: { 'en-GB': 'Allowed Game 2' },
                        representativeColor: { 'en-GB': '#444444' },
                        metadataTags: [],
                        gamePlatformConfig: {
                            'en-GB': {
                                name: 'play-allowed-game-2',
                                demoUrl: '/demo/allowed-2',
                                realUrl: '/real/allowed-2',
                                gameSkin: 'ALLOWED_SKIN_2',
                                mobileOverride: false,
                            },
                        },
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            hits: [
                                {
                                    _source: {
                                        siteGame: {
                                            id: 'allowed-sitegame-id-2',
                                            sash: { 'en-GB': '' },
                                            headlessJackpot: { 'en-GB': null },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                _id: 'allowed-sitegame-hit-3',
                _source: {
                    game: {
                        id: 'allowed-game-id-3',
                        title: { 'en-GB': 'Allowed Game 3' },
                        representativeColor: { 'en-GB': '#555555' },
                        metadataTags: [],
                        gamePlatformConfig: {
                            'en-GB': {
                                name: 'play-allowed-game-3',
                                demoUrl: '/demo/allowed-3',
                                realUrl: '/real/allowed-3',
                                gameSkin: 'ALLOWED_SKIN_3',
                                mobileOverride: false,
                            },
                        },
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            hits: [
                                {
                                    _source: {
                                        siteGame: {
                                            id: 'allowed-sitegame-id-3',
                                            sash: { 'en-GB': '' },
                                            headlessJackpot: { 'en-GB': null },
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
