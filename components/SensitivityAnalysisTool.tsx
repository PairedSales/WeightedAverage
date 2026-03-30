"use client";

import { useMemo, useState, useCallback, type RefObject } from "react";
import type { CompSale, DecimalPrecision } from "@/lib/types";
import { formatCurrency, formatInteger } from "@/lib/formatting";
import { findBestGlaRatePerSf, participatingCompIds } from "@/lib/sensitivity";
import EditableCell from "./EditableCell";

interface SensitivityAnalysisToolProps {
  comps: CompSale[];
  exportRef?: RefObject<HTMLDivElement | null>;
  decimals: DecimalPrecision;
  subjectGla: number;
  onSubjectGlaChange: (value: number) => void;
  onUpdateCompSalePrice: (id: string, value: number) => void;
  onUpdateCompGla: (id: string, value: number) => void;
}

function parseSweepNumber(raw: string): number {
  const cleaned = raw.replace(/[$,%\s]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? NaN : parsed;
}

export default function SensitivityAnalysisTool({
  comps,
  exportRef,
  decimals,
  subjectGla,
  onSubjectGlaChange,
  onUpdateCompSalePrice,
  onUpdateCompGla,
}: SensitivityAnalysisToolProps) {
  const [sweepMin, setSweepMin] = useState(-50);
  const [sweepMax, setSweepMax] = useState(50);
  const [sweepStep, setSweepStep] = useState(1);
  const [minStr, setMinStr] = useState("-50");
  const [maxStr, setMaxStr] = useState("50");
  const [stepStr, setStepStr] = useState("1");

  const sweepValid =
    sweepStep > 0 && isFinite(sweepMin) && isFinite(sweepMax) && sweepMax >= sweepMin;

  const result = useMemo(
    () =>
      sweepValid
        ? findBestGlaRatePerSf(comps, subjectGla, {
            min: sweepMin,
            max: sweepMax,
            step: sweepStep,
          })
        : { bestRate: null, minRange: null, adjustedById: {} as Record<string, number> },
    [comps, subjectGla, sweepMin, sweepMax, sweepStep, sweepValid]
  );

  const participantCount = useMemo(
    () => participatingCompIds(comps, subjectGla).length,
    [comps, subjectGla]
  );

  const syncMin = useCallback(() => {
    const v = parseSweepNumber(minStr);
    if (!isNaN(v)) setSweepMin(v);
    else setMinStr(String(sweepMin));
  }, [minStr, sweepMin]);
  const syncMax = useCallback(() => {
    const v = parseSweepNumber(maxStr);
    if (!isNaN(v)) setSweepMax(v);
    else setMaxStr(String(sweepMax));
  }, [maxStr, sweepMax]);
  const syncStep = useCallback(() => {
    const v = parseSweepNumber(stepStr);
    if (!isNaN(v) && v > 0) setSweepStep(v);
    else setStepStr(String(sweepStep));
  }, [stepStr, sweepStep]);

  const showResult = sweepValid && participantCount >= 2 && result.bestRate !== null;

  return (
    <div className="mx-auto w-fit max-w-full" data-exclude-export>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-800">Sensitivity Analysis</h3>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              Subject GLA (SF)
            </p>
            <div className="flex min-w-[8rem] max-w-[10rem] items-stretch rounded-lg border border-slate-200 bg-white overflow-hidden">
              <div className="min-w-0 flex-1">
                <EditableCell
                  value={Math.round(subjectGla)}
                  formatted={formatInteger(subjectGla)}
                  onChange={onSubjectGlaChange}
                  type="integer"
                  placeholder="—"
                  tabIndex={-1}
                  className="!px-2 !py-2"
                />
              </div>
              <span className="flex items-center border-l border-slate-100 bg-slate-50/80 px-2 text-[11px] font-semibold text-slate-400">
                SF
              </span>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              Sweep min $/SF
            </p>
            <input
              type="text"
              inputMode="decimal"
              tabIndex={-1}
              value={minStr}
              onChange={(e) => setMinStr(e.target.value)}
              onBlur={syncMin}
              className="w-[5.5rem] rounded-lg border border-slate-200 px-2.5 py-2 text-sm tabular-nums text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-accent-400/50"
            />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              Sweep max $/SF
            </p>
            <input
              type="text"
              inputMode="decimal"
              tabIndex={-1}
              value={maxStr}
              onChange={(e) => setMaxStr(e.target.value)}
              onBlur={syncMax}
              className="w-[5.5rem] rounded-lg border border-slate-200 px-2.5 py-2 text-sm tabular-nums text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-accent-400/50"
            />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              Step $/SF
            </p>
            <input
              type="text"
              inputMode="decimal"
              tabIndex={-1}
              value={stepStr}
              onChange={(e) => setStepStr(e.target.value)}
              onBlur={syncStep}
              className="w-[5.5rem] rounded-lg border border-slate-200 px-2.5 py-2 text-sm tabular-nums text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-accent-400/50"
            />
          </div>
        </div>

        {!sweepValid && (
          <p className="mt-2 text-xs text-amber-700">
            Use a positive step and ensure max ≥ min so the sweep is valid.
          </p>
        )}


        <div className="mt-4 w-full overflow-x-auto">
          <div ref={exportRef} className="w-fit" data-chart-export>
          <table className="border-separate border-spacing-0 text-sm whitespace-nowrap">
            <thead>
              <tr>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b-2 border-slate-200 w-28">
                  Comparable
                </th>
                <th className="px-2 py-2.5 text-right text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b-2 border-slate-200 w-[11rem] max-w-[11rem]">
                  Sale Price
                </th>
                <th className="px-2 py-2.5 text-right text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b-2 border-slate-200 w-[8.25rem] max-w-[8.25rem]">
                  <span className="inline-block text-right leading-tight">
                    Comp GLA
                    <span className="mt-0.5 block text-[10px] font-semibold normal-case tracking-normal text-slate-400">
                      SF
                    </span>
                  </span>
                </th>
                <th className="px-2 py-2.5 text-right text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b-2 border-slate-200 w-[7.5rem] max-w-[7.5rem]">
                  <span className="inline-block text-right leading-tight">
                    GLA Δ
                    <span className="mt-0.5 block text-[10px] font-semibold normal-case tracking-normal text-slate-400">
                      SF
                    </span>
                  </span>
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b-2 border-slate-200 min-w-[10rem]">
                  Adjusted price
                </th>
              </tr>
            </thead>
            <tbody>
              {comps.map((comp, i) => {
                const isLast = i === comps.length - 1;
                const delta = subjectGla - comp.gla;
                const adj = result.adjustedById[comp.id];
                const hasAdj = showResult && adj !== undefined;
                return (
                  <tr key={comp.id} className="group hover:bg-accent-50/40 transition-colors">
                    <td
                      className={`px-4 py-2.5 font-medium text-slate-500 text-center text-[13px] ${!isLast ? "border-b border-slate-100" : ""}`}
                    >
                      {comp.label}
                    </td>
                    <td
                      className={`p-0 w-[11rem] max-w-[11rem] align-top ${!isLast ? "border-b border-slate-100" : ""}`}
                    >
                      <EditableCell
                        value={comp.salePrice}
                        formatted={formatCurrency(comp.salePrice, decimals)}
                        onChange={(v) => onUpdateCompSalePrice(comp.id, v)}
                        type="currency"
                        placeholder="Enter price"
                        tabIndex={-1}
                        className="!px-2 !py-2 text-[13px] min-w-0 max-w-full"
                      />
                    </td>
                    <td
                      className={`p-0 w-[8.25rem] max-w-[8.25rem] ${!isLast ? "border-b border-slate-100" : ""}`}
                    >
                      <div className="flex items-stretch justify-end">
                        <div className="min-w-0 flex-1">
                          <EditableCell
                            value={Math.round(comp.gla)}
                            formatted={formatInteger(comp.gla)}
                            onChange={(v) => onUpdateCompGla(comp.id, v)}
                            type="integer"
                            placeholder="—"
                            tabIndex={-1}
                            className="!px-2 !py-2 text-[13px] min-w-0 max-w-full"
                          />
                        </div>
                        <span className="flex items-center px-1.5 text-[10px] font-semibold text-slate-400">
                          SF
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-2 py-2.5 text-right text-[13px] tabular-nums font-medium text-slate-600 w-[7.5rem] max-w-[7.5rem] ${!isLast ? "border-b border-slate-100" : ""}`}
                    >
                      {subjectGla > 0 && comp.gla > 0 ? (
                        <>
                          {formatInteger(delta)}
                          <span className="ml-1 text-[10px] font-semibold text-slate-400">SF</span>
                        </>
                      ) : (
                        "\u2014"
                      )}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right tabular-nums font-medium text-slate-600 ${!isLast ? "border-b border-slate-100" : ""}`}
                    >
                      {hasAdj ? formatCurrency(adj, decimals) : "\u2014"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-3.5 font-bold text-accent-900 bg-gradient-to-r from-accent-50 to-accent-100/60 text-[15px] border-t-2 border-accent-200 rounded-bl-xl"
                >
                  Sensitivity result
                </td>
                <td className="px-3 py-3.5 text-right text-[11px] font-semibold uppercase tracking-widest text-accent-800 bg-gradient-to-r from-accent-100/60 to-accent-100/40 border-t-2 border-accent-200">
                  Optimal $/SF
                </td>
                <td className="px-3 py-3.5 text-right tabular-nums font-bold text-accent-900 bg-gradient-to-r from-accent-100/40 to-accent-50 text-[15px] border-t-2 border-accent-200 rounded-br-xl">
                  {showResult && result.bestRate !== null
                    ? formatCurrency(result.bestRate, decimals)
                    : "\u2014"}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-3 font-bold text-accent-900 bg-gradient-to-r from-accent-50 to-accent-100/60 text-[15px] border-t border-accent-100 rounded-bl-xl"
                >
                  Min adjusted range
                </td>
                <td
                  colSpan={2}
                  className="px-3 py-3 text-right tabular-nums font-bold text-accent-900 bg-gradient-to-r from-accent-100/60 to-accent-50 text-[15px] border-t border-accent-100 rounded-br-xl"
                >
                  {showResult && result.minRange !== null
                    ? formatCurrency(result.minRange, decimals)
                    : "\u2014"}
                </td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}
