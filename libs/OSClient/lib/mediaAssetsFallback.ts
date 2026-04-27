import { LocalizedField } from './sharedInterfaces/common';
import { tryGetValueFromLocalised } from './localization';

/**
 * Returns the value for the current login context; if that one is missing, returns the other if it exists.
 */
export function preferredOrFallback<T>(
    showOnlyLoggedIn: boolean,
    loggedOutValue: T | null,
    loggedInValue: T | null,
): T | null {
    const preferred = showOnlyLoggedIn ? loggedInValue : loggedOutValue;
    return preferred || loggedOutValue || loggedInValue || null;
}

/**
 * Localises the logged-in and logged-out field values, then returns preferred by context or whichever exists.
 * Pass the two localised fields (e.g. gameData?.imgUrlPattern, gameData?.loggedOutImgUrlPattern).
 */
export function getPreferredOrFallbackLocalised<T>(
    localeOverride: string,
    spaceLocale: string,
    showOnlyLoggedIn: boolean,
    loggedInField: LocalizedField<T> | null | undefined,
    loggedOutField: LocalizedField<T> | null | undefined,
): T | null {
    const loggedInVal = tryGetValueFromLocalised(localeOverride, spaceLocale, loggedInField, null);
    const loggedOutVal = tryGetValueFromLocalised(localeOverride, spaceLocale, loggedOutField, null);
    return preferredOrFallback(showOnlyLoggedIn, loggedOutVal, loggedInVal);
}
