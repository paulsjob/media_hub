# Media Hub Product Architecture

Current active product scope: Media Lab Lite. The Lite workflow is `/generate` -> `/package` for templated Quote Card graphic generation and downloads. Command-center routes documented below are deferred product concepts unless explicitly reactivated.

## Current Route Map

| Route | Current purpose | Status | Audience | Notes |
| --- | --- | --- | --- | --- |
| `/` | MVP create-package entry point with a template picker focused on Quote Card V.2. | Product-facing MVP | Operators | Uses `MvpShell`, `TemplateCard`, and mock templates from `mediaLab`. Other templates are shown as coming soon. |
| `/create` | Alias for the home create-package page. | Product-facing MVP | Operators | Re-exports `HomePage` from `/`; keep route stable unless a real create flow replaces it. |
| `/intake` | Mock story intake form showing story basics, sources, receipts, messaging, and recommended formats. | Product-facing MVP | Operators, editorial | Uses `AppShell`, `PageHeader`, `SectionCard`, form UI primitives, and `mediaLab.getFeaturedStory()`. |
| `/templates` | Template library and template detail view. | Product-facing MVP | Operators | Uses `AppShell`, `TemplateListItem`, `SectionCard`, and template mock data. Search/filter controls are presentational. |
| `/generate` | Quote Card generation workflow: edit fields, select outputs, preview selected ratios, and start package generation. | Product-facing MVP | Operators | Uses `MvpShell` and `PackageGenerator`. Connects to live MoDeck preview for supported still outputs and starts live final render for connected still outputs. |
| `/package` | Package results screen showing still/video download rows from selected outputs and render query state. | Product-facing MVP | Operators | Uses `MvpShell` and `PackageResults`. Polls MoDeck render status for live render outputs. |
| `/approvals` | Approval queue mock with one featured package and review detail. | Product-facing MVP | Approvers, operators | Uses `AppShell`, `AssetPreview`, `StatusBadge`, and `mediaLab.getFeaturedAssetPackageView()`. |
| `/distribution` | Distribution planning stub for selected platforms and scheduled export. | Placeholder | Operators, distribution | Uses `AppShell`, `AssetPreview`, platform mock data, and links back to library asset detail. No publishing integration. |
| `/library` | Asset library search and package list. | Product-facing MVP | Operators, editors | Uses `AppShell`, `AssetListItem`, and `mediaLab.searchAssetPackages(q)`. |
| `/library/[assetId]` | Asset package detail, captions, outputs, approval history, and performance snapshot. | Product-facing MVP | Operators, editors, approvers | Uses `AppShell`, `AssetPreview`, `DownloadRow`-style UI primitives, `notFound()`, and package mock data by ID. |
| `/performance` | Mock performance dashboard and insight cards. | Placeholder | Operators, leadership | Uses `AppShell`, `StatCard`, and mock KPI/insight data. No analytics integration. |
| `/settings` | Brand and safety guardrails screen. | Placeholder | Admins, operators | Uses `AppShell`, guardrail cards, and mock settings tabs. |
| `/dev/modeck-preview-test` | Internal live MoDeck preview harness for testing request fields, response summaries, image preview, duration, and image download. | Internal/dev-only | Developers | Uses `ModeckPreviewTest`. Keeps current MoDeck payload assumptions visible, including intentional `QUOTE_POSITION_y`. |
| `/dev/quote-card-calibration` | Internal Quote Card visual calibration harness. | Internal/dev-only | Developers, designers | Uses `QuoteCardCalibration`; useful before changing production preview layout. |
| `/api/modeck/preview` | Server route that calls MoDeck `/preview` and returns normalized preview status, duration, image base64, request summary, and response summary. | Internal/API | App, dev harness | Used by `/dev/modeck-preview-test` and `PreviewGrid`. Preserve working option names, including `QUOTE_POSITION_y`. |
| `/api/modeck/preview/download` | Server route that calls MoDeck preview and converts the returned still image to a PNG attachment. | Internal/API | App | Used as the live preview download source for supported still outputs. |
| `/api/modeck/render` | Server route that starts a live MoDeck final render for connected Quote Card still outputs. | Internal/API | App | Called by `PackageGenerator`; unsupported outputs still use mock placeholders. |
| `/api/modeck/render/status` | Server route that polls MoDeck `/renderstatus`, normalizes progress/status, and registers download tokens when complete. | Internal/API | App | Called by `PackageResults` while live render jobs are pending. |
| `/api/modeck/render/download` | Server route that downloads registered MoDeck render media and returns a PNG still or MP4 attachment. | Internal/API | App | Uses `sharp` and `ffmpeg` frame extraction for still outputs when upstream media is video. |
| `/api/mock-modeck/download` | Mock download endpoint for placeholder stills and videos. | Internal/API placeholder | App | Returns SVG stills or text files for outputs without live final render support. |

## Current MoDeck Flow

`/dev/modeck-preview-test` is the internal preview harness. It lets developers submit the current Quote Card preview fields, see render status and duration, inspect request/response summaries, view the returned image, and download the preview image when `imageBase64` is available. The page also warns that `QUOTE_POSITION_y` intentionally uses a lowercase `y` because that matches the current MOGRT.

`/api/modeck/preview` is the live preview adapter route. It reads server-side MoDeck env vars, builds the current Quote Card preview payload, calls MoDeck `/preview`, extracts image data from known response shapes, and returns a normalized JSON result for the dev harness and product preview grid.

`/api/modeck/preview/download` is a convenience download route for preview-backed stills. It calls MoDeck `/preview`, extracts the image, converts it to PNG with `sharp`, and returns it as an attachment.

`/api/modeck/render` starts a live final render for connected still outputs, currently `still-1920x1080`, `still-1080x1080`, `still-1080x1350`, and `still-1080x1920`. It maps Quote Card fields to MoDeck options, calls MoDeck `/render`, and returns the edit ID and initial normalized status.

`/api/modeck/render/status` polls MoDeck `/renderstatus` for an edit ID. It normalizes statuses into queued, rendering, completed, failed, or canceled; derives progress; and registers an internal download URL when MoDeck exposes a temporary media URL.

`/api/modeck/render/download` resolves registered render download tokens, fetches the upstream MoDeck media, and returns the correct local attachment. Stills are returned as PNG, including first-frame extraction if MoDeck returns video media for a still output.

`/api/mock-modeck/download` is the placeholder download path for unsupported or not-yet-live outputs. It returns SVG mock stills and text mock video files so the package flow can remain complete while live rendering is incremental.

## Intended Product Workflow

The current app implies this operator workflow:

Intake -> Templates -> Generate -> Package -> Approvals -> Distribution -> Library -> Performance

1. Intake captures the story, receipts, source confidence, messenger, audience, and recommended output formats.
2. Templates lets the operator choose a package structure, with Quote Card V.2 as the active MVP template.
3. Generate lets the operator enter required template fields, select still/video outputs, preview the result, and start package generation.
4. Package shows the generated outputs, live render status where available, and download links.
5. Approvals presents packages that need review and links reviewers into the asset detail.
6. Distribution plans approved assets for channel-specific scheduling/export without auto-publishing.
7. Library stores approved packages, captions, outputs, and reusable asset detail.
8. Performance provides a future feedback loop for what worked, currently with mock KPI and insight data.

## Internal vs Product Pages

Product-facing MVP pages:

- `/`
- `/create`
- `/intake`
- `/templates`
- `/generate`
- `/package`
- `/approvals`
- `/library`
- `/library/[assetId]`

Product placeholders:

- `/distribution`
- `/performance`
- `/settings`

Internal/dev-only harnesses:

- `/dev/modeck-preview-test`
- `/dev/quote-card-calibration`

Internal API routes:

- `/api/modeck/preview`
- `/api/modeck/preview/download`
- `/api/modeck/render`
- `/api/modeck/render/status`
- `/api/modeck/render/download`
- `/api/mock-modeck/download`

## Recommended Next Build Order

1. Stabilize the Quote Card product path from `/generate` to `/package`: make selected fields, outputs, preview state, render state, and download labels consistent across the two screens.
2. Promote the useful parts of `/dev/modeck-preview-test` into developer documentation and keep the harness internal for payload troubleshooting.
3. Replace mock package query serialization with a small durable package/session model so `/package` can survive refreshes and links without oversized URL state.
4. Expand live MoDeck rendering one output at a time, starting with the remaining still ratios before video outputs.
5. Connect approvals and library detail to generated package records so approved assets flow naturally into distribution planning and later performance tracking.
