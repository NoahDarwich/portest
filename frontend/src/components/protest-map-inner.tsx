"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import type { MapDataPoint } from "@/lib/api";
import { REPRESSION_COLORS, REPRESSION_SHORT_LABELS } from "@/lib/constants";

const REPRESSION_COLOR_MAP: Record<string, string> = {};
const repressionKeys = Object.keys(REPRESSION_SHORT_LABELS);
repressionKeys.forEach((key, i) => {
  REPRESSION_COLOR_MAP[key] = REPRESSION_COLORS[i % REPRESSION_COLORS.length];
});

function getRepressionColor(repression: string): string {
  return REPRESSION_COLOR_MAP[repression] || "#94a3b8";
}

function HeatmapLayer({ points }: { points: MapDataPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const heatData: [number, number, number][] = points.map((p) => [
      p.lat,
      p.lng,
      0.5 + p.violence_heat * 0.5,
    ]);

    const heat = L.heatLayer(heatData, {
      radius: 10,
      blur: 12,
      maxZoom: 10,
      minOpacity: 0.3,
      gradient: {
        0.2: "#ffffb2",
        0.4: "#fecc5c",
        0.6: "#fd8d3c",
        0.8: "#f03b20",
        1.0: "#bd0026",
      },
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
}

function ZoomAwareMarkers({ points }: { points: MapDataPoint[] }) {
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
            fillColor: getRepressionColor(p.repression),
            fillOpacity: 0.8,
            color: "rgba(255,255,255,0.3)",
            weight: 1,
          }}
        >
          <Popup>
            <div className="text-xs leading-relaxed">
              <div className="font-semibold text-gray-900">{p.country}</div>
              <div className="text-gray-600">
                {REPRESSION_SHORT_LABELS[p.repression] || p.repression}
              </div>
              <div className="text-gray-500">
                {p.violence_heat > 0 ? "Violent" : "Non-violent"}
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
}

export default function ProtestMapInner({ points }: ProtestMapInnerProps) {
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
          <HeatmapLayer points={points} />
          <ZoomAwareMarkers points={points} />
        </>
      )}
    </MapContainer>
  );
}
