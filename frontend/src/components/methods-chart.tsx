"use client";

import { PredictionResponse } from "@/lib/api";
import { SEVERITY_COLORS, SEVERITY_LABELS } from "@/lib/constants";
import { Shield } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface MethodsChartProps {
  results: PredictionResponse | null;
}

export function MethodsChart({ results }: MethodsChartProps) {
  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-gray-600">
        <Shield className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-xs">Submit the form to see predictions</p>
      </div>
    );
  }

  const level = results.repression_level;
  const color = SEVERITY_COLORS[level] || "#6b7280";
  const label = SEVERITY_LABELS[level] || results.repression_label;

  const chartData = Object.entries(results.level_probabilities)
    .map(([key, prob]) => ({
      level: parseInt(key),
      name: SEVERITY_LABELS[parseInt(key)] || key,
      probability: Math.round(prob * 100),
      raw: prob,
    }))
    .sort((a, b) => a.level - b.level);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-gray-400">Predicted Repression Level</h3>
        {results.cached && (
          <span className="text-[10px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded">cached</span>
        )}
      </div>

      {/* Prominent level indicator */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg mb-4"
        style={{ background: `${color}18`, border: `1px solid ${color}40` }}
      >
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
        <div>
          <div className="text-lg font-semibold" style={{ color }}>
            Level {level} — {label}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {Math.round((results.level_probabilities[String(level)] || 0) * 100)}% probability
          </div>
        </div>
      </div>

      {/* Probability distribution across all levels */}
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
        Level probability distribution
      </div>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              fontSize={10}
              tickLine={false}
              stroke="#525252"
              tick={{ fill: "#737373" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#a1a1aa" }}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Probability"]}
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
            <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={`cell-${entry.level}`}
                  fill={entry.level === level ? color : `${SEVERITY_COLORS[entry.level]}60`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
