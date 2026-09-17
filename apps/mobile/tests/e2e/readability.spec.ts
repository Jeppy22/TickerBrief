import { chromium, expect, Page, test } from '@playwright/test';
import { fixtureReport } from '../fixtures';
import { STORAGE_KEY } from '../../src/lib/storage';

// Synthetic amounts only. Browser scaling approximates larger text, not native Dynamic Type.
const report = structuredClone(fixtureReport);
const revenue = report.periods[0].metrics[0];
revenue.explanation = 'Synthetic layout fixture with long signed amounts. Not real research.';
revenue.current!.value = -987654321098.76;
revenue.previous = {
  ...revenue.current!,
  value: 123456789012.34,
  start: '2024-01-01',
  end: '2024-12-31',
  source_ids: ['test-prior'],
};
report.sources[0] = {
  ...report.sources[0],
  value: revenue.current!.value,
  unit: 'USD',
  start: revenue.current!.start,
  end: revenue.current!.end,
  excerpt: 'SYNTHETIC ONLY: Revenues -987654321098.76 USD, 2025-01-01 to 2025-12-31',
};
report.sources.push({
  ...report.sources[0],
  id: 'test-prior',
  value: revenue.previous.value,
  start: revenue.previous.start,
  end: revenue.previous.end,
  excerpt: 'SYNTHETIC ONLY: Revenues 123456789012.34 USD, 2024-01-01 to 2024-12-31',
});

async function scaleText(page: Page, scale: number) {
  await page.evaluate((factor) => {
    document.querySelectorAll<HTMLElement>('[dir="auto"]').forEach((element) => {
      const style = getComputedStyle(element);
      const baseFont = Number(element.dataset.baseFont || parseFloat(style.fontSize));
      const baseLine = Number(element.dataset.baseLine || parseFloat(style.lineHeight));
      element.dataset.baseFont = String(baseFont);
      element.dataset.baseLine = String(baseLine);
      element.style.fontSize = `${baseFont * factor}px`;
      if (Number.isFinite(baseLine)) element.style.lineHeight = `${baseLine * factor}px`;
    });
  }, scale);
}

async function verifyAmounts(page: Page, expected: string[]) {
  const scope = (await page.getByTestId('source-notebook').count())
    ? page.getByTestId('source-notebook')
    : page;
  const amounts = scope.getByTestId('financial-value').filter({ visible: true });
  await expect(amounts).toHaveText(expected);
  for (const amount of await amounts.all()) {
    const measurement = await amount.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const rectangles = [...range.getClientRects()];
      return {
        lines: new Set(rectangles.map((rect) => rect.y)).size,
        textWidth: Math.max(...rectangles.map((rect) => rect.width)),
        textHeight: Math.max(...rectangles.map((rect) => rect.height)),
        boxWidth: element.clientWidth,
        boxHeight: element.clientHeight,
        overflow: getComputedStyle(element).textOverflow,
        clamp: getComputedStyle(element).webkitLineClamp,
      };
    });
    expect(measurement.lines, 'An amount must never split at the decimal or sign').toBe(1);
    expect(measurement.boxWidth + 1).toBeGreaterThanOrEqual(measurement.textWidth);
    expect(measurement.boxHeight + 1).toBeGreaterThanOrEqual(measurement.textHeight);
    expect(measurement.overflow).not.toBe('ellipsis');
    expect(measurement.clamp).toBe('none');
  }
  for (const viewport of await scope
    .getByTestId('financial-value-viewport')
    .filter({ visible: true })
    .all()) {
    await expect
      .poll(() =>
        viewport.evaluate((element) => {
          const width = element.getBoundingClientRect().width;
          return width <= window.innerWidth;
        }),
      )
      .toBe(true);
    const overflow = await viewport.evaluate(
      (element) => element.scrollWidth > element.clientWidth + 1,
    );
    if (overflow) {
      await expect(
        viewport.locator('..').getByText('Swipe across the value to read every digit.'),
      ).toBeVisible();
      const endVisible = await viewport.evaluate((element) => {
        element.scrollLeft = element.scrollWidth;
        return Math.abs(element.scrollWidth - element.clientWidth - element.scrollLeft) < 2;
      });
      expect(endVisible, 'Every trailing digit must be reachable').toBe(true);
      await viewport.evaluate((element) => {
        element.scrollLeft = 0;
      });
    }
  }
}

test('tab labels remain separated and reachable at narrow widths and enlarged text', async ({
  page,
}) => {
  await page.goto('/');
  for (const width of [320, 402, 430]) {
    await page.setViewportSize({ width, height: 874 });
    for (const scale of [1, 2, 2.5]) {
      await scaleText(page, scale);
      for (const name of ['Search', 'Watchlist', 'Saved Research', 'Settings']) {
        const tab = page.getByRole('tab', { name, exact: true });
        await expect(tab).toBeVisible();
        const bounds = await tab.evaluate((element) => {
          const button = element.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(element);
          const text = range.getBoundingClientRect();
          return {
            insideButton: text.left >= button.left && text.right <= button.right,
            insideScreen:
              button.left >= 0 && button.right <= innerWidth && button.bottom <= innerHeight,
          };
        });
        expect(bounds).toEqual({ insideButton: true, insideScreen: true });
      }
    }
  }
  await page.getByRole('tab', { name: 'Saved Research', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Saved research', exact: true })).toBeVisible();
});

test('complete current, prior and source amounts at phone widths and enlarged text', async ({
  page,
}, testInfo) => {
  await page.route('**/v1/**', (route) => route.fulfill({ json: report }));
  await page.goto('/report/TEST');
  await expect(page.getByText('Prior year · USD', { exact: true })).toBeVisible();
  for (const width of [320, 402, 430]) {
    await page.setViewportSize({ width, height: 874 });
    for (const scale of [1, 2, 2.5]) {
      await scaleText(page, scale);
      await verifyAmounts(page, ['-$987.65B', '$123.46B', 'Unavailable']);
      await page.getByTestId('financial-value').first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath(`amounts-${width}-${scale}x.png`) });
      await page.getByRole('button', { name: 'Inspect revenue evidence', exact: true }).click();
      await scaleText(page, scale);
      await verifyAmounts(page, ['−$987,654,321,098.76', '$123,456,789,012.34']);
      await expect(page.getByText(report.sources[0].excerpt, { exact: true })).toBeVisible();
      await page
        .getByTestId('source-notebook')
        .getByTestId('financial-value')
        .first()
        .scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath(`sources-${width}-${scale}x.png`) });
      await page.getByRole('button', { name: 'Close evidence', exact: true }).click();
    }
  }
});

test('Back returns to the correct live and saved screens without exposing route group names', async ({
  page,
}) => {
  await page.route('**/v1/companies?*', (route) =>
    route.fulfill({
      json: {
        companies: [report.company],
        stale: false,
        retrieved_at: report.retrieved_at,
        coverage: 'Synthetic only',
      },
    }),
  );
  await page.route('**/v1/reports/TEST', (route) => route.fulfill({ json: report }));
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Company name or ticker' }).fill('TEST');
  await page.getByRole('button', { name: 'Search companies', exact: true }).click();
  await page.getByRole('button', { name: 'Read TEST brief', exact: true }).click();
  const back = () =>
    page.getByRole('link', { name: 'Go back', exact: true }).filter({ visible: true });
  await expect(back()).toContainText('Back');
  await expect(page.getByText('(tabs)', { exact: true })).toHaveCount(0);
  await back().click();
  await expect(page.getByRole('textbox', { name: 'Company name or ticker' })).toHaveValue('TEST');
  await page.getByRole('button', { name: 'Read TEST brief', exact: true }).click();
  await page.getByRole('button', { name: 'Save report & add notes' }).click();
  await expect(back()).toContainText('Back');
  await back().click();
  await expect(page.getByRole('button', { name: 'Refresh research', exact: true })).toBeVisible();
  await page.goto('/saved');
  await page.getByRole('button', { name: 'Open saved report', exact: true }).click();
  await expect(back()).toContainText('Back');
  await expect(page.getByText('(tabs)', { exact: true })).toHaveCount(0);
  await back().click();
  await expect(page.getByRole('button', { name: 'Open saved report', exact: true })).toBeVisible();
});

test('saved library, sources and note edits survive browser restarts with external networking blocked', async ({}, testInfo) => {
  const app = 'http://127.0.0.1:8081';
  const profile = testInfo.outputPath('offline-profile');
  const options = { headless: true, viewport: { width: 402, height: 874 } };
  let context = await chromium.launchPersistentContext(profile, options);
  let externalRequests = 0;
  const restartOffline = async () => {
    await context.close();
    context = await chromium.launchPersistentContext(profile, options);
    // Loopback serves the app's JS, as bundled JS would be available in the native install.
    // This is not a fully offline browser launch or a physical iPhone test.
    await context.route('**/*', (route) => {
      if (new URL(route.request().url()).origin === app) return route.continue();
      externalRequests += 1;
      return route.abort('internetdisconnected');
    });
    return context.newPage();
  };
  try {
    await context.route('**/v1/**', (route) => route.fulfill({ json: report }));
    let page = await context.newPage();
    await page.goto(`${app}/report/TEST`);
    await page.getByRole('button', { name: 'Save report & add notes' }).click();
    await page
      .getByRole('textbox', { name: 'Personal research notes' })
      .fill('Existing installation notes.');
    await page.getByRole('button', { name: 'Save notes', exact: true }).click();
    await expect(page.getByText('Notes saved on this device.')).toBeVisible();
    await page.getByRole('button', { name: 'Open current research' }).click();
    await page.getByRole('button', { name: 'Save report & add notes' }).click();
    await expect(page.getByRole('textbox', { name: 'Personal research notes' })).toBeVisible();

    page = await restartOffline();
    await page.goto(`${app}/saved`);
    await expect(page.getByRole('button', { name: 'Open saved report' })).toHaveCount(2);
    await page.getByRole('button', { name: 'Open saved report' }).last().click();
    await expect(page.getByRole('textbox', { name: 'Personal research notes' })).toHaveValue(
      'Existing installation notes.',
    );
    await page.getByRole('button', { name: 'Inspect business source', exact: true }).click();
    await expect(
      page.getByTestId('source-notebook').getByText(report.sources[1].excerpt, { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Close evidence', exact: true }).click();
    await page.getByRole('button', { name: 'Inspect revenue evidence', exact: true }).click();
    await verifyAmounts(page, ['−$987,654,321,098.76', '$123,456,789,012.34']);
    await page.getByRole('button', { name: 'Close evidence', exact: true }).click();
    await page
      .getByRole('textbox', { name: 'Personal research notes' })
      .fill('Edited with external networking unavailable.');
    await page.getByRole('button', { name: 'Save notes', exact: true }).click();
    await expect(page.getByText('Notes saved on this device.')).toBeVisible();
    expect(
      externalRequests,
      'Saved screens and evidence must not even attempt an API request',
    ).toBe(0);

    page = await restartOffline();
    await page.goto(`${app}/saved`);
    await expect(page.getByRole('button', { name: 'Open saved report' })).toHaveCount(2);
    await page.getByRole('button', { name: 'Open saved report' }).last().click();
    await expect(page.getByRole('textbox', { name: 'Personal research notes' })).toHaveValue(
      'Edited with external networking unavailable.',
    );
    const library = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      STORAGE_KEY,
    );
    expect(library.version).toBe(1);
    expect(library.saved.map((saved: { report: unknown }) => saved.report)).toEqual([
      report,
      report,
    ]);
    expect(externalRequests).toBe(0);
    await page.screenshot({ path: testInfo.outputPath('saved-after-offline-restart.png') });
    await page.getByRole('button', { name: 'Open current research' }).click();
    await expect(page.getByText(/Unable to reach research/)).toBeVisible();
    await page.getByRole('button', { name: 'Open saved research', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Open saved report' })).toHaveCount(2);
    await page.goto(app);
    await page.getByRole('textbox', { name: 'Company name or ticker' }).fill('TEST');
    await page.getByRole('button', { name: 'Search companies', exact: true }).click();
    await expect(page.getByText(/Unable to reach research/)).toBeVisible();
    await page.getByRole('button', { name: 'Open saved research', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Open saved report' })).toHaveCount(2);
    expect(externalRequests).toBe(2);
  } finally {
    await context.close();
  }
});
