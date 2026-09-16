# Hosted verification — 2026-09-16

Backend: **https://tickerbrief-api.onrender.com**. This document distinguishes actual hosted retrieval, local browser behavior, simulated delays, and unperformed native-device checks.

## Health and real reports

The first HTTPS `/health` request returned HTTP 200 with `service=TickerBrief`, `sec_configured=true`, and `ai_enabled=false` after **42.55 seconds**. A subsequent request took **8.85 seconds**. The initial delay is consistent with a free-service wake-up; Render's instance state was not available to confirm the cause. These are single observations, not a latency guarantee.

The unchanged `services/api/scripts/verify_live.py` completed with exit code 0 against the deployed service at **2026-09-16 22:36:13 UTC**. It retrieved actual hosted reports, then independently compared their financial source records against official SEC inline-XBRL filings using the authorized local SEC client/cache. The [complete audit](verification/2026-09-16-hosted-sec-audit.json) retains report IDs, retrieval dates, concepts, values, units, periods, accessions and matching excerpts.

| Hosted report | Matching financial facts | Sourced business excerpt | Missing requested metrics | Interpretation |
| --- | --- | --- | --- | --- |
| AAPL | 20/20 | Available | None | Disabled |
| MSFT | 10/10 | Available | None | Disabled |
| RKLB | 20/20 | Available | None | Disabled |

All three reports were fresh. No normalization or financial-source verification failure occurred. Verification criteria, SEC request identification, the two-request/second throttle, caching and cooldown behavior were unchanged. No model request or paid service was used.

Reproduce from `services/api`, keeping the approved SEC contact in the ignored local environment file:

```powershell
..\..\.venv\Scripts\python.exe scripts\verify_live.py --base-url https://tickerbrief-api.onrender.com --output ../../artifacts/hosted-live-verification.json
```

## Browser deployment issue

The deployed service initially omitted `Access-Control-Allow-Origin` for `http://127.0.0.1:8081`. Chrome reproduced the failure in the actual app: searching AAPL requested the hosted `/v1/companies?q=AAPL`, Chrome blocked its response under CORS, and the app displayed its connection-error message. No proxy, browser-security flag, or substituted response was used.

The operator must set **Render → tickerbrief-api → Environment → CORS_ORIGINS** to:

```text
http://127.0.0.1:8081,http://localhost:8081
```

Save/redeploy the existing Free service with `AI_ENABLED=false` and SEC settings unchanged. This allows the two local preview origins; native iPhone networking is not governed by browser CORS. The checked-in Render blueprint remains unchanged, and no Render account credentials were probed. Hosted browser acceptance is pending this environment update.

## Mobile configuration and checks

The ignored `apps/mobile/.env`, its public example, and all three existing EAS build profiles now use the hosted HTTPS URL. Project ownership, identifiers, distribution modes and version settings are retained. The live browser suite accepts `EXPO_PUBLIC_API_URL`, checks disabled-AI health and real CORS permission, and allows the app's existing 90-second request deadline. It stops after the first failure rather than repeatedly probing a blocked service.

An actual export-cache issue was reproduced: initial exports completed but reused the previous API configuration. Clearing Metro's cache rebuilt both iOS Hermes and web bundles successfully; inspection confirmed the hosted HTTPS URL and absence of the previous localhost API URL. Both export scripts now include `--clear`; URL changes also require restarting Metro with that flag. TypeScript, ESLint, formatting and EAS profile assertions passed. JavaScript export success alone does not establish native behavior.

In one PowerShell terminal, from `apps/mobile`:

```powershell
$env:EXPO_PUBLIC_API_URL = 'https://tickerbrief-api.onrender.com'
npm.cmd run web -- --port 8081 --clear
```

In a second terminal in that directory:

```powershell
$env:EXPO_PUBLIC_API_URL = 'https://tickerbrief-api.onrender.com'
npm.cmd run test:live
```

The suite uses actual AAPL/MSFT/RKLB responses for search, reports, source excerpts, two saved versions and notes. It closes Chromium and reopens its disk profile with research requests blocked. It additionally exercises offline note edits and a manual retry after restoring direct access to the hosted API. Browser app assets still load from Metro; this does not prove a fully offline native app launch.

Previously passed local simulations cover a delayed response, the 10-second slow-service hint, the 90-second deadline, HTML/JSON errors, manual recovery and retained saved research. Accelerated browser-clock tests do not prove an actual Render cold start in the app. A signed iOS build, TestFlight upload and physical iPhone test remain unperformed.
