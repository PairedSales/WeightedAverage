"use client";

import type { AppState, DecimalPrecision, LayoutMode, Template } from "@/lib/types";
import TemplateManager from "./TemplateManager";

interface OptionsDrawerProps {
  open: boolean;
  decimals: DecimalPrecision;
  layout: LayoutMode;
  onDecimalsChange: (d: DecimalPrecision) => void;
  onLayoutChange: (l: LayoutMode) => void;
  templates: Template[];
  onSaveTemplate: (name: string, state: AppState) => void;
  onLoadTemplate: (template: Template) => void;
  onDeleteTemplate: (id: string) => void;
  currentState: AppState;
}

export default function OptionsDrawer({
  open,
  decimals,
  layout,
  onDecimalsChange,
  onLayoutChange,
  templates,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  currentState,
}: OptionsDrawerProps) {
  if (!open) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        {/* Decimals */}
        <div className="min-w-[140px]">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Decimal Places
          </p>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {([0, 1, 2] as DecimalPrecision[]).map((d) => (
              <button
                key={d}
                onClick={() => onDecimalsChange(d)}
                className={`flex-1 py-1.5 px-4 text-sm font-medium transition-colors ${
                  decimals === d
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Layout */}
        <div className="min-w-[200px]">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Layout
          </p>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => onLayoutChange("vertical")}
              className={`flex-1 py-1.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                layout === "vertical"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v.71a1 1 0 0 1-.293.707L10 8.625V12.5a1 1 0 0 1-.4.8l-2 1.5A1 1 0 0 1 6 14v-5.375L2.293 4.917A1 1 0 0 1 2 4.21V3.5Z" />
              </svg>
              Vertical
            </button>
            <button
              onClick={() => onLayoutChange("horizontal")}
              className={`flex-1 py-1.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                layout === "horizontal"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 rotate-90">
                <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v.71a1 1 0 0 1-.293.707L10 8.625V12.5a1 1 0 0 1-.4.8l-2 1.5A1 1 0 0 1 6 14v-5.375L2.293 4.917A1 1 0 0 1 2 4.21V3.5Z" />
              </svg>
              Horizontal
            </button>
          </div>
        </div>

        {/* Templates */}
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
  );
}
