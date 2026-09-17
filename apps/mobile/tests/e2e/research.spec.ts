import { expect, test } from '@playwright/test';
import { fixtureReport } from '../fixtures';

let renderingErrors: string[] = [];
test.beforeEach(async ({ context }) => {
  renderingErrors = [];
  const observe = (page: import('@playwright/test').Page) =>
    page.on('console', (message) => {
      if (message.type() === 'error' && message.text().includes('Unexpected text node'))
        renderingErrors.push(message.text());
    });
  context.pages().forEach(observe);
  context.on('page', observe);
});
test.afterEach(() => {
  expect(renderingErrors, 'React Native views must not contain bare text').toEqual([]);
});

test('fixture UI flow: search, inspect, watch, save, edit notes, restart offline, preserve versions and delete', async ({
  page,
  context,
}) => {
  await page.route('**/v1/companies?*', (route) =>
    route.fulfill({
      json: {
        companies: [fixtureReport.company],
        stale: false,
        retrieved_at: fixtureReport.retrieved_at,
        coverage: 'Synthetic test coverage',
      },
    }),
  );
  await page.route('**/v1/reports/TEST', (route) => route.fulfill({ json: fixtureReport }));
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Company name or ticker' })).toBeVisible();
  await page.screenshot({ path: 'test-results/search-screen.png', fullPage: true });
  await page.getByRole('textbox', { name: 'Company name or ticker' }).fill('TEST');
  await page.getByRole('button', { name: 'Search companies', exact: true }).click();
  await page.getByRole('button', { name: 'Read TEST brief', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'TEST FIXTURE ONLY', exact: true })).toBeVisible();
  await expect(page.getByText('Unavailable', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Inspect revenue evidence' }).click();
  await expect(
    page.getByTestId('source-notebook').getByRole('heading', { name: 'Revenue', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Technical details', exact: true }).click();
  await expect(page.getByText('Original title: SYNTHETIC revenue evidence')).toBeVisible();
  await page.getByRole('button', { name: 'Close evidence' }).click();
  await page.getByRole('button', { name: 'Add to watchlist', exact: true }).click();
  await page.getByRole('button', { name: 'Save report & add notes' }).click();
  await expect(page.getByRole('textbox', { name: 'Personal research notes' })).toBeVisible();
  await page.screenshot({ path: 'test-results/saved-report-screen.png', fullPage: true });
  await page
    .getByRole('textbox', { name: 'Personal research notes' })
    .fill('Review the original filing next.');
  await page.getByRole('button', { name: 'Save notes', exact: true }).click();
  await expect(page.getByText('Notes saved on this device.')).toBeVisible();
  const firstUrl = page.url();
  await page.getByRole('button', { name: 'Open current research' }).click();
  await page.getByRole('button', { name: 'Save report & add notes' }).click();
  expect(page.url()).not.toBe(firstUrl);
  await page.goto('/saved');
  await expect(page.getByRole('button', { name: 'Open saved report' })).toHaveCount(2);
  // Simulate relaunch by closing the page; storage survives in the same device/browser context.
  await page.close();
  const reopened = await context.newPage();
  await reopened.route('**/v1/**', (route) => route.abort('internetdisconnected'));
  await reopened.goto(firstUrl);
  await expect(reopened.getByRole('textbox', { name: 'Personal research notes' })).toHaveValue(
    'Review the original filing next.',
  );
  await expect(
    reopened.getByText('Synthetic test revenue: $100. Not real company research.'),
  ).toBeVisible();
  await reopened.getByRole('button', { name: 'Delete saved report', exact: true }).click();
  await reopened.getByRole('button', { name: 'Keep this report' }).click();
  await expect(reopened.getByRole('textbox', { name: 'Personal research notes' })).toHaveValue(
    'Review the original filing next.',
  );
  await reopened.getByRole('button', { name: 'Delete saved report', exact: true }).click();
  await reopened.getByRole('button', { name: 'Delete report and notes' }).click();
  await expect(reopened.getByRole('button', { name: 'Open saved report' })).toHaveCount(1);
  await reopened.goto('/watchlist');
  await expect(reopened.getByRole('button', { name: 'Read TEST brief' })).toBeVisible();
  await reopened.getByRole('button', { name: 'Remove from watchlist' }).click();
  await expect(reopened.getByText('A little focus goes a long way.')).toBeVisible();
});

test('failure states: loading, empty, unsupported, stale, offline and storage failure', async ({
  page,
}) => {
  await page.goto('/');
  await page.route('**/v1/companies?*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.fulfill({
      json: {
        companies: [],
        stale: false,
        retrieved_at: fixtureReport.retrieved_at,
        coverage: 'test',
      },
    });
  });
  await page.getByRole('textbox', { name: 'Company name or ticker' }).fill('UNKNOWN');
  await page.getByRole('button', { name: 'Search companies', exact: true }).click();
  await expect(page.getByText('Searching SEC companies…')).toBeVisible();
  await expect(page.getByText('No matching company')).toBeVisible();
  await page.route('**/v1/reports/TEST', (route) =>
    route.fulfill({
      status: 422,
      json: { detail: 'This company reporting format is not supported yet.' },
    }),
  );
  await page.goto('/report/TEST');
  await expect(page.getByText('This company reporting format is not supported yet.')).toBeVisible();
  await page.route('**/v1/reports/TEST', (route) =>
    route.fulfill({ json: { ...fixtureReport, stale: true } }),
  );
  await page.getByRole('button', { name: 'Retry research' }).click();
  await expect(page.getByText(/Some sources are stale/)).toBeVisible();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Quota exceeded');
    };
  });
  await page.getByRole('button', { name: 'Save report & add notes' }).click();
  await expect(page.getByText(/Changes could not be saved on this device/)).toBeVisible();
  await page.route('**/v1/reports/TEST', (route) => route.abort('internetdisconnected'));
  await page.getByRole('button', { name: 'Refresh research' }).click();
  await expect(page.getByText(/Unable to reach research/)).toBeVisible();
  await expect(
    page.getByText('Synthetic test revenue: $100. Not real company research.'),
  ).toBeVisible();
});

test('malformed API responses stay unavailable and the small-screen search remains usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/?check=%E0%A4%A');
  await expect(page.getByRole('textbox', { name: 'Company name or ticker' })).toBeVisible();
  await page.screenshot({ path: 'test-results/search-small-screen.png', fullPage: true });
  await page.route('**/v1/companies?*', (route) =>
    route.fulfill({ json: { companies: 'invalid' } }),
  );
  await page.getByRole('textbox', { name: 'Company name or ticker' }).fill('TEST');
  await page.getByRole('button', { name: 'Search companies', exact: true }).click();
  await expect(
    page.getByText('The company search response could not be verified. Please retry shortly.'),
  ).toBeVisible();
  await page.route('**/v1/reports/TEST', (route) => route.fulfill({ json: { id: 'incomplete' } }));
  await page.goto('/report/TEST');
  await expect(
    page.getByText(
      'This research response could not be verified. No report was saved. Please retry shortly.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save report & add notes' })).toHaveCount(0);
});
