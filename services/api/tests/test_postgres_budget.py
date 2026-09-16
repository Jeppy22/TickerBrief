import asyncio
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

import httpx
import psycopg
import pytest
from pydantic import SecretStr

from app.budget import BudgetExceeded, configured, initialize_postgres, reserve
from app.config import Settings
from app.interpretation import interpret
from app.models import Company, Interpretation, Report


def postgres_settings():
    return Settings(
        _env_file=None,
        ai_budget_database_url=SecretStr("postgresql://test:test@ledger.invalid/test"),
        ai_enabled=True,
        ai_free_tier_verified=True,
        ai_billing_disabled_verified=True,
        ai_verified_until=datetime.now(UTC) + timedelta(hours=1),
        gemini_api_key=SecretStr("TEST-ONLY-KEY"),
        gemini_model="gemini-test",
    )


def test_postgres_cap_requires_lock_and_rejects_before_insert(monkeypatch):
    connection = MagicMock()
    connection.__enter__.return_value = connection
    connection.execute.return_value.fetchone.return_value = (100, 0, 0)
    connect = MagicMock(return_value=connection)
    monkeypatch.setattr("app.budget.psycopg.connect", connect)
    with pytest.raises(BudgetExceeded):
        reserve(postgres_settings(), now=100000)
    statements = [call.args[0] for call in connection.execute.call_args_list]
    assert any("LOCK TABLE requests IN EXCLUSIVE MODE" in query for query in statements)
    assert not any("INSERT" in query for query in statements)
    assert any("%s" in query for query in statements)
    assert connect.call_args.kwargs["sslmode"] == "verify-full"
    assert connect.call_args.kwargs["sslrootcert"] == "system"


def test_lost_postgres_connection_preserves_factual_report_and_never_calls_model(monkeypatch):
    monkeypatch.setattr(
        "app.budget.psycopg.connect", MagicMock(side_effect=psycopg.OperationalError("Test failure"))
    )
    report = Report(
        id="synthetic",
        company=Company(ticker="TEST", name="TEST ONLY", cik="1"),
        retrieved_at="2026-09-16T00:00:00Z",
        generated_at="2026-09-16T00:00:00Z",
        stale=False,
        overview=None,
        overview_source_ids=[],
        industry=None,
        periods=[],
        sources=[],
        uncertainties=[],
        interpretation=Interpretation(status="disabled", message="Disabled"),
    )

    def forbidden(request):
        pytest.fail("Model provider must not be called without a durable budget reservation")

    result = asyncio.run(interpret(report, postgres_settings(), httpx.MockTransport(forbidden)))
    assert result.status == "unavailable"
    assert report.id == "synthetic"


def test_ambiguous_ledger_configuration_is_rejected(tmp_path):
    settings = postgres_settings()
    settings.ai_budget_path = str(tmp_path / "another-ledger.sqlite")
    assert not configured(settings)
    with pytest.raises(ValueError):
        initialize_postgres(settings)


def test_postgres_initializer_never_resets_an_existing_schema(monkeypatch):
    connection = MagicMock()
    connection.__enter__.return_value = connection
    connection.execute.side_effect = psycopg.errors.DuplicateSchema("already exists")
    monkeypatch.setattr("app.budget.psycopg.connect", MagicMock(return_value=connection))
    with pytest.raises(psycopg.errors.DuplicateSchema):
        initialize_postgres(postgres_settings())
    assert connection.execute.call_count == 1
    assert connection.execute.call_args.args[0] == "CREATE SCHEMA tickerbrief_ai"
