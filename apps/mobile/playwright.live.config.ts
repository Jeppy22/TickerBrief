import { defineConfig } from '@playwright/test';
import config from './playwright.config';

// Explicit opt-in: normal browser tests remain synthetic and make no SEC requests.
export default defineConfig({
  ...config,
  testDir: './tests/live',
  // Covers two 90-second network waits plus local navigation and a browser restart.
  timeout: 240000,
  retries: 0,
  maxFailures: 1,
  outputDir: 'test-results/live',
});
