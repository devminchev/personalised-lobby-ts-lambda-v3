interface ILocaleMap {
    [key: string]: string;
}
const DEFAULT_EU_CONTENTFUL_SPACE_LOCALE = 'en-GB';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DEFAULT_US_CONTENTFUL_SPACE_LOCALE = 'en-US';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DEFAULT_REGION = 'EU';
const VALID_LOCALE_KEYS = ['en-GB', 'es', 'en-CA', 'en-US', 'sv', 'es-ES', 'el-GR'];
const SPANISH_LOCALE_MAP: ILocaleMap = {
    'es-ES': 'es',
};

import { LocalizedField } from './sharedInterfaces/common';

export const validateLocaleString = (key?: string): string => {
    const defaultLocale = handleSpaceLocalization();
    if (!key) {
        return defaultLocale;
    }

    const transformedLocaleKey = SPANISH_LOCALE_MAP[key] ? SPANISH_LOCALE_MAP[key] : key;

    for (const validKey of VALID_LOCALE_KEYS) {
        if (transformedLocaleKey.toLowerCase() === validKey.toLowerCase()) {
            return validKey;
        }
    }
    console.warn(`List of valid locale keys (${VALID_LOCALE_KEYS}) does not contain "${key}".`);

    return defaultLocale;
};

export const tryGetValueFromLocalised = <T>(
    locale: string,
    defaultLocale: string,
    localisedObject: LocalizedField<T> | null | undefined,
    defaultValue: T,
): T => {
    if (!localisedObject) {
        // console.warn(`Localized object is null or undefined. Returning default locale: ${defaultLocale}`);
        return defaultValue;
    }

    for (const key of Object.keys(localisedObject)) {
        if (key.toLowerCase() === locale.toLowerCase()) {
            return localisedObject[key];
        }
    }
    return localisedObject[defaultLocale];
};

export const overrideGameLocaleValues = <T>(
    siteGame: LocalizedField<T> | undefined,
    game: LocalizedField<T> | undefined,
    defaultsTo: T,
): LocalizedField<T> => {
    if (!siteGame && !game) {
        return { 'en-GB': defaultsTo };
    }

    const newGame: LocalizedField<T> = game ? { ...game } : ({} as LocalizedField<T>);

    if (siteGame) {
        const siteGameLocales = Object.keys(siteGame);
        for (const localeKey of siteGameLocales) {
            const key = localeKey as keyof LocalizedField<T>;
            if (siteGame[key]) {
                newGame[key] = siteGame[key];
            }
        }
    }

    return newGame;
};

export const handleSpaceLocalization = (): string =>
    process.env?.CONTENTFUL_SPACE_LOCALE || DEFAULT_EU_CONTENTFUL_SPACE_LOCALE;
