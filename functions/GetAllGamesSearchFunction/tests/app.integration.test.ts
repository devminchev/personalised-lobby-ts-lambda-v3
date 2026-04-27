/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
process.env.HOST = 'http://localhost:9200';
process.env.OS_USER = 'your-username';
process.env.OS_PASS = 'your-password';

import { lambdaHandler, constructGameSearchResponse } from '../app';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import nock from 'nock';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import {
    NAV_SUCCESS_RESPONSE,
    VENTURE_SUCCESS_RESP,
    GAMES_SEARCH_SUCCESS_RESP_LOGGED_OUT,
    NOT_FOUND_RESPONSE,
    LINK_SUCCESS_RESPONSE,
    VIEW_SUCCESS_RESPONSE,
    ALL_SECTIONS_RESPONSE,
    GET_ALL_GAMES_SEARCH_SUCCESS_RESP_LOGGED_OUT,
    MOCK_GAME_HITS_ONLY_LOGGED_OUT_IMG,
    MOCK_GAME_HITS_ONLY_LOGGED_IN_IMG,
    MOCK_GAME_HITS_ONLY_LOGGED_OUT_FOREGROUND_LOGO,
    MOCK_GAME_HITS_ONLY_LOGGED_OUT_BACKGROUND,
    MOCK_GAME_HITS_ONLY_LOGGED_IN_FOREGROUND_LOGO,
    MOCK_GAME_HITS_ONLY_LOGGED_IN_BACKGROUND,
    MOCK_GAME_HITS_BOTH_FG_BG_MEDIA,
    BYNDER_FOREGROUND_FALLBACK,
    BYNDER_BACKGROUND_FALLBACK,
    BYNDER_FOREGROUND_PRIMARY,
    BYNDER_BACKGROUND_PRIMARY,
} from './mocks/responses';
import { mockApiEvent } from './mocks/gatewayMocks';
import {
    VENTURES_INDEX_ALIAS,
    NAVIGATION_INDEX_READ_ALIAS,
    VIEW_INDEX_READ_ALIAS,
    ALL_SECTIONS_SHARED_READ_ALIAS,
    IG_GAMES_V2_READ_ALIAS,
    FullApiResponse,
    parseCompressedBody,
} from 'os-client';
import { extractBynderObject } from 'os-client/lib/utils';

jest.mock('@opensearch-project/opensearch', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actualOpenSearch: any = jest.requireActual('@opensearch-project/opensearch');
    return {
        Client: actualOpenSearch.Client,
    };
});

describe('constructGameSearchResponse', () => {
    const mockGameHits: FullApiResponse[] = [
        {
            hit: {
                siteGame: {
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
                },
            },
            innerHit: {
                game: {
                    gameName: 'Game Name 1 (direct)',
                    gameSkin: 'skin1-direct',
                    mobileGameName: 'Game Name 1 (mobile)',
                    mobileGameSkin: 'skin1-mobile',
                    mobileOverride: false,
                    rtp: 96.1,
                    title: { 'en-GB': 'Game Title 1' },
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
                    imgUrlPattern: { 'en-GB': 'http://image1.com' },
                    loggedOutImgUrlPattern: { 'en-GB': 'http://loggedout1.com' },
                    entryTitle: '',
                    infoImgUrlPattern: { 'en-GB': '' },
                    maxBet: { 'en-GB': '' },
                    minBet: { 'en-GB': '' },
                    progressiveJackpot: false,
                    funPanelEnabled: false,
                    operatorBarDisabled: false,
                    rgpEnabled: false,
                    vendor: '',
                    contentType: '',
                    id: '',
                    updatedAt: '',
                    showNetPosition: false,
                    funPanelBackgroundImage: '',
                },
            },
        },
    ];

    const mockGameIdToNavName = new Map<string, Set<string>>([['game1', new Set(['Navigation 1'])]]);

    const spaceLocale = 'en-GB';
    const localeOverride = 'en-GB';
    const platform = 'web';

    it('should construct a valid game search response for logged-in users', () => {
        const showOnlyLoggedIn = true;

        const result = constructGameSearchResponse(
            mockGameHits,
            spaceLocale,
            localeOverride,
            mockGameIdToNavName,
            platform,
            showOnlyLoggedIn,
        );

        expect(result).toEqual([
            {
                entryId: 'game1',
                gameId: 'game1a',
                name: 'Game Name 1 (direct)',
                title: 'Game Title 1',
                gameSkin: 'skin1-direct',
                demoUrl: 'http://demo1.com',
                realUrl: 'http://real1.com',
                imgUrlPattern: 'http://image1.com',
                sash: 'New',
                headlessJackpot: { id: '1', name: 'Hello' },
                navigation: ['Navigation 1'],
            },
        ]);
    });

    it('should construct a valid game search response for logged-out users', () => {
        const showOnlyLoggedIn = false;

        const result = constructGameSearchResponse(
            mockGameHits,
            spaceLocale,
            localeOverride,
            mockGameIdToNavName,
            platform,
            showOnlyLoggedIn,
        );

        expect(result).toEqual([
            {
                entryId: 'game1',
                gameId: 'game1a',
                name: 'Game Name 1 (direct)',
                title: 'Game Title 1',
                gameSkin: 'skin1-direct',
                demoUrl: 'http://demo1.com',
                realUrl: 'http://real1.com',
                imgUrlPattern: 'http://loggedout1.com',
                sash: 'New',
                headlessJackpot: { id: '1', name: 'Hello' },
                navigation: ['Navigation 1'],
            },
        ]);
    });

    describe('image and media fallback (preferred or whichever exists)', () => {
        it('should use logged-out image when logged-in context but imgUrlPattern is missing', () => {
            const result = constructGameSearchResponse(
                MOCK_GAME_HITS_ONLY_LOGGED_OUT_IMG,
                spaceLocale,
                localeOverride,
                mockGameIdToNavName,
                platform,
                true,
            );

            expect(result[0]?.imgUrlPattern).toBe('http://only-logged-out.com');
        });

        it('should use logged-in image when logged-out context but loggedOutImgUrlPattern is missing', () => {
            const result = constructGameSearchResponse(
                MOCK_GAME_HITS_ONLY_LOGGED_IN_IMG,
                spaceLocale,
                localeOverride,
                mockGameIdToNavName,
                platform,
                false,
            );

            expect(result[0]?.imgUrlPattern).toBe('http://only-logged-in.com');
        });

        it('should use logged-out foreground logo media when logged-in context but foregroundLogoMedia is missing', () => {
            const result = constructGameSearchResponse(
                MOCK_GAME_HITS_ONLY_LOGGED_OUT_FOREGROUND_LOGO,
                spaceLocale,
                localeOverride,
                mockGameIdToNavName,
                platform,
                true,
            );

            expect(result[0]).toMatchObject({
                foregroundLogoMedia: extractBynderObject(BYNDER_FOREGROUND_FALLBACK),
            });
        });

        it('should use logged-out background media when logged-in context but backgroundMedia is missing', () => {
            const result = constructGameSearchResponse(
                MOCK_GAME_HITS_ONLY_LOGGED_OUT_BACKGROUND,
                spaceLocale,
                localeOverride,
                mockGameIdToNavName,
                platform,
                true,
            );

            expect(result[0]).toMatchObject({
                backgroundMedia: extractBynderObject(BYNDER_BACKGROUND_FALLBACK),
            });
        });

        it('should use logged-in foreground logo media when logged-out context but loggedOutForegroundLogoMedia is missing', () => {
            const result = constructGameSearchResponse(
                MOCK_GAME_HITS_ONLY_LOGGED_IN_FOREGROUND_LOGO,
                spaceLocale,
                localeOverride,
                mockGameIdToNavName,
                platform,
                false,
            );

            expect(result[0]).toMatchObject({
                foregroundLogoMedia: extractBynderObject(BYNDER_FOREGROUND_PRIMARY),
            });
        });

        it('should use logged-in background media when logged-out context but loggedOutBackgroundMedia is missing', () => {
            const result = constructGameSearchResponse(
                MOCK_GAME_HITS_ONLY_LOGGED_IN_BACKGROUND,
                spaceLocale,
                localeOverride,
                mockGameIdToNavName,
                platform,
                false,
            );

            expect(result[0]).toMatchObject({
                backgroundMedia: extractBynderObject(BYNDER_BACKGROUND_PRIMARY),
            });
        });

        it('should prefer logged-in fg/bg media when both sides are present and showOnlyLoggedIn is true, and logged-out when false', () => {
            const loggedIn = constructGameSearchResponse(
                MOCK_GAME_HITS_BOTH_FG_BG_MEDIA,
                spaceLocale,
                localeOverride,
                mockGameIdToNavName,
                platform,
                true,
            );
            const loggedOut = constructGameSearchResponse(
                MOCK_GAME_HITS_BOTH_FG_BG_MEDIA,
                spaceLocale,
                localeOverride,
                mockGameIdToNavName,
                platform,
                false,
            );

            expect(loggedIn[0]).toMatchObject({
                foregroundLogoMedia: extractBynderObject(BYNDER_FOREGROUND_PRIMARY),
                backgroundMedia: extractBynderObject(BYNDER_BACKGROUND_PRIMARY),
            });
            expect(loggedOut[0]).toMatchObject({
                foregroundLogoMedia: extractBynderObject(BYNDER_FOREGROUND_FALLBACK),
                backgroundMedia: extractBynderObject(BYNDER_BACKGROUND_FALLBACK),
            });
        });
    });

    it('should use mobile game name for non-web platforms when mobile override is enabled', () => {
        const showOnlyLoggedIn = true;
        const mobileOverrideGameHits = JSON.parse(JSON.stringify(mockGameHits));
        mobileOverrideGameHits[0].innerHit.game.mobileOverride = true;

        const result = constructGameSearchResponse(
            mobileOverrideGameHits,
            spaceLocale,
            localeOverride,
            mockGameIdToNavName,
            'ios',
            showOnlyLoggedIn,
        );

        expect(result[0]?.name).toBe('Game Name 1 (mobile)');
    });

    it('should handle missing fields gracefully', () => {
        const incompleteGameHits = [
            {
                hit: {
                    siteGame: {
                        id: 'game2',
                        gameId: 'game2',
                    },
                },
                innerHit: {
                    game: {},
                },
            },
        ] as FullApiResponse[];

        const result = constructGameSearchResponse(
            incompleteGameHits,
            spaceLocale,
            localeOverride,
            mockGameIdToNavName,
            platform,
            true,
        );

        expect(result).toEqual([
            {
                entryId: 'game2',
                gameId: 'game2',
                name: '',
                navigation: [],
                demoUrl: undefined,
                realUrl: undefined,
            },
        ]);
    });
});

describe('Integration Test for Lambda Handler', () => {
    beforeEach(() => {
        process.env.EXECUTION_ENVIRONMENT = 'staging';
        nock.cleanAll();
    });

    it('should return gzip compressed response by default', async () => {
        const siteName = 'jackpotjoy';
        const platform = 'web';

        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, VENTURE_SUCCESS_RESP);

        nock('http://localhost:9200')
            .post(`/${NAVIGATION_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, NAV_SUCCESS_RESPONSE);

        nock('http://localhost:9200')
            .post(`/${NAVIGATION_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, LINK_SUCCESS_RESPONSE);

        nock('http://localhost:9200')
            .post(`/${VIEW_INDEX_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, VIEW_SUCCESS_RESPONSE);

        nock('http://localhost:9200')
            .post(`/${ALL_SECTIONS_SHARED_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, ALL_SECTIONS_RESPONSE);

        nock('http://localhost:9200')
            .post(`/${IG_GAMES_V2_READ_ALIAS}/_search?request_cache=true`)
            .reply(200, GAMES_SEARCH_SUCCESS_RESP_LOGGED_OUT);

        const event: APIGatewayProxyEvent = mockApiEvent(siteName, platform);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.isBase64Encoded).toBe(true);
        expect(result.headers?.['Content-Encoding']).toBe('gzip');

        const body = parseCompressedBody(result);
        expect(body).toEqual(GET_ALL_GAMES_SEARCH_SUCCESS_RESP_LOGGED_OUT);
    });

    it('should return (204) for invalid site name', async () => {
        const siteName = 'invalidsite';
        const platform = 'web';

        // Mock the getVentures OpenSearch response with no hits
        nock('http://localhost:9200')
            .post(`/${VENTURES_INDEX_ALIAS}/_search?request_cache=true`)
            .reply(200, NOT_FOUND_RESPONSE);

        const event: APIGatewayProxyEvent = mockApiEvent(siteName, platform);

        const result = await lambdaHandler(event);
        expect(result.statusCode).toBe(204);
        expect(result.headers?.['Cache-Control']).toBe('no-cache');
    });
});
