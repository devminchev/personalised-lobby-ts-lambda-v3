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
                _index: 'vitruvian-ai-because-you-played-x-recommendations-v1',
                _source: {
                    venture_name: 'doublebubblebingo',
                    account_id: '15128492',
                    because_you_played: {
                        contentful_game_id: '21N9aKj2WFOIg8FqlP7X0a',
                        contentful_game_title: 'Secrets Of The Phoenix Jackpot',
                        source_game_skin_name: 'secrets-of-the-phoenix-jackpot',
                    },
                },
            },
        ],
    },
};

export const ML_BECAUSE_YOU_PLAYED_INDEX_RESP_UNSUPPORTED_VENDOR = {
    hits: {
        total: {
            value: 1,
            relation: 'eq',
        },
        max_score: 7.8897095,
        hits: [
            {
                _id: '15128492_botemania',
                _source: {
                    venture_name: 'botemania',
                    account_id: '15128492',
                    because_you_played: {
                        // No contentful_game_title, simulating unsupported vendor or missing data
                        source_game_skin_name: 'secrets-of-the-phoenix-jackpot',
                    },
                },
            },
        ],
    },
};

export const GAMES_INDEX_RESP = {
    hits: {
        total: {
            value: 1,
            relation: 'eq',
        },
        max_score: 1,
        hits: [
            {
                _index: 'games',
                _id: '2jnWAG1Z6LtlFwlWjieLHO',
                _score: 1,
                _source: {
                    game: {
                        id: '2jnWAG1Z6LtlFwlWjieLHO',
                        title: {
                            'en-GB': 'TBC - Game not available in this region',
                            es: 'Magic Mirror Deluxe II',
                        },
                    },
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

export const PERSONALISED_DATA_RESP_NO_GAME_INDEX = {
    sectionNames: {
        'because-you-played-x': 'Secrets Of The Phoenix Jackpot',
    },
};

export const PERSONALISED_DATA_RESP_ES = {
    sectionNames: {
        'because-you-played-x': 'Secrets Of The Phoenix Jackpot',
    },
};

export const PERSONALISED_DATA_RESP_ES_EMPTY_GAMES_INDEX = {
    sectionNames: {
        'because-you-played-x': 'Secrets Of The Phoenix Jackpot',
    },
};

export const PERSONALISED_DATA_RESP_EMPTY_GAMES_INDEX = {
    sectionNames: {
        'because-you-played-x': 'Secrets Of The Phoenix Jackpot',
    },
};

export const PERSONALISED_DATA_RESP_ES_NO_LOCALE_GUARD = {
    sectionNames: {
        'because-you-played-x': 'Secrets Of The Phoenix Jackpot',
    },
};

// Invalid responses

export const NOT_FOUND_RESPONSE: any = {
    hits: {
        hits: [],
    },
};
