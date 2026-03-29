"use client";

import { useRef, useCallback, useEffect } from "react";
import type { AppState, CompSale, DecimalPrecision, LayoutMode, Template } from "@/lib/types";
import { copyGridAsImage } from "@/lib/exportImage";
import { saveGridAsImage, getRememberLocation, setRememberLocation } from "@/lib/saveImage";
import { useAutoSave, loadSavedState } from "@/hooks/useAutoSave";
import { useTemplates } from "@/hooks/useTemplates";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import {
  type ThemeState,
  loadThemeState,
  saveThemeState,
  applyThemeColors,
  getThemeColors,
} from "@/lib/themes";
import SpreadsheetGrid from "./SpreadsheetGrid";
import OptionsDrawer from "./OptionsDrawer";
import WeightAllocationTool from "./WeightAllocationTool";
import SensitivityAnalysisTool from "./SensitivityAnalysisTool";
import { useState } from "react";

function createComp(index: number): CompSale {
  return {
    id: crypto.randomUUID(),
    label: `Sale ${index}`,
    salePrice: 0,
    weight: 0,
    gla: 0,
  };
}

function normalizeComp(c: CompSale): CompSale {
  return {
    ...c,
    gla: typeof c.gla === "number" && isFinite(c.gla) ? c.gla : 0,
  };
}

function defaultState(): AppState {
  return {
    comps: [createComp(1), createComp(2), createComp(3)],
    decimals: 0,
    layout: "vertical",
    title: "Weighted Average Analysis",
    showTitle: false,
    subjectGla: 0,
  };
}

function normalizeState(state: AppState): AppState {
  return {
    ...state,
    showTitle: typeof state.showTitle === "boolean" ? state.showTitle : Boolean(state.title?.trim()),
    subjectGla:
      typeof state.subjectGla === "number" && isFinite(state.subjectGla) ? state.subjectGla : 0,
    comps: state.comps.map(normalizeComp),
  };
}

export default function WeightedAverageApp() {
  const {
    state,
    set: setState,
    reset: resetState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<AppState>(defaultState());

  const [hydrated, setHydrated] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "done" | "error">("idle");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [rememberLocation, setRememberLocationState] = useState(false);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [themeState, setThemeState] = useState<ThemeState>({ preset: "blue", customColor: "#8B5CF6" });
  const chartRef = useRef<HTMLDivElement>(null);
  const saveMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = loadSavedState();
    resetState(saved ? normalizeState(saved) : defaultState());
    setRememberLocationState(getRememberLocation());

    const savedTheme = loadThemeState();
    setThemeState(savedTheme);
    applyThemeColors(getThemeColors(savedTheme));

    setHydrated(true);
  }, [resetState]);

  useAutoSave(state);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z") || (e.shiftKey && e.key === "Z"))) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  /** Use "click" (not "mousedown") so we don't run before the button's click and steal the gesture. */
  useEffect(() => {
    if (!saveMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target as Node)) {
        setSaveMenuOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [saveMenuOpen]);

  const { templates, saveTemplate, deleteTemplate, getTemplate } = useTemplates();

  const updateComp = useCallback(
    (id: string, field: "salePrice" | "weight" | "gla", value: number) => {
      setState((prev) => ({
        ...prev,
        comps: prev.comps.map((c) =>
          c.id === id ? { ...c, [field]: value } : c
        ),
      }));
    },
    [setState]
  );

  const setSubjectGla = useCallback((value: number) => {
    setState((prev) => ({ ...prev, subjectGla: value }));
  }, [setState]);

  const addComp = useCallback(() => {
    setState((prev) => {
      if (prev.comps.length >= 12) return prev;
      return {
        ...prev,
        comps: [...prev.comps, createComp(prev.comps.length + 1)],
      };
    });
  }, [setState]);

  const removeComp = useCallback((id: string) => {
    setState((prev) => {
      if (prev.comps.length <= 3) return prev;
      const filtered = prev.comps.filter((c) => c.id !== id);
      const relabeled = filtered.map((c, i) => ({
        ...c,
        label: `Sale ${i + 1}`,
      }));
      return { ...prev, comps: relabeled };
    });
  }, [setState]);

  const setDecimals = useCallback((d: DecimalPrecision) => {
    setState((prev) => ({ ...prev, decimals: d }));
  }, [setState]);

  const setLayout = useCallback((l: LayoutMode) => {
    setState((prev) => ({ ...prev, layout: l }));
  }, [setState]);

  const setTitle = useCallback((title: string) => {
    setState((prev) => ({ ...prev, title }));
  }, [setState]);

  const setShowTitle = useCallback((showTitle: boolean) => {
    setState((prev) => ({ ...prev, showTitle }));
  }, [setState]);


  const applyWeights = useCallback((weightsById: Record<string, number>) => {
    setState((prev) => ({
      ...prev,
      comps: prev.comps.map((c) => ({
        ...c,
        weight: typeof weightsById[c.id] === "number" ? weightsById[c.id] : c.weight,
      })),
    }));
  }, [setState]);

  const handleLoadTemplate = useCallback(
    (template: Template) => {
      const t = getTemplate(template.id);
      if (t) {
        const loaded = structuredClone(t.state);
        loaded.comps = loaded.comps.map((c) => ({
          ...normalizeComp(c),
          id: crypto.randomUUID(),
        }));
        setState(normalizeState(loaded));
      }
    },
    [getTemplate, setState]
  );

  const handleThemeChange = useCallback((newTheme: ThemeState) => {
    setThemeState(newTheme);
    saveThemeState(newTheme);
    applyThemeColors(getThemeColors(newTheme));
  }, []);

  /** Snapshot the node at click time; after awaits, gridRef.current must not be re-read (race / lost ref). */
  const resolveExportElement = useCallback((): HTMLElement | null => {
    let el = chartRef.current;
    if (el) return el;
    return null;
  }, []);

  const handleCopy = useCallback(() => {
    const el = resolveExportElement();
    if (!el) {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
      return;
    }

    setCopyStatus("copying");
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    void copyGridAsImage(el).then((success) => {
      setCopyStatus(success ? "done" : "error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    });
  }, [resolveExportElement]);

  const handleSave = useCallback(async () => {
    let el = resolveExportElement();
    if (!el) {
      await new Promise((r) => requestAnimationFrame(r));
      el = resolveExportElement();
    }
    if (!el) return;

    setSaveStatus("saving");
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    try {
      const result = await saveGridAsImage(el, rememberLocation, state.comps.length);
      if (result.success) {
        setSaveStatus("done");
        if (!rememberLocation) {
          setRememberLocation(true);
          setRememberLocationState(true);
        }
      } else {
        setSaveStatus("idle");
      }
    } catch {
      setSaveStatus("error");
    }
    setTimeout(() => setSaveStatus("idle"), 2000);
  }, [rememberLocation, state.comps.length, resolveExportElement]);

  const toggleRemember = useCallback((checked: boolean) => {
    setRememberLocation(checked);
    setRememberLocationState(checked);
  }, []);

  const handleClear = useCallback(() => {
    setState((prev) => ({
      ...prev,
      subjectGla: 0,
      comps: prev.comps.map((comp) => ({
        ...comp,
        salePrice: 0,
        weight: 0,
        gla: 0,
      })),
    }));
    setSaveMenuOpen(false);
    setCopyStatus("idle");
    setSaveStatus("idle");
  }, [setState]);

  if (!hydrated) {
    return (
      <div className="w-full max-w-4xl mx-auto animate-pulse">
        <div className="h-10 bg-slate-200/60 rounded-xl w-72 mx-auto mb-8" />
        <div className="h-72 bg-slate-200/60 rounded-2xl" />
      </div>
    );
  }

  /** After all sale + weight cells (indices 1 … 2n), Copy is next in tab order only. */
  const copyTabIndex = 2 * state.comps.length + 1;

  return (
    <div className="mx-auto w-fit">
      {/* Toolbar above card — same width as card, groups centered */}
      <div className="flex flex-col items-center w-full">
        <div className="w-fit mx-auto flex flex-col items-stretch">
          {/* Undo/Redo | Copy | Save — centered to card */}
          <div
            className="mb-4 w-full flex flex-wrap items-center justify-center gap-2 px-1"
            data-exclude-export
          >
            <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden shrink-0">
              <button
                type="button"
                tabIndex={-1}
                onClick={undo}
                disabled={!canUndo}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Undo (Ctrl+Z)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 0 1-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 0 1 0 10.75H10.75a.75.75 0 0 1 0-1.5h2.875a3.875 3.875 0 0 0 0-7.75H3.622l4.146 3.957a.75.75 0 0 1-1.036 1.085l-5.5-5.25a.75.75 0 0 1 0-1.085l5.5-5.25a.75.75 0 0 1 1.06.025Z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="w-px h-5 bg-slate-200/80" />
              <button
                type="button"
                tabIndex={-1}
                onClick={redo}
                disabled={!canRedo}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Redo (Ctrl+Y)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M12.207 2.232a.75.75 0 0 0 .025 1.06l4.146 3.958H6.375a5.375 5.375 0 0 0 0 10.75H9.25a.75.75 0 0 0 0-1.5H6.375a3.875 3.875 0 0 1 0-7.75h10.003l-4.146 3.957a.75.75 0 0 0 1.036 1.085l5.5-5.25a.75.75 0 0 0 0-1.085l-5.5-5.25a.75.75 0 0 0-1.06.025Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              tabIndex={copyTabIndex}
              onClick={handleCopy}
              disabled={copyStatus === "copying"}
              className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                copyStatus === "done"
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                  : copyStatus === "error"
                  ? "bg-red-500 text-white"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:text-slate-800 shadow-sm"
              }`}
            >
              {copyStatus === "copying" ? (
                <>
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Copying...
                </>
              ) : copyStatus === "done" ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  </svg>
                  Copied!
                </>
              ) : copyStatus === "error" ? (
                "Failed"
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path d="M5.5 3.5A1.5 1.5 0 0 1 7 2h5.5a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 12.5 12H7a1.5 1.5 0 0 1-1.5-1.5v-7Z" />
                    <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4H5v6.5A2.5 2.5 0 0 0 7.5 13H11v.5A1.5 1.5 0 0 1 9.5 15H4a2 2 0 0 1-2-2V7a1.5 1.5 0 0 1 1-1.415V5.5Z" />
                  </svg>
                  Copy
                </>
              )}
            </button>

            <div className="relative" ref={saveMenuRef}>
              <div className="flex items-center">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={handleSave}
                  disabled={saveStatus === "saving"}
                  className={`flex items-center gap-1.5 text-sm font-medium pl-3.5 pr-2.5 py-2 rounded-l-xl transition-all duration-200 cursor-pointer ${
                    saveStatus === "done"
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                      : saveStatus === "error"
                      ? "bg-red-500 text-white"
                      : "bg-accent-600 text-white hover:bg-accent-700 shadow-sm shadow-accent-200"
                  }`}
                >
                  {saveStatus === "saving" ? (
                    <>
                      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </>
                  ) : saveStatus === "done" ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                      </svg>
                      Saved!
                    </>
                  ) : saveStatus === "error" ? (
                    "Failed"
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                        <path d="M8.75 2.75a.75.75 0 0 0-1.5 0v5.69L5.03 6.22a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 0 0-1.06-1.06L8.75 8.44V2.75Z" />
                        <path d="M3.5 9.75a.75.75 0 0 0-1.5 0v1.5A2.75 2.75 0 0 0 4.75 14h6.5A2.75 2.75 0 0 0 14 11.25v-1.5a.75.75 0 0 0-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-1.5Z" />
                      </svg>
                      Save
                      {rememberLocation && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-accent-200">
                          <path fillRule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 7c0 2.255 1.19 4.235 2.291 5.597a15.591 15.591 0 0 0 2.236 2.235l.012.01ZM8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
                        </svg>
                      )}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setSaveMenuOpen((o) => !o)}
                  className={`flex items-center py-2 px-1.5 rounded-r-xl transition-all duration-200 cursor-pointer ${
                    saveStatus === "done"
                      ? "bg-emerald-500 text-white border-l border-emerald-400"
                      : saveStatus === "error"
                      ? "bg-red-500 text-white border-l border-red-400"
                      : "bg-accent-600 text-white hover:bg-accent-700 border-l border-accent-500"
                  }`}
                  title="Save options"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              {saveMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-slate-200/80 shadow-lg shadow-slate-200/50 p-4 min-w-[220px]">
                  <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      tabIndex={-1}
                      checked={rememberLocation}
                      onChange={(e) => toggleRemember(e.target.checked)}
                      className="rounded border-slate-300 text-accent-600 focus:ring-accent-500 w-4 h-4 cursor-pointer"
                    />
                    Remember directory
                  </label>
                  <p className="text-xs text-slate-400 mt-1.5 ml-6.5">
                    Save to the same folder without prompting
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:text-slate-800 shadow-sm"
              title="Clear table data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path d="M8.22 1.27a.75.75 0 0 1 1.06 0l1.44 1.44a.75.75 0 0 1 0 1.06L8.66 5.83l1.51 1.51 3.44-.69a.75.75 0 0 1 .88.88l-.69 3.44 1.51 1.51-1.06 1.06-1.51-1.51-3.44.69a.75.75 0 0 1-.88-.88l.69-3.44L7.6 6.89 5.54 8.95a.75.75 0 0 1-1.06 0L3.04 7.5a.75.75 0 0 1 0-1.06l5.18-5.17Z" />
                <path d="M2.25 12.25a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-.46l.43 1.72A.75.75 0 0 1 7.79 15H3.71a.75.75 0 0 1-.73-.94L3.41 13H3a.75.75 0 0 1-.75-.75Z" />
              </svg>
              Clear
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-900/[0.04] w-fit">
            {/* Exportable area */}
            <div className="bg-white rounded-2xl px-5 py-3 flex flex-col gap-2.5">
              {state.showTitle && (
                <input
                  type="text"
                  value={state.title}
                  onChange={(e) => setTitle(e.target.value)}
                  tabIndex={-1}
                  className="block w-full text-center text-xl font-bold leading-tight text-slate-800 bg-transparent outline-none focus:ring-2 focus:ring-accent-300/50 rounded-lg px-3 py-1 border-0 placeholder:text-slate-300"
                  spellCheck={false}
                  placeholder="Enter title..."
                />
              )}

              <SpreadsheetGrid
                gridExportRef={chartRef}
                comps={state.comps}
                decimals={state.decimals}
                layout={state.layout}
                onUpdateComp={updateComp}
                onAddComp={addComp}
                onRemoveComp={removeComp}
              />
            </div>
          </div>

          <WeightAllocationTool
            comps={state.comps}
            decimals={state.decimals}
            onApplyWeights={applyWeights}
            onUpdateWeight={(id, value) => updateComp(id, "weight", value)}
          />
        </div>

        {/* Options — always visible below action bar */}
        <div className="mt-3 w-full max-w-4xl" data-exclude-export>
          <OptionsDrawer
            decimals={state.decimals}
            layout={state.layout}
            showTitle={state.showTitle}
            onDecimalsChange={setDecimals}
            onLayoutChange={setLayout}
            onShowTitleChange={setShowTitle}
            templates={templates}
            onSaveTemplate={saveTemplate}
            onLoadTemplate={handleLoadTemplate}
            onDeleteTemplate={deleteTemplate}
            currentState={state}
            themeState={themeState}
            onThemeChange={handleThemeChange}
          />
        </div>

        <div className="mt-3 w-full max-w-4xl" data-exclude-export>
          <SensitivityAnalysisTool
            comps={state.comps}
            decimals={state.decimals}
            subjectGla={state.subjectGla}
            onSubjectGlaChange={setSubjectGla}
            onUpdateCompGla={(id, value) => updateComp(id, "gla", value)}
          />
        </div>
      </div>
    </div>
  );
}
