import { defineConfig } from '@playwright/test';
import config from './playwright.config';

// Explicit opt-in: normal browser tests remain synthetic and make no SEC requests.
export default defineConfig({
  ...config,
  testDir: './tests/live',
  timeout: 120000,
  retries: 0,
  outputDir: 'test-results/live',
});
