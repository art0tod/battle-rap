/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts'],
  passWithNoTests: true
};
