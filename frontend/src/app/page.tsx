"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtestMap } from "@/components/protest-map";
import { FilterSidebar } from "@/components/filter-toolbar";
import { PredictionPanel } from "@/components/prediction-panel";
import { HistoricalPanel } from "@/components/historical-panel";
import { api, PredictionInput, PredictionResponse } from "@/lib/api";
import { MapFilters, DEFAULT_FILTERS } from "@/lib/types";
import { AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";

type PanelTab = "predict" | "historical" | null;

export default function Home() {
  const [results, setResults] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>(null);

  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [availableRepressionTypes, setAvailableRepressionTypes] = useState<string[]>([]);
  const [availableDemandTypes, setAvailableDemandTypes] = useState<string[]>([]);
  const [availableTactics, setAvailableTactics] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);

  const handlePredict = async (input: PredictionInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.predict(input);
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvailableFilters = useCallback(
    (data: { repressionTypes: string[]; demandTypes: string[]; tactics: string[]; years: number[]; months: number[] }) => {
      setAvailableRepressionTypes(data.repressionTypes);
      setAvailableDemandTypes(data.demandTypes);
      setAvailableTactics(data.tactics);
      setAvailableYears(data.years);
      setAvailableMonths(data.months);
    },
    []
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0f1117] flex flex-col">
      {/* ── Header ── */}
      <AppHeader
        activePanel={activeTab}
        onPanelChange={setActiveTab}
      />

      {/* Error Banner */}
      {error && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2 text-xs text-red-400 z-[1003]">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-300 text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* ── Main content: Map + Filter Sidebar ── */}
      <div className="flex-1 flex min-h-0 relative">
        <div className="flex-1 min-w-0 relative">
          <ProtestMap
            filters={filters}
            onAvailableFiltersReady={handleAvailableFilters}
          />

          {/* Predict curtain */}
          {activeTab === "predict" && (
            <div
              key="predict"
              className="curtain-panel absolute top-0 left-0 right-0 z-[1001] border-b border-white/[0.06] shadow-xl shadow-black/40"
              style={{ background: "rgba(12, 13, 18, 0.92)", backdropFilter: "blur(24px)" }}
            >
              <PredictionPanel
                results={results}
                isLoading={isLoading}
                onPredict={handlePredict}
              />
            </div>
          )}

          {/* Historical curtain */}
          {activeTab === "historical" && (
            <div
              key="historical"
              className="curtain-panel absolute top-0 left-0 right-0 z-[1001] border-b border-white/[0.06] shadow-xl shadow-black/40"
              style={{ background: "rgba(12, 13, 18, 0.96)", backdropFilter: "blur(24px)", maxHeight: "calc(100vh - 3.5rem)", overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
              <HistoricalPanel />
            </div>
          )}
        </div>

        <FilterSidebar
          filters={filters}
          onFilterChange={setFilters}
          availableRepressionTypes={availableRepressionTypes}
          availableDemandTypes={availableDemandTypes}
          availableTactics={availableTactics}
          availableYears={availableYears}
          availableMonths={availableMonths}
        />
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 flex items-center justify-between px-10 py-3 border-t border-white/[0.06] bg-[#0c0d12]">
        {/* Left: copyright */}
        <p className="text-sm text-gray-600">
          © {new Date().getFullYear()} Pro-Test
        </p>

        {/* Center: tagline */}
        <p className="hidden md:block text-sm text-gray-600 italic">
          Predictive Modelling for a Safer Forum of Dissent
        </p>

        {/* Right: author + GitHub */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/NoahDarwich/portest"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            GitHub
          </a>
          <div className="w-px h-4 bg-white/10" />
          <a
            href="https://www.noahdarwich.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Noah Darwich
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </footer>
    </div>
  );
}
