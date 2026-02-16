"use client";

import { useState, useEffect } from "react";
import { ProtestMap } from "@/components/protest-map";
import { OverlayPanels } from "@/components/bottom-panel";
import { api, PredictionInput, PredictionResponse, HealthResponse } from "@/lib/api";
import { AlertTriangle, CheckCircle, HelpCircle, Brain } from "lucide-react";
import Link from "next/link";

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
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

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

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0f1117] relative">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[1002] h-12 flex items-center justify-between px-4" style={{ background: "rgba(15, 17, 23, 0.7)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-white tracking-tight">PRO-TEST</h1>
          <span className="hidden sm:inline text-[10px] text-gray-600 font-mono">v2.0</span>
        </div>
        <div className="flex items-center gap-3">
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
        <div className="absolute top-[104px] left-0 right-0 z-[1003] px-4 py-2 bg-red-500/10 backdrop-blur-sm border-b border-red-500/20 flex items-center gap-2 text-xs text-red-400">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Map — fills entire viewport */}
      <div className="absolute inset-0">
        <ProtestMap onCountrySelect={setSelectedCountry} />
      </div>

      {/* Tab bar + panels */}
      <OverlayPanels
        results={results}
        isLoading={isLoading}
        onPredict={handlePredict}
        selectedCountry={selectedCountry}
      />
    </div>
  );
}
