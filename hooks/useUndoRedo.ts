"use client";

import { useCallback, useRef, useState } from "react";

const MAX_HISTORY = 25;
/** Consecutive edits sharing a coalesce key inside this window collapse into one undo step. */
const COALESCE_MS = 800;

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface SetOptions {
  /**
   * Edits tagged with the same key in quick succession (e.g. per-keystroke title
   * typing) replace the present instead of pushing a new undo step, so one undo
   * reverts the whole burst rather than a single character.
   */
  coalesceKey?: string;
}

export function useUndoRedo<T>(initial: T) {
  const [history, setHistory] = useState<UndoRedoState<T>>({
    past: [],
    present: initial,
    future: [],
  });

  const lastCoalesce = useRef<{ key: string; at: number } | null>(null);

  const set = useCallback(
    (valueOrUpdater: T | ((prev: T) => T), options?: SetOptions) => {
      const key = options?.coalesceKey;
      const now = Date.now();
      const merge =
        key !== undefined &&
        lastCoalesce.current !== null &&
        lastCoalesce.current.key === key &&
        now - lastCoalesce.current.at < COALESCE_MS;

      lastCoalesce.current = key === undefined ? null : { key, at: now };

      setHistory((h) => {
        const next =
          typeof valueOrUpdater === "function"
            ? (valueOrUpdater as (prev: T) => T)(h.present)
            : valueOrUpdater;
        // Updaters signal "nothing to do" by returning the state they were given.
        if (next === h.present) return h;
        if (merge) {
          return { past: h.past, present: next, future: [] };
        }
        return {
          past: [...h.past, h.present].slice(-MAX_HISTORY),
          present: next,
          future: [],
        };
      });
    },
    []
  );

  /** Replace present without pushing to history (used for initial hydration) */
  const reset = useCallback((value: T) => {
    lastCoalesce.current = null;
    setHistory({ past: [], present: value, future: [] });
  }, []);

  const undo = useCallback(() => {
    lastCoalesce.current = null;
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const prev = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: prev,
        future: [h.present, ...h.future].slice(0, MAX_HISTORY),
      };
    });
  }, []);

  const redo = useCallback(() => {
    lastCoalesce.current = null;
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      return {
        past: [...h.past, h.present].slice(-MAX_HISTORY),
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
