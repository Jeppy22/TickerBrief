# iOS beta readiness

Reviewed on 2026-09-16. This is configuration review, not proof of Apple account access, signing, upload, or a physical iPhone test. EAS quota was checked and production credential setup reached the Apple login prompt; it was cancelled before authentication. No cloud build was started.

## Established configuration

`npx.cmd expo config --type public --json` resolves to **TickerBrief**, owner `jeppy22`, slug `tickerbrief`, and EAS project `ba290e73-7370-4c6e-b557-1ea2e21987d0`. SDK 57, iPhone-only support and the standard-HTTPS encryption declaration are retained. The operator confirmed registered bundle ID **`com.jeppyinvesting.tickerbrief`** and Apple Team ID **`98BBY4NN94`**. The bundle is configured through the existing `IOS_BUNDLE_IDENTIFIER` setting in ignored local `.env`, its public example and all three EAS profiles. `ios.appleTeamId` selects the supplied team for native targets, as documented in [Expo's configuration reference](https://docs.expo.dev/versions/v57.0.0/config/app/#appleteamid).

The existing `eas.json` provides:

| Profile | Intended artifact | Existing settings |
| --- | --- | --- |
| `development` | Installable development client | Internal distribution, development environment, physical device |
| `preview` | Internal preview | Internal distribution, preview environment, physical device |
| `production` | TestFlight/App Store distribution archive | Store distribution, production environment, automatic build-number increment |

Remote app-version management remains enabled. The operator confirmed App Store Connect Apple ID **`6812926318`**, now configured as `submit.production.ios.ascAppId`. EAS's own schema and resolved production submission profile validate this value. The app configuration requires the existing EAS project, `IOS_BUNDLE_IDENTIFIER`, and an HTTPS `EXPO_PUBLIC_API_URL` for cloud builds. All three profiles supply the registered bundle ID and retain `https://tickerbrief-api.onrender.com` as their public API URL. Ownership, distribution and version settings are unchanged.

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
| App Store Connect app | **Resolved:** the operator created the record and supplied numeric Apple ID **`6812926318`** for the registered bundle/team. The production submission profile now targets it. |
| Build signing | EAS needs a valid distribution certificate and corresponding private key, plus an App Store distribution provisioning profile for that team and bundle ID. An authorized team member can configure/reuse these through EAS-managed credentials. Do not revoke an existing certificate or commit signing files. |
| Upload access | The uploading account needs access to this App Store Connect app and an Account Holder, Admin, App Manager or Developer role. Configure EAS Submit authentication through its official flow; keep passwords, 2FA codes and API keys out of chat and Git. |
| Development device, if used | Internal development/preview builds need the iPhone registered by UDID and included in their ad hoc provisioning profile. TestFlight distribution does not use that device-registration path. |

The distinction between signing and app access follows [Expo's EAS role requirements](https://docs.expo.dev/app-signing/apple-developer-program-roles-and-permissions/) and [Apple's individual/organization permissions](https://developer.apple.com/help/account/access/roles/). Upload roles are documented by [Apple](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/). The numeric app ID and Windows submission workflow are described in [EAS Submit for iOS](https://docs.expo.dev/submit/ios/). No push-notification key is needed for the current app's features.

## Manual handoff

The next action is interactive Apple authentication for team `98BBY4NN94`. The app record, bundle and team are already supplied; do not create replacements. An authorized colleague can prepare credentials in the existing Expo project if your own role lacks signing access.

Run in your own VS Code PowerShell terminal:

```powershell
Set-Location 'C:\Users\JEMJR\OneDrive\Desktop\TickerBrief\apps\mobile'
npx.cmd eas-cli@latest credentials:configure-build --platform ios --profile production
```

EAS CLI 24.7.0 resolved `production` and reached **Do you want to log in to your Apple account?** during this run. It was cancelled before entering an Apple account. No credentials were created or revoked, and no build was queued.

1. Answer **Yes** to Apple login. Enter your authorized Apple Account, password and 2FA only in that official local flow. The numeric app ID is not the sign-in name; no account email is inferred.
2. Choose team **`98BBY4NN94`** if prompted and verify bundle **`com.jeppyinvesting.tickerbrief`**.
3. Reuse an existing valid Apple Distribution certificate when EAS offers one. A certificate can be reused for apps on the same team only when its private key is available to EAS. If no usable certificate is available, let EAS generate one; do not revoke unrelated certificates to work around a limit.
4. Reuse the matching valid **App Store** provisioning profile for this bundle/team/certificate. Allow EAS to create missing credentials. No ad hoc device registration or push key is needed for this TestFlight build.
5. Wait for **All credentials are ready to build**. If access or certificate limits block setup, return only the prompt/error with personal details removed. Never share passwords, codes or signing files. `npx.cmd eas-cli@latest credentials --platform ios` remains available for inspecting/managing existing credentials when needed.

The credential command does not start a build. On **2026-09-16**, the account was Free with **12 iOS builds remaining**, **27 total builds remaining**, one concurrent build, no overage charges and no paid add-ons. If completing signing later, run `npx.cmd eas-cli@latest account:usage jeppy22 --json --non-interactive` immediately before the production build and require available Free iOS/total quota. Do not upgrade or enable paid builds. The [release runbook](RELEASE.md) has the subsequent build and submission commands.

A public privacy-policy URL, approved support/review contact and beta information are still required. Authorization to identify SEC requests does not authorize publishing that contact as the app's support or review address. No testers will be invited automatically.

## Confirmed App Store Connect record

The operator confirmed creation of TickerBrief with Apple ID **`6812926318`**, bundle **`com.jeppyinvesting.tickerbrief`**, team **`98BBY4NN94`**. The submission profile uses the numeric ID as a string, following [Expo's submission configuration](https://docs.expo.dev/submit/ios/). This is operator confirmation plus local configuration validation, not an authenticated App Store Connect lookup or upload. Reuse this record.

## Hosted handoff and next release action

The supplied URL passed health and the complete 50/50 financial-fact audit. After the operator deployed the CORS environment correction, all three hosted browser scenarios passed, including saved data reopening and manual retry recovery. See [hosted verification](HOSTED_VERIFICATION.md). Apple prerequisites above remain unverified; account checks were not repeated.

To repeat hosted verification after a relevant deployment change:

1. Check `https://tickerbrief-api.onrender.com/health` for `service=TickerBrief`, `sec_configured=true`, and `ai_enabled=false`.
2. From `services/api`, run the existing filing audit:

   ```powershell
   ..\..\.venv\Scripts\python.exe scripts\verify_live.py --base-url https://tickerbrief-api.onrender.com
   ```

3. Run the real browser flow using the hosted URL and actual CORS permissions, following the hosted runbook. Record cold-start observations separately from synthetic timeout checks.
4. Complete the official signing flow for the configured team/bundle and existing App Store Connect record. Then use the existing `production` build/submit commands in [RELEASE.md](RELEASE.md) within verified Free quota. Record build, upload, Apple processing, beta review and physical-device results separately. No local Xcode or simulator build is required.
