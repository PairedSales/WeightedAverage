"use client";

import html2canvas from "html2canvas";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "weighted-appraisal-v1";
const MIN_COMPS = 3;
const MAX_COMPS = 12;

type LayoutMode = "horizontal" | "vertical";
type DecimalPlaces = 0 | 1 | 2;

type PersistedState = {
  numComps: number;
  prices: (number | null)[];
  weights: number[];
  layout: LayoutMode;
  decimals: DecimalPlaces;
};

const defaultPersisted = (): PersistedState => ({
  numComps: 3,
  prices: [null, null, null],
  weights: [34, 33, 33],
  layout: "horizontal",
  decimals: 0,
});

const clampCompCount = (n: number) =>
  Math.min(MAX_COMPS, Math.max(MIN_COMPS, Math.round(n)));

const resizeArrays = (
  prev: PersistedState,
  nextCount: number,
): PersistedState => {
  const n = clampCompCount(nextCount);
  const prices = [...prev.prices];
  const weights = [...prev.weights];
  while (prices.length < n) {
    prices.push(null);
    weights.push(0);
  }
  if (prices.length > n) {
    prices.length = n;
    weights.length = n;
  }
  return { ...prev, numComps: n, prices, weights };
};

const loadState = (): PersistedState => {
  if (typeof window === "undefined") return defaultPersisted();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPersisted();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const numComps = clampCompCount(parsed.numComps ?? 3);
    let prices = Array.isArray(parsed.prices)
      ? parsed.prices.map((p) =>
          typeof p === "number" && Number.isFinite(p) ? p : null,
        )
      : [];
    let weights = Array.isArray(parsed.weights)
      ? parsed.weights.map((w) =>
          typeof w === "number" && Number.isFinite(w) ? w : 0,
        )
      : [];
    while (prices.length < numComps) {
      prices.push(null);
      weights.push(0);
    }
    prices = prices.slice(0, numComps);
    weights = weights.slice(0, numComps);
    const layout: LayoutMode =
      parsed.layout === "vertical" ? "vertical" : "horizontal";
    const d = parsed.decimals;
    const decimals: DecimalPlaces =
      d === 1 || d === 2 ? d : 0;
    return { numComps, prices, weights, layout, decimals };
  } catch {
    return defaultPersisted();
  }
};

const formatMoney = (value: number, decimals: DecimalPlaces): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

const formatPercent = (value: number, decimals: DecimalPlaces): string =>
  `${value.toFixed(decimals)}%`;

const weightHeatStyle = (weight: number, maxWeight: number): React.CSSProperties => {
  const denom = maxWeight > 0 ? maxWeight : 1;
  const t = Math.min(1, Math.max(0, weight / denom));
  const alpha = 0.12 + t * 0.55;
  const barAlpha = 0.25 + t * 0.75;
  return {
    background: `linear-gradient(90deg, rgb(37 99 235 / ${alpha}) 0%, rgb(59 130 246 / ${alpha * 0.65}) 100%)`,
    boxShadow: `inset 0 0 0 1px rgb(37 99 235 / ${0.15 + t * 0.35})`,
  };
};

export const WeightedAppraisalApp = () => {
  const [hydrated, setHydrated] = useState(false);
  const [numComps, setNumComps] = useState(3);
  const [prices, setPrices] = useState<(number | null)[]>([
    null,
    null,
    null,
  ]);
  const [weights, setWeights] = useState<number[]>([34, 33, 33]);
  const [layout, setLayout] = useState<LayoutMode>("horizontal");
  const [decimals, setDecimals] = useState<DecimalPlaces>(0);
  const [copyStatus, setCopyStatus] = useState<
    "idle" | "working" | "done" | "error"
  >("idle");
  const [copyResult, setCopyResult] = useState<"clipboard" | "file" | null>(
    null,
  );
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = loadState();
    setNumComps(s.numComps);
    setPrices(s.prices);
    setWeights(s.weights);
    setLayout(s.layout);
    setDecimals(s.decimals);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: PersistedState = {
      numComps,
      prices,
      weights,
      layout,
      decimals,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota / private mode */
    }
  }, [hydrated, numComps, prices, weights, layout, decimals]);

  const numericPrices = useMemo(
    () => prices.map((p) => (p == null || !Number.isFinite(p) ? 0 : p)),
    [prices],
  );

  const weightedLine = useMemo(
    () =>
      numericPrices.map((price, i) => price * ((weights[i] ?? 0) / 100)),
    [numericPrices, weights],
  );

  const totalWeighted = useMemo(
    () => weightedLine.reduce((a, b) => a + b, 0),
    [weightedLine],
  );

  const totalWeight = useMemo(
    () => weights.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0),
    [weights],
  );

  const maxWeight = useMemo(
    () => weights.reduce((m, w) => (w > m ? w : m), 0),
    [weights],
  );

  const weightBalanced = Math.abs(totalWeight - 100) < 0.001;

  const handleCompCount = (next: number) => {
    const s = resizeArrays(
      { numComps, prices, weights, layout, decimals },
      next,
    );
    setNumComps(s.numComps);
    setPrices(s.prices);
    setWeights(s.weights);
  };

  const handlePriceChange = (index: number, raw: string) => {
    const t = raw.trim();
    if (t === "") {
      setPrices((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      return;
    }
    const n = Number.parseFloat(t.replace(/,/g, ""));
    setPrices((prev) => {
      const next = [...prev];
      next[index] = Number.isFinite(n) ? n : null;
      return next;
    });
  };

  const handleWeightChange = (index: number, raw: string) => {
    const n = Number.parseFloat(raw);
    setWeights((prev) => {
      const next = [...prev];
      next[index] = Number.isFinite(n) ? n : 0;
      return next;
    });
  };

  const handleCopyImage = useCallback(async () => {
    const el = captureRef.current;
    if (!el) return;
    setCopyStatus("working");
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png");
      });
      if (!blob) throw new Error("toBlob failed");

      const canClipboard =
        typeof ClipboardItem !== "undefined" && navigator.clipboard?.write;
      if (canClipboard) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setCopyResult("clipboard");
          setCopyStatus("done");
          window.setTimeout(() => {
            setCopyStatus("idle");
            setCopyResult(null);
          }, 2000);
          return;
        } catch {
          /* fall through to download */
        }
      }

      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "weighted-average-comps.png";
      a.click();
      setCopyResult("file");
      setCopyStatus("done");
      window.setTimeout(() => {
        setCopyStatus("idle");
        setCopyResult(null);
      }, 2000);
    } catch {
      setCopyResult(null);
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus("idle"), 3000);
    }
  }, []);

  const inputClass =
    "w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 tabular-nums";

  const cellBorder = "border border-slate-200";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Weighted average
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Comparable adjusted sale prices and weights in one table. Values
            autosave in this browser.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopyImage}
          disabled={copyStatus === "working"}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {copyStatus === "working"
            ? "Copying…"
            : copyStatus === "done"
              ? copyResult === "file"
                ? "PNG downloaded"
                : "Copied to clipboard"
              : copyStatus === "error"
                ? "Could not capture image"
                : "Copy table as image"}
        </button>
      </header>

      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Number of comps</span>
          <select
            className={inputClass + " max-w-[12rem]"}
            value={numComps}
            onChange={(e) => handleCompCount(Number(e.target.value))}
          >
            {Array.from(
              { length: MAX_COMPS - MIN_COMPS + 1 },
              (_, i) => MIN_COMPS + i,
            ).map((n) => (
              <option key={n} value={n}>
                {n} comparables
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Decimals</span>
          <select
            className={inputClass + " max-w-[12rem]"}
            value={decimals}
            onChange={(e) =>
              setDecimals(Number(e.target.value) as DecimalPlaces)
            }
          >
            <option value={0}>0 (whole numbers)</option>
            <option value={1}>1 decimal</option>
            <option value={2}>2 decimals</option>
          </select>
        </label>

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="font-medium text-slate-700">Layout</legend>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="layout"
                checked={layout === "horizontal"}
                onChange={() => setLayout("horizontal")}
                className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700">Left–right (columns)</span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="layout"
                checked={layout === "vertical"}
                onChange={() => setLayout("vertical")}
                className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700">List (rows)</span>
            </label>
          </div>
        </fieldset>

        {!weightBalanced && (
          <p
            className="text-sm text-amber-800 sm:ml-auto sm:max-w-xs"
            role="status"
          >
            Weights sum to{" "}
            <span className="font-mono font-medium tabular-nums">
              {totalWeight.toFixed(decimals)}%
            </span>
            . Appraisal practice usually uses 100% total.
          </p>
        )}
      </div>

      <div
        ref={captureRef}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <h2 className="mb-4 text-center text-lg font-semibold text-slate-800">
          Weighted sale price analysis
        </h2>

        {layout === "horizontal" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className={`${cellBorder} bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700`}
                  />
                  {Array.from({ length: numComps }, (_, i) => (
                    <th
                      key={i}
                      scope="col"
                      className={`${cellBorder} bg-slate-50 px-3 py-2 text-center font-semibold text-slate-700`}
                    >
                      Comp {i + 1}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className={`${cellBorder} bg-slate-100 px-3 py-2 text-center font-semibold text-slate-800`}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th
                    scope="row"
                    className={`${cellBorder} bg-slate-50 px-3 py-2 text-left font-medium text-slate-700`}
                  >
                    Adjusted sale price
                  </th>
                  {Array.from({ length: numComps }, (_, i) => (
                    <td key={i} className={`${cellBorder} p-1`}>
                      <label className="sr-only" htmlFor={`price-${i}`}>
                        Comp {i + 1} adjusted sale price
                      </label>
                      <input
                        id={`price-${i}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        placeholder="0"
                        className={inputClass}
                        value={prices[i] ?? ""}
                        onChange={(e) => handlePriceChange(i, e.target.value)}
                      />
                    </td>
                  ))}
                  <td
                    className={`${cellBorder} bg-slate-50 px-3 py-2 text-center text-slate-400`}
                    aria-label="No total for prices"
                  >
                    —
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className={`${cellBorder} bg-slate-50 px-3 py-2 text-left font-medium text-slate-700`}
                  >
                    Weight
                  </th>
                  {Array.from({ length: numComps }, (_, i) => (
                    <td
                      key={i}
                      className={`${cellBorder} p-0`}
                      style={weightHeatStyle(weights[i] ?? 0, maxWeight)}
                    >
                      <div className="relative p-1">
                        <div
                          className="pointer-events-none absolute inset-y-1 left-1 rounded bg-blue-600/20 transition-all"
                          style={{
                            width: `${maxWeight > 0 ? Math.min(100, ((weights[i] ?? 0) / maxWeight) * 100) : 0}%`,
                            maxWidth: "calc(100% - 0.5rem)",
                          }}
                          aria-hidden
                        />
                        <label className="sr-only" htmlFor={`weight-${i}`}>
                          Comp {i + 1} weight percent
                        </label>
                        <div className="relative z-10 flex items-center gap-0.5 pr-1">
                          <input
                            id={`weight-${i}`}
                            type="number"
                            inputMode="decimal"
                            step="any"
                            className={`min-w-0 flex-1 ${inputClass} border-transparent bg-transparent shadow-none focus:bg-white/90`}
                            value={weights[i] ?? ""}
                            onChange={(e) =>
                              handleWeightChange(i, e.target.value)
                            }
                          />
                          <span
                            className="shrink-0 text-xs font-medium text-slate-600"
                            aria-hidden
                          >
                            %
                          </span>
                        </div>
                      </div>
                    </td>
                  ))}
                  <td
                    className={`${cellBorder} bg-slate-100 px-3 py-2 text-center font-medium tabular-nums ${
                      weightBalanced ? "text-slate-800" : "text-amber-800"
                    }`}
                  >
                    {formatPercent(totalWeight, decimals)}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className={`${cellBorder} bg-slate-50 px-3 py-2 text-left font-medium text-slate-700`}
                  >
                    Weighted price
                  </th>
                  {Array.from({ length: numComps }, (_, i) => (
                    <td
                      key={i}
                      className={`${cellBorder} bg-slate-50/80 px-3 py-2 text-center tabular-nums text-slate-800`}
                    >
                      {formatMoney(weightedLine[i] ?? 0, decimals)}
                    </td>
                  ))}
                  <td
                    className={`${cellBorder} bg-slate-100 px-3 py-2 text-center text-base font-bold tabular-nums text-slate-900`}
                  >
                    {formatMoney(totalWeighted, decimals)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className={`${cellBorder} bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700`}
                  >
                    Comp
                  </th>
                  <th
                    scope="col"
                    className={`${cellBorder} bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700`}
                  >
                    Adjusted sale price
                  </th>
                  <th
                    scope="col"
                    className={`${cellBorder} bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700`}
                  >
                    Weight
                  </th>
                  <th
                    scope="col"
                    className={`${cellBorder} bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700`}
                  >
                    Weighted price
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: numComps }, (_, i) => (
                  <tr key={i}>
                    <th
                      scope="row"
                      className={`${cellBorder} bg-slate-50 px-3 py-2 font-medium text-slate-700`}
                    >
                      Comp {i + 1}
                    </th>
                    <td className={`${cellBorder} p-1`}>
                      <label className="sr-only" htmlFor={`v-price-${i}`}>
                        Comp {i + 1} adjusted sale price
                      </label>
                      <input
                        id={`v-price-${i}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        placeholder="0"
                        className={inputClass}
                        value={prices[i] ?? ""}
                        onChange={(e) => handlePriceChange(i, e.target.value)}
                      />
                    </td>
                    <td
                      className={`${cellBorder} p-0`}
                      style={weightHeatStyle(weights[i] ?? 0, maxWeight)}
                    >
                      <div className="relative p-1">
                        <div
                          className="pointer-events-none absolute inset-y-1 left-1 rounded bg-blue-600/25 transition-all"
                          style={{
                            width: `${maxWeight > 0 ? Math.min(100, ((weights[i] ?? 0) / maxWeight) * 100) : 0}%`,
                            maxWidth: "calc(100% - 0.5rem)",
                          }}
                          aria-hidden
                        />
                        <label className="sr-only" htmlFor={`v-weight-${i}`}>
                          Comp {i + 1} weight percent
                        </label>
                        <div className="relative z-10 flex items-center gap-0.5 pr-1">
                          <input
                            id={`v-weight-${i}`}
                            type="number"
                            inputMode="decimal"
                            step="any"
                            className={`min-w-0 flex-1 ${inputClass} border-transparent bg-transparent shadow-none focus:bg-white/90`}
                            value={weights[i] ?? ""}
                            onChange={(e) =>
                              handleWeightChange(i, e.target.value)
                            }
                          />
                          <span
                            className="shrink-0 text-xs font-medium text-slate-600"
                            aria-hidden
                          >
                            %
                          </span>
                        </div>
                      </div>
                    </td>
                    <td
                      className={`${cellBorder} bg-slate-50/80 px-3 py-2 tabular-nums text-slate-800`}
                    >
                      {formatMoney(weightedLine[i] ?? 0, decimals)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <th
                    scope="row"
                    className={`${cellBorder} bg-slate-100 px-3 py-2 font-semibold text-slate-800`}
                  >
                    Total
                  </th>
                  <td
                    className={`${cellBorder} bg-slate-50 px-3 py-2 text-slate-400`}
                  >
                    —
                  </td>
                  <td
                    className={`${cellBorder} bg-slate-100 px-3 py-2 font-medium tabular-nums ${
                      weightBalanced ? "text-slate-800" : "text-amber-800"
                    }`}
                  >
                    {formatPercent(totalWeight, decimals)}
                  </td>
                  <td
                    className={`${cellBorder} bg-slate-100 px-3 py-2 text-base font-bold tabular-nums text-slate-900`}
                  >
                    {formatMoney(totalWeighted, decimals)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Indicated value = Σ (adjusted sale price × weight ÷ 100). Copy works
        best in Chrome or Edge; other browsers may download a PNG instead.
      </p>
    </div>
  );
};
