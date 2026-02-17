"use client";

import { useState } from "react";
import { MapFilters, ColorMode } from "@/lib/types";
import { COUNTRIES, REPRESSION_SHORT_LABELS, SEVERITY_LABELS, SEVERITY_COLORS } from "@/lib/constants";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";

interface FilterSidebarProps {
  filters: MapFilters;
  onFilterChange: (filters: MapFilters) => void;
  availableRepressionTypes: string[];
  availableDemandTypes: string[];
  availableTactics: string[];
}

/** Collapsible section with checkbox list */
function FilterSection({
  title,
  options,
  selected,
  onToggle,
  labelMap,
  defaultOpen = false,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  labelMap?: Record<string, string>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const activeCount = selected.length;

  return (
    <div className="border-b border-white/[0.06] pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-1.5 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
            {title}
          </span>
          {activeCount > 0 && (
            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {open && (
        <div className="mt-2.5 max-h-[220px] overflow-y-auto space-y-1 pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
          {options.map((opt) => {
            const isChecked = selected.includes(opt);
            const displayLabel = labelMap?.[opt] || opt;
            return (
              <label
                key={opt}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  isChecked
                    ? "bg-blue-500/10 border border-blue-500/20"
                    : "hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(opt)}
                  className="rounded border-gray-600 bg-transparent text-blue-500 focus:ring-0 focus:ring-offset-0 h-4 w-4 flex-shrink-0"
                />
                <span className={`text-sm ${isChecked ? "text-gray-200" : "text-gray-400"}`}>
                  {displayLabel}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FilterSidebar({
  filters,
  onFilterChange,
  availableRepressionTypes,
  availableDemandTypes,
  availableTactics,
}: FilterSidebarProps) {
  const toggleInArray = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const activeCount =
    filters.countries.length +
    filters.repressionTypes.length +
    filters.demandTypes.length +
    filters.tactics.length;

  const clearFilters = () => {
    onFilterChange({
      ...filters,
      countries: [],
      repressionTypes: [],
      demandTypes: [],
      tactics: [],
    });
  };

  return (
    <div
      className="w-[300px] flex-shrink-0 flex flex-col border-l border-white/[0.06] z-[1001]"
      style={{ background: "rgba(12, 13, 18, 0.95)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <Filter className="h-4.5 w-4.5 text-gray-400" />
          <span className="text-base font-semibold text-gray-200">Filters</span>
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>

      {/* Scrollable filter content */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
      >
        {/* Country — always visible as large buttons */}
        <div className="mb-5">
          <div className="text-sm font-semibold text-gray-300 mb-3">Country</div>
          <div className="grid grid-cols-3 gap-2">
            {COUNTRIES.map((c) => (
              <button
                key={c}
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    countries: filters.countries.includes(c)
                      ? filters.countries.filter((x) => x !== c)
                      : [c],
                  })
                }
                className={`px-3 py-2.5 rounded-lg text-sm font-medium text-center transition-all ${
                  filters.countries.includes(c)
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10"
                    : "bg-white/[0.04] text-gray-400 border border-white/[0.08] hover:bg-white/[0.08] hover:text-gray-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Color mode */}
        <div className="mb-5">
          <div className="text-sm font-semibold text-gray-300 mb-3">Color By</div>
          <div className="flex bg-white/[0.03] rounded-lg border border-white/[0.06] p-1">
            {(["severity", "type"] as ColorMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onFilterChange({ ...filters, colorMode: mode })}
                className={`flex-1 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                  filters.colorMode === mode
                    ? "bg-white/[0.1] text-gray-200 shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {mode === "severity" ? "Severity" : "Type"}
              </button>
            ))}
          </div>

          {/* Severity legend */}
          {filters.colorMode === "severity" && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {Object.entries(SEVERITY_COLORS).map(([level, color]) => (
                <div key={level} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-500">{SEVERITY_LABELS[Number(level)]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collapsible filter sections */}
        <FilterSection
          title="Demand Type"
          options={availableDemandTypes}
          selected={filters.demandTypes}
          onToggle={(v) => onFilterChange({ ...filters, demandTypes: toggleInArray(filters.demandTypes, v) })}
          defaultOpen={false}
        />

        <FilterSection
          title="Tactic"
          options={availableTactics}
          selected={filters.tactics}
          onToggle={(v) => onFilterChange({ ...filters, tactics: toggleInArray(filters.tactics, v) })}
          defaultOpen={false}
        />

        <FilterSection
          title="Repression Type"
          options={availableRepressionTypes}
          selected={filters.repressionTypes}
          onToggle={(v) => onFilterChange({ ...filters, repressionTypes: toggleInArray(filters.repressionTypes, v) })}
          labelMap={REPRESSION_SHORT_LABELS}
          defaultOpen={false}
        />
      </div>
    </div>
  );
}
