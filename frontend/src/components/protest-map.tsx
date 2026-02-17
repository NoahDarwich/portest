"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { api, MapDataPoint } from "@/lib/api";
import { MapFilters } from "@/lib/types";
import { MapLegend } from "./map-legend";
import { Loader2, MapPin } from "lucide-react";

const ProtestMapInner = dynamic(
  () => import("./protest-map-inner"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    ),
  }
) as React.ComponentType<{ points: MapDataPoint[]; colorMode: "type" | "severity" }>;

interface ProtestMapProps {
  filters: MapFilters;
  onAvailableFiltersReady?: (data: {
    repressionTypes: string[];
    demandTypes: string[];
    tactics: string[];
  }) => void;
}

export function ProtestMap({ filters, onAvailableFiltersReady }: ProtestMapProps) {
  const [points, setPoints] = useState<MapDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMapData() {
      try {
        const data = await api.getMapData();
        setPoints(data);
        setError(null);

        const repressionTypes = [...new Set(data.map((p) => p.repression).filter(Boolean))];
        const demandTypes = [...new Set(data.map((p) => p.demand).filter(Boolean))].sort();
        const tactics = [...new Set(data.map((p) => p.tactic).filter(Boolean))].sort();
        onAvailableFiltersReady?.({ repressionTypes, demandTypes, tactics });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load map data");
      } finally {
        setLoading(false);
      }
    }
    loadMapData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (filters.countries.length > 0 && !filters.countries.includes(p.country)) return false;
      if (filters.repressionTypes.length > 0 && !filters.repressionTypes.includes(p.repression)) return false;
      if (filters.demandTypes.length > 0 && !filters.demandTypes.includes(p.demand)) return false;
      if (filters.tactics.length > 0 && !filters.tactics.includes(p.tactic)) return false;
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
      <ProtestMapInner points={filteredPoints} colorMode={filters.colorMode} />

      {!loading && (
        <>
          {filters.colorMode === "type" && (
            <MapLegend
              repressionCounts={repressionCounts}
              filters={filters}
            />
          )}

          <div className="absolute bottom-3 right-3 glass px-3.5 py-2 rounded-lg text-sm text-gray-300 z-[1000]">
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
