# MoDeck Integration Foundation

MEDIA LAB will use MoDeck as a hidden render backend. The user experience stays the simple branded MEDIA LAB flow:

Pick Template -> Fill Required Fields -> Choose Outputs -> See WYSIWYG-style previews -> Generate Package -> Download Package

Users should not need to understand MoDeck, MOGRTs, After Effects, render queues, edit IDs, deck names, or option names. MEDIA LAB owns that translation.

## A. What MEDIA LAB Sends

MEDIA LAB works in its own product language and sends a normalized package payload to the backend:

- `templateId`: MEDIA LAB template identifier, such as `template-quote-card-v2`.
- `packageName`: user-facing package name for tracking and download labeling.
- `fields`: field values keyed by MEDIA LAB field IDs, such as `quote`, `speakerName`, `speakerTitle`, `contextLine`, and `headshot`.
- `selectedOutputs`: selected MEDIA LAB output format IDs from the shared output format definitions.
- `media references`: references to uploaded or selected media assets. These are MEDIA LAB references first, then translated to uploaded MoDeck filenames when media replacement is needed.
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
- `uploaded media filename`: filename returned by media upload when media replacement, such as `Headshot`, is used.

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
| `headshot` | `Headshot` | media replacement |

Ratio-specific MOGRT names:

| Ratio | MOGRT |
| --- | --- |
| `16:9` | `QuoteCard_16x9` |
| `1:1` | `QuoteCard_1x1` |
| `4:5` | `QuoteCard_4x5` |
| `9:16` | `QuoteCard_9x16` |

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
