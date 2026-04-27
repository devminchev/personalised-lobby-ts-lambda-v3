import { getGamesSiteGames } from './core';
import {
    IClient,
    ISectionGame,
    createGamesQuery,
    orderedPayload,
    logMessage,
    LogCode,
    gamesPayloadBySiteGame,
} from 'os-client';

//TODO: Can delete, placed a duplicate in OS client lib to make it more accesible for functions
export const handleMissingMLRecommendations = async (
    client: IClient,
    locale: string,
    spaceLocale: string,
    showWebComponent: boolean,
    platform: string,
    siteGameIdsList: string[],
    siteName: string,
): Promise<ISectionGame[]> => {
    logMessage('log', LogCode.NoMLRecordDefaulting, { siteName, platform });

    const sectionGamesListQuery = createGamesQuery(siteGameIdsList, spaceLocale, platform);
    const sectionGames = await getGamesSiteGames(client, sectionGamesListQuery, siteName, platform);
    const sectionGamesPayload = gamesPayloadBySiteGame(sectionGames, spaceLocale, locale, showWebComponent, platform);

    return orderedPayload<ISectionGame>(sectionGamesPayload, siteGameIdsList);
};
