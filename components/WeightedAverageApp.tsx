"use client";

import { useRef, useCallback, useEffect } from "react";
import type { AppState, CompSale, DecimalPrecision, LayoutMode, Template } from "@/lib/types";
import { copyGridAsImage } from "@/lib/exportImage";
import { saveGridAsImage, getRememberLocation, setRememberLocation } from "@/lib/saveImage";
import { useAutoSave, loadSavedState } from "@/hooks/useAutoSave";
import { useTemplates } from "@/hooks/useTemplates";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import SpreadsheetGrid from "./SpreadsheetGrid";
import OptionsDrawer from "./OptionsDrawer";
import { useState } from "react";

function createComp(index: number): CompSale {
  return {
    id: crypto.randomUUID(),
    label: `Sale ${index}`,
    salePrice: 0,
    weight: 0,
  };
}

function defaultState(): AppState {
  return {
    comps: [createComp(1), createComp(2), createComp(3)],
    decimals: 0,
    layout: "vertical",
    title: "Weighted Average Analysis",
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
  const [optionsOpen, setOptionsOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadSavedState();
    resetState(saved ?? defaultState());
    setRememberLocationState(getRememberLocation());
    setHydrated(true);
  }, [resetState]);

  // Autosave
  useAutoSave(state);

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") {
        // Don't hijack undo when user is typing in an input/textarea
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

  const { templates, saveTemplate, deleteTemplate, getTemplate } = useTemplates();

  const updateComp = useCallback(
    (id: string, field: "salePrice" | "weight", value: number) => {
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

  const handleLoadTemplate = useCallback(
    (template: Template) => {
      const t = getTemplate(template.id);
      if (t) {
        const loaded = structuredClone(t.state);
        loaded.comps = loaded.comps.map((c) => ({
          ...c,
          id: crypto.randomUUID(),
        }));
        setState(loaded);
      }
    },
    [getTemplate, setState]
  );

  const handleCopy = useCallback(async () => {
    if (!gridRef.current) return;
    setCopyStatus("copying");
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    await new Promise((r) => setTimeout(r, 100));

    const success = await copyGridAsImage(gridRef.current);
    setCopyStatus(success ? "done" : "error");
    setTimeout(() => setCopyStatus("idle"), 2000);
  }, []);

  const handleSave = useCallback(async () => {
    if (!gridRef.current) return;
    setSaveStatus("saving");
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    await new Promise((r) => setTimeout(r, 100));

    try {
      const result = await saveGridAsImage(gridRef.current, rememberLocation);
      if (result.success) {
        setSaveStatus("done");
        // Auto-enable "remember location" on first successful save
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
  }, [rememberLocation]);

  const toggleRemember = useCallback((checked: boolean) => {
    setRememberLocation(checked);
    setRememberLocationState(checked);
  }, []);

  if (!hydrated) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-12 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-64 mx-auto mb-6" />
        <div className="h-64 bg-slate-200 rounded" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-1.5 mb-3">
        {/* Undo / Redo */}
        <div className="flex items-center mr-auto">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
              <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 0 1-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 0 1 0 10.75H10.75a.75.75 0 0 1 0-1.5h2.875a3.875 3.875 0 0 0 0-7.75H3.622l4.146 3.957a.75.75 0 0 1-1.036 1.085l-5.5-5.25a.75.75 0 0 1 0-1.085l5.5-5.25a.75.75 0 0 1 1.06.025Z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
              <path fillRule="evenodd" d="M12.207 2.232a.75.75 0 0 0 .025 1.06l4.146 3.958H6.375a5.375 5.375 0 0 0 0 10.75H9.25a.75.75 0 0 0 0-1.5H6.375a3.875 3.875 0 0 1 0-7.75h10.003l-4.146 3.957a.75.75 0 0 0 1.036 1.085l5.5-5.25a.75.75 0 0 0 0-1.085l-5.5-5.25a.75.75 0 0 0-1.06.025Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Save Image */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg transition-all ${
              saveStatus === "done"
                ? "bg-emerald-600 text-white"
                : saveStatus === "error"
                ? "bg-red-600 text-white"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm"
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
              "Failed — try again"
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path d="M8.75 2.75a.75.75 0 0 0-1.5 0v5.69L5.03 6.22a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 0 0-1.06-1.06L8.75 8.44V2.75Z" />
                  <path d="M3.5 9.75a.75.75 0 0 0-1.5 0v1.5A2.75 2.75 0 0 0 4.75 14h6.5A2.75 2.75 0 0 0 14 11.25v-1.5a.75.75 0 0 0-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-1.5Z" />
                </svg>
                Save Image
              </>
            )}
          </button>
          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none" title="When checked, saves overwrite the same file without prompting">
            <input
              type="checkbox"
              checked={rememberLocation}
              onChange={(e) => toggleRemember(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            Remember location
          </label>
        </div>

        {/* Copy to Clipboard */}
        <button
          onClick={handleCopy}
          disabled={copyStatus === "copying"}
          className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg transition-all ${
            copyStatus === "done"
              ? "bg-emerald-600 text-white"
              : copyStatus === "error"
              ? "bg-red-600 text-white"
              : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm"
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
            "Failed — try again"
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path d="M5.5 3.5A1.5 1.5 0 0 1 7 2h5.5a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 12.5 12H7a1.5 1.5 0 0 1-1.5-1.5v-7Z" />
                <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4H5v6.5A2.5 2.5 0 0 0 7.5 13H11v.5A1.5 1.5 0 0 1 9.5 15H4a2 2 0 0 1-2-2V7a1.5 1.5 0 0 1 1-1.415V5.5Z" />
              </svg>
              Copy to Clipboard
            </>
          )}
        </button>
      </div>

      {/* The exportable grid area */}
      <div
        ref={gridRef}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
      >
        <input
          type="text"
          value={state.title}
          onChange={(e) => setTitle(e.target.value)}
          className="block w-full text-center text-lg font-bold text-slate-800 mb-4 bg-transparent outline-none focus:ring-2 focus:ring-indigo-300 rounded px-2 py-1 border-0"
          spellCheck={false}
        />

        <SpreadsheetGrid
          comps={state.comps}
          decimals={state.decimals}
          layout={state.layout}
          onUpdateComp={updateComp}
          onAddComp={addComp}
          onRemoveComp={removeComp}
        />
      </div>

      {/* Options panel — always below the grid, never in the exported image */}
      <div className="mt-3 space-y-2" data-exclude-export>
        <button
          onClick={() => setOptionsOpen((o) => !o)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            optionsOpen
              ? "bg-indigo-100 text-indigo-700"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          }`}
        >
          {/* Hamburger icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
          </svg>
          Options
        </button>

        <OptionsDrawer
          open={optionsOpen}
          decimals={state.decimals}
          layout={state.layout}
          onDecimalsChange={setDecimals}
          onLayoutChange={setLayout}
          templates={templates}
          onSaveTemplate={saveTemplate}
          onLoadTemplate={handleLoadTemplate}
          onDeleteTemplate={deleteTemplate}
          currentState={state}
        />
      </div>
    </div>
  );
}
