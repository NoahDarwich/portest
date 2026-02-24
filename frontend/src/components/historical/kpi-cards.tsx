"use client";

import { useState, useEffect } from "react";
import { api, HistoricalKPIsResponse } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface KpiCardsProps {
  country?: string;
}

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}

function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  return (
    <div
      className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 flex flex-col gap-2"
      style={{ borderLeftColor: accent, borderLeftWidth: 2 }}
    >
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-2xl font-bold text-white tabular-nums">{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}

export function KpiCards({ country }: KpiCardsProps) {
  const [data, setData] = useState<HistoricalKPIsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api
      .getHistoricalKPIs(country)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [country]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 flex items-center justify-center h-24"
          >
            <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-xs text-red-400 py-2">Failed to load statistics. Is the backend running?</p>
    );
  }

  const cards = [
    {
      label: "Total Events",
      value: data.total_events.toLocaleString(),
      sub: "documented protests",
      accent: "#6fa8c9",
    },
    {
      label: "Repressed",
      value: `${data.repressed_pct}%`,
      sub: `${data.repressed_count.toLocaleString()} events with state response`,
      accent: "#d4a87c",
    },
    {
      label: "Casualties",
      value: (data.total_killed + data.total_injured).toLocaleString(),
      sub: `${data.total_killed.toLocaleString()} killed · ${data.total_injured.toLocaleString()} injured`,
      accent: "#c97b7b",
    },
    {
      label: "Arrests",
      value: data.total_arrested.toLocaleString(),
      sub: `${data.arrest_pct}% of protests led to detentions`,
      accent: "#b07090",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((c) => (
        <KpiCard key={c.label} {...c} />
      ))}
    </div>
  );
}
