"use client";

import { useRef, useCallback, useEffect, useMemo } from "react";
import type { AppState, CompSale, DecimalPrecision, LayoutMode, Template } from "@/lib/types";
import { copyChartImageToClipboard, type CopyResult } from "@/lib/chartClipboard";
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

/** Stable ids so server and client initial HTML match (crypto.randomUUID in default state breaks hydration). */
function defaultState(): AppState {
  return {
    comps: [
      { id: "wa-default-1", label: "Sale 1", salePrice: 0, weight: 0, gla: 0 },
      { id: "wa-default-2", label: "Sale 2", salePrice: 0, weight: 0, gla: 0 },
      { id: "wa-default-3", label: "Sale 3", salePrice: 0, weight: 0, gla: 0 },
    ],
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

function clipExportHint(text: string, max = 96): string {
  const t = text.trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function copyFailureHint(result: CopyResult): string {
  if (result.ok) return "";
  switch (result.reason) {
    case "no_element":
      return "Chart area not ready — try again.";
    case "unsupported":
      return result.message
        ? clipExportHint(result.message)
        : "This browser does not support copying images.";
    case "capture_failed":
      return clipExportHint(result.message ?? "Could not render chart to image.");
    case "clipboard_denied":
      return clipExportHint(result.message ?? "Clipboard blocked — check site permissions or HTTPS.");
    default:
      return "Copy failed.";
  }
}

export default function WeightedAverageApp() {
  const initialState = useMemo(() => defaultState(), []);
  const {
    state,
    set: setState,
    reset: resetState,
    undo,
    redo,
  } = useUndoRedo<AppState>(initialState);

  const [hydrated, setHydrated] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "done" | "error">("idle");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [copyDetail, setCopyDetail] = useState("");
  const [saveDetail, setSaveDetail] = useState("");
  const [saveInfo, setSaveInfo] = useState("");
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
      console.error("[WeightedAverage] Copy failed: export element missing");
      setCopyDetail("Chart area not ready — try again.");
      setCopyStatus("error");
      setTimeout(() => {
        setCopyStatus("idle");
        setCopyDetail("");
      }, 4000);
      return;
    }

    setCopyDetail("");
    setCopyStatus("copying");
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    void copyChartImageToClipboard(el).then((result) => {
      if (!result.ok) {
        setCopyDetail(copyFailureHint(result));
      }
      setCopyStatus(result.ok ? "done" : "error");
      setTimeout(() => {
        setCopyStatus("idle");
        setCopyDetail("");
      }, result.ok ? 2000 : 4000);
    });
  }, [resolveExportElement]);

  const handleSave = useCallback(async () => {
    let el = resolveExportElement();
    if (!el) {
      await new Promise((r) => requestAnimationFrame(r));
      el = resolveExportElement();
    }
    if (!el) {
      console.error("[WeightedAverage] Save failed: export element missing");
      setSaveDetail("Chart area not ready — try again.");
      setSaveStatus("error");
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveDetail("");
      }, 4000);
      return;
    }

    setSaveDetail("");
    setSaveInfo("");
    setSaveStatus("saving");
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    let clearAfterMs = 0;
    try {
      const result = await saveChartAsWebp(el, rememberLocation, state.comps.length, activeTool);
      if (result.success) {
        setSaveStatus("done");
        if (result.openedInNewTab) {
          setSaveInfo("Image opened in a new tab — use the browser menu to save if needed.");
          clearAfterMs = 5000;
        } else {
          clearAfterMs = 2000;
        }
      } else if (result.canceled) {
        setSaveStatus("idle");
      } else {
        setSaveDetail(clipExportHint(result.errorMessage ?? "Save failed."));
        setSaveStatus("error");
        if (result.errorMessage) {
          console.error("[WeightedAverage] Save failed:", result.errorMessage);
        }
        clearAfterMs = 4000;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[WeightedAverage] Save threw:", e);
      setSaveDetail(clipExportHint(msg));
      setSaveStatus("error");
      clearAfterMs = 4000;
    }

    if (clearAfterMs > 0) {
      window.setTimeout(() => {
        setSaveStatus("idle");
        setSaveDetail("");
        setSaveInfo("");
      }, clearAfterMs);
    }
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
    setCopyDetail("");
    setSaveDetail("");
    setSaveInfo("");
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
              title={copyDetail || undefined}
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
                <span className="max-w-[10rem] truncate">{copyDetail ? "Failed — see below" : "Failed"}</span>
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
                  title={saveDetail || saveInfo || undefined}
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
                    <span className="max-w-[10rem] truncate">{saveDetail ? "Failed — see below" : "Failed"}</span>
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M9.045 1.29a.75.75 0 0 0-1.09 0L7.5 1.79a.75.75 0 0 1-.73.2l-.632-.174a.75.75 0 0 0-.89.513l-.19.642a.75.75 0 0 1-.53.53l-.641.19a.75.75 0 0 0-.514.89l.174.631a.75.75 0 0 1-.2.73l-.499.456a.75.75 0 0 0 0 1.09l.499.455a.75.75 0 0 1 .2.731l-.174.632a.75.75 0 0 0 .514.89l.641.19a.75.75 0 0 1 .53.53l.19.641a.75.75 0 0 0 .89.514l.632-.174a.75.75 0 0 1 .73.2l.455.499a.75.75 0 0 0 1.09 0l.456-.499a.75.75 0 0 1 .73-.2l.631.174a.75.75 0 0 0 .89-.514l.19-.641a.75.75 0 0 1 .53-.53l.642-.19a.75.75 0 0 0 .513-.89l-.174-.632a.75.75 0 0 1 .2-.73l.499-.456a.75.75 0 0 0 0-1.09l-.499-.455a.75.75 0 0 1-.2-.73l.174-.632a.75.75 0 0 0-.513-.89l-.642-.19a.75.75 0 0 1-.53-.53l-.19-.642a.75.75 0 0 0-.89-.513l-.631.174a.75.75 0 0 1-.73-.2l-.456-.5ZM8.5 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M5 1.75A1.75 1.75 0 0 0 3.25 3.5v.75h-.5a.75.75 0 0 0 0 1.5h.638l.548 7.119A1.75 1.75 0 0 0 5.68 14.5h4.64a1.75 1.75 0 0 0 1.744-1.631l.548-7.119h.638a.75.75 0 0 0 0-1.5h-.5V3.5A1.75 1.75 0 0 0 11 1.75H5ZM11.25 4.25V3.5a.25.25 0 0 0-.25-.25H5a.25.25 0 0 0-.25.25v.75h6.5Z"
                  clipRule="evenodd"
                />
              </svg>
              Clear
            </button>

          </div>

          {copyDetail && copyStatus === "error" && (
            <p className="mt-1 text-center text-xs text-red-600 max-w-lg mx-auto px-2" role="alert">
              {copyDetail}
            </p>
          )}
          {saveDetail && saveStatus === "error" && (
            <p className="mt-1 text-center text-xs text-red-600 max-w-lg mx-auto px-2" role="alert">
              {saveDetail}
            </p>
          )}
          {saveInfo && saveStatus === "done" && (
            <p className="mt-1 text-center text-xs text-slate-600 max-w-lg mx-auto px-2" role="status">
              {saveInfo}
            </p>
          )}

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
