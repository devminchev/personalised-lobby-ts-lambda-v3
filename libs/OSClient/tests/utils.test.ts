/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock errors to control thrown error and capture logs
jest.mock('../lib/errors', () => ({
    logError: jest.fn(),
    createError: jest.fn().mockImplementation((errorCode, statusCode) => new Error(`${errorCode} ${statusCode}`)),
    ErrorCode: {
        MissingParams: 'MissingParams',
    },
}));
import { logError } from '../lib/errors';
import { checkRequestParams, validators } from '../lib/utils';

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

            it('rejects uppercase, digits, dashes, and empty', () => {
                expect(validators.siteName('Jackpotjoy')).toBe(false);
                expect(validators.siteName('jackpotjoy1')).toBe(false);
                expect(validators.siteName('jackpot-joy')).toBe(false);
                expect(validators.siteName('')).toBe(false);
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
});
