"use client";

import { useState } from "react";
import { LayoutDashboard, TrendingUp, BarChart2, Globe } from "lucide-react";
import { KpiCards } from "@/components/historical/kpi-cards";
import { RepressionChart } from "@/components/historical/repression-chart";
import { TrendChart } from "@/components/historical/trend-chart";
import { CrossTabChart } from "@/components/historical/cross-tab-chart";
import { DemandChart } from "@/components/historical/demand-chart";
import { CountryCompare } from "@/components/historical/country-compare";

type Tab = "overview" | "trends" | "compare";
type CountryFilter = "All" | "Iraq" | "Lebanon" | "Egypt";

const TABS: { id: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, description: "Key stats & repression distribution" },
  { id: "trends", label: "Trends", icon: TrendingUp, description: "Monthly protest activity over time" },
  { id: "compare", label: "Compare", icon: BarChart2, description: "Cross-country & demand analysis" },
];

const COUNTRIES: { value: CountryFilter; color?: string }[] = [
  { value: "All" },
  { value: "Iraq", color: "#6fa8c9" },
  { value: "Lebanon", color: "#c97b7b" },
  { value: "Egypt", color: "#d4a87c" },
];

export function HistoricalPanel() {
  const [tab, setTab] = useState<Tab>("overview");
  const [country, setCountry] = useState<CountryFilter>("All");

  const countryParam = country === "All" ? undefined : country;

  return (
    <div className="flex flex-col">
      {/* Fixed header — matches PredictionPanel */}
      <div className="px-8 pt-6 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-200 tracking-tight">Historical Analysis</h2>
            <p className="text-sm text-gray-500 mt-1">
              13,387 documented protest events across Iraq, Lebanon, and Egypt (2011–2020)
            </p>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3">
            {/* Country filter */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Country
              </span>
              <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.08]">
                {COUNTRIES.map(({ value, color }) => (
                  <button
                    key={value}
                    onClick={() => setCountry(value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      country === value
                        ? "bg-white/[0.12] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    {color && country === value && (
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 -mb-px"
                        style={{ backgroundColor: color }}
                      />
                    )}
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">View</span>
              <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.08]">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        tab === t.id
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                          : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content — matches PredictionPanel */}
      <div
        className="overflow-y-auto px-8 pb-6"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.15) transparent" }}
      >
        <p className="text-xs text-gray-600 mb-5">
          {TABS.find((t) => t.id === tab)?.description}
          {countryParam ? ` · ${countryParam}` : " · All countries"}
        </p>

        {tab === "overview" && (
          <div className="space-y-6">
            <KpiCards country={countryParam} />
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
              <RepressionChart country={countryParam} />
            </div>
          </div>
        )}

        {tab === "trends" && (
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
            <TrendChart country={countryParam} />
          </div>
        )}

        {tab === "compare" && (
          <div className="space-y-6">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
              <CountryCompare />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
                <DemandChart country={countryParam} />
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
                <CrossTabChart country={countryParam} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
