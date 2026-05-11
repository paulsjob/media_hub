# Media Lab Lite

Media Lab Lite is the current active product scope for this repo.

The product does one thing: choose a template, fill fields, choose output sizes, generate graphics, and download the finished files.

## Active Workflow

1. Open the Lite generator at `/generate`.
2. Use the connected Quote Card template.
3. Fill the required content fields.
4. Select connected still sizes: 16:9 landscape, 1:1 square, and 9:16 vertical.
5. Generate previews, approve the current preview set, and generate graphics.
6. Download each PNG or the ready files as a ZIP from `/package`.

## Current Template

Quote Card is the only active Lite template.

It is designed for fast quote graphics for social and digital use. The connected MoDeck still outputs are:

- `still-1920x1080`
- `still-1080x1080`
- `still-1080x1920`

## Out Of Scope

The Lite UI should not expose dashboard, story records, approvals, reporting, performance, archive, distribution planning, AI assist, content calendar, or publishing workflows.

Underlying mock and legacy code can remain in the repo while the active product surface stays focused on fast templated graphic generation.
