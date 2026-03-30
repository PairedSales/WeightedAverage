"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AppState, DecimalPrecision, LayoutMode, Template } from "@/lib/types";
import { themePresets, type ThemeState } from "@/lib/themes";
import TemplateManager from "./TemplateManager";

const PANEL_ID = "app-options-panel";

interface OptionsDrawerProps {
  decimals: DecimalPrecision;
  layout: LayoutMode;
  showTitle: boolean;
  onDecimalsChange: (d: DecimalPrecision) => void;
  onLayoutChange: (l: LayoutMode) => void;
  onShowTitleChange: (show: boolean) => void;
  templates: Template[];
  onSaveTemplate: (name: string, state: AppState) => void;
  onLoadTemplate: (template: Template) => void;
  onDeleteTemplate: (id: string) => void;
  currentState: AppState;
  themeState: ThemeState;
  onThemeChange: (theme: ThemeState) => void;
}

export default function OptionsDrawer({
  decimals,
  layout,
  showTitle,
  onDecimalsChange,
  onLayoutChange,
  onShowTitleChange,
  templates,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  currentState,
  themeState,
  onThemeChange,
}: OptionsDrawerProps) {
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closePanel = useCallback(() => {
    setEntered(false);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 300);
  }, []);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closePanel]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    []
  );

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        id="app-options-trigger"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => (open ? closePanel() : setOpen(true))}
        className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:text-slate-800 shadow-sm shrink-0"
        title="App options"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path
            fillRule="evenodd"
            d="M11.49 3.17a.75.75 0 0 1 1.02 0l.59.53a.75.75 0 0 0 .76.17l.77-.26a.75.75 0 0 1 .9.4l.38.72a.75.75 0 0 0 .62.4l.81.05a.75.75 0 0 1 .71.71l.05.8a.75.75 0 0 0 .4.62l.73.39a.75.75 0 0 1 .4.9l-.26.77a.75.75 0 0 0 .17.76l.53.59a.75.75 0 0 1 0 1.02l-.53.59a.75.75 0 0 0-.17.76l.26.77a.75.75 0 0 1-.4.9l-.72.38a.75.75 0 0 0-.4.62l-.05.81a.75.75 0 0 1-.71.71l-.8.05a.75.75 0 0 0-.62.4l-.39.73a.75.75 0 0 1-.9.4l-.77-.26a.75.75 0 0 0-.76.17l-.59.53a.75.75 0 0 1-1.02 0l-.59-.53a.75.75 0 0 0-.76-.17l-.77.26a.75.75 0 0 1-.9-.4l-.38-.72a.75.75 0 0 0-.62-.4l-.81-.05a.75.75 0 0 1-.71-.71l-.05-.8a.75.75 0 0 0-.4-.62l-.73-.39a.75.75 0 0 1-.4-.9l.26-.77a.75.75 0 0 0-.17-.76l-.53-.59a.75.75 0 0 1 0-1.02l.53-.59a.75.75 0 0 0 .17-.76l-.26-.77a.75.75 0 0 1 .4-.9l.72-.38a.75.75 0 0 0 .4-.62l.05-.81a.75.75 0 0 1 .71-.71l.8-.05a.75.75 0 0 0 .62-.4l.39-.73a.75.75 0 0 1 .9-.4l.77.26a.75.75 0 0 0 .76-.17l.59-.53ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
            clipRule="evenodd"
          />
        </svg>
        Options
      </button>

      {open && (
        <div className="fixed inset-0 z-40" data-exclude-export>
          <button
            type="button"
            tabIndex={-1}
            className={`absolute inset-0 z-40 bg-slate-900/40 transition-opacity duration-300 cursor-default ${
              entered ? "opacity-100" : "opacity-0"
            }`}
            aria-label="Close options"
            onClick={closePanel}
          />
          <div
            id={PANEL_ID}
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-options-panel-title"
            data-exclude-export
            className={`absolute top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200/80 bg-white shadow-xl shadow-slate-900/10 transition-transform duration-300 ease-out ${
              entered ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 px-5 py-4">
              <h2 id="app-options-panel-title" className="text-sm font-semibold text-slate-800">
                Options
              </h2>
              <button
                type="button"
                tabIndex={-1}
                onClick={closePanel}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                aria-label="Close options panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                    Decimal Places
                  </p>
                  <div className="flex rounded-lg bg-slate-100 p-0.5">
                    {([0, 1, 2] as DecimalPrecision[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        tabIndex={-1}
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

                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                    Layout
                  </p>
                  <div className="flex rounded-lg bg-slate-100 p-0.5">
                    <button
                      type="button"
                      tabIndex={-1}
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
                      type="button"
                      tabIndex={-1}
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

                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                    Theme
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {themePresets.map((preset) => {
                      const isSelected = themeState.preset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          tabIndex={-1}
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

                    <label
                      className={`w-7 h-7 rounded-full cursor-pointer relative flex items-center justify-center transition-all duration-200 overflow-hidden ${
                        themeState.preset === "custom" ? "scale-110" : "hover:scale-105"
                      }`}
                      style={{
                        backgroundColor: themeState.preset === "custom" ? themeState.customColor : undefined,
                        boxShadow:
                          themeState.preset === "custom"
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
                        tabIndex={-1}
                        value={themeState.customColor}
                        onChange={(e) => onThemeChange({ preset: "custom", customColor: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                    Title
                  </p>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      tabIndex={-1}
                      checked={showTitle}
                      onChange={(e) => onShowTitleChange(e.target.checked)}
                      className="rounded border-slate-300 text-accent-600 focus:ring-accent-500 w-4 h-4 cursor-pointer"
                    />
                    Show title
                  </label>
                </div>

                <div className="w-full min-w-0">
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
      )}
    </>
  );
}
