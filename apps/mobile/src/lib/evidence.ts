import { Evidence } from './schema';

// Exact supported US-GAAP concepts. Unknown/custom concepts get no inferred meaning.
export const financialConceptLabels: Readonly<Record<string, string>> = {
  RevenueFromContractWithCustomerExcludingAssessedTax: 'Revenue (excluding assessed taxes)',
  RevenueFromContractWithCustomerIncludingAssessedTax: 'Revenue (including assessed taxes)',
  Revenues: 'Revenue',
  SalesRevenueNet: 'Net revenue',
  NetIncomeLoss: 'Net income (loss)',
  ProfitLoss: 'Net income (loss)',
  NetCashProvidedByUsedInOperatingActivities: 'Net cash from operating activities',
  CashAndCashEquivalentsAtCarryingValue: 'Cash and cash equivalents',
  DebtLongtermAndShorttermCombinedAmount: 'Total short- and long-term debt',
  LongTermDebt: 'Long-term debt, including current portion',
  LongTermDebtCurrent: 'Long-term debt — current portion',
  LongTermDebtNoncurrent: 'Long-term debt — noncurrent portion',
};

function retainedData(excerpt: string) {
  try {
    const value: unknown = JSON.parse(excerpt);
    const structured = value !== null && typeof value === 'object';
    return {
      structured,
      record: structured && !Array.isArray(value) ? (value as Record<string, unknown>) : null,
    };
  } catch {
    return { structured: false, record: null };
  }
}

const text = (value: unknown) => (typeof value === 'string' && value.length > 0 ? value : null);

export function evidenceDetails(source: Evidence) {
  // Legacy snapshots may retain metadata only inside the original JSON string.
  // This is a read-only view; the saved record and its exact JSON are never rewritten.
  const { record, structured } = retainedData(source.excerpt);
  const concept = source.concept === undefined ? text(record?.concept) : source.concept;
  const taxonomy = text(record?.taxonomy);
  const parts = concept?.split(':');
  const namespace = parts?.length === 2 ? parts[0] : taxonomy;
  const tag = parts?.length === 2 ? parts[1] : concept;
  const label =
    (!namespace || namespace === 'us-gaap') && tag && Object.hasOwn(financialConceptLabels, tag)
      ? financialConceptLabels[tag]
      : undefined;
  const rawValue = source.value === undefined ? record?.val : source.value;
  return {
    record,
    structured,
    concept,
    taxonomy,
    label,
    value: typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : null,
    unit: source.unit === undefined ? text(record?.unit) : source.unit,
    start: source.start === undefined ? text(record?.start) : source.start,
    end: source.end === undefined ? text(record?.end) : source.end,
    form: source.form === undefined ? text(record?.form) : source.form,
    filed: source.filed === undefined ? text(record?.filed) : source.filed,
    accession: source.accession === undefined ? text(record?.accn) : source.accession,
  };
}

const fullNumber = new Intl.NumberFormat('en-US', {
  useGrouping: true,
  maximumSignificantDigits: 21,
});

export function formatReportedValue(
  value: number | null | undefined,
  unit: string | null | undefined,
) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Unavailable';
  const sign = value < 0 || Object.is(value, -0) ? '−' : '';
  const currency = unit?.split('/')[0];
  // Other units retain their literal identity alongside the grouped number.
  const symbol = currency === 'USD' ? '$' : '';
  return `${sign}${symbol}${fullNumber.format(Math.abs(value))}`;
}

export function evidenceUnit(unit: string | null | undefined) {
  if (unit === 'USD/shares' || unit === 'USD/share') return 'USD per share';
  return unit || 'Unit not supplied';
}
