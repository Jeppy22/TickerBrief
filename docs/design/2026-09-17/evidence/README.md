# Evidence screen review

**Local Chromium browser previews only.** These changes are not in TestFlight 0.1.0 (3); no new EAS build was started. Safe-area placement, native dismissal, VoiceOver and Dynamic Type still need physical iPhone verification after a future authorized build.

| View | Screenshot |
| --- | --- |
| Default, 402 × 874 | [Default evidence](default.png) |
| Expanded technical details, 402 × 874 | [Technical details](technical-details.png) |
| Original structured record and data link | [Raw record](raw-record.png) |
| Saved evidence, 320 px / 2× CSS text | [Default](saved-default-320-2x.png) · [Details](saved-details-320-2x.png) |
| Saved evidence, 430 px / 2× CSS text | [Default](saved-default-430-2x.png) · [Details](saved-details-430-2x.png) |

The screenshots replay a **real previously retrieved RKLB report**, unchanged, in disposable browser storage. The selected record reports **−$198,209,000 USD**, January 1–December 31, 2025, from the 10-K filed February 26, 2026. It is a different dated record from the operator's example. [Capture metadata](capture.json) records report/source IDs and retrieval time. No financial number was invented for these screenshots, and no new hosted audit or live AI request was made. The `−$26,863,000` example is covered separately by explicit synthetic tests.

## Behavior

- A compact **Close** control sits at the upper-left of a fixed header within the modal's safe area. Its target is at least 48 points high and 60 points wide. It keeps the existing `Close evidence` accessible label, modal dismissal callback and return destination.
- The shared mapping names every concept currently supported by the backend normalizer. `NetIncomeLoss` becomes **Net income (loss)**. Unknown/custom concepts use **Reported financial fact** with an explanation, rather than guessing their financial meaning. Exact original titles and identifiers remain in Technical details.
- Full values use grouping and a mathematical minus sign; USD is explicitly identified. Shares remain shares, USD/share units read **USD per share**, and other/unknown units retain their literal identity. The formatter does not apply compact notation, percentage conversion or two-decimal currency rounding. It preserves available numeric precision; the original raw record remains unchanged. Existing atomic-value scrolling, overflow hints and text scaling stay enabled.
- The default hierarchy is metric → value/unit → reporting period → filing type/date → **Open SEC filing**. **Technical details** starts collapsed and contains the original title, concept, taxonomy, unit, accession, retrieval timestamp, raw JSON and structured SEC data link. The disclosure exposes expanded/collapsed state to accessibility APIs.
- Structured JSON is labeled **Raw structured record (JSON)**, never a quotation or filing excerpt. Actual retained management text remains visible as **Retained filing excerpt**; company information and other retained source text have separate neutral labels. Missing metadata is stated, not inferred.
- Live and saved reports use the same evidence component. Parsing legacy metadata from retained JSON is read-only. No schema migration, storage-key change, source URL replacement or saved-note rewrite occurs. Saved evidence/details need no API request.

## Local review

The local Windows iOS Hermes export passed as a bundle-compatibility check. It consumed no EAS quota and does not establish native rendering or device behavior.

Verification passed: 9 unit tests, TypeScript, ESLint and formatting; 13 existing browser scenarios plus the new evidence regression after fixing a missing browser `aria-expanded` attribute. The tests cover exact link targets without contacting SEC, disclosure defaults, original records, Close/return destinations, full values at 320/402/430 pixels and 1×/2×/2.5× text, and offline saved sources/notes. Link interception validates the requested URL and app behavior; it does not assert an external SEC page loaded. Existing hosted filing verification is unchanged and was not repeated.

Open **http://127.0.0.1:8081/**, search a supported company and choose an evidence action on its report. Check a negative amount where available, expand Technical details, open each source link, and use Close to return. Repeat from an existing saved snapshot. The standard [preview startup commands](../README.md#review-locally-on-windows) are unchanged.

The screenshot harness uses the existing ignored report artifact, not the live service:

```powershell
Set-Location 'C:\Users\JEMJR\OneDrive\Desktop\TickerBrief\apps\mobile'
npx.cmd tsx scripts/evidence-preview.ts
```

This requires `artifacts/live-report-RKLB.json` from the earlier verified retrieval. The script accepts another previously retrieved report path as its first argument. Do not manufacture a replacement response if that artifact is absent; use the normal app or the committed screenshots. Browser CSS scaling approximates larger text and does not prove native Dynamic Type behavior.
