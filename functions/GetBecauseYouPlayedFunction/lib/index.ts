import {
    ISectionGame,
    gamesPayloadByGame,
    FullApiResponseByGame,
    orderedPayloadByGameId,
    NUMBER_OF_WANTED_GAMES,
} from 'os-client';

interface ICreateBecauseYouPlayedPayload {
    gameName: string;
    mlRecommendedGameIds: string[];
    recommendedGames: FullApiResponseByGame[];
    spaceLocale: string;
    localeOverride: string;
    platform: string;
}

export const createPayload = ({
    gameName,
    mlRecommendedGameIds,
    recommendedGames,
    spaceLocale,
    localeOverride,
    platform,
}: ICreateBecauseYouPlayedPayload) => {
    const payload = gamesPayloadByGame(recommendedGames, spaceLocale, localeOverride, platform, false);

    const ordered = orderedPayloadByGameId<ISectionGame>(payload, mlRecommendedGameIds).slice(
        0,
        NUMBER_OF_WANTED_GAMES,
    );

    return [
        {
            'because-you-played-x': gameName,
            games: ordered,
        },
    ];
};
