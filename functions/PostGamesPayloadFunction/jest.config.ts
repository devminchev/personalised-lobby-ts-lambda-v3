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
    testMatch: ['**/tests/*.test.ts', '**/tests/*.test.js'],
    modulePathIgnorePatterns: ['/\\.nx\\/cache\\//', '/\\/dist\\//'],
    haste: {
        throwOnModuleCollision: false,
    },

    moduleNameMapper: {
        '^os-client$': '<rootDir>/../../libs/OSClient/index.ts',
        '^os-client/lib/(.*)$': '<rootDir>/../../libs/OSClient/lib/$1',
        '^@contentful/node-apps-toolkit$': '<rootDir>/tests/__mocks__/emptyModule.ts',
        '^contentful-management$': '<rootDir>/tests/__mocks__/emptyModule.ts',
    },
};
