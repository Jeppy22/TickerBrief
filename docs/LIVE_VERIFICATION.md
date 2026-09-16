# Live verification — 2026-09-16

The existing `services/api/scripts/verify_live.py` completed with exit code 0 after the backend restarted with the authorized local SEC contact and `AI_ENABLED=false`. Its financial comparison criteria were unchanged.

The [full machine-readable audit](verification/2026-09-16-sec-audit.json), checked at **2026-09-16 21:45:33 UTC**, retains each concept, value, unit, period, filing date, accession, filing URL and matching inline-XBRL excerpt. Data was retrieved from official SEC hosts, including the retained cache from the first live run that day. All reports were non-stale. No model requests were made.

| Company | Annual period | Latest interim period | Matched financial facts | Business excerpt |
| --- | --- | --- | --- | --- |
| AAPL | 2024-09-29–2025-09-27 | 2025-09-28–2026-06-27, fiscal YTD | 20/20 | Available |
| MSFT | 2025-07-01–2026-06-30 | None newer than the annual filing | 10/10 | Available after extraction fix |
| RKLB | 2025-01-01–2025-12-31 | 2026-01-01–2026-06-30, fiscal YTD | 20/20 | Available |

Counts include current and comparable prior-year observations for revenue, net income, operating cash flow, cash and debt. No requested metric was unavailable in these reports. Debt coverage remains explicitly labeled; it is not a claim to include every obligation. Fiscal YTD cash flow is not represented as a standalone quarter. Percentage changes from negative prior values remain unavailable, with absolute changes retained.

## Actual issue found and fixed

MSFT's [annual filing](https://www.sec.gov/Archives/edgar/data/789019/000119312526323660/msft-20260630.htm) separates the `B` and `USINESS` heading text into adjacent styled spans. The original extractor inserted a space between them and missed the section. Section-marker matching now tolerates those spaces without rewriting the source prose. A related short-excerpt boundary case now retains the final complete sentence. Three synthetic regression cases verify split headings, contents exclusion and the risk-section boundary. All **34 backend tests** and Ruff checks pass.

The live financial audit passed both before and after this fix. No numerical normalization change or relaxed verification rule was needed.

## Real application flow

The explicit `npm.cmd run test:live` suite passed **3/3** tests against the running local API and Metro browser app. It checks the API's disabled-AI status before research requests and uses no synthetic response bodies.

For each company, the test searches by company name or ticker, reads the actual report, inspects retained revenue evidence, adds a watchlist entry, saves two report versions and writes notes. It then closes the browser process and reopens the same disk profile with all research API requests blocked. The saved report, notes, source excerpt, versions and watchlist remain readable. Isolated test profiles do not modify the user's browser library. Report screenshots at 390×844 were visually reviewed.

The web assets still load from Metro during the blocked-API check. This verifies saved-data independence from the research API and a real browser restart; it does not claim a native iPhone, airplane-mode app launch, hosted backend, or TestFlight test.

## Reproduce

Start both services using [README.md](../README.md). Keep the approved contact in the ignored backend environment file and AI disabled. From `services/api`:

```powershell
..\..\.venv\Scripts\python.exe scripts\verify_live.py --base-url http://127.0.0.1:8000
```

From `apps/mobile`, with the app using the local API on port 8000 and Metro on 8081:

```powershell
npm.cmd run test:live
```

The audit's default output remains ignored under `artifacts/`; the dated copy above is deliberate release evidence, not a production fallback. The actual SEC contact is excluded from this document and the retained audit.
