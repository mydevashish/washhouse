import { defineConfig, devices } from '@playwright/test';

const e2eApiUrl = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';
const e2eDevEnv = {
  ...process.env,
  NEXT_PUBLIC_API_URL: e2eApiUrl,
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }]] : 'list',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /offline-booking\.spec\.ts|online-booking-contact\.spec\.ts/,
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testIgnore: /offline-booking\.spec\.ts|online-booking-contact\.spec\.ts/,
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
      testIgnore: /offline-booking\.spec\.ts|online-booking-contact\.spec\.ts/,
    },
    {
      name: 'offline-booking',
      testMatch: /offline-booking\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
      },
    },
    {
      name: 'online-booking',
      testMatch: /online-booking-contact\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
    },
  ],
  webServer: process.env.CI
    ? {
        command: 'npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : [
        {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: process.env.E2E_REUSE_DEV_SERVER === '1',
          timeout: 120_000,
          env: e2eDevEnv,
        },
        {
          // Never reuse :3001 — an online-mode leftover flips sticky to Book nearest
          // and breaks offline Book Pickup sticky coverage.
          command: 'npm run dev -- --port 3001',
          url: 'http://localhost:3001',
          reuseExistingServer: true,
          timeout: 120_000,
          env: {
            ...e2eDevEnv,
            NEXT_PUBLIC_FEATURE_ONLINE_BOOKING: 'false',
          },
        },
      ],
});
