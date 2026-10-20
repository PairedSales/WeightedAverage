"use client";

import { useCallback, useState } from "react";
import type { DragEvent, RefObject } from "react";
import type { CompSale, DecimalPrecision, GridThemeId, LayoutMode, WeightDisplayFormat, WeightVizMode, WeightVizRow } from "@/lib/types";
import { getGridTheme, gridThemeStyle, type GridTheme } from "@/lib/themes";
import { SKIN_BAR_RGB, type PageSkinId } from "@/lib/skins";
import { sumWeights, contribution, weightedAverage, numericWeight } from "@/lib/calculations";
import { formatCurrency, formatPercent, formatWeight } from "@/lib/formatting";
import EditableCell from "./EditableCell";
import WeightBar from "./WeightBar";
import { BarFillBackground, BarGlyph, PieClassicGlyph, PieGlyph, ResultStrip, WeightCellViz } from "./WeightViz";

interface SpreadsheetGridProps {
  comps: CompSale[];
  decimals: DecimalPrecision;
  layout: LayoutMode;
  weightDisplayFormat: WeightDisplayFormat;
  theme: GridThemeId;
  skin: PageSkinId;
  weightViz: WeightVizMode;
  showResultViz: boolean;
  barFillRow: WeightVizRow;
  gridExportRef?: RefObject<HTMLDivElement | null>;
  onUpdateComp: (id: string, field: "salePrice" | "weight", value: number | string) => void;
  onAddComp: () => void;
  onRemoveComp: (id: string) => void;
  onMoveComp: (fromId: string, toId: string) => void;
  onWeightDisplayFormatChange?: (format: WeightDisplayFormat) => void;
}

export default function SpreadsheetGrid({
  comps,
  decimals,
  layout,
  weightDisplayFormat,
  theme,
  skin,
  weightViz,
  showResultViz,
  barFillRow,
  gridExportRef,
  onUpdateComp,
  onAddComp,
  onRemoveComp,
  onMoveComp,
  onWeightDisplayFormatChange,
}: SpreadsheetGridProps) {
  const baseTheme = getGridTheme(theme);
  const skinBarRGB = SKIN_BAR_RGB[skin];
  const resolvedTheme = skinBarRGB ? { ...baseTheme, weightBarRGB: skinBarRGB } : baseTheme;
  const totalWeight = sumWeights(comps);
  const avg = weightedAverage(comps);
  const maxWeight = Math.max(...comps.map((c) => numericWeight(c)), 1);
  const canAdd = comps.length < 12;
  const canRemove = comps.length > 3;
  const weightsValid = totalWeight > 0;
  const n = comps.length;

  const handleNavigate = useCallback(
    (direction: "up" | "down" | "next" | "prev", currentTabIndex: number) => {
      let targetTabIndex = -1;
      
      if (direction === "next") {
        if (currentTabIndex === 2 * n) {
          targetTabIndex = 1;
        } else {
          targetTabIndex = currentTabIndex + 1;
        }
      } else if (direction === "prev") {
        if (currentTabIndex === 1) {
          targetTabIndex = 2 * n;
        } else {
          targetTabIndex = currentTabIndex - 1;
        }
      } else if (layout === "horizontal") {
        if (direction === "down") {
          if (currentTabIndex >= 1 && currentTabIndex <= n) {
            targetTabIndex = currentTabIndex + n;
          } else if (currentTabIndex >= n + 1 && currentTabIndex <= 2 * n) {
            if (currentTabIndex === 2 * n) {
              targetTabIndex = 1;
            } else {
              targetTabIndex = currentTabIndex - n + 1;
            }
          }
        } else { // up
          if (currentTabIndex >= n + 1 && currentTabIndex <= 2 * n) {
            targetTabIndex = currentTabIndex - n;
          } else if (currentTabIndex >= 1 && currentTabIndex <= n) {
            if (currentTabIndex === 1) {
              targetTabIndex = 2 * n;
            } else {
              targetTabIndex = currentTabIndex + n - 1;
            }
          }
        }
      } else { // vertical
        if (direction === "down") {
          if (currentTabIndex === n) {
            targetTabIndex = n + 1;
          } else if (currentTabIndex === 2 * n) {
            targetTabIndex = 1;
          } else {
            targetTabIndex = currentTabIndex + 1;
          }
        } else { // up
          if (currentTabIndex === 1) {
            targetTabIndex = 2 * n;
          } else if (currentTabIndex === n + 1) {
            targetTabIndex = n;
          } else {
            targetTabIndex = currentTabIndex - 1;
          }
        }
      }

      if (targetTabIndex !== -1) {
        const target = document.querySelector(`[tabindex="${targetTabIndex}"]`) as HTMLElement;
        if (target) {
          target.focus();
        }
      }
    },
    [layout, n]
  );

  if (layout === "horizontal") {
    return (
      <HorizontalGrid
        comps={comps}
        decimals={decimals}
        weightDisplayFormat={weightDisplayFormat}
        theme={resolvedTheme}
        weightViz={weightViz}
        showResultViz={showResultViz}
        barFillRow={barFillRow}
        totalWeight={totalWeight}
        avg={avg}
        maxWeight={maxWeight}
        weightsValid={weightsValid}
        canAdd={canAdd}
        canRemove={canRemove}
        gridExportRef={gridExportRef}
        onUpdateComp={onUpdateComp}
        onAddComp={onAddComp}
        onRemoveComp={onRemoveComp}
        onMoveComp={onMoveComp}
        onWeightDisplayFormatChange={onWeightDisplayFormatChange}
        onNavigate={handleNavigate}
      />
    );
  }

  return (
    <VerticalGrid
      comps={comps}
      decimals={decimals}
      weightDisplayFormat={weightDisplayFormat}
      theme={resolvedTheme}
      weightViz={weightViz}
      showResultViz={showResultViz}
      barFillRow={barFillRow}
      totalWeight={totalWeight}
      avg={avg}
      maxWeight={maxWeight}
      weightsValid={weightsValid}
      canAdd={canAdd}
      canRemove={canRemove}
      gridExportRef={gridExportRef}
      onUpdateComp={onUpdateComp}
      onAddComp={onAddComp}
      onRemoveComp={onRemoveComp}
      onMoveComp={onMoveComp}
      onWeightDisplayFormatChange={onWeightDisplayFormatChange}
      onNavigate={handleNavigate}
    />
  );
}

interface GridInternalProps {
  comps: CompSale[];
  decimals: DecimalPrecision;
  weightDisplayFormat: WeightDisplayFormat;
  theme: GridTheme;
  weightViz: WeightVizMode;
  showResultViz: boolean;
  barFillRow: WeightVizRow;
  totalWeight: number;
  avg: number;
  maxWeight: number;
  weightsValid: boolean;
  canAdd: boolean;
  canRemove: boolean;
  gridExportRef?: RefObject<HTMLDivElement | null>;
  onUpdateComp: (id: string, field: "salePrice" | "weight", value: number | string) => void;
  onAddComp: () => void;
  onRemoveComp: (id: string) => void;
  onMoveComp: (fromId: string, toId: string) => void;
  onWeightDisplayFormatChange?: (format: WeightDisplayFormat) => void;
  onNavigate: (direction: "up" | "down" | "next" | "prev", currentTabIndex: number) => void;
}

function useCompDrag(onMoveComp: (fromId: string, toId: string) => void) {
  const [id, setId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  return {
    id,
    overId,
    onStart: (e: DragEvent<HTMLElement>, compId: string) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", compId);
      setId(compId);
    },
    onOver: (e: DragEvent<HTMLElement>, compId: string) => {
      if (!id) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (overId !== compId) setOverId(compId);
    },
    onDrop: (e: DragEvent<HTMLElement>, compId: string) => {
      if (!id) return;
      e.preventDefault();
      if (id !== compId) onMoveComp(id, compId);
      setId(null);
      setOverId(null);
    },
    onEnd: () => {
      setId(null);
      setOverId(null);
    },
  };
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
      type="button"
      tabIndex={-1}
      onClick={onClick}
      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
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
    <div className="mt-1.5" data-exclude-export>
      <button
        type="button"
        tabIndex={-1}
        onClick={onClick}
        className="text-xs text-[color:var(--ui-muted)] hover:text-[color:var(--ui-ink)] hover:bg-[color:var(--ui-surface-2)] px-2.5 py-1 transition-colors flex items-center gap-1 cursor-pointer border border-transparent hover:border-[color:var(--ui-line)] rounded-[var(--ui-radius)]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
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
  weightDisplayFormat,
  theme,
  weightViz,
  showResultViz,
  barFillRow,
  totalWeight,
  avg,
  maxWeight,
  weightsValid,
  canAdd,
  canRemove,
  gridExportRef,
  onUpdateComp,
  onAddComp,
  onRemoveComp,
  onMoveComp,
  onWeightDisplayFormatChange,
  onNavigate,
}: GridInternalProps) {
  const n = comps.length;
  const dragging = useCompDrag(onMoveComp);
  return (
    <div className="w-fit" style={gridThemeStyle(theme)}>
      <div ref={gridExportRef} className="g-sheet w-fit" data-chart-export>
      <table className="g-table">
        <thead>
          <tr>
            <th className="g-th text-left w-28">
              Comparable
            </th>
            <th className="g-th text-right min-w-[10rem]">
              Adj. Sale Price
            </th>
            <th className="g-th text-right w-32">
              Weight
            </th>
            <th className="g-th text-right min-w-[10rem]">
              Contribution
            </th>
            <th className="w-7 border-none bg-transparent" data-exclude-export />
          </tr>
        </thead>
        <tbody>
          {comps.map((comp, i) => {
            const contrib = contribution(comp, totalWeight);
            const isTextWeight = typeof comp.weight === "string";
            const weightRatio = numericWeight(comp) / maxWeight;
            return (
              <tr
                key={comp.id}
                className={`g-row group ${dragging.overId === comp.id && dragging.id !== comp.id ? "outline outline-2 -outline-offset-2 outline-sky-500" : ""}`}
                onDragOver={(e) => dragging.onOver(e, comp.id)}
                onDrop={(e) => dragging.onDrop(e, comp.id)}
              >
                <td
                  draggable
                  onDragStart={(e) => {
                    dragging.onStart(e, comp.id);
                    const row = e.currentTarget.parentElement;
                    if (row) e.dataTransfer.setDragImage(row, 0, 0);
                  }}
                  onDragEnd={dragging.onEnd}
                  title="Drag to reorder"
                  className="g-comp cursor-grab active:cursor-grabbing"
                >
                  {comp.label}
                </td>
                <td className="p-0">
                  <EditableCell
                    value={comp.salePrice}
                    formatted={formatCurrency(comp.salePrice)}
                    onChange={(v) => onUpdateComp(comp.id, "salePrice", v)}
                    type="currency"
                    placeholder="Enter price"
                    tabIndex={i + 1}
                    maxTabIndex={2 * n}
                    onNavigate={onNavigate}
                  />
                </td>
                <td className="p-0 relative">
                  {weightViz === "shade" && (
                    <WeightBar ratio={weightRatio} direction="horizontal" colorRGB={theme.weightBarRGB} />
                  )}
                  {(weightViz === "pie" || weightViz === "pie-large") && totalWeight > 0 && numericWeight(comp) > 0 && (
                    <PieGlyph comps={comps} compId={comp.id} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} size={weightViz === "pie-large" ? 26 : 18} />
                  )}
                  {weightViz === "bar" && totalWeight > 0 && numericWeight(comp) > 0 && (
                    <BarGlyph comps={comps} compId={comp.id} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} />
                  )}
                  {weightViz === "pie-classic" && !isTextWeight && (
                    <PieClassicGlyph pct={numericWeight(comp)} colorRGB={theme.weightBarRGB} />
                  )}
                  {weightViz === "bar-fill" && barFillRow === "weight" && totalWeight > 0 && numericWeight(comp) > 0 && (
                    <BarFillBackground comps={comps} compId={comp.id} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} />
                  )}
                  <div className="relative z-10">
                    <EditableCell
                      value={comp.weight}
                      formatted={isTextWeight ? (comp.weight as string) : formatWeight(comp.weight as number, decimals, weightDisplayFormat)}
                      onChange={(v) => onUpdateComp(comp.id, "weight", v)}
                      type="percent"
                      placeholder="0%"
                      tabIndex={n + i + 1}
                      onFormatChange={onWeightDisplayFormatChange}
                      allowText
                      maxTabIndex={2 * n}
                      onNavigate={onNavigate}
                    />
                    {(weightViz === "meter" || weightViz === "scale") && (
                      <WeightCellViz
                        mode={weightViz}
                        pct={numericWeight(comp)}
                        hidden={isTextWeight}
                        colorRGB={theme.weightBarRGB}
                      />
                    )}
                  </div>
                </td>
                <td className="g-calc">
                  {weightViz === "bar-fill" && barFillRow === "contribution" && totalWeight > 0 && numericWeight(comp) > 0 && (
                    <BarFillBackground comps={comps} compId={comp.id} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} />
                  )}
                  <span className="relative z-10">
                    {weightsValid && comp.salePrice > 0 && !isTextWeight
                      ? formatCurrency(contrib)
                      : "\u2014"}
                  </span>
                </td>
                <td className="p-0 align-middle border-none" data-exclude-export>
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
              className="g-total-label"
            >
              Weighted Average
              <WeightWarning totalWeight={totalWeight} decimals={decimals} />
            </td>
            <td
              className="g-result"
            >
              {showResultViz && totalWeight > 0 && (
                <>
                  {weightViz === "shade" && (
                    <WeightBar ratio={totalWeight / 100} direction="horizontal" colorRGB={theme.weightBarRGB} />
                  )}
                  {(weightViz === "pie" || weightViz === "pie-large") && (
                    <PieGlyph comps={comps} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} size={weightViz === "pie-large" ? 26 : 18} />
                  )}
                  {weightViz === "pie-classic" && (
                    <PieClassicGlyph pct={totalWeight} colorRGB={theme.weightBarRGB} />
                  )}
                  {weightViz === "bar" && (
                    <BarGlyph comps={comps} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} />
                  )}
                  {weightViz === "bar-fill" && barFillRow === "weight" && (
                    <BarFillBackground comps={comps} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} />
                  )}
                </>
              )}
              <div className="relative z-10">
                <div className="g-pad">{formatWeight(totalWeight, decimals, weightDisplayFormat)}</div>
                {showResultViz && (weightViz === "meter" || weightViz === "scale") && (
                  <WeightCellViz mode={weightViz} pct={totalWeight} colorRGB={theme.weightBarRGB} />
                )}
              </div>
            </td>
            <td
              className="g-total"
            >
              {showResultViz && weightViz === "bar-fill" && barFillRow === "contribution" && totalWeight > 0 && (
                <BarFillBackground comps={comps} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} />
              )}
              <span className="relative z-10">{weightsValid ? formatCurrency(avg) : "\u2014"}</span>
            </td>
            <td className="border-none bg-transparent" data-exclude-export />
          </tr>
        </tfoot>
      </table>
      </div>

      {canAdd && <AddButton onClick={onAddComp} />}
    </div>
  );
}

/* ── Horizontal layout (comps as columns) ───────────────────────── */

function HorizontalGrid({
  comps,
  decimals,
  weightDisplayFormat,
  theme,
  weightViz,
  showResultViz,
  barFillRow,
  totalWeight,
  avg,
  maxWeight,
  weightsValid,
  canAdd,
  canRemove,
  gridExportRef,
  onUpdateComp,
  onAddComp,
  onRemoveComp,
  onMoveComp,
  onWeightDisplayFormatChange,
  onNavigate,
}: GridInternalProps) {
  const n = comps.length;
  const dragging = useCompDrag(onMoveComp);
  return (
    <div className="w-fit" style={gridThemeStyle(theme)}>
      <div ref={gridExportRef} className="g-sheet w-fit" data-chart-export>
      <table className="g-table">
        <thead>
          <tr>
            <th className="g-th text-left w-32">
              &nbsp;
            </th>
            {comps.map((comp) => (
              <th
                key={comp.id}
                draggable
                onDragStart={(e) => dragging.onStart(e, comp.id)}
                onDragEnd={dragging.onEnd}
                onDragOver={(e) => dragging.onOver(e, comp.id)}
                onDrop={(e) => dragging.onDrop(e, comp.id)}
                title="Drag to reorder"
                className={`g-th text-center group relative cursor-grab active:cursor-grabbing ${dragging.overId === comp.id && dragging.id !== comp.id ? "outline outline-2 -outline-offset-2 outline-sky-400" : ""}`}
              >
                <span>{comp.label}</span>
                {canRemove && (
                  <span className="absolute top-0.5 right-0.5" data-exclude-export>
                    <RemoveButton onClick={() => onRemoveComp(comp.id)} label={comp.label} />
                  </span>
                )}
              </th>
            ))}
            <th className="g-th g-th-accent text-center">
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Adj. Sale Price Row */}
          <tr className="group">
            <td className="g-rowhead">
              Adj. Sale Price
            </td>
            {comps.map((comp, i) => (
              <td key={comp.id} className="g-edit p-0 min-w-[7rem]">
                <EditableCell
                  value={comp.salePrice}
                  formatted={formatCurrency(comp.salePrice)}
                  onChange={(v) => onUpdateComp(comp.id, "salePrice", v)}
                  type="currency"
                  placeholder="Enter price"
                  tabIndex={i + 1}
                  maxTabIndex={2 * n}
                  onNavigate={onNavigate}
                />
              </td>
            ))}
            <td className="g-result" />
          </tr>

          {/* Weight Row */}
          <tr className="group">
            <td className="g-rowhead">
              Weight
              <WeightWarning totalWeight={totalWeight} decimals={decimals} />
            </td>
            {comps.map((comp, i) => {
              const isTextWeight = typeof comp.weight === "string";
              const weightRatio = numericWeight(comp) / maxWeight;
              return (
                <td key={comp.id} className="g-edit p-0 min-w-[7rem] relative">
                  {weightViz === "shade" && (
                    <WeightBar ratio={weightRatio} direction="vertical" colorRGB={theme.weightBarRGB} />
                  )}
                  {(weightViz === "pie" || weightViz === "pie-large") && totalWeight > 0 && numericWeight(comp) > 0 && (
                    <PieGlyph comps={comps} compId={comp.id} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} size={weightViz === "pie-large" ? 26 : 18} />
                  )}
                  {weightViz === "bar" && totalWeight > 0 && numericWeight(comp) > 0 && (
                    <BarGlyph comps={comps} compId={comp.id} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} />
                  )}
                  {weightViz === "pie-classic" && !isTextWeight && (
                    <PieClassicGlyph pct={numericWeight(comp)} colorRGB={theme.weightBarRGB} />
                  )}
                  {weightViz === "bar-fill" && barFillRow === "weight" && totalWeight > 0 && numericWeight(comp) > 0 && (
                    <BarFillBackground comps={comps} compId={comp.id} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} />
                  )}
                  <div className="relative z-10">
                    <EditableCell
                      value={comp.weight}
                      formatted={isTextWeight ? (comp.weight as string) : formatWeight(comp.weight as number, decimals, weightDisplayFormat)}
                      onChange={(v) => onUpdateComp(comp.id, "weight", v)}
                      type="percent"
                      placeholder="0%"
                      tabIndex={n + i + 1}
                      onFormatChange={onWeightDisplayFormatChange}
                      allowText
                      maxTabIndex={2 * n}
                      onNavigate={onNavigate}
                    />
                    {(weightViz === "meter" || weightViz === "scale") && (
                      <WeightCellViz
                        mode={weightViz}
                        pct={numericWeight(comp)}
                        hidden={isTextWeight}
                        colorRGB={theme.weightBarRGB}
                      />
                    )}
                  </div>
                </td>
              );
            })}
            <td className="g-result">
              {showResultViz && totalWeight > 0 && (
                <>
                  {weightViz === "shade" && (
                    <WeightBar ratio={totalWeight / 100} direction="vertical" colorRGB={theme.weightBarRGB} />
                  )}
                  {(weightViz === "pie" || weightViz === "pie-large") && (
                    <PieGlyph comps={comps} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} size={weightViz === "pie-large" ? 26 : 18} />
                  )}
                  {weightViz === "pie-classic" && (
                    <PieClassicGlyph pct={totalWeight} colorRGB={theme.weightBarRGB} />
                  )}
                  {weightViz === "bar" && (
                    <BarGlyph comps={comps} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} />
                  )}
                  {weightViz === "bar-fill" && barFillRow === "weight" && (
                    <BarFillBackground comps={comps} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} />
                  )}
                </>
              )}
              <div className="relative z-10">
                <div className="g-pad">{formatWeight(totalWeight, decimals, weightDisplayFormat)}</div>
                {showResultViz && (weightViz === "meter" || weightViz === "scale") && (
                  <WeightCellViz mode={weightViz} pct={totalWeight} colorRGB={theme.weightBarRGB} />
                )}
              </div>
            </td>
          </tr>

          {/* Contribution Row */}
          <tr className="group">
            <td className="g-rowhead">
              Contribution
            </td>
            {comps.map((comp) => {
              const contrib = contribution(comp, totalWeight);
              const isTextWeight = typeof comp.weight === "string";
              return (
                <td
                  key={comp.id}
                  className="g-calc min-w-[7rem]"
                >
                  {weightViz === "bar-fill" && barFillRow === "contribution" && totalWeight > 0 && numericWeight(comp) > 0 && (
                    <BarFillBackground comps={comps} compId={comp.id} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} />
                  )}
                  <span className="relative z-10">
                    {weightsValid && comp.salePrice > 0 && !isTextWeight
                      ? formatCurrency(contrib)
                      : "\u2014"}
                  </span>
                </td>
              );
            })}
            <td className={`g-total ${weightViz === "bar-fill" ? "" : "g-total-emph"}`}>
              {showResultViz && weightViz === "bar-fill" && barFillRow === "contribution" && totalWeight > 0 && (
                <BarFillBackground comps={comps} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} />
              )}
              <span className="relative z-10">{weightsValid ? formatCurrency(avg) : "\u2014"}</span>
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      {canAdd && <AddButton onClick={onAddComp} />}
    </div>
  );
}
