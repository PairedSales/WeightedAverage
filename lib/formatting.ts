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

/**
 * Live-format a partially-typed currency string, preserving trailing decimals
 * so the user can keep typing (e.g. "$350." stays as "$350.", not "$350").
 */
export function formatCurrencyLive(raw: string): string {
  const stripped = raw.replace(/[^0-9.]/g, "");
  if (stripped === "" || stripped === ".") return raw === "" ? "" : "$";

  const dotIndex = stripped.indexOf(".");
  const hasTrailingDot = stripped.endsWith(".");
  const intPart =
    dotIndex >= 0 ? stripped.slice(0, dotIndex) : stripped;
  const decPart = dotIndex >= 0 ? stripped.slice(dotIndex + 1) : "";

  const intFormatted =
    intPart === "" ? "0" : Number(intPart).toLocaleString("en-US");

  if (dotIndex >= 0) {
    return `$${intFormatted}.${decPart}`;
  }
  if (hasTrailingDot) {
    return `$${intFormatted}.`;
  }
  return `$${intFormatted}`;
}

/**
 * Live-format a partially-typed percent string, preserving trailing decimals.
 */
export function formatPercentLive(raw: string): string {
  const stripped = raw.replace(/[^0-9.]/g, "");
  if (stripped === "" || stripped === ".") return raw === "" ? "" : "%";

  const dotIndex = stripped.indexOf(".");
  const hasTrailingDot = stripped.endsWith(".");
  const intPart =
    dotIndex >= 0 ? stripped.slice(0, dotIndex) : stripped;
  const decPart = dotIndex >= 0 ? stripped.slice(dotIndex + 1) : "";

  const intFormatted =
    intPart === "" ? "0" : Number(intPart).toLocaleString("en-US");

  if (dotIndex >= 0) {
    return `${intFormatted}.${decPart}%`;
  }
  if (hasTrailingDot) {
    return `${intFormatted}.%`;
  }
  return `${intFormatted}%`;
}
