"use client";

import { useState, useCallback, useEffect } from "react";
import type { AppState, HistorySnapshot } from "@/lib/types";

const STORAGE_KEY = "wa-history";
const MAX_ENTRIES = 15;

function readHistory(): HistorySnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as HistorySnapshot[]) : [];
    // Drop legacy entries saved before snapshots carried an image.
    return parsed.filter((e) => typeof e.image === "string" && e.image.length > 0);
  } catch {
    return [];
  }
}

/**
 * Persists history, dropping the oldest entries if the serialized images blow the
 * localStorage quota. Returns what was actually stored so state stays in sync.
 */
function writeHistory(history: HistorySnapshot[]): HistorySnapshot[] {
  let entries = history;
  while (entries.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      return entries;
    } catch {
      entries = entries.slice(0, -1);
    }
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return entries;
}

export function useHistory() {
  const [history, setHistory] = useState<HistorySnapshot[]>([]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const addSnapshot = useCallback(
    (state: AppState, image: string) => {
      const entry: HistorySnapshot = {
        id: crypto.randomUUID(),
        state: structuredClone(state),
        image,
        createdAt: Date.now(),
      };
      setHistory((prev) => writeHistory([entry, ...prev].slice(0, MAX_ENTRIES)));
    },
    []
  );

  const getSnapshot = useCallback(
    (id: string): HistorySnapshot | undefined => history.find((h) => h.id === id),
    [history]
  );

  return { history, addSnapshot, getSnapshot };
}
