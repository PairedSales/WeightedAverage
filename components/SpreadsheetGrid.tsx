"use client";

import type { CompSale, DecimalPrecision, LayoutMode } from "@/lib/types";
import { sumWeights, contribution, weightedAverage } from "@/lib/calculations";
import { formatCurrency, formatPercent } from "@/lib/formatting";
import EditableCell from "./EditableCell";
import WeightBar from "./WeightBar";

interface SpreadsheetGridProps {
  comps: CompSale[];
  decimals: DecimalPrecision;
  layout: LayoutMode;
  onUpdateComp: (id: string, field: "salePrice" | "weight", value: number) => void;
  onAddComp: () => void;
  onRemoveComp: (id: string) => void;
}

export default function SpreadsheetGrid({
  comps,
  decimals,
  layout,
  onUpdateComp,
  onAddComp,
  onRemoveComp,
}: SpreadsheetGridProps) {
  const totalWeight = sumWeights(comps);
  const avg = weightedAverage(comps);
  const maxWeight = Math.max(...comps.map((c) => c.weight), 1);
  const canAdd = comps.length < 12;
  const canRemove = comps.length > 3;
  const weightsValid = totalWeight > 0;

  if (layout === "horizontal") {
    return (
      <HorizontalGrid
        comps={comps}
        decimals={decimals}
        totalWeight={totalWeight}
        avg={avg}
        maxWeight={maxWeight}
        weightsValid={weightsValid}
        canAdd={canAdd}
        canRemove={canRemove}
        onUpdateComp={onUpdateComp}
        onAddComp={onAddComp}
        onRemoveComp={onRemoveComp}
      />
    );
  }

  return (
    <VerticalGrid
      comps={comps}
      decimals={decimals}
      totalWeight={totalWeight}
      avg={avg}
      maxWeight={maxWeight}
      weightsValid={weightsValid}
      canAdd={canAdd}
      canRemove={canRemove}
      onUpdateComp={onUpdateComp}
      onAddComp={onAddComp}
      onRemoveComp={onRemoveComp}
    />
  );
}

interface GridInternalProps {
  comps: CompSale[];
  decimals: DecimalPrecision;
  totalWeight: number;
  avg: number;
  maxWeight: number;
  weightsValid: boolean;
  canAdd: boolean;
  canRemove: boolean;
  onUpdateComp: (id: string, field: "salePrice" | "weight", value: number) => void;
  onAddComp: () => void;
  onRemoveComp: (id: string) => void;
}

/* ── Vertical layout (comps as rows) ────────────────────────────── */

function VerticalGrid({
  comps,
  decimals,
  totalWeight,
  avg,
  maxWeight,
  weightsValid,
  canAdd,
  canRemove,
  onUpdateComp,
  onAddComp,
  onRemoveComp,
}: GridInternalProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="bg-slate-100 border border-slate-300 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">
              Comparable
            </th>
            <th className="bg-slate-100 border border-slate-300 px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Sale Price
            </th>
            <th className="bg-slate-100 border border-slate-300 px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">
              Weight
            </th>
            <th className="bg-slate-100 border border-slate-300 px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Contribution
            </th>
            {/* Extra narrow column for remove button — excluded from image capture via data attr */}
            <th className="w-8 border-0 bg-transparent" data-exclude-export />
          </tr>
        </thead>
        <tbody>
          {comps.map((comp) => {
            const contrib = contribution(comp, totalWeight);
            const weightRatio = comp.weight / maxWeight;
            return (
              <tr key={comp.id} className="group hover:bg-slate-50/60 transition-colors">
                <td className="border border-slate-300 px-3 py-1.5 font-medium text-slate-700 bg-slate-50 text-center">
                  {comp.label}
                </td>
                <td className="border border-slate-300 p-0">
                  <EditableCell
                    value={comp.salePrice}
                    formatted={formatCurrency(comp.salePrice, decimals)}
                    onChange={(v) => onUpdateComp(comp.id, "salePrice", v)}
                    type="currency"
                    placeholder="Enter price"
                  />
                </td>
                <td className="border border-slate-300 p-0 relative">
                  <WeightBar ratio={weightRatio} direction="horizontal" />
                  <div className="relative z-10">
                    <EditableCell
                      value={comp.weight}
                      formatted={formatPercent(comp.weight, decimals)}
                      onChange={(v) => onUpdateComp(comp.id, "weight", v)}
                      type="percent"
                      placeholder="0%"
                    />
                  </div>
                </td>
                <td className="border border-slate-300 px-2 py-1.5 text-right tabular-nums font-medium text-slate-600">
                  {weightsValid && comp.salePrice > 0
                    ? formatCurrency(contrib, decimals)
                    : "—"}
                </td>
                <td className="border-0 p-0 align-middle" data-exclude-export>
                  {canRemove && (
                    <button
                      onClick={() => onRemoveComp(comp.id)}
                      className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 text-slate-400 hover:text-red-500 transition-all"
                      title={`Remove ${comp.label}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={2}
              className="border border-indigo-200 px-3 py-3 font-bold text-indigo-800 bg-indigo-50 text-base"
            >
              Weighted Average
              {totalWeight > 0 && Math.abs(totalWeight - 100) > 0.01 && (
                <span className="ml-2 text-amber-500 text-[10px] font-normal align-middle" title="Weights do not sum to 100%">
                  &#9888; {formatPercent(totalWeight, decimals)}
                </span>
              )}
            </td>
            <td
              colSpan={2}
              className="border border-indigo-200 px-2 py-3 text-right tabular-nums font-bold text-indigo-800 bg-indigo-50 text-base"
            >
              {weightsValid ? formatCurrency(avg, decimals) : "—"}
            </td>
            <td className="border-0 bg-transparent" data-exclude-export />
          </tr>
        </tfoot>
      </table>

      {canAdd && (
        <div className="mt-1" data-exclude-export>
          <button
            onClick={onAddComp}
            className="text-xs text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-2.5 py-1 rounded transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
            </svg>
            Add Comparable
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Horizontal layout (comps as columns) ───────────────────────── */

function HorizontalGrid({
  comps,
  decimals,
  totalWeight,
  avg,
  maxWeight,
  weightsValid,
  canAdd,
  canRemove,
  onUpdateComp,
  onAddComp,
  onRemoveComp,
}: GridInternalProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="bg-slate-100 border border-slate-300 px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">
              &nbsp;
            </th>
            {comps.map((comp) => (
              <th
                key={comp.id}
                className="bg-slate-100 border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider group relative"
              >
                <span>{comp.label}</span>
                {canRemove && (
                  <button
                    onClick={() => onRemoveComp(comp.id)}
                    className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition-all"
                    data-exclude-export
                    title={`Remove ${comp.label}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                    </svg>
                  </button>
                )}
              </th>
            ))}
            <th className="bg-indigo-50 border border-indigo-200 px-3 py-2 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider">
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Sale Price Row */}
          <tr>
            <td className="border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 bg-slate-50 text-xs uppercase tracking-wider">
              Sale Price
            </td>
            {comps.map((comp) => (
              <td key={comp.id} className="border border-slate-300 p-0 hover:bg-slate-50/60 transition-colors">
                <EditableCell
                  value={comp.salePrice}
                  formatted={formatCurrency(comp.salePrice, decimals)}
                  onChange={(v) => onUpdateComp(comp.id, "salePrice", v)}
                  type="currency"
                  placeholder="Enter price"
                />
              </td>
            ))}
            <td className="border border-indigo-200 bg-indigo-50" />
          </tr>

          {/* Weight Row */}
          <tr>
            <td className="border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 bg-slate-50 text-xs uppercase tracking-wider">
              Weight
              {totalWeight > 0 && Math.abs(totalWeight - 100) > 0.01 && (
                <span className="ml-1 text-amber-500 text-[10px] font-normal" title="Weights do not sum to 100%">
                  &#9888;
                </span>
              )}
            </td>
            {comps.map((comp) => {
              const weightRatio = comp.weight / maxWeight;
              return (
                <td key={comp.id} className="border border-slate-300 p-0 relative hover:bg-slate-50/60 transition-colors">
                  <WeightBar ratio={weightRatio} direction="vertical" />
                  <div className="relative z-10">
                    <EditableCell
                      value={comp.weight}
                      formatted={formatPercent(comp.weight, decimals)}
                      onChange={(v) => onUpdateComp(comp.id, "weight", v)}
                      type="percent"
                      placeholder="0%"
                    />
                  </div>
                </td>
              );
            })}
            <td className="border border-indigo-200 px-2 py-1.5 text-right tabular-nums font-semibold text-slate-600 bg-indigo-50">
              {formatPercent(totalWeight, decimals)}
            </td>
          </tr>

          {/* Contribution Row */}
          <tr>
            <td className="border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 bg-slate-50 text-xs uppercase tracking-wider">
              Contribution
            </td>
            {comps.map((comp) => {
              const contrib = contribution(comp, totalWeight);
              return (
                <td
                  key={comp.id}
                  className="border border-slate-300 px-2 py-1.5 text-right tabular-nums font-medium text-slate-600"
                >
                  {weightsValid && comp.salePrice > 0
                    ? formatCurrency(contrib, decimals)
                    : "—"}
                </td>
              );
            })}
            <td className="border border-indigo-200 px-2 py-2 text-right tabular-nums font-bold text-indigo-800 bg-indigo-50 text-base">
              {weightsValid ? formatCurrency(avg, decimals) : "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {canAdd && (
        <div className="mt-1" data-exclude-export>
          <button
            onClick={onAddComp}
            className="text-xs text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-2.5 py-1 rounded transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
            </svg>
            Add Comparable
          </button>
        </div>
      )}
    </div>
  );
}
