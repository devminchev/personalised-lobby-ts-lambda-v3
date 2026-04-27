import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { RuntimeConfig } from './types';

interface CachedDdbClient {
    cacheKey: string;
    client: DynamoDBDocumentClient;
}

let cachedDdbClient: CachedDdbClient | null = null;

/**
 * Returns a (memoised) DynamoDB document client configured for the current
 * runtime. The cache key includes the region *and* the endpoint override so a
 * swap from real AWS → DynamoDB Local (or between regions) invalidates the
 * cached client instead of silently reusing the wrong one.
 *
 * `DDB_ENDPOINT` is honoured here for local development and tests (documented
 * in the README). The AWS SDK also natively honours `AWS_ENDPOINT_URL_DYNAMODB`
 * — either works — but the explicit `DDB_ENDPOINT` wiring keeps the knob
 * discoverable via `getRuntimeConfig` rather than hidden in SDK magic.
 */
export function getDdbClient(config: RuntimeConfig): DynamoDBDocumentClient {
    const endpoint = config.ddbEndpoint;
    const cacheKey = `${config.awsRegion ?? 'default'}|${endpoint ?? ''}`;
    if (cachedDdbClient?.cacheKey === cacheKey) {
        return cachedDdbClient.client;
    }

    const client = new DynamoDBClient({
        region: config.awsRegion,
        ...(endpoint ? { endpoint } : {}),
    });

    cachedDdbClient = {
        cacheKey,
        client: DynamoDBDocumentClient.from(client),
    };
    return cachedDdbClient.client;
}
