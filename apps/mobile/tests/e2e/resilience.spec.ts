import { expect, Route, test } from '@playwright/test';
import { fixtureReport } from '../fixtures';

// Local simulations only. No test in this file reaches the backend or SEC.
test('a delayed report succeeds within the timeout and a later service error can be retried', async ({
  page,
}, testInfo) => {
  await page.clock.install();
  let calls = 0;
  let pending: Route | undefined;
  await page.route('**/v1/reports/TEST', async (route) => {
    calls += 1;
    if (calls === 1) pending = route;
    else if (calls === 2)
      await route.fulfill({
        status: 503,
        json: { detail: 'Research is temporarily unavailable.' },
      });
    else await route.fulfill({ json: fixtureReport });
  });
  try {
    await page.goto('/report/TEST');
    await expect.poll(() => calls).toBe(1);
    await page.clock.fastForward(60000);
    await expect(page.getByText(/The research service is taking longer to respond/)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Open saved research', exact: true }),
    ).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Save report & add notes' })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('delayed-report.png') });
    await pending!.fulfill({ json: fixtureReport });
    pending = undefined;
    await expect(
      page.getByRole('heading', { name: 'TEST FIXTURE ONLY', exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/The research service is taking longer to respond/)).toHaveCount(0);
    await page.getByRole('button', { name: 'Refresh research', exact: true }).click();
    await expect(page.getByText(/Research is temporarily unavailable/)).toBeVisible();
    await expect(page.getByText(fixtureReport.periods[0].metrics[0].explanation)).toBeVisible();
    await page.getByRole('button', { name: 'Retry research', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Refresh research', exact: true })).toBeEnabled();
    expect(calls).toBe(3);
  } finally {
    await pending?.abort().catch(() => undefined);
  }
});

test('a stalled refresh does not prevent saving the report already on screen', async ({ page }) => {
  let calls = 0;
  let pending: Route | undefined;
  await page.route('**/v1/reports/TEST', async (route) => {
    calls += 1;
    if (calls === 1) await route.fulfill({ json: fixtureReport });
    else pending = route;
  });
  try {
    await page.goto('/report/TEST');
    await expect(
      page.getByRole('heading', { name: 'TEST FIXTURE ONLY', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Refresh research', exact: true }).click();
    await expect.poll(() => calls).toBe(2);
    await expect(page.getByText('Checking for updated research…')).toBeVisible();
    await expect(page.getByText(fixtureReport.periods[0].metrics[0].explanation)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save report & add notes' })).toBeEnabled();
    await page.getByRole('button', { name: 'Save report & add notes' }).click();
    await expect(page.getByRole('textbox', { name: 'Personal research notes' })).toBeVisible();
    // Expo keeps the previous report mounted underneath the saved-report screen.
    await expect(
      page.getByText(fixtureReport.periods[0].metrics[0].explanation).filter({ visible: true }),
    ).toBeVisible();
  } finally {
    await pending?.abort().catch(() => undefined);
  }
});

test('a delayed search times out clearly and a manual retry can recover', async ({ page }) => {
  await page.clock.install();
  let calls = 0;
  let pending: Route | undefined;
  await page.route('**/v1/companies?*', async (route) => {
    calls += 1;
    if (calls === 1) pending = route;
    else
      await route.fulfill({
        json: {
          companies: [fixtureReport.company],
          stale: false,
          retrieved_at: fixtureReport.retrieved_at,
          coverage: 'Synthetic test coverage',
        },
      });
  });
  try {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Company name or ticker' }).fill('TEST');
    await page.getByRole('button', { name: 'Search companies', exact: true }).click();
    await expect.poll(() => calls).toBe(1);
    await page.clock.fastForward(60000);
    await expect(page.getByText('Searching SEC companies…')).toBeVisible();
    await expect(page.getByText(/The research service is taking longer to respond/)).toBeVisible();
    expect(calls).toBe(1);
    await page.clock.fastForward(31000);
    await expect(page.getByText(/The research request timed out/)).toBeVisible();
    await page.getByRole('button', { name: 'Try search again', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Read TEST brief', exact: true })).toBeVisible();
    await expect(page.getByText(/The research service is taking longer to respond/)).toHaveCount(0);
    expect(calls).toBe(2);
    await page.clock.fastForward(91000);
    await expect(page.getByRole('alert')).toHaveCount(0);
  } finally {
    await pending?.abort().catch(() => undefined);
  }
});

test('service failure and retry leave saved reports and editable notes accessible', async ({
  page,
}) => {
  let unavailable = false;
  let calls = 0;
  await page.route('**/v1/reports/TEST', async (route) => {
    calls += 1;
    await route.fulfill(
      unavailable
        ? { status: 503, contentType: 'text/html', body: '<html>Service starting</html>' }
        : { json: fixtureReport },
    );
  });
  await page.goto('/report/TEST');
  await page.getByRole('button', { name: 'Save report & add notes' }).click();
  await page
    .getByRole('textbox', { name: 'Personal research notes' })
    .fill('Keep my existing notes.');
  await page.getByRole('button', { name: 'Save notes', exact: true }).click();
  await expect(page.getByText('Notes saved on this device.')).toBeVisible();
  unavailable = true;
  await page.getByRole('button', { name: 'Open current research' }).click();
  await expect(page.getByText(/The research service is waking up or unavailable/)).toBeVisible();
  await page.getByRole('button', { name: 'Retry research', exact: true }).click();
  await expect.poll(() => calls).toBe(3);
  await expect(page.getByText(/The research service is waking up or unavailable/)).toBeVisible();
  await page.getByRole('button', { name: 'Open saved research', exact: true }).click();
  await page.getByRole('button', { name: 'Open saved report', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Personal research notes' })).toHaveValue(
    'Keep my existing notes.',
  );
  await page
    .getByRole('textbox', { name: 'Personal research notes' })
    .fill('Edited while service unavailable.');
  await page.getByRole('button', { name: 'Save notes', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Personal research notes' })).toHaveValue(
    'Edited while service unavailable.',
  );
  expect(calls).toBe(3);
  unavailable = false;
  await page.getByRole('button', { name: 'Open current research' }).click();
  await expect(page.getByRole('heading', { name: 'TEST FIXTURE ONLY', exact: true })).toBeVisible();
});
