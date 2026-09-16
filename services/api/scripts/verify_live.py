"""Explicit live verification. Requires an approved SEC_USER_AGENT and a running API.

Run from services/api: python scripts/verify_live.py --base-url http://127.0.0.1:8000
No model calls are made by this script; leave AI_ENABLED=false during factual audits.
"""

import argparse
import asyncio
import json
import sys
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.config import Settings  # noqa: E402
from app.filing_audit import inline_facts  # noqa: E402
from app.sec import SecClient  # noqa: E402


async def audit(base_url: str, output: Path):
    settings = Settings()
    if not settings.sec_configured:
        raise SystemExit(
            "BLOCKED: configure an approved identifying SEC_USER_AGENT. No SEC request was sent."
        )
    if settings.ai_enabled:
        raise SystemExit(
            "Disable AI_ENABLED before the factual audit; this command is not authorization for live model calls."
        )
    sec = SecClient(settings)
    summary = {
        "checked_at": datetime.now(UTC).isoformat(),
        "mode": "live SEC plus independent inline-XBRL filing comparison",
        "companies": [],
    }
    failed = False
    try:
        async with httpx.AsyncClient(timeout=180) as client:
            health = await client.get(f"{base_url.rstrip('/')}/health")
            health.raise_for_status()
            if health.json().get("ai_enabled") is not False:
                raise SystemExit(
                    "BLOCKED: the target API must confirm ai_enabled=false before this factual audit."
                )
            for ticker in ("AAPL", "MSFT", "RKLB"):
                response = await client.get(f"{base_url.rstrip('/')}/v1/reports/{ticker}")
                response.raise_for_status()
                report = response.json()
                submissions = (await sec.submissions(report["company"]["cik"]))["data"]["filings"]["recent"]
                documents = dict(
                    zip(submissions["accessionNumber"], submissions["primaryDocument"], strict=True)
                )
                parsed, checks = {}, []
                for source in report["sources"]:
                    if source["kind"] != "reported_fact":
                        continue
                    accession = source["accession"]
                    if accession not in parsed and accession in documents:
                        url = f"https://www.sec.gov/Archives/edgar/data/{int(report['company']['cik'])}/{accession.replace('-', '')}/{documents[accession]}"
                        filing = await sec.get(url, ttl=7 * 86400, json_data=False)
                        parsed[accession] = (url, inline_facts(filing["data"]))
                    url, values = parsed.get(accession, (None, []))
                    matches = [
                        value
                        for value in values
                        if value["concept"] == source["concept"]
                        and value["start"] == source["start"]
                        and value["end"] == source["end"]
                        and value["value"] == Decimal(str(source["value"]))
                    ]
                    checks.append(
                        {
                            "source_id": source["id"],
                            "concept": source["concept"],
                            "value": source["value"],
                            "unit": source["unit"],
                            "start": source["start"],
                            "end": source["end"],
                            "filed": source["filed"],
                            "accession": accession,
                            "filing_url": url,
                            "matched_inline_fact": bool(matches),
                            "inline_excerpt": matches[0]["excerpt"] if matches else None,
                        }
                    )
                passed = (
                    bool(checks) and all(c["matched_inline_fact"] for c in checks) and not report["stale"]
                )
                failed = failed or not passed
                result = {
                    "ticker": ticker,
                    "passed": passed,
                    "report_id": report["id"],
                    "retrieved_at": report["retrieved_at"],
                    "overview_available": bool(report["overview"]),
                    "interpretation_status": report["interpretation"]["status"],
                    "unavailable_metrics": [
                        f"{period['kind']}:{metric['key']}"
                        for period in report["periods"]
                        for metric in period["metrics"]
                        if metric["current"] is None
                    ],
                    "checks": checks,
                }
                summary["companies"].append(result)
                print(
                    f"{ticker}: {sum(c['matched_inline_fact'] for c in checks)}/{len(checks)} facts matched inline filing values; passed={passed}"
                )
    finally:
        await sec.close()
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return failed


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--output", type=Path, default=Path("../../artifacts/live-verification.json"))
    args = parser.parse_args()
    raise SystemExit(int(asyncio.run(audit(args.base_url, args.output))))
