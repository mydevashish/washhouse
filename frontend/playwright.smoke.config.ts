import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke E2E — home + discover only, no dual webServer (BUG-009 workaround).
 * Expect FE on E2E_BASE_URL (default http://localhost:3000).
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /smoke\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } }],
});
