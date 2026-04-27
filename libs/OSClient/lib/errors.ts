import { RequestDetails } from './utils';

export enum ErrorCode {
    // V3 Generic Error Codes
    InvalidRequest = 'INVALID_REQUEST',
    NoResults = 'NO_RESULTS',
    ServerError = 'INTERNAL_ERROR',
    // V3 error codes
    UnprocessableEntity = 'UNPROCESSABLE_ENTITY',
    MissingNavigation = 'MISSING_NAVIGATION',
    InvalidView = 'INVALID_VIEW',
    MissingLink = 'MISSING_LINK',
    MissingTheme = 'MISSING_THEME',
    // V2 error codes
    InvalidLayout = 'INVALID_LAYOUT',
    MissingCategories = 'MISSING_CATEGORIES',
    NoCategoriesReturned = 'NO_CATEGORIES_RETURNED',
    MissingCategoryType = 'MISSING_CATEGORY_TYPE',
    // shared error codes
    OpenSearchClientError = 'OPENSEARCH_API_ERROR',
    InvalidVenture = 'INVALID_VENTURE',
    MissingVenture = 'MISSING_VENTURE_ID',
    MissingSections = 'MISSING_SECTIONS',
    MissingParams = 'MISSING_PARAMS',
    ExecutionError = 'EXECUTION_ERROR',
    MissingSectionGames = 'MISSING_SECTION_GAMES',
    MissingSection = 'MISSING_SECTION_DATA',
    NoGamesReturned = 'NO_GAMES_RETURNED',
    NoMlGameRecommendations = 'NO_ML_RECOMMENDED_RECORDS',
    NoRPGameRecommendations = 'NO_RECENTLY_PLAYED_RECORDS',
    MlIndexError = 'ML_INDEX_ERROR',
    IndexError = 'INDEX_ERROR',
    NoMlUserRecommendations = 'NO_ML_RECOMMENDED_RECORDS_FOR_USER',
    MultipleMlGameReccomendations = 'MULTIPLE_ML_RECOMMENDED_RECORDS',
    RecommendationProcessingError = 'RECOMMENDATION_PROCESSING_ERROR',
    BadWolf = 'BAD_WOLF',
    MissingIgGameSection = 'MISSING_IG_GAME_SECTION',
    InvalidClassification = 'INVALID_CLASSIFICATION',
    MissingClassification = 'MISSING_CLASSIFICATION',
    InvalidSectionSlug = 'INVALID_SECTION_SLUG',
    NoGameShuffleData = 'NO_GAME_SHUFFLE_DATA',
    MissingVariant = 'MISSING_VARIANT',
    VariantMemberVentureMismatch = 'VARIANT_MEMBER_VENTURE_MISMATCH',
    // PostGamesPayloadFunction error codes
    MissingRequestBody = 'MISSING_REQUEST_BODY',
    UnsupportedBodyEncoding = 'UNSUPPORTED_BODY_ENCODING',
    UnauthorizedWebhook = 'UNAUTHORIZED_WEBHOOK',
    InvalidWebhookPayload = 'INVALID_WEBHOOK_PAYLOAD',
    MissingGamePayload = 'MISSING_GAME_PAYLOAD',
    MissingGameRequiredFields = 'MISSING_GAME_REQUIRED_FIELDS',
    MissingVersionTimestamp = 'MISSING_VERSION_TIMESTAMP',
    InvalidVersionTimestamp = 'INVALID_VERSION_TIMESTAMP',
    InvalidVersionValue = 'INVALID_VERSION_VALUE',
    OpenSearchThrottled = 'OPENSEARCH_THROTTLED',
    OpenSearchTemporaryFailure = 'OPENSEARCH_TEMPORARY_FAILURE',
    OpenSearchIndexingError = 'OPENSEARCH_INDEXING_ERROR',
}

export const errorMessages: Record<ErrorCode, string> = {
    // V3 error codes
    [ErrorCode.InvalidRequest]: 'Request is invalid',
    [ErrorCode.NoResults]: 'No results found',
    [ErrorCode.ServerError]: 'Internal Server Error',
    [ErrorCode.UnprocessableEntity]:
        'The entry in OpenSearch or Contentful is malformed. Check all expected properties are the correct type!',
    [ErrorCode.MissingNavigation]: 'Navigation was not found',
    [ErrorCode.InvalidView]: 'View not found',
    [ErrorCode.MissingLink]: 'Link was not found',
    [ErrorCode.MissingTheme]: 'Linked theme record was not found',
    [ErrorCode.NoGameShuffleData]: 'No records found in game shuffle index',
    // V2 error codes
    [ErrorCode.InvalidLayout]: 'Invalid layout',
    [ErrorCode.MissingCategories]: 'Categories are missing',
    [ErrorCode.NoCategoriesReturned]: 'No categories were found',
    [ErrorCode.MissingCategoryType]: 'Category type is missing',
    // shared error codes
    [ErrorCode.InvalidVenture]: 'Invalid venture',
    [ErrorCode.MissingVenture]: 'Missing ventureId',
    [ErrorCode.OpenSearchClientError]: 'OpenSearch API encountered an error',
    [ErrorCode.MissingSections]: 'No sections were found',
    [ErrorCode.MissingParams]: 'One or more path params are missing',
    [ErrorCode.ExecutionError]: 'Error executing query',
    [ErrorCode.MissingSectionGames]: 'No games were found for the given section',
    [ErrorCode.MissingSection]: 'Section was not found',
    [ErrorCode.NoGamesReturned]: 'No games were returned',
    [ErrorCode.MultipleMlGameReccomendations]: 'Multiple ML records fould for that account. Using the 1 match',
    [ErrorCode.NoMlUserRecommendations]:
        'ML recommended games for user were found but the games did not exist in the games index.',
    [ErrorCode.NoMlGameRecommendations]: 'No recommended games from ML for that account were found',
    [ErrorCode.NoRPGameRecommendations]: 'No Recently Played records from Vitruvian for that account were found',
    [ErrorCode.MlIndexError]: 'ML Index Error: Index inaccessible or can not be found.',
    [ErrorCode.IndexError]: 'Index Error: Index inaccessible or can not be found.',
    [ErrorCode.RecommendationProcessingError]:
        'An error occurred during venture ID retrieval, recommended games fetching from the games index, or constructing the recommended games payload.',
    [ErrorCode.BadWolf]: 'Bad Request',
    [ErrorCode.MissingIgGameSection]: 'No IG Game Section were found',
    [ErrorCode.InvalidClassification]: 'Invalid classification was given for section view, returning base response',
    [ErrorCode.MissingClassification]: 'undefined classification was given for section view',
    [ErrorCode.InvalidSectionSlug]: 'Invalid section slug',
    [ErrorCode.MissingVariant]: 'No variant record found for user',
    [ErrorCode.VariantMemberVentureMismatch]:
        'There is a mismatch between the passed-in venture and the variant record memberid',
    // PostGamesPayloadFunction messages
    [ErrorCode.MissingRequestBody]: 'Missing request body',
    [ErrorCode.UnsupportedBodyEncoding]: 'Base64-encoded request bodies are not supported for this endpoint',
    [ErrorCode.UnauthorizedWebhook]: 'Unauthorized',
    [ErrorCode.InvalidWebhookPayload]: 'Webhook payload is invalid',
    [ErrorCode.MissingGamePayload]: 'Missing game payload',
    [ErrorCode.MissingGameRequiredFields]: 'Missing required fields',
    [ErrorCode.MissingVersionTimestamp]: 'Missing modifiedPayload.updatedAt (required to compute external version).',
    [ErrorCode.InvalidVersionTimestamp]: 'Invalid updatedAt ISO date',
    [ErrorCode.InvalidVersionValue]: 'Computed externalVersion is not a safe positive integer',
    [ErrorCode.OpenSearchThrottled]: 'OpenSearch throttling (429). Let Contentful retry with backoff.',
    [ErrorCode.OpenSearchTemporaryFailure]: 'OpenSearch temporary failure',
    [ErrorCode.OpenSearchIndexingError]: 'Error indexing data to OpenSearch',
};

export interface clientError extends Error {
    code?: ErrorCode;
    statusCode?: number;
}

export const getErrorMessage = (code: ErrorCode): string => {
    return errorMessages[code];
};

/**
 * Logs an error with the specified details.
 * @param {ErrorCode} code - The error code.
 * @param {number} statusCode - The HTTP status code.
 * @param {string} [message] - The error message.
 */
export const createError = (code: ErrorCode, statusCode: number, message?: string): clientError => {
    const error = new Error(message || getErrorMessage(code));
    (error as any).code = code;
    (error as any).statusCode = statusCode;
    return error;
};

/**
 * Logs an error with the specified details.
 * @param {ErrorCode} code - The error code.
 * @param {number} statusCode - The HTTP status code.
 * @param {requestDetails} [requestDetails] - Request Details passed into the call.
 * @param {string} [message] - The error message.
 */
export const logError = (code: ErrorCode, statusCode: number, requestDetails?: RequestDetails, message?: string) => {
    console.error({
        errorLog: message || getErrorMessage(code),
        errorCode: code,
        statusCode: statusCode,
        ...requestDetails,
    });
};
