# Hosted verification — 2026-09-16

Backend: **https://tickerbrief-api.onrender.com**. This document distinguishes actual hosted retrieval, local browser behavior, simulated delays, and unperformed native-device checks.

## Health and real reports

The first HTTPS `/health` request returned HTTP 200 with `service=TickerBrief`, `sec_configured=true`, and `ai_enabled=false` after **42.55 seconds**. A subsequent request took **8.85 seconds**. The initial delay is consistent with a free-service wake-up; Render's instance state was not available to confirm the cause. These are single observations, not a latency guarantee.

The unchanged `services/api/scripts/verify_live.py` completed with exit code 0 against the deployed service at **2026-09-16 22:36:13 UTC**, and passed again on the requested recheck at **22:58:31 UTC**. It retrieved actual hosted reports, then independently compared their financial source records against official SEC inline-XBRL filings using the authorized local SEC client/cache. The [latest complete audit](verification/2026-09-16-hosted-sec-audit.json) retains report IDs, retrieval dates, concepts, values, units, periods, accessions and matching excerpts. The recheck's preceding health request again confirmed SEC configured and AI disabled, took **32.62 seconds**, and still omitted the browser CORS header.

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

At **23:01:21 UTC**, a direct Chromium check observed the search loading state, the connection-error state, and the same loading/error sequence after clicking **Try search again**. Exactly two hosted company-search requests were issued, one per user action; both were blocked by the missing CORS permission. The observed attempts took 0.873 and 0.336 seconds. [Recorded initial-failure evidence](verification/2026-09-16-hosted-browser.json) contains the URLs, CORS failures and observed states. This checks actual hosted failure handling, not a slow-service hint or a Render cold start. The subsequent successful browser run is recorded below.

The operator corrected **Render → tickerbrief-api → Environment → CORS_ORIGINS** to:

```text
http://127.0.0.1:8081,http://localhost:8081
```

Choose **Save and deploy** in the environment save dropdown. This redeploys the existing build with the new value, including when automatic deployment is disabled. **Save only** does not apply the value to the running service. Keep the Free plan, `AI_ENABLED=false` and SEC settings unchanged. See [Render's documented save options](https://render.com/docs/configure-environment-variables#in-the-render-dashboard).

No backend code changes required a new build. This environment correction allows the two local preview origins; native iPhone networking is not governed by browser CORS. The operator applied the exact value with **Save and deploy**. An immediate check still rejected both origins; a fresh response at **23:05:40 UTC** returned `Access-Control-Allow-Origin: http://127.0.0.1:8081`, with SEC configured and AI disabled. The value itself was valid. Deployment propagation timing was not independently observable. The blueprint now records that same explicit allowlist so a future synchronization does not restore the empty value. Free plan, disabled automatic deploys, AI setting, SEC configuration and worker/throttle settings are unchanged. No Render account credentials were probed. A Git push alone does not deploy environment changes.

## Successful hosted browser acceptance

After the deployed CORS correction, `npm.cmd run test:live` passed **3/3** Chromium scenarios against the hosted service in **44.1 seconds**: AAPL 11.8 seconds, MSFT 22.0 seconds and RKLB 9.4 seconds. These are complete test durations, not API latency measurements. Report screenshots at 390×844 were visually reviewed.

Each scenario searched the actual company/ticker, retrieved and validated its real report, inspected the retained revenue source evidence, added a watchlist entry, saved two report versions and wrote notes. The browser process then closed and reopened its disk profile with all research API requests blocked. Saved reports, notes, retained source excerpts, versions and watchlists persisted. AAPL additionally edited and saved notes with API access blocked, reloaded to confirm persistence, opened current research to observe a connection error, restored direct hosted access and completed a successful manual retry.

Successful responses came directly from the hosted service, with normal browser CORS enforcement and no fixture bodies or proxy. The offline/recovery portion deliberately blocks client API access; it is not an observed Render outage. App assets still load from local Metro. These are browser checks, not a signed iOS build, physical iPhone test or proof of fully offline native launch. The earlier 32.62–42.55-second health observations and synthetic 90-second timeout checks remain distinct from this successful run; a controlled native cold-start test remains pending.

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
