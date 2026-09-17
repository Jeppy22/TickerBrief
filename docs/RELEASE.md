# Private iPhone beta release runbook

Release state: the hosted factual API passed its 50/50 source-fact audit and all three hosted browser flows passed after the deployed CORS correction. See [HOSTED_VERIFICATION.md](HOSTED_VERIFICATION.md). No signed iOS build, TestFlight upload, Apple processing, beta review, or physical-device test has been verified.

## Known identities

- GitHub: `Jeppy22/TickerBrief`, project branch `feat/private-beta`.
- Expo owner: `jeppy22`.
- EAS project: `ba290e73-7370-4c6e-b557-1ea2e21987d0`, [project dashboard](https://expo.dev/accounts/jeppy22/projects/tickerbrief).
- Public app: **TickerBrief**. Tagline: **Stock research, clearly explained.**
- Apple Team ID: **`98BBY4NN94`**, supplied by the operator and configured as `ios.appleTeamId`.
- Registered bundle ID: **`com.jeppyinvesting.tickerbrief`**, confirmed by the operator and configured through `IOS_BUNDLE_IDENTIFIER` locally and in every EAS profile.
- App Store Connect Apple ID: **`6812926318`**, confirmed by the operator and configured as `submit.production.ios.ascAppId`. Signing still requires the [local Apple authentication handoff](IOS_READINESS.md#manual-handoff).

EAS account usage was checked through the signed-in CLI on **2026-09-16**: Free plan, **3/15 iOS builds used (12 remaining)**, **3/30 total builds used (27 remaining)**, one concurrent build, no overage charges or paid add-ons. The current billing period ends October 1. This is a point-in-time check; check again immediately before a build if signing is completed in a later session.

## Hosted factual backend

The existing service is **https://tickerbrief-api.onrender.com**. Do not create another deployment. The setup steps below are retained for reproducibility; current verification and the exact browser-origin setting are in the [hosted runbook](HOSTED_VERIFICATION.md).

The proposed private-beta evaluation host is Render Free, using `render.yaml`. [Render's current terms](https://render.com/docs/free) describe idle sleeping, cold starts, ephemeral files, and finite workspace allowances. It is not a production-service guarantee. To avoid automatic bandwidth overage charges, use a workspace **with no payment method** and verify remaining included bandwidth/build minutes/free service hours before deployment. Do not add a card or upgrade.

1. Sign in to [Render](https://dashboard.render.com/) through its official flow. Allow access only to the specified repository if needed. Confirm the account's free allowances and no payment method. There is no authenticated Render connection available to this session.
2. Select **New > Blueprint**, connect GitHub if required, and choose `Jeppy22/TickerBrief`. Set the Blueprint name to `tickerbrief-beta`, branch to `feat/private-beta`, and Blueprint Path to `render.yaml`. Review that the only service is `tickerbrief-api`, a **Free** Python web service, with no paid disk/database/add-on. See [Render's Blueprint setup](https://render.com/docs/infrastructure-as-code).
3. At the `SEC_USER_AGENT` prompt, privately enter the value from the ignored local `services/api/.env`; do not paste the whole environment file. Leave `AI_ENABLED=false`. Do not put the contact in Git, screenshots, or logs. Preserve one instance/one Uvicorn worker for the provider-wide throttle.
4. Select **Deploy Blueprint** after confirming the Free plan. On the Blueprint's **Settings** page, set **Auto Sync** to **No**; this is separate from the service's already-disabled auto-deploy. Wait for the service to become Live, copy its actual HTTPS URL, and verify `/health` returns `service=TickerBrief`, `sec_configured=true`, `ai_enabled=false`. Then run the live verification script against that URL. Local AAPL/MSFT/RKLB verification has passed, but this does not prove research works from the hosting IP; SEC may deny some cloud traffic.
5. Confirm the mobile normal flow can search and read all three audit companies using that HTTPS URL. Test a cold start. Do not use a tunnel to the Windows PC as the beta backend.

The URL has been supplied and its report audit passed. Preserve the Free workspace and no-payment-method constraint. No Render API token is needed for the documented manual dashboard steps. From `services/api`, the hosted check is:

```powershell
..\..\.venv\Scripts\python.exe scripts\verify_live.py --base-url https://tickerbrief-api.onrender.com
```

The Dockerfile is an alternative deployment artifact; it has not been built here unless STATUS.md records a successful container check. Render Free cannot persist a local lifetime AI ledger; the included PostgreSQL adapter supports a separately verified free persistent database. Hosted AI needs that durable-storage prerequisite plus verified model access in [AI.md](AI.md).

## Apple and EAS

See [the local iOS configuration review and exact missing Apple prerequisites](IOS_READINESS.md). Hosted report retrieval and the browser flow are verified. Team, bundle and App Store Connect app are configured; signing authentication and approved privacy/review information remain.

Use the existing project and ownership. From `apps/mobile` in PowerShell:

```powershell
npx.cmd eas-cli@latest whoami
npx.cmd eas-cli@latest project:info
npx.cmd eas-cli@latest account:usage jeppy22 --json --non-interactive
```

If sign-in has expired, use `npx.cmd eas-cli@latest login` and the official sign-in flow. Do not paste passwords, 2FA codes, API keys, signing keys or provisioning profiles into chat or the repository.

In Apple Developer / App Store Connect, verify active membership, the correct team, access to the existing app/bundle identifier, and the permissions required for signing/uploading. Account Holder/Admin may need to provide Certificates, Identifiers & Profiles access or accept current Apple agreements themselves. Review the [Apple role permissions](https://developer.apple.com/help/app-store-connect/reference/role-permissions/). Do not register a competing bundle ID to avoid an access problem.

The public `EXPO_PUBLIC_API_URL=https://tickerbrief-api.onrender.com` and `IOS_BUNDLE_IDENTIFIER=com.jeppyinvesting.tickerbrief` are configured in each existing EAS build profile, using [Expo's build-profile environment setting](https://docs.expo.dev/build/eas-json/). Do not add conflicting remote values. The Apple team is set in app configuration; `submit.production.ios.ascAppId` targets the confirmed app **`6812926318`**.

Also set them in the local shell used to resolve the dynamic app config:

```powershell
$env:EXPO_PUBLIC_API_URL = 'https://tickerbrief-api.onrender.com'
$env:IOS_BUNDLE_IDENTIFIER = 'com.jeppyinvesting.tickerbrief'
```

The EAS project ID and owner are already committed in app configuration. Do not move ownership or replace the linked project. No provider credentials belong in EAS public variables.

Complete signing setup before starting a build:

```powershell
npx.cmd eas-cli@latest credentials:configure-build --platform ios --profile production
```

This command was run with EAS CLI 24.7.0 and reached **Do you want to log in to your Apple account?**; it was cancelled there for the operator to authenticate locally. Answer Yes in your own terminal, enter your authorized Apple Account and 2FA locally, and select team `98BBY4NN94`. Confirm bundle `com.jeppyinvesting.tickerbrief`. Reuse valid existing distribution certificates and matching App Store provisioning profiles; generate only missing credentials. Do not revoke certificates used by other apps. Wait for **All credentials are ready to build**. This credential command does not start a build. See the [detailed handoff](IOS_READINESS.md#manual-handoff).

For a physical-device development build, register the device through EAS when needed, then build within the verified free quota:

```powershell
npx.cmd eas-cli@latest device:create
npx.cmd eas-cli@latest build --platform ios --profile development
```

For App Store distribution to TestFlight (no public release):

```powershell
npx.cmd eas-cli@latest build --platform ios --profile production
npx.cmd eas-cli@latest submit --platform ios --profile production --id YOUR_SUCCESSFUL_BUILD_ID
```

For automation after signing is configured, use `npx.cmd eas-cli@latest build --platform ios --profile production --non-interactive --freeze-credentials --no-wait`. The credential freeze prevents changes to existing signing credentials; noninteractive mode does not revalidate them against Apple. Record the returned build ID and follow it with `npx.cmd eas-cli@latest build:view BUILD_ID`. Do not rerun the build command to check progress.

The root `.easignore` preserves the root/mobile Git exclusions and omits backend/docs from the upload. It also prevents EAS's recursive `.gitignore` discovery from touching an inaccessible Windows pytest cache. To check archive creation without using build quota, run `npx.cmd eas-cli@latest build:inspect --platform ios --profile production --stage archive --output ../../artifacts/eas-archive-CHECK_NAME` with a new output directory name. This is an archive inspection only; it does not require local Xcode.

Use the exact successful build ID, not an unrelated `--latest` artifact. Submission targets the configured app `6812926318`; EAS Submit authentication may still be required separately from build signing. Do not start either build before checking the Free plan and remaining iOS quota. Never accept a paid-build upgrade.

## Privacy and beta information

- Read [PRIVACY.md](PRIVACY.md) against the deployed configuration. Publish a stable public privacy-policy URL and a support contact before submission; the operator/contact has not been supplied for publication yet.
- Device-local watchlists/notes are not transmitted. Company searches, request IPs and infrastructure logs need accurate disclosure for the actual host; model-enabled operation sends public company evidence. Do not blindly select “Data Not Collected” without considering final logging/diagnostics behavior.
- AsyncStorage includes a dependency privacy manifest for file timestamp access (`C617.1` inspected in this checkout). Inspect the final cloud build's combined privacy manifest and App Store Connect warnings; a dependency file alone is not proof the final archive complies.
- This app uses standard HTTPS and no custom encryption. App config declares no non-exempt encryption; verify the final archive/features remain consistent with that declaration.
- Prepare beta description, what to test, feedback email, review contact and export-compliance answers. Reviewers do not need an app login because there are no accounts. Explain the SEC coverage limits and disabled interpretation if still disabled.
- [BETA_TESTING.md](BETA_TESTING.md) contains draft beta description, tester steps and review notes. Supply the approved contacts and policy URL before submission; its device checklist is explicitly unperformed.
- [External testing](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers/) can require Beta App Review. Do not create tester invitations or a public link automatically.

## Record distinct release gates

| Gate | Evidence required |
| --- | --- |
| JavaScript export | Successful Expo iOS export; not a native build |
| Cloud build | Successful EAS build ID and signed `.ipa` |
| Upload | EAS Submit receipt for that build and correct App Store Connect app |
| Apple processing | Build appears and processing finishes in TestFlight |
| Beta review | Approved/available for the chosen external-testing group, if required |
| Physical iPhone | Actual install and core-flow checklist executed on device |

Physical checklist: search AAPL/MSFT/RKLB, open original filing links, inspect dates and missing data, save two versions, edit notes, force-quit/reopen, enable airplane mode and reopen snapshots/excerpts, restore connectivity, refresh without changing earlier snapshots, delete one version without deleting another, test smaller-screen layout and larger accessibility text. Record the device/iOS version and actual results. A 390×844 browser viewport is not a physical-device test.
