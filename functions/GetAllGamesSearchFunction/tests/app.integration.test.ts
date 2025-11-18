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
} from './mocks/responses';
import { mockApiEvent } from './mocks/gatewayMocks';
import {
    VENTURES_INDEX_ALIAS,
    NAVIGATION_INDEX_READ_ALIAS,
    VIEW_INDEX_READ_ALIAS,
    ALL_SECTIONS_SHARED_READ_ALIAS,
    GAMES_INDEX_V2_ALIAS,
    FullApiResponse,
    ErrorCode,
    getErrorMessage,
} from 'os-client';

jest.mock('@opensearch-project/opensearch', () => {
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
                    title: { 'en-GB': 'Game Title 1' },
                    gamePlatformConfig: {
                        'en-GB': {
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
                    },
                    imgUrlPattern: { 'en-GB': 'http://image1.com' },
                    loggedOutImgUrlPattern: { 'en-GB': 'http://loggedout1.com' },
                    entryTitle: { 'en-GB': '' },
                    infoImgUrlPattern: { 'en-GB': '' },
                    maxBet: { 'en-GB': '' },
                    minBet: { 'en-GB': '' },
                    progressiveJackpot: { 'en-GB': false },
                    funPanelEnabled: { 'en-GB': false },
                    operatorBarDisabled: { 'en-GB': false },
                    rgpEnabled: { 'en-GB': false },
                    vendor: { 'en-GB': '' },
                    platform: [],
                    contentType: '',
                    id: '',
                    updatedAt: '',
                    showNetPosition: { 'en-GB': false },
                    funPanelBackgroundImage: { 'en-GB': '' },
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
                name: 'Game Name 1',
                title: 'Game Title 1',
                gameSkin: 'skin1',
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
                name: 'Game Name 1',
                title: 'Game Title 1',
                gameSkin: 'skin1',
                demoUrl: 'http://demo1.com',
                realUrl: 'http://real1.com',
                imgUrlPattern: 'http://loggedout1.com',
                sash: 'New',
                headlessJackpot: { id: '1', name: 'Hello' },
                navigation: ['Navigation 1'],
            },
        ]);
    });

    it.skip('should handle missing fields gracefully', () => {
        const incompleteGameHits: any = [
            {
                hit: {
                    siteGame: {
                        id: 'game2',
                    },
                },
                innerHit: {
                    game: {},
                },
            },
        ];

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
                navigation: [],
            },
        ]);
    });
});

describe('Integration Test for Lambda Handler', () => {
    beforeEach(() => {
        process.env.EXECUTION_ENVIRONMENT = 'staging';
        nock.cleanAll();
    });

    it('should return all searchable games visible for logged out users,  for a valid sitename, and platform, when not logged in', async () => {
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
            .post(`/${GAMES_INDEX_V2_ALIAS}/_search?request_cache=true`)
            .reply(200, GAMES_SEARCH_SUCCESS_RESP_LOGGED_OUT);

        const event: APIGatewayProxyEvent = mockApiEvent(siteName, platform);
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify(GET_ALL_GAMES_SEARCH_SUCCESS_RESP_LOGGED_OUT));
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
