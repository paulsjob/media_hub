# MoDeck Integration Foundation

Media Lab Lite uses MoDeck as the rendering engine for connected templated graphics.

The current active scope is fast Quote Card still generation in multiple sizes. The full Media Lab command center is deferred; MoDeck integration work should prioritize reliable preview generation, render submission, status polling, and downloads for the Lite workflow.

Media Lab Lite uses MoDeck as a hidden render backend. The user experience stays the simple branded Lite flow:

Pick Template -> Fill Required Fields -> Choose Sizes -> See previews -> Generate Graphics -> Download PNGs

Users should not need to understand MoDeck, MOGRTs, After Effects, render queues, edit IDs, deck names, or option names. Media Lab Lite owns that translation.

## A. What MEDIA LAB Sends

MEDIA LAB works in its own product language and sends a normalized package payload to the backend:

- `templateId`: MEDIA LAB template identifier, such as `template-quote-card-v2`.
- `packageName`: user-facing package name for tracking and download labeling.
- `fields`: field values keyed by MEDIA LAB field IDs, such as `quote`, `speakerName`, `speakerTitle`, `contextLine`, and `headshot`.
- `selectedOutputs`: selected MEDIA LAB output format IDs from the shared output format definitions.
- `media references`: public URLs or renderer-accessible filenames/paths for media replacement fields.
- `preview request`: one mapped MoDeck preview request per unique selected ratio.
- `render request`: one mapped MoDeck render request per selected output deliverable.

## B. What MoDeck Needs

MoDeck works in render-system terms. The backend adapter will eventually translate MEDIA LAB payloads into MoDeck payloads containing:

- `apiKey`: server-only MoDeck credential.
- `deck name`: the MoDeck deck that contains the render templates.
- `mogrt name`: the ratio-specific MOGRT to render.
- `option names and values`: MoDeck option names, such as `Quote Text`, mapped from MEDIA LAB fields.
- `global options`: shared options that apply across the deck or render request.
- `editId`: optional MoDeck edit identifier for continuing or polling an existing edit.
- `size / ratio`: selected output dimensions and aspect ratio.
- `preview frame`: still frame requested for preview generation.
- `media reference`: a public URL or renderer-accessible filename/path for media replacement, such as `HEADSHOT`.

## C. What Comes Back

The MoDeck adapter should normalize MoDeck responses before the rest of MEDIA LAB sees them:

- `deck metadata`: available decks and deck-level details.
- `MOGRT option data`: option names, types, defaults, and whether an option is required.
- `preview image base64`: still preview image returned by a preview request.
- `editId`: MoDeck edit identifier for tracking preview or render work.
- `render status`: queued, rendering, completed, failed, or canceled.
- `temporary download links`: MoDeck-generated links that must be copied into durable MEDIA LAB storage before display.
- `completed render list`: normalized list of completed output files.

## D. How Templates Are Mapped

MEDIA LAB template IDs map to MoDeck implementation details in code, not in the UI.

Each mapping contains:

- MEDIA LAB `templateId`.
- MoDeck `deckName`.
- ratio-specific `mogrtName` values.
- MEDIA LAB field IDs mapped to MoDeck option names and option types.
- output definitions referenced by shared MEDIA LAB output format IDs.

The first mapping is Quote Card:

| MEDIA LAB field | MoDeck option | MoDeck option type |
| --- | --- | --- |
| `quote` | `Quote Text` | multiline text |
| `speakerName` | `Speaker Name` | text |
| `speakerTitle` | `Speaker Title` | text |
| `contextLine` | `Context Line` | text |
| `headshot` | `HEADSHOT` | media replacement |

For the MVP, Headshot is a URL-or-filename field. If the value is blank, MEDIA LAB omits `HEADSHOT` and MoDeck uses the default MOGRT media. If the value is a public URL, MEDIA LAB passes it to MoDeck as-is so MoDeck can download it. If the value is a filename or subfolder path, MEDIA LAB passes it to MoDeck as-is; MoDeck resolves it from `MoDeck Sync/_modk-data/User media` and configured additional media folders. Browser file upload is not part of the MVP render path. The optional browser local image picker is only for visual confirmation and crop checking.

Top-level MoDeck template/package name: `MD_Quote_Card_Package`.

Ratio-specific child MOGRT names:

| Ratio | MOGRT |
| --- | --- |
| `16:9` | `MD_Quote_Card_16x9` |
| `1:1` | `MD_Quote_Card_1x1` |
| `4:5` | `MD_Quote_Card_4x5` |
| `9:16` | `MD_Quote_Card_9x16` |

## E. How Ratios Are Handled

MEDIA LAB owns output definitions. MoDeck receives dimensions and ratio only after MEDIA LAB maps selected output IDs through the shared output format definitions.

Preview rule:

- Unique selected ratios drive previews.
- If still `1920x1080` and video `1920x1080` are both selected, show one `16:9` preview.

Render rule:

- Every selected output becomes a deliverable.
- Still `1920x1080` and video `1920x1080` are two separate final outputs.

## F. How Previews Are Requested

Future preview flow:

1. User edits required fields in MEDIA LAB.
2. Browser preview updates instantly.
3. Optional near-final MoDeck preview request is debounced.
4. Backend maps MEDIA LAB fields to MoDeck options.
5. Backend calls MoDeck `/preview`.
6. MoDeck returns a base64 still preview.
7. UI can replace or augment the browser preview with the MoDeck preview.

The MVP mock adapter returns a fake base64 preview and does not call MoDeck.

## G. How Final Renders Are Requested

Future render flow:

1. User clicks Generate Package.
2. Backend validates fields and selected outputs.
3. Backend maps MEDIA LAB fields to MoDeck option names and values.
4. Backend calls MoDeck `/render`.
5. Backend stores the returned `editId`.
6. Backend polls `/renderstatus` or receives a webhook.
7. Backend copies temporary MoDeck links to durable MEDIA LAB storage.
8. Package screen displays final downloads.

The MVP mock adapter returns completed fake render data and does not call MoDeck.

## H. Recommended MVP Render Model

Use one MEDIA LAB render job with multiple MoDeck render requests underneath, one per selected output.

This lets MEDIA LAB preserve one package experience while still treating each selected output as its own backend render unit. Internally, this also keeps retries and failures scoped to one output at a time.

## I. First Real Integration Milestone

The first real integration should be intentionally small:

- Quote Card only.
- Four ratios: `16:9`, `1:1`, `4:5`, and `9:16`.
- Preview first.
- Render second.
- One output at a time internally.
- One package experience for the user.

No live MoDeck API calls are active in the mock MVP.

## J. Local Preview Troubleshooting

If local MoDeck preview testing fails with an `EPERM: operation not permitted, mkdir` error under this path:

```text
C:\Users\plcon\MoDeck Sync\_modk-data\Temp\preview-frames\...
```

Create or repair permissions for MoDeck's preview frame temp directory:

```cmd
mkdir "%USERPROFILE%\MoDeck Sync\_modk-data\Temp\preview-frames"
icacls "%USERPROFILE%\MoDeck Sync" /grant "%USERNAME%:(OI)(CI)F" /T
```

## K. Preview Speed vs Final Render Speed

MoDeck preview is fast because `/preview` returns a still image payload directly, usually as `previewData`, `imageBase64`, or another base64 image field that MEDIA LAB can display immediately.

Final still delivery currently uses the render-job path: `/render` starts an edit, `/renderstatus` polls until MoDeck exposes temporary media, and `/render/download` fetches that media and converts it to a PNG if needed. That job/status/download flow is more durable for final videos and future full render packages, but it is slower than direct preview image delivery for static stills.

The current MEDIA LAB preview adapter requests a target `size` and receives base64 image data, but the code does not yet prove that MoDeck returns final-production dimensions for every still ratio. In observed UI metadata, preview images may be much smaller than final outputs, such as 640x360 for a 16:9 preview, which is useful for review but may be unsuitable as a final 1920x1080 still.

Fast still export should be considered only if MoDeck preview can be requested and verified at final resolution, or if lower-resolution preview quality is acceptable for the specific delivery use case. The final render endpoint may still be required for production-quality media because it exposes completed render media through the job/status/download flow. Keep render-job support as the durable path while evaluating a preview-based still export as an optional fast path.

## L. Future Browser Upload Support

Future browser-upload-to-render support requires a real MoDeck upload or storage API contract that accepts image bytes and returns a render-usable media reference. Until that exists, MEDIA LAB must not claim browser-selected files are render-wired. Browser-selected files stay local to the browser and must not be serialized into package URLs as base64.
