import {
    FullApiResponse,
    GamePlatformConfig,
    LocalizedField,
    overrideGameLocaleValues,
    replaceEmptyStringsWithNull,
    tryGetValueFromLocalised,
    resolveGameProp,
} from 'os-client';
import { FreshGameResponse } from './interface';

export const createResponseObject = (
    gameHits: FullApiResponse[],
    userLocale: string,
    spaceLocale: string,
    gameSectionsMap: Record<string, string[]>,
): FreshGameResponse[] => {
    const gamePayload = gameHits.map((item: FullApiResponse) => {
        const gameData = item.innerHit?.game;
        const rawConfig = replaceEmptyStringsWithNull(gameData?.gamePlatformConfig);
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
        const siteGameId = item.hit?.siteGame?.id;

        return {
            id: gameData?.id,
            title: localizedGameTitle,
            launchCode: launchCode,
            maxBet: localizedMaxBet || null,
            minBet: localizedMinBet || null,
            gameSkin: gameData?.gameSkin || '',
            gameStudio: gamePlatformConfig?.gameStudio,
            gameProvider: gamePlatformConfig?.gameProvider,
            gameAggregator: gamePlatformConfig?.gameAggregator,
            subGameType: gamePlatformConfig?.subGameType,
            federalGameType: gamePlatformConfig?.federalGameType,
            mobileDemoUrl: gamePlatformConfig?.mobileDemoUrl,
            rtp: gameData?.rtp,
            demoUrl: gamePlatformConfig?.demoUrl,
            mobileGameLoaderFileName: gamePlatformConfig?.mobileGameLoaderFileName,
            gameLoaderFileName: gamePlatformConfig?.gameLoaderFileName || null,
            realUrl: gamePlatformConfig?.realUrl,
            mobileRealUrl: gamePlatformConfig?.mobileRealUrl,
            name: gameData?.gameName || '',
            mobileGameSkin: gameData?.mobileGameSkin?.trim() ? gameData.mobileGameSkin : null,
            mobileName: gameData?.mobileGameName?.trim() ? gameData.mobileGameName : null,
            gameType: gamePlatformConfig?.gameType,
            contentType: gameData?.contentType,
            entryTitle: resolveGameProp(gameData?.entryTitle, spaceLocale, ''),
            vendor: resolveGameProp(gameData?.vendor, spaceLocale, ''),
            platform: resolveGameProp(gameData?.platformVisibility, spaceLocale, []),
            sections: siteGameId ? (gameSectionsMap[siteGameId] ?? []) : [],
        };
    });

    return gamePayload;
};
