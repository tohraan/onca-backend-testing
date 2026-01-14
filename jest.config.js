const nextJest = require('next/jest')

const createJestConfig = nextJest({
    dir: './',
})

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    roots: [
        '<rootDir>',
        '<rootDir>/../../core',
    ],
    testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.test.tsx',
        '**/core/**/*.test.ts',
    ],
    collectCoverageFrom: [
        '../../core/**/*.ts',
        'src/app/api/**/*.ts',
        '!**/*.test.ts',
        '!**/__tests__/**',
        '!**/node_modules/**',
    ],
    coverageThreshold: {
        '../../core/derivation/**/*.ts': {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
    preset: 'ts-jest',
}

module.exports = createJestConfig(customJestConfig)
