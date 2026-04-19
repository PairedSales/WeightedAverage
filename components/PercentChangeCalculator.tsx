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

export default function PercentChangeCalculator() {
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

  let resultText = "Enter starting and ending values.";
  let resultClass = "text-slate-600";

  if (isFromValid && Math.abs(parsedFrom) === 0) {
    resultText = "Starting value must be non-zero.";
    resultClass = "text-amber-700";
  } else if (canCalculate && percentChange !== null) {
    resultText = formatSignedPercent(percentChange);
    resultClass = percentChange >= 0 ? "text-emerald-700" : "text-rose-700";
  }

  return (
    <div
      className="mt-3 w-fit max-w-full self-center rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm"
      data-exclude-export
    >
      <div>
        <h3 className="text-sm font-semibold text-slate-800">% Change Calculator</h3>
        <p className="text-xs text-slate-500">Quickly compute percent increase/decrease between two values.</p>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-xs text-slate-600">
          Starting value
          <input
            type="text"
            value={fromValue}
            onChange={(e) => setFromValue(formatNumberInput(e.target.value))}
            placeholder="e.g., 250000"
            className="mt-1 block w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-accent-500 focus:outline-none"
          />
        </label>

        <label className="text-xs text-slate-600">
          Ending value
          <input
            type="text"
            value={toValue}
            onChange={(e) => setToValue(formatNumberInput(e.target.value))}
            placeholder="e.g., 275000"
            className="mt-1 block w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-accent-500 focus:outline-none"
          />
        </label>

        <div className="min-w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Result</div>
          <div className={`text-sm font-semibold ${resultClass}`}>{resultText}</div>
        </div>
      </div>
    </div>
  );
}
