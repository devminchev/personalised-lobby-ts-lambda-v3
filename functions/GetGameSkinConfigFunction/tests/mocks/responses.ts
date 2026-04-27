/* --------------------------------- COMMON RESPONSES ------------------------------------------- */

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
                    game: {
                        gameSkin: 'MGSD_GOLD_BLITZ',
                        gameName: 'play-micro-gold-blitz',
                        gamePlatformConfig: {
                            gameType: {
                                type: 'Slots',
                            },
                        },
                    },
                },
            },
        ],
    },
};

/* --------------------------------- DUPLICATE GAME SKIN RESPONSE ------------------------------------------- */
const GAME_HIT = SUCCESSFUL_GAME_RESPONSE.hits.hits[0];

export const DUPLICATE_GAME_SKIN_RESPONSE: any = {
    hits: {
        total: { value: 2, relation: 'eq' },
        hits: [GAME_HIT, GAME_HIT],
    },
};
