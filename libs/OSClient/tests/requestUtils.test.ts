/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, it, expect } from '@jest/globals';
import { validateGameHits } from '../lib/requestUtils';
import { logMessage } from '../lib/logger';

jest.mock('../lib/errors', () => ({
    logError: jest.fn(),
    createError: jest.fn().mockImplementation((errorCode, statusCode) => new Error(`${errorCode} ${statusCode}`)),
    ErrorCode: {
        NoGamesReturned: 'NoGamesReturned',
    },
}));

jest.mock('../lib/logger', () => ({
    logMessage: jest.fn(),
}));

describe('validateGameHits', () => {
    const siteName = 'jackpotjoy';
    const platform = 'web';

    it('throws an error when data array is empty', () => {
        expect(() => validateGameHits([], siteName, platform)).toThrowError('NoGamesReturned 404');
        expect(logMessage).toHaveBeenCalledWith(
            'warn',
            'NoGamesReturned',
            {
                siteName,
                platform,
                data: [],
            },
            expect.any(String),
        );
    });

    it('returns the first item if the array contains one item', () => {
        const testData = [{ id: 1 }];
        expect(validateGameHits(testData, siteName, platform)).toEqual(testData[0]);
    });

    it('logs a warning and returns the first item if the array contains more than one item', () => {
        const testData = [{ id: 1 }, { id: 2 }];
        console.warn = jest.fn(); // Mocking console.warn
        expect(validateGameHits(testData, siteName, platform)).toEqual(testData[0]);
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Expected 1 entry, received 2 entries'));
    });
});
