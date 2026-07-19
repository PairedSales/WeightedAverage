"use client";

import { useCallback } from "react";
import type { RefObject } from "react";
import type { CompSale, DecimalPrecision, GridThemeId, LayoutMode, WeightDisplayFormat, WeightVizMode, WeightVizRow } from "@/lib/types";
import { getGridTheme, type GridTheme } from "@/lib/themes";
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
  weightViz: WeightVizMode;
  showResultViz: boolean;
  barFillRow: WeightVizRow;
  gridExportRef?: RefObject<HTMLDivElement | null>;
  onUpdateComp: (id: string, field: "salePrice" | "weight", value: number | string) => void;
  onAddComp: () => void;
  onRemoveComp: (id: string) => void;
  onWeightDisplayFormatChange?: (format: WeightDisplayFormat) => void;
}

export default function SpreadsheetGrid({
  comps,
  decimals,
  layout,
  weightDisplayFormat,
  theme,
  weightViz,
  showResultViz,
  barFillRow,
  gridExportRef,
  onUpdateComp,
  onAddComp,
  onRemoveComp,
  onWeightDisplayFormatChange,
}: SpreadsheetGridProps) {
  const resolvedTheme = getGridTheme(theme);
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
  onWeightDisplayFormatChange?: (format: WeightDisplayFormat) => void;
  onNavigate: (direction: "up" | "down" | "next" | "prev", currentTabIndex: number) => void;
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
        className="text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2.5 py-1 transition-colors flex items-center gap-1 cursor-pointer border border-transparent hover:border-slate-300"
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
  onWeightDisplayFormatChange,
  onNavigate,
}: GridInternalProps) {
  const n = comps.length;
  return (
    <div className="w-fit">
      <div ref={gridExportRef} className="w-fit" data-chart-export>
      <table className="border-collapse text-sm whitespace-nowrap">
        <thead>
          <tr>
            <th className={`px-3 py-1.5 text-left text-xs font-bold text-white ${theme.headerBg} border ${theme.borderColor} w-28`}>
              Comparable
            </th>
            <th className={`px-3 py-1.5 text-right text-xs font-bold text-white ${theme.headerBg} border ${theme.borderColor} min-w-[10rem]`}>
              Sale Price
            </th>
            <th className={`px-3 py-1.5 text-right text-xs font-bold text-white ${theme.headerBg} border ${theme.borderColor} w-32`}>
              Weight
            </th>
            <th className={`px-3 py-1.5 text-right text-xs font-bold text-white ${theme.headerBg} border ${theme.borderColor} min-w-[10rem]`}>
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
                className={`group ${theme.hoverBg} transition-colors`}
              >
                <td className={`px-3 py-1.5 font-medium text-slate-700 text-center text-[13px] border ${theme.borderColor}`}>
                  {comp.label}
                </td>
                <td className={`p-0 border ${theme.borderColor}`}>
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
                <td className={`p-0 relative border ${theme.borderColor}`}>
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
                <td className={`px-2 py-1.5 text-right tabular-nums font-medium text-slate-700 relative border ${theme.borderColor}`}>
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
              className={`px-3 py-2 font-bold ${theme.footerText} ${theme.footerBg} text-sm border ${theme.borderColor}`}
            >
              Weighted Average
              <WeightWarning totalWeight={totalWeight} decimals={decimals} />
            </td>
            <td
              colSpan={2}
              className={`px-2 py-2 relative text-right tabular-nums font-bold ${theme.footerText} ${theme.footerBg} text-sm border ${theme.borderColor}`}
            >
              {showResultViz && totalWeight > 0 && (
                <>
                  {weightViz === "shade" && (
                    <WeightBar ratio={totalWeight / 100} direction="horizontal" colorRGB={theme.weightBarRGB} />
                  )}
                  {(weightViz === "meter" || weightViz === "scale") && (
                    <ResultStrip mode={weightViz} pct={totalWeight} colorRGB={theme.weightBarRGB} />
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
                  {weightViz === "bar-fill" && (
                    <BarFillBackground comps={comps} totalWeight={totalWeight} colorRGB={theme.weightBarRGB} />
                  )}
                </>
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
  onWeightDisplayFormatChange,
  onNavigate,
}: GridInternalProps) {
  const n = comps.length;
  return (
    <div className="w-fit">
      <div ref={gridExportRef} className="w-fit" data-chart-export>
      <table className="border-collapse text-sm whitespace-nowrap">
        <thead>
          <tr>
            <th className={`px-3 py-1.5 text-left text-xs font-bold text-white ${theme.headerBg} border ${theme.borderColor} w-32`}>
              &nbsp;
            </th>
            {comps.map((comp) => (
              <th
                key={comp.id}
                className={`px-3 py-1.5 text-center text-xs font-bold text-white ${theme.headerBg} border ${theme.borderColor} group relative`}
              >
                <span>{comp.label}</span>
                {canRemove && (
                  <span className="absolute top-0.5 right-0.5" data-exclude-export>
                    <RemoveButton onClick={() => onRemoveComp(comp.id)} label={comp.label} />
                  </span>
                )}
              </th>
            ))}
            <th className={`px-3 py-1.5 text-center text-xs font-bold text-white ${theme.headerAccentBg} border ${theme.borderColor}`}>
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Sale Price Row */}
          <tr className="group">
            <td className={`px-3 py-1.5 font-bold text-slate-700 text-xs border ${theme.borderColor} ${theme.labelBg}`}>
              Sale Price
            </td>
            {comps.map((comp, i) => (
              <td key={comp.id} className={`p-0 min-w-[7rem] border ${theme.borderColor} ${theme.hoverBg} transition-colors`}>
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
            <td className={`border ${theme.borderColor} ${theme.resultColBg}`} />
          </tr>

          {/* Weight Row */}
          <tr className="group">
            <td className={`px-3 py-1.5 font-bold text-slate-700 text-xs border ${theme.borderColor} ${theme.labelBg}`}>
              Weight
              <WeightWarning totalWeight={totalWeight} decimals={decimals} />
            </td>
            {comps.map((comp, i) => {
              const isTextWeight = typeof comp.weight === "string";
              const weightRatio = numericWeight(comp) / maxWeight;
              return (
                <td key={comp.id} className={`p-0 min-w-[7rem] relative border ${theme.borderColor} ${theme.hoverBg} transition-colors`}>
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
            <td className={`p-0 relative text-right tabular-nums font-semibold text-slate-700 border ${theme.borderColor} ${theme.resultColBg}`}>
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
                <div className="px-2 py-1.5">{formatWeight(totalWeight, decimals, weightDisplayFormat)}</div>
                {showResultViz && (weightViz === "meter" || weightViz === "scale") && (
                  <WeightCellViz mode={weightViz} pct={totalWeight} colorRGB={theme.weightBarRGB} />
                )}
              </div>
            </td>
          </tr>

          {/* Contribution Row */}
          <tr className="group">
            <td className={`px-3 py-1.5 font-bold text-slate-700 text-xs border ${theme.borderColor} ${theme.labelBg}`}>
              Contribution
            </td>
            {comps.map((comp) => {
              const contrib = contribution(comp, totalWeight);
              const isTextWeight = typeof comp.weight === "string";
              return (
                <td
                  key={comp.id}
                  className={`px-2 py-1.5 min-w-[7rem] text-right tabular-nums font-medium text-slate-700 relative border ${theme.borderColor}`}
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
            <td className={`px-2 py-2 relative text-right tabular-nums font-bold ${theme.footerText} ${theme.footerBg} text-sm ${weightViz === "bar-fill" ? `border ${theme.borderColor}` : theme.resultBorder}`}>
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
