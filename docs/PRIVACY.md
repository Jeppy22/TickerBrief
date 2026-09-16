# TickerBrief beta privacy information — draft for operator review

TickerBrief stores watchlists, saved research versions, retained public-source excerpts and personal notes on the user's device. No account or cloud synchronization is provided. Deleting a saved report removes its notes from the local app library. Uninstalling the app or clearing its storage may erase all local research. Operating-system device backups are controlled by the user and platform.

When a user searches or opens live research, the app sends the company query/ticker to the TickerBrief backend. The backend retrieves public filings from SEC. The backend and hosting infrastructure necessarily receive network information such as the request IP; retention and provider access depend on the deployed host's logging settings. The provided production command disables Uvicorn access logging, but the host may still record infrastructure logs.

The app does not send personal notes, watchlists or saved reports to the backend. It includes no advertising, analytics SDKs, brokerage connection or tracking feed. External SEC links open in the user's browser and are subject to SEC's policies.

Optional model interpretation, when explicitly enabled, sends only public company filing evidence to the configured model provider. It does not send the local library or personal notes. Free model services may process submitted public evidence according to their own terms. Current release configuration disables this feature pending verified free-tier eligibility.

Before publishing this policy, the operator must add the actual support/privacy contact, identify the deployed hosting provider and final log-retention settings, and provide a stable public policy URL. This draft does not claim those external steps have occurred.
