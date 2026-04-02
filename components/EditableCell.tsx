"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  parseNumericInput,
  formatCurrencyLive,
  formatPercentLive,
  formatIntegerLive,
} from "@/lib/formatting";

type CellType = "currency" | "percent" | "integer";

interface EditableCellProps {
  value: number;
  formatted: string;
  onChange: (value: number) => void;
  type: CellType;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
  /** Keyboard tab order; use -1 to skip in tab sequence (default). */
  tabIndex?: number;
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
  tabIndex = -1,
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

  const formatLive =
    type === "currency"
      ? formatCurrencyLive
      : type === "percent"
        ? formatPercentLive
        : formatIntegerLive;

  const startEditing = useCallback(() => {
    if (value === 0) {
      setDraft("");
    } else if (type === "integer") {
      setDraft(formatIntegerLive(String(Math.round(value))));
    } else {
      setDraft(formatLive(String(value)));
    }
    setEditing(true);
  }, [value, formatLive, type]);

  const commit = useCallback(() => {
    const parsed = parseNumericInput(draft);
    onChange(type === "integer" ? Math.round(parsed) : parsed);
    setEditing(false);
  }, [draft, onChange, type]);

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

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        size={1}
        tabIndex={tabIndex}
        value={draft}
        onChange={handleChange}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full outline-none tabular-nums font-medium px-3 py-2.5 ${textAlign} bg-accent-50/60 ring-2 ring-accent-400/50 rounded-sm ${className}`}
      />
    );
  }

  return (
    <div
      onClick={startEditing}
      onFocus={startEditing}
      tabIndex={tabIndex}
      role="textbox"
      className={`outline-none focus-visible:ring-2 focus-visible:ring-accent-400/50 focus-visible:ring-inset rounded-sm tabular-nums font-medium px-3 py-2.5 cursor-text ${textAlign} ${
        isEmpty ? "text-slate-400 italic" : "text-slate-800"
      } ${className}`}
    >
      {isEmpty ? placeholder : formatted}
    </div>
  );
}
