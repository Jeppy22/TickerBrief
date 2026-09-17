# Private iPhone beta release runbook

Release state: production iOS build **`3797cb4d-c4f0-425d-8910-af53165d726c`** succeeded, version **0.1.0 (2)**, source **`4bed83a9a9547ad25fd2ce23bb67c0e4c4fac408`**. [Build dashboard](https://expo.dev/accounts/jeppy22/projects/tickerbrief/builds/3797cb4d-c4f0-425d-8910-af53165d726c). Static IPA inspection passed on Windows; no local Xcode was used. **Upload and Apple processing are complete**, and the build is ready for internal testing. Physical-device testing remains pending; external beta review has not been requested. Hosted factual API/browser gates remain passed. See [STATUS.md](STATUS.md) for distinct milestones.

## Known identities

- GitHub: `Jeppy22/TickerBrief`, project branch `feat/private-beta`.
- Expo owner: `jeppy22`.
- EAS project: `ba290e73-7370-4c6e-b557-1ea2e21987d0`, [project dashboard](https://expo.dev/accounts/jeppy22/projects/tickerbrief).
- Public app: **TickerBrief**. Tagline: **Stock research, clearly explained.**
- Apple Team ID: **`98BBY4NN94`**, supplied by the operator and configured as `ios.appleTeamId`.
- Registered bundle ID: **`com.jeppyinvesting.tickerbrief`**, confirmed by the operator and configured through `IOS_BUNDLE_IDENTIFIER` locally and in every EAS profile.
- App Store Connect Apple ID: **`6812926318`**, confirmed by the operator and configured as `submit.production.ios.ascAppId`. Build signing and upload authentication were used successfully. The [manual handoff](IOS_READINESS.md#manual-handoff) now covers installing the processed build.

EAS usage was checked before and after the build on **2026-09-16** (local date): Free plan, now **4/15 iOS builds used (11 remaining)**, **4/30 total builds used (26 remaining)**, no overage charges or paid add-ons. Period ends October 1. Recheck before any future build; uploading this existing build does not require a rebuild.

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

See [the iOS configuration review and device handoff](IOS_READINESS.md). Team, bundle, App Store Connect app, build signing and upload authentication are configured. The operator confirmed private review contact information is saved. Public privacy/support pages are published.

Use the existing project and ownership. From `apps/mobile` in PowerShell:

```powershell
npx.cmd eas-cli@latest whoami
npx.cmd eas-cli@latest project:info
npx.cmd eas-cli@latest account:usage jeppy22 --json --non-interactive
```

If sign-in has expired, use `npx.cmd eas-cli@latest login` and the official sign-in flow. Do not paste passwords, 2FA codes, API keys, signing keys or provisioning profiles into chat or the repository.

In Apple Developer / App Store Connect, verify active membership, the correct team, access to the existing app/bundle identifier, and the permissions required for signing/uploading. Account Holder/Admin may need to provide Certificates, Identifiers & Profiles access or accept current Apple agreements themselves. Review the [Apple role permissions](https://developer.apple.com/help/app-store-connect/reference/role-permissions/). Do not register a competing bundle ID to avoid an access problem.

The public `EXPO_PUBLIC_API_URL=https://tickerbrief-api.onrender.com` and `IOS_BUNDLE_IDENTIFIER=com.jeppyinvesting.tickerbrief` are configured in each existing EAS build profile, using [Expo's build-profile environment setting](https://docs.expo.dev/build/eas-json/). Do not add conflicting remote values. The Apple team is set in app configuration; `submit.production.ios.ascAppId` targets the confirmed app **`6812926318`**. The submission profile also explicitly sets `ios.bundleIdentifier` to the registered bundle: EAS Submit does not inherit the build profile's environment. This resolves the observed local submission failure without changing or rebuilding the signed IPA.

Also set them in the local shell used to resolve the dynamic app config:

```powershell
$env:EXPO_PUBLIC_API_URL = 'https://tickerbrief-api.onrender.com'
$env:IOS_BUNDLE_IDENTIFIER = 'com.jeppyinvesting.tickerbrief'
```

The EAS project ID and owner are already committed in app configuration. Do not move ownership or replace the linked project. No provider credentials belong in EAS public variables.

Signing setup was completed by the operator and reused successfully by the build. For a future credential repair only:

```powershell
npx.cmd eas-cli@latest credentials:configure-build --platform ios --profile production
```

Use team `98BBY4NN94` and bundle `com.jeppyinvesting.tickerbrief`. Reuse valid distribution credentials and do not revoke certificates. No signing repair or new cloud build is currently needed.

For a physical-device development build, register the device through EAS when needed, then build within the verified free quota:

```powershell
npx.cmd eas-cli@latest device:create
npx.cmd eas-cli@latest build --platform ios --profile development
```

For App Store distribution to TestFlight (no public release):

```powershell
npx.cmd eas-cli@latest build --platform ios --profile production
npx.cmd eas-cli@latest submit --platform ios --profile production --id YOUR_SUCCESSFUL_BUILD_ID --no-auto-testflight-setup
```

For automation after signing is configured, use `npx.cmd eas-cli@latest build --platform ios --profile production --non-interactive --freeze-credentials --no-wait`. The credential freeze prevents changes to existing signing credentials; noninteractive mode does not revalidate them against Apple. Record the returned build ID and follow it with `npx.cmd eas-cli@latest build:view BUILD_ID`. Do not rerun the build command to check progress.

The root `.easignore` preserves the root/mobile Git exclusions and omits backend/docs from the upload. It also prevents EAS's recursive `.gitignore` discovery from touching an inaccessible Windows pytest cache. To check archive creation without using build quota, run `npx.cmd eas-cli@latest build:inspect --platform ios --profile production --stage archive --output ../../artifacts/eas-archive-CHECK_NAME` with a new output directory name. This is an archive inspection only; it does not require local Xcode.

Use the exact successful build ID, not an unrelated `--latest` artifact. Submission targets the configured app `6812926318`; EAS Submit authentication may still be required separately from build signing. Do not start either build before checking the Free plan and remaining iOS quota. Never accept a paid-build upgrade.

### Completed upload: monitor the existing submission

The existing API key was reused. This exact command succeeded from `apps/mobile` in PowerShell; it is retained as an audit record, **not a next action to rerun**:

```powershell
npx.cmd eas-cli@latest submit --platform ios --profile production --id 3797cb4d-c4f0-425d-8910-af53165d726c --no-auto-testflight-setup --non-interactive
```

EAS CLI 24.7.0 enables automatic TestFlight group setup by default, including inviting admin users when it creates a group. The explicit negative flag prevents that behavior. Do not pass `--groups`, create a public link, enable automatic tester notifications, or release publicly. After upload, record the submission ID/receipt separately and wait for Apple processing in app `6812926318` → TestFlight. Investigate Apple's actual warnings/errors before taking any corrective action; a successful EAS build is not Apple acceptance.

[Submission `4bfd2bd0-3a28-4d94-823f-133e8b777472`](https://expo.dev/accounts/jeppy22/projects/tickerbrief/submissions/4bfd2bd0-3a28-4d94-823f-133e8b777472) finished at **2026-09-17 00:38:26 UTC**. Apple's read-only status subsequently returned **`VALID` / `READY_FOR_BETA_TESTING`** for **0.1.0 (2)** with matching EAS build and submission IDs. External state is `READY_FOR_BETA_SUBMISSION`; no external review, group setup or tester invitations were performed. [Sanitized receipt and Apple status](verification/2026-09-17-testflight-submission.json).

Read-only monitoring commands, if needed:

```powershell
npx.cmd eas-cli@latest submit:view 4bfd2bd0-3a28-4d94-823f-133e8b777472
npx.cmd eas-cli@latest submit:status --platform ios --profile production --json --non-interactive
```

Continue with [manual internal testing and iPhone installation](BETA_TESTING.md#install-on-your-iphone). Do not rebuild or resubmit to install this version.

## Privacy and beta information

- Public pages are published and anonymously HTTPS-verified: [Privacy Policy URL](https://jeppy22.github.io/TickerBrief/privacy/) and [Support URL](https://jeppy22.github.io/TickerBrief/support/). The contact on those pages is approved for support/privacy and beta feedback. [PRIVACY.md](PRIVACY.md) records verified processing and provider-retention limitations.
- Device-local watchlists/notes are not transmitted. Company searches, request IPs and infrastructure logs need accurate disclosure for the actual host; model-enabled operation sends public company evidence. Do not blindly select “Data Not Collected” without considering final logging/diagnostics behavior.
- The actual IPA's combined privacy manifest was inspected: `C617.1`, `CA92.1`, `35F9.1`, tracking false. [Archive evidence](verification/2026-09-17-ios-build.json). These declarations do not alone prove Apple compliance or determine questionnaire answers; inspect App Store Connect warnings after upload.
- This app uses standard HTTPS and no custom encryption. App config declares no non-exempt encryption; verify the final archive/features remain consistent with that declaration.
- Prepare beta description, what to test, feedback email, review contact and export-compliance answers. Reviewers do not need an app login because there are no accounts. Explain the SEC coverage limits and disabled interpretation if still disabled.
- [BETA_TESTING.md](BETA_TESTING.md) contains beta description, tester steps, URLs and review notes. In App Store Connect → TickerBrief → TestFlight → Test Information, use the approved feedback address, beta description and no-login review notes. The operator confirmed the private review contact name/email/phone are saved; those fields are not copied into this repository. Set the privacy URL under App Privacy and the support URL in the applicable app-version metadata if not already saved. The device checklist is explicitly unperformed.
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
