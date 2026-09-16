# TickerBrief private iPhone beta

**Stock research, clearly explained.**

Search a supported US public company, read a dated research brief, inspect its evidence, save a report version, write notes, and reopen it offline.

## Scope

- Expo React Native / TypeScript / Expo Router in `apps/mobile`; FastAPI in `services/api`.
- SEC ticker and company-name search. Initial financial coverage: US-GAAP filers with 10-K reports and USD facts. Unsupported filings/currencies must be explicit.
- Company identity and sourced business overview; available revenue, net income, operating cash flow, cash and debt; comparable history and calculated changes.
- Annual and interim reporting periods distinguished. Interim cumulative cash flow is never called a single quarter. No made-up zeros or fabricated facts.
- Source records retain accession, filing date, reporting period, retrieval date, concept, unit and supporting excerpt/value.
- Summary and bull/bear interpretation must identify evidence and assumptions. Disabled/unavailable model output cannot masquerade as completed research.
- Watchlist, dated report snapshots, editable notes, deletion, and offline reopening persist on this device. Refresh cannot mutate saved snapshots.
- Search, Watchlist, Saved Research, Settings; clear loading, empty, offline, stale, unsupported and error states.
- No accounts/sync, influencer tracking, brokerage links, trading, feeds, subscriptions, or content generation.

## Acceptance gates

1. Fresh checkout starts both services using documented PowerShell commands and lockfiles.
2. Search produces real dated reports; AAPL, MSFT and RKLB are checked against filings.
3. Live summaries and bull/bear cases are checked against evidence. Until verified free-tier access exists, integration/tests finish but this gate remains blocked.
4. Watchlist, saved versions and notes survive app restart; older versions remain unchanged after refresh; saved reports read offline.
5. Unavailable values, sources, model output, and networking failures are represented honestly.
6. Automated coverage checks financial normalization, source association, invalid model output, unavailable data, limits, and persistence. Record fixture versus live evidence separately.
7. Backend is hosted independently of the development PC within verified free allowances; EAS iOS build is uploaded for TestFlight.
8. Apple processing/review and physical-device testing are tracked separately, without claiming unperformed checks.

No private provider key is shipped to mobile. No billing is enabled. No public release or automatic invitations.
