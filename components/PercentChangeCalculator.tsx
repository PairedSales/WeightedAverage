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
  let resultClass = "text-[color:var(--ui-ink-3)]";

  if (isFromValid && Math.abs(parsedFrom) === 0) {
    resultText = compact ? "Start ≠ 0" : "Starting value must be non-zero.";
    resultClass = "text-[color:var(--ui-warn)]";
  } else if (canCalculate && percentChange !== null) {
    resultText = formatSignedPercent(percentChange);
    resultClass = percentChange >= 0 ? "text-[color:var(--ui-pos)]" : "text-[color:var(--ui-neg)]";
  }

  if (compact) {
    return (
      <div className="flex items-end gap-1.5" data-exclude-export data-native-undo>
        <label className="ui-field-label">
          Start
          <input
            type="text"
            value={fromValue}
            onChange={(e) => setFromValue(formatNumberInput(e.target.value))}
            placeholder="250000"
            className="ui-input mt-0.5 block w-20 px-1.5 py-1 text-xs"
          />
        </label>

        <label className="ui-field-label">
          End
          <input
            type="text"
            value={toValue}
            onChange={(e) => setToValue(formatNumberInput(e.target.value))}
            placeholder="275000"
            className="ui-input mt-0.5 block w-20 px-1.5 py-1 text-xs"
          />
        </label>

        <div className="ui-readout min-w-20 px-2 py-1">
          <div className="ui-mini-label">% Change</div>
          <div className={`ui-readout-value text-xs font-bold ${resultClass}`}>{resultText}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="ui-panel mt-3 w-fit max-w-full self-center p-0"
      data-exclude-export
      data-native-undo
    >
      <div className="ui-section-header">% Change Calculator</div>
      <div className="px-3 py-3">
        <p className="ui-subtext mb-3">Quickly compute percent increase/decrease between two values.</p>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-[color:var(--ui-ink-2)] font-medium">
            Starting value
            <input
              type="text"
              value={fromValue}
              onChange={(e) => setFromValue(formatNumberInput(e.target.value))}
              placeholder="e.g., 250000"
              className="ui-input mt-1 block w-32 px-2 py-1.5 text-sm"
            />
          </label>

          <label className="text-xs text-[color:var(--ui-ink-2)] font-medium">
            Ending value
            <input
              type="text"
              value={toValue}
              onChange={(e) => setToValue(formatNumberInput(e.target.value))}
              placeholder="e.g., 275000"
              className="ui-input mt-1 block w-32 px-2 py-1.5 text-sm"
            />
          </label>

          <div className="ui-readout min-w-36 px-3 py-1.5">
            <div className="ui-mini-label">Result</div>
            <div className={`ui-readout-value text-sm font-bold ${resultClass}`}>{resultText}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
