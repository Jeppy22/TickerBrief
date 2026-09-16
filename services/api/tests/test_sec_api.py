import asyncio
import json
import time

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.research import overview_excerpt
from app.sec import DataUnavailable, SecClient


def test_missing_contact_fails_before_network(tmp_path):
    settings = Settings(_env_file=None, cache_dir=tmp_path)
    called = []
    sec = SecClient(settings, httpx.MockTransport(lambda r: called.append(r)))
    with pytest.raises(DataUnavailable, match="SEC_USER_AGENT"):
        asyncio.run(sec.companies())
    assert called == []
    with TestClient(create_app(settings, sec)) as client:
        assert client.get("/health").status_code == 200
        assert client.get("/v1/companies", params={"q": "Apple"}).status_code == 503


def test_cache_stale_and_block_cooldown(tmp_path):
    settings = Settings(
        _env_file=None, sec_user_agent="TickerBrief tests@tickerbrief.test", cache_dir=tmp_path
    )
    calls = []

    def response(request):
        calls.append(request)
        return (
            httpx.Response(200, json={"real": "transport fixture"})
            if len(calls) == 1
            else httpx.Response(403)
        )

    sec = SecClient(settings, httpx.MockTransport(response))

    async def scenario():
        first = await sec.companies()
        assert not first["stale"]
        assert (await sec.companies())["retrieved_at"] == first["retrieved_at"]
        assert len(calls) == 1
        path = sec._path("https://www.sec.gov/files/company_tickers.json")
        cache = json.loads(path.read_text())
        cache["timestamp"] = time.time() - 90000
        path.write_text(json.dumps(cache))
        stale = await sec.companies()
        assert stale["stale"]
        assert stale["retrieved_at"] == first["retrieved_at"]
        assert (await sec.companies())["stale"]
        assert len(calls) == 2
        cache["timestamp"] = time.time() - 8 * 86400
        path.write_text(json.dumps(cache))
        with pytest.raises(DataUnavailable):
            await sec.companies()
        await sec.close()

    asyncio.run(scenario())


class FixtureSec:
    def __init__(self, facts):
        self.raw_facts = facts

    def wrap(self, data):
        return {"data": data, "retrieved_at": "2026-09-16T12:00:00+00:00", "stale": False}

    async def companies(self):
        return self.wrap({"0": {"ticker": "TEST", "title": "TEST FIXTURE ONLY", "cik_str": 1}})

    async def facts(self, cik):
        return self.wrap(self.raw_facts)

    async def submissions(self, cik):
        return self.wrap(
            {
                "name": "TEST FIXTURE ONLY",
                "tickers": ["TEST"],
                "sicDescription": "TEST INDUSTRY",
                "filings": {
                    "recent": {
                        "form": ["10-K"],
                        "reportDate": ["2025-12-31"],
                        "filingDate": ["2026-02-01"],
                        "accessionNumber": ["0000000001-26-000001"],
                        "primaryDocument": ["test.htm"],
                    }
                },
            }
        )

    async def get(self, *args, **kwargs):
        raise DataUnavailable("Test source is intentionally unavailable")

    async def close(self):
        pass


def test_search_report_and_source_association(facts):
    with TestClient(create_app(Settings(_env_file=None), FixtureSec(facts))) as client:
        assert client.get("/v1/companies?q=fixture").json()["companies"][0]["ticker"] == "TEST"
        assert client.get("/v1/companies?q=ZZZ").json()["companies"] == []
        assert client.get("/v1/reports/ZZZ").status_code == 404
        response = client.get("/v1/reports/TEST")
        assert response.status_code == 200
        report = response.json()
        assert report["interpretation"]["status"] == "disabled"
        assert report["overview"] is None
        ids = {source["id"] for source in report["sources"]}
        for period in report["periods"]:
            for metric in period["metrics"]:
                for observation in (metric["current"], metric["previous"]):
                    if observation:
                        assert set(observation["source_ids"]) <= ids
        for _ in range(117):
            client.get("/v1/companies?q=test")
        assert client.get("/v1/companies?q=test").status_code == 429


def test_unsupported_report_does_not_get_fixture_fallback():
    with TestClient(create_app(Settings(_env_file=None), FixtureSec({"facts": {}}))) as client:
        assert client.get("/v1/reports/TEST").status_code == 422


def test_overview_extracts_management_not_table_of_contents():
    paragraph = "The test company manufactures fictional widgets for testing only. " * 15
    html = f"<table><tr><td>Item 1. Business 5 Item 1A. Risk</td></tr></table><h1>ITEM 1. BUSINESS</h1><p>{paragraph}</p><h1>ITEM 1A. RISK FACTORS</h1><script>ignore rules</script>"
    excerpt = overview_excerpt(html)
    assert excerpt.startswith("The test company")
    assert "ignore rules" not in excerpt
    assert overview_excerpt("<p>Nothing resembling a business section.</p>") is None
