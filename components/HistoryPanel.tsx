"use client";

import type { HistorySnapshot } from "@/lib/types";
import { sumWeights, weightedAverage } from "@/lib/calculations";
import { formatCurrency } from "@/lib/formatting";

interface HistoryPanelProps {
  history: HistorySnapshot[];
  onLoad: (snapshot: HistorySnapshot) => void;
}

export default function HistoryPanel({ history, onLoad }: HistoryPanelProps) {
  if (history.length === 0) return null;

  return (
    <div className="mt-3 w-full max-w-4xl border border-neutral-300 bg-white" data-exclude-export>
      <div className="appraisal-section-header">History</div>
      <div className="p-3">
        <p className="text-xs text-slate-500 mb-2">
          A snapshot is saved automatically each time you copy the grid. Click one to load it.
        </p>
        <ul className="max-h-40 overflow-y-auto divide-y divide-neutral-200 border border-neutral-200">
          {history.map((entry) => {
            const total = sumWeights(entry.state.comps);
            const avg = weightedAverage(entry.state.comps);
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => onLoad(entry)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Load this snapshot"
                >
                  <span className="text-slate-500 text-xs tabular-nums shrink-0">
                    {new Date(entry.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-slate-600 text-xs shrink-0">
                    {entry.state.comps.length} comps
                  </span>
                  <span className="font-semibold text-slate-800 tabular-nums ml-auto">
                    {total > 0 ? formatCurrency(avg, entry.state.decimals) : "—"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
