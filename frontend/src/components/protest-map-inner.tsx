"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import type { MapDataPoint } from "@/lib/api";

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

interface ProtestMapInnerProps {
  points: MapDataPoint[];
}

export default function ProtestMapInner({ points }: ProtestMapInnerProps) {
  return (
    <MapContainer
      center={[30.5852, 36.2384]}
      zoom={4}
      style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <HeatmapLayer points={points} />
    </MapContainer>
  );
}
