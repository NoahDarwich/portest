"use client";

import { PredictionResponse } from "@/lib/api";
import { METHOD_LABELS, getBarColor } from "@/lib/constants";
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

  const chartData = Object.entries(results.predictions)
    .map(([key, pred]) => ({
      name: METHOD_LABELS[key] || key,
      probability: Math.round(pred.probability * 100),
      raw: pred.probability,
    }))
    .sort((a, b) => b.probability - a.probability);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-gray-400">Predicted Repression Methods</h3>
        {results.cached && (
          <span className="text-[10px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded">cached</span>
        )}
      </div>
      <div className="h-[250px] w-full">
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
              width={110}
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
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.raw)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
