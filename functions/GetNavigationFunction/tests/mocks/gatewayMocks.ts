export const API_GATEWAY_PROXY_MOCK = {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/navigation',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
        accountId: '123456789012',
        apiId: 'api-id',
        authorizer: null,
        protocol: 'HTTP/1.1',
        httpMethod: 'GET',
        identity: {
            accessKey: null,
            accountId: null,
            apiKey: null,
            apiKeyId: null,
            caller: null,
            clientCert: null,
            cognitoAuthenticationProvider: null,
            cognitoAuthenticationType: null,
            cognitoIdentityId: null,
            cognitoIdentityPoolId: null,
            principalOrgId: null,
            sourceIp: '127.0.0.1',
            user: null,
            userAgent: 'jest-test',
            userArn: null,
        },
        path: '/navigation',
        requestId: 'req-id',
        requestTimeEpoch: 0,
        resourceId: 'resource-id',
        resourcePath: '/navigation',
        stage: 'test',
    },
    resource: '/navigation',
};

export const mockApiEvent = (...params: any) => {
    const [sitename, platform] = params;
    return {
        ...API_GATEWAY_PROXY_MOCK,
        pathParameters: { sitename, platform },
    };
};
