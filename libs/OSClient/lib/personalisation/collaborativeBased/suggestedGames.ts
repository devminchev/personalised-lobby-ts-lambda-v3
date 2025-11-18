import { ErrorCode, logError } from '../../errors';
import { LogCode, logMessage } from '../../logger';
import { IClient } from '../../osClient';
import { IMlPersonalizedSection } from '../common/mappings';
import { ISectionGame } from '../../sharedInterfaces/interfaces';
import { orderedPayloadByGameId } from '../../utils';
import { getMlSuggestedGamesGames, getMLRecommendedGamesFromGamesIndex } from '../common/personalisationOSRequests';
import { createDefaultMapperPicking, gamesPayloadByGame } from '../../gamesPayloads';

type RecommendationHandler = (...args: any[]) => Promise<ISectionGame[]> | ISectionGame[];

interface HandlePersonalizedGamesParams {
    client: IClient;
    sectionType: IMlPersonalizedSection;
    ventureId: string;
    memberId: string;
    siteName: string;
    spaceLocale: string;
    localeOverride: string;
    platform: string;
    handleEmptyRecommendation: RecommendationHandler;
    showWebComponent: boolean;
}

const suggestForYouMapper = createDefaultMapperPicking([
    'entryId',
    'gameId',
    'name',
    'title',
    'imgUrlPattern',
    'gameSkin',
    'demoUrl',
    'realUrl',
    'isProgressiveJackpot',
    'progressiveBackgroundColor',
    'representativeColor',
    'videoUrlPattern',
    'animationMedia',
    'foregroundLogoMedia',
    'backgroundMedia',
    'tags',
    'webComponentData',
    'headlessJackpot',
    'liveHidden',
] as const);

export const handleSuggestedGames = async ({
    client,
    sectionType,
    ventureId,
    memberId,
    siteName,
    spaceLocale,
    localeOverride,
    platform,
    handleEmptyRecommendation,
    showWebComponent,
}: HandlePersonalizedGamesParams): Promise<ISectionGame[]> => {
    try {
        const mlRecommendedGameIds = await getMlSuggestedGamesGames(client, siteName, sectionType, memberId, platform);

        if (mlRecommendedGameIds.length === 0) {
            logMessage('warn', LogCode.NoMLRecord, { siteName, platform, sectionType, memberId });
            return await handleEmptyRecommendation(ventureId);
        }

        // Step 2
        const recommendedGames = await getMLRecommendedGamesFromGamesIndex(
            client,
            mlRecommendedGameIds,
            ventureId,
            spaceLocale,
            siteName,
            platform,
        );
        if (recommendedGames.length === 0) {
            logMessage('warn', LogCode.NoMlRecordGamesFound, { siteName, platform, sectionType, memberId });
            return await handleEmptyRecommendation(ventureId);
        }

        // Step 3
        const sectionGamesPayload = gamesPayloadByGame(
            recommendedGames,
            spaceLocale,
            localeOverride,
            platform,
            showWebComponent,
            suggestForYouMapper,
        );

        return orderedPayloadByGameId<ISectionGame>(sectionGamesPayload, mlRecommendedGameIds);
    } catch (err) {
        logError(ErrorCode.MlIndexError, 500, { siteName, platform, memberId, sectionType, err });
        return await handleEmptyRecommendation(ventureId);
    }
};
