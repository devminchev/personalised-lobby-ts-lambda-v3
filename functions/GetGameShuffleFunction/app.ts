import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    validateLocaleQuery,
    handleSpaceLocalization,
    checkRequestParams,
    getVentureId,
    patchVentureName,
    validators,
    errorResponseHandler,
    jsonSizeInMb,
    gzipResponse,
} from 'os-client';
import { getGameShuffleData, getGamesSiteGamesOnGameSkin } from './lib/processGames';
import { constructResponse } from './lib/utils';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const eventReqId = event?.requestContext?.requestId;
    //path param
    const siteNameFromParams = event.pathParameters?.sitename as string;
    const siteName = patchVentureName(siteNameFromParams);
    const platform = event.pathParameters?.platform as string;

    //query param
    const userLocale: string = validateLocaleQuery(event.queryStringParameters?.locale);

    try {
        checkRequestParams([siteNameFromParams, validators.siteName], [platform, validators.platform]);

        const client = getClient();
        const spaceLocale = handleSpaceLocalization();

        const ventureId = await getVentureId(client, siteName, spaceLocale, platform);

        const gameShuffle = await getGameShuffleData(client, siteName, platform);

        const firstBucketHits = gameShuffle.firstBucket;
        const secondThirdBucketHits = gameShuffle.secondThirdBucket;

        const [firstBucketGames, secondThirdBucketGames] = await Promise.all([
            getGamesSiteGamesOnGameSkin(client, ventureId, siteName, platform, spaceLocale, firstBucketHits),
            getGamesSiteGamesOnGameSkin(client, ventureId, siteName, platform, spaceLocale, secondThirdBucketHits),
        ]);

        const gameShuffleResponse = constructResponse(
            firstBucketGames,
            secondThirdBucketGames,
            spaceLocale,
            userLocale,
            platform,
            false,
        );

        console.info('game-shuffle-uncompressed-response-size', { sizeInMb: jsonSizeInMb(gameShuffleResponse) });

        return gzipResponse(gameShuffleResponse, 200, {
            'X-Request-Id-timestamp': `Lambda invoked at: ${new Date().toISOString()}`,
        });
    } catch (err) {
        const errorLogParams = {
            eventReqId,
            siteNameFromParams,
            platform,
            userLocale,
        };

        return errorResponseHandler(err, [], errorLogParams);
    }
};
