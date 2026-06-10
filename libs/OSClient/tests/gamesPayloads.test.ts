import { describe, it, expect } from '@jest/globals';
import { payloadBuilder } from '../lib/gamesPayloads';
import { Game, GamePlatformConfig, SiteGame } from '../lib/sharedInterfaces/interfaces';

const SPACE_LOCALE = 'en-GB';
const PLATFORM = 'web';

const baseGamePlatformConfig: GamePlatformConfig = {
    name: 'Game Name',
    gameSkin: 'skin',
    demoUrl: 'http://demo',
    realUrl: 'http://real',
    gameLoaderFileName: '',
    gameProvider: '',
    gameType: { type: 'Slots' } as GamePlatformConfig['gameType'],
    subGameType: 'Slots',
    federalGameType: 'Slots',
};

const baseGame: Partial<Game> = {
    id: 'game-1',
    gameName: 'Game Name',
    gameSkin: 'skin',
    gamePlatformConfig: baseGamePlatformConfig,
    title: { 'en-GB': 'Title' },
};

const baseSiteGame: Partial<SiteGame> = {
    id: 'site-1',
    gameId: 'game-1',
};

describe('payloadBuilder – sigCons propagation', () => {
    it('forwards sigCons from the requested locale to the response payload', () => {
        const game = { ...baseGame, sigCons: { 'en-GB': 'sig-cons-en', 'fr-FR': 'sig-cons-fr' } } as Game;

        const result = payloadBuilder(
            baseSiteGame as SiteGame,
            game,
            baseGamePlatformConfig,
            SPACE_LOCALE,
            SPACE_LOCALE,
            PLATFORM,
        );

        expect(result.sigCons).toBe('sig-cons-en');
    });

    it('falls back to the space locale when localeOverride has no entry', () => {
        const game = { ...baseGame, sigCons: { 'en-GB': 'sig-cons-en' } } as Game;

        const result = payloadBuilder(
            baseSiteGame as SiteGame,
            game,
            baseGamePlatformConfig,
            SPACE_LOCALE,
            'fr-FR',
            PLATFORM,
        );

        expect(result.sigCons).toBe('sig-cons-en');
    });

    it('omits sigCons when the field is missing on the game', () => {
        const result = payloadBuilder(
            baseSiteGame as SiteGame,
            baseGame as Game,
            baseGamePlatformConfig,
            SPACE_LOCALE,
            SPACE_LOCALE,
            PLATFORM,
        );

        expect(result).not.toHaveProperty('sigCons');
    });

    it('omits sigCons when the localised value is empty', () => {
        const game = { ...baseGame, sigCons: { 'en-GB': '' } } as Game;

        const result = payloadBuilder(
            baseSiteGame as SiteGame,
            game,
            baseGamePlatformConfig,
            SPACE_LOCALE,
            SPACE_LOCALE,
            PLATFORM,
        );

        expect(result).not.toHaveProperty('sigCons');
    });
});
