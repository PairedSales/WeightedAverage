import type { DecimalPrecision, WeightDisplayFormat } from "./types";

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

export function formatInteger(value: number): string {
  if (!isFinite(value)) return "—";
  return Math.round(value).toLocaleString("en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

/** Live-format integer input with grouping; digits only while typing. */
export function formatIntegerLive(raw: string): string {
  const stripped = raw.replace(/[^0-9]/g, "");
  if (stripped === "") return "";
  const n = stripped.length > 12 ? stripped.slice(0, 12) : stripped;
  return Number(n).toLocaleString("en-US");
}

/** Strip $, commas, % and parse as float. Returns 0 for unparseable input.
 *  Supports fraction notation: "1/6" is interpreted as (1/6)*100 ≈ 16.667. */
export function parseNumericInput(raw: string): number {
  const cleaned = raw.replace(/[$,%\s,]/g, "");
  if (cleaned.includes("/")) {
    const slashIdx = cleaned.indexOf("/");
    const num = parseFloat(cleaned.slice(0, slashIdx));
    const den = parseFloat(cleaned.slice(slashIdx + 1));
    if (isFinite(num) && isFinite(den) && den !== 0) {
      return (num / den) * 100;
    }
    return 0;
  }
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
 * Live-format a partially-typed percent string, preserving trailing decimals
 * so the user can keep typing (e.g. "16." stays as "16.%", not "16%").
 * Also supports fraction notation: if the input contains "/" it is treated as
 * a fraction (e.g. "1/6" → "1/6%").
 */
export function formatPercentLive(raw: string): string {
  // Fraction mode: user has typed a "/"
  if (raw.includes("/")) {
    const stripped = raw.replace(/[^0-9/]/g, "");
    if (stripped === "" || stripped === "/") return "%";
    return `${stripped}%`;
  }

  // Decimal mode (existing behaviour)
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

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * Format a weight percentage as a simplified fraction (e.g. 16.67 → "1/6%").
 * Falls back to decimal format when the value does not closely match a simple
 * fraction with denominator ≤ 20.
 */
export function formatPercentFraction(
  value: number,
  fallbackDecimals: DecimalPrecision = 0
): string {
  if (!isFinite(value) || value <= 0) return formatPercent(value, fallbackDecimals);

  const decimal = value / 100;
  const MAX_DENOM = 20;
  const TOLERANCE = 0.001;

  let bestN = 0, bestD = 1, bestErr = Infinity;
  for (let d = 1; d <= MAX_DENOM; d++) {
    const n = Math.round(decimal * d);
    if (n <= 0) continue;
    const err = Math.abs(n / d - decimal);
    if (err < bestErr) {
      bestErr = err;
      bestN = n;
      bestD = d;
    }
  }

  if (bestErr > TOLERANCE) return formatPercent(value, fallbackDecimals);

  const g = gcd(bestN, bestD);
  const simplN = bestN / g;
  const simplD = bestD / g;

  if (simplD === 1) return formatPercent(value, fallbackDecimals);

  return `${simplN}/${simplD}%`;
}

/**
 * Format a weight percentage using the chosen display format.
 */
export function formatWeight(
  value: number,
  decimals: DecimalPrecision,
  format: WeightDisplayFormat
): string {
  return format === "fraction"
    ? formatPercentFraction(value, decimals)
    : formatPercent(value, decimals);
}
