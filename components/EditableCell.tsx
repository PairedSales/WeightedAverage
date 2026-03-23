"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { parseNumericInput } from "@/lib/formatting";

interface EditableCellProps {
  value: number;
  formatted: string;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
}

export default function EditableCell({
  value,
  formatted,
  onChange,
  placeholder = "0",
  className = "",
  align = "right",
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEditing = useCallback(() => {
    setDraft(value === 0 ? "" : String(value));
    setEditing(true);
  }, [value]);

  const commit = useCallback(() => {
    const parsed = parseNumericInput(draft);
    onChange(parsed);
    setEditing(false);
  }, [draft, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        commit();
      } else if (e.key === "Escape") {
        setEditing(false);
      }
    },
    [commit]
  );

  const textAlign = align === "right" ? "text-right" : "text-left";

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={`w-full bg-white outline-none ring-2 ring-indigo-400 rounded-sm px-2 py-1.5 tabular-nums font-medium ${textAlign} ${className}`}
        placeholder={placeholder}
      />
    );
  }

  const isEmpty = value === 0;

  return (
    <span
      onClick={startEditing}
      onFocus={startEditing}
      tabIndex={0}
      className={`block w-full cursor-text px-2 py-1.5 tabular-nums font-medium select-none ${textAlign} ${
        isEmpty ? "text-slate-400 italic" : "text-slate-800"
      } ${className}`}
    >
      {isEmpty ? placeholder : formatted}
    </span>
  );
}
