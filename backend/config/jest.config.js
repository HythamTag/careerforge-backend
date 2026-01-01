/**
 * Jest configuration
 */

module.exports = {
  rootDir: "..",
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/app.js",
    "!src/workers/**",
    "!src/config/**",
  ],
  testMatch: ["**/tests/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  moduleNameMapper: {
    "^@core(.*)$": "<rootDir>/src/core$1",
    "^@shared(.*)$": "<rootDir>/src/shared$1",
    "^@modules(.*)$": "<rootDir>/src/modules$1",
    "^@config(.*)$": "<rootDir>/src/core/config$1",
    "^@utils(.*)$": "<rootDir>/src/core/utils$1",
    "^@errors(.*)$": "<rootDir>/src/core/errors$1",
    "^@middleware(.*)$": "<rootDir>/src/core/middleware$1",
    "^@constants(.*)$": "<rootDir>/src/core/constants$1",
    "^@ai(.*)$": "<rootDir>/src/shared/external/ai$1",
    "^@infrastructure(.*)$": "<rootDir>/src/core/infrastructure$1",
    "^@storage(.*)$": "<rootDir>/src/shared/external/storage$1",
    "^@messaging(.*)$": "<rootDir>/src/shared/messaging$1",
    "^@pdf(.*)$": "<rootDir>/src/shared/external/pdf$1"
  },
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
