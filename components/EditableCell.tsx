"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  parseNumericInput,
  formatCurrencyLive,
  formatPercentLive,
} from "@/lib/formatting";

type CellType = "currency" | "percent";

interface EditableCellProps {
  value: number;
  formatted: string;
  onChange: (value: number) => void;
  type: CellType;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
}

function countDigitsBefore(str: string, pos: number): number {
  let count = 0;
  for (let i = 0; i < pos && i < str.length; i++) {
    if (/[0-9.]/.test(str[i])) count++;
  }
  return count;
}

function cursorPosForDigitCount(str: string, digitCount: number): number {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (/[0-9.]/.test(str[i])) count++;
    if (count === digitCount) return i + 1;
  }
  return str.length;
}

export default function EditableCell({
  value,
  formatted,
  onChange,
  type,
  placeholder = "0",
  className = "",
  align = "right",
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number | null>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (cursorRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(
        cursorRef.current,
        cursorRef.current
      );
      cursorRef.current = null;
    }
  });

  const formatLive = type === "currency" ? formatCurrencyLive : formatPercentLive;

  const startEditing = useCallback(() => {
    if (value === 0) {
      setDraft("");
    } else {
      setDraft(formatLive(String(value)));
    }
    setEditing(true);
  }, [value, formatLive]);

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

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const caretPos = e.target.selectionStart ?? raw.length;
      const digitsBefore = countDigitsBefore(raw, caretPos);
      const newFormatted = formatLive(raw);
      const newCaret = cursorPosForDigitCount(newFormatted, digitsBefore);
      cursorRef.current = newCaret;
      setDraft(newFormatted);
    },
    [formatLive]
  );

  const textAlign = align === "right" ? "text-right" : "text-left";
  const isEmpty = value === 0;

  const displayValue = editing
    ? draft
    : isEmpty
    ? ""
    : formatted;

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      readOnly={!editing}
      value={displayValue}
      onClick={() => !editing && startEditing()}
      onFocus={() => !editing && startEditing()}
      onChange={handleChange}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`w-full outline-none tabular-nums font-medium px-3 py-2.5 ${textAlign} ${
        editing
          ? "bg-accent-50/60 ring-2 ring-accent-400/50 rounded-sm"
          : isEmpty
          ? "bg-transparent text-slate-400 italic cursor-text"
          : "bg-transparent text-slate-800 cursor-text"
      } ${className}`}
    />
  );
}
