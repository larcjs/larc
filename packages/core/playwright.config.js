import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit workers in CI for stability
  // Using Python http.server which handles load better than Node's http-server
  // In CI: Use 2 workers for balance of speed and stability
  // Locally: Use default (50% of CPU cores)
  workers: process.env.CI ? 2 : undefined,

  // Reporter to use
  reporter: process.env.CI ? 'github' : 'list',

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like \`await page.goto('/')\`
    baseURL: 'http://localhost:8080',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Increase navigation timeout to handle server load
    navigationTimeout: 30000,
    actionTimeout: 10000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Run local dev server before starting the tests
  // Using Python's http.server which handles concurrent connections better
  // Serve from parent directory so tests can access /core/tests/...
  webServer: {
    command: 'cd .. && python3 -m http.server 8080',
    port: 8080,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
