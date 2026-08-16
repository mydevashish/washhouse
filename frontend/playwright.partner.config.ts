import { defineConfig, devices } from '@playwright/test';

/**
 * Partner journey E2E — no dual webServer wait.
 * Expect FE on E2E_BASE_URL (default http://localhost:3000) and API on :8000
 * with QA seed (partner.koramangala@demo.dlm).
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /partner-.*\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
  ],
});
