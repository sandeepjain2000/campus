const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './qa/tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,                     // retry once on flaky failures
  workers: 1,                     // single worker — avoid DB concurrency issues
  reporter: 'html',

  // ── Global timeout settings ───────────────────────────────────────────────
  timeout: 90_000,                // max time per test (90 s)
  expect: {
    timeout: 15_000,              // max time an expect() assertion waits (15 s)
  },

  use: {
    baseURL: 'http://127.0.0.1:3000',

    // Give every navigation / action up to 30 s to complete (local Next.js dev is slow)
    navigationTimeout: 30_000,
    actionTimeout:     15_000,

    // Slow down clicks/types by 150 ms so the page has time to react
    launchOptions: {
      slowMo: 150,
    },

    trace:      'on-first-retry',
    screenshot: 'only-on-failure',
    video:      'on-first-retry',  // capture video on failures for debugging
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,    // always reuse if already running
    timeout: 120_000,
  },
});
