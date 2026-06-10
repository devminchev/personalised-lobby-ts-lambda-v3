import { Client } from '@opensearch-project/opensearch';
import { ErrorCode, createError } from './errors';
import { BreakerClient, NonTrippableError } from './breakerClient';
import type { ServiceTier } from './breakerClient';

/** Circuit-breaker config injected at the call site in each Lambda handler. */
export interface BreakerConfig {
    /** Service tier — drives HALF_OPEN behaviour. Defaults to `'A'`. */
    tier?: ServiceTier;
    /** Master on/off switch. Defaults to `false`. */
    enabled?: boolean;
}

export interface SearchResponse<T, S = any> {
    hits: {
        total: { value: number };
        max_score: number;
        hits: IHits<T, S>[];
    };
    aggregations?: IAggregates<T>;
}

interface IHits<T, S = any> {
    _index: string;
    _type: string;
    _id: string;
    _score: number;
    _source: T;
    inner_hits?: InnerHits<S>;
}

interface IAggregates<T> {
    group_by_category: {
        buckets: IBucket<T>;
    };
}

export interface IBucket<T> {
    [category: string]: {
        doc_count: number;
        top_documents: {
            hits: {
                hits: IHits<T>[];
            };
        };
    };
}

interface InnerHits<T> {
    game?: {
        hits: {
            hits: Array<{
                _source: T;
            }>;
        };
    };
    sitegame?: {
        hits: {
            hits: Array<{
                _source: T;
            }>;
        };
    };
}

export interface GetDocResponse<T> {
    _index: string;
    _id: string;
    found: boolean;
    _source?: T;
}

// Define the CustomClient interface to include the custom search method
interface CustomClient extends Client {
    searchWithHandling: <T, S = any>(query: object, index: string) => Promise<SearchResponse<T, S>>;
    getDocWithHandling<T>(index: string, id: string): Promise<T | null>;
}

let client: CustomClient | null = null;

export const getClient = (breakerConfig: BreakerConfig = {}): CustomClient => {
    if (!client) {
        const newClient = new Client({
            node: process.env.HOST,
            auth: {
                username: process.env.OS_USER as string,
                password: process.env.OS_PASS as string,
            },
            agent: {
                keepAlive: true,
                keepAliveMsecs: 240000,
                maxSockets: 50,
            },
        }) as CustomClient;
        console.warn('Initializing breaker client with config', {
            tier: breakerConfig.tier,
            enabled: breakerConfig.enabled,
            tableName: process.env.CB_DDB_TABLE ?? 'undefined',
        });
        const breaker = new BreakerClient({
            tableName: process.env.CB_DDB_TABLE ?? '',
            tier: breakerConfig.tier ?? 'C',
            enabled: breakerConfig.enabled ?? false,
        });
        console.warn('Breaker client initialized');

        // Seed the global breaker-state cache from DynamoDB on first warm-instance
        // call (cold start). Fire-and-forget — subsequent warm requests use the
        // cached value; no per-request DDB round-trip.
        if (process.env.CB_DDB_TABLE) {
            void breaker.init();
        }

        newClient.searchWithHandling = async <T, S = any>(
            query: object,
            index: string,
        ): Promise<SearchResponse<T, S>> => {
            return breaker.withOsCall(async () => {
                try {
                    const response = await newClient.search({
                        index,
                        body: query,
                        request_cache: true,
                    });

                    return response.body as SearchResponse<T, S>;
                } catch (err: any) {
                    console.error({
                        error: err?.message,
                        statusCode: err?.statusCode,
                        errorCode: ErrorCode.OpenSearchClientError,
                        details: {
                            origin: `opensearch client ApiError error (@opensearch-project/opensearch) when querying index ${index}`,
                            name: err?.name,
                            errorBody: err?.body || err,
                        },
                    });

                    const mapped = createError(ErrorCode.ServerError, 500, 'Internal Server Error');
                    const status: number | undefined = err?.statusCode;
                    const nonTrippedCondition =
                        typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 429;
                    if (nonTrippedCondition) {
                        throw new NonTrippableError(mapped);
                    }
                    throw mapped;
                }
            });
        };

        newClient.getDocWithHandling = async <T>(index: string, id: string): Promise<T | null> => {
            return breaker.withOsCall(async () => {
                try {
                    const response = await newClient.get({
                        index,
                        id,
                    });

                    const body = response.body as GetDocResponse<T>;

                    // if found is false or _source is missing, return null
                    if (!body.found || !body._source) {
                        return null;
                    }

                    return body._source;
                } catch (err: any) {
                    // Treat 404 as "not found" instead of an error
                    if (err?.statusCode === 404) {
                        return null;
                    }

                    console.error({
                        error: err?.message,
                        statusCode: err?.statusCode,
                        errorCode: ErrorCode.OpenSearchClientError,
                        details: {
                            origin: `opensearch client ApiError error (@opensearch-project/opensearch) when getting document ${id} from index ${index}`,
                            name: err?.name,
                            errorBody: err?.body || err,
                        },
                    });

                    const mapped = createError(ErrorCode.ServerError, 500, 'Internal Server Error');
                    const status: number | undefined = err?.statusCode;
                    const nonTrippedCondition =
                        typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 429;
                    if (nonTrippedCondition) {
                        throw new NonTrippableError(mapped);
                    }
                    throw mapped;
                }
            });
        };

        client = newClient;
    }
    return client;
};

export type IClient = CustomClient;
