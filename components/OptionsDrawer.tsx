"use client";

import type {
  AppState,
  DecimalPrecision,
  LayoutMode,
  Template,
  WeightDisplayFormat,
} from "@/lib/types";
import TemplateManager from "./TemplateManager";

interface OptionsDrawerProps {
  decimals: DecimalPrecision;
  layout: LayoutMode;
  showTitle: boolean;
  weightDisplayFormat: WeightDisplayFormat;
  onDecimalsChange: (d: DecimalPrecision) => void;
  onLayoutChange: (l: LayoutMode) => void;
  onShowTitleChange: (show: boolean) => void;
  onWeightDisplayFormatChange: (f: WeightDisplayFormat) => void;
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
  onDecimalsChange,
  onLayoutChange,
  onShowTitleChange,
  onWeightDisplayFormatChange,
  templates,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  currentState,
}: OptionsDrawerProps) {
  return (
    <div data-exclude-export>
      <div className="bg-white border border-neutral-300 p-0 mt-1">
        <div className="appraisal-section-header">Options</div>
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
