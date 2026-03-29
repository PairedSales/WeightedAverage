"use client";

import { useMemo, useState } from "react";
import type { CompSale, DecimalPrecision } from "@/lib/types";
import { formatPercent } from "@/lib/formatting";
import EditableCell from "./EditableCell";

interface WeightAllocationToolProps {
  comps: CompSale[];
  decimals: DecimalPrecision;
  onApplyWeights: (weightsById: Record<string, number>) => void;
  onUpdateWeight: (id: string, value: number) => void;
}

const TARGET_TOTAL = 100;

function toBasisPoints(value: number): number {
  return Math.round(value * 100);
}

function fromBasisPoints(value: number): number {
  return value / 100;
}

function allocateEven(total: number, count: number): number[] {
  if (count <= 0) return [];

  const totalBp = toBasisPoints(total);
  const base = Math.floor(totalBp / count);
  const remainder = totalBp - base * count;

  return Array.from({ length: count }, (_, i) => fromBasisPoints(base + (i < remainder ? 1 : 0)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function WeightAllocationTool({ comps, decimals, onApplyWeights, onUpdateWeight }: WeightAllocationToolProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTotalInput, setSelectedTotalInput] = useState("50");

  const weightById = useMemo(() => {
    return Object.fromEntries(comps.map((c) => [c.id, c.weight]));
  }, [comps]);

  const totalWeight = useMemo(() => comps.reduce((sum, comp) => sum + comp.weight, 0), [comps]);
  const selectedWeight = useMemo(
    () => selectedIds.reduce((sum, id) => sum + (weightById[id] ?? 0), 0),
    [selectedIds, weightById]
  );

  const remainingFromSelected = TARGET_TOTAL - selectedWeight;
  const totalOffBy = TARGET_TOTAL - totalWeight;
  const unselected = comps.filter((c) => !selectedIds.includes(c.id));
  const selected = comps.filter((c) => selectedIds.includes(c.id));

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const applyWeights = (pairs: Array<{ id: string; weight: number }>) => {
    const map: Record<string, number> = {};
    for (const c of comps) map[c.id] = c.weight;
    for (const pair of pairs) map[pair.id] = pair.weight;
    onApplyWeights(map);
  };

  const distributeRemainder = () => {
    if (unselected.length === 0) return;
    const even = allocateEven(remainingFromSelected, unselected.length);
    applyWeights(unselected.map((c, i) => ({ id: c.id, weight: even[i] })));
  };

  const splitSelectedTotal = () => {
    if (selected.length === 0) return;

    const parsed = Number(selectedTotalInput.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsed)) return;

    const selectedTotal = clamp(parsed, 0, TARGET_TOTAL);
    const selectedWeights = allocateEven(selectedTotal, selected.length);
    const remainderWeights = allocateEven(TARGET_TOTAL - selectedTotal, unselected.length);

    applyWeights([
      ...selected.map((c, i) => ({ id: c.id, weight: selectedWeights[i] })),
      ...unselected.map((c, i) => ({ id: c.id, weight: remainderWeights[i] })),
    ]);
  };

  const autoBalanceAll = () => {
    const all = allocateEven(TARGET_TOTAL, comps.length);
    applyWeights(comps.map((c, i) => ({ id: c.id, weight: all[i] })));
  };

  const applySplitPreset = (first: number, second: number) => {
    if (selected.length !== 2) return;

    const selectedWeights = [first, second];
    const remainderWeights = allocateEven(TARGET_TOTAL - first - second, unselected.length);
    applyWeights([
      { id: selected[0].id, weight: selectedWeights[0] },
      { id: selected[1].id, weight: selectedWeights[1] },
      ...unselected.map((c, i) => ({ id: c.id, weight: remainderWeights[i] })),
    ]);
  };

  const nudgeTo100 = () => {
    if (Math.abs(totalOffBy) < 0.005) return;

    const targetPool = unselected.length > 0 ? unselected : comps;
    if (targetPool.length === 0) return;

    const sorted = [...targetPool].sort((a, b) => b.weight - a.weight);
    const anchor = sorted[0];
    const adjusted = anchor.weight + totalOffBy;

    applyWeights([{ id: anchor.id, weight: Math.max(0, Math.round(adjusted * 100) / 100) }]);
  };

  const totalClass = Math.abs(totalWeight - TARGET_TOTAL) <= 0.005 ? "text-emerald-700" : "text-amber-700";

  return (
    <div className="mt-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm" data-exclude-export>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Weight Studio</h3>
          <p className="text-xs text-slate-500">Choose manual comps, then auto-distribute the rest to reach exactly 100%.</p>
        </div>
        <div className={`text-sm font-semibold ${totalClass}`}>
          Total: {formatPercent(totalWeight, decimals)}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {comps.map((comp) => {
          const active = selectedIds.includes(comp.id);
          return (
            <button
              key={comp.id}
              type="button"
              onClick={() => toggleSelected(comp.id)}
              className={`flex w-fit shrink-0 flex-col items-center rounded-lg border px-1 py-1 text-center transition-colors cursor-pointer ${
                active ? "border-accent-300 bg-accent-50" : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{comp.label}</div>
              <div className="mt-0.5 flex justify-center" onClick={(e) => e.stopPropagation()}>
                <EditableCell
                  value={comp.weight}
                  formatted={formatPercent(comp.weight, decimals)}
                  onChange={(value) => onUpdateWeight(comp.id, value)}
                  type="percent"
                  placeholder="0%"
                  align="left"
                  tabIndex={-1}
                  fullWidth={false}
                  className="w-11 px-0 py-0 text-center text-[13px] font-semibold"
                />
              </div>
              <div className="mt-0.5 whitespace-nowrap text-[8px] leading-tight text-slate-500">
                {active ? "Manual / locked" : "Auto-fill candidate"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-xs text-slate-600">
          Selected total %
          <input
            type="text"
            value={selectedTotalInput}
            onChange={(e) => setSelectedTotalInput(e.target.value)}
            className="mt-1 block w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-accent-500 focus:outline-none"
          />
        </label>

        <button
          type="button"
          onClick={splitSelectedTotal}
          disabled={selected.length === 0}
          className="rounded-lg bg-accent-600 px-3 py-2 text-xs font-semibold text-white hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Split selected + fill remainder
        </button>

        <button
          type="button"
          onClick={distributeRemainder}
          disabled={unselected.length === 0}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Distribute remainder evenly
        </button>

        <button
          type="button"
          onClick={autoBalanceAll}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Auto-balance all
        </button>

        <button
          type="button"
          onClick={nudgeTo100}
          disabled={Math.abs(totalOffBy) <= 0.005}
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Nudge to 100%
        </button>
      </div>

      {selected.length === 2 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">Quick splits</span>
          <button
            type="button"
            onClick={() => applySplitPreset(60, 40)}
            className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            60/40
          </button>
          <button
            type="button"
            onClick={() => applySplitPreset(70, 30)}
            className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            70/30
          </button>
          <button
            type="button"
            onClick={() => applySplitPreset(55, 45)}
            className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            55/45
          </button>
        </div>
      )}

      <div className="mt-3 text-xs text-slate-500">
        Selected: {selected.length} · Selected weight: {formatPercent(selectedWeight, decimals)} · Remaining: {formatPercent(remainingFromSelected, decimals)}
      </div>
    </div>
  );
}
