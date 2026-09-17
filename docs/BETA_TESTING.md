# Private TestFlight handoff

The production build **0.1.0 (2)**, ID **`3797cb4d-c4f0-425d-8910-af53165d726c`**, source **`4bed83a9a9547ad25fd2ce23bb67c0e4c4fac408`**, has been uploaded and processed by Apple. It is **ready for internal testing** (`VALID` / `READY_FOR_BETA_TESTING`). [Submission receipt and Apple status](verification/2026-09-17-testflight-submission.json). No tester invitations or public link have been created. The operator confirmed private review contact details are saved; physical-device results are not yet available.

## App Store Connect fields

- App: **6812926318**, bundle **com.jeppyinvesting.tickerbrief**, team **98BBY4NN94**.
- Privacy Policy URL: **https://jeppy22.github.io/TickerBrief/privacy/**.
- Support URL: **https://jeppy22.github.io/TickerBrief/support/**.
- Beta Feedback Email: use the operator-approved public address displayed on the support page.
- Beta review name/email/phone: operator confirmed these are saved directly in App Store Connect; private contact fields are not committed.
- Sign-in required: **No**. Use the review notes below; no demonstration account is needed.

Both public pages were verified with anonymous HTTPS 200 responses. The policy discloses GitHub Pages visitor IP logging and Apple's automatic TestFlight collection as well as app/backend processing. No fixed provider-wide log deletion period is asserted.

## Install on your iPhone

Perform these steps manually to invite only yourself. No new build or upload is needed.

1. Open [App Store Connect → TickerBrief → TestFlight](https://appstoreconnect.apple.com/apps/6812926318/testflight/ios) under team **98BBY4NN94**. Confirm iOS build **0.1.0 (2)** appears.
2. Click **+** next to **Internal Testing**, name the group **Private Beta**, leave **Enable automatic distribution** unchecked, and click **Create**. If you already have a private group, select it and confirm automatic distribution is disabled and its tester list contains only intended users before adding the build.
3. In the group, click **Add Builds**, select **0.1.0 (2)**, click **Next**, enter the “What to test” checklist below, and click **Add**.
4. Click **Invite Testers** (or **+** next to Testers), select **only your own App Store Connect user**, then click **Add**. If your user is missing, check that you are in the correct team and that the user has access to TickerBrief in **Users and Access**; use an eligible Account Holder, Admin, App Manager, Developer or Marketing role. Do not create an external group or public invitation link. These steps follow [Apple's internal-testing instructions](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers).
5. On your iPhone running **iOS 16.4 or later**, install [TestFlight from the App Store](https://apps.apple.com/us/app/testflight/id899247664). Open your invitation email on that iPhone, tap **View in TestFlight**, then **Accept** and **Install**. See [Apple's installation instructions](https://testflight.apple.com/).
6. Launch TickerBrief and run the checklist below. Record your device model, iOS version and **0.1.0 (2)** with the actual results. The application needs no login. TestFlight installation does not require a Mac, Xcode or registering an ad hoc device UDID.

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

The physical-device steps above are **pending**, not completed results. Record device model, iOS version, build number, ticker, steps and observed behavior for each failure. Use the approved feedback address on the [support page](https://jeppy22.github.io/TickerBrief/support/); avoid including private notes or credentials in shared diagnostics.

## Notes for review

- No app account, login or brokerage account is required.
- Search/report requests use the hosted HTTPS backend. Free hosting can take time to wake; the app shows a delayed-response hint and offers manual retry after failure. Saved research and notes remain device-local.
- Watchlists, saved snapshots and personal notes are not synchronized to another device. Uninstalling or clearing app storage may erase them.
- Financial facts, management excerpts and calculations are identified separately. Disabled model output is shown as unavailable; no demonstration research substitutes for live filings.
- No payments, subscriptions, advertisements, trading or public social features are included.

Build, upload and Apple processing are complete. External beta review has not been requested or approved; the current handoff is internal testing only. Follow [RELEASE.md](RELEASE.md) for the recorded upload and read-only monitoring commands. Keep build, upload, processing, review and physical-device outcomes separate. AI remains disabled and no billing settings changed.
