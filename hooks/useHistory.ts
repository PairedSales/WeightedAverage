"use client";

import { useState, useCallback, useEffect } from "react";
import type { AppState, HistorySnapshot } from "@/lib/types";

const STORAGE_KEY = "wa-history";
const MAX_ENTRIES = 15;

function readHistory(): HistorySnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistorySnapshot[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(history: HistorySnapshot[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function useHistory() {
  const [history, setHistory] = useState<HistorySnapshot[]>([]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const addSnapshot = useCallback(
    (state: AppState) => {
      const entry: HistorySnapshot = {
        id: crypto.randomUUID(),
        state: structuredClone(state),
        createdAt: Date.now(),
      };
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, MAX_ENTRIES);
        writeHistory(next);
        return next;
      });
    },
    []
  );

  const getSnapshot = useCallback(
    (id: string): HistorySnapshot | undefined => history.find((h) => h.id === id),
    [history]
  );

  return { history, addSnapshot, getSnapshot };
}
