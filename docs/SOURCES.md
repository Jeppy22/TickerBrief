# Official implementation references

Checked 2026-09-16. Account-specific eligibility is separate from public plan documentation.

- [Expo SDK 57 compatibility](https://docs.expo.dev/versions/v57.0.0/): React Native 0.86, React 19.2.3, minimum Node 22.13, iOS 16.4+. This machine has Node 22.18.0.
- [Expo Router UI](https://docs.expo.dev/versions/v57.0.0/sdk/router/ui/), [AsyncStorage](https://docs.expo.dev/versions/v57.0.0/sdk/async-storage/), [cloud build setup](https://docs.expo.dev/build/setup/).
- [FastAPI server startup](https://fastapi.tiangolo.com/deployment/manually/).
- [SEC APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), [developer fair-access requirements](https://www.sec.gov/about/developer-resources). SEC APIs do not need a paid key; SEC limits automated traffic to ten requests/second across machines. This implementation uses one worker and at most two requests/second, caches responses, identifies the operator, and backs off on denied/rate-limited access. It does not use alternate identities or proxies to evade denials.
- [Gemini rate limits and tiers](https://ai.google.dev/gemini-api/docs/rate-limits), [structured output](https://ai.google.dev/gemini-api/docs/structured-output), [generateContent API](https://ai.google.dev/api/generate-content). Per-project limits and model eligibility must be checked in AI Studio; no model is presumed free merely because a key exists.
- [Render free hosting](https://render.com/docs/free): useful for private beta evaluation, with sleeping/cold starts and ephemeral files. No payment method avoids automatic bandwidth overage billing; verify remaining workspace allowances before creation. Persistent AI usage accounting cannot rely on Render's ephemeral filesystem.
- [Expo plans](https://docs.expo.dev/billing/plans/), [EAS CLI](https://docs.expo.dev/eas/cli/): free plans have finite monthly cloud-build allowances and cannot incur overage charges. Inspect actual account usage before any build.
- [Apple TestFlight](https://developer.apple.com/testflight/), [external testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers/), [App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/).
