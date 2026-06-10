export default {
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    },
    preset: 'ts-jest',
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageProvider: 'v8',
    testEnvironment: 'node',
    testMatch: ['**/tests/*.test.ts'],
    moduleNameMapper: {
        '^os-client$': '<rootDir>/../../libs/OSClient/index.ts',
        '^os-client/lib/(.*)$': '<rootDir>/../../libs/OSClient/lib/$1',
        '^dynamoClient$': '<rootDir>/../../libs/dynamoClient/index.ts',
        '^@contentful/node-apps-toolkit$': '<rootDir>/tests/__mocks__/emptyModule.ts',
        '^contentful-management$': '<rootDir>/tests/__mocks__/emptyModule.ts',
    },
};
