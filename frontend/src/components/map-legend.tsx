"use client";

import { REPRESSION_SHORT_LABELS, REPRESSION_COLORS } from "@/lib/constants";
import { MapFilters } from "@/lib/types";

interface MapLegendProps {
  repressionCounts: Record<string, number>;
  filters: MapFilters;
}

export function MapLegend({ repressionCounts, filters }: MapLegendProps) {
  const repressionKeys = Object.keys(REPRESSION_SHORT_LABELS);

  const sortedEntries = repressionKeys
    .filter((key) => repressionCounts[key] !== undefined)
    .sort((a, b) => (repressionCounts[b] || 0) - (repressionCounts[a] || 0));

  if (sortedEntries.length === 0) return null;

  return (
    <div className="absolute bottom-3 left-3 z-[1000] glass rounded-lg p-2.5 max-w-[200px]">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Repression Type</div>
      <div className="space-y-0.5">
        {sortedEntries.map((key, i) => {
          const isFiltered = filters.repressionTypes.length > 0 && !filters.repressionTypes.includes(key);
          return (
            <div
              key={key}
              className={`flex items-center gap-1.5 w-full transition-opacity ${
                isFiltered ? "opacity-30" : "opacity-100"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: REPRESSION_COLORS[i % REPRESSION_COLORS.length] }}
              />
              <span className="text-[10px] text-gray-400 truncate flex-1">
                {REPRESSION_SHORT_LABELS[key]}
              </span>
              <span className="text-[9px] text-gray-600 tabular-nums">
                {(repressionCounts[key] || 0).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
