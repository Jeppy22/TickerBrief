# Private TestFlight handoff

The first release **0.1.0 (2)**, ID **`3797cb4d-c4f0-425d-8910-af53165d726c`**, was uploaded, processed and installed by the operator. [Original submission receipt](verification/2026-09-17-testflight-submission.json). A stabilization build is being prepared for the existing private testing group; its delivery will be recorded here after completion. The operator confirmed private review contact details are saved. No new tester invitations or public links are part of this update.

## First physical observations

Device: **iPhone 17 Pro**, build **0.1.0 (2)**; exact iOS version not supplied. The operator reports successful research retrieval, SEC filing links, saving reports and personal notes, persistence after reopening, and normal keyboard behavior. Values sometimes wrap or clip, and the company screen's back label shows `(tabs)`.

Airplane mode produced a connection error, but it is unknown whether the user was in live research or a saved snapshot. **Offline saved access remains unconfirmed on the iPhone.** Automated browser tests of saved research/source excerpts and note edits after process restarts pass with external requests blocked; Metro assets remain local. Those tests do not replace the device retest.

## Device retest checklist

1. Before updating, confirm at least one existing saved report and note and record their ticker/text privately. **Update through TestFlight over the existing installation; do not delete/reinstall TickerBrief or clear its storage.** Confirm the new build number, record the exact iOS version from Settings → General → About, and check the existing snapshots and notes are unchanged.
2. Open both live research and an existing saved snapshot. Check current and prior-year amounts, signs, units, reporting periods and decimal digits, including a negative amount where present. Inspect source details and their full reported values. Repeat with larger text under Settings → Accessibility → Display & Text Size → Larger Text. At extreme sizes, use the indicated horizontal swipe to read every digit; verify no ellipses or split decimals.
3. Check the native **Back** button from a live report opened from Search, a saved report opened from Saved Research, and current research opened from a saved snapshot. Confirm each returns to the previous screen, including the native edge-swipe gesture.
4. Turn on airplane mode **and ensure Wi-Fi is off**. Force-quit TickerBrief, reopen it, select **Saved Research**, then select an existing saved snapshot (not **Open current research**). Read its report and retained business/financial source excerpts. Edit a note, save it, force-quit/reopen again while still offline, and confirm the edit persists.
5. While offline, try **Open current research** and a fresh company search. A connection error is expected; use **Open saved research** to return to the local library. Original SEC links require connectivity. Restore connectivity, retry live research, and confirm earlier snapshots/notes remain unchanged.

Record each result as pass/fail/unconfirmed with device model, iOS version, build number, ticker, exact screen/path and steps. Native verification of these fixes and survival across this app update are **pending until the operator retests**. No automated result is represented as a physical-device pass.

## App Store Connect fields

- App: **6812926318**, bundle **com.jeppyinvesting.tickerbrief**, team **98BBY4NN94**.
- Privacy Policy URL: **https://jeppy22.github.io/TickerBrief/privacy/**.
- Support URL: **https://jeppy22.github.io/TickerBrief/support/**.
- Beta Feedback Email: use the operator-approved public address displayed on the support page.
- Beta review name/email/phone: operator confirmed these are saved directly in App Store Connect; private contact fields are not committed.
- Sign-in required: **No**. Use the review notes below; no demonstration account is needed.

Both public pages were verified with anonymous HTTPS 200 responses. The policy discloses GitHub Pages visitor IP logging and Apple's automatic TestFlight collection as well as app/backend processing. No fixed provider-wide log deletion period is asserted.

## Install on your iPhone

For this update, use the **existing private internal testing group and existing tester**. The new build number will be recorded at the top of this document when processing completes. No new invitations or public release are needed.

1. Open [App Store Connect → TickerBrief → TestFlight](https://appstoreconnect.apple.com/apps/6812926318/testflight/ios) under team **98BBY4NN94** and select your existing group under **Internal Testing**.
2. Keep **Enable automatic distribution** disabled. In the group's **Builds** section, click **Add Builds**, select the processed stabilization build recorded above, then **Next**.
3. Paste the **Device retest checklist** above into **What to Test**, then click **Add**. Keep the group's existing tester list unchanged. Do not create a new group, invite testers, or enable a public link. These steps follow [Apple's internal-testing instructions](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers).
4. On your iPhone, open **TestFlight → TickerBrief → Update**. If necessary, open **Previous Builds** and select the new **0.1.0** build number. Update over the installed build 2; do not uninstall the app. See [Apple's TestFlight instructions](https://testflight.apple.com/).
5. Launch TickerBrief and run the device retest checklist. Record the exact device/iOS/build versions and actual results. The application needs no login. No Mac, Xcode or ad hoc device registration is required.

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

The operator's partial build-2 observations are recorded above. This complete checklist and the stabilization retest are **not yet verified on device**, particularly offline saved access. Record device model, iOS version, build number, ticker, steps and observed behavior for each failure. Use the approved feedback address on the [support page](https://jeppy22.github.io/TickerBrief/support/); avoid including private notes or credentials in shared diagnostics.

## Notes for review

- No app account, login or brokerage account is required.
- Search/report requests use the hosted HTTPS backend. Free hosting can take time to wake; the app shows a delayed-response hint and offers manual retry after failure. Saved research and notes remain device-local.
- Watchlists, saved snapshots and personal notes are not synchronized to another device. Uninstalling or clearing app storage may erase them.
- Financial facts, management excerpts and calculations are identified separately. Disabled model output is shown as unavailable; no demonstration research substitutes for live filings.
- No payments, subscriptions, advertisements, trading or public social features are included.

Build, upload and Apple processing are complete. External beta review has not been requested or approved; the current handoff is internal testing only. Follow [RELEASE.md](RELEASE.md) for the recorded upload and read-only monitoring commands. Keep build, upload, processing, review and physical-device outcomes separate. AI remains disabled and no billing settings changed.
