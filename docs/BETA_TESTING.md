# Private TestFlight handoff — draft

This text is prepared for the first private iPhone beta. It has not been submitted to Apple, and no tester invitations or public link have been created. The production build is **0.1.0 (2)**, ID **`3797cb4d-c4f0-425d-8910-af53165d726c`**, source **`4bed83a9a9547ad25fd2ce23bb67c0e4c4fac408`**. Upload authentication and confirmation of saved private review-contact fields remain pending; physical-device results are not yet available.

## App Store Connect fields

- App: **6812926318**, bundle **com.jeppyinvesting.tickerbrief**, team **98BBY4NN94**.
- Privacy Policy URL: **https://jeppy22.github.io/TickerBrief/privacy/**.
- Support URL: **https://jeppy22.github.io/TickerBrief/support/**.
- Beta Feedback Email: use the operator-approved public address displayed on the support page.
- Beta review name/email/phone: operator enters directly in App Store Connect; do not commit private contact fields.
- Sign-in required: **No**. Use the review notes below; no demonstration account is needed.

Both public pages were verified with anonymous HTTPS 200 responses. The policy discloses GitHub Pages visitor IP logging and Apple's automatic TestFlight collection as well as app/backend processing. No fixed provider-wide log deletion period is asserted.

## Beta description

TickerBrief helps you understand US public companies using dated research drawn from SEC filings. Search a company, read available financial results and business excerpts, and inspect the supporting evidence. Save a report version and add personal notes so you can reopen your research later, including when the research service is unavailable.

This beta covers supported US-GAAP companies with 10-K filings and USD financial data. Some companies or figures may be unavailable. Model interpretation is currently disabled. TickerBrief provides research for understanding, not personalized investment advice or trading instructions.

## What to test

1. Search for Apple/AAPL, Microsoft/MSFT and Rocket Lab/RKLB. Check company identity, reporting periods and retrieval dates.
2. Open the revenue evidence and business excerpt. Check the retained source information and open the original filing while connected.
3. Add a company to the watchlist, save a report, write a note and save the note.
4. Open current research and save a second version. Confirm the first version and its notes remain unchanged.
5. Force-quit and reopen the installed app. Turn on airplane mode and reopen both saved versions and their retained source excerpts. Edit and save a note, then restart again and confirm it persists. Original SEC web links need connectivity.
6. Restore connectivity, retry failed research and refresh. Confirm older saved reports stay unchanged.
7. Delete one saved version and confirm the other remains. Check a smaller screen and larger accessibility text for clipped controls or unreadable research.

The physical-device steps above are **pending**, not completed results. Record device model, iOS version, build number, ticker, steps and observed behavior for each failure. Use the operator-approved feedback route once provided; avoid including private notes or credentials in shared diagnostics.

## Notes for review

- No app account, login or brokerage account is required.
- Search/report requests use the hosted HTTPS backend. Free hosting can take time to wake; the app shows a delayed-response hint and offers manual retry after failure. Saved research and notes remain device-local.
- Watchlists, saved snapshots and personal notes are not synchronized to another device. Uninstalling or clearing app storage may erase them.
- Financial facts, management excerpts and calculations are identified separately. Disabled model output is shown as unavailable; no demonstration research substitutes for live filings.
- No payments, subscriptions, advertisements, trading or public social features are included.

Before submission, the operator must configure the separate EAS Submit key and confirm the private review-contact fields are saved. Public contact/URLs and team/app/build signing are resolved; the actual archive's privacy manifest and encryption declaration were inspected, with Apple validation still pending. Follow [RELEASE.md](RELEASE.md), including **`--no-auto-testflight-setup`** and the exact successful build ID. Keep build, upload, processing, review and physical-device outcomes separate.
