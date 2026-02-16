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
} from "recharts";

interface RepressionOverviewProps {
  country?: string | null;
}

export function RepressionOverview({ country }: RepressionOverviewProps) {
  const [data, setData] = useState<RepressionStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const stats = await api.getRepressionStats(country || undefined);
        setData(stats);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [country]);

  const title = country
    ? `Historical Repression - ${country} (2017-2022)`
    : "Historical Repression Patterns (2017-2022)";

  if (loading) {
    return (
      <div>
        <h3 className="text-xs font-medium text-gray-400 mb-4">{title}</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <h3 className="text-xs font-medium text-gray-400 mb-4">{title}</h3>
        <p className="text-sm text-gray-600 text-center py-4">{error || "No data available"}</p>
      </div>
    );
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
      <h3 className="text-xs font-medium text-gray-400 mb-1">{title}</h3>
      <p className="text-[10px] text-gray-600 mb-3">
        Distribution of {data.total.toLocaleString()} documented events
      </p>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
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
              width={150}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#a1a1aa" }}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Frequency"]}
              contentStyle={{
                backgroundColor: "#1c1e26",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                fontSize: "11px",
                color: "#e4e4e7",
              }}
              itemStyle={{ color: "#e4e4e7" }}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={REPRESSION_COLORS[index % REPRESSION_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
