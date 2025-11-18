/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, beforeEach, it, expect, beforeAll } from '@jest/globals';
import { handleSpaceLocalization, overrideGameLocaleValues } from '../lib/localization';

describe('Localisation testing util logic', () => {
    describe('handleSpaceLocalization', () => {
        const originalEnv = process.env;

        beforeEach(() => {
            jest.resetModules();
            process.env = { ...originalEnv };
        });

        afterEach(() => {
            process.env = originalEnv;
        });

        it('should return the default EU locale if CONTENTFUL_SPACE_LOCALE is not set', () => {
            // Ensure CONTENTFUL_SPACE_LOCALE is not set
            delete process.env.CONTENTFUL_SPACE_LOCALE;
            const result = handleSpaceLocalization();
            expect(result).toBe('en-GB');
        });

        it('should return the value of CONTENTFUL_SPACE_LOCALE when it is set', () => {
            // Set CONTENTFUL_SPACE_LOCALE to a test value
            const testLocale = 'en-US';
            process.env.CONTENTFUL_SPACE_LOCALE = testLocale;
            const result = handleSpaceLocalization();
            expect(result).toBe(testLocale);
        });
    });

    describe('overrideGameLocaleValues', () => {
        it('should prioritize siteGame over game for localized values', () => {
            const siteGame: Record<string, string> = {
                'en-GB': 'Site Game English',
                'es-ES': 'Juego de Sitio Español',
            };

            const game: Record<string, string> = {
                'en-GB': 'Game English',
                'fr-FR': 'Jeu en Français',
            };

            const result = overrideGameLocaleValues(siteGame, game, '');

            expect(result['en-GB']).toBe('Site Game English');
            expect(result['es-ES']).toBe('Juego de Sitio Español');
            expect(result['fr-FR']).toBe('Jeu en Français');
        });

        it('should return "-" if both siteGame and game are undefined and defaultsTo is specified as "-"', () => {
            const result = overrideGameLocaleValues(undefined, undefined, '-');

            expect(result['en-GB']).toBe('-');
        });

        it('should return "" if both siteGame and game are undefined and defaultsTo is specified as ""', () => {
            const result = overrideGameLocaleValues(undefined, undefined, '');

            expect(result['en-GB']).toBe('');
        });
    });
});
