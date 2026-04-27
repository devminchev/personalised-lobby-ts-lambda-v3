import { ApiPostSiteGameRequest, Game_Hit } from 'os-client/lib/sharedInterfaces/interfaces';
import { GamePayloadFields } from './gamesPayload';
import {
    createError,
    ErrorCode,
    GAME_V2_TYPE,
    IClient,
    LogCode,
    getErrorMessage,
    logError,
    logMessage,
} from 'os-client';
import { computeExternalVersionNumber } from './calculateVersion';

export type GamePostRequestPayload = ApiPostSiteGameRequest<Game_Hit<GamePayloadFields>>;

const gameResponseBody = (gamePayload: GamePayloadFields): GamePostRequestPayload => {
    const payload = {
        entryId: gamePayload.id,
        payload: {
            doc: {
                game_to_sitegame: { name: 'game' },
                game: gamePayload,
            },
        },
    };

    return payload;
};

export const indexToOpenSearch = async (
    opensearchClient: IClient,
    modifiedPayload: GamePayloadFields,
    indexName: string,
): Promise<void> => {
    if (!modifiedPayload) {
        throw createError(ErrorCode.OpenSearchIndexingError, 500, 'No entries to index.');
    }
    if (modifiedPayload.contentType !== GAME_V2_TYPE) {
        logError(
            ErrorCode.OpenSearchIndexingError,
            400,
            { indexName, documentId: modifiedPayload.id, contentType: modifiedPayload.contentType },
            `Skipping OpenSearch index write: unsupported content type "${modifiedPayload.contentType}"`,
        );
        return;
    }

    const responseBody = gameResponseBody(modifiedPayload);
    const docBody = responseBody?.payload?.doc;
    if (!docBody) {
        throw createError(ErrorCode.OpenSearchIndexingError, 500, 'No document body to index.');
    }

    if (!modifiedPayload.updatedAt) {
        throw createError(ErrorCode.MissingVersionTimestamp, 500, getErrorMessage(ErrorCode.MissingVersionTimestamp));
    }

    // --- CHANGED: safe numeric external version (no bigint) ---
    const externalVersion = computeExternalVersionNumber(modifiedPayload.updatedAt, modifiedPayload.cmsChangeVersion);

    // Single attempt in Lambda; rely on Contentful redelivery for retry behavior.
    const maxAttempts = 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await opensearchClient.index({
                index: indexName,
                id: modifiedPayload.id,
                body: docBody,

                // Strict external versioning (no duplicate rewrites).
                // New write applies only if version is strictly greater.
                version: externalVersion,
                version_type: 'external',

                refresh: false,
            });
            logMessage(
                'log',
                LogCode.GameWebhookSuccess,
                { indexName, entryId: modifiedPayload.id, externalVersion },
                `PostGames payload indexed successfully for entry "${modifiedPayload.id}"`,
            );
            return;
        } catch (err: unknown) {
            const status = (err as { meta?: { statusCode?: number } })?.meta?.statusCode;

            // 409 => older or duplicate => treat as success/no-op
            if (status === 409) {
                logError(
                    ErrorCode.OpenSearchIndexingError,
                    409,
                    { indexName, documentId: modifiedPayload.id, externalVersion },
                    'OpenSearch version conflict treated as idempotent success',
                );
                return;
            }

            if (status === 429) {
                throw createError(ErrorCode.OpenSearchThrottled, 429, getErrorMessage(ErrorCode.OpenSearchThrottled));
            }

            const isRetryable = status === 502 || status === 503 || status === 504;

            if (isRetryable) {
                // Retryable upstream failure so Contentful can redeliver.
                throw createError(
                    ErrorCode.OpenSearchTemporaryFailure,
                    503,
                    `${getErrorMessage(ErrorCode.OpenSearchTemporaryFailure)} (status ${status ?? 'unknown'})`,
                );
            }

            logError(
                ErrorCode.OpenSearchIndexingError,
                500,
                { opensearchStatusCode: status, indexName, documentId: modifiedPayload.id, error: err },
                `${getErrorMessage(ErrorCode.OpenSearchIndexingError)}: ${String(err)}`,
            );
            throw createError(
                ErrorCode.OpenSearchIndexingError,
                500,
                `${getErrorMessage(ErrorCode.OpenSearchIndexingError)}: ${String(err)}`,
            );
        }
    }
};
