import { FullApiResponse } from 'os-client';

/**
 * Minimal `FullApiResponse` mocks used by the `mapSectionGames` unit tests
 * to verify the foreground/background media fallback behaviour.
 *
 * Each variant shares the same base siteGame / game shell and only differs
 * in which of the four media fields are populated.
 */

const baseSiteGame = {
    id: 'game1',
    entryTitle: { 'en-GB': 'Game Entry Title 1' },
    environment: 'production',
    maxBet: { 'en-GB': '100' },
    minBet: { 'en-GB': '1' },
    liveHidden: { 'en-GB': false },
    sash: { 'en-GB': 'New' },
    headlessJackpot: { 'en-GB': { id: '1', name: 'Hello' } },
    contentType: '',
    gameId: 'game1a',
    updatedAt: '',
    game: [],
};

const baseGame = {
    id: '',
    contentType: '',
    updatedAt: '',
    entryTitle: '',
    gameName: 'Game Name 1',
    gameSkin: 'skin1',
    vendor: '',
    progressiveJackpot: false,
    showNetPosition: false,
    operatorBarDisabled: false,
    funPanelEnabled: false,
    rgpEnabled: false,
    gamePlatformConfig: {
        gameSkin: 'skin1',
        demoUrl: 'http://demo1.com',
        realUrl: 'http://real1.com',
        mobileOverride: false,
        name: 'Game Name 1',
        gameLoaderFileName: '',
        gameProvider: '',
        gameType: { type: 'type1' },
        rtp: 97.3,
        subGameType: 'Slots',
        federalGameType: 'Slots',
    },
    funPanelBackgroundImage: '',
    title: { 'en-GB': 'Game Title 1' },
    imgUrlPattern: { 'en-GB': 'http://image1.com' },
    loggedOutImgUrlPattern: { 'en-GB': 'http://loggedout1.com' },
    infoImgUrlPattern: { 'en-GB': '' },
    maxBet: { 'en-GB': '' },
    minBet: { 'en-GB': '' },
};

/** Minimal Bynder asset shapes – exported so tests can derive the expected sanitised values. */
export const BYNDER_FOREGROUND_LOGGED_IN = [
    {
        id: 'fg-in',
        name: 'foreground-logged-in',
        thumbnails: { transformBaseUrl: 'https://bynder/fg-in', original: 'https://bynder/fg-in-orig' },
    },
];

export const BYNDER_FOREGROUND_LOGGED_OUT = [
    {
        id: 'fg-out',
        name: 'foreground-logged-out',
        thumbnails: { transformBaseUrl: 'https://bynder/fg-out', original: 'https://bynder/fg-out-orig' },
    },
];

export const BYNDER_BACKGROUND_LOGGED_IN = [
    {
        id: 'bg-in',
        name: 'background-logged-in',
        thumbnails: { transformBaseUrl: 'https://bynder/bg-in', original: 'https://bynder/bg-in-orig' },
    },
];

export const BYNDER_BACKGROUND_LOGGED_OUT = [
    {
        id: 'bg-out',
        name: 'background-logged-out',
        thumbnails: { transformBaseUrl: 'https://bynder/bg-out', original: 'https://bynder/bg-out-orig' },
    },
];

/** Both logged-in and logged-out media populated for foreground and background. */
export const SECTION_GAME_HITS_BOTH_MEDIA: FullApiResponse[] = [
    {
        hit: { siteGame: baseSiteGame } as FullApiResponse['hit'],
        innerHit: {
            game: {
                ...baseGame,
                foregroundLogoMedia: { 'en-GB': BYNDER_FOREGROUND_LOGGED_IN },
                loggedOutForegroundLogoMedia: { 'en-GB': BYNDER_FOREGROUND_LOGGED_OUT },
                backgroundMedia: { 'en-GB': BYNDER_BACKGROUND_LOGGED_IN },
                loggedOutBackgroundMedia: { 'en-GB': BYNDER_BACKGROUND_LOGGED_OUT },
            },
        } as FullApiResponse['innerHit'],
    },
];

/** Only the logged-in side populated – exercises fallback when in logged-out context. */
export const SECTION_GAME_HITS_ONLY_LOGGED_IN_MEDIA: FullApiResponse[] = [
    {
        hit: { siteGame: baseSiteGame } as FullApiResponse['hit'],
        innerHit: {
            game: {
                ...baseGame,
                foregroundLogoMedia: { 'en-GB': BYNDER_FOREGROUND_LOGGED_IN },
                loggedOutForegroundLogoMedia: undefined,
                backgroundMedia: { 'en-GB': BYNDER_BACKGROUND_LOGGED_IN },
                loggedOutBackgroundMedia: undefined,
            },
        } as FullApiResponse['innerHit'],
    },
];

/** Only the logged-out side populated – exercises fallback when in logged-in context. */
export const SECTION_GAME_HITS_ONLY_LOGGED_OUT_MEDIA: FullApiResponse[] = [
    {
        hit: { siteGame: baseSiteGame } as FullApiResponse['hit'],
        innerHit: {
            game: {
                ...baseGame,
                foregroundLogoMedia: undefined,
                loggedOutForegroundLogoMedia: { 'en-GB': BYNDER_FOREGROUND_LOGGED_OUT },
                backgroundMedia: undefined,
                loggedOutBackgroundMedia: { 'en-GB': BYNDER_BACKGROUND_LOGGED_OUT },
            },
        } as FullApiResponse['innerHit'],
    },
];

/** Neither side populated – fields should be omitted from the output. */
export const SECTION_GAME_HITS_NO_MEDIA: FullApiResponse[] = [
    {
        hit: { siteGame: baseSiteGame } as FullApiResponse['hit'],
        innerHit: {
            game: {
                ...baseGame,
                foregroundLogoMedia: undefined,
                loggedOutForegroundLogoMedia: undefined,
                backgroundMedia: undefined,
                loggedOutBackgroundMedia: undefined,
            },
        } as FullApiResponse['innerHit'],
    },
];
