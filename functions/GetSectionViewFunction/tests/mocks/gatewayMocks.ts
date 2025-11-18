const API_GATEWAY_PROXY_MOCK = {
    httpMethod: 'get',
    body: '',
    headers: {},
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: {},
    path: '/section',
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
        path: '/section',
        resourcePath: '/section',
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
    const [sitename, sectionslug, platform, locale, auth, memberid] = params;

    return {
        ...API_GATEWAY_PROXY_MOCK,
        pathParameters: { sitename, sectionslug, platform },
        queryStringParameters: { locale: locale, auth: auth, memberid: memberid },
    };
};
