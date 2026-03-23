# Weighted Average — Appraisal Calculator

A spreadsheet-style calculator for computing weighted averages of comparable sales, built for real estate appraisal reports. Enter sale prices and weights, and the tool instantly computes each comp's contribution and the final weighted average. Export the result as a clean image for pasting into word processors.

## Features

- **3–12 comparable sales** with editable sale price and weight
- **Live currency/percent formatting** — dollar signs and commas appear as you type
- **Weighted average calculation** with per-comp contribution breakdown
- **Vertical or horizontal** table layout
- **Configurable decimal precision** (0, 1, or 2 decimal places)
- **Save as WebP** — exports a clean, borderless image named with comp count and date
- **Copy to clipboard** — one-click PNG copy for pasting into documents
- **Remember directory** — saves to the same folder without prompting on repeat exports
- **Undo/redo** with keyboard shortcuts (Ctrl+Z / Ctrl+Y)
- **Templates** — save and load named configurations
- **Auto-save** — state persists in localStorage across sessions

## Tech Stack

| Layer       | Technology                      |
| ----------- | ------------------------------- |
| Framework   | Next.js 15 (App Router)        |
| UI          | React 19, TypeScript            |
| Styling     | Tailwind CSS 4                  |
| Font        | Inter (Google Fonts)            |
| Image export| html-to-image                   |
| Persistence | localStorage, IndexedDB         |

## Project Structure

```
app/
  layout.tsx          Root layout, metadata, fonts
  page.tsx            Home page — renders WeightedAverageApp
  globals.css         Tailwind theme and base styles
  favicon.ico         Browser tab icon
  icon.png            512×512 app icon
  apple-icon.png      180×180 Apple touch icon

components/
  WeightedAverageApp  Main app: state, toolbar, export, options
  SpreadsheetGrid     Vertical and horizontal table layouts
  EditableCell        Click-to-edit cell with live formatting
  WeightBar           Visual bar behind weight cells
  OptionsDrawer       Decimals, layout, and template controls
  TemplateManager     Template save/load/delete UI

hooks/
  useUndoRedo         Undo/redo stack for AppState
  useAutoSave         Persist/load state from localStorage
  useTemplates        Template CRUD via localStorage

lib/
  types.ts            CompSale, AppState, Template types
  calculations.ts     sumWeights, contribution, weightedAverage
  formatting.ts       Currency/percent formatting and parsing
  exportImage.ts      Copy grid as PNG to clipboard
  saveImage.ts        Save grid as WebP to filesystem
  file-system-access.d.ts  Type helpers for File System Access API
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Usage

1. Click any **Sale Price** or **Weight** cell to edit — formatting applies as you type.
2. Below the card, use **Undo / Redo**, **Copy**, and **Save**. Under that, **decimal precision**, **layout**, **theme** (four presets plus custom), and **templates** are always available.
3. Click **Copy** to copy the grid as a PNG for pasting into a word processor.
4. Click **Save** to export as a WebP file. Toggle **Remember directory** in the dropdown to skip the folder picker on subsequent saves.
