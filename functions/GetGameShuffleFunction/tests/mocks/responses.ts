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

export const FIRST_BUCKET_GAME_SHUFFLE_HITS: any = {
    hits: {
        total: {
            value: 700,
            relation: 'eq',
        },
        max_score: 1,
        hits: [
            {
                _index: 'ml-game-shuffle',
                _id: '36FQ7ZkBzxW6bn9L-zYP',
                _score: 1,
                _source: {
                    game_skin: 'JLY_BULLSEYE_BIG_BUCKS',
                    rtp: 92.28,
                },
            },
            {
                _index: 'ml-game-shuffle',
                _id: '-qFQ7ZkBzxW6bn9L-zYP',
                _score: 1,
                _source: {
                    game_skin: 'EYE_NOUGHTS_AND_CROSSES',
                    rtp: 90.08,
                },
            },
            {
                _index: 'ml-game-shuffle',
                _id: 'C6FQ7ZkBzxW6bn9L-zcP',
                _score: 1,
                _source: {
                    game_skin: 'EYE_LOVE_LINES',
                    rtp: 90.08,
                },
            },
        ],
    },
};

export const SECOND_THIRD_BUCKET_GAME_SHUFFLE_HITS: any = {
    hits: {
        total: {
            value: 2058,
            relation: 'eq',
        },
        max_score: 1,
        hits: [
            {
                _index: 'ml-game-shuffle',
                _id: 'uKFQ7ZkBzxW6bn9L-zYP',
                _score: 1,
                _source: {
                    game_skin: 'IGT_CLEOPATRA_MINES',
                    rtp: 94,
                },
            },
            {
                _index: 'ml-game-shuffle',
                _id: 'v6FQ7ZkBzxW6bn9L-zYP',
                _score: 1,
                _source: {
                    game_skin: 'play-dond-scratchcard',
                    rtp: 93.32,
                },
            },
            {
                _index: 'ml-game-shuffle',
                _id: 'wKFQ7ZkBzxW6bn9L-zYP',
                _score: 1,
                _source: {
                    game_skin: 'EVO_FIRST_PERSON_DEAL_OR_NO_DEAL',
                    rtp: 95.42,
                },
            },
        ],
    },
};

export const FIRST_BUCKET_GAME_SITE_GAME_RESPONSE: any = {
    hits: {
        total: {
            value: 3,
            relation: 'eq',
        },
        max_score: 1,
        hits: [
            {
                _index: 'games-v2',
                _id: '60KIRbsWI9oCvFv306POfO',
                _score: 1,
                _routing: '556sZbM22DckSZAfVH2mOt',
                _source: {
                    siteGame: {
                        gameId: '556sZbM22DckSZAfVH2mOt',
                        id: '60KIRbsWI9oCvFv306POfO',
                        entryTitle: {
                            'en-GB': 'play-jly-bullseye-big-bucks [jackpotjoy]',
                        },
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
                                    _id: '556sZbM22DckSZAfVH2mOt',
                                    _score: 1,
                                    _source: {
                                        game: {
                                            id: '556sZbM22DckSZAfVH2mOt',
                                            entryTitle: 'JLY_BULLSEYE_BIG_BUCKS',
                                            gameName: 'play-jly-bullseye-big-bucks',
                                            mobileGameName: '',
                                            gameSkin: 'JLY_BULLSEYE_BIG_BUCKS',
                                            mobileGameSkin: '',
                                            mobileOverride: false,
                                            title: {
                                                'en-GB': 'Bullseye Big Bucks',
                                            },
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/bullseye-big-bucks/scale-s%s/bullseye-big-bucks-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/tbc/scale-s%s/tbc-tile-r%s-w%s.jpg',
                                            },
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-jly-bullseye-big-bucks',
                                                realUrl: '/service/game/play/play-jly-bullseye-big-bucks',
                                                mobileDemoUrl: '',
                                                mobileRealUrl: '',
                                            },
                                            vendor: 'infinity',
                                            progressiveJackpot: false,
                                            showNetPosition: true,
                                            operatorBarDisabled: false,
                                            funPanelEnabled: false,
                                            rgpEnabled: true,
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/bullseye-big-bucks/scale-s%s/bullseye-big-bucks-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/tbc/scale-s%s/tbc-tile-r%s-w%s.jpg',
                                            },
                                            representativeColor: {
                                                'en-GB': '#532F15',
                                                es: '#000000',
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
                _index: 'games-v2',
                _id: '6o7IPlw0y46U9byr3Gd5T7',
                _score: 1,
                _routing: '4mjxf5I9oFS57LnTTBx6zs',
                _source: {
                    siteGame: {
                        id: '6o7IPlw0y46U9byr3Gd5T7',
                        entryTitle: {
                            'en-GB': 'play-eye-love-lines [jackpotjoy]',
                        },
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
                                    _id: '4mjxf5I9oFS57LnTTBx6zs',
                                    _score: 1,
                                    _source: {
                                        game: {
                                            id: '4mjxf5I9oFS57LnTTBx6zs',
                                            entryTitle: 'EYE_LOVE_LINES',
                                            gameName: 'play-eye-love-lines',
                                            mobileGameName: '',
                                            gameSkin: 'EYE_LOVE_LINES',
                                            mobileGameSkin: '',
                                            mobileOverride: false,
                                            title: {
                                                'en-GB': 'Love Lines',
                                            },
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-eye-love-lines',
                                                realUrl: '/service/game/play/play-eye-love-lines',
                                                mobileDemoUrl: '',
                                                mobileRealUrl: '',
                                            },
                                            vendor: 'infinity',
                                            progressiveJackpot: false,
                                            showNetPosition: true,
                                            operatorBarDisabled: false,
                                            funPanelEnabled: false,
                                            rgpEnabled: true,
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/love-lines/scale-s%s/love-lines-tile-r%s-w%s.jpg',
                                            },
                                            representativeColor: {
                                                'en-GB': '#84A7DD',
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
                _index: 'games-v2',
                _id: '77twDyvhN6PvRtT4DPI5FP',
                _score: 1,
                _routing: '569oIHcUwyohn91p5VHjmV',
                _source: {
                    siteGame: {
                        id: '77twDyvhN6PvRtT4DPI5FP',
                        entryTitle: {
                            'en-GB': 'play-eye-noughts-and-crosses [jackpotjoy]',
                        },
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
                                    _id: '569oIHcUwyohn91p5VHjmV',
                                    _score: 1,
                                    _source: {
                                        game: {
                                            id: '569oIHcUwyohn91p5VHjmV',
                                            entryTitle: 'EYE_NOUGHTS_AND_CROSSES',
                                            gameName: 'play-eye-noughts-and-crosses',
                                            mobileGameName: '',
                                            gameSkin: 'EYE_NOUGHTS_AND_CROSSES',
                                            mobileGameSkin: '',
                                            mobileOverride: false,
                                            title: {
                                                'en-GB': 'Noughts And Crosses',
                                            },
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-eye-noughts-and-crosses',
                                                realUrl: '/service/game/play/play-eye-noughts-and-crosses',
                                                mobileDemoUrl: '',
                                                mobileRealUrl: '',
                                            },
                                            vendor: 'infinity',
                                            progressiveJackpot: false,
                                            showNetPosition: true,
                                            operatorBarDisabled: false,
                                            funPanelEnabled: false,
                                            rgpEnabled: true,
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/noughts-and-crosses/scale-s%s/noughts-and-crosses-tile-r%s-w%s.jpg',
                                            },
                                            representativeColor: {
                                                'en-GB': '#FF750A',
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

export const SECOND_THIRD_BUCKET_GAME_SITE_GAME_RESPONSE: any = {
    hits: {
        total: {
            value: 3,
            relation: 'eq',
        },
        max_score: 1,
        hits: [
            {
                _index: 'games-v2',
                _id: '36alynPUUvN3B5u5tNiufZ',
                _score: 1,
                _routing: 'zydMZNBcWNpQ1Kk1Ss2Cg',
                _source: {
                    siteGame: {
                        id: '36alynPUUvN3B5u5tNiufZ',
                        entryTitle: {
                            'en-GB': 'play-igt-cleopatra-mines [jackpotjoy]',
                        },
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
                                    _id: 'zydMZNBcWNpQ1Kk1Ss2Cg',
                                    _score: 1,
                                    _source: {
                                        game: {
                                            id: 'zydMZNBcWNpQ1Kk1Ss2Cg',
                                            entryTitle: 'IGT_CLEOPATRA_MINES',
                                            gameName: 'play-igt-cleopatra-mines',
                                            mobileGameName: '',
                                            gameSkin: 'IGT_CLEOPATRA_MINES',
                                            mobileGameSkin: '',
                                            mobileOverride: false,
                                            title: {
                                                'en-GB': 'Cleopatra Mines',
                                            },
                                            loggedOutImgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/cleopatra-mines/scale-s%s/cleopatra-mines-tile-r%s-w%s.jpg',
                                            },
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-igt-cleopatra-mines',
                                                realUrl: '/service/game/play/play-igt-cleopatra-mines',
                                                mobileDemoUrl: '',
                                                mobileRealUrl: '',
                                            },
                                            vendor: 'infinity',
                                            progressiveJackpot: false,
                                            showNetPosition: true,
                                            operatorBarDisabled: false,
                                            funPanelEnabled: false,
                                            rgpEnabled: true,
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/cleopatra-mines/scale-s%s/cleopatra-mines-tile-r%s-w%s.jpg',
                                            },
                                            representativeColor: {
                                                'en-GB': '#655E91',
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
                _index: 'games-v2',
                _id: '1ZUZahELRqSs6xGyqHJWGH',
                _score: 1,
                _routing: '7DRU1QW6qER5OwXicGI4i1',
                _source: {
                    siteGame: {
                        id: '1ZUZahELRqSs6xGyqHJWGH',
                        entryTitle: {
                            'en-GB': 'play-ev-first-person-deal-or-no-deal [jackpotjoy]',
                        },
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
                                    _id: '7DRU1QW6qER5OwXicGI4i1',
                                    _score: 1,
                                    _source: {
                                        game: {
                                            id: '7DRU1QW6qER5OwXicGI4i1',
                                            entryTitle: 'EVO_FIRST_PERSON_DEAL_OR_NO_DEAL',
                                            gameName: 'play-ev-first-person-deal-or-no-deal',
                                            mobileGameName: '',
                                            gameSkin: 'EVO_FIRST_PERSON_DEAL_OR_NO_DEAL',
                                            mobileGameSkin: '',
                                            mobileOverride: false,
                                            title: {
                                                'en-GB': 'First Person Deal Or No Deal',
                                            },
                                            gamePlatformConfig: {
                                                demoUrl: '',
                                                realUrl: '/service/game/play/play-ev-first-person-deal-or-no-deal',
                                                mobileDemoUrl: '',
                                                mobileRealUrl: '',
                                            },
                                            vendor: 'infinity',
                                            progressiveJackpot: false,
                                            showNetPosition: true,
                                            operatorBarDisabled: false,
                                            funPanelEnabled: false,
                                            rgpEnabled: true,
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/first-person-dond-uk/scale-s%s/first-person-dond-uk-tile-r%s-w%s.jpg',
                                                es: '/api/content/gametiles/first-person-deal-or-no-deal/scale-s%s/first-person-deal-or-no-deal-tile-r%s-w%s.jpg',
                                            },
                                            representativeColor: {
                                                'en-GB': '#000000',
                                                es: 'TBC',
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
                _index: 'games-v2',
                _id: '3FnoDO2cBp8iToVSqJgsZW',
                _score: 1,
                _routing: '68GJ0diqYFXerYE7L5NYTC',
                _source: {
                    siteGame: {
                        id: '3FnoDO2cBp8iToVSqJgsZW',
                        entryTitle: {
                            'en-GB': 'play-dond-scratchcard [jackpotjoy]',
                        },
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
                                    _id: '68GJ0diqYFXerYE7L5NYTC',
                                    _score: 1,
                                    _source: {
                                        game: {
                                            id: '68GJ0diqYFXerYE7L5NYTC',
                                            entryTitle: 'play-dond-scratchcard',
                                            gameName: 'play-dond-scratchcard',
                                            mobileGameName: '',
                                            gameSkin: 'play-dond-scratchcard',
                                            mobileGameSkin: '',
                                            mobileOverride: false,
                                            title: {
                                                'en-GB': 'Deal or No Deal Scratchcard',
                                            },
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/play-dond-scratchcard',
                                                realUrl: '/service/game/play/play-dond-scratchcard',
                                                mobileDemoUrl: '',
                                                mobileRealUrl: '',
                                            },
                                            vendor: 'infinity',
                                            progressiveJackpot: false,
                                            showNetPosition: true,
                                            operatorBarDisabled: false,
                                            funPanelEnabled: false,
                                            rgpEnabled: true,
                                            imgUrlPattern: {
                                                'en-GB':
                                                    '/api/content/gametiles/deal-or-no-deal-scratchcard/scale-s%s/dond-scratchcard-tile-r%s-w%s.jpg',
                                            },
                                            representativeColor: {
                                                'en-GB': '#000000',
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

export const NOT_FOUND_RESPONSE: any = {
    hits: {
        hits: [],
    },
};

export const LAMBDA_RESPONSE = {
    tileOne: [
        {
            entryId: '60KIRbsWI9oCvFv306POfO',
            gameId: '556sZbM22DckSZAfVH2mOt',
            name: 'play-jly-bullseye-big-bucks',
            title: 'Bullseye Big Bucks',
            imgUrlPattern: '/api/content/gametiles/bullseye-big-bucks/scale-s%s/bullseye-big-bucks-tile-r%s-w%s.jpg',
            loggedOutImgUrlPattern:
                '/api/content/gametiles/bullseye-big-bucks/scale-s%s/bullseye-big-bucks-tile-r%s-w%s.jpg',
            gameSkin: 'JLY_BULLSEYE_BIG_BUCKS',
            demoUrl: '/service/game/demo/play-jly-bullseye-big-bucks',
            realUrl: '/service/game/play/play-jly-bullseye-big-bucks',
            representativeColor: '#532F15',
        },
        {
            entryId: '6o7IPlw0y46U9byr3Gd5T7',
            gameId: '4mjxf5I9oFS57LnTTBx6zs',
            name: 'play-eye-love-lines',
            title: 'Love Lines',
            imgUrlPattern: '/api/content/gametiles/love-lines/scale-s%s/love-lines-tile-r%s-w%s.jpg',
            gameSkin: 'EYE_LOVE_LINES',
            demoUrl: '/service/game/demo/play-eye-love-lines',
            realUrl: '/service/game/play/play-eye-love-lines',
            representativeColor: '#84A7DD',
        },
        {
            entryId: '77twDyvhN6PvRtT4DPI5FP',
            gameId: '569oIHcUwyohn91p5VHjmV',
            name: 'play-eye-noughts-and-crosses',
            title: 'Noughts And Crosses',
            imgUrlPattern: '/api/content/gametiles/noughts-and-crosses/scale-s%s/noughts-and-crosses-tile-r%s-w%s.jpg',
            gameSkin: 'EYE_NOUGHTS_AND_CROSSES',
            demoUrl: '/service/game/demo/play-eye-noughts-and-crosses',
            realUrl: '/service/game/play/play-eye-noughts-and-crosses',
            representativeColor: '#FF750A',
        },
    ],
    tileTwo: [
        {
            entryId: '36alynPUUvN3B5u5tNiufZ',
            gameId: 'zydMZNBcWNpQ1Kk1Ss2Cg',
            name: 'play-igt-cleopatra-mines',
            title: 'Cleopatra Mines',
            imgUrlPattern: '/api/content/gametiles/cleopatra-mines/scale-s%s/cleopatra-mines-tile-r%s-w%s.jpg',
            loggedOutImgUrlPattern: '/api/content/gametiles/cleopatra-mines/scale-s%s/cleopatra-mines-tile-r%s-w%s.jpg',
            gameSkin: 'IGT_CLEOPATRA_MINES',
            demoUrl: '/service/game/demo/play-igt-cleopatra-mines',
            realUrl: '/service/game/play/play-igt-cleopatra-mines',
            representativeColor: '#655E91',
        },
        {
            entryId: '1ZUZahELRqSs6xGyqHJWGH',
            gameId: '7DRU1QW6qER5OwXicGI4i1',
            name: 'play-ev-first-person-deal-or-no-deal',
            title: 'First Person Deal Or No Deal',
            imgUrlPattern:
                '/api/content/gametiles/first-person-dond-uk/scale-s%s/first-person-dond-uk-tile-r%s-w%s.jpg',
            gameSkin: 'EVO_FIRST_PERSON_DEAL_OR_NO_DEAL',
            demoUrl: '',
            realUrl: '/service/game/play/play-ev-first-person-deal-or-no-deal',
            representativeColor: '#000000',
        },
        {
            entryId: '3FnoDO2cBp8iToVSqJgsZW',
            gameId: '68GJ0diqYFXerYE7L5NYTC',
            name: 'play-dond-scratchcard',
            title: 'Deal or No Deal Scratchcard',
            imgUrlPattern:
                '/api/content/gametiles/deal-or-no-deal-scratchcard/scale-s%s/dond-scratchcard-tile-r%s-w%s.jpg',
            gameSkin: 'play-dond-scratchcard',
            demoUrl: '/service/game/demo/play-dond-scratchcard',
            realUrl: '/service/game/play/play-dond-scratchcard',
            representativeColor: '#000000',
        },
    ],
    tileThree: [],
};
