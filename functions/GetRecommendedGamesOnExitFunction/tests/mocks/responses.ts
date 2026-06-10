export const SIG_CONS_ML_RESPONSE = {
    hits: {
        hits: [
            {
                _source: {
                    contentful_game_id: 'game-with',
                    similar_games: [
                        {
                            contentful_game_id: 'game-with',
                            contentful_game_title: 'With',
                            distance: 0.1,
                            source_game_skin_name: 'skin-with',
                        },
                        {
                            contentful_game_id: 'game-without',
                            contentful_game_title: 'Without',
                            distance: 0.2,
                            source_game_skin_name: 'skin-without',
                        },
                    ],
                },
            },
        ],
    },
};

export const SIG_CONS_VENTURE_RESPONSE = { hits: { hits: [{ _source: { id: 'venture1' } }] } };

const buildHit = (id: string, sigCons?: Record<string, string>) => ({
    _source: { siteGame: { gameId: id, id: `${id}-site` } },
    inner_hits: {
        game: {
            hits: {
                hits: [
                    {
                        _source: {
                            game: {
                                gameName: 'name',
                                gameSkin: id,
                                title: { 'en-GB': id },
                                gamePlatformConfig: { name: 'name', realUrl: '', demoUrl: '' },
                                ...(sigCons ? { sigCons } : {}),
                            },
                        },
                    },
                ],
            },
        },
    },
});

export const SIG_CONS_GAMES_RESPONSE = {
    hits: { hits: [buildHit('game-with', { 'en-GB': 'sig-cons-en' }), buildHit('game-without')] },
};
