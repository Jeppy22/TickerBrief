# iOS beta readiness

Updated September 17, 2026 UTC. The current redesign/evidence release **0.1.0 (4)** has finished its cloud build; upload, processing and internal-group status are tracked in [STATUS.md](STATUS.md#design-release--010-4) and [the release receipt](verification/2026-09-17-design-release.json). The operator tested part of the original build-2 flow on an iPhone 17 Pro; its exact iOS version and offline saved access remain unconfirmed. Stabilization, visual changes and preservation of data across the update require device retesting.

## Established configuration and original build history

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
| Apple processing and beta review | Builds 2/3 are processed; current build-4 status is in STATUS.md. External beta review has not been requested or approved. |
| Internal tester access | Existing **Private Beta** internal group, one tester, automatic distribution disabled. Builds 2/3 were already present before this release. Build-4 assignment is tracked separately in STATUS.md; preserve membership and do not create invitations. |
| Physical iPhone | Operator verified research, SEC links, saving/reopening reports and notes, and keyboard behavior on build 2. Value layout and back-label defects prompted the stabilization update. Offline saved access, Dynamic Type, native gestures and preservation across the update require retesting. |

## Manual handoff

Once build 4 is processed and assigned, follow [the exact existing-group and iPhone update steps](BETA_TESTING.md#install-on-your-iphone). The existing group is **Private Beta**; keep automatic distribution disabled and membership unchanged. If **0.1.0 (4)** is already listed, no dashboard mutation or invitation is needed. Update through TestFlight over the installed app; do not uninstall or clear storage. No Mac, Xcode or ad hoc device registration is needed. [App Store Connect](https://appstoreconnect.apple.com/apps/6812926318/testflight/ios).

Record the exact iOS version and run the [device retest checklist](BETA_TESTING.md#device-retest-checklist). Browser checks and Apple's processing result do not verify native fixes, storage survival across an update or fully offline reopening.

For read-only status, from your VS Code PowerShell terminal:

```powershell
Set-Location 'C:\Users\JEMJR\OneDrive\Desktop\TickerBrief\apps\mobile'
npx.cmd eas-cli@latest submit:view 22a4179d-1048-48ae-b8cb-7d0798d9b107
npx.cmd eas-cli@latest submit:status --platform ios --profile production --json --non-interactive
```

Do not rebuild, resubmit or replace valid credentials to install this processed build. [RELEASE.md](RELEASE.md) retains the successful upload command and documents the required automatic-TestFlight-setup opt-out. Keep AI disabled, distribution private and billing unchanged.
