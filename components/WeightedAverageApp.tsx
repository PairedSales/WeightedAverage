"use client";

import { useRef, useCallback, useEffect } from "react";
import type { AppState, CompSale, DecimalPrecision, LayoutMode, Template } from "@/lib/types";
import { copyChartImageToClipboard } from "@/lib/chartClipboard";
import { saveChartAsWebp, getRememberLocation, setRememberLocation } from "@/lib/saveImage";
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

type ActiveTool = "weightedAverage" | "sensitivityAnalysis";

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
  } = useUndoRedo<AppState>(defaultState());

  const [hydrated, setHydrated] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "done" | "error">("idle");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [rememberLocation, setRememberLocationState] = useState(false);
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool>("weightedAverage");
  const [toolSwapPulse, setToolSwapPulse] = useState<ActiveTool | null>(null);
  const [themeState, setThemeState] = useState<ThemeState>({ preset: "blue", customColor: "#8B5CF6" });
  const weightedAverageChartRef = useRef<HTMLDivElement>(null);
  const sensitivityChartRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!saveMenuRef.current?.contains(event.target as Node)) {
        setIsSaveMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
    if (activeTool === "sensitivityAnalysis") {
      return sensitivityChartRef.current;
    }
    return weightedAverageChartRef.current;
  }, [activeTool]);

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

    void copyChartImageToClipboard(el).then((result) => {
      setCopyStatus(result.ok ? "done" : "error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    });
  }, [resolveExportElement]);

  const handleSave = useCallback(async () => {
    let el = resolveExportElement();
    if (!el) {
      await new Promise((r) => requestAnimationFrame(r));
      el = resolveExportElement();
    }
    if (!el) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return;
    }

    setSaveStatus("saving");
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    try {
      const result = await saveChartAsWebp(el, rememberLocation, state.comps.length, activeTool);
      if (result.success) {
        setSaveStatus("done");
      } else {
        setSaveStatus(result.canceled ? "idle" : "error");
      }
    } catch {
      setSaveStatus("error");
    }
    setTimeout(() => setSaveStatus("idle"), 2000);
  }, [rememberLocation, state.comps.length, resolveExportElement, activeTool]);

  const toggleRemember = useCallback((checked: boolean) => {
    setRememberLocation(checked);
    setRememberLocationState(checked);
    setIsSaveMenuOpen(false);
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
    setCopyStatus("idle");
    setSaveStatus("idle");
  }, [setState]);

  const handleToolToggle = useCallback(() => {
    const nextTool: ActiveTool =
      activeTool === "weightedAverage" ? "sensitivityAnalysis" : "weightedAverage";
    setActiveTool(nextTool);
    setToolSwapPulse(nextTool);
    window.setTimeout(() => {
      setToolSwapPulse((current) => (current === nextTool ? null : current));
    }, 520);
  }, [activeTool]);

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
          {/* Tool toggle | Copy | Save — centered to card */}
          <div
            className="mb-4 w-full flex flex-wrap items-center justify-center gap-2 px-1"
            data-exclude-export
          >
            <button
              type="button"
              onClick={handleToolToggle}
              className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:text-slate-800 shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M8 2.25a5.75 5.75 0 0 0-5.18 3.25h1.43a.75.75 0 0 1 0 1.5H1.5a.75.75 0 0 1-.75-.75V3.5a.75.75 0 0 1 1.5 0v1.19A7.25 7.25 0 0 1 15.25 8a.75.75 0 0 1-1.5 0A5.75 5.75 0 0 0 8 2.25Z" />
                <path d="M14.5 9a.75.75 0 0 1 .75.75v2.75a.75.75 0 0 1-1.5 0v-1.19A7.25 7.25 0 0 1 .75 8a.75.75 0 0 1 1.5 0A5.75 5.75 0 0 0 8 13.75a5.75 5.75 0 0 0 5.18-3.25H11.75a.75.75 0 0 1 0-1.5h2.75Z" />
              </svg>
              <span className="text-xs font-semibold">
                {activeTool === "sensitivityAnalysis" ? "Sensitivity Analysis" : "Weighted Average"}
              </span>
            </button>

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
              <div
                className={`flex items-stretch overflow-hidden rounded-xl transition-all duration-200 ${
                  saveStatus === "done"
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                    : saveStatus === "error"
                    ? "bg-red-500 text-white"
                    : "bg-accent-600 text-white hover:bg-accent-700 shadow-sm shadow-accent-200"
                }`}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={handleSave}
                  disabled={saveStatus === "saving"}
                  className="flex items-center gap-1.5 text-sm font-medium pl-3.5 pr-3 py-2 cursor-pointer disabled:cursor-not-allowed"
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
                    </>
                  )}
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Save options"
                  aria-expanded={isSaveMenuOpen}
                  onClick={() => setIsSaveMenuOpen((open) => !open)}
                  className="px-2.5 border-l border-white/25 hover:bg-white/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {isSaveMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] min-w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg z-20">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      tabIndex={-1}
                      checked={rememberLocation}
                      onChange={(e) => toggleRemember(e.target.checked)}
                      className="rounded border-slate-300 text-accent-600 focus:ring-accent-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    Remember directory
                  </label>
                </div>
              )}
            </div>

            <button
              type="button"
              tabIndex={-1}
              onClick={() => setOptionsOpen((open) => !open)}
              aria-expanded={optionsOpen}
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

            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:text-slate-800 shadow-sm"
              title="Clear table data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M2.25 8.25a.75.75 0 0 1 .75-.75h9.88a3 3 0 0 1 2.12.88l5 5a3 3 0 0 1 0 4.24l-1.88 1.88a3 3 0 0 1-4.24 0l-5-5a3 3 0 0 1-.88-2.12V8.25H3a.75.75 0 0 1-.75-.75Z" />
                <path d="M5.03 3.28a.75.75 0 0 1 1.06 0l2.5 2.5a.75.75 0 1 1-1.06 1.06l-2.5-2.5a.75.75 0 0 1 0-1.06Z" />
                <path d="M7.53 3.28a.75.75 0 0 1 1.06 0l2.5 2.5a.75.75 0 1 1-1.06 1.06l-2.5-2.5a.75.75 0 0 1 0-1.06Z" />
                <path d="M13.5 15.75a.75.75 0 0 1 1.06 0l2.75 2.75a.75.75 0 1 1-1.06 1.06l-2.75-2.75a.75.75 0 0 1 0-1.06Z" />
              </svg>
              Clear
            </button>

          </div>

          <div className="flex w-full flex-col items-center gap-3">
            <section
              className={`flex w-full flex-col items-center rounded-2xl transition-all duration-500 ease-[cubic-bezier(.2,.7,.1,1)] ${
                activeTool === "weightedAverage" ? "order-1" : "order-2"
              } ${toolSwapPulse === "weightedAverage" ? "card-lift-in" : ""}`}
              data-exclude-export={activeTool !== "weightedAverage" ? true : undefined}
            >
              <div className="mx-auto w-fit rounded-2xl border border-slate-200/60 bg-white shadow-xl shadow-slate-900/[0.04]">
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
                    gridExportRef={weightedAverageChartRef}
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

              {activeTool === "weightedAverage" && (
                <div className="mt-3 w-full max-w-4xl" data-exclude-export>
                  <OptionsDrawer
                    open={optionsOpen}
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
              )}
            </section>

            <section
              className={`flex w-full justify-center transition-all duration-500 ease-[cubic-bezier(.2,.7,.1,1)] ${
                activeTool === "sensitivityAnalysis" ? "order-1" : "order-2"
              } ${toolSwapPulse === "sensitivityAnalysis" ? "card-lift-in" : ""}`}
              data-exclude-export
            >
              <div className="flex w-full max-w-4xl flex-col items-center">
                <SensitivityAnalysisTool
                  exportRef={sensitivityChartRef}
                  comps={state.comps}
                  decimals={state.decimals}
                  subjectGla={state.subjectGla}
                  onSubjectGlaChange={setSubjectGla}
                  onUpdateCompSalePrice={(id, value) => updateComp(id, "salePrice", value)}
                  onUpdateCompGla={(id, value) => updateComp(id, "gla", value)}
                />

                {activeTool === "sensitivityAnalysis" && (
                  <div className="mt-3 w-full" data-exclude-export>
                    <OptionsDrawer
                      open={optionsOpen}
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
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
