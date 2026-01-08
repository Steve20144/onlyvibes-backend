// jest.config.js
/**
 * @file Jest configuration for the OnlyVibes backend tests.
 * @see https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
export default {
  /**
   * The test environment that will be used for testing.
   * 'node' is ideal for a backend application.
   */
  testEnvironment: 'node',

  /**
   * A glob pattern to match test files.
   * This pattern finds any file ending in `.test.js` inside the `tests` directory.
   */
  testMatch: ['**/tests/**/*.test.js'],

  /**
   * Jest will not transform any files, as we are using native ES Modules.
   */
  transform: {},

  /**
   * Specifies which coverage reporters to use.
   * 'json-summary' is great for programmatic analysis.
   * 'text' provides a simple summary in the console.
   * 'lcov' generates an lcov.info file, often used by CI services.
   */
  coverageReporters: ['json-summary', 'text', 'lcov'],
};
