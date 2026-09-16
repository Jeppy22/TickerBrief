import hashlib
import re
from datetime import UTC, datetime

from bs4 import BeautifulSoup

from .financials import Normalizer
from .models import Company, Evidence, Interpretation, Report
from .sec import DataUnavailable, SecClient


class UnsupportedCompany(Exception):
    pass


def overview_excerpt(html: str) -> str | None:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup.find_all(["script", "style", "table", "ix:header"]):
        tag.decompose()
    text = re.sub(r"\s+", " ", soup.get_text(" ", strip=True))
    # Skip contents entries: use the longest Item 1 -> Item 1A region.
    candidates = []
    for match in re.finditer(r"\bITEM\s+1[.\s:–-]+BUSINESS\b", text, re.I):
        rest = text[match.end() :]
        finish = re.search(r"\bITEM\s+1A[.\s:–-]+RISK", rest, re.I)
        section = rest[: finish.start()] if finish else rest[:12000]
        if len(section) > 500:
            candidates.append(section)
    if not candidates:
        return None
    section = max(candidates, key=len).strip()
    # Display an exact excerpt, with no generated paraphrase presented as management text.
    excerpt = section[:1800]
    last_sentence = max(excerpt.rfind(". "), excerpt.rfind("; "))
    return excerpt[: last_sentence + 1] if last_sentence > 250 else excerpt


async def build_report(company: Company, sec: SecClient) -> Report:
    submissions = await sec.submissions(company.cik)
    facts = await sec.facts(company.cik)
    data = submissions["data"]
    recent = data.get("filings", {}).get("recent", {})
    filings = [
        {key: values[index] for key, values in recent.items()} for index in range(len(recent.get("form", [])))
    ]
    annuals = [f for f in filings if f["form"] in ("10-K", "10-K/A") and f.get("reportDate")]
    if not annuals or not facts["data"].get("facts", {}).get("us-gaap"):
        raise UnsupportedCompany(
            "This beta supports US-GAAP companies with a recent 10-K and USD financial facts. This company's reporting format is not supported yet."
        )
    annual = max(annuals, key=lambda f: (f["reportDate"], f["filingDate"]))
    # An amendment may only change a cover page. Prefer the full original for the business excerpt.
    original = next(
        (f for f in annuals if f["reportDate"] == annual["reportDate"] and f["form"] == "10-K"), annual
    )
    now = datetime.now(UTC).isoformat()
    norm = Normalizer(facts["data"], company.cik, facts["retrieved_at"], now[:10])
    periods = [norm.period(annual["reportDate"], "annual")]
    quarters = [
        f
        for f in filings
        if f["form"] in ("10-Q", "10-Q/A") and f.get("reportDate", "") > annual["reportDate"]
    ]
    if quarters:
        latest = max(quarters, key=lambda f: (f["reportDate"], f["filingDate"]))
        periods.append(norm.period(latest["reportDate"], "interim_ytd"))
    periods = [p for p in periods if p is not None]
    if not periods or not any(m.current for p in periods for m in p.metrics):
        raise UnsupportedCompany(
            "No reliably normalized USD financial values are available for this company's recent reporting periods."
        )
    sources = list(norm.sources.values())
    identity_id = "identity-" + company.cik
    industry = data.get("sicDescription") or None
    sources.append(
        Evidence(
            id=identity_id,
            kind="company_identity",
            title="SEC company identity and industry classification",
            url=f"https://www.sec.gov/edgar/browse/?CIK={int(company.cik)}",
            data_url=f"https://data.sec.gov/submissions/CIK{int(company.cik):010d}.json",
            retrieved_at=submissions["retrieved_at"],
            excerpt=f"Name: {data.get('name')}; tickers: {data.get('tickers')}; SIC industry: {industry}",
        )
    )
    overview, overview_sources = None, []
    uncertainties = [
        "This brief is a partial reading of SEC filings, not a valuation or personalized investment advice.",
        "Cash excludes investments and restricted cash. Debt uses a reported combined short- and long-term amount where available. Otherwise the label states long-term borrowings only, which may exclude other short-term borrowing and leases. Debt is not total liabilities.",
        "Comparisons use the same concept and similar period lengths. Later reported amendments or comparative restatements replace earlier facts; check the displayed filing dates.",
        "Custom company tags, segment-level disclosures and non-USD facts are not normalized. Missing values do not mean zero.",
    ]
    stale = facts["stale"] or submissions["stale"]
    retrieved_times = [facts["retrieved_at"], submissions["retrieved_at"]]
    accession = original["accessionNumber"]
    document = original.get("primaryDocument", "")
    if re.fullmatch(r"[A-Za-z0-9_.-]+", document):
        url = f"https://www.sec.gov/Archives/edgar/data/{int(company.cik)}/{accession.replace('-', '')}/{document}"
        try:
            filing = await sec.get(url, ttl=7 * 86400, json_data=False)
            overview = overview_excerpt(filing["data"])
            stale = stale or filing["stale"]
            retrieved_times.append(filing["retrieved_at"])
            if overview:
                overview_sources = ["business-" + accession]
                sources.append(
                    Evidence(
                        id=overview_sources[0],
                        kind="management_statement",
                        title="Business overview · 10-K Item 1 (management excerpt)",
                        url=url,
                        data_url=url,
                        retrieved_at=filing["retrieved_at"],
                        excerpt=overview,
                        accession=accession,
                        filed=original["filingDate"],
                        form=original["form"],
                        end=original["reportDate"],
                    )
                )
        except DataUnavailable:
            pass
    if not overview:
        uncertainties.append(
            "The business overview could not be extracted from the filing. The SEC industry classification is shown separately; no replacement narrative was invented."
        )
    if quarters and len(periods) == 1:
        uncertainties.append(
            "A newer quarterly filing exists, but its year-to-date period could not be normalized reliably."
        )
    if stale:
        uncertainties.append(
            "Some sources came from a stale cache after SEC access failed. Check individual retrieval dates."
        )
    report = Report(
        id="",
        company=company,
        retrieved_at=min(retrieved_times),
        generated_at=now,
        stale=stale,
        overview=overview,
        overview_source_ids=overview_sources,
        industry=industry,
        periods=periods,
        sources=sources,
        uncertainties=uncertainties,
        interpretation=Interpretation(
            status="disabled",
            message="Model interpretation is disabled until free-tier eligibility and credentials are verified. The reported financial facts remain available.",
        ),
    )
    report.id = hashlib.sha256(report.model_dump_json().encode()).hexdigest()[:24]
    return report
