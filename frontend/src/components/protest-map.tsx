"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { api, MapDataPoint } from "@/lib/api";
import { Loader2, MapPin } from "lucide-react";

const ProtestMapInner = dynamic(() => import("./protest-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  ),
});

export function ProtestMap() {
  const [points, setPoints] = useState<MapDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <MapPin className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <ProtestMapInner points={points} />
      {!loading && points.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs text-gray-600 shadow-sm z-[1000]">
          {points.length.toLocaleString()} protest events
        </div>
      )}
    </div>
  );
}
