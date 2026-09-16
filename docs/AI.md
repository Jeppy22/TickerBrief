# Model interpretation operation

Live generation is **disabled and unverified**. All adapter tests use a mock transport and synthetic TEST evidence. They prove request gating and output validation, not live research quality or free-tier eligibility.

## Enabling prerequisites

Use [Google AI Studio](https://aistudio.google.com/) and its official sign-in flow. Before creating any live request, verify the selected project is on the Free tier, has **no linked billing account or automatic paid overages**, and the chosen model supports free text generation in the user's region. Read its actual RPM, input-token and daily quotas. Public documentation alone does not establish account eligibility. Do not put a key in chat or in mobile configuration.

Server `.env` fields:

- `GEMINI_API_KEY`: a private key for the verified project, never a client key.
- `GEMINI_MODEL`: the exact currently eligible model ID; no potentially billable default is supplied.
- `AI_FREE_TIER_VERIFIED=true`, `AI_BILLING_DISABLED_VERIFIED=true`: operator attestations after checking the provider console. The application cannot independently determine billing status from a key.
- `AI_VERIFIED_UNTIL`: a timezone-aware UTC expiry, renewed only after rechecking eligibility. Blank/unset/expired eligibility must not enable requests.
- `AI_BUDGET_PATH`: a durable initialized SQLite ledger on the **single backend instance**, or `AI_BUDGET_DATABASE_URL`: a private persistent PostgreSQL connection string. Configure exactly one. Never place a SQLite ledger on an ephemeral deployment volume.
- `AI_DAILY_CAP`, `AI_TOTAL_CAP`, `AI_RPM`: set at or below actual account limits. Defaults are ten per rolling 24 hours, one hundred lifetime, one per minute. A failed or invalid response still consumes a reserved request.
- `AI_ENABLED=true` only after all preceding conditions and authorization for live validation are satisfied.

Initialize a new ledger only once, from `services/api`, on the persistent backend host:

```powershell
..\..\.venv\Scripts\python.exe -c "from pathlib import Path; from app.budget import initialize_budget; initialize_budget(Path('.private/ai-budget.sqlite'))"
```

Set `AI_BUDGET_PATH` to its durable absolute path. Back it up securely. The initializer refuses an existing ledger and the request path never creates a missing one. Loss of the ledger disables interpretation. Do not reset it to bypass a global cap. Keep the path outside any public web directory and outside source control.

**Free Render has an ephemeral filesystem.** This repository's Render blueprint intentionally keeps AI disabled. Hosted live interpretation can use the included PostgreSQL ledger adapter with a verified free persistent database and no paid overages. The adapter validates TLS, uses a separate `tickerbrief_ai` schema, locks the request ledger during reservation, and fails closed if the database/schema is lost. No database service has been created or authenticated here; PostgreSQL protocol/error tests use mocks, and live transaction behavior must be checked once the database is supplied.

After verifying a durable provider's free plan and entering its connection string **only** as server-side `AI_BUDGET_DATABASE_URL`, leave `AI_BUDGET_PATH` empty and initialize once:

```powershell
..\..\.venv\Scripts\python.exe -c "from app.config import Settings; from app.budget import initialize_postgres; initialize_postgres(Settings())"
```

Initialization refuses an existing schema and never resets counters. Use the same database on future redeploys; never delete or swap the schema to bypass a cap. A candidate is [Neon's Free plan](https://neon.com/pricing), but its account eligibility and limits must be checked before selection; no paid database is authorized.

## Validation and limitations

The adapter sends public evidence only, no personal notes or saved library. Documents are explicitly untrusted input; no tools or URL-following are enabled. It rejects oversized evidence, limits output, and requires structured summary/bull/bear claims. Each claim must cite known evidence and include exact supporting excerpts; bull/bear cases must state assumptions. Numerical prose and obvious trading instructions are rejected. Financial numbers and changes come from code.

Citation existence and verbatim excerpt matching do **not** prove semantic entailment. A human must check each live summary and case against the supplied evidence before the live-quality acceptance gate can pass. In particular, check that revenue growth is not confused with profitability, cash is not called total liquidity, long-term debt is not called all liabilities, and conditional statements are not presented as forecasts. Record provider/model, date, complete source IDs, and findings for AAPL/MSFT/RKLB.

On any provider, quota, budget, parsing, or evidence error, the factual brief remains available and the app explicitly says interpretation is unavailable. There is no generic company-narrative fallback.
