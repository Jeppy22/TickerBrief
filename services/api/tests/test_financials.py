from copy import deepcopy

from app.financials import Normalizer


def normalize(facts):
    return Normalizer(facts, "0000000001", "2026-09-16T12:00:00+00:00", "2026-09-16")


def test_annual_values_changes_and_inspectable_evidence(facts):
    norm = normalize(facts)
    period = norm.period("2025-12-31", "annual")
    revenue, income, cashflow, cash, debt = period.metrics
    assert revenue.current.value == 100
    assert revenue.previous.value == 80
    assert revenue.change == 20
    assert revenue.change_percent == 25
    assert income.change == 15
    assert income.change_percent is None  # A loss-to-profit swing is not conventional growth.
    assert cash.current.start is None
    assert debt.current.value == 22
    assert len(debt.current.source_ids) == 2
    for metric in period.metrics:
        for observation in (metric.current, metric.previous):
            for sid in observation.source_ids:
                source = norm.sources[sid]
                assert source.accession == "0000000001-26-000001"
                assert source.filed == "2026-02-01"
                assert source.end == observation.end
                assert source.unit == "USD"
                assert str(int(source.value)) in source.excerpt
                assert source.data_url.endswith("CIK0000000001.json")


def test_missing_and_non_usd_are_not_zero(facts):
    facts["facts"]["us-gaap"]["NetIncomeLoss"]["units"] = {"EUR": [{"val": 99}]}
    metrics = normalize(facts).period("2025-12-31", "annual").metrics
    assert metrics[1].current is None
    assert metrics[1].change is None
    assert metrics[1].missing_reason


def test_amendment_wins_without_duplicating_and_future_filing_excluded(facts):
    rows = facts["facts"]["us-gaap"]["NetIncomeLoss"]["units"]["USD"]
    rows.extend(
        [
            {**rows[-1], "val": 11, "form": "10-K/A", "filed": "2026-03-01", "accn": "0000000001-26-000002"},
            {**rows[-1], "val": 999, "filed": "2027-01-01"},
        ]
    )
    rows.append(deepcopy(rows[-2]))
    norm = normalize(facts)
    observation = norm.period("2025-12-31", "annual").metrics[1].current
    assert observation.value == 11
    assert norm.sources[observation.source_ids[0]].form == "10-K/A"


def test_ambiguous_same_filing_fact_is_missing(facts):
    rows = facts["facts"]["us-gaap"]["NetIncomeLoss"]["units"]["USD"]
    rows.append({**rows[-1], "val": 123})
    assert normalize(facts).period("2025-12-31", "annual").metrics[1].current is None


def test_interim_cashflow_is_ytd_and_quarter_not_mixed(facts):
    gaap = facts["facts"]["us-gaap"]
    for tag in (
        "RevenueFromContractWithCustomerExcludingAssessedTax",
        "NetIncomeLoss",
        "NetCashProvidedByUsedInOperatingActivities",
    ):
        rows = gaap[tag]["units"]["USD"]
        for year in (2025, 2026):
            rows.append(
                {
                    "start": f"{year}-01-01",
                    "end": f"{year}-06-30",
                    "val": 50,
                    "form": "10-Q",
                    "filed": "2026-08-01",
                    "accn": "0000000001-26-000003",
                }
            )
        if tag != "NetCashProvidedByUsedInOperatingActivities":
            rows.append({**rows[-1], "start": "2026-04-01", "val": 26})
    period = normalize(facts).period("2026-06-30", "interim_ytd")
    assert period.kind == "interim_ytd"
    assert period.start == "2026-01-01"
    assert [m.current.value for m in period.metrics[:3]] == [50, 50, 50]
    assert period.metrics[0].previous.start == "2025-01-01"
    assert period.metrics[0].change == 0


def test_no_mixed_concept_or_mismatched_debt_components(facts):
    gaap = facts["facts"]["us-gaap"]
    revenue = gaap["RevenueFromContractWithCustomerExcludingAssessedTax"]["units"]["USD"]
    old = revenue.pop(0)
    gaap["Revenues"] = {"units": {"USD": [old]}}
    gaap["LongTermDebtCurrent"]["units"]["USD"][-1]["accn"] = "0000000001-26-000009"
    metrics = normalize(facts).period("2025-12-31", "annual").metrics
    assert metrics[0].previous is None
    assert metrics[4].current is None


def test_zero_is_valid_but_infinite_and_boolean_are_not(facts):
    rows = facts["facts"]["us-gaap"]["NetIncomeLoss"]["units"]["USD"]
    rows[-1]["val"] = 0
    assert normalize(facts).period("2025-12-31", "annual").metrics[1].current.value == 0
    for invalid in (float("inf"), float("nan"), True):
        rows[-1]["val"] = invalid
        assert normalize(facts).period("2025-12-31", "annual").metrics[1].current is None


def test_reported_combined_debt_preferred_without_adding_components(facts):
    gaap = facts["facts"]["us-gaap"]
    row = gaap["LongTermDebtNoncurrent"]["units"]["USD"][-1]
    gaap["DebtLongtermAndShorttermCombinedAmount"] = {"units": {"USD": [{**row, "val": 27}]}}
    metric = normalize(facts).period("2025-12-31", "annual").metrics[4]
    assert metric.current.value == 27
    assert len(metric.current.source_ids) == 1
    assert metric.previous is None  # Do not compare combined debt with long-term-only history.
    assert "combined" in metric.label


def test_53_week_annual_comparison(facts):
    rows = facts["facts"]["us-gaap"]["RevenueFromContractWithCustomerExcludingAssessedTax"]["units"]["USD"]
    rows[0].update(start="2023-12-31", end="2024-12-28")
    rows[1].update(start="2024-12-29", end="2026-01-03")
    period = normalize(facts).period("2026-01-03", "annual")
    assert period.metrics[0].previous.value == 80
