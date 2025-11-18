const API_GATEWAY_PROXY_MOCK = {
    httpMethod: 'get',
    body: '',
    headers: {},
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: {},
    path: '/hello',
    queryStringParameters: {},
    requestContext: {
        accountId: '123456789012',
        apiId: '1234',
        authorizer: {},
        httpMethod: 'get',
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
        path: '/hello',
        resourcePath: '/hello',
        protocol: 'HTTP/1.1',
        requestId: 'req-id',
        requestTimeEpoch: 1428582896000,
        resourceId: 'resource-id',
        stage: 'test',
    },
    resource: '',
    stageVariables: {},
};

export const mockApiEvent = (...params: any) => {
    const [sitename, platform] = params;

    return {
        ...API_GATEWAY_PROXY_MOCK,
        pathParameters: { sitename, platform },
    };
};
