module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/src/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
    '!src/setupTests.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx}'
  ],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/cypress/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)'
  ],
  // Timer and cleanup configurations
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  // Force exit to prevent hanging
  forceExit: true,
  // Detect open handles
  detectOpenHandles: true,
  // Max workers for better resource management
  maxWorkers: '50%',
  // Verbose output for debugging
  verbose: false,
  // Additional Jest options for stability
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  }
};