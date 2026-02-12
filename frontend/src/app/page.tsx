"use client";

import { useState, useEffect } from "react";
import { SidebarForm } from "@/components/sidebar-form";
import { ProtestMap } from "@/components/protest-map";
import { MethodsChart } from "@/components/methods-chart";
import { RepressionOverview } from "@/components/repression-overview";
import { api, PredictionInput, PredictionResponse, HealthResponse } from "@/lib/api";
import { AlertTriangle, CheckCircle, Shield, Brain, Book, HelpCircle } from "lucide-react";
import Link from "next/link";

function HealthBadge({ health, error }: { health: HealthResponse | null; error: boolean }) {
  if (error) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
        <AlertTriangle className="h-3 w-3" />
        API Offline
      </span>
    );
  }

  if (!health) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
        Connecting...
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
      <CheckCircle className="h-3 w-3" />
      {health.model_loaded ? "Model Ready" : "Model Loading"}
    </span>
  );
}

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [results, setResults] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Shield className="h-7 w-7 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Pro-Test</h1>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Predictive Modelling for a Safer Forum of Dissent
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/about"
                className="hidden sm:flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <HelpCircle className="h-4 w-4" />
                Guide
              </Link>
              <Link
                href="/docs"
                className="hidden sm:flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <Book className="h-4 w-4" />
                API Docs
              </Link>
              <Link
                href="/model"
                className="hidden sm:flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <Brain className="h-4 w-4" />
                Model
              </Link>
              <HealthBadge health={health} error={healthError} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout: Sidebar + Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-[320px] flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-20">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Protest Parameters</h2>
              <p className="text-xs text-gray-500 mb-4">
                Configure protest characteristics to predict outcomes
              </p>
              <SidebarForm onPredict={handlePredict} isLoading={isLoading} />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Prediction Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Density Heatmap */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Protest Density Map</h3>
                <p className="text-xs text-gray-500">
                  Heatmap of documented protests across Iraq, Lebanon, and Egypt (2017-2022)
                </p>
              </div>
              <div className="h-[450px] sm:h-[500px]">
                <ProtestMap />
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 xl:grid-cols-2">
              <MethodsChart results={results} />
              <RepressionOverview />
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <p>Pro-Test v2.0 - Predictive Modelling for a Safer Forum of Dissent</p>
            {health && (
              <p>
                API v{health.version} | {health.environment}
                {health.cache_enabled && " | Cache enabled"}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
