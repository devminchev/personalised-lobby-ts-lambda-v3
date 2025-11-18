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
                _index: 'games-v2',
                _id: '7paW8HFuSLA4DZuptNacez',
                _score: 1,
                _source: {
                    recommendations: [
                        {
                            score: 1,
                            vendor: {
                                infinity: {
                                    contentful_game_id: '7paW8HFuSLA4DZuptNacez',
                                    contentful_game_title: 'Payday',
                                    source_game_skin_name: 'play-payday',
                                    contentful_game_entry_title: 'play-payday',
                                },
                            },
                            operator_game_name: 'Payday',
                        },
                        {
                            score: 1,
                            vendor: {
                                infinity: {
                                    contentful_game_id: '2yzWOM2zE6CcGHJWPQPyH',
                                    contentful_game_title: 'Slingo Cascade',
                                    source_game_skin_name: 'play-gmr-slingo-cascade',
                                    contentful_game_entry_title: 'GMR_SLINGO_CASCADE',
                                },
                            },
                            operator_game_name: 'SlingoCascade',
                        },
                        {
                            score: 1,
                            vendor: {
                                infinity: {
                                    contentful_game_id: '2OWWKVgtT5qhrL2Q9f2XG9',
                                    contentful_game_title: 'Very Merry Christmas',
                                    source_game_skin_name: 'play-eye-very-merry-christmas',
                                    contentful_game_entry_title: 'EYE_VERY_MERRY_CHRISTMAS',
                                },
                            },
                            operator_game_name: 'VeryMerryChristmas',
                        },
                    ],
                },
            },
        ],
    },
};
