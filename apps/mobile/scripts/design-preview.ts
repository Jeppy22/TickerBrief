import { chromium, expect, request } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ReportSchema } from '../src/lib/schema';
import colors from '../src/components/colors.json';

// Isolated browser review only. Never imported by the application.
// Replays one real hosted response so before/after financial content is identical.
async function main() {
  const stage = process.argv[2];
  if (stage !== 'before' && stage !== 'after') throw new Error('Use before or after.');
  const api = 'https://tickerbrief-api.onrender.com';
  const app = 'http://127.0.0.1:8081';
  const cache = resolve('../../artifacts/design-review');
  const output = resolve(`../../docs/design/2026-09-17/${stage}`);
  await mkdir(cache, { recursive: true });
  await mkdir(output, { recursive: true });
  const reportFile = resolve(cache, 'aapl-report.json');
  if (stage === 'before') {
    const client = await request.newContext({ timeout: 120000 });
    try {
      const health = await client.get(`${api}/health`);
      expect(health.ok()).toBe(true);
      expect(await health.json()).toMatchObject({ sec_configured: true, ai_enabled: false });
      const response = await client.get(`${api}/v1/reports/AAPL`);
      expect(response.ok()).toBe(true);
      const report = ReportSchema.parse(await response.json());
      expect(report.interpretation.status).toBe('disabled');
      await writeFile(reportFile, JSON.stringify(report, null, 2) + '\n');
    } finally {
      await client.dispose();
    }
  }
  const report = ReportSchema.parse(JSON.parse(await readFile(reportFile, 'utf8')));
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 402, height: 874 } });
    // Fresh, disposable storage: never opens an existing browser profile or user's notes.
    await context.route('**/v1/**', (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/v1/reports/AAPL') return route.fulfill({ json: report });
      if (url.pathname === '/v1/companies')
        return route.fulfill({
          json: {
            companies: [report.company],
            stale: report.stale,
            retrieved_at: report.retrieved_at,
            coverage: 'Recorded hosted AAPL response for browser design review',
          },
        });
      return route.abort();
    });
    const page = await context.newPage();
    await page.goto(app);
    await page.getByRole('textbox', { name: 'Company name or ticker' }).fill('AAPL');
    const renderedInput = await page.getByRole('textbox').evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        color: style.color,
        background: style.backgroundColor,
        placeholder: getComputedStyle(element, '::placeholder').color,
        border: style.borderColor,
        outline: style.outlineColor,
        fontFamily: style.fontFamily,
      };
    });
    if (stage === 'after') {
      const rgb = (hex: string) =>
        `rgb(${hex
          .match(/[a-f\d]{2}/gi)!
          .map((value) => parseInt(value, 16))
          .join(', ')})`;
      expect(renderedInput).toMatchObject({
        color: rgb(colors.textPrimary),
        background: rgb(colors.surface),
        placeholder: rgb(colors.textSecondary),
        border: rgb(colors.actionPrimary),
      });
    }
    await page.screenshot({ path: resolve(output, 'search.png') });
    await page.getByRole('button', { name: 'Search companies', exact: true }).click();
    await page.getByRole('button', { name: 'Read AAPL brief', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: report.company.name, exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: resolve(output, 'report.png') });
    await page
      .getByRole('button', { name: 'Inspect revenue evidence', exact: true })
      .first()
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: resolve(output, 'report-values.png') });
    await page
      .getByRole('button', { name: 'Inspect revenue evidence', exact: true })
      .first()
      .click();
    await expect(page.getByTestId('source-notebook')).toBeVisible();
    await expect
      .poll(async () => Math.abs((await page.getByTestId('source-notebook').boundingBox())!.y))
      .toBeLessThan(1);
    await page.screenshot({ path: resolve(output, 'evidence.png') });
    await page.getByRole('button', { name: 'Close evidence', exact: true }).click();
    await page.getByRole('button', { name: 'Add to watchlist', exact: true }).click();
    await page.getByRole('button', { name: 'Save report & add notes' }).click();
    await page
      .getByRole('textbox', { name: 'Personal research notes' })
      .fill(
        'DESIGN PREVIEW NOTE — example only.\nReview the reporting periods and original revenue evidence before drawing a conclusion.',
      );
    await page.getByRole('button', { name: 'Save notes', exact: true }).click();
    await expect(page.getByText('Notes saved on this device.')).toBeVisible();
    const savedUrl = page.url();
    await page.getByRole('heading', { name: 'Your notes', exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: resolve(output, 'saved-notes.png') });
    for (const route of ['watchlist', 'saved', 'settings']) {
      await page.goto(`${app}/${route}`);
      await expect(
        page.getByRole('heading', {
          name:
            route === 'saved' ? 'Saved research' : route === 'watchlist' ? 'Watchlist' : 'Settings',
          exact: true,
        }),
      ).toBeVisible();
      await page.screenshot({ path: resolve(output, `${route}.png`) });
    }
    if (stage === 'after') {
      for (const width of [320, 430]) {
        await page.setViewportSize({ width, height: 874 });
        for (const [name, url] of [
          ['search', app],
          ['saved-notes', savedUrl],
        ]) {
          await page.goto(url);
          await expect(page.getByRole('textbox').first()).toBeVisible();
          // Browser approximation only; does not claim native Dynamic Type coverage.
          await page.evaluate(() => {
            document.querySelectorAll<HTMLElement>('[dir="auto"]').forEach((element) => {
              const style = getComputedStyle(element);
              element.style.fontSize = `${parseFloat(style.fontSize) * 2}px`;
              if (Number.isFinite(parseFloat(style.lineHeight)))
                element.style.lineHeight = `${parseFloat(style.lineHeight) * 2}px`;
            });
          });
          if (name === 'saved-notes')
            await page
              .getByRole('textbox')
              .evaluate((element) => element.scrollIntoView({ block: 'start' }));
          await page.screenshot({ path: resolve(output, `${name}-${width}-2x.png`) });
        }
      }
    }
    await writeFile(
      resolve(output, 'capture.json'),
      JSON.stringify(
        {
          stage,
          capturedAt: new Date().toISOString(),
          environment: 'Chromium browser preview, not physical iPhone',
          viewport: { width: 402, height: 874 },
          reportSource: `${api}/v1/reports/AAPL`,
          reportId: report.id,
          retrievedAt: report.retrieved_at,
          generatedAt: report.generated_at,
          aiEnabled: false,
          renderedInput,
          content:
            'Same recorded real hosted report for both stages; preview note is explicitly an example; isolated browser storage.',
        },
        null,
        2,
      ) + '\n',
    );
    console.log(`Captured ${stage} browser previews in ${output}`);
  } finally {
    await browser.close();
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
