"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { api, MapDataPoint } from "@/lib/api";
import { MapFilters, DEFAULT_FILTERS } from "@/lib/types";
import { MapFilterBar } from "./map-filter-bar";
import { MapLegend } from "./map-legend";
import { Loader2, MapPin } from "lucide-react";

const ProtestMapInner = dynamic(() => import("./protest-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
    </div>
  ),
});

interface ProtestMapProps {
  onCountrySelect?: (country: string | null) => void;
}

export function ProtestMap({ onCountrySelect }: ProtestMapProps) {
  const [points, setPoints] = useState<MapDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    async function loadMapData() {
      try {
        const data = await api.getMapData();
        setPoints(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load map data");
      } finally {
        setLoading(false);
      }
    }
    loadMapData();
  }, []);

  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (filters.countries.length > 0 && !filters.countries.includes(p.country)) {
        return false;
      }
      if (filters.repressionTypes.length > 0 && !filters.repressionTypes.includes(p.repression)) {
        return false;
      }
      if (filters.violentOnly && p.violence_heat === 0) {
        return false;
      }
      return true;
    });
  }, [points, filters]);

  const repressionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredPoints.forEach((p) => {
      counts[p.repression] = (counts[p.repression] || 0) + 1;
    });
    return counts;
  }, [filteredPoints]);

  const availableRepressionTypes = useMemo(() => {
    const types = new Set<string>();
    points.forEach((p) => types.add(p.repression));
    return Array.from(types);
  }, [points]);

  const handleFilterChange = (newFilters: MapFilters) => {
    setFilters(newFilters);
    if (newFilters.countries.length === 1) {
      onCountrySelect?.(newFilters.countries[0]);
    } else {
      onCountrySelect?.(null);
    }
  };

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <MapPin className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <ProtestMapInner points={filteredPoints} />

      {!loading && (
        <>
          <MapFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            availableRepressionTypes={availableRepressionTypes}
          />

          <MapLegend
            repressionCounts={repressionCounts}
            filters={filters}
            onToggleRepression={(type) => {
              const current = filters.repressionTypes;
              const updated = current.includes(type)
                ? current.filter((t) => t !== type)
                : [...current, type];
              handleFilterChange({ ...filters, repressionTypes: updated });
            }}
          />

          <div className="absolute bottom-3 right-3 glass px-3 py-1.5 rounded-md text-xs text-gray-300 z-[1000]">
            {filteredPoints.length.toLocaleString()} events
            {filteredPoints.length !== points.length && (
              <span className="text-gray-500"> / {points.length.toLocaleString()}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
