"use client";

import { useState, useRef, useEffect } from "react";
import type { AppState, DecimalPrecision, LayoutMode, Template } from "@/lib/types";
import TemplateManager from "./TemplateManager";

interface OptionsDrawerProps {
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
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`p-2 rounded-lg transition-colors ${
          open
            ? "bg-indigo-100 text-indigo-700"
            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        }`}
        title="Options"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path
            fillRule="evenodd"
            d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.982.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 space-y-5">
          {/* Decimals */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Decimal Places
            </p>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {([0, 1, 2] as DecimalPrecision[]).map((d) => (
                <button
                  key={d}
                  onClick={() => onDecimalsChange(d)}
                  className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
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
          <div>
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

          <hr className="border-slate-200" />

          <TemplateManager
            templates={templates}
            onSave={onSaveTemplate}
            onLoad={onLoadTemplate}
            onDelete={onDeleteTemplate}
            currentState={currentState}
          />
        </div>
      )}
    </div>
  );
}
