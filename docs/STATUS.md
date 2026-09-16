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
- Backend: **31 pytest tests passed**, Ruff passed. Financial/model/provider tests use explicitly synthetic fixtures or mock transports, not live SEC/model requests. Added an independent inline-XBRL verifier with tests for scaling, sign, nil values, units and dimensional exclusions.
- Expo Search, Watchlist, Saved Research, Settings, report/source reader, immutable snapshots and editable notes implemented.
- Mobile TypeScript and ESLint passed; **6 unit tests passed** (four storage and two dependency compatibility checks). Disk-backed tests reopen a new store instance; cover concurrent writes, preserved versions, corrupt data and storage failures.
- **3 Playwright browser flows passed** at 390×844 and 320×568: search → inspect → watch → save → notes → close/reopen → offline API → versions → delete; loading/empty/unsupported/stale/network/storage failures and malformed API responses. Rendering errors are asserted absent, and screenshots were visually reviewed. These use synthetic network fixtures, not live research, and are not physical iPhone tests.
- Expo Doctor: **21/21 checks passed**. iOS/web JavaScript exports passed with patched dependencies and TickerBrief assets. These are not signed native builds.
- FastAPI started on port 8000 and `/health` returned 200. Expo Metro started on 8081 and web returned 200. Backend was restarted without a SEC contact after the approval rejection; live SEC access remains gated below.
- PostgreSQL usage ledger added for ephemeral hosting; TLS verification, transaction locking, explicit schema initialization, missing-ledger failure and budget checks covered with protocol/error mocks. SQLite concurrency/persistence uses an actual test database. A real hosted PostgreSQL transaction has not been tested because no database credentials/environment are available.
- Release preparation includes an explicit Free Render blueprint, Dockerfile, privacy draft, EAS profiles, public app icon and Windows startup/release runbooks. Docker CLI exists but its daemon is not running; no container build is claimed.

## External prerequisites

- SEC contact authorization requested. Automatic approval review rejected sending the Expo account email to SEC without explicit payload/destination authorization. The proposed email was removed from the local environment; no live SEC request was made. User approval or another approved identifying contact is required.
- AI credentials and free-tier eligibility are not verified. Live generation stays disabled.
- Expo CLI is signed in as `jeppy22`; GitHub CLI as `Jeppy22`. EAS project `ba290e73-7370-4c6e-b557-1ea2e21987d0` was created and its link verified. Owner remains `jeppy22`. Free quota verified 2026-09-16: 3/15 iOS and 3/30 total builds used. Apple team permissions, registered bundle identifier and App Store Connect app ID are unverified. No cloud build started.
- No Render token found. Connected browser automation reports no available browser, so hosting and Apple web account access cannot be checked through it.
- npm audit now reports **zero vulnerabilities**, after scoped patched dependencies plus a committed, tested CommonJS compatibility patch. See DEPENDENCIES.md.
- Clean temporary checkout: `npm ci` applied the committed patch, audit reported zero vulnerabilities, TypeScript and six unit checks passed. Python hash-pinned installation succeeded; its first test run exposed a shared Windows temp-directory ACL conflict. Test scratch storage now uses the checkout's ignored `.pytest_cache/tmp`; clean-checkout retest is in progress.

## Next task

Finish fresh-checkout installation/startup verification and push reviewed commits. Once SEC contact is approved, verify AAPL/MSFT/RKLB against live underlying filings. Then use a verified free hosting account; live interpretation additionally needs verified free model access and durable usage storage. Apple signing and physical testing remain external.

## Acceptance audit

| Goal criterion | Current evidence/status |
| --- | --- |
| Fresh Windows checkout starts both services | Working checkout starts; clean installation verification pending |
| Real dated reports for supported searches | Implemented and fixture-tested; live AAPL/MSFT/RKLB gate blocked by SEC contact authorization |
| Live summary and bull/bear evidence verified | Not met; no model credential/free-tier verification or live generation |
| Watchlist, snapshots, notes survive restart | Browser/device-storage code and persisted-file tests pass; physical iPhone pending |
| Honest missing/offline/loading/error states | Browser fixture flows pass, including failed writes and retained reports |
| Relevant checks documented | Passing checks above; additional clean-install evidence pending |
| Hosted backend and TestFlight build | Not met; hosting credentials/settings, Apple identity/permissions and hosted URL needed |
| Remaining review/device steps identified | RELEASE.md separates signing, upload, Apple processing, beta review and device checks |

This goal is **not complete**. No live financial verification, live AI quality, cloud deployment, signed binary or physical-device result is being inferred from fixture tests.
