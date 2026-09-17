import { expect, test } from '@playwright/test';
import { fixtureReport } from '../fixtures';
import { STORAGE_KEY } from '../../src/lib/storage';

const report = structuredClone(fixtureReport);
const source = report.sources[0];
Object.assign(source, {
  concept: 'NetIncomeLoss',
  title: 'NetIncomeLoss · SYNTHETIC TEST ONLY',
  value: -26863000,
  unit: 'USD',
  accession: 'synthetic-accession',
});
source.excerpt = JSON.stringify({
  taxonomy: 'us-gaap',
  concept: source.concept,
  val: source.value,
  unit: source.unit,
  start: source.start,
  end: source.end,
  form: source.form,
  filed: source.filed,
  accn: source.accession,
});
// Explicit synthetic example; never sent to the real service or imported by app code.
report.periods[0].metrics[0].label = 'Net income';
report.periods[0].metrics[0].current!.value = source.value!;
report.periods[0].metrics[0].current!.concept = source.concept!;

test('evidence hierarchy, exact links, disclosure and Close work live and on an offline saved snapshot', async ({
  page,
  context,
}) => {
  await page.route('**/v1/**', (route) => route.fulfill({ json: report }));
  await context.route('https://*.sec.gov/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<title>Synthetic link target check</title>' }),
  );
  await page.goto('/report/TEST');
  const inspect = () =>
    page.getByRole('button', { name: 'Inspect net income evidence', exact: true });
  await inspect().click();
  const notebook = () => page.getByTestId('source-notebook');
  const card = () => notebook().getByTestId(`evidence-${source.id}`);
  await expect(card().getByRole('heading', { name: 'Net income (loss)' })).toBeVisible();
  await expect(card().getByTestId('financial-value')).toHaveText('−$26,863,000');
  await expect(card().getByText('USD', { exact: true })).toBeVisible();
  await expect(card().getByText('Jan 1, 2025 – Dec 31, 2025')).toBeVisible();
  await expect(card().getByText('10-K · Filed Feb 1, 2026')).toBeVisible();
  await expect(card().getByTestId('technical-details')).toHaveCount(0);
  await expect(card().getByText(source.excerpt, { exact: true })).toHaveCount(0);
  await expect(notebook().getByText('Retained filing excerpt', { exact: true })).toHaveCount(0);
  const close = () => notebook().getByRole('button', { name: 'Close evidence', exact: true });
  await expect(close()).toHaveText('Close');
  const closeBox = await close().boundingBox();
  expect(closeBox!.height).toBeGreaterThanOrEqual(44);
  expect(closeBox!.width).toBeGreaterThanOrEqual(44);
  expect(closeBox!.width).toBeLessThan(150);
  expect(closeBox!.x).toBeLessThan(24);
  const openLink = async (name: string, url: string) => {
    const pending = context.waitForEvent('page');
    await card().getByRole('button', { name, exact: true }).click();
    const popup = await pending;
    await expect(popup).toHaveURL(url);
    await popup.close();
  };
  await openLink('Open SEC filing', source.url);
  await card().getByRole('button', { name: 'Technical details', exact: true }).click();
  await expect(card().getByRole('button', { name: 'Technical details' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(card().getByText('Original concept: NetIncomeLoss')).toBeVisible();
  await expect(card().getByText('Taxonomy: us-gaap')).toBeVisible();
  await expect(card().getByText(`Accession: ${source.accession}`)).toBeVisible();
  await expect(card().getByText(`Retrieved: ${source.retrieved_at}`)).toBeVisible();
  await expect(card().getByText(source.excerpt, { exact: true })).toBeVisible();
  await openLink('Open structured SEC data', source.data_url);
  await close().click();
  await expect(notebook()).toHaveCount(0);
  await expect(page).toHaveURL(/\/report\/TEST$/);
  await page.getByRole('button', { name: 'Save report & add notes' }).click();
  const savedUrl = page.url();
  await page
    .getByRole('textbox', { name: 'Personal research notes' })
    .fill('Preserve these existing notes.');
  await page.getByRole('button', { name: 'Save notes', exact: true }).click();
  await expect(page.getByText('Notes saved on this device.')).toBeVisible();
  const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  await page.close();
  page = await context.newPage();
  let apiRequests = 0;
  await page.route('**/v1/**', (route) => {
    apiRequests++;
    return route.abort('internetdisconnected');
  });
  await page.goto(savedUrl);
  await inspect().click();
  await expect(card().getByTestId('technical-details')).toHaveCount(0);
  await expect(card().getByTestId('financial-value')).toHaveText('−$26,863,000');
  await card().getByRole('button', { name: 'Technical details', exact: true }).click();
  await expect(card().getByText(source.excerpt, { exact: true })).toBeVisible();
  await close().click();
  await expect(page).toHaveURL(savedUrl);
  await expect(page.getByRole('textbox', { name: 'Personal research notes' })).toHaveValue(
    'Preserve these existing notes.',
  );
  await page.getByRole('button', { name: 'Inspect business source', exact: true }).click();
  await expect(notebook().getByText('Retained filing excerpt', { exact: true })).toBeVisible();
  await expect(notebook().getByText(report.sources[1].excerpt, { exact: true })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(stored);
  expect(apiRequests).toBe(0);
});
