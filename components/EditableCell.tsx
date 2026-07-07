"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  parseNumericInput,
  formatCurrencyLive,
  formatPercentLive,
  formatIntegerLive,
  isNumericWeightDraft,
} from "@/lib/formatting";

type CellType = "currency" | "percent" | "integer";

interface EditableCellProps {
  value: number | string;
  formatted: string;
  onChange: (value: number | string) => void;
  type: CellType;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
  /** Keyboard tab order; use -1 to skip in tab sequence (default). */
  tabIndex?: number;
  /** Whether the editable control should stretch to fill its container. */
  fullWidth?: boolean;
  /** Called when a percent cell is committed, reporting whether the user typed a fraction or decimal. */
  onFormatChange?: (format: "decimal" | "fraction") => void;
  /** Allow committing free-text (non-numeric) input as-is, e.g. a "Listing" label in a weight cell. */
  allowText?: boolean;
}

function countDigitsBefore(str: string, pos: number): number {
  let count = 0;
  for (let i = 0; i < pos && i < str.length; i++) {
    if (/[0-9./]/.test(str[i])) count++;
  }
  return count;
}

function cursorPosForDigitCount(str: string, digitCount: number): number {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (/[0-9./]/.test(str[i])) count++;
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
  fullWidth = true,
  onFormatChange,
  allowText = false,
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
    if (typeof value === "string") {
      setDraft(value);
    } else if (value === 0) {
      setDraft("");
    } else if (type === "integer") {
      setDraft(formatIntegerLive(String(Math.round(value))));
    } else {
      setDraft(formatLive(formatted));
    }
    setEditing(true);
  }, [value, formatted, formatLive, type]);

  const commit = useCallback(() => {
    if (allowText && draft.trim() !== "" && !isNumericWeightDraft(draft)) {
      onChange(draft.trim());
      setEditing(false);
      return;
    }
    const parsed = parseNumericInput(draft);
    if (onFormatChange && type === "percent") {
      onFormatChange(draft.includes("/") ? "fraction" : "decimal");
    }
    onChange(type === "integer" ? Math.round(parsed) : parsed);
    setEditing(false);
  }, [draft, onChange, type, onFormatChange, allowText]);

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
      if (allowText && !isNumericWeightDraft(raw)) {
        setDraft(raw);
        return;
      }
      const caretPos = e.target.selectionStart ?? raw.length;
      const digitsBefore = countDigitsBefore(raw, caretPos);
      const newFormatted = formatLive(raw);
      const newCaret = cursorPosForDigitCount(newFormatted, digitsBefore);
      cursorRef.current = newCaret;
      setDraft(newFormatted);
    },
    [formatLive, allowText]
  );

  const textAlign = align === "right" ? "text-right" : "text-left";
  const isEmpty = value === 0 || value === "";
  const widthClass = fullWidth ? "w-full" : "w-auto";

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
        className={`${widthClass} outline-none tabular-nums font-medium px-2 py-1.5 ${textAlign} bg-blue-50 ring-1 ring-slate-400 ${className}`}
      />
    );
  }

  return (
    <div
      onClick={startEditing}
      onFocus={startEditing}
      tabIndex={tabIndex}
      role="textbox"
      className={`${widthClass} outline-none focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:ring-inset tabular-nums font-medium px-2 py-1.5 cursor-text ${textAlign} ${
        isEmpty ? "text-slate-400 italic" : "text-slate-800"
      } ${className}`}
    >
      {isEmpty ? placeholder : formatted}
    </div>
  );
}
