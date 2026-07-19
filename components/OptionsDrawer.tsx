"use client";

import type {
  AppState,
  DecimalPrecision,
  GridThemeId,
  LayoutMode,
  Template,
  WeightDisplayFormat,
  WeightVizMode,
} from "@/lib/types";
import { GRID_THEME_LIST } from "@/lib/themes";
import { WEIGHT_VIZ_OPTIONS } from "./WeightViz";
import TemplateManager from "./TemplateManager";

/** 16×16 glyph hinting at how each weight-viz mode draws. */
function WeightVizIcon({ mode }: { mode: WeightVizMode }) {
  const cls = "w-3.5 h-3.5";
  switch (mode) {
    case "shade": // square, left portion filled
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={cls}>
          <path d="M2 3h12v10H2V3Zm1 1v8h5V4H3Z" fillRule="evenodd" />
        </svg>
      );
    case "meter": // row of discrete blocks
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={cls}>
          <path d="M1.5 6h3v4h-3V6Zm4.5 0h3v4H6V6Zm4.5 0h3v4h-3V6Z" />
        </svg>
      );
    case "scale": // axis with marker
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={cls}>
          <path d="M1 7.5h14v1H1v-1Zm1-2h1v5H2v-5Zm11 0h1v5h-1v-5ZM8.5 5.5h3v5h-3v-5Z" />
        </svg>
      );
    case "pie": // circle with one solid slice
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={cls}>
          <path d="M8 1.5a6.5 6.5 0 1 0 6.5 6.5H8V1.5Z" fillOpacity="0.35" />
          <path d="M9.5 1.67A6.5 6.5 0 0 1 14.83 7H9.5V1.67Z" />
        </svg>
      );
    case "pie-classic": // ringed circle with a quarter wedge from 12 o'clock
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={cls}>
          <path d="M8 2.5a5.5 5.5 0 1 0 5.5 5.5A5.5 5.5 0 0 0 8 2.5ZM8 1a7 7 0 1 1-7 7 7 7 0 0 1 7-7Z" fillOpacity="0.45" fillRule="evenodd" />
          <path d="M8 8V2.5A5.5 5.5 0 0 1 13.5 8H8Z" />
        </svg>
      );
    case "pie-large": // full-bleed circle with one solid slice
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={cls}>
          <path d="M8 .5A7.5 7.5 0 1 0 15.5 8H8V.5Z" fillOpacity="0.35" />
          <path d="M9.5.65A7.5 7.5 0 0 1 15.35 6.5H9.5V.65Z" />
        </svg>
      );
    case "bar": // segmented bar strip with one solid segment
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={cls}>
          <path d="M1 5h4v6H1V5Zm10 0h4v6h-4V5Z" fillOpacity="0.35" />
          <path d="M6 5h4v6H6V5Z" />
        </svg>
      );
    case "bar-fill": // square cell divided into vertical segments, one solid
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={cls}>
          <path d="M2 2h3.5v12H2V2Zm8.5 0H14v12h-3.5V2Z" fillOpacity="0.35" />
          <path d="M6.5 2h3v12h-3V2Z" />
        </svg>
      );
  }
}

interface OptionsDrawerProps {
  decimals: DecimalPrecision;
  layout: LayoutMode;
  showTitle: boolean;
  weightDisplayFormat: WeightDisplayFormat;
  theme: GridThemeId;
  weightViz: WeightVizMode;
  showResultViz: boolean;
  onDecimalsChange: (d: DecimalPrecision) => void;
  onLayoutChange: (l: LayoutMode) => void;
  onShowTitleChange: (show: boolean) => void;
  onWeightDisplayFormatChange: (f: WeightDisplayFormat) => void;
  onThemeChange: (t: GridThemeId) => void;
  onWeightVizChange: (v: WeightVizMode) => void;
  onShowResultVizChange: (show: boolean) => void;
  templates: Template[];
  onSaveTemplate: (name: string, state: AppState) => void;
  onLoadTemplate: (template: Template) => void;
  onDeleteTemplate: (id: string) => void;
  currentState: AppState;
}

export default function OptionsDrawer({
  decimals,
  layout,
  showTitle,
  weightDisplayFormat,
  theme,
  weightViz,
  showResultViz,
  onDecimalsChange,
  onLayoutChange,
  onShowTitleChange,
  onWeightDisplayFormatChange,
  onThemeChange,
  onWeightVizChange,
  onShowResultVizChange,
  templates,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  currentState,
}: OptionsDrawerProps) {
  return (
    <div data-exclude-export>
      <div className="bg-white border border-neutral-300 p-0 mt-1">
        <div className="p-4 flex flex-wrap gap-x-8 gap-y-4">
          <div className="min-w-[140px]">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Decimal Places
            </p>
            <div className="flex border border-neutral-300">
              {([0, 1, 2] as DecimalPrecision[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  tabIndex={-1}
                  onClick={() => onDecimalsChange(d)}
                  className={`flex-1 py-1 px-4 text-sm font-medium transition-all duration-150 cursor-pointer border-r border-neutral-300 last:border-r-0 ${
                    decimals === d
                      ? "bg-neutral-800 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-[220px]">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Layout
            </p>
            <div className="flex border border-neutral-300">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => onLayoutChange("vertical")}
                className={`flex-1 py-1 text-sm font-medium transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer border-r border-neutral-300 ${
                  layout === "vertical"
                    ? "bg-neutral-800 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-9ZM3.5 3a.5.5 0 0 0-.5.5V5h10V3.5a.5.5 0 0 0-.5-.5h-9ZM13 6H3v1.5h10V6ZM3 8.5h10V10H3V8.5Z" />
                </svg>
                Vertical
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => onLayoutChange("horizontal")}
                className={`flex-1 py-1 text-sm font-medium transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  layout === "horizontal"
                    ? "bg-neutral-800 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-9ZM3.5 3a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5H5V3H3.5ZM6 3v10h1.5V3H6ZM8.5 3v10H10V3H8.5Z" />
                </svg>
                Horizontal
              </button>
            </div>
          </div>

          <div className="min-w-[180px]">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Title
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                tabIndex={-1}
                checked={showTitle}
                onChange={(e) => onShowTitleChange(e.target.checked)}
                className="border-slate-400 text-neutral-800 focus:ring-slate-500 w-4 h-4 cursor-pointer"
              />
              Show title
            </label>
          </div>

          <div className="min-w-[180px]">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Weight Format
            </p>
            <div className="flex border border-neutral-300">
              {(["decimal", "fraction"] as WeightDisplayFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  tabIndex={-1}
                  onClick={() => onWeightDisplayFormatChange(f)}
                  className={`flex-1 py-1 px-3 text-sm font-medium transition-all duration-150 cursor-pointer border-r border-neutral-300 last:border-r-0 ${
                    weightDisplayFormat === f
                      ? "bg-neutral-800 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {f === "decimal" ? "Decimal" : "Fraction"}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-[200px]">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Weight Style
              </p>
              <label
                className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none"
                title="Also draw the visualization in the result cells"
              >
                <input
                  type="checkbox"
                  tabIndex={-1}
                  checked={showResultViz}
                  onChange={(e) => onShowResultVizChange(e.target.checked)}
                  className="border-slate-400 text-neutral-800 focus:ring-slate-500 w-3.5 h-3.5 cursor-pointer"
                />
                Results
              </label>
            </div>
            <div className="grid grid-cols-3 gap-0 border border-neutral-300">
              {WEIGHT_VIZ_OPTIONS.map((opt, i) => {
                const row = Math.floor(i / 3);
                const col = i % 3;
                const totalRows = Math.ceil(WEIGHT_VIZ_OPTIONS.length / 3);
                const isLastRow = row === totalRows - 1;
                const isLastCol = col === 2;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    tabIndex={-1}
                    onClick={() => onWeightVizChange(opt.id)}
                    title={opt.title}
                    aria-pressed={weightViz === opt.id}
                    className={`py-1 px-2 text-xs font-medium transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer flex-col ${
                      !isLastCol ? "border-r border-neutral-300" : ""
                    } ${!isLastRow ? "border-b border-neutral-300" : ""} ${
                      weightViz === opt.id
                        ? "bg-neutral-800 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <WeightVizIcon mode={opt.id} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-[280px]">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Theme
            </p>
            <div className="flex gap-1.5">
              {GRID_THEME_LIST.map((t) => {
                const selected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    tabIndex={-1}
                    onClick={() => onThemeChange(t.id)}
                    title={t.name}
                    aria-pressed={selected}
                    className={`flex flex-col items-center gap-1 px-2 pt-1.5 pb-1 border transition-all duration-150 cursor-pointer ${
                      selected
                        ? "border-neutral-800 bg-slate-50"
                        : "border-neutral-300 bg-white hover:border-neutral-500"
                    }`}
                  >
                    <span
                      className="block w-12 h-7 border border-neutral-300 overflow-hidden"
                      aria-hidden="true"
                    >
                      <span className="block h-2.5" style={{ backgroundColor: t.swatch.header }} />
                      <span className="block h-2 bg-white" />
                      <span className="block h-2" style={{ backgroundColor: t.swatch.body }} />
                    </span>
                    <span className={`text-[10px] leading-tight ${selected ? "font-semibold text-slate-800" : "text-slate-500"}`}>
                      {t.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-[240px] flex-1">
            <TemplateManager
              templates={templates}
              onSave={onSaveTemplate}
              onLoad={onLoadTemplate}
              onDelete={onDeleteTemplate}
              currentState={currentState}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
