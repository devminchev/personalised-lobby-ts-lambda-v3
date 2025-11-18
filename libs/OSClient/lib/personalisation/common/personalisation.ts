import { ErrorCode, logError } from '../../errors';
import { IClient } from '../../osClient';
import { IMlPersonalizedSection } from './mappings';
import { ISectionGame } from '../../sharedInterfaces/interfaces';
import { getGamesSiteGames, getVentureId } from '../../commonOsRequests';
import { handleBecauseYouPlayed } from '../similarityBased/becauseYouPlayed';
import { handleSuggestedGames } from '../collaborativeBased/suggestedGames';
import { LogCode, logMessage } from '../../logger';
import { createGamesQuery, orderedPayload } from '../../utils';
import { gamesPayloadBySiteGame } from '../../gamesPayloads';
import { GAMES_V2_INDEX_ALIAS } from '../../constants';
import { handleRecentlyPlayed } from '../similarityBased/recentlyPlayed';
import { OrderCriteria } from './interfaces';

type RecommendationHandler = (...args: any[]) => Promise<ISectionGame[]> | ISectionGame[];

interface HandlePersonalizedGamesParams {
    client: IClient;
    sectionType: IMlPersonalizedSection;
    memberId: string;
    siteName: string;
    spaceLocale: string;
    localeOverride: string;
    platform: string;
    handleEmptyRecommendation: RecommendationHandler;
    showWebComponent: boolean;
    orderCriteria?: OrderCriteria;
}

export const handlePersonalizedGames = async ({
    client,
    sectionType,
    memberId,
    siteName,
    spaceLocale,
    localeOverride,
    platform,
    handleEmptyRecommendation,
    orderCriteria = 'margin_rank',
    showWebComponent,
}: HandlePersonalizedGamesParams): Promise<ISectionGame[]> => {
    let ventureId;

    try {
        ventureId = await getVentureId(client, siteName, spaceLocale, platform);

        switch (sectionType) {
            case 'because-you-played':
            case 'because-you-played-x':
            case 'because-you-played-y':
            case 'because-you-played-z':
                return handleBecauseYouPlayed({
                    client,
                    ventureId,
                    sectionType,
                    memberId,
                    siteName,
                    spaceLocale,
                    localeOverride,
                    platform,
                    showWebComponent,
                });
            case 'personal-suggested-games':
                return handleSuggestedGames({
                    client,
                    ventureId,
                    sectionType,
                    memberId,
                    siteName,
                    spaceLocale,
                    localeOverride,
                    platform,
                    handleEmptyRecommendation,
                    showWebComponent,
                });
            case 'recently-played':
                return handleRecentlyPlayed({
                    client,
                    sectionType,
                    ventureId,
                    memberId,
                    siteName,
                    spaceLocale,
                    userLocale: localeOverride,
                    platform,
                    orderCriteria,
                    showWebComponent,
                });
            default:
                return [];
        }
    } catch (err) {
        logError(ErrorCode.MlIndexError, 500, { siteName, platform, memberId, sectionType, err });
        return [];
    }
};

export const handleMissingMLRecommendations = async (
    client: IClient,
    locale: string,
    spaceLocale: string,
    showWebComponent: boolean,
    platform: string,
    siteGameIdsList: string[],
    siteName: string,
    ventureId: string,
): Promise<ISectionGame[]> => {
    logMessage('log', LogCode.NoMLRecordDefaulting, { siteName, platform, siteGameIdsList });

    const sectionGamesListQuery = createGamesQuery(siteGameIdsList, spaceLocale, platform);
    const sectionGames = await getGamesSiteGames(
        client,
        sectionGamesListQuery,
        GAMES_V2_INDEX_ALIAS,
        ventureId,
        siteName,
        platform,
    );
    const sectionGamesPayload = gamesPayloadBySiteGame(sectionGames, spaceLocale, locale, showWebComponent, platform);

    return orderedPayload<ISectionGame>(sectionGamesPayload, siteGameIdsList);
};
