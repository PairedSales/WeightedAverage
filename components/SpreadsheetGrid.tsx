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

function WeightWarning({ totalWeight, decimals }: { totalWeight: number; decimals: DecimalPrecision }) {
  if (totalWeight <= 0 || Math.abs(totalWeight - 100) <= 0.01) return null;
  return (
    <span
      className="ml-2 inline-flex items-center gap-1 text-amber-600 text-[11px] font-medium align-middle"
      title="Weights do not sum to 100%"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
        <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
      </svg>
      {formatPercent(totalWeight, decimals)}
    </span>
  );
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer"
      title={`Remove ${label}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
      </svg>
    </button>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-2" data-exclude-export>
      <button
        onClick={onClick}
        className="text-[13px] text-slate-400 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
        </svg>
        Add Comparable
      </button>
    </div>
  );
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
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b-2 border-slate-200 w-28">
              Comparable
            </th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b-2 border-slate-200 min-w-[10rem]">
              Sale Price
            </th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b-2 border-slate-200 w-32">
              Weight
            </th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b-2 border-slate-200 min-w-[10rem]">
              Contribution
            </th>
            <th className="w-8 border-b-2 border-transparent" data-exclude-export />
          </tr>
        </thead>
        <tbody>
          {comps.map((comp, i) => {
            const contrib = contribution(comp, totalWeight);
            const weightRatio = comp.weight / maxWeight;
            const isLast = i === comps.length - 1;
            return (
              <tr
                key={comp.id}
                className={`group hover:bg-blue-50/40 transition-colors ${
                  !isLast ? "border-b" : ""
                }`}
              >
                <td className={`px-4 py-2.5 font-medium text-slate-500 text-center text-[13px] ${!isLast ? "border-b border-slate-100" : ""}`}>
                  {comp.label}
                </td>
                <td className={`p-0 ${!isLast ? "border-b border-slate-100" : ""}`}>
                  <EditableCell
                    value={comp.salePrice}
                    formatted={formatCurrency(comp.salePrice, decimals)}
                    onChange={(v) => onUpdateComp(comp.id, "salePrice", v)}
                    type="currency"
                    placeholder="Enter price"
                  />
                </td>
                <td className={`p-0 relative ${!isLast ? "border-b border-slate-100" : ""}`}>
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
                <td className={`px-3 py-2.5 text-right tabular-nums font-medium text-slate-600 ${!isLast ? "border-b border-slate-100" : ""}`}>
                  {weightsValid && comp.salePrice > 0
                    ? formatCurrency(contrib, decimals)
                    : "—"}
                </td>
                <td className={`p-0 align-middle ${!isLast ? "border-b border-transparent" : ""}`} data-exclude-export>
                  {canRemove && (
                    <RemoveButton onClick={() => onRemoveComp(comp.id)} label={comp.label} />
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
              className="px-4 py-3.5 font-bold text-blue-900 bg-gradient-to-r from-blue-50 to-blue-100/60 text-[15px] border-t-2 border-blue-200 rounded-bl-xl"
            >
              Weighted Average
              <WeightWarning totalWeight={totalWeight} decimals={decimals} />
            </td>
            <td
              colSpan={2}
              className="px-3 py-3.5 text-right tabular-nums font-bold text-blue-900 bg-gradient-to-r from-blue-100/60 to-blue-50 text-[15px] border-t-2 border-blue-200 rounded-br-xl"
            >
              {weightsValid ? formatCurrency(avg, decimals) : "—"}
            </td>
            <td className="border-t-2 border-transparent bg-transparent" data-exclude-export />
          </tr>
        </tfoot>
      </table>

      {canAdd && <AddButton onClick={onAddComp} />}
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
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b-2 border-slate-200 w-32">
              &nbsp;
            </th>
            {comps.map((comp) => (
              <th
                key={comp.id}
                className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b-2 border-slate-200 group relative"
              >
                <span>{comp.label}</span>
                {canRemove && (
                  <span className="absolute top-1 right-1" data-exclude-export>
                    <RemoveButton onClick={() => onRemoveComp(comp.id)} label={comp.label} />
                  </span>
                )}
              </th>
            ))}
            <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-widest text-blue-600 border-b-2 border-blue-200 bg-blue-50/50">
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Sale Price Row */}
          <tr className="group">
            <td className="px-4 py-2.5 font-semibold text-slate-500 text-[11px] uppercase tracking-widest border-b border-slate-100">
              Sale Price
            </td>
            {comps.map((comp) => (
              <td key={comp.id} className="p-0 border-b border-slate-100 hover:bg-blue-50/40 transition-colors">
                <EditableCell
                  value={comp.salePrice}
                  formatted={formatCurrency(comp.salePrice, decimals)}
                  onChange={(v) => onUpdateComp(comp.id, "salePrice", v)}
                  type="currency"
                  placeholder="Enter price"
                />
              </td>
            ))}
            <td className="border-b border-blue-100 bg-blue-50/30" />
          </tr>

          {/* Weight Row */}
          <tr className="group">
            <td className="px-4 py-2.5 font-semibold text-slate-500 text-[11px] uppercase tracking-widest border-b border-slate-100">
              Weight
              <WeightWarning totalWeight={totalWeight} decimals={decimals} />
            </td>
            {comps.map((comp) => {
              const weightRatio = comp.weight / maxWeight;
              return (
                <td key={comp.id} className="p-0 relative border-b border-slate-100 hover:bg-blue-50/40 transition-colors">
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
            <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-600 border-b border-blue-100 bg-blue-50/30">
              {formatPercent(totalWeight, decimals)}
            </td>
          </tr>

          {/* Contribution Row */}
          <tr className="group">
            <td className="px-4 py-2.5 font-semibold text-slate-500 text-[11px] uppercase tracking-widest">
              Contribution
            </td>
            {comps.map((comp) => {
              const contrib = contribution(comp, totalWeight);
              return (
                <td
                  key={comp.id}
                  className="px-3 py-2.5 text-right tabular-nums font-medium text-slate-600"
                >
                  {weightsValid && comp.salePrice > 0
                    ? formatCurrency(contrib, decimals)
                    : "—"}
                </td>
              );
            })}
            <td className="px-3 py-3 text-right tabular-nums font-bold text-blue-900 bg-gradient-to-b from-blue-50 to-blue-100/60 text-[15px] border-t-2 border-blue-200 rounded-br-xl">
              {weightsValid ? formatCurrency(avg, decimals) : "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {canAdd && <AddButton onClick={onAddComp} />}
    </div>
  );
}
