"use client";

import { useMemo, useState } from "react";
import { parseNumericInput } from "@/lib/formatting";

function formatSignedPercent(value: number): string {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 1 : 2;
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });

  if (value > 0) return `+${formatted}%`;
  if (value < 0) return `-${formatted}%`;
  return "0%";
}

interface PercentChangeCalculatorProps {
  compact?: boolean;
}

export default function PercentChangeCalculator({ compact = false }: PercentChangeCalculatorProps) {
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");

  const formatNumberInput = (raw: string): string => {
    const cleaned = raw.replace(/[^0-9.-]/g, "");
    if (!cleaned) return "";

    const isNegative = cleaned.startsWith("-");
    const unsigned = isNegative ? cleaned.slice(1) : cleaned;
    const [intPartRaw, decPartRaw] = unsigned.split(".");
    const intDigits = intPartRaw.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
    const intFormatted = intDigits ? Number(intDigits).toLocaleString("en-US") : "0";

    if (unsigned.includes(".")) {
      return `${isNegative ? "-" : ""}${intFormatted}.${(decPartRaw ?? "").replace(/[^0-9]/g, "")}`;
    }
    return `${isNegative ? "-" : ""}${intFormatted}`;
  };

  const parsedFrom = useMemo(() => parseNumericInput(fromValue), [fromValue]);
  const parsedTo = useMemo(() => parseNumericInput(toValue), [toValue]);

  const isFromValid = Number.isFinite(parsedFrom);
  const isToValid = Number.isFinite(parsedTo);
  const canCalculate = isFromValid && isToValid && Math.abs(parsedFrom) > 0;

  const percentChange = canCalculate ? ((parsedTo - parsedFrom) / Math.abs(parsedFrom)) * 100 : null;

  let resultText = compact ? "—" : "Enter starting and ending values.";
  let resultClass = "text-slate-600";

  if (isFromValid && Math.abs(parsedFrom) === 0) {
    resultText = compact ? "Start ≠ 0" : "Starting value must be non-zero.";
    resultClass = "text-amber-700";
  } else if (canCalculate && percentChange !== null) {
    resultText = formatSignedPercent(percentChange);
    resultClass = percentChange >= 0 ? "text-emerald-700" : "text-rose-700";
  }

  if (compact) {
    return (
      <div className="flex items-end gap-1.5" data-exclude-export data-native-undo>
        <label className="text-[10px] text-slate-600 font-medium">
          Start
          <input
            type="text"
            value={fromValue}
            onChange={(e) => setFromValue(formatNumberInput(e.target.value))}
            placeholder="250000"
            className="mt-0.5 block w-20 border border-neutral-300 px-1.5 py-1 text-xs focus:border-slate-500 focus:outline-none"
          />
        </label>

        <label className="text-[10px] text-slate-600 font-medium">
          End
          <input
            type="text"
            value={toValue}
            onChange={(e) => setToValue(formatNumberInput(e.target.value))}
            placeholder="275000"
            className="mt-0.5 block w-20 border border-neutral-300 px-1.5 py-1 text-xs focus:border-slate-500 focus:outline-none"
          />
        </label>

        <div className="min-w-20 border border-neutral-300 bg-slate-50 px-2 py-1">
          <div className="text-[9px] uppercase tracking-wide text-slate-500 font-semibold">% Change</div>
          <div className={`text-xs font-bold ${resultClass}`}>{resultText}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mt-3 w-fit max-w-full self-center border border-neutral-300 bg-white p-0"
      data-exclude-export
      data-native-undo
    >
      <div className="appraisal-section-header">% Change Calculator</div>
      <div className="px-3 py-3">
        <p className="text-xs text-slate-500 mb-3">Quickly compute percent increase/decrease between two values.</p>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-slate-700 font-medium">
            Starting value
            <input
              type="text"
              value={fromValue}
              onChange={(e) => setFromValue(formatNumberInput(e.target.value))}
              placeholder="e.g., 250000"
              className="mt-1 block w-32 border border-neutral-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>

          <label className="text-xs text-slate-700 font-medium">
            Ending value
            <input
              type="text"
              value={toValue}
              onChange={(e) => setToValue(formatNumberInput(e.target.value))}
              placeholder="e.g., 275000"
              className="mt-1 block w-32 border border-neutral-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>

          <div className="min-w-36 border border-neutral-300 bg-slate-50 px-3 py-1.5">
            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Result</div>
            <div className={`text-sm font-bold ${resultClass}`}>{resultText}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
