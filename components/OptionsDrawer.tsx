"use client";

import type { AppState, DecimalPrecision, LayoutMode, Template } from "@/lib/types";
import { themePresets, type ThemeState } from "@/lib/themes";
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
  themeState: ThemeState;
  onThemeChange: (theme: ThemeState) => void;
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
  themeState,
  onThemeChange,
}: OptionsDrawerProps) {
  return (
    <div
      className="grid transition-all duration-300 ease-out"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div className="overflow-hidden">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mt-1">
          <div className="flex flex-wrap gap-x-10 gap-y-5">
            {/* Decimals */}
            <div className="min-w-[140px]">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                Decimal Places
              </p>
              <div className="flex rounded-lg bg-slate-100 p-0.5">
                {([0, 1, 2] as DecimalPrecision[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => onDecimalsChange(d)}
                    className={`flex-1 py-1.5 px-4 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                      decimals === d
                        ? "bg-white text-accent-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout */}
            <div className="min-w-[220px]">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                Layout
              </p>
              <div className="flex rounded-lg bg-slate-100 p-0.5">
                <button
                  onClick={() => onLayoutChange("vertical")}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                    layout === "vertical"
                      ? "bg-white text-accent-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-9ZM3.5 3a.5.5 0 0 0-.5.5V5h10V3.5a.5.5 0 0 0-.5-.5h-9ZM13 6H3v1.5h10V6ZM3 8.5h10V10H3V8.5Z" />
                  </svg>
                  Vertical
                </button>
                <button
                  onClick={() => onLayoutChange("horizontal")}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                    layout === "horizontal"
                      ? "bg-white text-accent-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-9ZM3.5 3a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5H5V3H3.5ZM6 3v10h1.5V3H6ZM8.5 3v10H10V3H8.5Z" />
                  </svg>
                  Horizontal
                </button>
              </div>
            </div>

            {/* Theme */}
            <div className="min-w-[200px]">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                Theme
              </p>
              <div className="flex items-center gap-2">
                {themePresets.map((preset) => {
                  const isSelected = themeState.preset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => onThemeChange({ preset: preset.id, customColor: themeState.customColor })}
                      className={`w-7 h-7 rounded-full transition-all duration-200 cursor-pointer ${
                        isSelected ? "scale-110" : "hover:scale-105"
                      }`}
                      style={{
                        backgroundColor: preset.swatch,
                        boxShadow: isSelected
                          ? `0 0 0 2px white, 0 0 0 4px ${preset.swatch}`
                          : "none",
                      }}
                      title={preset.name}
                      aria-label={`${preset.name} theme`}
                    />
                  );
                })}

                {/* Custom color picker */}
                <label
                  className={`w-7 h-7 rounded-full cursor-pointer relative flex items-center justify-center transition-all duration-200 overflow-hidden ${
                    themeState.preset === "custom" ? "scale-110" : "hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: themeState.preset === "custom" ? themeState.customColor : undefined,
                    boxShadow: themeState.preset === "custom"
                      ? `0 0 0 2px white, 0 0 0 4px ${themeState.customColor}`
                      : "none",
                    border: themeState.preset !== "custom" ? "2px dashed #94a3b8" : "none",
                  }}
                  title="Custom color"
                  aria-label="Custom theme color"
                >
                  {themeState.preset !== "custom" && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-slate-400">
                      <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                    </svg>
                  )}
                  <input
                    type="color"
                    value={themeState.customColor}
                    onChange={(e) => onThemeChange({ preset: "custom", customColor: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
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
      </div>
    </div>
  );
}
