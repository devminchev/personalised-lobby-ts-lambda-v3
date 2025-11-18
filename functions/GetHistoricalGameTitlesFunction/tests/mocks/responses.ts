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
