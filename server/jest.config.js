module.exports = {
  // Global Jest configuration
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  rootDir: './src',
  
  // Separate test patterns: unit tests (*.spec.ts) and contract tests (*.contract.test.ts)
  testRegex: '.*\\.(spec|contract\\.test)\\.ts$',
  
  // Force sequential execution for contract tests to avoid database conflicts
  // This is set via maxWorkers to ensure all tests share the same database safely
  maxWorkers: '50%', // Allows parallel unit tests but will be overridden for contract-only runs
};

