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

export const CATEGORIES_SUCCESS_RESP: any = {
    hits: {
        hits: [
            {
                _source: {
                    categories: {
                        'en-GB': [
                            {
                                sys: {
                                    id: 'category-id-1',
                                },
                            },
                            {
                                sys: {
                                    id: 'category-id-2',
                                },
                            },
                        ],
                    },
                },
            },
        ],
    },
};

export const CATEGORIES_DATA_SUCCESS_RESP: any = {
    hits: {
        hits: [
            {
                _source: {
                    nameId: {
                        'en-GB': 'homepage',
                    },
                },
            },
            {
                _source: {
                    nameId: {
                        'en-GB': 'featured',
                    },
                },
            },
        ],
    },
};

export const LAYOUTS_SUCCESS_RESP: any = {
    hits: {
        hits: [
            {
                _source: {
                    sections: {
                        'en-GB': [
                            {
                                sys: {
                                    id: 'section-id-1',
                                },
                            },
                            {
                                sys: {
                                    id: 'section-id-2',
                                },
                            },
                        ],
                    },
                },
            },
        ],
    },
};

export const SECTIONS_SUCCESS_RESP: any = {
    hits: {
        hits: [
            {
                _source: {
                    id: 'section-id-1',
                    games: {
                        'en-GB': [
                            {
                                sys: {
                                    id: 'game-id-1',
                                },
                            },
                            {
                                sys: {
                                    id: 'game-id-2',
                                },
                            },
                        ],
                    },
                },
            },
        ],
    },
};

export const GAMES_SUCCESS_RESP = {
    hits: {
        total: 2,
        hits: [{ _source: { gameId: 'game1', name: 'Game 1' } }, { _source: { gameId: 'game2', name: 'Game 2' } }],
    },
};
