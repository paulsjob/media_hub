# Media Lab Lite WIP Notes

Paused on new job start day.

Current status:
- Media Lab Lite rescope implemented.
- Active app path simplified to fast templated graphic generation.
- Lint passed.
- Build passed.
- 16:9 output works.
- 9:16 output works.
- 1:1 output is unresolved.

1:1 debugging history:
- frame 0 + previewFrame 0 returned black image.
- frame 10 + previewFrame 10 caused MoDeck error: Could not find preview frame named "10".
- frame 10 + previewFrame 0 returned imageBase64Length: 0.
- latest change: frame 10 with previewFrame omitted for 1:1.
- needs retesting.

Likely remaining issue:
- MoDeck preview behavior or 1:1 MOGRT/export behavior.

Next step later:
- Restart app.
- Test /generate.
- Check 1:1 log for frame: 10 and hasPreviewFrame: false.
- If still failing, stop app-side debugging and inspect MoDeck/AE MOGRT setup.