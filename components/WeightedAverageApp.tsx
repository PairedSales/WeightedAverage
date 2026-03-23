"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { AppState, CompSale, DecimalPrecision, LayoutMode, Template } from "@/lib/types";
import { copyGridAsImage } from "@/lib/exportImage";
import { useAutoSave, loadSavedState } from "@/hooks/useAutoSave";
import { useTemplates } from "@/hooks/useTemplates";
import SpreadsheetGrid from "./SpreadsheetGrid";
import OptionsDrawer from "./OptionsDrawer";

function createComp(index: number): CompSale {
  return {
    id: crypto.randomUUID(),
    label: `Comp ${index}`,
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
  const [state, setState] = useState<AppState | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "done" | "error">("idle");
  const gridRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadSavedState();
    setState(saved ?? defaultState());
  }, []);

  // Autosave (only when state is loaded)
  useAutoSave(state ?? defaultState());

  const { templates, saveTemplate, deleteTemplate, getTemplate } = useTemplates();

  const updateComp = useCallback(
    (id: string, field: "salePrice" | "weight", value: number) => {
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comps: prev.comps.map((c) =>
            c.id === id ? { ...c, [field]: value } : c
          ),
        };
      });
    },
    []
  );

  const addComp = useCallback(() => {
    setState((prev) => {
      if (!prev || prev.comps.length >= 12) return prev;
      return {
        ...prev,
        comps: [...prev.comps, createComp(prev.comps.length + 1)],
      };
    });
  }, []);

  const removeComp = useCallback((id: string) => {
    setState((prev) => {
      if (!prev || prev.comps.length <= 3) return prev;
      const filtered = prev.comps.filter((c) => c.id !== id);
      const relabeled = filtered.map((c, i) => ({
        ...c,
        label: `Comp ${i + 1}`,
      }));
      return { ...prev, comps: relabeled };
    });
  }, []);

  const setDecimals = useCallback((d: DecimalPrecision) => {
    setState((prev) => (prev ? { ...prev, decimals: d } : prev));
  }, []);

  const setLayout = useCallback((l: LayoutMode) => {
    setState((prev) => (prev ? { ...prev, layout: l } : prev));
  }, []);

  const setTitle = useCallback((title: string) => {
    setState((prev) => (prev ? { ...prev, title } : prev));
  }, []);

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
    [getTemplate]
  );

  const handleCopy = useCallback(async () => {
    if (!gridRef.current) return;
    setCopyStatus("copying");
    // Blur any active input so the formatted value shows
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Small delay to let the blur commit
    await new Promise((r) => setTimeout(r, 100));

    const success = await copyGridAsImage(gridRef.current);
    setCopyStatus(success ? "done" : "error");
    setTimeout(() => setCopyStatus("idle"), 2000);
  }, []);

  // Don't render until hydrated to avoid SSR mismatch
  if (!state) {
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
      <div className="flex items-center justify-end gap-2 mb-3">
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
        <OptionsDrawer
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

      {/* The exportable grid area */}
      <div
        ref={gridRef}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
      >
        {/* Editable title — styled input that looks like a heading */}
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
    </div>
  );
}
