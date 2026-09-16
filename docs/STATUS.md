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
- Backend: **34 pytest tests passed**, Ruff lint and format checks passed. Financial/model/provider unit tests use explicitly synthetic fixtures or mock transports. Added an independent inline-XBRL verifier with tests for scaling, sign, nil values, units and dimensional exclusions.
- Expo Search, Watchlist, Saved Research, Settings, report/source reader, immutable snapshots and editable notes implemented.
- Mobile TypeScript and ESLint passed; **6 unit tests passed** (four storage and two dependency compatibility checks). Disk-backed tests reopen a new store instance; cover concurrent writes, preserved versions, corrupt data and storage failures.
- **3 Playwright browser flows passed** at 390×844 and 320×568: search → inspect → watch → save → notes → close/reopen → offline API → versions → delete; loading/empty/unsupported/stale/network/storage failures and malformed API responses. Rendering errors are asserted absent, and screenshots were visually reviewed. These use synthetic network fixtures, not live research, and are not physical iPhone tests.
- Pre-beta resilience review reproduced three local gaps: saving a loaded report was disabled during a stalled refresh, the 90-second timeout appeared as a generic connection error, and a waiting/failed report had no direct saved-research shortcut. Fixed these without changing the request deadline, source validation, storage format or retry policy. A hint appears after 10 seconds; retries remain manual; the displayed report can be saved while refresh is pending; saved research is directly accessible from waiting/error states.
- **4 new synthetic resilience scenarios passed**, and the original three browser flows passed again: delayed report success, JSON/HTML 503 errors, timeout and manual recovery, saving during a stalled refresh, and editing/reopening notes while the API is unavailable. Delay checks use an accelerated browser clock, not real hosted latency. The seven scenarios passed across the suite run and a focused rerun after correcting a test locator for Expo's hidden previous screen. Windows Metro navigation measured about 27–38 seconds, so the overall test budget is now 120 seconds; individual assertion limits and the app's 90-second deadline are unchanged. No Render, SEC or AI requests were made by these tests.
- After the resilience changes, TypeScript, ESLint, and iOS Hermes/web JavaScript exports passed again on Windows. These exports do not verify native signing or physical-device behavior. No dependencies, EAS ownership/settings, backend code, local secrets or Render configuration changed during this review; AI remains disabled and no billing was enabled.
- Expo Doctor: **21/21 checks passed**. iOS/web JavaScript exports passed with patched dependencies and TickerBrief assets. These are not signed native builds.
- Restarted FastAPI on port 8000 with the explicitly authorized contact stored only in the Git-ignored `services/api/.env`. `/health` returned 200 with `sec_configured=true`, `ai_enabled=false`. Expo Metro on 8081 serves the real backend flow. The actual contact is omitted from committed files and application logs.
- **Live SEC audit passed:** AAPL **20/20**, MSFT **10/10**, RKLB **20/20** financial source facts matched underlying inline-XBRL filing values. Reports were fresh, all five requested metrics and prior comparisons were available, and interpretation remained disabled. See [dated evidence and limitations](LIVE_VERIFICATION.md) and the [complete audit record](verification/2026-09-16-sec-audit.json).
- Live content review found MSFT's `BUSINESS` heading split across styled spans, which left its overview unavailable. Fixed heading recognition and retained complete short excerpts; three regression cases pass. All three companies now have sourced management excerpts. Financial normalization and the existing live verification criteria were unchanged; SEC throttling, caching and cooldown were preserved.
- **3 additional live Playwright flows passed**, one each for AAPL/MSFT/RKLB: actual company/ticker search, report and revenue evidence, watchlist, two saved versions and notes. Each closes the browser process and reopens its disk profile with API requests blocked; reports, excerpts, notes, versions and watchlists persist. Real report screenshots were visually reviewed. These are browser tests, not physical iPhone tests. Run explicitly with `npm.cmd run test:live`; ordinary browser tests remain synthetic.
- PostgreSQL usage ledger added for ephemeral hosting; TLS verification, transaction locking, explicit schema initialization, missing-ledger failure and budget checks covered with protocol/error mocks. SQLite concurrency/persistence uses an actual test database. A real hosted PostgreSQL transaction has not been tested because no database credentials/environment are available.
- Release preparation includes an explicit Free Render blueprint, Dockerfile, privacy draft, EAS profiles, public app icon and Windows startup/release runbooks. The blueprint passed validation against [Render's official JSON schema](https://render.com/schema/render.yaml.json). Render deployment is now in progress per the operator; its URL and behavior are not yet verified. Docker CLI exists but its daemon is not running; no container build is claimed.
- Clean temporary checkout: hash-pinned Python installation and `npm ci` succeeded; the committed dependency patch applied and npm reported zero vulnerabilities. All 31 backend tests, mobile TypeScript and six unit tests passed. Fresh FastAPI started on 8002 with healthy status; fresh Metro started on 8082 and a headless Chromium check confirmed HTTP 200, title `TickerBrief`, and the visible search input.
- Fixed the clean-checkout Windows test scratch-directory ACL conflict by keeping pytest temporary data inside the checkout's ignored `.pytest_cache/tmp`. Final iOS Hermes and web exports passed after the latest rendering fixes. The local Hermes executable required running outside Codex's sandbox; no Mac or Xcode was involved.
- Local iOS configuration review confirms the existing owner/project, physical-device development/preview profiles, store production profile, remote versioning and build-number increment. Synthetic process-local guard checks reject missing bundle/project IDs and an HTTP API URL. The real bundle ID remains unset. [IOS_READINESS.md](IOS_READINESS.md) identifies exact membership, team-role, identifier, signing and upload prerequisites; no account credential checks or cloud builds were performed during this review.

## External prerequisites

- SEC contact authorization is resolved: the user supplied and explicitly authorized the local identifying contact. Live retrieval and filing verification succeeded. No inferred account contact is used.
- AI credentials and free-tier eligibility are not verified. Live generation stays disabled.
- Expo CLI is signed in as `jeppy22`; GitHub CLI as `Jeppy22`. EAS project `ba290e73-7370-4c6e-b557-1ea2e21987d0` was created and its link verified. Owner remains `jeppy22`. Free quota verified 2026-09-16: 3/15 iOS and 3/30 total builds used. Apple team permissions, registered bundle identifier and App Store Connect app ID are unverified. No cloud build started.
- Render deployment is in progress per the operator. Its HTTPS URL is the next handoff; deployment configuration was left unchanged. Hosting and Apple credentials were not rechecked during this resilience review.
- npm audit now reports **zero vulnerabilities**, after scoped patched dependencies plus a committed, tested CommonJS compatibility patch. See DEPENDENCIES.md.

## Next task

When the operator supplies the running deployment's HTTPS URL, check `/health` and response time, confirm SEC configured and AI disabled, then run the existing AAPL/MSFT/RKLB filing audit against that URL. Record actual hosted cold-start and SEC access results before setting the mobile build URL. Leave the in-progress deployment configuration unchanged. [IOS_READINESS.md](IOS_READINESS.md) lists the Apple prerequisites and the exact hosted-audit command. Live interpretation remains disabled pending verified free model access and durable storage; Apple signing and physical testing remain external. Code is on branch `feat/private-beta`; startup commands are in [README.md](../README.md).

## Acceptance audit

| Goal criterion | Current evidence/status |
| --- | --- |
| Fresh Windows checkout starts both services | Passed: clean dependency installs, fresh API health, fresh Metro and browser rendering |
| Real dated reports for supported searches | Passed locally for AAPL/MSFT/RKLB: 50/50 financial source facts verified, sourced business excerpts, live app search/read flows |
| Live summary and bull/bear evidence verified | Not met; no model credential/free-tier verification or live generation |
| Watchlist, snapshots, notes survive restart | Live disk-profile browser restarts passed for all three companies with API blocked; physical iPhone pending |
| Honest missing/offline/loading/error states | Seven synthetic browser scenarios pass, including delayed responses, manual retries, saving during refresh, failed writes and offline note edits |
| Relevant checks documented | Current mobile changes: lint/types, seven synthetic browser scenarios and iOS/web JavaScript exports. Prior backend/live evidence remains 34 backend tests, 3 live browser flows and 50/50 live filing facts; not rerun against Render. Unchanged-dependency/storage evidence: 6 unit tests, Doctor, dependency audit and clean installation |
| Hosted backend and TestFlight build | Not met; deployment underway, HTTPS URL verification and Apple identity/signing prerequisites pending |
| Remaining review/device steps identified | RELEASE.md separates signing, upload, Apple processing, beta review and device checks |

This goal is **not complete**. Live factual research is now verified locally. Live AI quality, cloud deployment, a signed binary and physical-device verification remain unproven.
