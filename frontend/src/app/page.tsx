"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtestMap } from "@/components/protest-map";
import { FilterSidebar } from "@/components/filter-toolbar";
import { PredictionPanel } from "@/components/prediction-panel";
import { api, PredictionInput, PredictionResponse, HealthResponse } from "@/lib/api";
import { MapFilters, DEFAULT_FILTERS } from "@/lib/types";
import { AlertTriangle, CheckCircle, HelpCircle, Brain } from "lucide-react";
import Link from "next/link";

type PanelTab = "predict" | "historical" | null;

function HealthBadge({ health, error }: { health: HealthResponse | null; error: boolean }) {
  if (error) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
        <AlertTriangle className="h-3 w-3" />
        Offline
      </span>
    );
  }
  if (!health) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-white/5 px-2 py-0.5 rounded">
        Connecting...
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
      <CheckCircle className="h-3 w-3" />
      {health.model_loaded ? "Ready" : "Loading"}
    </span>
  );
}

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [results, setResults] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>(null);

  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [availableRepressionTypes, setAvailableRepressionTypes] = useState<string[]>([]);
  const [availableDemandTypes, setAvailableDemandTypes] = useState<string[]>([]);
  const [availableTactics, setAvailableTactics] = useState<string[]>([]);

  const selectedCountry = filters.countries.length === 1 ? filters.countries[0] : null;

  useEffect(() => {
    async function checkHealth() {
      try {
        const healthData = await api.health();
        setHealth(healthData);
        setHealthError(false);
      } catch {
        setHealthError(true);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

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
    (data: { repressionTypes: string[]; demandTypes: string[]; tactics: string[] }) => {
      setAvailableRepressionTypes(data.repressionTypes);
      setAvailableDemandTypes(data.demandTypes);
      setAvailableTactics(data.tactics);
    },
    []
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0f1117] flex flex-col">
      {/* ── Header ── */}
      <header
        className="h-16 flex-shrink-0 flex items-center justify-between px-6 z-[1002]"
        style={{
          background: "#0c0d12",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* Left: Logo */}
        <div className="flex items-center gap-2.5 min-w-[140px]">
          <h1 className="text-lg font-bold text-white tracking-tight">PRO-TEST</h1>
          <span className="hidden sm:inline text-[10px] text-gray-600 font-mono">v2.0</span>
        </div>

        {/* Center: Segmented control tabs */}
        <div className="flex items-center bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
          <button
            onClick={() => setActiveTab(activeTab === "predict" ? null : "predict")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "predict"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
            }`}
          >
            Predict
          </button>
          <button
            onClick={() => setActiveTab(activeTab === "historical" ? null : "historical")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "historical"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
            }`}
          >
            Historical Analysis
          </button>
        </div>

        {/* Right: Nav links + health */}
        <div className="flex items-center gap-3 min-w-[140px] justify-end">
          <Link href="/about" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Guide</span>
          </Link>
          <Link href="/model" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            <Brain className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Model</span>
          </Link>
          <HealthBadge health={health} error={healthError} />
        </div>
      </header>

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

          {/* Curtain overlay — drops down over map */}
          {activeTab && (
            <div
              key={activeTab}
              className="curtain-panel absolute top-0 left-0 right-0 z-[1001] border-b border-white/[0.06] shadow-xl shadow-black/40"
              style={{
                background: "rgba(12, 13, 18, 0.92)",
                backdropFilter: "blur(24px)",
              }}
            >
              <PredictionPanel
                activeTab={activeTab}
                results={results}
                isLoading={isLoading}
                onPredict={handlePredict}
                selectedCountry={selectedCountry}
              />
            </div>
          )}
        </div>

        <FilterSidebar
          filters={filters}
          onFilterChange={setFilters}
          availableRepressionTypes={availableRepressionTypes}
          availableDemandTypes={availableDemandTypes}
          availableTactics={availableTactics}
        />
      </div>
    </div>
  );
}
