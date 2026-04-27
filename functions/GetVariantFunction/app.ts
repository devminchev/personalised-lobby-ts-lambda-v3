import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getClient,
    IClient,
    checkRequestParams,
    patchVentureName,
    logMessage,
    validators,
    errorResponseHandler,
    AB_VARIANT_INDEX_ALIAS,
    AbVariant,
    ErrorCode,
    gzipResponse,
} from 'os-client';

/**
 * GetVariantFunction
 * Version: 1.0.1
 * Purpose: Retrieves game navigation and classification data.
 * Last updated: 2025-04-01-7
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

type Variant = {
    variant: AbVariant;
    cluster_label: number;
    venture: string;
    expiry?: string;
};

type VariantResponse = { variant: Variant['variant'] };

const DEFAULT_VARIANT: VariantResponse = { variant: AbVariant.Unaffected };

const isVariantExpired = (expiryIso: string): boolean => {
    const expiryTime = Date.parse(expiryIso);

    // If parsing fails, treat as expired (safer default)
    if (Number.isNaN(expiryTime)) {
        return true;
    }

    return expiryTime <= Date.now();
};

const getVariant = async (client: IClient, memberId: string, siteName: string): Promise<VariantResponse> => {
    const variantData = await client.getDocWithHandling<Variant>(AB_VARIANT_INDEX_ALIAS, memberId);

    if (!variantData) {
        logMessage('warn', ErrorCode.MissingVariant, { memberId, siteName });
        return DEFAULT_VARIANT;
    }

    if (!variantData.expiry || isVariantExpired(variantData.expiry)) {
        return DEFAULT_VARIANT;
    }

    if (variantData.venture !== siteName) {
        logMessage('warn', ErrorCode.VariantMemberVentureMismatch, {
            memberId,
            siteName,
            variantVenture: variantData.venture,
        });
    }

    return { variant: variantData.variant };
};

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const eventReqId = event?.requestContext?.requestId;

    //path param
    const siteNameFromParams = event.pathParameters?.sitename as string;
    const siteName = patchVentureName(siteNameFromParams);
    const memberId = event.pathParameters?.memberid as string;

    try {
        const client = getClient();

        checkRequestParams([siteName, validators.siteName], [memberId, validators.memberId]);

        const variant = await getVariant(client, memberId, siteName);

        return gzipResponse(variant);
    } catch (err) {
        const errorLogParams = {
            eventReqId,
            siteName,
            memberId,
        };
        return errorResponseHandler(err, {}, errorLogParams);
    }
};
