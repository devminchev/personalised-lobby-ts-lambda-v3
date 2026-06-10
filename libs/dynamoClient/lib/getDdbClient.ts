import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export interface DynamoClientConfig {
    /** AWS region. Falls back to `AWS_REGION` env var when omitted. */
    awsRegion?: string;
    /** DynamoDB endpoint override (e.g. http://localhost:8000 for DynamoDB Local). Falls back to `DDB_ENDPOINT` env var. */
    ddbEndpoint?: string;
}

interface CachedDdbClient {
    cacheKey: string;
    client: DynamoDBDocumentClient;
}

let cachedDdbClient: CachedDdbClient | null = null;

/**
 * Returns a (memoised) DynamoDB document client for the current runtime.
 *
 * The cache key includes the region AND endpoint override so a swap between
 * real AWS → DynamoDB Local (or between regions) invalidates the cached
 * client rather than silently reusing the wrong one.
 *
 * Config fields fall back to `AWS_REGION` / `DDB_ENDPOINT` env vars so
 * callers that rely purely on env-var config can call `getDdbClient()` with
 * no arguments.
 */
export function getDdbClient(config: DynamoClientConfig = {}): DynamoDBDocumentClient {
    const endpoint = config.ddbEndpoint ?? process.env.DDB_ENDPOINT;
    const region = config.awsRegion ?? process.env.AWS_REGION;
    const cacheKey = `${region ?? 'default'}|${endpoint ?? ''}`;

    if (cachedDdbClient?.cacheKey === cacheKey) {
        return cachedDdbClient.client;
    }

    const raw = new DynamoDBClient({
        region,
        ...(endpoint ? { endpoint } : {}),
    });

    cachedDdbClient = {
        cacheKey,
        client: DynamoDBDocumentClient.from(raw),
    };
    return cachedDdbClient.client;
}

/** @internal Test-only: drop the module-level cache so the next call re-creates the client. */
export function _resetDdbClientCacheForTests(): void {
    cachedDdbClient = null;
}
