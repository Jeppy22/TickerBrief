import os

import pytest


@pytest.fixture(autouse=True)
def isolate_provider_environment(monkeypatch):
    for key in os.environ:
        if key.startswith(("AI_", "GEMINI_", "SEC_")):
            monkeypatch.delenv(key, raising=False)


@pytest.fixture
def facts():
    """Synthetic test-only facts. Never serve these as company research."""
    result = {"facts": {"us-gaap": {}}}
    for tag, values in {
        "RevenueFromContractWithCustomerExcludingAssessedTax": [80, 100],
        "NetIncomeLoss": [-5, 10],
        "NetCashProvidedByUsedInOperatingActivities": [12, 15],
        "CashAndCashEquivalentsAtCarryingValue": [25, 30],
        "LongTermDebtCurrent": [3, 4],
        "LongTermDebtNoncurrent": [15, 18],
    }.items():
        instant = tag in (
            "CashAndCashEquivalentsAtCarryingValue",
            "LongTermDebtCurrent",
            "LongTermDebtNoncurrent",
        )
        rows = []
        for year, value in zip((2024, 2025), values, strict=True):
            row = {
                "val": value,
                "end": f"{year}-12-31",
                "filed": "2026-02-01",
                "form": "10-K",
                "accn": "0000000001-26-000001",
            }
            if not instant:
                row["start"] = f"{year}-01-01"
            rows.append(row)
        result["facts"]["us-gaap"][tag] = {"units": {"USD": rows}}
    return result
