"use client";

import { useState, useEffect } from "react";
import { api, RepressionStatsResponse } from "@/lib/api";
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

const SHORT_LABELS: Record<string, string> = {
  "No known coercion, no security presence": "No coercion",
  "Security forces or other repressive groups present at event": "Repressive groups present",
  "Injuries inflicted": "Injuries",
  "Physical harassment": "Physical harassment",
  "Security forces present at event": "Security present",
  "Deaths inflicted": "Deaths",
  "Army present at event": "Army present",
  "Arrests / detentions": "Arrests",
  "Party Militias/ Baltagia present at event": "Militias present",
  "Participants summoned to security facility": "Summoned to facility",
};

const COLORS = [
  "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe",
  "#dbeafe", "#e0f2fe", "#f0f9ff", "#f8fafc", "#f9fafb",
];

export function RepressionOverview() {
  const [data, setData] = useState<RepressionStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const stats = await api.getRepressionStats();
        setData(stats);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Historical Repression Patterns (2017-2022)
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Historical Repression Patterns (2017-2022)
        </h3>
        <p className="text-sm text-gray-500 text-center py-4">{error || "No data available"}</p>
      </div>
    );
  }

  const chartData = Object.entries(data.counts)
    .map(([name, count]) => ({
      name: SHORT_LABELS[name] || name,
      count,
      pct: Math.round((count / data.total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">
        Historical Repression Patterns (2017-2022)
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Distribution of {data.total.toLocaleString()} documented events - for context, not predictions
      </p>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tickFormatter={(v) => `${v}%`}
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Frequency"]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
