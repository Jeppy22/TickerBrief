# Verified status

Updated: 2026-09-16. This project is in implementation; the beta is not complete.

## Established

- Inspected the Windows workspace: initially empty, no existing instructions or changes.
- Cloned `https://github.com/Jeppy22/TickerBrief` into the existing folder (no nesting); remote was empty.
- Node 22.18.0, npm 10.9.3, Python launcher 3.13.5 available. The bare `python` alias fails in the restricted shell; use the virtual environment executable.
- Selected stable Expo SDK 57 using the official versioned compatibility documentation and npm registry. Scaffold contains its own AGENTS.md, read before edits.
- No prior backend, accounts, watchlists, saved reports or AI integration existed to preserve.

## Implemented and checked

- FastAPI company search and reports from SEC company directory, submissions, company facts, and business-section excerpts. No live fixture fallback.
- Exact USD annual and fiscal-year-to-date normalization, comparable periods, explicit missing data, restatements/amendments, duplicate conflict handling, inspectable source records, and calculated changes.
- SEC cache, stale timestamps, shared two-request/second throttle, 403/429 cooldown, global API request ceiling. Deployment must use one worker/instance.
- Optional server-side Gemini adapter: disabled by default, no live requests made. Requires time-limited free-tier/billing-disabled attestation and initialized durable usage ledger; validates schema, citation IDs and exact excerpts; failures preserve facts.
- Backend: **25 pytest tests passed**, Ruff passed. All financial/model/provider tests currently use explicitly synthetic fixtures or mock transports, not live SEC/model requests.
- Expo Search, Watchlist, Saved Research, Settings, report/source reader, immutable snapshots and editable notes implemented.
- Mobile TypeScript and ESLint passed; **4 storage tests passed**. Disk-backed tests reopen a new store instance; cover concurrent writes, preserved versions, corrupt data and storage failures.
- **2 Playwright browser flows passed** at 390×844: search → inspect → watch → save → notes → close/reopen → offline API → versions → delete; loading/empty/unsupported/stale/network/storage failures. These use synthetic network fixtures, not live research, and are not physical iPhone tests.
- Expo Doctor: **21/21 checks passed**. iOS/web JavaScript exports in progress.
- FastAPI started on port 8000 and `/health` returned 200. Expo Metro started on 8081 and web returned 200. API temporarily stopped during configuration checks; live SEC access remains gated below.

## External prerequisites

- SEC contact authorization requested. Automatic approval review rejected sending the Expo account email to SEC without explicit payload/destination authorization. The proposed email was removed from the local environment; no live SEC request was made. User approval or another approved identifying contact is required.
- AI credentials and free-tier eligibility are not verified. Live generation stays disabled.
- Expo CLI is signed in as `jeppy22`; GitHub CLI as `Jeppy22`. Account quota, Apple team permissions and registered bundle identifier still require verification. No EAS project has been linked and no cloud build started.
- No Render token found. Connected browser automation reports no available browser, so hosting and Apple web account access cannot be checked through it.
- Initial npm audit found 14 moderate advisories propagated from two transitive packages; compatible remediation is being evaluated before the mobile milestone commit.

## Next task

Finish exports, dependency review, visual QA and deployment/release documentation. Once SEC contact is approved, verify AAPL/MSFT/RKLB using live underlying filings.
