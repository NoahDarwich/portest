"use client";

import { useState, useEffect } from "react";
import { api, FeatureImportanceResponse } from "@/lib/api";
import { BarChart3, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316", "#eab308",
];

function formatFeatureName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Combined Sizes", "Participant Count");
}

export function FeatureImportance() {
  const [data, setData] = useState<FeatureImportanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await api.getFeatureImportance();
        setData(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load feature importance");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center py-12">
        <BarChart3 className="h-10 w-10 mx-auto mb-3 text-gray-700" />
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const chartData = Object.entries(data.feature_importance)
    .map(([name, value]) => ({
      name: formatFeatureName(name),
      value: Math.round(value * 1000) / 10,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <BarChart3 className="h-4 w-4 text-gray-400" />
          Feature Importance
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Top factors influencing predictions (v{data.model_version})
        </p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <XAxis
              type="number"
              domain={[0, "dataMax"]}
              tickFormatter={(v) => `${v}%`}
              fontSize={10}
              stroke="#525252"
              tick={{ fill: "#737373" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={95}
              fontSize={10}
              tickLine={false}
              tick={{ fill: "#a1a1aa" }}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Importance"]}
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
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-gray-600 text-center mt-3">
        Higher values indicate greater influence on prediction outcomes
      </p>
    </div>
  );
}
