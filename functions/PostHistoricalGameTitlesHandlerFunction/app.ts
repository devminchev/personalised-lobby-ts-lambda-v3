import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    IClient,
    ErrorCode,
    logError,
    handleSpaceLocalization,
    ARCHIVED_GAMES_WRITE_ALIAS,
    GAME_V2_TYPE,
    SITEGAME_V2_TYPE,
    CanonicalRequest,
    verifyRequest,
    ClientAPI,
    createClient,
    Entry,
    GamePostRequest,
    SiteGamePostRequest,
    patchVentureName,
} from 'os-client';

type HttpMethod = 'GET' | 'PATCH' | 'HEAD' | 'POST' | 'DELETE' | 'OPTIONS' | 'PUT';

const ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;
const CONTENTFUL_SPACE_ID = process.env.SPACE_ID;
const CONTENTFUL_ENV = process.env.CONTENTFUL_ENVIRONMENT;
const ALLOWED_EVENT_TRIGGER_ENV = 'master';

if (!ACCESS_TOKEN || !CONTENTFUL_SPACE_ID || !CONTENTFUL_ENV) {
    throw new Error('Missing Contentful access token or space id or environment');
}

const CONTENTFUL_CLIENT = createClient({ accessToken: process.env.CONTENTFUL_ACCESS_TOKEN || '' });

/**
 * PostHistoricalGameTitlesHandlerFunction
 * Version: 1.0.1
 * Purpose: Manages and updates historical game title data.
 * Last updated: 2025-04-01-7
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
export interface HistoricGameTitleResponse {
    gameSkin: string;
    name: string;
    title: string;
}

const TTL = 60; // 60 seconds

const getGameDataFromContentful = async (
    objectId: string,
    contentfulClient: ClientAPI | undefined,
): Promise<Entry | null> => {
    // Get the game by objectId
    const query = {
        // 'sys.archivedAt[exists]': true,
        'sys.id': objectId,
    };
    const spaceClient = await contentfulClient?.getSpace(CONTENTFUL_SPACE_ID);
    const spaceEnvClient = await spaceClient?.getEnvironment(CONTENTFUL_ENV);
    const initialResponse = await spaceEnvClient?.getEntries({
        limit: 1,
        ...query,
    });
    const ans = initialResponse && initialResponse?.items.length > 0 ? initialResponse?.items[0] : null;
    return ans;
};

const siteGameResponseBody = (entry: Entry, spaceLocale: string): SiteGamePostRequest => {
    const { game, ...sitegameFields } = entry.fields;
    const gameId = entry.fields.game[spaceLocale].sys.id;
    const siteGameBody = {
        entryId: entry.sys.id,
        routeId: gameId,
        payload: {
            doc: {
                game_to_sitegame: {
                    name: 'sitegame',
                    parent: gameId,
                },
                siteGame: {
                    ...sitegameFields,
                    id: entry.sys.id,
                    contentType: entry.sys.contentType.sys.id,
                    cmsEnv: entry.sys.environment.sys.id,
                    gameId,
                    game: [],
                    createdAt: entry.sys.createdAt,
                    updatedAt: entry.sys.updatedAt,
                    version: entry.sys.version,
                    publishedAt: entry.sys.publishedAt,
                    publishedVersion: entry.sys.publishedVersion,
                    venture: entry.fields.venture,
                    entryTitle: entry.fields.entryTitle,
                    environment:
                        entry.fields.environment?.[spaceLocale].length > 0 ? entry.fields.environment[spaceLocale] : [],
                    environmentVisibility:
                        entry.fields.environmentVisibility?.[spaceLocale].length > 0
                            ? entry.fields.environmentVisibility
                            : {},
                    sash: entry.fields.sash,
                    chat: entry.fields.chat,
                    maxBet: entry.fields.maxBet,
                    minBet: entry.fields.minBet,
                    howToPlayContent: entry.fields.howToPlayContent,
                },
            },
            doc_as_upsert: true,
        },
    };

    return siteGameBody;
};

const gameResponseBody = (entry: Entry, spaceLocale: string): GamePostRequest => {
    const payload = {
        entryId: entry.sys.id,
        payload: {
            doc: {
                game_to_sitegame: {
                    name: 'game',
                },
                game: {
                    ...entry.fields,
                    contentType: entry.sys.contentType.sys.id,
                    id: entry.sys.id,
                    cmsEnv: entry.sys.environment.sys.id,
                    platform: entry.fields.platform[spaceLocale],
                    updatedAt: entry.sys.updatedAt,
                    version: entry.sys.version,
                    firstPublishedAt: entry.sys.firstPublishedAt,
                    publishedCounter: entry.sys.publishedCounter,
                    archivedAt: entry.sys.archivedAt,
                    archivedVersion: entry.sys.archivedVersion,
                },
            },
            doc_as_upsert: true,
        },
    };

    return payload;
};

const indexToOpenSearch = async (
    opensearchClient: IClient,
    entry: Entry | null,
    spaceLocale: string,
    indexName: string,
): Promise<void> => {
    if (!entry) {
        throw new Error('No entries to index.');
    }
    const contentType = entry.sys.contentType.sys.id;
    try {
        let responseBody;
        if (contentType === GAME_V2_TYPE) {
            const upsertBody = gameResponseBody(entry, spaceLocale);
            responseBody = await opensearchClient.update({
                index: indexName,
                id: entry.sys.id,
                body: upsertBody?.payload,
                refresh: true,
            });
        } else if (contentType === SITEGAME_V2_TYPE) {
            const upsertBody = siteGameResponseBody(entry, spaceLocale);
            responseBody = await opensearchClient.update({
                index: indexName,
                id: entry.sys.id,
                body: upsertBody?.payload,
                refresh: true,
                routing: upsertBody.routeId,
            });
        }

        if (responseBody?.body.errors) {
            throw new Error(`OpenSearch Bulk Indexing Errors: ${responseBody?.body.items}`);
        }
    } catch (error) {
        throw new Error(`Error indexing data to OpenSearch: ${error}`);
    }
};

function isArchived(entity: Entry): boolean {
    return !!entity.sys.archivedVersion;
}

function isDraft(entity: Entry): boolean {
    return !entity.sys.publishedVersion;
}

const parseEventBody = (event: APIGatewayProxyEvent) => {
    if (!event.body) {
        return { error: 'Missing request body' };
    }

    let parsedBody;
    try {
        parsedBody = JSON.parse(event.body);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return { error: 'Invalid JSON' };
    }

    return parsedBody;
};
const requestVerification = (event: APIGatewayProxyEvent, secretKey: string): boolean => {
    try {
        // Define valid HTTP methods
        const validMethods: Set<HttpMethod> = new Set(['GET', 'PATCH', 'HEAD', 'POST', 'DELETE', 'OPTIONS', 'PUT']);

        if (!validMethods.has(event.httpMethod as HttpMethod)) {
            console.error(`Invalid HTTP method: ${event.httpMethod}`);
            return false;
        }

        // Required security headers from Contentful
        const requiredHeaders = ['x-contentful-signature', 'x-contentful-signed-headers', 'x-contentful-timestamp'];
        const missingHeaders = requiredHeaders.filter((header) => !event.headers?.[header]);

        if (missingHeaders.length > 0) {
            console.error(`Missing required headers: ${missingHeaders.join(', ')}`);
            return false;
        }

        // Normalize headers (convert to lowercase for consistency)
        const headers = Object.fromEntries(
            Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value ?? '']),
        );

        // Ensure the request body is a valid JSON string
        const requestBody = parseEventBody(event);

        // Construct the canonical request object
        const canonicalReq: CanonicalRequest = {
            method: event.httpMethod as HttpMethod,
            path: '/backoffice/v1/historical-game-titles-handler', // Ensure the correct path is passed
            headers: headers,
            body: JSON.stringify(requestBody) || '',
        };

        // console.log('Canonical request:', canonicalReq.path);
        // Perform request verification
        const isValidReq = verifyRequest(secretKey, canonicalReq, TTL);

        if (!isValidReq) {
            console.error('Request verification failed: Invalid signature');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error during request verification:', error);
        return false;
    }
};

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const osClient: IClient = getClient();
    const signingSecret = (process.env['CONTENTFUL_SIGNING_SECRET'] || '').trim();

    //path param
    const platform = event.pathParameters?.platform as string;
    const siteNameFromParams = event.pathParameters?.sitename as string;
    const siteName = patchVentureName(siteNameFromParams);

    try {
        // Ensure request verification before processing
        const isVerifiedRequest = requestVerification(event, signingSecret);
        if (!isVerifiedRequest) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Unauthorized' }),
            };
        }
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing request body' }),
            };
        }
        const payload = JSON.parse(event.body) as {
            sys: {
                id: string;
                version: string;
                space: { sys: { id: string } };
                environment: { sys: { id: string } };
                contentType: { sys: { id: string } };
            };
        };

        const { id, contentType, environment } = payload.sys;
        const contentTypeId = contentType.sys.id;

        if (environment.sys.id !== ALLOWED_EVENT_TRIGGER_ENV) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'The event did not originate from the master environment.' }),
            };
        }

        if (contentTypeId !== GAME_V2_TYPE && contentTypeId !== SITEGAME_V2_TYPE) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Content type not valid' }),
            };
        }

        const spaceLocale = handleSpaceLocalization();
        const environmentId = process.env.CONTENTFUL_ENVIRONMENT;

        if (!environmentId) {
            throw new Error('Missing Contentful environment id');
        }

        const entry = await getGameDataFromContentful(id, CONTENTFUL_CLIENT);

        if (!entry) {
            throw new Error('No entries found in Contentful');
        }

        // Determine whether to index or delete from OpenSearch
        let isUpdated = false;
        if (isArchived(entry) || isDraft(entry)) {
            await indexToOpenSearch(osClient, entry, spaceLocale, ARCHIVED_GAMES_WRITE_ALIAS);
            isUpdated = true;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ updated: isUpdated }),
        };
    } catch (err) {
        console.error('Lambda execution error:', err);
        logError(ErrorCode.ExecutionError, 500, { siteName, platform, err });

        return {
            statusCode: 500,
            body: JSON.stringify({
                code: 'ExecutionError',
                message: err instanceof Error ? err.message : 'Unknown error occurred',
            }),
        };
    }
};
