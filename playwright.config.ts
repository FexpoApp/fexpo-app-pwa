import { defineConfig } from '@playwright/test';

const port = Number(process.env.PWA_TEST_PORT || 4174);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('PWA_TEST_PORT no es válido.');
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/browser',
  testMatch:
    process.env.PWA_TEST_MODE === 'local'
      ? 'local.spec.ts'
      : process.env.PWA_TEST_MODE === 'live'
        ? 'live.spec.ts'
        : 'app.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 7000 },
  reporter: 'list',
  use: {
    baseURL,
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
