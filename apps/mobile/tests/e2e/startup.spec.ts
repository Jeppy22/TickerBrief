import { expect, test } from '@playwright/test';
import { STORAGE_KEY } from '../../src/lib/storage';
import { fixtureReport } from '../fixtures';

for (const condition of ['delayed', 'failed'] as const) {
  test(`web startup explains a ${condition} bundle and preserves saved notes on recovery`, async ({
    page,
  }, testInfo) => {
    const library = JSON.stringify({
      version: 1,
      watchlist: [],
      saved: [
        {
          id: 'startup-existing-snapshot',
          savedAt: '2026-09-17T00:00:00Z',
          report: fixtureReport,
          notes: 'Existing notes before the browser startup problem.',
          notesUpdatedAt: null,
        },
      ],
    });
    await page.addInitScript(
      ({ key, value }) => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, value);
      },
      { key: STORAGE_KEY, value: library },
    );
    await page.route('**/v1/**', (route) => route.abort());
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const bundle = /\/node_modules\/expo-router\/entry\.bundle\?/;
    await page.route(bundle, async (route) => {
      if (condition === 'failed') return route.abort('failed');
      await gate;
      return route.continue();
    });
    try {
      await page.goto('/', { waitUntil: 'commit' });
      await expect(page.getByRole('status')).toHaveText('Loading TickerBrief…');
      await expect(page.getByRole('link', { name: 'Reload TickerBrief' })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`startup-${condition}.png`) });
      if (condition === 'failed') {
        await page.unroute(bundle);
        await page.getByRole('link', { name: 'Reload TickerBrief' }).click();
      } else {
        release();
      }
      await expect(page.getByRole('heading', { name: 'Research a company' })).toBeVisible({
        timeout: 60000,
      });
      await expect(page.locator('#startup')).toHaveCount(0);
      expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(library);
      await page.getByRole('tab', { name: 'Saved Research', exact: true }).click();
      await page.getByRole('button', { name: 'Open saved report', exact: true }).click();
      await expect(page.getByRole('textbox', { name: 'Personal research notes' })).toHaveValue(
        'Existing notes before the browser startup problem.',
      );
    } finally {
      release();
    }
  });
}
