import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  // Windows dev-bundle loading can take ~30s per full navigation; UI assertions keep their own limits.
  timeout: 120000,
  use: {
    baseURL: 'http://127.0.0.1:8081',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
  ],
  reporter: [['list']],
  outputDir: 'test-results',
});
