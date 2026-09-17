import { chromium, expect, test } from '@playwright/test';
import { ReportSchema } from '../../src/lib/schema';

const api = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const app = 'http://127.0.0.1:8081';

test.beforeAll(async ({ request }) => {
  const response = await request.get(`${api}/health`, {
    headers: { Origin: app },
    timeout: 120000,
  });
  expect(response.ok()).toBe(true);
  expect(await response.json()).toMatchObject({
    service: 'TickerBrief',
    sec_configured: true,
    ai_enabled: false,
  });
  expect(
    response.headers()['access-control-allow-origin'],
    `The backend must allow the browser origin ${app}; do not bypass CORS in this live suite.`,
  ).toBe(app);
});

for (const [ticker, query] of [
  ['AAPL', 'Apple'],
  ['MSFT', 'MSFT'],
  ['RKLB', 'Rocket Lab'],
]) {
  test(`live ${ticker}: search, evidence, versions and notes survive browser restart without API access`, async ({}, testInfo) => {
    const profile = testInfo.outputPath('browser-profile');
    const options = { headless: true, viewport: { width: 390, height: 844 } };
    let context = await chromium.launchPersistentContext(profile, options);
    try {
      // Only the API whose disabled-AI health was checked above may receive research requests.
      await context.route('**/v1/**', (route) =>
        new URL(route.request().url()).origin === api ? route.continue() : route.abort(),
      );
      const page = await context.newPage();
      await page.goto(app);
      await page.getByRole('textbox', { name: 'Company name or ticker' }).fill(query);
      await page.getByRole('button', { name: 'Search companies', exact: true }).click();
      // The app allows 90 seconds for each research request, including a host wake-up.
      const readBrief = page.getByRole('button', { name: `Read ${ticker} brief`, exact: true });
      await expect(readBrief).toBeVisible({ timeout: 95000 });
      const pending = page.waitForResponse(`${api}/v1/reports/${ticker}`, { timeout: 95000 });
      await readBrief.click();
      const response = await pending;
      expect(response.ok()).toBe(true);
      const report = ReportSchema.parse(await response.json());
      expect(report.company.ticker).toBe(ticker);
      expect(report.stale).toBe(false);
      expect(report.interpretation.status).toBe('disabled');
      expect(report.overview).toBeTruthy();
      await expect(
        page.getByRole('heading', { name: report.company.name, exact: true }),
      ).toBeVisible();
      await expect(page.getByText(report.overview!, { exact: true })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('live-report.png') });

      const revenue = report.periods[0].metrics.find((metric) => metric.key === 'revenue')!;
      const evidence = report.sources.find(
        (source) => source.id === revenue.current?.source_ids[0],
      )!;
      expect(evidence.kind).toBe('reported_fact');
      expect(new URL(evidence.url).hostname).toBe('www.sec.gov');
      await page
        .getByRole('button', { name: 'Inspect revenue evidence', exact: true })
        .first()
        .click();
      await page.getByRole('button', { name: 'Technical details', exact: true }).first().click();
      await expect(page.getByText(evidence.excerpt, { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Close evidence' }).click();
      await page.getByRole('button', { name: 'Add to watchlist', exact: true }).click();
      await page.getByRole('button', { name: 'Save report & add notes' }).click();
      const notes = `Live browser verification for ${ticker}. Revisit the original filing.`;
      await page.getByRole('textbox', { name: 'Personal research notes' }).fill(notes);
      await page.getByRole('button', { name: 'Save notes', exact: true }).click();
      await expect(page.getByText('Notes saved on this device.')).toBeVisible();
      const savedUrl = page.url();
      await page.getByRole('button', { name: 'Open current research' }).click();
      await page.getByRole('button', { name: 'Save report & add notes' }).click();
      expect(page.url()).not.toBe(savedUrl);
      await page.goto(`${app}/saved`);
      await expect(page.getByRole('button', { name: 'Open saved report' })).toHaveCount(2);

      // Close the browser process, then reopen its on-disk profile. No storage-state injection.
      await context.close();
      context = await chromium.launchPersistentContext(profile, options);
      await context.route('**/v1/**', (route) => route.abort('internetdisconnected'));
      const reopened = await context.newPage();
      await reopened.goto(savedUrl);
      await expect(reopened.getByRole('textbox', { name: 'Personal research notes' })).toHaveValue(
        notes,
      );
      await expect(reopened.getByText(revenue.explanation, { exact: true })).toBeVisible();
      await reopened
        .getByRole('button', { name: 'Inspect revenue evidence', exact: true })
        .first()
        .click();
      await reopened
        .getByRole('button', { name: 'Technical details', exact: true })
        .first()
        .click();
      await expect(reopened.getByText(evidence.excerpt, { exact: true })).toBeVisible();
      await reopened.getByRole('button', { name: 'Close evidence' }).click();
      await reopened.goto(`${app}/saved`);
      await expect(reopened.getByRole('button', { name: 'Open saved report' })).toHaveCount(2);
      await reopened.goto(`${app}/watchlist`);
      await expect(reopened.getByRole('button', { name: `Read ${ticker} brief` })).toBeVisible();

      if (ticker === 'AAPL') {
        await reopened.goto(savedUrl);
        const offlineNotes = `${notes} Edited while API access was blocked.`;
        await reopened.getByRole('textbox', { name: 'Personal research notes' }).fill(offlineNotes);
        await reopened.getByRole('button', { name: 'Save notes', exact: true }).click();
        await expect(reopened.getByText('Notes saved on this device.')).toBeVisible();
        await reopened.reload();
        await expect(
          reopened.getByRole('textbox', { name: 'Personal research notes' }),
        ).toHaveValue(offlineNotes);
        await reopened.getByRole('button', { name: 'Open current research' }).click();
        await expect(reopened.getByText(/Unable to reach research/)).toBeVisible();
        // Restore direct access to the same real backend, then exercise the user's retry action.
        await context.unroute('**/v1/**');
        await context.route('**/v1/**', (route) =>
          new URL(route.request().url()).origin === api ? route.continue() : route.abort(),
        );
        await reopened.getByRole('button', { name: 'Retry research', exact: true }).click();
        await expect(
          reopened.getByRole('heading', { name: report.company.name, exact: true }),
        ).toBeVisible({ timeout: 95000 });
        await expect(reopened.getByRole('alert')).toHaveCount(0);
      }
    } finally {
      await context.close();
    }
  });
}
