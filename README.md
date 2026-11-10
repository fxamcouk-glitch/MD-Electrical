# MD Electrical – Plan markup

Browser-based tool for marking up PDF plans with electrical symbols.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
npm test         # unit tests for the markup state
```

## What it does

- **Open a PDF** (button, or drop a file anywhere on the page). Multi-page PDFs are supported; pages with a built-in rotation are handled.
- **Place symbols** two ways: drag from the palette onto the plan, or click a symbol then click the plan (stays armed so you can drop several; `Esc` to stop).
- **Edit**: click to select (Shift-click for several), drag to move, rotate, label, duplicate, delete, undo/redo.
- **Symbol size** per page, because sheets arrive at very different scales.
- **Schedule**: live counts per symbol, this page and all pages.
- **Autosave** on this device (IndexedDB). Recent drawings are listed on the start screen.
- **Export**: marked-up PDF (original plan stays vector, symbols stamped on top, schedule page appended) and a CSV schedule.

## Shortcuts

| Key | Action |
| --- | --- |
| `Esc` | stop placing / clear selection |
| `Del` | delete selected |
| `R` / `Shift+R` | rotate 45° clockwise / anticlockwise |
| `Ctrl+D` | duplicate |
| Arrow keys (`Shift` = bigger step) | nudge selected |
| `Ctrl+Z` / `Ctrl+Shift+Z` | undo / redo |
| `+` `-` `0` | zoom in / out / fit page |
| `[` `]` | previous / next page |
| `Ctrl`+wheel or pinch | zoom at cursor |
| `Space`+drag or middle-drag | pan |

## Code map

- `src/styles/tokens.css` – all shared colours, spacing, type. Components use these, not literals.
- `src/symbols/catalog.tsx` – the symbol library (add new symbols here; they appear in the palette, schedule and exports automatically).
- `src/components/PlanViewer.tsx` – PDF canvas + SVG markup layer, zoom/pan, placement, dragging.
- `src/state/reducer.ts` – markup state with undo/redo (tested).
- `src/pdf/exportPdf.tsx` – marked-up PDF and CSV export.

Marker positions are stored in PDF points on the page as displayed, so they stay put at any zoom.

## Known limits

- Everything is stored in the browser on one device; there is no account or sync yet.
- No measuring / scale tools or cable runs yet.
- Touch: tap-to-place, tap-to-select and pinch-zoom are implemented; pinch and finger-dragging of symbols have not been tested on a real device.
