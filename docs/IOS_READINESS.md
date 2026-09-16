# iOS beta readiness

Reviewed on 2026-09-16. This is configuration review, not proof of Apple account access, signing, upload, or a physical iPhone test. One read-only lookup used the existing Expo session for the newly supplied bundle ID; no Apple sign-in or cloud build was started.

## Established configuration

`npx.cmd expo config --type public --json` resolves to **TickerBrief**, owner `jeppy22`, slug `tickerbrief`, and EAS project `ba290e73-7370-4c6e-b557-1ea2e21987d0`. SDK 57, iPhone-only support and the standard-HTTPS encryption declaration are retained. The operator confirmed registered bundle ID **`com.jeppyinvesting.tickerbrief`** and Apple Team ID **`98BBY4NN94`**. The bundle is configured through the existing `IOS_BUNDLE_IDENTIFIER` setting in ignored local `.env`, its public example and all three EAS profiles. `ios.appleTeamId` selects the supplied team for native targets, as documented in [Expo's configuration reference](https://docs.expo.dev/versions/v57.0.0/config/app/#appleteamid).

The existing `eas.json` provides:

| Profile | Intended artifact | Existing settings |
| --- | --- | --- |
| `development` | Installable development client | Internal distribution, development environment, physical device |
| `preview` | Internal preview | Internal distribution, preview environment, physical device |
| `production` | TestFlight/App Store distribution archive | Store distribution, production environment, automatic build-number increment |

Remote app-version management remains enabled. `submit.production` is intentionally empty until the numeric App Store Connect Apple ID is known; no `ascAppId` is guessed. The app configuration requires the existing EAS project, `IOS_BUNDLE_IDENTIFIER`, and an HTTPS `EXPO_PUBLIC_API_URL` for cloud builds. All three profiles supply the registered bundle ID and retain `https://tickerbrief-api.onrender.com` as their public API URL. Ownership, distribution and version settings are unchanged.

Local checks confirmed the build profiles above and exercised the cloud-config guard with process-local synthetic values: missing bundle ID, missing project ID and an HTTP API URL are rejected; a complete synthetic HTTPS configuration preserves the real Expo owner/project. These checks created no Apple identifier, EAS build, or persisted example credentials.

After configuring the supplied identifiers, the actual Expo CLI resolved the expected bundle/team/owner/project in local mode and with each of the three EAS profile environments, including `EAS_BUILD=true`. TypeScript, ESLint and formatting passed. These are local configuration checks; they do not prove Apple membership, certificate validity or a signed native build.

The read-only EAS lookup found no identifier record for this bundle under `jeppy22`. Its Apple registration is supplied by the operator; the separate EAS signing setup has not yet linked it. An existing Apple distribution certificate may still be reused through the official credential flow. No signing files were fetched, created or revoked, and no account quota was consumed by a build.

## Missing Apple prerequisites

| Requirement | Exact information or action still needed |
| --- | --- |
| Active membership | Confirm that the existing team has active **Apple Developer Program** membership and accepted required agreements. A free personal Apple account is insufficient for this release. No enrollment, renewal or payment is authorized by this runbook. |
| Apple sign-in | Use the authorized team member's Apple Account with two-factor authentication and access to a trusted device/phone for the official sign-in flow. Never share its password or verification codes. |
| Correct team | Team ID **`98BBY4NN94`** is supplied and configured. Select that team in Apple Developer and App Store Connect; enrollment type and signing role remain to be confirmed. |
| Signing access | For individual enrollment, the Account Holder must prepare signing credentials. For an organization, use the Account Holder/Admin, or an App Manager with **Access to Certificates, Identifiers & Profiles**. An invitation to an individual owner's App Store Connect alone does not grant Developer Program signing access. |
| Existing bundle ID | **Resolved:** the operator confirmed **`com.jeppyinvesting.tickerbrief`** is registered. It is configured locally and in every EAS build profile. Reuse it; do not register a replacement. |
| App Store Connect app | Open Apps → TickerBrief → App Information. Confirm the bundle ID and record its numeric **Apple ID** (`ascAppId`). If the app record does not exist, the team's authorized app manager must create it using the intended bundle ID. Reuse any existing record. |
| Build signing | EAS needs a valid distribution certificate and corresponding private key, plus an App Store distribution provisioning profile for that team and bundle ID. An authorized team member can configure/reuse these through EAS-managed credentials. Do not revoke an existing certificate or commit signing files. |
| Upload access | The uploading account needs access to this App Store Connect app and an Account Holder, Admin, App Manager or Developer role. Configure EAS Submit authentication through its official flow; keep passwords, 2FA codes and API keys out of chat and Git. |
| Development device, if used | Internal development/preview builds need the iPhone registered by UDID and included in their ad hoc provisioning profile. TestFlight distribution does not use that device-registration path. |

The distinction between signing and app access follows [Expo's EAS role requirements](https://docs.expo.dev/app-signing/apple-developer-program-roles-and-permissions/) and [Apple's individual/organization permissions](https://developer.apple.com/help/account/access/roles/). Upload roles are documented by [Apple](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/). The numeric app ID and Windows submission workflow are described in [EAS Submit for iOS](https://docs.expo.dev/submit/ios/). No push-notification key is needed for the current app's features.

## Manual handoff

The remaining nonsecret handoff is the **numeric App Store Connect Apple ID**, plus confirmation of membership/signing access for team `98BBY4NN94`. An authorized colleague can prepare credentials in the existing Expo project if your own role lacks signing access.

An authorized operator can inspect/configure credentials from `apps/mobile` in PowerShell:

```powershell
$env:IOS_BUNDLE_IDENTIFIER = 'com.jeppyinvesting.tickerbrief'
npx.cmd eas-cli@latest credentials --platform ios
```

Select the `production` profile for TestFlight signing and team **`98BBY4NN94`**. Reuse valid existing credentials. This is separate from starting a build. The numeric app ID is needed for submission; it is not itself a signing credential or a prerequisite to compiling a production build. Before starting a build, confirm signing access and remaining Free EAS quota once; the recorded 2026-09-16 quota is historical evidence.

A public privacy-policy URL, approved support/review contact and beta information are still required. Authorization to identify SEC requests does not authorize publishing that contact as the app's support or review address. No testers will be invited automatically.

## Confirm or create the App Store Connect record

1. Open [App Store Connect → Apps](https://appstoreconnect.apple.com/apps) under team `98BBY4NN94`. If TickerBrief already exists, open **General → App Information**, confirm bundle `com.jeppyinvesting.tickerbrief`, and copy the numeric **Apple ID**.
2. If no matching record exists, an Account Holder, Admin or App Manager can select **+ → New App**. Use platform **iOS**, name **TickerBrief**, primary language **English (U.S.)**, and the existing bundle **`com.jeppyinvesting.tickerbrief`**. For a new record only, `tickerbrief-ios-001` is a proposed internal SKU; preserve any existing SKU. Choose user access for the intended team, then create the record.
3. Open **General → App Information** and return its numeric **Apple ID**. This becomes `submit.production.ios.ascAppId` once confirmed. It is distinct from the Team ID, bundle ID and Apple sign-in email. Creating the record does not upload a build or publish the app.

If the bundle is absent from the selector, check the selected team/access instead of registering another identifier. App creation requires the Account Holder's current agreement acceptance. See [Apple's app-record instructions](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/) and [Expo's numeric-ID location](https://docs.expo.dev/submit/ios/#how-to-find-ascappid).

## Hosted handoff and next release action

The supplied URL passed health and the complete 50/50 financial-fact audit. After the operator deployed the CORS environment correction, all three hosted browser scenarios passed, including saved data reopening and manual retry recovery. See [hosted verification](HOSTED_VERIFICATION.md). Apple prerequisites above remain unverified; account checks were not repeated.

To repeat hosted verification after a relevant deployment change:

1. Check `https://tickerbrief-api.onrender.com/health` for `service=TickerBrief`, `sec_configured=true`, and `ai_enabled=false`.
2. From `services/api`, run the existing filing audit:

   ```powershell
   ..\..\.venv\Scripts\python.exe scripts\verify_live.py --base-url https://tickerbrief-api.onrender.com
   ```

3. Run the real browser flow using the hosted URL and actual CORS permissions, following the hosted runbook. Record cold-start observations separately from synthetic timeout checks.
4. Confirm or create the App Store Connect record above and complete the official signing flow for the configured team/bundle. Then use the existing `production` build/submit commands in [RELEASE.md](RELEASE.md). Record build, upload, Apple processing, beta review and physical-device results separately. No local Xcode or simulator build is required.
