# iOS beta readiness

Updated September 16, 2026 (cloud timestamps use September 17 UTC). The production build, upload and Apple processing succeeded. The build is ready for internal testing; physical iPhone testing remains incomplete.

## Established configuration and build

- Expo owner `jeppy22`, slug `tickerbrief`, project `ba290e73-7370-4c6e-b557-1ea2e21987d0` are unchanged.
- Apple team **`98BBY4NN94`**, bundle **`com.jeppyinvesting.tickerbrief`**, App Store Connect app **`6812926318`**.
- `IOS_BUNDLE_IDENTIFIER` is configured in existing EAS profiles and ignored local environment; `ios.appleTeamId` selects the team. `submit.production.ios.ascAppId` targets the existing app. Submission also explicitly sets the registered `ios.bundleIdentifier`, because EAS Submit does not inherit build-profile environment variables.
- All build profiles use **`https://tickerbrief-api.onrender.com`**. Hosted health again confirmed SEC configured and AI disabled before the build.
- Existing development/preview profiles remain physical-device internal distributions. Production remains store distribution, with remote versioning and automatic build-number increments.
- The operator completed Apple authentication and signing. EAS reused the existing remote certificate/profile with `--freeze-credentials`; no certificate was created or revoked by this build. Noninteractive mode did not revalidate credentials against Apple before building.
- **Build `3797cb4d-c4f0-425d-8910-af53165d726c` finished successfully** at 2026-09-17 00:07:19 UTC, version **0.1.0 (2)**, source commit **`4bed83a9a9547ad25fd2ce23bb67c0e4c4fac408`**. [Dashboard](https://expo.dev/accounts/jeppy22/projects/tickerbrief/builds/3797cb4d-c4f0-425d-8910-af53165d726c).
- Static inspection of the actual IPA confirmed the team/bundle, App Store profile, iPhone-only support, minimum iOS 16.4, no non-exempt encryption, the hosted API in its Hermes bundle, signature files and combined privacy manifest. [Evidence and limitations](verification/2026-09-17-ios-build.json). Windows inspection is not cryptographic codesign verification, Apple validation or a device test.
- Exactly one cloud build was created. A preceding Windows archive-cache permission failure occurred before a build existed; `.easignore` fixed it and local archive inspection passed. The unused attempt initialized remote build number 1; the actual build incremented it to 2.
- After completion, Free quota was **4/15 iOS and 4/30 total used**, zero overage and no paid add-ons. A website/docs change or upload of this IPA needs no rebuild.
- Upload reused the existing API key, production submission profile and exact successful build with `--no-auto-testflight-setup`. [Submission `4bfd2bd0-3a28-4d94-823f-133e8b777472`](https://expo.dev/accounts/jeppy22/projects/tickerbrief/submissions/4bfd2bd0-3a28-4d94-823f-133e8b777472) finished at **2026-09-17 00:38:26 UTC**. Apple subsequently reported **0.1.0 (2)** as `VALID`, internal `READY_FOR_BETA_TESTING`, external `READY_FOR_BETA_SUBMISSION`. [Evidence](verification/2026-09-17-testflight-submission.json). No rebuild, credential replacement or tester invitations were created.

## Remaining Apple prerequisites

| Requirement | Status / next action |
| --- | --- |
| Build signing | Complete for this artifact. Preserve the existing certificate and provisioning profile. |
| EAS Submit authentication | Complete: operator configured the API key; upload and read-only Apple status succeeded using it. |
| Upload permission | Verified by successful upload to app `6812926318`. No further authentication action is currently needed. |
| Public privacy/support | Published, anonymously verified: [privacy](https://jeppy22.github.io/TickerBrief/privacy/), [support](https://jeppy22.github.io/TickerBrief/support/). Public contact is explicitly approved. |
| Review information | Operator confirmed private review name/email/phone are saved in App Store Connect. Beta description, notes and checklist are in [BETA_TESTING.md](BETA_TESTING.md). |
| Apple processing and beta review | Processing complete and ready for internal testing. External beta review has not been requested or approved. |
| Internal tester access | Operator must manually add only themselves to a private internal group and add build 0.1.0 (2). No group or invitations were created by this submission. |
| Physical iPhone | Not tested. TestFlight does not require the ad hoc UDID-registration path used for development/preview builds. |

## Manual handoff

Open [TickerBrief in App Store Connect](https://appstoreconnect.apple.com/apps/6812926318/testflight/ios). Follow [the exact internal-tester and iPhone installation steps](BETA_TESTING.md#install-on-your-iphone): create or select a private internal group, keep automatic distribution disabled, add **0.1.0 (2)** and manually select only your own App Store Connect user. Install TestFlight on an iPhone running iOS 16.4 or later, accept your invitation and install TickerBrief. No Mac, Xcode or ad hoc device registration is needed.

Record the device model/iOS version and run the physical checklist in [BETA_TESTING.md](BETA_TESTING.md#what-to-test). Browser checks and Apple's processing result do not verify on-device research, notes or offline reopening.

The upload is complete. For read-only status, from your VS Code PowerShell terminal:

```powershell
Set-Location 'C:\Users\JEMJR\OneDrive\Desktop\TickerBrief\apps\mobile'
npx.cmd eas-cli@latest submit:view 4bfd2bd0-3a28-4d94-823f-133e8b777472
npx.cmd eas-cli@latest submit:status --platform ios --profile production --json --non-interactive
```

Do not rebuild, resubmit or replace valid credentials to install this processed build. [RELEASE.md](RELEASE.md) retains the successful upload command and documents the required automatic-TestFlight-setup opt-out. Keep AI disabled, distribution private and billing unchanged.
