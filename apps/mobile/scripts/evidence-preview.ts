import { chromium, expect, Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ReportSchema } from '../src/lib/schema';

async function scaleText(page: Page, factor: number) {
  await page.evaluate((factor) => {
    document.querySelectorAll<HTMLElement>('[dir="auto"]').forEach((element) => {
      const style = getComputedStyle(element);
      const font = Number(element.dataset.baseFont || parseFloat(style.fontSize));
      const line = Number(element.dataset.baseLine || parseFloat(style.lineHeight));
      element.dataset.baseFont = String(font);
      element.dataset.baseLine = String(line);
      element.style.fontSize = `${font * factor}px`;
      if (Number.isFinite(line)) element.style.lineHeight = `${line * factor}px`;
    });
  }, factor);
}

async function main() {
  // Real previously verified SEC report, kept in ignored local artifacts. No live request.
  const input = resolve(process.argv[2] || '../../artifacts/live-report-RKLB.json');
  const report = ReportSchema.parse(JSON.parse(await readFile(input, 'utf8')));
  expect(report.interpretation.status).toBe('disabled');
  const metric = report.periods[0].metrics.find((metric) => metric.key === 'net_income')!;
  const source = report.sources.find((source) => source.id === metric.current?.source_ids[0])!;
  const output = resolve('../../docs/design/2026-09-17/evidence');
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 402, height: 874 } });
    await context.route('**/v1/**', (route) => route.fulfill({ json: report }));
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:8081/report/${report.company.ticker}`);
    await page
      .getByRole('button', { name: `Inspect ${metric.label.toLowerCase()} evidence`, exact: true })
      .first()
      .click();
    const notebook = page.getByTestId('source-notebook');
    const card = notebook.getByTestId(`evidence-${source.id}`);
    await expect(
      card.getByRole('heading', { name: 'Net income (loss)', exact: true }),
    ).toBeVisible();
    await expect.poll(async () => Math.abs((await notebook.boundingBox())!.y)).toBeLessThan(1);
    await page.screenshot({ path: resolve(output, 'default.png') });
    await card.getByRole('button', { name: 'Technical details', exact: true }).click();
    await card
      .getByRole('button', { name: 'Technical details', exact: true })
      .evaluate((element) => element.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: resolve(output, 'technical-details.png') });
    await card
      .getByText(source.excerpt, { exact: true })
      .evaluate((element) => element.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: resolve(output, 'raw-record.png') });
    await page.getByRole('button', { name: 'Close evidence', exact: true }).click();
    await page.getByRole('button', { name: 'Save report & add notes' }).click();
    const savedUrl = page.url();
    await context.unroute('**/v1/**');
    await context.route('**/v1/**', (route) => route.abort('internetdisconnected'));
    await page.goto(savedUrl);
    for (const width of [320, 430]) {
      await page.setViewportSize({ width, height: 874 });
      await page
        .getByRole('button', {
          name: `Inspect ${metric.label.toLowerCase()} evidence`,
          exact: true,
        })
        .first()
        .click();
      await expect(
        card.getByRole('heading', { name: 'Net income (loss)', exact: true }),
      ).toBeVisible();
      await expect.poll(async () => Math.abs((await notebook.boundingBox())!.y)).toBeLessThan(1);
      await scaleText(page, 2);
      await page.screenshot({ path: resolve(output, `saved-default-${width}-2x.png`) });
      await card.getByRole('button', { name: 'Technical details', exact: true }).click();
      await scaleText(page, 2);
      await card
        .getByRole('button', { name: 'Technical details', exact: true })
        .evaluate((element) => element.scrollIntoView({ block: 'start' }));
      await page.screenshot({ path: resolve(output, `saved-details-${width}-2x.png`) });
      await page.getByRole('button', { name: 'Close evidence', exact: true }).click();
    }
    await writeFile(
      resolve(output, 'capture.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          environment: 'Chromium browser preview, not a physical iPhone',
          source:
            'Previously retrieved real RKLB report, replayed unchanged from an ignored local artifact. No live API request.',
          reportId: report.id,
          retrievedAt: report.retrieved_at,
          sourceId: source.id,
          value: source.value,
          unit: source.unit,
          aiEnabled: false,
          views:
            'Default and expanded details at 402x874; offline saved evidence at 320/430x874 with 2x CSS text approximation.',
          storage: 'Isolated disposable browser context; no existing user data accessed.',
        },
        null,
        2,
      ) + '\n',
    );
    console.log(`Evidence previews captured in ${output}`);
  } finally {
    await browser.close();
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
