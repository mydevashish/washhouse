import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome',    use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari',    use: { ...devices['iPhone 13'] } },
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
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: 'npm run dev -- --port 3001',
          url: 'http://localhost:3001',
          reuseExistingServer: true,
          timeout: 120_000,
          env: {
            ...process.env,
            NEXT_PUBLIC_FEATURE_ONLINE_BOOKING: 'false',
          },
        },
      ],
});
