"use client";

import { useState, useCallback, useEffect } from "react";
import type { AppState, Template } from "@/lib/types";

const STORAGE_KEY = "wa-templates";

function readTemplates(): Template[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Template[]) : [];
  } catch {
    return [];
  }
}

function writeTemplates(templates: Template[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    setTemplates(readTemplates());
  }, []);

  const saveTemplate = useCallback(
    (name: string, state: AppState) => {
      const entry: Template = {
        id: crypto.randomUUID(),
        name,
        state: structuredClone(state),
        createdAt: Date.now(),
      };
      const next = [...templates, entry];
      writeTemplates(next);
      setTemplates(next);
    },
    [templates]
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      const next = templates.filter((t) => t.id !== id);
      writeTemplates(next);
      setTemplates(next);
    },
    [templates]
  );

  const getTemplate = useCallback(
    (id: string): Template | undefined => templates.find((t) => t.id === id),
    [templates]
  );

  return { templates, saveTemplate, deleteTemplate, getTemplate };
}
