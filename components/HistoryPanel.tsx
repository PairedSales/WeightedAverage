"use client";

import type { HistorySnapshot } from "@/lib/types";

interface HistoryPanelProps {
  history: HistorySnapshot[];
  onLoad: (snapshot: HistorySnapshot) => void;
}

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

function formatTimestampParts(createdAt: number): { weekday: string; date: string; time: string } {
  const d = new Date(createdAt);
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  const month = d.toLocaleDateString("en-US", { month: "long" });
  const date = `${month} ${ordinal(d.getDate())}, ${d.getFullYear()}`;
  const time = d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s?(AM|PM)/i, (m) => m.trim().toLowerCase());
  return { weekday, date, time };
}

export default function HistoryPanel({ history, onLoad }: HistoryPanelProps) {
  const entries = history.filter((e) => typeof e.image === "string" && e.image.length > 0);
  if (entries.length === 0) return null;

  return (
    <div className="mt-4 w-full max-w-4xl" data-exclude-export>
      <div className="appraisal-section-header text-center">History</div>
      <div className="flex flex-wrap justify-center gap-3 border border-t-0 border-neutral-300 bg-white p-3">
        {entries.map((entry) => {
          const { weekday, date, time } = formatTimestampParts(entry.createdAt);
          return (
            <button
              key={entry.id}
              type="button"
              tabIndex={-1}
              onClick={() => onLoad(entry)}
              title="Load this snapshot"
              className="flex shrink-0 items-center gap-2 border border-neutral-300 bg-white p-2 transition-all duration-150 cursor-pointer hover:border-neutral-800 hover:shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.image}
                alt="Copied grid snapshot"
                className="block h-28 w-auto max-w-none"
              />
              <div className="flex flex-col text-left text-[10px] leading-tight text-slate-600">
                <span className="font-semibold text-slate-800">{weekday}</span>
                <span>{date}</span>
                <span>{time}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
