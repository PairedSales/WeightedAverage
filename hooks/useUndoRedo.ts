"use client";

import { useCallback, useRef, useState } from "react";

const MAX_HISTORY = 50;

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useUndoRedo<T>(initial: T) {
  const [history, setHistory] = useState<UndoRedoState<T>>({
    past: [],
    present: initial,
    future: [],
  });

  // Track whether we've been initialized with real data
  const initialized = useRef(false);

  const set = useCallback((valueOrUpdater: T | ((prev: T) => T)) => {
    setHistory((h) => {
      const next =
        typeof valueOrUpdater === "function"
          ? (valueOrUpdater as (prev: T) => T)(h.present)
          : valueOrUpdater;
      if (next === h.present) return h;
      return {
        past: [...h.past, h.present].slice(-MAX_HISTORY),
        present: next,
        future: [],
      };
    });
  }, []);

  /** Replace present without pushing to history (used for initial hydration) */
  const reset = useCallback((value: T) => {
    setHistory({ past: [], present: value, future: [] });
    initialized.current = true;
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const prev = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: prev,
        future: [h.present, ...h.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      return {
        past: [...h.past, h.present],
        present: next,
        future: h.future.slice(1),
      };
    });
  }, []);

  return {
    state: history.present,
    set,
    reset,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
