import {
    FullApiResponse,
    GamePlatformConfig,
    LocalizedField,
    overrideGameLocaleValues,
    replaceEmptyStringsWithNull,
    tryGetValueFromLocalised,
} from 'os-client';
import { FreshGameResponse } from './interface';

export const createResponseObject = (
    gameHits: FullApiResponse[],
    userLocale: string,
    spaceLocale: string,
): FreshGameResponse[] => {
    const gamePayload = gameHits.map((item: FullApiResponse) => {
        const gameData = item.innerHit?.game;
        const rawConfig = replaceEmptyStringsWithNull(gameData?.gamePlatformConfig[spaceLocale]);
        const gamePlatformConfig: GamePlatformConfig = rawConfig as GamePlatformConfig;
        const localizedGameTitle = tryGetValueFromLocalised(userLocale, spaceLocale, gameData?.title, null);
        const launchCode = gameData?.launchCode?.[spaceLocale];
        const overrideMinBet: LocalizedField<string> = overrideGameLocaleValues<string>(
            gameData.minBet,
            gameData.minBet,
            '-',
        );
        const overrideMaxBet: LocalizedField<string> = overrideGameLocaleValues<string>(
            gameData.maxBet,
            gameData.maxBet,
            '-',
        );
        const localizedMaxBet = tryGetValueFromLocalised(userLocale, spaceLocale, overrideMaxBet, null);
        const localizedMinBet = tryGetValueFromLocalised(userLocale, spaceLocale, overrideMinBet, null);

        return {
            id: gameData?.id,
            title: localizedGameTitle,
            launchCode: launchCode,
            maxBet: localizedMaxBet || null,
            minBet: localizedMinBet || null,
            gameSkin: gamePlatformConfig?.gameSkin,
            gameStudio: gamePlatformConfig?.gameStudio,
            gameProvider: gamePlatformConfig?.gameProvider,
            subGameType: gamePlatformConfig?.subGameType,
            federalGameType: gamePlatformConfig?.federalGameType,
            mobileDemoUrl: gamePlatformConfig?.mobileDemoUrl,
            rtp: gamePlatformConfig?.rtp,
            demoUrl: gamePlatformConfig?.demoUrl,
            mobileGameLoaderFileName: gamePlatformConfig?.mobileGameLoaderFileName,
            gameLoaderFileName: gamePlatformConfig?.gameLoaderFileName || null,
            realUrl: gamePlatformConfig?.realUrl,
            mobileRealUrl: gamePlatformConfig?.mobileRealUrl,
            name: gamePlatformConfig?.name,
            mobileGameSkin: gamePlatformConfig?.mobileGameSkin,
            mobileName: gamePlatformConfig?.mobileName,
            gameType: gamePlatformConfig?.gameType,
            contentType: gameData?.contentType,
            entryTitle: gameData?.entryTitle?.[spaceLocale],
            vendor: gameData?.vendor?.[spaceLocale],
            platform: gameData?.platformVisibility?.[spaceLocale] ?? [],
        };
    });

    return gamePayload;
};
