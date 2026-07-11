# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page Next.js app for real-estate appraisal work: enter comparable sale prices and weights, see per-comp contributions and the weighted average. Also includes a % change calculator and blank weight-allocation templates. The whole app is one client component tree — there is no backend; all state lives in the browser (localStorage + IndexedDB).

## Commands

```bash
npm run dev     # start dev server (localhost:3000)
npm run build   # static export to out/, then runs scripts/inject-chunk-recovery-head.mjs
npm start        # serve production build
npm run lint     # next lint
```

There is no test suite configured. When changing calculation or formatting logic, verify manually via `npm run dev` (see `/verify` skill) rather than assuming correctness.

The app builds as a **static export** (`output: "export"` in `next.config.ts`) and deploys to GitHub Pages via `.github/workflows/static.yml` on push to `main`. `BASE_PATH` is injected at build time so assets resolve under `/<repo-name>/`. Because it's a static export, there is no server runtime — don't add API routes, middleware, or anything requiring a Node server.

## Architecture

**State model:** All app state is one `AppState` object (`lib/types.ts`): the list of `CompSale` rows plus display settings (decimals, layout, title, weight format). `components/WeightedAverageApp.tsx` is the root — it owns `AppState` via `useUndoRedo` (hooks/useUndoRedo.ts, a manual past/present/future stack, Ctrl+Z/Ctrl+Y) and fans callbacks down to children. There is no global store; everything is prop-drilled from this one component.

**Persistence, three independent localStorage/IndexedDB layers, each with its own hook:**
- `hooks/useAutoSave.ts` — debounced (400ms) autosave of current `AppState` to `localStorage["wa-autosave"]`, restored on mount.
- `hooks/useTemplates.ts` — named, user-saved snapshots (`localStorage["wa-templates"]`), loaded via the Options drawer.
- `hooks/useHistory.ts` — up to 15 automatic snapshots (`localStorage["wa-history"]`), one taken every time the user successfully copies the grid image (see `addSnapshot` call in `handleCopy`). Shown in `HistoryPanel`.
- `lib/saveImage.ts` also persists a File System Access API directory handle in IndexedDB (`weighted-average` DB) when "remember directory" is enabled, so repeat saves skip the folder picker.

When loading a template or history snapshot, comp `id`s are regenerated (`crypto.randomUUID()`) and the state is run through `normalizeState`/`normalizeComp` (in `WeightedAverageApp.tsx`) to backfill fields that may be missing from older saved data (`showTitle`, `weightDisplayFormat`, weight typing).

**Calculations (`lib/calculations.ts`):** A comp's `weight` is `number | string` — a string means a free-text label (e.g. "Listing") for a comp that's excluded from the average. `numericWeight()` is the single place that coerces this to `0` for non-numeric weights; always route weight math through it rather than reading `comp.weight` directly.

**Formatting/parsing (`lib/formatting.ts`):** Two families of functions exist for every field type — a `*Live` formatter (applied on every keystroke while editing, preserves partial input like trailing `.`) and a committed formatter (`formatCurrency`, `formatPercent`/`formatWeight`). Weights also support fraction notation (`"1/6"` → 16.667%); `formatPercentFraction` reduces a decimal weight back to a simplified fraction (denominator ≤ 20) for display when `weightDisplayFormat === "fraction"`. `EditableCell` (components/EditableCell.tsx) is the shared inline-edit control used for every grid cell; it switches between live and committed formatting and (for weight cells) reports back whether the user typed a fraction or decimal so the app can update `weightDisplayFormat`.

**Grid layout:** `SpreadsheetGrid` renders either `HorizontalGrid` (comps as columns — default) or `VerticalGrid` (comps as rows) depending on `AppState.layout`. Both are separate implementations of the same table, not a shared abstraction — when changing grid behavior, check whether the change needs to apply to both.

**Image export (Copy / Save):** The exportable region is the table element tagged `data-chart-export`, referenced via `gridExportRef`/`weightedAverageChartRef`. Any element that should be excluded from the exported image (buttons, remove icons, the options drawer) is tagged `data-exclude-export` and stripped by `exportFilter` in `lib/chartRasterExport.ts`. Export always captures at that ref, snapshotted at click time — don't re-read the ref after an `await` (see comment on `resolveExportElement`).
- `lib/chartRasterExport.ts` wraps `html-to-image` (`toCanvas`/`toPng`) with shared options (2x pixel ratio, white background, `skipFonts` + `cacheBust` for static-host reliability).
- `lib/chartClipboard.ts` — "Copy" button: writes a PNG to the clipboard via `ClipboardItem`, with a `toCanvas`→`toPng` fallback if the first capture path fails. A successful copy triggers `addSnapshot` into history.
- `lib/saveImage.ts` — "Save" button: tries, in order, a remembered directory handle → `showSaveFilePicker` → `showDirectoryPicker` → an anchor-download/new-tab fallback for browsers (Safari) without File System Access API. Saves WebP with PNG fallback if WebP encoding isn't supported.

**Static export caveat:** `scripts/inject-chunk-recovery-head.mjs` runs after `next build` and patches `out/index.html` / `out/404.html` to add a script that force-reloads once if a stale-cached HTML page tries to load a JS chunk that no longer exists post-deploy (`ChunkLoadError`). If you change the build output structure, verify this script still finds `<head>` in the emitted HTML.

**Hydration:** Default state (`defaultState()` in `WeightedAverageApp.tsx`) uses fixed string IDs (`"wa-default-1"`, etc.), not `crypto.randomUUID()`, so server-rendered and client-hydrated HTML match; real UUIDs are only generated after mount when the user adds/loads data. `WeightedAverageApp` renders a skeleton until a `hydrated` flag flips true post-mount (after localStorage is read).

## Conventions

- Path alias `@/*` maps to repo root (`tsconfig.json`).
- Styling is Tailwind CSS v4 (via `@tailwindcss/postcss`), utility classes only — no CSS modules. The visual language intentionally mimics a formal appraisal document (dark header bars, bordered table cells, serif-adjacent restraint); avoid introducing decorative UI that breaks that aesthetic.
- No test framework is configured — do not assume Jest/Vitest exist.
