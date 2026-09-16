# TickerBrief

**Stock research, clearly explained.**

A private-beta investing research app: search a US company, inspect SEC financial evidence, save dated research and add personal notes. Expo React Native + TypeScript + Expo Router in `apps/mobile`; Python FastAPI in `services/api`.

This is a new project. See [verified status and blockers](docs/STATUS.md), [scope and acceptance gates](docs/MVP.md), and [release runbook](docs/RELEASE.md). A working development build is not a completed TestFlight release. Live interpretation is disabled.

## Windows setup (PowerShell)

Prerequisites: Git, Node **22 LTS ≥22.13** (verified here: 22.18.0), Python **3.13** via the Windows `py` launcher. A Mac, Xcode, and an iOS simulator are not needed.

From this checkout's root:

```powershell
Set-Location 'C:\Users\JEMJR\OneDrive\Desktop\TickerBrief'
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --require-hashes -r services\api\requirements-dev.txt
if (-not (Test-Path services\api\.env)) { Copy-Item services\api\.env.example services\api\.env }
Set-Location apps\mobile
npm.cmd ci
```

Use the virtual environment's executable directly; no activation or permanent PowerShell execution-policy change is required. `npm.cmd` avoids the PowerShell npm shim. Do not recreate an existing virtual environment unnecessarily.

Edit `services/api/.env`: set `SEC_USER_AGENT=TickerBrief YOUR_APPROVED_CONTACT_EMAIL`. That email is sent to SEC for its required automated-access identification. The example address is intentionally rejected. Without an approved contact the API still starts but research returns a clear setup error. `.env` is ignored by Git. Leave `AI_ENABLED=false`; no model key is needed for factual research.

## Start the backend — terminal 1

```powershell
Set-Location 'C:\Users\JEMJR\OneDrive\Desktop\TickerBrief\services\api'
..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

[Health](http://127.0.0.1:8000/health) and [API docs](http://127.0.0.1:8000/docs). Stop with Ctrl+C. Restart after changing `.env`. A successful health response proves startup, not SEC/model availability. Use **one worker and one instance** to preserve the shared SEC throttle.

## Start mobile / browser preview — terminal 2

```powershell
Set-Location 'C:\Users\JEMJR\OneDrive\Desktop\TickerBrief\apps\mobile'
$env:EXPO_PUBLIC_API_URL = 'http://127.0.0.1:8000'
npm.cmd run web -- --port 8081
```

For the native iPhone development flow on the same Wi-Fi network, use your PC's actual LAN IPv4 from `ipconfig`, not `127.0.0.1`:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://YOUR_PC_LAN_IP:8000'
npm.cmd start -- --lan --port 8081
```

Open the QR code in a compatible Expo Go or installed EAS development build; use a development build when Expo Go does not include this SDK. If Windows prompts about networking, allow the app only on your trusted private network. No local Xcode command is part of this workflow. The release runbook explains cloud builds. A TestFlight build must use the hosted **HTTPS** backend, never the developer PC.

All `EXPO_PUBLIC_` values ship in the app. They may contain a public API URL, **never provider keys**. When modifying this URL, restart Metro. If SDK network validation is temporarily unavailable, `npm.cmd start -- --offline` starts Metro without contacting Expo (SEC research still needs its own connection).

## Checks

Backend, from `services/api`:

```powershell
..\..\.venv\Scripts\python.exe -m pytest -q
..\..\.venv\Scripts\ruff.exe check .
..\..\.venv\Scripts\ruff.exe format --check .
```

Mobile, from `apps/mobile`:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npx.cmd expo-doctor
npm.cmd audit
npm.cmd run export:ios
npm.cmd run export:web
```

Browser acceptance tests (keep Metro web running on 8081):

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

These browser tests intercept requests with explicitly synthetic TEST fixtures. Production code never imports them. Tests cover source inspection, watchlists, snapshot versioning, notes, restart persistence, offline API access, deletion, and failure states. iOS JavaScript export does not prove native signing, TestFlight upload, or physical-device behavior.

Once an approved SEC contact is configured and the factual API is running with AI disabled, run the independent live filing audit from `services/api`:

```powershell
..\..\.venv\Scripts\python.exe scripts\verify_live.py --base-url http://127.0.0.1:8000
```

It checks AAPL, MSFT and RKLB report values against the underlying inline-XBRL filing facts, including units, scaling, sign, period and accession. It writes `artifacts/live-verification.json`. Unmatched facts fail the audit and require inspection; do not label the report verified just because URLs resolve.

## Data and storage

The backend caches SEC company directory, submissions, companyfacts and filing excerpts. SEC requests are identified, serialized at at most two/second and paused after 403/429. Facts use USD and consolidated US-GAAP tags. Annual and fiscal-year-to-date periods are explicit; missing values stay unavailable. Exact source records and code-calculated changes are kept in reports. Debt coverage is labeled and intentionally does not claim total obligations.

Watchlists, report snapshots, source excerpts and notes persist in device-local AsyncStorage. No accounts or cloud sync. Uninstalling/clearing storage may erase them. Refreshing live research never overwrites a saved version. Opening SEC links needs a connection, but retained excerpts and saved reports do not.

The optional Gemini adapter is server-only and fails closed without verified free-tier eligibility, billing disabled, expiring operator attestation, model/key, and a durable initialized usage ledger. It enforces input/output/request caps and validates structured citations/excerpts. Failed generation preserves factual research. See [model operation](docs/AI.md). No fixture narrative is displayed as live interpretation.

## Repository map

- `apps/mobile/src/app`: Search, Watchlist, Saved Research, Settings and report routes.
- `apps/mobile/src/lib`: typed API validation and serial device persistence.
- `services/api/app`: SEC client, normalization, evidence, API and guarded model adapter.
- `services/api/scripts/verify_live.py`: explicit live report audit.
- `render.yaml` / `services/api/Dockerfile`: backend deployment preparation.
- `docs`: scope, status, methodology, release, privacy, and verification evidence.

No brokerage connections, subscriptions, social features or trading instructions are included.
