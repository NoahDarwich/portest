"use client";

import { PredictionResponse } from "@/lib/api";
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

const METHOD_LABELS: Record<string, string> = {
  teargas: "Tear Gas",
  rubberbullets: "Rubber Bullets",
  liveammo: "Live Ammo",
  sticks: "Sticks/Batons",
  surround: "Surround",
  cleararea: "Area Cleared",
  policerepress: "Police Repression",
};

function getBarColor(probability: number): string {
  if (probability >= 0.7) return "#bd0026";
  if (probability >= 0.5) return "#f03b20";
  if (probability >= 0.3) return "#fd8d3c";
  if (probability >= 0.15) return "#fecc5c";
  return "#ffffb2";
}

interface MethodsChartProps {
  results: PredictionResponse | null;
}

export function MethodsChart({ results }: MethodsChartProps) {
  if (!results) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Predicted Repression Methods</h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Shield className="h-10 w-10 mb-3" />
          <p className="text-sm">Submit the form to see predictions</p>
        </div>
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Predicted Repression Methods</h3>
        {results.cached && (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">cached</span>
        )}
      </div>
      <div className="h-[280px] w-full">
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
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Probability"]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.raw)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-400 text-center mt-2">
        Predicted probability of each repression method being used
      </p>
    </div>
  );
}
