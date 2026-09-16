"""Conservative SEC normalization: exact periods, USD only, no inferred zeros.

Interim flows are fiscal year-to-date, including cash flow. Never subtract YTD
facts across filings to manufacture a quarter. Conflicting same-filing facts
are omitted rather than resolved arbitrarily.
"""

import hashlib
import json
import math
from datetime import date

from .models import Evidence, Metric, Observation, Period

TAGS = {
    "revenue": [
        "RevenueFromContractWithCustomerExcludingAssessedTax",
        "RevenueFromContractWithCustomerIncludingAssessedTax",
        "Revenues",
        "SalesRevenueNet",
    ],
    "net_income": ["NetIncomeLoss", "ProfitLoss"],
    "operating_cash_flow": ["NetCashProvidedByUsedInOperatingActivities"],
    "cash": ["CashAndCashEquivalentsAtCarryingValue"],
}
LABELS = {
    "revenue": "Revenue",
    "net_income": "Net income",
    "operating_cash_flow": "Operating cash flow",
    "cash": "Cash and cash equivalents",
    "debt": "Long-term debt, including current portion",
}


def days(start: str, end: str) -> int:
    return (date.fromisoformat(end) - date.fromisoformat(start)).days + 1


def filing_url(cik: str, accession: str) -> str:
    return f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accession.replace('-', '')}/{accession}-index.html"


class Normalizer:
    def __init__(self, facts: dict, cik: str, retrieved_at: str, as_of: str):
        self.facts = facts.get("facts", {}).get("us-gaap", {})
        self.cik, self.retrieved_at, self.as_of = cik, retrieved_at, as_of
        self.sources: dict[str, Evidence] = {}

    def rows(self, tag: str) -> list[dict]:
        return [
            r
            for r in self.facts.get(tag, {}).get("units", {}).get("USD", [])
            if r.get("form") in ("10-K", "10-K/A", "10-Q", "10-Q/A")
            and r.get("filed", "9999") <= self.as_of
            and r.get("accn")
            and isinstance(r.get("val"), (int, float))
            and not isinstance(r.get("val"), bool)
            and math.isfinite(r["val"])
        ]

    def select(self, tag: str, start: str | None, end: str) -> dict | None:
        rows = [r for r in self.rows(tag) if r.get("end") == end and r.get("start") == start]
        if not rows:
            return None
        latest = max(r["filed"] for r in rows)
        rows = [r for r in rows if r["filed"] == latest]
        if len({r["val"] for r in rows}) != 1:
            return None
        # Equivalent duplicates often differ only in frame/fy. Amendments remain traceable.
        return max(rows, key=lambda r: (r["form"].endswith("/A"), r["accn"]))

    def observation(self, tag: str, row: dict) -> Observation:
        canonical = {k: row.get(k) for k in ("val", "start", "end", "accn", "filed", "form")}
        source_id = (
            "fact-" + hashlib.sha256((tag + json.dumps(canonical, sort_keys=True)).encode()).hexdigest()[:16]
        )
        excerpt = json.dumps(
            {"taxonomy": "us-gaap", "concept": tag, "unit": "USD", **canonical}, sort_keys=True
        )
        self.sources[source_id] = Evidence(
            id=source_id,
            kind="reported_fact",
            title=f"{tag} · {row['form']} filed {row['filed']}",
            url=filing_url(self.cik, row["accn"]),
            data_url=f"https://data.sec.gov/api/xbrl/companyfacts/CIK{int(self.cik):010d}.json",
            retrieved_at=self.retrieved_at,
            excerpt=excerpt,
            accession=row["accn"],
            filed=row["filed"],
            form=row["form"],
            concept=tag,
            unit="USD",
            value=row["val"],
            start=row.get("start"),
            end=row["end"],
        )
        return Observation(
            value=row["val"],
            unit="USD",
            start=row.get("start"),
            end=row["end"],
            source_ids=[source_id],
            concept=tag,
        )

    def value(
        self, key: str, start: str, end: str, required_concept: str | None = None
    ) -> Observation | None:
        if key == "debt":
            # LongTermDebt is a reported total; never add it to its components.
            total = self.select("LongTermDebt", None, end)
            if total and required_concept in (None, "LongTermDebt"):
                return self.observation("LongTermDebt", total)
            tags = ("LongTermDebtCurrent", "LongTermDebtNoncurrent")
            combined = "+".join(tags)
            if required_concept not in (None, combined):
                return None
            rows = [self.select(tag, None, end) for tag in tags]
            if any(r is None for r in rows):
                return None
            if len({r["accn"] for r in rows}) != 1:
                return None
            observations = [self.observation(tag, row) for tag, row in zip(tags, rows, strict=True)]
            return Observation(
                value=sum(o.value for o in observations),
                unit="USD",
                start=None,
                end=end,
                source_ids=[sid for o in observations for sid in o.source_ids],
                concept=combined,
            )
        for tag in TAGS[key]:
            if required_concept and tag != required_concept:
                continue
            row = self.select(tag, None if key == "cash" else start, end)
            if row:
                return self.observation(tag, row)
        return None

    def period_start(self, end: str, kind: str) -> str | None:
        lower, upper = (330, 380) if kind == "annual" else (30, 300)
        # CFO chooses the cumulative reporting period for an interim report.
        for key in ("operating_cash_flow", "revenue", "net_income"):
            candidates = [
                r["start"]
                for tag in TAGS[key]
                for r in self.rows(tag)
                if r.get("end") == end and r.get("start") and lower <= days(r["start"], end) <= upper
            ]
            if candidates:
                return min(candidates)
        return None

    def previous_period(self, start: str, end: str, kind: str) -> tuple[str, str] | None:
        candidates = set()
        for tags in TAGS.values():
            for tag in tags:
                if not any(row.get("start") == start and row.get("end") == end for row in self.rows(tag)):
                    continue
                for row in self.rows(tag):
                    if not row.get("start"):
                        continue
                    end_gap = days(row["end"], end) - 1
                    start_gap = days(row["start"], start) - 1
                    if (
                        350 <= end_gap <= 378
                        and 350 <= start_gap <= 378
                        and abs(days(row["start"], row["end"]) - days(start, end)) <= 8
                    ):
                        candidates.add((row["start"], row["end"]))
        return max(candidates, key=lambda p: p[1]) if candidates else None

    def period(self, end: str, kind: str) -> Period | None:
        start = self.period_start(end, kind)
        if not start:
            return None
        prior = self.previous_period(start, end, kind)
        metrics = []
        for key, label in LABELS.items():
            current = self.value(key, start, end)
            previous = (
                self.value(key, *prior, required_concept=current.concept) if prior and current else None
            )
            change = current.value - previous.value if current and previous else None
            percent = 100 * change / previous.value if change is not None and previous.value > 0 else None
            text = "Unavailable: no unambiguous USD fact for this reporting period."
            if current:
                text = f"Reported {label.lower()}: ${current.value:,.0f}."
                if key == "debt" and "+" in current.concept:
                    text = f"Calculated long-term debt: ${current.value:,.0f}, adding current and noncurrent portions from the same filing."
                if previous:
                    text += f" Change from the comparable prior-year period: ${change:+,.0f}."
                    if percent is not None:
                        text += f" This is {percent:+.1f}%."
                    else:
                        text += " Percentage change is not shown because the prior value is zero or negative."
                else:
                    text += " A comparable prior-year value using the same accounting concept is unavailable."
            metrics.append(
                Metric(
                    key=key,
                    label=label,
                    current=current,
                    previous=previous,
                    change=change,
                    change_percent=percent,
                    explanation=text,
                    missing_reason=None if current else text,
                )
            )
        return Period(
            kind=kind,
            label="Annual" if kind == "annual" else "Fiscal year to date (not a standalone quarter)",
            start=start,
            end=end,
            metrics=metrics,
        )
