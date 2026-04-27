import { createDefaultMapperPicking, FullApiResponse, gamesPayloadBySiteGame } from 'os-client';
import { IGameShuffleRecord, IGameShuffleResponse } from './interface';

/**
 * HOF that wraps an async operation, times it, and logs the duration.
 */
export const timed = async <T>(label: string, meta: Record<string, unknown>, fn: () => Promise<T>): Promise<T> => {
    const start = Date.now();
    const result = await fn();
    console.info(label, { durationMs: Date.now() - start, ...meta });
    return result;
};

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
    const toGameRecords = (gameHits: FullApiResponse[]): IGameShuffleRecord[] =>
        gamesPayloadBySiteGame(gameHits, spaceLocale, userLocale, showWebComponent, platform, gameShuffleRecordMapper);

    const firstBucket = toGameRecords(firstBucketGameHits);
    const secondThirdBuckets = toGameRecords(secondThirdBucketGameHits);

    return {
        tileOne: firstBucket,
        tileTwo: secondThirdBuckets,
        tileThree: [],
    };
};
