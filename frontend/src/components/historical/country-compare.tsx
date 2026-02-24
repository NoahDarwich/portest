"use client";

import { useState, useEffect } from "react";
import { api, HistoricalKPIsResponse } from "@/lib/api";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const COUNTRY_COLORS: Record<string, string> = {
  Iraq: "#6fa8c9",
  Lebanon: "#c97b7b",
  Egypt: "#d4a87c",
};

const TOOLTIP_STYLE = {
  backgroundColor: "#1c1e26",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "6px",
  fontSize: "11px",
  color: "#e4e4e7",
};

type CountryKPIs = HistoricalKPIsResponse & { country: string };

const METRICS = [
  { key: "repressed_pct", label: "Repressed %" },
  { key: "injury_pct", label: "Injury %" },
  { key: "lethal_pct", label: "Lethal %" },
  { key: "arrest_pct", label: "Arrest %" },
] as const;

export function CountryCompare() {
  const [rows, setRows] = useState<CountryKPIs[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      api.getHistoricalKPIs("Iraq").then((d) => ({ ...d, country: "Iraq" })),
      api.getHistoricalKPIs("Lebanon").then((d) => ({ ...d, country: "Lebanon" })),
      api.getHistoricalKPIs("Egypt").then((d) => ({ ...d, country: "Egypt" })),
    ])
      .then(setRows)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error || !rows) {
    return <p className="text-xs text-red-400 py-2">Failed to load comparison data.</p>;
  }

  // Build chart data: one entry per metric, values per country
  const chartData = METRICS.map(({ key, label }) => {
    const entry: Record<string, string | number> = { metric: label };
    for (const row of rows) {
      entry[row.country] = row[key as keyof HistoricalKPIsResponse] as number;
    }
    return entry;
  });

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Country Comparison — Repression Rates
        </h3>
        <p className="text-[10px] text-gray-600 mt-0.5">
          Normalized rates (% of events) across Iraq, Lebanon, and Egypt
        </p>
      </div>

      {/* Event count summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {rows.map((r) => (
          <div
            key={r.country}
            className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-4 py-3 text-center"
            style={{ borderTopColor: COUNTRY_COLORS[r.country], borderTopWidth: 2 }}
          >
            <div
              className="text-sm font-bold"
              style={{ color: COUNTRY_COLORS[r.country] }}
            >
              {r.country}
            </div>
            <div className="text-lg font-bold text-white tabular-nums mt-1">
              {r.total_events.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-600">events</div>
          </div>
        ))}
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="metric"
              fontSize={10}
              tickLine={false}
              stroke="#525252"
              tick={{ fill: "#a1a1aa" }}
            />
            <YAxis
              tickFormatter={(v) => `${v}%`}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#737373" }}
              width={36}
            />
            <Tooltip
              formatter={(value, name) => [`${value}%`, name]}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "#e4e4e7" }}
              labelStyle={{ color: "#a1a1aa", fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => (
                <span style={{ color: COUNTRY_COLORS[value as string] ?? "#a1a1aa" }}>
                  {value}
                </span>
              )}
            />
            {["Iraq", "Lebanon", "Egypt"].map((c) => (
              <Bar
                key={c}
                dataKey={c}
                fill={COUNTRY_COLORS[c]}
                radius={[3, 3, 0, 0]}
                opacity={0.85}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
