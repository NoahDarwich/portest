"use client";

import { useState, useEffect } from "react";
import { api, HistoricalCrossTabResponse } from "@/lib/api";
import { REPRESSION_COLORS } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "#1c1e26",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "6px",
  fontSize: "11px",
  color: "#e4e4e7",
};

// Short display names for tactics
function shortTactic(t: string): string {
  const map: Record<string, string> = {
    "Demonstration / protest": "Demonstration",
    "Roadblock or blockade": "Roadblock",
    "Occupation / sit-in": "Sit-in",
    "Mass attack or mob": "Mass attack",
    "Funeral march": "Funeral march",
    "Human chain": "Human chain",
  };
  return map[t] ?? t;
}

interface CrossTabChartProps {
  country?: string;
}

export function CrossTabChart({ country }: CrossTabChartProps) {
  const [data, setData] = useState<HistoricalCrossTabResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api
      .getHistoricalCrossTab(country)
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

  if (error) return <p className="text-xs text-red-400 py-2">Failed to load cross-tab data.</p>;
  if (!data || data.data.length === 0) return null;

  const chartData = data.data.map((row) => ({
    ...row,
    tactic: shortTactic(row.tactic as string),
  }));

  // Exclude "tactic" and "total" from bar keys
  const barKeys = data.repression_labels;

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Protest Tactic × Repression Response
        </h3>
        <p className="text-[10px] text-gray-600 mt-0.5">
          % of events per tactic that resulted in each repression type (row-normalized to 100%)
        </p>
      </div>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 5, left: 0, bottom: 0 }}
            barSize={22}
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
              dataKey="tactic"
              width={115}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#a1a1aa" }}
            />
            <Tooltip
              formatter={(value, name) => [`${value}%`, name]}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "#e4e4e7" }}
              labelStyle={{ color: "#a1a1aa", fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, color: "#6b7280", paddingTop: 8 }}
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: "#6b7280" }}>{value}</span>
              )}
            />
            {barKeys.map((label, index) => (
              <Bar
                key={label}
                dataKey={label}
                stackId="stack"
                fill={REPRESSION_COLORS[index % REPRESSION_COLORS.length]}
                radius={
                  index === barKeys.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]
                }
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sample size footnote */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {data.data.map((row) => (
          <span key={row.tactic as string} className="text-[10px] text-gray-600">
            {shortTactic(row.tactic as string)}: n={Number(row.total).toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  );
}
