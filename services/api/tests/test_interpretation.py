import asyncio
import json
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta

import httpx
import pytest
from pydantic import SecretStr

from app.budget import BudgetExceeded, initialize_budget, reserve
from app.config import Settings
from app.interpretation import (
    enabled,
    interpret,
    validate_content,
)
from app.models import Company, Evidence, Interpretation, Report


@pytest.fixture
def report():
    return Report(
        id="test-fixture",
        company=Company(name="TEST FIXTURE ONLY", ticker="TEST", cik="0000000001"),
        retrieved_at="2026-09-16T12:00:00Z",
        generated_at="2026-09-16T12:00:00Z",
        stale=False,
        overview=None,
        overview_source_ids=[],
        industry=None,
        periods=[],
        uncertainties=[],
        sources=[
            Evidence(
                id="test-evidence",
                kind="management_statement",
                title="Synthetic test statement",
                url="https://www.sec.gov/test",
                data_url="https://www.sec.gov/test",
                retrieved_at="2026-09-16T12:00:00Z",
                excerpt="The test company sells fictional widgets and faces uncertain demand.",
            )
        ],
        interpretation=Interpretation(status="disabled", message="Disabled"),
    )


@pytest.fixture
def content():
    claim = {
        "text": "Management describes a widget business with uncertain demand.",
        "source_ids": ["test-evidence"],
        "supporting_quotes": ["sells fictional widgets and faces uncertain demand."],
        "assumption": "Demand may remain uncertain.",
    }
    return {"summary": [claim.copy()], "bull": [claim.copy()], "bear": [claim.copy()]}


def configured(tmp_path):
    path = tmp_path / "budget.sqlite"
    initialize_budget(path)
    return Settings(
        _env_file=None,
        ai_enabled=True,
        ai_free_tier_verified=True,
        ai_billing_disabled_verified=True,
        ai_verified_until=datetime.now(UTC) + timedelta(hours=1),
        gemini_api_key=SecretStr("TEST-ONLY-KEY"),
        gemini_model="gemini-test-fixture",
        ai_budget_path=str(path),
        ai_rpm=1,
        ai_daily_cap=2,
        ai_total_cap=3,
    )


def test_gates_fail_closed(tmp_path):
    settings = configured(tmp_path)
    assert enabled(settings)
    for update in (
        {"ai_enabled": False},
        {"ai_free_tier_verified": False},
        {"ai_billing_disabled_verified": False},
        {"gemini_api_key": SecretStr("")},
        {"ai_verified_until": datetime.now(UTC) - timedelta(seconds=1)},
        {"ai_budget_path": ""},
    ):
        assert not enabled(settings.model_copy(update=update))


@pytest.mark.parametrize("mutation", ["unknown", "quote", "numbers", "advice", "assumption", "extra"])
def test_reject_invalid_model_claims(report, content, mutation):
    claim = content["bull"][0]
    if mutation == "unknown":
        claim["source_ids"] = ["invented-id"]
    elif mutation == "quote":
        claim["supporting_quotes"] = ["This invented excerpt is not in the filing."]
    elif mutation == "numbers":
        claim["text"] = "Revenue will grow by 500%."
    elif mutation == "advice":
        claim["text"] = "Buy this company for your portfolio."
    elif mutation == "assumption":
        claim["assumption"] = None
    else:
        claim["price_target"] = 1000
    with pytest.raises(ValueError):
        validate_content(json.dumps(content), report)


def test_atomic_global_minute_day_and_lifetime_caps(tmp_path):
    settings = configured(tmp_path)

    def attempt(_):
        try:
            reserve(settings, now=100000)
            return True
        except BudgetExceeded:
            return False

    with ThreadPoolExecutor(max_workers=4) as pool:
        assert sum(pool.map(attempt, range(4))) == 1
    reserve(settings, now=100061)
    with pytest.raises(BudgetExceeded):
        reserve(settings, now=100122)
    reserve(settings, now=200000)
    with pytest.raises(BudgetExceeded):
        reserve(settings, now=300000)
    with pytest.raises(ValueError, match="reset"):
        initialize_budget(tmp_path / "budget.sqlite")


def test_missing_ledger_cannot_reinitialize_on_request(tmp_path):
    settings = Settings(_env_file=None, ai_budget_path=str(tmp_path / "missing.sqlite"))
    with pytest.raises(BudgetExceeded):
        reserve(settings)
    assert not (tmp_path / "missing.sqlite").exists()


def test_provider_valid_output_is_validated_and_cached(tmp_path, report, content):
    settings = configured(tmp_path)
    calls = []

    def response(request):
        calls.append(request)
        assert request.headers["x-goog-api-key"] == "TEST-ONLY-KEY"
        assert "TEST-ONLY-KEY" not in str(request.url)
        return httpx.Response(
            200,
            json={
                "candidates": [
                    {"finishReason": "STOP", "content": {"parts": [{"text": json.dumps(content)}]}}
                ]
            },
        )

    transport = httpx.MockTransport(response)
    first = asyncio.run(interpret(report, settings, transport))
    assert first.status == "available"
    second = asyncio.run(interpret(report, settings, transport))
    assert second.content == first.content
    assert len(calls) == 1


def test_failed_request_consumes_budget_and_preserves_facts(tmp_path, report):
    settings = configured(tmp_path)
    original = report.model_dump()
    result = asyncio.run(interpret(report, settings, httpx.MockTransport(lambda r: httpx.Response(429))))
    assert result.status == "unavailable"
    assert report.model_dump() == original
    with sqlite3.connect(settings.ai_budget_path) as db:
        assert db.execute("SELECT COUNT(*) FROM requests").fetchone()[0] == 1


def test_disabled_provider_never_calls_network(report):
    def forbidden(request):
        pytest.fail("A disabled model must not call the provider")

    result = asyncio.run(interpret(report, Settings(_env_file=None), httpx.MockTransport(forbidden)))
    assert result.status == "disabled"
