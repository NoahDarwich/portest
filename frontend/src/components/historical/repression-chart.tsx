"use client";

import { useState, useEffect } from "react";
import { api, RepressionStatsResponse } from "@/lib/api";
import { REPRESSION_SHORT_LABELS, REPRESSION_COLORS } from "@/lib/constants";
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

interface RepressionChartProps {
  country?: string;
}

export function RepressionChart({ country }: RepressionChartProps) {
  const [data, setData] = useState<RepressionStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api
      .getRepressionStats(country)
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

  if (error || !data) {
    return <p className="text-xs text-red-400 py-2">Failed to load data.</p>;
  }

  const chartData = Object.entries(data.counts)
    .map(([name, count]) => ({
      name: REPRESSION_SHORT_LABELS[name] || name,
      count,
      pct: Math.round((count / data.total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Repression Type Distribution
        </h3>
        <p className="text-[10px] text-gray-600 mt-0.5">
          {data.total.toLocaleString()} documented events
          {country ? ` · ${country}` : " · all countries"}
        </p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 55, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tickFormatter={(v) => `${v}%`}
              fontSize={10}
              tickLine={false}
              stroke="#525252"
              tick={{ fill: "#737373" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={155}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#a1a1aa" }}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Frequency"]}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "#e4e4e7" }}
              labelStyle={{ color: "#a1a1aa" }}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Bar dataKey="pct" radius={[0, 4, 4, 0]} activeBar={false}>
              <LabelList
                dataKey="pct"
                position="right"
                formatter={(v: unknown) => `${v}%`}
                style={{ fontSize: 10, fill: "#6b7280" }}
              />
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={REPRESSION_COLORS[index % REPRESSION_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
