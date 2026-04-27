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

export const GAME_TITLES_SUCCESS_RESP: any = {
    hits: {
        hits: [
            {
                _source: {
                    game: {
                        entryTitle: {
                            'en-GB': 'play-mar-dorado-megaways',
                        },
                        gamePlatformConfig: {
                            'en-GB': {
                                gameSkin: 'play-mar-dorado-megaways',
                            },
                        },
                        title: {
                            'en-GB': 'TBC - Game not available in this region',
                            es: 'Mar Dorado Megaways',
                        },
                    },
                },
            },
        ],
    },
};

export const GAME_TITLES_LEGACY_PLATFORM_SKIN_RESP: any = {
    hits: {
        hits: [
            {
                _source: {
                    siteGame: {
                        id: 'sitegame-legacy-1',
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            hits: [
                                {
                                    _source: {
                                        game: {
                                            gamePlatformConfig: {
                                                'en-GB': {
                                                    gameSkin: 'legacy-skin',
                                                },
                                            },
                                            title: {
                                                'en-GB': 'Legacy Game Title',
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

export const GAME_TITLES_NEW_GAME_SKIN_RESP: any = {
    hits: {
        hits: [
            {
                _source: {
                    siteGame: {
                        id: 'sitegame-new-1',
                    },
                },
                inner_hits: {
                    game: {
                        hits: {
                            hits: [
                                {
                                    _source: {
                                        game: {
                                            gameSkin: 'new-skin',
                                            gamePlatformConfig: {
                                                demoUrl: '/service/game/demo/new-skin',
                                                realUrl: '/service/game/play/new-skin',
                                            },
                                            title: {
                                                'en-GB': 'New Game Title',
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
