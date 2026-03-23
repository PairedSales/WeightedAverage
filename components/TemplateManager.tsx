"use client";

import { useState } from "react";
import type { AppState, Template } from "@/lib/types";

interface TemplateManagerProps {
  templates: Template[];
  onSave: (name: string, state: AppState) => void;
  onLoad: (template: Template) => void;
  onDelete: (id: string) => void;
  currentState: AppState;
}

export default function TemplateManager({
  templates,
  onSave,
  onLoad,
  onDelete,
  currentState,
}: TemplateManagerProps) {
  const [saveName, setSaveName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
    onSave(name, currentState);
    setSaveName("");
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
        Templates
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Template name..."
          className="flex-1 min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-300 transition-colors placeholder:text-slate-400"
        />
        <button
          onClick={handleSave}
          disabled={!saveName.trim()}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Save
        </button>
      </div>

      {templates.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-1">No saved templates</p>
      ) : (
        <ul className="space-y-1 max-h-48 overflow-y-auto">
          {templates.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-2 text-sm px-2.5 py-2 rounded-lg hover:bg-slate-50 group transition-colors"
            >
              <button
                onClick={() => onLoad(t)}
                className="flex-1 text-left text-slate-700 truncate hover:text-blue-600 transition-colors cursor-pointer"
                title={`Load "${t.name}"`}
              >
                {t.name}
              </button>
              <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                {new Date(t.createdAt).toLocaleDateString()}
              </span>
              {confirmDeleteId === t.id ? (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => {
                      onDelete(t.id);
                      setConfirmDeleteId(null);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all shrink-0 cursor-pointer"
                  title="Delete"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
