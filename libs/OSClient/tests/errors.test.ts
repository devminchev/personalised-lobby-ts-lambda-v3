import { getErrorMessage, createError, logError, ErrorCode } from '../lib/errors'; // Adjust the import path as necessary

describe('Error Handling', () => {
    describe('getErrorMessage', () => {
        it('should return the correct message for each error code', () => {
            expect(getErrorMessage(ErrorCode.OpenSearchClientError)).toBe('OpenSearch API encountered an error');
            expect(getErrorMessage(ErrorCode.InvalidVenture)).toBe('Invalid venture');
            expect(getErrorMessage(ErrorCode.InvalidLayout)).toBe('Invalid layout');
            // Add assertions for all error codes...
        });
    });

    describe('createError', () => {
        it('should create an error with default message', () => {
            const error = createError(ErrorCode.MissingSections, 404);
            expect(error.message).toBe('No sections were found');
            expect(error.code).toBe(ErrorCode.MissingSections);
            expect(error.statusCode).toBe(404);
        });

        it('should create an error with custom message', () => {
            const customMessage = 'Custom error message';
            const error = createError(ErrorCode.MissingSections, 404, customMessage);
            expect(error.message).toBe(customMessage);
            expect(error.code).toBe(ErrorCode.MissingSections);
            expect(error.statusCode).toBe(404);
        });
    });

    describe('logError', () => {
        let consoleSpy: jest.SpyInstance; // Correctly type the consoleSpy variable

        beforeEach(() => {
            // eslint-disable-next-line
            consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            consoleSpy.mockRestore();
        });

        it('should log the default error message', () => {
            const siteName = 'jackpotjoy';
            const platform = 'web';
            logError(ErrorCode.MissingSections, 404, { siteName, platform });
            expect(consoleSpy).toHaveBeenCalledWith({
                errorLog: 'No sections were found',
                errorCode: ErrorCode.MissingSections,
                statusCode: 404,
                siteName: 'jackpotjoy',
                platform: 'web',
            });
        });

        it('should log with additional details and a custom message', () => {
            const siteName = 'jackpotjoy';
            const platform = 'web';
            const memberId = '123456';
            const viewSlug = 'top-slots';
            const requestDetails = { siteName, platform, memberId, viewSlug };
            const customMessage = 'An error occurred during testing';

            logError(ErrorCode.MissingSections, 404, requestDetails, customMessage);

            expect(consoleSpy).toHaveBeenCalledWith({
                errorLog: customMessage,
                errorCode: ErrorCode.MissingSections,
                statusCode: 404,
                ...requestDetails,
            });
        });
    });
});
