import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    checkRequestParams,
    patchVentureName,
    validators,
    errorResponseHandler,
    gzipResponse,
} from 'os-client';
import { getPersData } from './lib';

/**
 * GetPersonalisedExtraDataFunction
 * Version: 1.0.1
 * Purpose: Retrieves additional personalized data for enhanced user experience.
 * Last updated: 2025-04-01-7
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
    const memberId = event.queryStringParameters?.memberid as string;

    try {
        const client = getClient();

        checkRequestParams([siteName, validators.siteName], [memberId, validators.memberId]); //400

        const extraData = await getPersData(client, memberId, siteName, platform);

        return gzipResponse(extraData);
    } catch (err) {
        const errorLogParams = {
            eventReqId,
            siteName,
            platform,
            memberId,
        };
        return errorResponseHandler(err, {}, errorLogParams);
    }
};
