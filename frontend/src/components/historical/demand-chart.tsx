"use client";

import { useState, useEffect } from "react";
import { api, HistoricalDemandsResponse } from "@/lib/api";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "#1c1e26",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "6px",
  fontSize: "11px",
  color: "#e4e4e7",
};

function repressionColor(pct: number): string {
  if (pct >= 30) return "#c97b7b";
  if (pct >= 15) return "#c98a5a";
  if (pct >= 8) return "#d4a87c";
  return "#7eb8a4";
}

interface DemandChartProps {
  country?: string;
}

export function DemandChart({ country }: DemandChartProps) {
  const [data, setData] = useState<HistoricalDemandsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api
      .getHistoricalDemands(country)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [country]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error) return <p className="text-xs text-red-400 py-2">Failed to load demand data.</p>;
  if (!data || data.data.length === 0) return null;

  // Limit to top 10 demands
  const chartData = data.data.slice(0, 10).map((d) => ({
    demand: d.demand,
    total: d.total,
    repressed_pct: d.repressed_pct,
    lethal_pct: d.lethal_pct,
  }));

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Demand Type vs. Repression Rate
        </h3>
        <p className="text-[10px] text-gray-600 mt-0.5">
          Bar width = total events · Color = repression rate (green → low, red → high)
        </p>
      </div>

      <div className="h-[310px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 55, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              fontSize={10}
              tickLine={false}
              stroke="#525252"
              tick={{ fill: "#737373" }}
            />
            <YAxis
              type="category"
              dataKey="demand"
              width={175}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#a1a1aa" }}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={TOOLTIP_STYLE} className="px-3 py-2 space-y-1">
                    <p style={{ color: "#a1a1aa" }} className="font-semibold text-[11px]">
                      {d.demand}
                    </p>
                    <p style={{ color: "#e4e4e7" }}>
                      {d.total.toLocaleString()} events
                    </p>
                    <p style={{ color: repressionColor(d.repressed_pct) }}>
                      {d.repressed_pct}% repressed
                    </p>
                    {d.lethal_pct > 0 && (
                      <p style={{ color: "#c97b7b" }}>{d.lethal_pct}% lethal</p>
                    )}
                  </div>
                );
              }}
            />
            <Bar dataKey="total" radius={[0, 4, 4, 0]} activeBar={false}>
              <LabelList
                dataKey="repressed_pct"
                position="right"
                formatter={(v: unknown) => `${v}%`}
                style={{ fontSize: 10, fill: "#6b7280" }}
              />
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={repressionColor(entry.repressed_pct)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Color legend */}
      <div className="mt-2 flex items-center gap-4 text-[10px] text-gray-600">
        <span>Repression rate:</span>
        {[
          { label: "< 8%", color: "#7eb8a4" },
          { label: "8–15%", color: "#d4a87c" },
          { label: "15–30%", color: "#c98a5a" },
          { label: "> 30%", color: "#c97b7b" },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-sm inline-block"
              style={{ background: color }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
