import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { ErrorCode, GAME_V2_TYPE, LocalizedField, getErrorMessage, logError } from 'os-client';
import { GamePayloadFields, IncomingGamePayload, IncomingPayload, modifyEventGamePayload } from '../lib/gamesPayload';
import { WebhookFlowError } from '../lib/errorResolution';

// Localized string fields that are forwarded as-is from input to output when truthy
// and dropped on null/undefined/empty-string. The `satisfies` clause anchors each name
// to both interfaces, so renaming or removing a field on either side breaks the build.
const PASS_THROUGH_LOCALIZED_STRING_FIELDS = [
    'title',
    'howToPlayContent',
    'introductionContent',
    'infoDetails',
    'loggedOutAnimationMedia',
    'sigCons',
    'animationMedia',
    'dfgWeeklyImgUrlPattern',
    'videoUrlPattern',
    'imgUrlPattern',
    'infoImgUrlPattern',
    'loggedOutImgUrlPattern',
    'representativeColor',
] as const satisfies ReadonlyArray<keyof IncomingGamePayload & keyof GamePayloadFields>;

jest.mock('os-client', () => {
    const actual = jest.requireActual<typeof import('os-client')>('os-client');
    return {
        ...actual,
        logError: jest.fn(),
    };
});

const logErrorMock = jest.mocked(logError);

const makeIncomingPayload = (): IncomingPayload =>
    ({
        game_to_sitegame: { name: 'game' },
        game: {
            id: 'game-1',
            cmsEnv: 'staging',
            contentType: GAME_V2_TYPE,
            updatedAt: '2026-01-10T10:00:00.000Z',
            createdAt: '2026-01-09T10:00:00.000Z',
            cmsChangeVersion: 42,
            gamePlatformConfig: {
                'en-GB': {
                    name: 'Mega Spin',
                    gameSkin: 'mega-skin',
                    mobileName: 'Mega Spin Mobile',
                    mobileGameSkin: 'mega-mobile-skin',
                    mobileOverride: true,
                    rtp: 96.4,
                },
            },
            entryTitle: { 'en-GB': 'Mega Spin Entry' },
            platformVisibility: { 'en-GB': ['ios', 'android', 'web'] },
            title: { 'en-GB': 'Mega Spin Title' },
            metadataTags: [{ sys: { id: 'tag-1' } }, { sys: { id: 'tag-2' } }],
            tags: ['featured'],
            vendor: { 'en-GB': 'VendorX' },
            operatorBarDisabled: { 'en-GB': false },
            nativeRequirement: { 'en-GB': { os: 'ios' } },
            webComponentData: { 'en-GB': { mode: 'compact' } },
            funPanelEnabled: { 'en-GB': true },
            rgpEnabled: { 'en-GB': true },
            progressiveJackpot: { 'en-GB': false },
            showNetPosition: { 'en-GB': true },
            showGameName: { 'en-GB': true },
        },
    }) as unknown as IncomingPayload;

const captureWebhookFlowError = (fn: () => void): WebhookFlowError => {
    try {
        fn();
        throw new Error('Expected WebhookFlowError to be thrown');
    } catch (error) {
        expect(error).toBeInstanceOf(WebhookFlowError);
        return error as WebhookFlowError;
    }
};

describe('modifyEventGamePayload', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('maps incoming webhook payload into the expected OpenSearch payload shape', () => {
        const result = modifyEventGamePayload(makeIncomingPayload(), 'en-GB');

        expect(result.id).toBe('game-1');
        expect(result.contentType).toBe(GAME_V2_TYPE);
        expect(result.entryTitle).toBe('Mega Spin Entry');
        expect(result.gameName).toBe('Mega Spin');
        expect(result.gameSkin).toBe('mega-skin');
        expect(result.mobileGameName).toBe('Mega Spin Mobile');
        expect(result.mobileGameSkin).toBe('mega-mobile-skin');
        expect(result.metadataTags).toEqual(['tag-1', 'tag-2']);
        expect(result.showGameName).toBe(true);
        expect(result.platformVisibility).toEqual(['ios', 'android', 'web']);
        expect(result.gamePlatformConfig).not.toHaveProperty('name');
        expect(result.gamePlatformConfig).not.toHaveProperty('mobileName');
    });

    it('omits webComponentData when missing in the incoming payload', () => {
        const incomingPayload = makeIncomingPayload();
        (incomingPayload.game as unknown as Record<string, unknown>).webComponentData = undefined;

        const result = modifyEventGamePayload(incomingPayload, 'en-GB');
        expect(result).not.toHaveProperty('webComponentData');
    });

    it('defaults metadataTags to an empty array when missing', () => {
        const incomingPayload = makeIncomingPayload();
        (incomingPayload.game as unknown as Record<string, unknown>).metadataTags = undefined;

        const result = modifyEventGamePayload(incomingPayload, 'en-GB');
        expect(result.metadataTags).toEqual([]);
    });

    it('omits showGameName when missing in localized payload', () => {
        const incomingPayload = makeIncomingPayload();
        (incomingPayload.game as unknown as Record<string, unknown>).showGameName = undefined;

        const result = modifyEventGamePayload(incomingPayload, 'en-GB');
        expect(result).not.toHaveProperty('showGameName');
    });

    it('forwards every pass-through localized string field when populated on the input', () => {
        const incomingPayload = makeIncomingPayload();
        const game = incomingPayload.game as unknown as Record<string, unknown>;
        const expected: Partial<Record<(typeof PASS_THROUGH_LOCALIZED_STRING_FIELDS)[number], LocalizedField<string>>> =
            {};
        for (const field of PASS_THROUGH_LOCALIZED_STRING_FIELDS) {
            const value: LocalizedField<string> = { 'en-GB': `${field}-value` };
            game[field] = value;
            expected[field] = value;
        }

        const result = modifyEventGamePayload(incomingPayload, 'en-GB');

        expect(result).toMatchObject(expected);
    });

    it.each([
        ['undefined', undefined],
        ['empty string', ''],
        ['null', null],
    ])('omits every pass-through localized string field when value is %s', (_label, value) => {
        const incomingPayload = makeIncomingPayload();
        const game = incomingPayload.game as unknown as Record<string, unknown>;
        for (const field of PASS_THROUGH_LOCALIZED_STRING_FIELDS) {
            game[field] = value;
        }

        const result = modifyEventGamePayload(incomingPayload, 'en-GB');

        for (const field of PASS_THROUGH_LOCALIZED_STRING_FIELDS) {
            expect(result).not.toHaveProperty(field);
        }
    });

    it('sanitizes localized Bynder media fields for all locales and array items', () => {
        const incomingPayload = makeIncomingPayload();
        const rawBynderAsset = {
            id: 'asset-id-to-drop',
            name: 'Promo asset',
            type: 'image',
            width: 1280,
            height: 720,
            orientation: 'landscape',
            original: 'https://cdn.example.com/original.jpg',
            src: 'https://cdn.example.com/src.jpg',
            tags: ['hero'],
            thumbnails: {
                transformBaseUrl: 'https://cdn.example.com/transform',
                original: 'https://cdn.example.com/thumb.jpg',
                large: 'https://cdn.example.com/large.jpg',
            },
        };
        const sparseAsset = {
            id: 'drop-all-non-whitelisted',
            src: 'https://cdn.example.com/only-src.jpg',
            thumbnails: {
                tiny: 'https://cdn.example.com/tiny.jpg',
            },
        };
        const frAsset = {
            name: 'French promo',
            type: 'image',
            original: 'https://cdn.example.com/fr-original.jpg',
        };

        const bynderMediaValue = {
            'en-GB': [rawBynderAsset, sparseAsset],
            'fr-FR': [frAsset],
        };
        (incomingPayload.game as unknown as Record<string, unknown>).loggedOutForegroundLogoMedia = bynderMediaValue;
        (incomingPayload.game as unknown as Record<string, unknown>).foregroundLogoMedia = bynderMediaValue;
        (incomingPayload.game as unknown as Record<string, unknown>).backgroundMedia = bynderMediaValue;
        (incomingPayload.game as unknown as Record<string, unknown>).loggedOutBackgroundMedia = bynderMediaValue;
        (incomingPayload.game as unknown as Record<string, unknown>).bynderDFGWeeklyImage = bynderMediaValue;

        const result = modifyEventGamePayload(incomingPayload, 'en-GB');
        const expectedSanitizedAsset = {
            name: 'Promo asset',
            type: 'image',
            width: 1280,
            height: 720,
            orientation: 'landscape',
            original: 'https://cdn.example.com/original.jpg',
            tags: ['hero'],
            thumbnails: {
                transformBaseUrl: 'https://cdn.example.com/transform',
                original: 'https://cdn.example.com/thumb.jpg',
            },
        };
        const expectedFrAsset = {
            name: 'French promo',
            type: 'image',
            original: 'https://cdn.example.com/fr-original.jpg',
        };
        const expectedLocalizedMedia = {
            'en-GB': [expectedSanitizedAsset],
            'fr-FR': [expectedFrAsset],
        };

        expect(result.loggedOutForegroundLogoMedia).toEqual(expectedLocalizedMedia);
        expect(result.foregroundLogoMedia).toEqual(expectedLocalizedMedia);
        expect(result.backgroundMedia).toEqual(expectedLocalizedMedia);
        expect(result.loggedOutBackgroundMedia).toEqual(expectedLocalizedMedia);
        expect(result.bynderDFGWeeklyImage).toEqual(expectedLocalizedMedia);
    });

    it('drops Bynder media fields when sanitization yields no assets', () => {
        const incomingPayload = makeIncomingPayload();
        const emptyBynderMediaValue = { 'en-GB': [] };
        (incomingPayload.game as unknown as Record<string, unknown>).loggedOutForegroundLogoMedia =
            emptyBynderMediaValue;
        (incomingPayload.game as unknown as Record<string, unknown>).foregroundLogoMedia = emptyBynderMediaValue;
        (incomingPayload.game as unknown as Record<string, unknown>).backgroundMedia = emptyBynderMediaValue;
        (incomingPayload.game as unknown as Record<string, unknown>).loggedOutBackgroundMedia = emptyBynderMediaValue;
        (incomingPayload.game as unknown as Record<string, unknown>).bynderDFGWeeklyImage = emptyBynderMediaValue;

        const result = modifyEventGamePayload(incomingPayload, 'en-GB');

        expect(result).not.toHaveProperty('loggedOutForegroundLogoMedia');
        expect(result).not.toHaveProperty('foregroundLogoMedia');
        expect(result).not.toHaveProperty('backgroundMedia');
        expect(result).not.toHaveProperty('loggedOutBackgroundMedia');
        expect(result).not.toHaveProperty('bynderDFGWeeklyImage');
    });

    it('drops locale entries that sanitize to only empty objects', () => {
        const incomingPayload = makeIncomingPayload();
        const bynderMediaValue = {
            'en-GB': [{ src: 'https://cdn.example.com/no-allowed-fields.jpg' }],
            'fr-FR': [{ name: 'French promo', original: 'https://cdn.example.com/fr-original.jpg' }],
        };
        (incomingPayload.game as unknown as Record<string, unknown>).foregroundLogoMedia = bynderMediaValue;

        const result = modifyEventGamePayload(incomingPayload, 'en-GB');

        expect(result.foregroundLogoMedia).toEqual({
            'fr-FR': [{ name: 'French promo', original: 'https://cdn.example.com/fr-original.jpg' }],
        });
        expect(result.foregroundLogoMedia).not.toHaveProperty('en-GB');
    });

    it('drops Bynder media field when every locale sanitizes to empty objects', () => {
        const incomingPayload = makeIncomingPayload();
        const bynderMediaValue = {
            'en-GB': [{ src: 'https://cdn.example.com/no-allowed-fields-en.jpg' }],
            'fr-FR': [{ id: 'drop-me-too' }],
        };
        (incomingPayload.game as unknown as Record<string, unknown>).backgroundMedia = bynderMediaValue;

        const result = modifyEventGamePayload(incomingPayload, 'en-GB');

        expect(result).not.toHaveProperty('backgroundMedia');
    });

    it('throws skip exception when gamePlatformConfig is missing', () => {
        const incomingPayload = makeIncomingPayload();
        (incomingPayload.game as unknown as Record<string, unknown>).gamePlatformConfig = undefined;

        const error = captureWebhookFlowError(() => modifyEventGamePayload(incomingPayload, 'en-GB'));
        expect(error.message).toBe(
            'Skipping OpenSearch indexing for entry game-1 due to incomplete platform config: gameName and gameSkin are required!',
        );
        expect(error.reason).toBe('IncompletePlatformConfig');
        expect(error.statusCode).toBe(202);
        expect(error.errorCode).toBe(ErrorCode.InvalidWebhookPayload);
    });

    it('throws skip exception when localized game platform data is incomplete', () => {
        const incomingPayload = makeIncomingPayload();
        ((incomingPayload.game.gamePlatformConfig['en-GB'] as unknown as Record<string, unknown>) || {}).gameSkin =
            undefined;

        const error = captureWebhookFlowError(() => modifyEventGamePayload(incomingPayload, 'en-GB'));
        expect(error.reason).toBe('IncompletePlatformConfig');
        expect(error.statusCode).toBe(202);
        expect(error.errorCode).toBe(ErrorCode.InvalidWebhookPayload);
    });

    it('throws typed error when incoming game payload is missing', () => {
        const missingPayload = Object.create(null);
        const error = captureWebhookFlowError(() => modifyEventGamePayload(missingPayload));
        expect(error.reason).toBe('MissingGamePayload');
        expect(error.statusCode).toBe(202);
        expect(error.errorCode).toBe(ErrorCode.MissingGamePayload);
        expect(error.message).toBe(getErrorMessage(ErrorCode.MissingGamePayload));
    });

    it('logs warning and continues when mapping field cmsEnv is missing', () => {
        const invalidPayload = makeIncomingPayload();
        invalidPayload.game.cmsEnv = '';

        const result = modifyEventGamePayload(invalidPayload, 'en-GB');

        expect(result.cmsEnv).toBe('master');
        expect(result.createdAt).toBe('2026-01-09T10:00:00.000Z');
        expect(logErrorMock).toHaveBeenCalledWith(
            ErrorCode.MissingGameRequiredFields,
            400,
            expect.objectContaining({
                warning: true,
                skipThrow: true,
                missingRequiredFields: ['cmsEnv'],
            }),
            expect.stringContaining('cmsEnv'),
        );
    });
});
