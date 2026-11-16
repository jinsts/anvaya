import { defineConfig, devices } from '@playwright/test';

// Allow a production preview beside an already-running development server.
const previewPort = Number(process.env.PLAYWRIGHT_PORT ?? 4321);
if (!Number.isInteger(previewPort) || previewPort < 1 || previewPort > 65535) {
  throw new Error('PLAYWRIGHT_PORT must be an integer from 1 through 65535.');
}
const previewUrl = `http://127.0.0.1:${previewPort}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: previewUrl, trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
  ],
  webServer: {
    command: `pnpm preview --host 127.0.0.1 --port ${previewPort} --ignore-lock`,
    url: previewUrl,
    reuseExistingServer: !process.env.CI,
  },
});
