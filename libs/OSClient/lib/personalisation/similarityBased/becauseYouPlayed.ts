import { ErrorCode, logError } from '../../errors';
import { LogCode, logMessage } from '../../logger';
import { IClient } from '../../osClient';
import { IMlPersonalizedSection } from '../common/mappings';
import { FullApiResponseByGame, ISectionGame } from '../../sharedInterfaces/interfaces';
import { orderByKey } from '../../utils';
import { getMlContentBasedGames, getMLRecommendedGamesFromGamesIndexBySkin } from '../common/personalisationOSRequests';
import { gamesPayloadByGame, createDefaultMapperPicking } from '../../gamesPayloads';

export const NUMBER_OF_WANTED_GAMES = 20;
interface IBecauseYouPlayedParams {
    client: IClient;
    sectionType: IMlPersonalizedSection;
    ventureId: string;
    memberId: string;
    siteName: string;
    spaceLocale: string;
    localeOverride: string;
    platform: string;
    showWebComponent: boolean;
}
type IBecauseYouPlayedSubset = Pick<
    IBecauseYouPlayedParams,
    'client' | 'sectionType' | 'ventureId' | 'memberId' | 'siteName' | 'spaceLocale' | 'platform'
>;

export interface IBecauseYouPlayedResult {
    gameName: string;
    mlRecommendedGameSkins: string[];
    recommendedGames: FullApiResponseByGame[];
}

const EMPTY_RECOMMENDATION: ISectionGame[] = [];

const EMPTY_CONTENT_BASED_RECOMMENDATION: IBecauseYouPlayedResult = {
    gameName: '',
    mlRecommendedGameSkins: [],
    recommendedGames: [],
};

// Picker-based mapper: select only needed props from the default payload
const becauseYouPlayedMapper = createDefaultMapperPicking([
    'entryId',
    'gameId',
    'name',
    'title',
    'imgUrlPattern',
    'gameSkin',
    'demoUrl',
    'realUrl',
    'representativeColor',
    'videoUrlPattern',
    'animationMedia',
    'foregroundLogoMedia',
    'backgroundMedia',
    'tags',
    'headlessJackpot',
    'liveHidden',
] as const);

export const becauseYouPlayedShared = async ({
    client,
    sectionType,
    ventureId,
    memberId,
    siteName,
    spaceLocale,
    platform,
}: IBecauseYouPlayedSubset): Promise<IBecauseYouPlayedResult> => {
    try {
        const [gameName, mlRecommendedGameSkins] = await getMlContentBasedGames(
            client,
            siteName,
            sectionType,
            memberId,
            platform,
        );

        if (mlRecommendedGameSkins.length === 0) {
            logMessage('warn', LogCode.NoMLRecord, { siteName, platform, sectionType, memberId });
            return EMPTY_CONTENT_BASED_RECOMMENDATION;
        }

        let recommendedGames = await getMLRecommendedGamesFromGamesIndexBySkin(
            client,
            mlRecommendedGameSkins,
            ventureId,
            spaceLocale,
            siteName,
            platform,
        );

        if (recommendedGames.length === 0) {
            logMessage('warn', LogCode.NoMlRecordGamesFound, { sectionType, memberId });
            return EMPTY_CONTENT_BASED_RECOMMENDATION;
        }

        if (recommendedGames.length < 4) {
            recommendedGames = [];
        }

        return { gameName, mlRecommendedGameSkins, recommendedGames };
    } catch (err) {
        logError(ErrorCode.MlIndexError, 500, { siteName, platform, memberId, sectionType, err });
        return EMPTY_CONTENT_BASED_RECOMMENDATION;
    }
};

export const handleBecauseYouPlayed = async ({
    client,
    sectionType,
    ventureId,
    memberId,
    siteName,
    spaceLocale,
    localeOverride,
    platform,
    showWebComponent,
}: IBecauseYouPlayedParams): Promise<ISectionGame[]> => {
    try {
        const { mlRecommendedGameSkins, recommendedGames } = await becauseYouPlayedShared({
            client,
            sectionType,
            ventureId,
            memberId,
            siteName,
            spaceLocale,
            platform,
        });

        if (mlRecommendedGameSkins.length === 0) {
            return EMPTY_RECOMMENDATION;
        }

        const sectionGamesPayload = gamesPayloadByGame(
            recommendedGames,
            spaceLocale,
            localeOverride,
            platform,
            showWebComponent,
            becauseYouPlayedMapper,
        );

        const orderedPayload = orderByKey<ISectionGame>(
            sectionGamesPayload,
            mlRecommendedGameSkins,
            (x) => x.gameSkin as string,
        ).slice(0, NUMBER_OF_WANTED_GAMES);

        return orderedPayload;
    } catch (err) {
        return EMPTY_RECOMMENDATION;
    }
};
