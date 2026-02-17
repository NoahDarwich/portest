"use client";

import { useState, useRef, useEffect } from "react";
import { MapFilters, ColorMode } from "@/lib/types";
import { COUNTRIES, REPRESSION_SHORT_LABELS, SEVERITY_LABELS, SEVERITY_COLORS } from "@/lib/constants";
import { ChevronDown, X } from "lucide-react";

interface MapFilterBarProps {
  filters: MapFilters;
  onFilterChange: (filters: MapFilters) => void;
  availableRepressionTypes: string[];
  availableDemandTypes: string[];
  availableTactics: string[];
}

/** A dropdown that shows checkboxes. Checked = showing those events. */
function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
  labelMap,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  labelMap?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const activeCount = selected.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
          activeCount > 0
            ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
            : "bg-white/[0.05] text-gray-400 border border-white/[0.08] hover:bg-white/[0.08]"
        }`}
      >
        {label}
        {activeCount > 0 && (
          <span className="bg-blue-500/25 text-blue-300 px-1 rounded text-[9px] font-bold">
            {activeCount}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 glass rounded-lg p-2 min-w-[200px] max-h-[260px] overflow-y-auto z-[1100]">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider px-1 mb-1.5">
            Check to show events
          </div>
          {options.map((opt) => {
            const isChecked = selected.includes(opt);
            return (
              <label
                key={opt}
                className="flex items-center gap-2 px-1 py-1 rounded hover:bg-white/[0.05] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(opt)}
                  className="rounded border-gray-600 bg-transparent text-blue-500 focus:ring-0 focus:ring-offset-0 h-3 w-3"
                />
                <span className={`text-[11px] truncate ${isChecked ? "text-gray-200" : "text-gray-500"}`}>
                  {labelMap?.[opt] || opt}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MapFilterBar({
  filters,
  onFilterChange,
  availableRepressionTypes,
  availableDemandTypes,
  availableTactics,
}: MapFilterBarProps) {
  const activeCount =
    filters.countries.length +
    filters.repressionTypes.length +
    filters.demandTypes.length +
    filters.tactics.length;

  const toggleInArray = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

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
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Country chips — always visible, compact */}
      <div className="flex items-center gap-1">
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
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              filters.countries.includes(c)
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                : "bg-white/[0.05] text-gray-500 border border-white/[0.08] hover:bg-white/[0.08] hover:text-gray-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-white/[0.08]" />

      {/* Dropdown filters */}
      <FilterDropdown
        label="Demand"
        options={availableDemandTypes}
        selected={filters.demandTypes}
        onToggle={(v) => onFilterChange({ ...filters, demandTypes: toggleInArray(filters.demandTypes, v) })}
      />

      <FilterDropdown
        label="Tactic"
        options={availableTactics}
        selected={filters.tactics}
        onToggle={(v) => onFilterChange({ ...filters, tactics: toggleInArray(filters.tactics, v) })}
      />

      <FilterDropdown
        label="Repression"
        options={availableRepressionTypes}
        selected={filters.repressionTypes}
        onToggle={(v) => onFilterChange({ ...filters, repressionTypes: toggleInArray(filters.repressionTypes, v) })}
        labelMap={REPRESSION_SHORT_LABELS}
      />

      <div className="w-px h-4 bg-white/[0.08]" />

      {/* Color mode toggle */}
      <div className="flex items-center bg-white/[0.04] rounded-md border border-white/[0.08] p-0.5">
        {(["severity", "type"] as ColorMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => onFilterChange({ ...filters, colorMode: mode })}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              filters.colorMode === mode
                ? "bg-white/[0.1] text-gray-200"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {mode === "severity" ? "Severity" : "Type"}
          </button>
        ))}
      </div>

      {/* Severity legend (compact, inline) */}
      {filters.colorMode === "severity" && (
        <>
          <div className="w-px h-4 bg-white/[0.08]" />
          <div className="flex items-center gap-1">
            {Object.entries(SEVERITY_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-0.5" title={SEVERITY_LABELS[Number(level)]}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[9px] text-gray-600">{SEVERITY_LABELS[Number(level)]}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Clear button */}
      {activeCount > 0 && (
        <>
          <div className="w-px h-4 bg-white/[0.08]" />
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-colors"
          >
            <X className="h-3 w-3" />
            Clear ({activeCount})
          </button>
        </>
      )}
    </div>
  );
}
