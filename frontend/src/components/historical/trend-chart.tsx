"use client";

import { useState, useEffect } from "react";
import { api, HistoricalTrendsResponse } from "@/lib/api";
import { Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
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

function formatMonth(m: string): string {
  const [year, month] = m.split("-");
  return `${year}-${month.padStart(2, "0")}`;
}

// Build a set of tick labels to show on the X-axis — only at year boundaries and period starts
function buildTickSet(months: string[]): Set<string> {
  const ticks = new Set<string>();
  let lastYear = "";
  for (const m of months) {
    const year = m.split("-")[0];
    if (year !== lastYear) {
      ticks.add(formatMonth(m));
      lastYear = year;
    }
  }
  return ticks;
}

interface TrendChartProps {
  country?: string;
}

export function TrendChart({ country }: TrendChartProps) {
  const [data, setData] = useState<HistoricalTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api
      .getHistoricalTrends(country)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [country]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error) return <p className="text-xs text-red-400 py-2">Failed to load trends.</p>;
  if (!data || data.monthly.length === 0) return null;

  // Detect if mixed time periods are shown (Egypt 2011-13 + Iraq/Lebanon 2019-20)
  const hasMixedPeriods = data.monthly.some((m) => m.Egypt > 0) &&
    data.monthly.some((m) => m.Iraq > 0 || m.Lebanon > 0);

  // Determine which countries have data in this view
  const activeCountries = (["Iraq", "Lebanon", "Egypt"] as const).filter((c) =>
    data.monthly.some((m) => m[c] > 0)
  );

  // Build chart data, inserting a gap entry between the two periods when mixed
  type ChartRow = { month: string; Egypt: number | null; Iraq: number | null; Lebanon: number | null };
  let chartData: ChartRow[];
  if (hasMixedPeriods) {
    const lastEgyptIdx = data.monthly.reduce((acc, m, i) => (m.Egypt > 0 ? i : acc), -1);
    const formatted = data.monthly.map((d) => ({
      month: formatMonth(d.month),
      Egypt: d.Egypt || null,
      Iraq: d.Iraq || null,
      Lebanon: d.Lebanon || null,
    }));
    chartData = [
      ...formatted.slice(0, lastEgyptIdx + 1),
      { month: "─ 6-yr gap ─", Egypt: null, Iraq: null, Lebanon: null },
      ...formatted.slice(lastEgyptIdx + 1),
    ];
  } else {
    chartData = data.monthly.map((d) => ({
      month: formatMonth(d.month),
      Egypt: d.Egypt || null,
      Iraq: d.Iraq || null,
      Lebanon: d.Lebanon || null,
    }));
  }

  // Only tick at year boundaries to avoid crowding
  const rawMonths = data.monthly.map((d) => d.month);
  const tickSet = buildTickSet(rawMonths);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Monthly Protest Activity
        </h3>
        <p className="text-[10px] text-gray-600 mt-0.5">
          {hasMixedPeriods
            ? "Egypt (2011–2013) and Iraq/Lebanon (2019–2020) — different historical periods"
            : country
            ? `${country} protest events by month`
            : "Iraq and Lebanon — October 2019 to March 2020"}
        </p>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              {activeCountries.map((c) => (
                <linearGradient key={c} id={`grad-${c}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COUNTRY_COLORS[c]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COUNTRY_COLORS[c]} stopOpacity={0.03} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="month"
              fontSize={10}
              tickLine={false}
              stroke="#525252"
              tick={{ fill: "#737373" }}
              tickFormatter={(v) => (tickSet.has(v) || v.includes("gap") ? v : "")}
              interval={0}
            />
            <YAxis
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#737373" }}
              width={35}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "#e4e4e7" }}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#a1a1aa", paddingTop: 8 }}
              formatter={(value) => (
                <span style={{ color: COUNTRY_COLORS[value as keyof typeof COUNTRY_COLORS] ?? "#a1a1aa" }}>
                  {value}
                </span>
              )}
            />
            {activeCountries.map((c) => (
              <Area
                key={c}
                type="monotone"
                dataKey={c}
                stroke={COUNTRY_COLORS[c]}
                strokeWidth={2}
                fill={`url(#grad-${c})`}
                dot={false}
                connectNulls={false}
                activeDot={{ r: 4, fill: COUNTRY_COLORS[c] }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
