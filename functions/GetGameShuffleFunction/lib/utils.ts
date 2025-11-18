import { createDefaultMapperPicking, FullApiResponse, gamesPayloadBySiteGame } from 'os-client';
import { IGameShuffleRecord, IGameShuffleResponse } from './interface';

const gameShuffleRecordMapper = createDefaultMapperPicking([
    'entryId',
    'gameId',
    'name',
    'title',
    'imgUrlPattern',
    'loggedOutImgUrlPattern',
    'gameSkin',
    'demoUrl',
    'realUrl',
    'representativeColor',
    'animationMedia',
    'loggedOutAnimationMedia',
    'foregroundLogoMedia',
    'loggedOutForegroundLogoMedia',
    'backgroundMedia',
    'loggedOutBackgroundMedia',
    'headlessJackpot',
] as const);

export const constructResponse = (
    firstBucketGameHits: FullApiResponse[],
    secondThirdBucketGameHits: FullApiResponse[],
    spaceLocale: string,
    userLocale: string,
    platform: string,
    showWebComponent: boolean,
): IGameShuffleResponse => {
    const contructGameRecords = (gameHits: FullApiResponse[]): IGameShuffleRecord[] => {
        const sectionGamesPayload = gamesPayloadBySiteGame(
            gameHits,
            spaceLocale,
            userLocale,
            showWebComponent,
            platform,
            gameShuffleRecordMapper,
        );

        return sectionGamesPayload;
    };

    const firstBucket = contructGameRecords(firstBucketGameHits);
    const secondThirdBuckets = contructGameRecords(secondThirdBucketGameHits);

    return {
        tileOne: firstBucket,
        tileTwo: secondThirdBuckets,
        tileThree: secondThirdBuckets,
    };
};
