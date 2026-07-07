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

/** EditableCell's onChange is typed for number | string (weight cells allow text); these fields are always numeric. */
function toNumber(value: number | string): number {
  return typeof value === "number" ? value : 0;
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
      <div className="bg-white border border-neutral-300 p-0">
        <div className="appraisal-section-header">Sensitivity Analysis</div>

        <div className="px-3 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Subject GLA (SF)
              </p>
              <div className="flex min-w-[8rem] max-w-[10rem] items-stretch border border-neutral-300 bg-white overflow-hidden">
                <div className="min-w-0 flex-1">
                  <EditableCell
                    value={Math.round(subjectGla)}
                    formatted={formatInteger(subjectGla)}
                    onChange={(v) => onSubjectGlaChange(toNumber(v))}
                    type="integer"
                    placeholder="—"
                    tabIndex={-1}
                    className="!px-2 !py-1.5"
                  />
                </div>
                <span className="flex items-center border-l border-neutral-300 bg-slate-50 px-2 text-[11px] font-bold text-slate-500">
                  SF
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Sweep min $/SF
              </p>
              <input
                type="text"
                inputMode="decimal"
                tabIndex={-1}
                value={minStr}
                onChange={(e) => setMinStr(e.target.value)}
                onBlur={syncMin}
                className="w-[5.5rem] border border-neutral-300 px-2 py-1.5 text-sm tabular-nums text-slate-800 outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Sweep max $/SF
              </p>
              <input
                type="text"
                inputMode="decimal"
                tabIndex={-1}
                value={maxStr}
                onChange={(e) => setMaxStr(e.target.value)}
                onBlur={syncMax}
                className="w-[5.5rem] border border-neutral-300 px-2 py-1.5 text-sm tabular-nums text-slate-800 outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Step $/SF
              </p>
              <input
                type="text"
                inputMode="decimal"
                tabIndex={-1}
                value={stepStr}
                onChange={(e) => setStepStr(e.target.value)}
                onBlur={syncStep}
                className="w-[5.5rem] border border-neutral-300 px-2 py-1.5 text-sm tabular-nums text-slate-800 outline-none focus:border-slate-500"
              />
            </div>
          </div>

          {!sweepValid && (
            <p className="mt-2 text-xs text-amber-700">
              Use a positive step and ensure max ≥ min so the sweep is valid.
            </p>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <div ref={exportRef} className="w-fit" data-chart-export>
          <table className="border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr>
                <th className="px-3 py-1.5 text-left text-xs font-bold text-white bg-neutral-800 border border-neutral-300 w-28">
                  Comparable
                </th>
                <th className="px-2 py-1.5 text-right text-xs font-bold text-white bg-neutral-800 border border-neutral-300 w-[11rem] max-w-[11rem]">
                  Sale Price
                </th>
                <th className="px-2 py-1.5 text-right text-xs font-bold text-white bg-neutral-800 border border-neutral-300 w-[8.25rem] max-w-[8.25rem]">
                  <span className="inline-block text-right leading-tight">
                    Comp GLA
                    <span className="mt-0.5 block text-[10px] font-semibold normal-case tracking-normal text-neutral-300">
                      SF
                    </span>
                  </span>
                </th>
                <th className="px-2 py-1.5 text-right text-xs font-bold text-white bg-neutral-800 border border-neutral-300 w-[7.5rem] max-w-[7.5rem]">
                  <span className="inline-block text-right leading-tight">
                    GLA Δ
                    <span className="mt-0.5 block text-[10px] font-semibold normal-case tracking-normal text-neutral-300">
                      SF
                    </span>
                  </span>
                </th>
                <th className="px-3 py-1.5 text-right text-xs font-bold text-white bg-neutral-800 border border-neutral-300 min-w-[10rem]">
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
                  <tr key={comp.id} className="group hover:bg-slate-50 transition-colors">
                    <td
                      className={`px-3 py-1.5 font-medium text-slate-700 text-center text-[13px] border border-neutral-300`}
                    >
                      {comp.label}
                    </td>
                    <td
                      className={`p-0 w-[11rem] max-w-[11rem] align-top border border-neutral-300`}
                    >
                      <EditableCell
                        value={comp.salePrice}
                        formatted={formatCurrency(comp.salePrice, decimals)}
                        onChange={(v) => onUpdateCompSalePrice(comp.id, toNumber(v))}
                        type="currency"
                        placeholder="Enter price"
                        tabIndex={-1}
                        className="!px-2 !py-1.5 text-[13px] min-w-0 max-w-full"
                      />
                    </td>
                    <td
                      className={`p-0 w-[8.25rem] max-w-[8.25rem] border border-neutral-300`}
                    >
                      <div className="flex items-stretch justify-end">
                        <div className="min-w-0 flex-1">
                          <EditableCell
                            value={Math.round(comp.gla)}
                            formatted={formatInteger(comp.gla)}
                            onChange={(v) => onUpdateCompGla(comp.id, toNumber(v))}
                            type="integer"
                            placeholder="—"
                            tabIndex={-1}
                            className="!px-2 !py-1.5 text-[13px] min-w-0 max-w-full"
                          />
                        </div>
                        <span className="flex items-center px-1.5 text-[10px] font-bold text-slate-500">
                          SF
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-2 py-1.5 text-right text-[13px] tabular-nums font-medium text-slate-700 w-[7.5rem] max-w-[7.5rem] border border-neutral-300`}
                    >
                      {subjectGla > 0 && comp.gla > 0 ? (
                        <>
                          {formatInteger(delta)}
                          <span className="ml-1 text-[10px] font-bold text-slate-500">SF</span>
                        </>
                      ) : (
                        "\u2014"
                      )}
                    </td>
                    <td
                      className={`px-2 py-1.5 text-right tabular-nums font-medium text-slate-700 border border-neutral-300`}
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
                  className="px-3 py-2 font-bold text-slate-900 bg-slate-100 text-sm border border-neutral-300"
                >
                  Sensitivity result
                </td>
                <td className="px-2 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-slate-700 bg-slate-100 border border-neutral-300">
                  Optimal $/SF
                </td>
                <td className="px-2 py-2 text-right tabular-nums font-bold text-slate-900 bg-slate-100 text-sm border border-neutral-300">
                  {showResult && result.bestRate !== null
                    ? formatCurrency(result.bestRate, decimals)
                    : "\u2014"}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-2 font-bold text-slate-900 bg-slate-100 text-sm border border-neutral-300"
                >
                  Min adjusted range
                </td>
                <td
                  colSpan={2}
                  className="px-2 py-2 text-right tabular-nums font-bold text-slate-900 bg-slate-100 text-sm border border-neutral-300"
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
