# Craft images

Drop your craft images directly into this folder. They are served at `/craft/<filename>` and referenced from `src/data/craft.ts`.

Expected filenames (rename your files to match, or edit `src/data/craft.ts` to match your filenames):

Column A
- `onboarding-flow.jpg` — ~3:2 landscape
- `wireframes.jpg` — ~4:5 portrait
- `dashboard.jpg` — ~1:1 square
- `travel-app.jpg` — ~2:3 portrait
- `web-layout.jpg` — ~16:9 landscape

Column B
- `design-system.jpg` — ~4:5 portrait
- `sketching.jpg` — ~3:4 portrait
- `ios-screens.jpg` — ~1:1 square
- `card-grid.jpg` — ~1:1 square
- `components.jpg` — ~1:1 square

Column C
- `workspace.jpg` — ~2:3 portrait
- `editor-ui.jpg` — ~4:5 portrait
- `code-view.jpg` — ~4:3 landscape
- `devtools.jpg` — ~4:3 landscape

Notes
- Any extension is fine (`.jpg`, `.png`, `.webp`, `.gif`) — just update the path in `src/data/craft.ts` to match.
- The aspect ratios listed are only initial placeholders. Once the real image loads, the card resizes to match the image's natural width/height, so the exact ratio doesn't have to match.
- Recommended max width ~1600px and compressed (JPEG q≈80 or WebP) — the grid renders them around 400–500px wide.
- The label and date shown on hover come from `src/data/craft.ts`, not the filename.
