/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock errors to control thrown error and capture logs
jest.mock('../lib/errors', () => ({
    logError: jest.fn(),
    createError: jest.fn().mockImplementation((errorCode, statusCode) => new Error(`${errorCode} ${statusCode}`)),
    ErrorCode: {
        MissingParams: 'MissingParams',
    },
}));
import { logError } from '../lib/errors';
import {
    checkRequestParams,
    validators,
    jsonSizeInMb,
    resolveGameProp,
    patchVentureName,
    pickGameOrSiteGameValue,
    pickGameOrConfigValue,
    orderedPayload,
    orderedPayloadByGameId,
    orderByKey,
    orderedPayloadByPriority,
    extractPlatformFromTitle,
    getLambdaExecutionEnvironment,
    replaceEmptyStringsWithNull,
    coalescePropValue,
    extractBynderObject,
    sanitiseBynderAssets,
    sortByRanking,
} from '../lib/utils';
import type { IBynderAsset } from '../lib/sharedInterfaces/interfaces';

describe('utils', () => {
    describe('checkRequestParams', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('does nothing when all params are present and valid', () => {
            const platform = 'web';
            expect(() => checkRequestParams('jackpotjoy', [platform, validators.platform])).not.toThrow();
            expect(logError).not.toHaveBeenCalled();
        });

        it('throws 400 for invalid params without validators ("", null, undefined)', () => {
            const invalidValues = ['', null, undefined, ' '];
            invalidValues.forEach((val) => {
                jest.clearAllMocks();
                expect(() => checkRequestParams(val)).toThrow('MissingParams 400');
                expect(logError).toHaveBeenCalledWith('MissingParams', 400, expect.any(Object));
            });
        });

        // removed duplicate: covered by the previous test

        it('throws 400 for invalid params with validators', () => {
            const invalidPairs = [
                ['windows', validators.platform],
                ['', validators.siteName],
                ['Jackpotjoy', validators.siteName],
                ['all', validators.siteName],
                ['-start', validators.viewSlug],
                ['Upper', validators.viewSlug],
                ['-start', validators.slug],
                ['Upper', validators.slug],
                ['abc-123', validators.sectionId],
                ['abc_123', validators.sectionId],
                ['dot.name', validators.nameOrSkin],
                ['path/name', validators.nameOrSkin],
                [' ', validators.nameOrSkin],
                [undefined, validators.siteName],
                [null, validators.slug],
            ];

            invalidPairs.forEach(([val, validator]) => {
                jest.clearAllMocks();
                expect(() => checkRequestParams([val as unknown, validator as (v: unknown) => boolean])).toThrow(
                    'MissingParams 400',
                );
                expect(logError).toHaveBeenCalledWith('MissingParams', 400, expect.any(Object));
            });
        });
    });

    describe('validators', () => {
        describe('siteName', () => {
            it('accepts lowercase letters only', () => {
                expect(validators.siteName('jackpotjoy')).toBe(true);
                expect(validators.siteName('rainbowriches')).toBe(true);
            });

            it('rejects uppercase, digits, dashes, empty, and "all"', () => {
                expect(validators.siteName('Jackpotjoy')).toBe(false);
                expect(validators.siteName('jackpotjoy1')).toBe(false);
                expect(validators.siteName('jackpot-joy')).toBe(false);
                expect(validators.siteName('')).toBe(false);
                expect(validators.siteName('all')).toBe(false);
            });
        });

        describe('allSiteName', () => {
            it('accepts only "all"', () => {
                expect(validators.allSiteName('all')).toBe(true);
            });

            it('rejects anything other than "all"', () => {
                expect(validators.allSiteName('jackpotjoy')).toBe(false);
                expect(validators.allSiteName('ALL')).toBe(false);
                expect(validators.allSiteName('')).toBe(false);
                expect(validators.allSiteName('all ')).toBe(false);
            });
        });

        describe('platform', () => {
            it('accepts ios, android, web (case-insensitive)', () => {
                expect(validators.platform('web')).toBe(true);
                expect(validators.platform('ios')).toBe(true);
                expect(validators.platform('android')).toBe(true);
                expect(validators.platform('WEB')).toBe(true);
            });

            it('rejects unsupported platforms and empty', () => {
                expect(validators.platform('windows')).toBe(false);
                expect(validators.platform('')).toBe(false);
            });
        });

        describe('viewSlug', () => {
            it('accepts lowercase alphanumerics and dashes, not starting with dash', () => {
                expect(validators.viewSlug('top-slots')).toBe(true);
                expect(validators.viewSlug('a')).toBe(true);
                expect(validators.viewSlug('a1-2')).toBe(true);
            });

            it('rejects starting dash, uppercase, underscore, and empty', () => {
                expect(validators.viewSlug('-start')).toBe(false);
                expect(validators.viewSlug('Upper')).toBe(false);
                expect(validators.viewSlug('has_underscore')).toBe(false);
                expect(validators.viewSlug('')).toBe(false);
            });
        });

        describe('slug', () => {
            it('accepts lowercase alphanumerics and dashes, not starting with dash', () => {
                expect(validators.slug('some-slug')).toBe(true);
                expect(validators.slug('a')).toBe(true);
                expect(validators.slug('a1-2')).toBe(true);
            });

            it('rejects starting dash, uppercase, underscore, and empty', () => {
                expect(validators.slug('-start')).toBe(false);
                expect(validators.slug('Upper')).toBe(false);
                expect(validators.slug('has_underscore')).toBe(false);
                expect(validators.slug('')).toBe(false);
            });
        });

        describe('sectionId', () => {
            it('accepts alphanumeric only', () => {
                expect(validators.sectionId('ABC123')).toBe(true);
                expect(validators.sectionId('abc')).toBe(true);
                expect(validators.sectionId('A1b2C3')).toBe(true);
            });

            it('rejects dashes, underscores, and empty', () => {
                expect(validators.sectionId('abc-123')).toBe(false);
                expect(validators.sectionId('abc_123')).toBe(false);
                expect(validators.sectionId('')).toBe(false);
            });
        });

        describe('nameOrSkin', () => {
            it('accepts strings 1-100 chars without dot or slash', () => {
                expect(validators.nameOrSkin('SomeName')).toBe(true);
                expect(validators.nameOrSkin('name-with-dash')).toBe(true);
                expect(validators.nameOrSkin('_underscore_ok_')).toBe(true);
                const hundred = 'x'.repeat(100);
                expect(validators.nameOrSkin(hundred)).toBe(true);
            });

            it('rejects dot, slash, empty, and >100 chars', () => {
                expect(validators.nameOrSkin('dot.name')).toBe(false);
                expect(validators.nameOrSkin('path/name')).toBe(false);
                expect(validators.nameOrSkin('')).toBe(false);
                const tooLong = 'y'.repeat(101);
                expect(validators.nameOrSkin(tooLong)).toBe(false);
            });
        });

        describe('memberId', () => {
            it('accepts digits-only strings', () => {
                expect(validators.memberId('0')).toBe(true);
                expect(validators.memberId('1234567890')).toBe(true);
            });

            it('rejects non-digit content and empty', () => {
                expect(validators.memberId('')).toBe(false);
                expect(validators.memberId('  ')).toBe(false);
                expect(validators.memberId('abc')).toBe(false);
                expect(validators.memberId('123abc')).toBe(false);
                expect(validators.memberId('001-002')).toBe(false);
                expect(validators.memberId('001-002')).toBe(false);
            });
        });

        describe('auth', () => {
            it('accepts "true" or "false" (case-insensitive)', () => {
                expect(validators.auth('true')).toBe(true);
                expect(validators.auth('false')).toBe(true);
                expect(validators.auth('TRUE')).toBe(true);
                expect(validators.auth('False')).toBe(true);
            });

            it('rejects other values and empty', () => {
                expect(validators.auth('')).toBe(false);
                expect(validators.auth('yes')).toBe(false);
                expect(validators.auth('0')).toBe(false);
                expect(validators.auth('1')).toBe(false);
            });
        });
    });

    describe('jsonSizeInMb', () => {
        it('measures object payload by stringifying', () => {
            const payload = { a: 1, b: 'two' };
            const size = jsonSizeInMb(payload);

            expect(size).toBeGreaterThan(0);
            expect(size).toBeCloseTo(Buffer.byteLength(JSON.stringify(payload), 'utf8') / (1024 * 1024));
        });

        it('measures string payload directly without double stringify', () => {
            const payload = JSON.stringify({ a: 1, b: 'two' });
            const size = jsonSizeInMb(payload);

            expect(size).toBeCloseTo(Buffer.byteLength(payload, 'utf8') / (1024 * 1024));
        });
    });
});

describe('resolveGameProp', () => {
    it('returns defaultValue when value is null', () => {
        expect(resolveGameProp(null, 'en-GB', 'default')).toBe('default');
    });

    it('returns defaultValue when value is undefined', () => {
        expect(resolveGameProp(undefined, 'en-GB', 'default')).toBe('default');
    });

    it('returns primitive value as-is (new flat format)', () => {
        expect(resolveGameProp('slotgame', 'en-GB', 'default')).toBe('slotgame');
        expect(resolveGameProp(42, 'en-GB', 0)).toBe(42);
        expect(resolveGameProp(true, 'en-GB', false)).toBe(true);
    });

    it('returns array value as-is (new flat format)', () => {
        const arr = ['a', 'b'];
        expect(resolveGameProp(arr, 'en-GB', [])).toBe(arr);
    });

    it('returns localised value for old LocalizedField<T> format when locale key exists', () => {
        const localized = { 'en-GB': 'english', 'de-DE': 'deutsch' };
        expect(resolveGameProp(localized, 'en-GB', 'default')).toBe('english');
    });

    it('returns defaultValue when locale key exists but its value is null/undefined', () => {
        const localized: Record<string, string | null> = { 'en-GB': null };
        expect(resolveGameProp(localized, 'en-GB', 'default')).toBe('default');
    });

    it('returns the object itself when locale key is absent (treated as flat new-format object)', () => {
        const obj = { someKey: 'value' };
        // Object without the locale key → not a LocalizedField → returned as-is
        expect(resolveGameProp<{ someKey: string }>(obj, 'en-GB', { someKey: '' })).toBe(obj);
    });
});

describe('patchVentureName', () => {
    it('maps rainbowrichescasino to rainbowriches', () => {
        expect(patchVentureName('rainbowrichescasino')).toBe('rainbowriches');
    });

    it('returns other venture names unchanged', () => {
        expect(patchVentureName('jackpotjoy')).toBe('jackpotjoy');
        expect(patchVentureName('wink')).toBe('wink');
    });
});

describe('pickGameOrSiteGameValue', () => {
    it('returns siteGame value when it is defined and non-empty', () => {
        expect(pickGameOrSiteGameValue('sg', 'g', 'default')).toBe('sg');
        expect(pickGameOrSiteGameValue(42, 0, -1)).toBe(42);
        expect(pickGameOrSiteGameValue(['a'], [], [])).toEqual(['a']);
    });

    it('falls back to game when siteGame is empty string', () => {
        expect(pickGameOrSiteGameValue('', 'game-val', 'default')).toBe('game-val');
    });

    it('falls back to game when siteGame is empty array', () => {
        expect(pickGameOrSiteGameValue([], ['x'], [])).toEqual(['x']);
    });

    it('falls back to game when siteGame is undefined', () => {
        expect(pickGameOrSiteGameValue(undefined, 'game-val', 'default')).toBe('game-val');
    });

    it('returns defaultsTo when both siteGame and game are empty', () => {
        expect(pickGameOrSiteGameValue('', '', 'default')).toBe('default');
        expect(pickGameOrSiteGameValue(undefined, undefined, 'fallback')).toBe('fallback');
    });
});

describe('pickGameOrConfigValue', () => {
    it('returns gameValue when truthy', () => {
        expect(pickGameOrConfigValue('game', 'config', 'default')).toBe('game');
    });

    it('returns configValue when gameValue is falsy', () => {
        expect(pickGameOrConfigValue(null, 'config', 'default')).toBe('config');
        expect(pickGameOrConfigValue('', 'config', 'default')).toBe('config');
    });

    it('returns defaultValue when both are falsy', () => {
        expect(pickGameOrConfigValue(null, null, 'default')).toBe('default');
        expect(pickGameOrConfigValue(undefined, undefined, 'fallback')).toBe('fallback');
    });
});

describe('orderedPayload', () => {
    it('sorts payload by the order of entryIds', () => {
        const ids = ['c', 'a', 'b'];
        const payload = [{ entryId: 'a' }, { entryId: 'b' }, { entryId: 'c' }];
        expect(orderedPayload(payload, ids)).toEqual([{ entryId: 'c' }, { entryId: 'a' }, { entryId: 'b' }]);
    });
});

describe('orderedPayloadByGameId', () => {
    it('sorts payload by the order of gameIds', () => {
        const ids = ['z', 'x', 'y'];
        const payload = [{ gameId: 'x' }, { gameId: 'y' }, { gameId: 'z' }];
        expect(orderedPayloadByGameId(payload, ids)).toEqual([{ gameId: 'z' }, { gameId: 'x' }, { gameId: 'y' }]);
    });
});

describe('orderByKey', () => {
    it('orders items by external key list with getKey extractor', () => {
        const ordering = ['b', 'a', 'c'];
        const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
        const result = orderByKey(items, ordering, (i) => i.id);
        expect(result.map((i) => i.id)).toEqual(['b', 'a', 'c']);
    });

    it('places unknown keys at the end', () => {
        const ordering = ['a'];
        const items = [{ id: 'z' }, { id: 'a' }];
        const result = orderByKey(items, ordering, (i) => i.id);
        expect(result.map((i) => i.id)).toEqual(['a', 'z']);
    });

    it('does not mutate the original array', () => {
        const items = [{ id: 'b' }, { id: 'a' }];
        const copy = [...items];
        orderByKey(items, ['a', 'b'], (i) => i.id);
        expect(items).toEqual(copy);
    });
});

describe('orderedPayloadByPriority', () => {
    it('sorts descending by priorityOverride', () => {
        const payload = [
            { entryId: '1', priorityOverride: 1 },
            { entryId: '2', priorityOverride: 3 },
            { entryId: '3', priorityOverride: 2 },
        ];
        const result = orderedPayloadByPriority(payload);
        expect(result.map((i) => i.priorityOverride)).toEqual([3, 2, 1]);
    });
});

describe('extractPlatformFromTitle', () => {
    it('returns desktop for [desktop] titles', () => {
        expect(extractPlatformFromTitle('My View [Desktop]')).toBe('desktop');
    });

    it('returns tablet for [tablet] titles', () => {
        expect(extractPlatformFromTitle('My View [Tablet]')).toBe('tablet');
    });

    it('returns phone for [phone] and [mobile] titles', () => {
        expect(extractPlatformFromTitle('My View [Phone]')).toBe('phone');
        expect(extractPlatformFromTitle('My View [Mobile]')).toBe('phone');
    });

    it('defaults to desktop when no platform marker found', () => {
        expect(extractPlatformFromTitle('My View')).toBe('desktop');
    });
});

describe('getLambdaExecutionEnvironment', () => {
    afterEach(() => {
        delete process.env.EXECUTION_ENVIRONMENT;
    });

    it('returns the environment when set to a valid value', () => {
        process.env.EXECUTION_ENVIRONMENT = 'production';
        expect(getLambdaExecutionEnvironment()).toBe('production');
    });

    it('defaults to production and logs an error when env var is missing', () => {
        delete process.env.EXECUTION_ENVIRONMENT;
        const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(getLambdaExecutionEnvironment()).toBe('production');
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('defaults to production and logs an error when env var is invalid', () => {
        process.env.EXECUTION_ENVIRONMENT = 'staging-invalid';
        const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(getLambdaExecutionEnvironment()).toBe('production');
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});

describe('replaceEmptyStringsWithNull', () => {
    it('replaces empty string with null', () => {
        expect(replaceEmptyStringsWithNull('')).toBeNull();
    });

    it('leaves non-empty strings unchanged', () => {
        expect(replaceEmptyStringsWithNull('hello')).toBe('hello');
    });

    it('recursively replaces empty strings in arrays', () => {
        expect(replaceEmptyStringsWithNull(['a', '', 'b'])).toEqual(['a', null, 'b']);
    });

    it('recursively replaces empty strings in objects', () => {
        expect(replaceEmptyStringsWithNull({ x: '', y: 'val' })).toEqual({ x: null, y: 'val' });
    });

    it('handles nested structures', () => {
        expect(replaceEmptyStringsWithNull({ a: { b: '' } })).toEqual({ a: { b: null } });
    });
});

describe('coalescePropValue', () => {
    const locale = 'en-GB';

    it('returns override localised value when present', () => {
        expect(
            coalescePropValue({
                overrideField: { [locale]: 'override' },
                baseField: { [locale]: 'base' },
                spaceLocale: locale,
                defaultFallback: 'default',
            }),
        ).toBe('override');
    });

    it('falls back to base when override is null', () => {
        expect(
            coalescePropValue({
                overrideField: null,
                baseField: { [locale]: 'base' },
                spaceLocale: locale,
                defaultFallback: 'default',
            }),
        ).toBe('base');
    });

    it('returns defaultFallback when both fields are null/undefined', () => {
        expect(
            coalescePropValue({
                overrideField: undefined,
                baseField: undefined,
                spaceLocale: locale,
                defaultFallback: 'fallback',
            }),
        ).toBe('fallback');
    });

    it('preserves falsy non-null override values (0, false, "")', () => {
        expect(
            coalescePropValue({
                overrideField: { [locale]: 0 } as any,
                baseField: { [locale]: 99 } as any,
                spaceLocale: locale,
                defaultFallback: -1,
            }),
        ).toBe(0);
    });

    it('returns flat primitive when field is not a LocalizedField', () => {
        expect(
            coalescePropValue({
                overrideField: 'flat',
                baseField: 'other',
                spaceLocale: locale,
                defaultFallback: 'default',
            }),
        ).toBe('flat');
    });

    it('returns flat array when field is an array', () => {
        const arr = ['x'];
        expect(
            coalescePropValue({
                overrideField: arr as any,
                baseField: ['y'] as any,
                spaceLocale: locale,
                defaultFallback: [],
            }),
        ).toBe(arr);
    });
});

describe('extractBynderObject', () => {
    it('returns null when input is null', () => {
        expect(extractBynderObject(null)).toBeNull();
    });

    it('returns null for an empty array', () => {
        expect(extractBynderObject([])).toBeNull();
    });

    it('returns sanitized bynder object from the first array element', () => {
        const asset: IBynderAsset = {
            id: '1',
            name: 'hero',
            type: 'IMAGE',
            width: 800,
            height: 600,
            orientation: 'landscape',
            original: 'https://cdn/original.jpg',
            tags: ['promo'],
            thumbnails: { transformBaseUrl: 'https://cdn/transform', original: 'https://cdn/thumb.jpg' },
        };
        const result = extractBynderObject([asset]);
        expect(result).toMatchObject({
            name: 'hero',
            type: 'IMAGE',
            width: 800,
            height: 600,
            tags: ['promo'],
            thumbnails: { transformBaseUrl: 'https://cdn/transform', original: 'https://cdn/thumb.jpg' },
        });
    });

    it('omits tags when asset has no tags', () => {
        const asset: IBynderAsset = { id: '1', thumbnails: {} };
        const result = extractBynderObject([asset]);
        expect(result?.tags).toBeUndefined();
    });
});

describe('sanitiseBynderAssets', () => {
    it('returns null for null input', () => {
        expect(sanitiseBynderAssets(null)).toBeNull();
    });

    it('returns null for empty array', () => {
        expect(sanitiseBynderAssets([])).toBeNull();
    });

    it('maps all assets to sanitized form', () => {
        const assets: IBynderAsset[] = [
            { id: '1', name: 'a', thumbnails: {} },
            { id: '2', name: 'b', thumbnails: { transformBaseUrl: 'url' } },
        ];
        const result = sanitiseBynderAssets(assets);
        expect(result).toHaveLength(2);
        expect(result?.[0].name).toBe('a');
        expect(result?.[1].thumbnails.transformBaseUrl).toBe('url');
    });
});

describe('sortByRanking', () => {
    it('sorts ascending by numeric field', () => {
        const arr = [{ rank: 3 }, { rank: 1 }, { rank: 2 }];
        expect(sortByRanking(arr, 'rank', 'asc').map((i) => i.rank)).toEqual([1, 2, 3]);
    });

    it('sorts descending by numeric field', () => {
        const arr = [{ rank: 3 }, { rank: 1 }, { rank: 2 }];
        expect(sortByRanking(arr, 'rank', 'desc').map((i) => i.rank)).toEqual([3, 2, 1]);
    });

    it('handles string representations of numbers', () => {
        const arr = [{ rank: '3' }, { rank: '1' }, { rank: '2' }];
        expect(sortByRanking(arr as any, 'rank', 'asc').map((i: any) => i.rank)).toEqual(['1', '2', '3']);
    });

    it('does not mutate the original array', () => {
        const arr = [{ rank: 2 }, { rank: 1 }];
        const copy = [...arr];
        sortByRanking(arr, 'rank');
        expect(arr).toEqual(copy);
    });
});
