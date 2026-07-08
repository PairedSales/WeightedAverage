"use client";

import type { HistorySnapshot } from "@/lib/types";

interface HistoryPanelProps {
  history: HistorySnapshot[];
  onLoad: (snapshot: HistorySnapshot) => void;
}

export default function HistoryPanel({ history, onLoad }: HistoryPanelProps) {
  const entries = history.filter((e) => typeof e.image === "string" && e.image.length > 0);
  if (entries.length === 0) return null;

  return (
    <div className="mt-4 w-full max-w-4xl" data-exclude-export>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            tabIndex={-1}
            onClick={() => onLoad(entry)}
            title="Load this snapshot"
            className="shrink-0 border border-neutral-300 bg-white p-0 transition-all duration-150 cursor-pointer hover:border-neutral-800 hover:shadow-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.image}
              alt="Copied grid snapshot"
              className="block h-28 w-auto max-w-none"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
