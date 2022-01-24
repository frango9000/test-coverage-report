module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  coverageReporters: ['lcov'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: true
}
