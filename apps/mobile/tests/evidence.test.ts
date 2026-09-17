import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evidenceDetails,
  evidenceUnit,
  financialConceptLabels,
  formatReportedValue,
} from '../src/lib/evidence';
import { fixtureReport } from './fixtures';

test('full reported values preserve signs, units, zeros and precision without currency rounding', () => {
  const cases: [number | null | undefined, string | null, string][] = [
    [-26863000, 'USD', '−$26,863,000'],
    [-987654321098.76, 'USD', '−$987,654,321,098.76'],
    [123456789012.34, 'USD', '$123,456,789,012.34'],
    [0, 'USD', '$0'],
    [-0, 'USD', '−$0'],
    [-1.2345678901234567, 'USD/shares', '−$1.2345678901234567'],
    [0.00000001, 'USD', '$0.00000001'],
    [1e21, 'USD', '$1,000,000,000,000,000,000,000'],
    [1000000.125, 'shares', '1,000,000.125'],
    [1234.5678, 'EUR', '1,234.5678'],
    [0.075, 'pure', '0.075'],
    [-12.75, 'unfamiliar-unit', '−12.75'],
    [12, null, '12'],
    [null, 'USD', 'Unavailable'],
    [undefined, 'USD', 'Unavailable'],
  ];
  for (const [value, unit, expected] of cases)
    assert.equal(formatReportedValue(value, unit), expected);
  assert.equal(evidenceUnit('USD/shares'), 'USD per share');
  assert.equal(evidenceUnit('shares'), 'shares');
  assert.equal(evidenceUnit('unfamiliar-unit'), 'unfamiliar-unit');
  assert.equal(evidenceUnit(null), 'Unit not supplied');
});

test('known concepts have readable names without assigning meaning to custom or unknown concepts', () => {
  const source = fixtureReport.sources[0];
  assert.equal(evidenceDetails({ ...source, concept: 'NetIncomeLoss' }).label, 'Net income (loss)');
  for (const [concept, label] of Object.entries(financialConceptLabels)) {
    assert.equal(evidenceDetails({ ...source, concept }).label, label);
    assert.equal(evidenceDetails({ ...source, concept: `us-gaap:${concept}` }).label, label);
  }
  for (const concept of ['UnfamiliarMeasure', 'constructor', 'custom:NetIncomeLoss'])
    assert.equal(evidenceDetails({ ...source, concept }).label, undefined);
  assert.equal(
    evidenceDetails({ ...source, concept: 'NetIncomeLoss', excerpt: '{"taxonomy":"custom"}' })
      .label,
    undefined,
  );
});

test('legacy JSON metadata is read without mutation; explicit missing fields stay missing', () => {
  const source = {
    ...fixtureReport.sources[0],
    concept: undefined,
    value: undefined,
    unit: undefined,
    start: undefined,
    end: undefined,
    excerpt:
      '{"taxonomy":"us-gaap","concept":"NetIncomeLoss","val":-26863000,"unit":"USD","start":"2025-01-01","end":"2025-03-31","accn":"test-accession"}',
  };
  const original = structuredClone(source);
  const details = evidenceDetails(source);
  assert.equal(details.value, -26863000);
  assert.equal(details.concept, 'NetIncomeLoss');
  assert.equal(details.taxonomy, 'us-gaap');
  assert.equal(details.start, '2025-01-01');
  assert.equal(details.end, '2025-03-31');
  assert.equal(details.accession, 'test-accession');
  assert.equal(details.structured, true);
  assert.equal(evidenceDetails({ ...source, value: null }).value, null);
  assert.equal(evidenceDetails({ ...source, excerpt: '[{"val":1}]' }).structured, true);
  assert.equal(evidenceDetails(fixtureReport.sources[1]).structured, false);
  assert.deepEqual(source, original);
});
