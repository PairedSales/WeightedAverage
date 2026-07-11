"use client";

import { useRef, useCallback, useEffect, useMemo } from "react";
import type { AppState, CompSale, DecimalPrecision, HistorySnapshot, LayoutMode, Template, WeightDisplayFormat } from "@/lib/types";
import { copyChartImageToClipboard, type CopyResult } from "@/lib/chartClipboard";
import { saveChartAsWebp, getRememberLocation, setRememberLocation } from "@/lib/saveImage";
import { useAutoSave, loadSavedState } from "@/hooks/useAutoSave";
import { useTemplates } from "@/hooks/useTemplates";
import { useHistory } from "@/hooks/useHistory";
import { useUndoRedo } from "@/hooks/useUndoRedo";

import SpreadsheetGrid from "./SpreadsheetGrid";
import OptionsDrawer from "./OptionsDrawer";
import PercentChangeCalculator from "./PercentChangeCalculator";
import HistoryPanel from "./HistoryPanel";
import { useState } from "react";

function createComp(index: number): CompSale {
  return {
    id: crypto.randomUUID(),
    label: `Sale ${index}`,
    salePrice: 0,
    weight: 0,
  };
}

function normalizeComp(c: CompSale): CompSale {
  const weight =
    typeof c.weight === "number" && isFinite(c.weight)
      ? c.weight
      : typeof c.weight === "string"
        ? c.weight
        : 0;
  return {
    ...c,
    weight,
  };
}

/** Stable ids so server and client initial HTML match (crypto.randomUUID in default state breaks hydration). */
function defaultState(): AppState {
  return {
    comps: [
      { id: "wa-default-1", label: "Sale 1", salePrice: 0, weight: 0 },
      { id: "wa-default-2", label: "Sale 2", salePrice: 0, weight: 0 },
      { id: "wa-default-3", label: "Sale 3", salePrice: 0, weight: 0 },
    ],
    decimals: 0,
    layout: "horizontal",
    title: "Weighted Average Analysis",
    showTitle: false,
    weightDisplayFormat: "decimal",
  };
}

function normalizeState(state: AppState): AppState {
  return {
    ...state,
    showTitle: typeof state.showTitle === "boolean" ? state.showTitle : Boolean(state.title?.trim()),
    weightDisplayFormat:
      state.weightDisplayFormat === "fraction" ? "fraction" : "decimal",
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
    canUndo,
    canRedo,
  } = useUndoRedo<AppState>(initialState);

  const [hydrated, setHydrated] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "done" | "error">("idle");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [copyDetail, setCopyDetail] = useState("");
  const [saveDetail, setSaveDetail] = useState("");
  const [saveInfo, setSaveInfo] = useState("");
  const [rememberLocation, setRememberLocationState] = useState(false);
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const [templateBarHeight, setTemplateBarHeight] = useState(0);

  const templateBarRef = useRef<HTMLDivElement>(null);
  const weightedAverageChartRef = useRef<HTMLDivElement>(null);
  const saveMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = loadSavedState();
    resetState(saved ? normalizeState(saved) : defaultState());
    setRememberLocationState(getRememberLocation());



    setHydrated(true);
  }, [resetState]);

  useAutoSave(state);


  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!saveMenuRef.current?.contains(event.target as Node)) {
        setIsSaveMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const el = templateBarRef.current;
    if (!el) return;
    const updateHeight = () => setTemplateBarHeight(el.offsetHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    window.addEventListener("resize", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [hydrated]);

  const { templates, saveTemplate, deleteTemplate, getTemplate } = useTemplates();
  const { history, addSnapshot } = useHistory();

  const updateComp = useCallback(
    (id: string, field: "salePrice" | "weight", value: number | string) => {
      setState((prev) => ({
        ...prev,
        comps: prev.comps.map((c) =>
          c.id === id ? { ...c, [field]: value } : c
        ),
      }));
    },
    [setState]
  );

  const addComp = useCallback(() => {
    setState((prev) => {
      if (prev.comps.length >= 12) return prev;
      return {
        ...prev,
        comps: [...prev.comps, createComp(prev.comps.length + 1)],
      };
    });
  }, [setState]);

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
      if (e.shiftKey && (e.key === "a" || e.key === "A") && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        addComp();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, addComp]);


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

  const setWeightDisplayFormat = useCallback((weightDisplayFormat: WeightDisplayFormat) => {
    setState((prev) => ({ ...prev, weightDisplayFormat }));
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

  const handleLoadHistory = useCallback(
    (snapshot: HistorySnapshot) => {
      setState(normalizeState(structuredClone(snapshot.state)));
    },
    [setState]
  );

  /** Snapshot the node at click time; after awaits, gridRef.current must not be re-read (race / lost ref). */
  const resolveExportElement = useCallback((): HTMLElement | null => {
    return weightedAverageChartRef.current;
  }, []);

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
      } else if (result.image) {
        addSnapshot(state, result.image);
      }
      setCopyStatus(result.ok ? "done" : "error");
      setTimeout(() => {
        setCopyStatus("idle");
        setCopyDetail("");
      }, result.ok ? 2000 : 4000);
    });
  }, [resolveExportElement, addSnapshot, state]);

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
      const result = await saveChartAsWebp(el, rememberLocation, state.comps.length);
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
  }, [rememberLocation, state.comps.length, resolveExportElement]);

  const toggleRemember = useCallback((checked: boolean) => {
    setRememberLocation(checked);
    setRememberLocationState(checked);
    setIsSaveMenuOpen(false);
  }, []);

  const handleClear = useCallback(() => {
    setState((prev) => ({
      ...prev,
      comps: prev.comps.map((comp) => ({
        ...comp,
        salePrice: 0,
        weight: 0,
      })),
    }));
    setCopyStatus("idle");
    setSaveStatus("idle");
    setCopyDetail("");
    setSaveDetail("");
    setSaveInfo("");
  }, [setState]);

  const applyBlankTemplate = useCallback((count: number) => {
    const hasDecimal = (100 % count) !== 0;
    const weight = 100 / count;
    setState({
      comps: Array.from({ length: count }, (_, i) => ({
        id: crypto.randomUUID(),
        label: `Sale ${i + 1}`,
        salePrice: 0,
        weight: weight,
      })),
      decimals: 0,
      layout: "horizontal",
      title: "Weighted Average Analysis",
      showTitle: false,
      weightDisplayFormat: hasDecimal ? "fraction" : "decimal",
    });
    setCopyStatus("idle");
    setSaveStatus("idle");
    setCopyDetail("");
    setSaveDetail("");
    setSaveInfo("");
  }, [setState]);

  const handleSelectBlankTemplate = useCallback((count: number) => {
    applyBlankTemplate(count);
  }, [applyBlankTemplate]);

  if (!hydrated) {
    return (
      <div className="w-full max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-slate-200/60 w-72 mx-auto mb-6" />
        <div className="h-56 bg-slate-200/60" />
      </div>
    );
  }

  /** After all sale + weight cells (indices 1 … 2n), Copy is next in tab order only. */
  const copyTabIndex = 2 * state.comps.length + 1;

  return (
    <div className="mx-auto w-fit" style={{ paddingTop: templateBarHeight }}>
      {/* Template Bar */}
      <div
        ref={templateBarRef}
        className="fixed top-0 left-0 right-0 bg-white border-b border-neutral-300 shadow-sm z-50 flex flex-col md:flex-row md:items-center justify-between gap-2 px-4 py-2.5"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 bg-neutral-100 text-neutral-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3Zm2 1h8v1.5H4V4Zm8 3H4v1.5h8V7Zm-8 3h8v1.5H4V10Z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">Blank Templates</h4>
            <p className="text-[11px] text-slate-500">Weights are divided evenly (using fractions for decimals)</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-1.5">
          {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((count) => {
            const hasDecimal = (100 % count) !== 0;
            const displayLabel = hasDecimal ? `1/${count}` : `${100 / count}%`;
            return (
              <button
                key={count}
                type="button"
                onClick={() => handleSelectBlankTemplate(count)}
                className="group px-2.5 py-1 text-xs font-semibold border border-neutral-300 text-slate-700 bg-white hover:bg-neutral-800 hover:text-white hover:border-neutral-800 transition-all duration-150 cursor-pointer flex flex-col items-center min-w-[68px]"
              >
                <span>{count} Comps</span>
                <span className="text-[9px] text-slate-400 group-hover:text-neutral-300 font-normal">{displayLabel} each</span>
              </button>
            );
          })}
        </div>

        <div className="hidden md:block w-px self-stretch bg-neutral-300 mx-1" aria-hidden="true" />

        <PercentChangeCalculator compact />
      </div>

      {/* Toolbar above card */}
      <div className="flex flex-col items-center w-full">
        <div className="w-fit mx-auto flex flex-col items-stretch mt-16">
          {/* Tool toggle | Copy | Save — centered to card */}
          <div
            className="mb-3 w-full flex flex-wrap items-center justify-center gap-1.5 px-1"
            data-exclude-export
          >
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 transition-all duration-150 cursor-pointer border ${
                canUndo
                  ? "bg-white text-slate-700 border-neutral-300 hover:bg-neutral-800 hover:text-white hover:border-neutral-800"
                  : "bg-slate-50 text-slate-300 border-neutral-200 cursor-not-allowed"
              }`}
              title="Undo last change (Ctrl+Z)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path fillRule="evenodd" d="M12.5 9.75A2.75 2.75 0 0 0 9.75 7H4.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L4.56 5.5h5.19a4.25 4.25 0 0 1 4.25 4.25v1.5a.75.75 0 0 1-1.5 0v-1.5Z" clipRule="evenodd" />
              </svg>
              Undo
            </button>

            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 transition-all duration-150 cursor-pointer border ${
                canRedo
                  ? "bg-white text-slate-700 border-neutral-300 hover:bg-neutral-800 hover:text-white hover:border-neutral-800"
                  : "bg-slate-50 text-slate-300 border-neutral-200 cursor-not-allowed"
              }`}
              title="Redo last change (Ctrl+Y)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path fillRule="evenodd" d="M3.5 9.75A2.75 2.75 0 0 1 6.25 7h5.19l-2.22 2.22a.75.75 0 1 0 1.06 1.06l3.5-3.5a.75.75 0 0 0 0-1.06l-3.5-3.5a.75.75 0 1 0-1.06 1.06l2.22 2.22H6.25A4.25 4.25 0 0 0 2 9.75v1.5a.75.75 0 0 0 1.5 0v-1.5Z" clipRule="evenodd" />
              </svg>
              Redo
            </button>

            <button
              type="button"
              tabIndex={copyTabIndex}
              onClick={handleCopy}
              disabled={copyStatus === "copying"}
              title={copyDetail || undefined}
              className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 transition-all duration-150 cursor-pointer border ${
                copyStatus === "done"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : copyStatus === "error"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-slate-700 border-neutral-300 hover:bg-neutral-800 hover:text-white hover:border-neutral-800"
              }`}
            >
              {copyStatus === "copying" ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Copying...
                </>
              ) : copyStatus === "done" ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  </svg>
                  Copied!
                </>
              ) : copyStatus === "error" ? (
                <span className="max-w-[10rem] truncate">{copyDetail ? "Failed — see below" : "Failed"}</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M5.5 3.5A1.5 1.5 0 0 1 7 2h5.5a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 12.5 12H7a1.5 1.5 0 0 1-1.5-1.5v-7Z" />
                    <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4H5v6.5A2.5 2.5 0 0 0 7.5 13H11v.5A1.5 1.5 0 0 1 9.5 15H4a2 2 0 0 1-2-2V7a1.5 1.5 0 0 1 1-1.415V5.5Z" />
                  </svg>
                  Copy
                </>
              )}
            </button>

            <div className="relative" ref={saveMenuRef}>
              <div
                className={`flex items-stretch overflow-hidden transition-all duration-150 ${
                  saveStatus === "done"
                    ? "bg-emerald-600 text-white border border-emerald-600"
                    : saveStatus === "error"
                    ? "bg-red-600 text-white border border-red-600"
                    : "bg-neutral-800 text-white border border-neutral-800 hover:bg-neutral-700"
                }`}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={handleSave}
                  disabled={saveStatus === "saving"}
                  title={saveDetail || saveInfo || undefined}
                  className="flex items-center gap-1 text-xs font-semibold pl-3 pr-2.5 py-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {saveStatus === "saving" ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </>
                  ) : saveStatus === "done" ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                        <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                      </svg>
                      Saved!
                    </>
                  ) : saveStatus === "error" ? (
                    <span className="max-w-[10rem] truncate">{saveDetail ? "Failed — see below" : "Failed"}</span>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
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
                  className="px-2 border-l border-white/25 hover:bg-white/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {isSaveMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.25rem)] min-w-48 border border-neutral-300 bg-white px-3 py-2 shadow-sm z-20">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      tabIndex={-1}
                      checked={rememberLocation}
                      onChange={(e) => toggleRemember(e.target.checked)}
                      className="border-slate-400 text-neutral-800 focus:ring-slate-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    Remember directory
                  </label>
                </div>
              )}
            </div>

            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 transition-all duration-150 cursor-pointer bg-white text-slate-700 border border-neutral-300 hover:bg-neutral-800 hover:text-white hover:border-neutral-800"
              title="Clear table data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
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

          <div className="flex w-full flex-col items-center gap-10">
            <section className="flex w-full flex-col items-center">
              <div className="mx-auto w-fit border border-neutral-300 bg-white shadow-sm">
                {/* Exportable area */}
                <div className="bg-white px-4 py-3 flex flex-col gap-2">
                  {state.showTitle && (
                    <input
                      type="text"
                      value={state.title}
                      onChange={(e) => setTitle(e.target.value)}
                      tabIndex={-1}
                      className="block w-full text-center text-lg font-bold leading-tight text-slate-800 bg-transparent outline-none focus:ring-1 focus:ring-slate-400 px-2 py-1 border-0 placeholder:text-slate-300"
                      spellCheck={false}
                      placeholder="Enter title..."
                    />
                  )}

                  <SpreadsheetGrid
                    gridExportRef={weightedAverageChartRef}
                    comps={state.comps}
                    decimals={state.decimals}
                    layout={state.layout}
                    weightDisplayFormat={state.weightDisplayFormat}
                    onUpdateComp={updateComp}
                    onAddComp={addComp}
                    onRemoveComp={removeComp}
                    onWeightDisplayFormatChange={setWeightDisplayFormat}
                  />
                </div>
              </div>

              <div className="mt-3 w-full max-w-4xl" data-exclude-export>
                <OptionsDrawer
                  decimals={state.decimals}
                  layout={state.layout}
                  showTitle={state.showTitle}
                  weightDisplayFormat={state.weightDisplayFormat}
                  onDecimalsChange={setDecimals}
                  onLayoutChange={setLayout}
                  onShowTitleChange={setShowTitle}
                  onWeightDisplayFormatChange={setWeightDisplayFormat}
                  templates={templates}
                  onSaveTemplate={saveTemplate}
                  onLoadTemplate={handleLoadTemplate}
                  onDeleteTemplate={deleteTemplate}
                  currentState={state}
                />
              </div>

              <HistoryPanel history={history} onLoad={handleLoadHistory} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
