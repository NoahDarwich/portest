"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import type { MapDataPoint } from "@/lib/api";
import type { ColorMode } from "@/lib/types";
import { REPRESSION_COLORS, REPRESSION_SHORT_LABELS, SEVERITY_COLORS, SEVERITY_LABELS } from "@/lib/constants";

// Build repression → color map for "type" mode
const REPRESSION_COLOR_MAP: Record<string, string> = {};
const repressionKeys = Object.keys(REPRESSION_SHORT_LABELS);
repressionKeys.forEach((key, i) => {
  REPRESSION_COLOR_MAP[key] = REPRESSION_COLORS[i % REPRESSION_COLORS.length];
});

function getPointColor(point: MapDataPoint, colorMode: ColorMode): string {
  if (colorMode === "severity") {
    return SEVERITY_COLORS[point.severity] || SEVERITY_COLORS[0];
  }
  return REPRESSION_COLOR_MAP[point.repression] || "#94a3b8";
}

function HeatmapLayer({ points, colorMode }: { points: MapDataPoint[]; colorMode: ColorMode }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const heatData: [number, number, number][] = points.map((p) => [
      p.lat,
      p.lng,
      colorMode === "severity"
        ? 0.2 + (p.severity / 5) * 0.8 // severity 0→0.2, severity 5→1.0
        : 0.5 + p.violence_heat * 0.5,
    ]);

    const gradient: Record<number, string> =
      colorMode === "severity"
        ? {
            0: "#4b5563",
            0.25: "#3b82f6",
            0.45: "#eab308",
            0.65: "#f97316",
            0.85: "#ef4444",
            1: "#991b1b",
          }
        : {
            0.2: "#ffffb2",
            0.4: "#fecc5c",
            0.6: "#fd8d3c",
            0.8: "#f03b20",
            1: "#bd0026",
          };

    const heat = L.heatLayer(heatData, {
      radius: 10,
      blur: 12,
      maxZoom: 10,
      minOpacity: 0.3,
      gradient,
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points, colorMode]);

  return null;
}

function ZoomAwareMarkers({ points, colorMode }: { points: MapDataPoint[]; colorMode: ColorMode }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on("zoomend", onZoom);
    return () => {
      map.off("zoomend", onZoom);
    };
  }, [map]);

  if (zoom < 8 || !points.length) return null;

  return (
    <>
      {points.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lng]}
          radius={5}
          pathOptions={{
            fillColor: getPointColor(p, colorMode),
            fillOpacity: 0.8,
            color: "rgba(255,255,255,0.3)",
            weight: 1,
          }}
        >
          <Popup>
            <div className="text-xs leading-relaxed min-w-[140px]">
              <div className="font-semibold text-gray-900">{p.country}</div>
              <div className="text-gray-600">
                {REPRESSION_SHORT_LABELS[p.repression] || p.repression}
              </div>
              {p.demand && (
                <div className="text-gray-500">Demand: {p.demand}</div>
              )}
              {p.tactic && (
                <div className="text-gray-500">Tactic: {p.tactic}</div>
              )}
              <div className="mt-1 flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: SEVERITY_COLORS[p.severity] }}
                />
                <span className="text-gray-500">
                  Severity: {SEVERITY_LABELS[p.severity] || "Unknown"}
                </span>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}

interface ProtestMapInnerProps {
  points: MapDataPoint[];
  colorMode: ColorMode;
}

export default function ProtestMapInner({ points, colorMode }: ProtestMapInnerProps) {
  const [mapReady, setMapReady] = useState(false);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  return (
    <MapContainer
      center={[30.5852, 36.2384]}
      zoom={5}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
      zoomControl={true}
      whenReady={handleMapReady}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {mapReady && (
        <>
          <HeatmapLayer points={points} colorMode={colorMode} />
          <ZoomAwareMarkers points={points} colorMode={colorMode} />
        </>
      )}
    </MapContainer>
  );
}
