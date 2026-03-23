import type { DecimalPrecision } from "./types";

export function formatCurrency(
  value: number,
  decimals: DecimalPrecision
): string {
  if (!isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(
  value: number,
  decimals: DecimalPrecision
): string {
  return (
    value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + "%"
  );
}

/** Strip $, commas, % and parse as float. Returns 0 for unparseable input. */
export function parseNumericInput(raw: string): number {
  const cleaned = raw.replace(/[$,%\s]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
