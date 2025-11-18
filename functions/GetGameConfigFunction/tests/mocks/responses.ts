/* --------------------------------- COMMON RESPONSES ------------------------------------------- */
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

export const NOT_FOUND_RESPONSE: any = {
    hits: {
        hits: [],
    },
};

/* --------------------------------- GAME RESPONSES ------------------------------------------- */
export const SUCCESSFUL_GAME_RESPONSE: any = {
    hits: {
        total: {
            value: 1,
            relation: 'eq',
        },
        hits: [
            {
                _index: 'games',
                _id: '4SyNbkt0IMFdqhWb41Gki',
                _source: {
                    game_to_sitegame: {
                        name: 'game',
                    },
                    game: {
                        id: '4SyNbkt0IMFdqhWb41Gki',
                        contentType: 'gameV2',
                        entryTitle: {
                            'en-GB': 'MGSD_GOLD_BLITZ',
                        },
                        maxBet: {
                            'en-GB': '£12.50',
                        },
                        minBet: {
                            'en-GB': '20p',
                        },
                        gamePlatformConfig: {
                            'en-GB': {
                                demoUrl: '/service/game/demo/play-micro-gold-blitz',
                                gameSkin: 'MGSD_GOLD_BLITZ',
                                mobileOverride: false,
                                gameLoaderFileName: 'MGSD_GOLD_BLITZ',
                                name: 'play-micro-gold-blitz',
                                realUrl: '/service/game/play/play-micro-gold-blitz',
                            },
                        },
                        funPanelEnabled: {
                            'en-GB': false,
                        },
                        showNetPosition: {
                            'en-GB': true,
                        },
                        vendor: {
                            'en-GB': 'infinity',
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
                                    _index: 'games',
                                    _id: '208Tj1XxyJXeiSxLMbYAt2',
                                    _source: {
                                        siteGame: {
                                            chat: {
                                                'en-GB': {
                                                    controlMobileChat: true,
                                                    isEnabled: true,
                                                },
                                            },
                                            id: '208Tj1XxyJXeiSxLMbYAt2',
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

/* --------------------------------- MOBILE RESPONSES ------------------------------------------- */
export const SUCCESS_MOBILE_GAME_OVERRIDES: any = {
    hits: {
        total: {
            value: 1,
            relation: 'eq',
        },
        hits: [
            {
                _index: 'games',
                _id: '4SyNbkt0IMFdqhWb41Gki',
                _source: {
                    game_to_sitegame: {
                        name: 'game',
                    },
                    game: {
                        id: '4SyNbkt0IMFdqhWb41Gki',
                        contentType: 'gameV2',
                        entryTitle: {
                            'en-GB': 'MGSD_GOLD_BLITZ',
                        },
                        infoImgUrlPattern: {
                            'en-GB': '/api/content/gametiles/gold-blitz/scale-s%s/gold-blitz-tile-r%s-w%s.jpg',
                        },
                        infoDetails: {
                            'en-GB':
                                '<dt>Paylines:</dt><dd>4096</dd><dt>Top Line Payout:</dt><dd>x10</dd><dt>Features:</dt><dd>Cash Collect, Gold Blitz™, Free Spins, Bonus Buy, Jackpots</dd>',
                        },
                        introductionContent: {
                            'en-GB':
                                '<p>Go for golden wins with <strong>Gold Blitz</strong>, featuring the chance to choose between Free Spins and Gold Blitz Spins when you land 3 or more Bonus Scatters on any spin.&nbsp;</p><p>Choose Gold Blitz Spins and enjoy chances to land Jackpots of up to 5,000x your bet, alongside guaranteed Collect symbols for extra chances to win.&nbsp;</p>',
                        },
                        maxBet: {
                            'en-GB': '£12.50',
                        },
                        minBet: {
                            'en-GB': '20p',
                        },
                        progressiveJackpot: {
                            'en-GB': false,
                        },
                        representativeColor: {
                            'en-GB': '#F1A511',
                        },
                        title: {
                            'en-GB': 'Gold Blitz',
                        },
                        gamePlatformConfig: {
                            'en-GB': {
                                demoUrl: '/service/game/demo/play-micro-gold-blitz',
                                gameSkin: 'MGSD_GOLD_BLITZ',
                                mobileOverride: true,
                                mobileGameLoaderFileName: 'MGSM_GOLD_BLITZ',
                                gameLoaderFileName: 'MGSD_GOLD_BLITZ',
                                name: 'play-micro-gold-blitz',
                                realUrl: '/service/game/play/play-micro-gold-blitz',
                                mobileDemoUrl: '/service/game/demo/play-micro-gold-blitz-m',
                                mobileRealUrl: '/service/game/play/play-micro-gold-blitz-m',
                                mobileGameSkin: 'MGSM_GOLD_BLITZ',
                                mobileName: 'play-micro-gold-blitz-m',
                            },
                        },
                        funPanelDefaultCategory: {
                            'en-GB': '',
                        },
                        funPanelEnabled: {
                            'en-GB': false,
                        },
                        showNetPosition: {
                            'en-GB': true,
                        },
                        operatorBarDisabled: {
                            'en-GB': false,
                        },
                        rgpEnabled: {
                            'en-GB': true,
                        },
                        vendor: {
                            'en-GB': 'infinity',
                        },
                        platform: ['Phone', 'Tablet', 'Desktop'],
                        nativeRequirement: {
                            'en-GB': null,
                        },
                        environment: 'development',
                        updatedAt: '2024-07-19T13:41:31.740Z',
                    },
                },
                inner_hits: {
                    sitegame: {
                        hits: {
                            total: {
                                value: 1,
                                relation: 'eq',
                            },
                            max_score: 1.9337158,
                            hits: [
                                {
                                    _index: 'games',
                                    _id: '208Tj1XxyJXeiSxLMbYAt2',
                                    _score: 1.9337158,
                                    _routing: '4SyNbkt0IMFdqhWb41Gki',
                                    _source: {
                                        siteGame: {
                                            maxBet: {
                                                'en-GB': '',
                                            },
                                            minBet: {
                                                'en-GB': '',
                                            },
                                            chat: {
                                                'en-GB': {
                                                    controlMobileChat: true,
                                                    isEnabled: true,
                                                },
                                            },
                                            id: '208Tj1XxyJXeiSxLMbYAt2',
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
