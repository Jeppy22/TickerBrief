# iOS beta readiness

Reviewed locally on 2026-09-16. This is configuration review, not proof of Apple account access, signing, upload, or a physical iPhone test. No account credentials were probed and no cloud build was started during this review.

## Established configuration

`npx.cmd expo config --type public --json` resolves to **TickerBrief**, owner `jeppy22`, slug `tickerbrief`, and EAS project `ba290e73-7370-4c6e-b557-1ea2e21987d0`. SDK 57, iPhone-only support and the standard-HTTPS encryption declaration are retained. The resolved bundle identifier is currently unset; no new identifier has been invented.

The existing `eas.json` provides:

| Profile | Intended artifact | Existing settings |
| --- | --- | --- |
| `development` | Installable development client | Internal distribution, development environment, physical device |
| `preview` | Internal preview | Internal distribution, preview environment, physical device |
| `production` | TestFlight/App Store distribution archive | Store distribution, production environment, automatic build-number increment |

Remote app-version management remains enabled. `submit.production` is intentionally empty until the actual App Store Connect app is identified. The app configuration requires the existing EAS project, `IOS_BUNDLE_IDENTIFIER`, and an HTTPS `EXPO_PUBLIC_API_URL` for cloud builds. All three established profiles now supply `https://tickerbrief-api.onrender.com` as their public API URL. Ownership, identifiers, distribution and version settings are unchanged.

Local checks confirmed the build profiles above and exercised the cloud-config guard with process-local synthetic values: missing bundle ID, missing project ID and an HTTP API URL are rejected; a complete synthetic HTTPS configuration preserves the real Expo owner/project. These checks created no Apple identifier, EAS build, or persisted example credentials.

## Missing Apple prerequisites

| Requirement | Exact information or action still needed |
| --- | --- |
| Active membership | Confirm that the existing team has active **Apple Developer Program** membership and accepted required agreements. A free personal Apple account is insufficient for this release. No enrollment, renewal or payment is authorized by this runbook. |
| Apple sign-in | Use the authorized team member's Apple Account with two-factor authentication and access to a trusted device/phone for the official sign-in flow. Never share its password or verification codes. |
| Correct team | In the [Apple Developer account](https://developer.apple.com/account/), select the intended team and record its team name, Team ID and whether enrollment is individual or organization. Verify the same team is selected in App Store Connect. |
| Signing access | For individual enrollment, the Account Holder must prepare signing credentials. For an organization, use the Account Holder/Admin, or an App Manager with **Access to Certificates, Identifiers & Profiles**. An invitation to an individual owner's App Store Connect alone does not grant Developer Program signing access. |
| Existing bundle ID | Under Certificates, Identifiers & Profiles → Identifiers, locate the intended explicit App ID and copy the exact bundle identifier into `IOS_BUNDLE_IDENTIFIER`. Confirm it belongs to the chosen team. If none exists, resolve ownership and the intended identifier before registering one. |
| App Store Connect app | Open Apps → TickerBrief → App Information. Confirm the bundle ID and record its numeric **Apple ID** (`ascAppId`). If the app record does not exist, the team's authorized app manager must create it using the intended bundle ID. Reuse any existing record. |
| Build signing | EAS needs a valid distribution certificate and corresponding private key, plus an App Store distribution provisioning profile for that team and bundle ID. An authorized team member can configure/reuse these through EAS-managed credentials. Do not revoke an existing certificate or commit signing files. |
| Upload access | The uploading account needs access to this App Store Connect app and an Account Holder, Admin, App Manager or Developer role. Configure EAS Submit authentication through its official flow; keep passwords, 2FA codes and API keys out of chat and Git. |
| Development device, if used | Internal development/preview builds need the iPhone registered by UDID and included in their ad hoc provisioning profile. TestFlight distribution does not use that device-registration path. |

The distinction between signing and app access follows [Expo's EAS role requirements](https://docs.expo.dev/app-signing/apple-developer-program-roles-and-permissions/) and [Apple's individual/organization permissions](https://developer.apple.com/help/account/access/roles/). Upload roles are documented by [Apple](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/). The numeric app ID and Windows submission workflow are described in [EAS Submit for iOS](https://docs.expo.dev/submit/ios/). No push-notification key is needed for the current app's features.

## Manual handoff

The nonsecret handoff is: **team name/Team ID, enrollment type, signing role/access confirmation, exact bundle ID, and numeric App Store Connect app ID**. An authorized colleague can prepare credentials in the existing Expo project if your own role lacks signing access; personal Apple credentials must not be substituted for the intended team.

Once the bundle ID is known, an authorized operator can inspect/configure credentials from `apps/mobile` in PowerShell:

```powershell
$env:IOS_BUNDLE_IDENTIFIER = 'YOUR_EXISTING_BUNDLE_IDENTIFIER'
npx.cmd eas-cli@latest credentials --platform ios
```

Select the `production` profile for TestFlight signing and the correct Apple team. Reuse valid existing credentials. This is separate from starting a build. When ready to build, recheck the remaining Free EAS quota once; the recorded 2026-09-16 quota is historical evidence, not a permanent allowance.

A public privacy-policy URL, approved support/review contact and beta information are still required. Authorization to identify SEC requests does not authorize publishing that contact as the app's support or review address. No testers will be invited automatically.

## Hosted handoff and next release action

The supplied URL passed health and the complete 50/50 financial-fact audit. After the operator deployed the CORS environment correction, all three hosted browser scenarios passed, including saved data reopening and manual retry recovery. See [hosted verification](HOSTED_VERIFICATION.md). Apple prerequisites above remain unverified; account checks were not repeated.

To repeat hosted verification after a relevant deployment change:

1. Check `https://tickerbrief-api.onrender.com/health` for `service=TickerBrief`, `sec_configured=true`, and `ai_enabled=false`.
2. From `services/api`, run the existing filing audit:

   ```powershell
   ..\..\.venv\Scripts\python.exe scripts\verify_live.py --base-url https://tickerbrief-api.onrender.com
   ```

3. Run the real browser flow using the hosted URL and actual CORS permissions, following the hosted runbook. Record cold-start observations separately from synthetic timeout checks.
4. The next Apple action is to sign in at the Apple Developer account, choose the intended team, and supply the nonsecret team/role, existing bundle ID and numeric App Store Connect app ID listed above. With those prerequisites satisfied, use the existing `production` build/submit commands in [RELEASE.md](RELEASE.md). Record build, upload, Apple processing, beta review and physical-device results separately. No local Xcode or simulator build is required.
