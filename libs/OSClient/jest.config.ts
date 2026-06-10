/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

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
        '^dynamoClient$': '<rootDir>/../dynamoClient/index.ts',
        '^@contentful/node-apps-toolkit$': '<rootDir>/tests/__mocks__/emptyModule.ts',
        '^contentful-management$': '<rootDir>/tests/__mocks__/emptyModule.ts',
    },
};
