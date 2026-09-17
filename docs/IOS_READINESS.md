# iOS beta readiness

Updated September 16, 2026 (cloud timestamps use September 17 UTC). The production build succeeded; upload, Apple processing and physical iPhone testing remain separate, incomplete milestones.

## Established configuration and build

- Expo owner `jeppy22`, slug `tickerbrief`, project `ba290e73-7370-4c6e-b557-1ea2e21987d0` are unchanged.
- Apple team **`98BBY4NN94`**, bundle **`com.jeppyinvesting.tickerbrief`**, App Store Connect app **`6812926318`**.
- `IOS_BUNDLE_IDENTIFIER` is configured in existing EAS profiles and ignored local environment; `ios.appleTeamId` selects the team. `submit.production.ios.ascAppId` targets the existing app.
- All build profiles use **`https://tickerbrief-api.onrender.com`**. Hosted health again confirmed SEC configured and AI disabled before the build.
- Existing development/preview profiles remain physical-device internal distributions. Production remains store distribution, with remote versioning and automatic build-number increments.
- The operator completed Apple authentication and signing. EAS reused the existing remote certificate/profile with `--freeze-credentials`; no certificate was created or revoked by this build. Noninteractive mode did not revalidate credentials against Apple before building.
- **Build `3797cb4d-c4f0-425d-8910-af53165d726c` finished successfully** at 2026-09-17 00:07:19 UTC, version **0.1.0 (2)**, source commit **`4bed83a9a9547ad25fd2ce23bb67c0e4c4fac408`**. [Dashboard](https://expo.dev/accounts/jeppy22/projects/tickerbrief/builds/3797cb4d-c4f0-425d-8910-af53165d726c).
- Static inspection of the actual IPA confirmed the team/bundle, App Store profile, iPhone-only support, minimum iOS 16.4, no non-exempt encryption, the hosted API in its Hermes bundle, signature files and combined privacy manifest. [Evidence and limitations](verification/2026-09-17-ios-build.json). Windows inspection is not cryptographic codesign verification, Apple validation or a device test.
- Exactly one cloud build was created. A preceding Windows archive-cache permission failure occurred before a build existed; `.easignore` fixed it and local archive inspection passed. The unused attempt initialized remote build number 1; the actual build incremented it to 2.
- After completion, Free quota was **4/15 iOS and 4/30 total used**, zero overage and no paid add-ons. A website/docs change or upload of this IPA needs no rebuild.

## Remaining Apple prerequisites

| Requirement | Status / next action |
| --- | --- |
| Build signing | Complete for this artifact. Preserve the existing certificate and provisioning profile. |
| EAS Submit authentication | A read-only metadata query found **no submission API key assigned to this bundle**. Configure it using the handoff below; signing credentials alone do not authorize upload. |
| Upload permission | Use a team member authorized for app `6812926318`. Follow any official Apple authentication/API-access prompts locally. Do not share credentials or enroll/upgrade/pay. |
| Public privacy/support | Published, anonymously verified: [privacy](https://jeppy22.github.io/TickerBrief/privacy/), [support](https://jeppy22.github.io/TickerBrief/support/). Public contact is explicitly approved. |
| Review information | Operator will save private review name/email/phone directly in App Store Connect and confirm. Beta description, notes and checklist are in [BETA_TESTING.md](BETA_TESTING.md). |
| Apple processing and beta review | Not started; upload must succeed first. An external beta may need review. |
| Physical iPhone | Not tested. TestFlight does not require the ad hoc UDID-registration path used for development/preview builds. |

## Manual handoff

Configure the **upload** API key, without starting a build, in your own VS Code PowerShell terminal:

```powershell
Set-Location 'C:\Users\JEMJR\OneDrive\Desktop\TickerBrief\apps\mobile'
npx.cmd eas-cli@latest credentials --platform ios
```

1. Choose **production** and complete official Apple login/2FA locally if prompted. Select team **`98BBY4NN94`** and confirm bundle **`com.jeppyinvesting.tickerbrief`**.
2. Choose **App Store Connect: Manage your API Key** ? **Set up your project to use an API Key for EAS Submit**.
3. Reuse a valid existing API key for this team if offered; otherwise follow the official flow to create/configure one. Do not delete/revoke certificates or keys. Keep passwords, 2FA, private keys and downloaded signing files out of chat and Git. If Apple requires API-access approval, the Account Holder must complete it in App Store Connect ? Users and Access ? Integrations ? App Store Connect API; return the exact nonsecret prompt if blocked.
4. In App Store Connect ? TickerBrief ? TestFlight ? Test Information, save the approved feedback email and private review contact name/email/phone, using the beta description/review notes in BETA_TESTING.md. Set the verified privacy URL under App Privacy and the support URL in the applicable app-version metadata. Confirm these steps are saved.

Once upload credentials and review information are ready, use **this existing successful build**:

```powershell
npx.cmd eas-cli@latest submit --platform ios --profile production --id 3797cb4d-c4f0-425d-8910-af53165d726c --no-auto-testflight-setup
```

The negative flag is required: CLI 24.7.0 otherwise defaults to creating an internal group and can invite admin users. Do not add `--groups`, public links, automatic invitations or a public release. Record the submission receipt, then separately check Apple processing and beta-review status. Follow [RELEASE.md](RELEASE.md); do not run another build to upload or monitor this one.

The [official EAS Submit guide](https://docs.expo.dev/submit/ios/) explains the Windows upload path, and [Apple's API-access instructions](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api) cover any Account Holder prerequisite. The CLI's installed `submit` flag definitions and TestFlight setup implementation were reviewed to verify the opt-out behavior. No local Xcode or simulator build is needed.
