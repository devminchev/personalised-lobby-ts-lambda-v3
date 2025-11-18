import { getGamesSiteGames } from './core';
import {
    IClient,
    ISectionGame,
    createGamesQuery,
    orderedPayload,
    logMessage,
    LogCode,
    gamesPayloadBySiteGame,
    createDefaultMapperPicking,
} from 'os-client';

interface HandleNonPersonalisedGamesParams {
    client: IClient;
    siteGameIdsList: string[];
    userLocale: string;
    spaceLocale: string;
    showWebComponent: boolean;
    platform: string;
    siteName: string;
}

const sectionGamesMapper = createDefaultMapperPicking([
    'entryId',
    'gameId',
    'name',
    'title',
    'imgUrlPattern',
    'loggedOutImgUrlPattern',
    'gameSkin',
    'demoUrl',
    'realUrl',
    'bynderDFGWeeklyImage',
    'progressiveBackgroundColor',
    'representativeColor',
    'videoUrlPattern',
    'animationMedia',
    'loggedOutAnimationMedia',
    'foregroundLogoMedia',
    'loggedOutForegroundLogoMedia',
    'backgroundMedia',
    'loggedOutBackgroundMedia',
    'tags',
    'sash',
    'webComponentData',
    'headlessJackpot',
    'liveHidden',
] as const);

// eslint-disable-next-line prettier/prettier
export const handleNonPersonalised = async ({
    client,
    siteGameIdsList,
    userLocale,
    spaceLocale,
    showWebComponent,
    platform,
    siteName,
}: HandleNonPersonalisedGamesParams): Promise<ISectionGame[]> => {
    logMessage('log', LogCode.HandleNonPersonalised, { siteName, platform });

    const sectionGamesListQuery = createGamesQuery(siteGameIdsList, spaceLocale, platform);

    const sectionGames = await getGamesSiteGames(client, sectionGamesListQuery, siteName, platform);
    const sectionGamesPayload = gamesPayloadBySiteGame(
        sectionGames,
        spaceLocale,
        userLocale,
        showWebComponent,
        platform,
        sectionGamesMapper,
    );

    return orderedPayload<ISectionGame>(sectionGamesPayload, siteGameIdsList);
};
