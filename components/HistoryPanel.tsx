"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HistorySnapshot } from "@/lib/types";

interface HistoryPanelProps {
  history: HistorySnapshot[];
  onLoad: (snapshot: HistorySnapshot) => void;
}

const HEIGHT_STORAGE_KEY = "wa-history-panel-height";
const DEFAULT_HEIGHT = 256;
const MIN_HEIGHT = 96;
const MAX_HEIGHT = 640;

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
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HEIGHT_STORAGE_KEY);
      const parsed = raw ? Number(raw) : NaN;
      if (isFinite(parsed)) {
        setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, parsed)));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current) return;
    const delta = e.clientY - dragRef.current.startY;
    const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragRef.current.startHeight + delta));
    setHeight(next);
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    document.body.style.overflow = "";
    document.body.style.userSelect = "";
    setHeight((h) => {
      try {
        localStorage.setItem(HEIGHT_STORAGE_KEY, String(h));
      } catch {
        /* ignore */
      }
      return h;
    });
  }, [handlePointerMove]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragRef.current = { startY: e.clientY, startHeight: height };
      document.body.style.overflow = "hidden";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [height, handlePointerMove, handlePointerUp]
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.overflow = "";
      document.body.style.userSelect = "";
    };
  }, [handlePointerMove, handlePointerUp]);

  if (entries.length === 0) return null;

  return (
    <div className="mt-4 mx-auto w-fit" data-exclude-export>
      <div className="appraisal-section-header text-center">History</div>
      <div
        className="overflow-y-auto bg-white p-3"
        style={{ height }}
      >
        <div className="flex flex-wrap justify-center gap-3">
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
      <div
        onPointerDown={handlePointerDown}
        className="flex h-2.5 cursor-row-resize items-center justify-center bg-neutral-50 hover:bg-neutral-100"
        title="Drag to resize"
      >
        <div className="h-0.5 w-8 rounded-full bg-neutral-300" />
      </div>
    </div>
  );
}
