# Privacy disclosure review

Reviewed September 16, 2026 against the current app, backend code, deployment configuration and provider documentation. The public policy source is [site/privacy/index.html](../site/privacy/index.html); support is [site/support/index.html](../site/support/index.html). The operator explicitly authorized the public support/privacy/beta-feedback address used by these pages. This does not publish local environment or signing configuration.

## Verified behavior

- Mobile `storage.ts` and `library.tsx`: device-local AsyncStorage library; no account or cloud sync. Deleting a snapshot removes its notes. OS backups are outside the app's control.
- Mobile `api.ts`: HTTPS GET company-search query or report ticker sent to the configured Render service. The library is not uploaded. `components/report.tsx` opens validated SEC source URLs in the browser.
- Backend `main.py`: no account database, per-user search history or library-upload endpoint. Report cache is public data; rate limiting stores timestamps rather than client IPs. `sec.py` caches public SEC responses and does not forward a user's IP or headers to SEC.
- `render.yaml` and the Dockerfile configure Uvicorn with `--no-access-log`. Hosted health again reported SEC configured and AI disabled before the cloud build. These checks do **not** independently inspect the running Render command, workspace logging settings or internal provider security logs; no authenticated Render management connection is available.
- `interpretation.py` returns before model requests when AI is disabled. No model request was made. No ads, analytics SDKs, brokerage connections or tracking SDKs are configured in this app.
- Public pages contain only static HTML/CSS: no forms, scripts, external fonts or embedded media. The Pages workflow uploads **only `site/`**, not the repository or `docs/`.

## Provider logging and retention

- [Render logging documentation](https://render.com/docs/logging#retention-period) lists dashboard retention by **workspace** plan (Hobby 7 days, Pro 14, Scale/Enterprise 30). The service's Free instance does not independently prove the workspace plan, log streams or retention of all infrastructure records. No fixed deployment-wide deletion period is claimed. [Render privacy policy](https://render.com/privacy).
- [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection) explicitly says visitor IP addresses are logged and stored for security, including signed-out visits. The [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement#security-and-retention) bases retention on purposes and obligations, rather than a fixed Pages-specific duration. The policy discloses this separately from the app's Render traffic.
- [SEC privacy information](https://www.sec.gov/about/privacy-information) applies when the user opens original source links.
- [Apple's TestFlight privacy information](https://www.apple.com/legal/privacy/data/en/test-flight/) describes automatic crash/usage collection shared with developers and feedback/name/email handling. It states one-year beta-feedback retention and possible crash/usage retention until bugs are resolved. The public policy includes these beta-specific disclosures; it does not imply that absence of an app analytics SDK means TestFlight collects nothing.
- Support email and feedback are retained for handling requests/issues and applicable obligations; no automated deletion schedule is configured or claimed. Requests can be sent to the approved contact. Device-local deletion and provider-held records are distinguished.

## Publication and Apple metadata

Target URLs are `https://jeppy22.github.io/TickerBrief/privacy/` and `https://jeppy22.github.io/TickerBrief/support/`; publication/anonymous HTTPS results are recorded in STATUS.md. Repository visibility remains public, as already configured. GitHub Pages is available for public repositories on GitHub Free. No paid plan, domain purchase or Render change is needed.

Use the verified privacy URL for App Store Connect's Privacy Policy URL and the support URL for Support URL. Use the approved public email for beta feedback. Review contact name/phone must be entered directly by the operator. App privacy questionnaire answers must account for the actual hosting and beta processing above; do not automatically select “Data Not Collected.”
