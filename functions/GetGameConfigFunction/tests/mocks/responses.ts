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
                        maxBet: {
                            'en-GB': '£12.50',
                        },
                        minBet: {
                            'en-GB': '20p',
                        },
                        gameName: 'play-micro-gold-blitz',
                        gameSkin: 'MGSD_GOLD_BLITZ',
                        mobileOverride: false,
                        gamePlatformConfig: {
                            demoUrl: '/service/game/demo/play-micro-gold-blitz',
                            gameLoaderFileName: 'MGSD_GOLD_BLITZ',
                            realUrl: '/service/game/play/play-micro-gold-blitz',
                        },
                        funPanelEnabled: false,
                        showNetPosition: true,
                        vendor: 'infinity',
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
                        maxBet: {
                            'en-GB': '£12.50',
                        },
                        minBet: {
                            'en-GB': '20p',
                        },
                        gameName: 'play-micro-gold-blitz',
                        gameSkin: 'MGSD_GOLD_BLITZ',
                        mobileGameName: 'play-micro-gold-blitz-m',
                        mobileGameSkin: 'MGSM_GOLD_BLITZ',
                        mobileOverride: true,
                        gamePlatformConfig: {
                            demoUrl: '/service/game/demo/play-micro-gold-blitz',
                            gameLoaderFileName: 'MGSD_GOLD_BLITZ',
                            realUrl: '/service/game/play/play-micro-gold-blitz',
                            mobileDemoUrl: '/service/game/demo/play-micro-gold-blitz-m',
                            mobileRealUrl: '/service/game/play/play-micro-gold-blitz-m',
                            mobileGameLoaderFileName: 'MGSM_GOLD_BLITZ',
                        },
                        funPanelEnabled: false,
                        showNetPosition: true,
                        vendor: 'infinity',
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
