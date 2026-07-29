import { defineConfig, devices } from '@playwright/test';

/**
 * Critical-path a11y (axe + keyboard + touch).
 * Expect FE on E2E_BASE_URL (default http://localhost:3000) and API on :8000.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /critical-a11y\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
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
  projects: [{ name: 'chromium-mobile', use: { ...devices['Pixel 7'] } }],
});
