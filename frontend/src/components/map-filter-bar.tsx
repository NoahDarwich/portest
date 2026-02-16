"use client";

import { useState } from "react";
import { MapFilters } from "@/lib/types";
import { COUNTRIES, REPRESSION_SHORT_LABELS } from "@/lib/constants";
import { Filter, X, ChevronDown } from "lucide-react";

interface MapFilterBarProps {
  filters: MapFilters;
  onFilterChange: (filters: MapFilters) => void;
  availableRepressionTypes: string[];
}

export function MapFilterBar({ filters, onFilterChange, availableRepressionTypes }: MapFilterBarProps) {
  const [repressionOpen, setRepressionOpen] = useState(false);

  const activeCount =
    filters.countries.length +
    filters.repressionTypes.length +
    (filters.violentOnly ? 1 : 0);

  const handleCountryChange = (country: string) => {
    const current = filters.countries;
    const updated = current.includes(country)
      ? current.filter((c) => c !== country)
      : [country]; // single-select: replace
    onFilterChange({ ...filters, countries: updated });
  };

  const handleRepressionToggle = (type: string) => {
    const current = filters.repressionTypes;
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFilterChange({ ...filters, repressionTypes: updated });
  };

  const clearFilters = () => {
    onFilterChange({ countries: [], repressionTypes: [], violentOnly: false });
    setRepressionOpen(false);
  };

  return (
    <div className="absolute top-3 left-3 z-[1000] glass rounded-lg p-3 max-w-[280px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-0.5"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Country */}
      <div className="mb-2">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Country</div>
        <div className="flex gap-1 flex-wrap">
          {COUNTRIES.map((c) => (
            <button
              key={c}
              onClick={() => handleCountryChange(c)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                filters.countries.includes(c)
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Repression Type */}
      <div className="mb-2">
        <button
          onClick={() => setRepressionOpen(!repressionOpen)}
          className="flex items-center justify-between w-full text-[10px] text-gray-500 uppercase tracking-wider mb-1"
        >
          <span>Repression Type</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${repressionOpen ? "rotate-180" : ""}`} />
        </button>
        {repressionOpen && (
          <div className="max-h-[140px] overflow-y-auto space-y-0.5 pr-1">
            {availableRepressionTypes.map((type) => (
              <label
                key={type}
                className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-300 cursor-pointer py-0.5"
              >
                <input
                  type="checkbox"
                  checked={filters.repressionTypes.includes(type)}
                  onChange={() => handleRepressionToggle(type)}
                  className="rounded border-gray-600 bg-transparent text-blue-500 focus:ring-0 focus:ring-offset-0 h-3 w-3"
                />
                <span className="truncate">{REPRESSION_SHORT_LABELS[type] || type}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Violence Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.violentOnly}
          onChange={(e) => onFilterChange({ ...filters, violentOnly: e.target.checked })}
          className="rounded border-gray-600 bg-transparent text-red-500 focus:ring-0 focus:ring-offset-0 h-3 w-3"
        />
        <span className="text-[11px] text-gray-400">Violent events only</span>
      </label>
    </div>
  );
}
