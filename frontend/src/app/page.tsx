"use client";

import { useState, useEffect } from "react";
import { PredictionForm } from "@/components/prediction-form";
import { PredictionResults } from "@/components/prediction-results";
import { FeatureImportance } from "@/components/feature-importance";
import { ModelInfo } from "@/components/model-info";
import { api, PredictionInput, PredictionResponse, HealthResponse } from "@/lib/api";
import { AlertTriangle, CheckCircle, Shield, Zap, Brain, Book } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

type TabType = "predict" | "model";

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
        active
          ? "bg-blue-600 text-white"
          : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
      )}
    >
      {children}
    </button>
  );
}

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [results, setResults] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("predict");

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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pro-Test</h1>
                <p className="text-xs text-gray-500">Protest Outcome Prediction</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/docs"
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <Book className="h-4 w-4" />
                API Docs
              </Link>
              <HealthBadge health={health} error={healthError} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-3 mb-6">
          <TabButton active={activeTab === "predict"} onClick={() => setActiveTab("predict")}>
            <Zap className="h-4 w-4" />
            Predict
          </TabButton>
          <TabButton active={activeTab === "model"} onClick={() => setActiveTab("model")}>
            <Brain className="h-4 w-4" />
            Model Info
          </TabButton>
        </div>

        {/* Error Banner */}
        {error && activeTab === "predict" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Prediction Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Predict Tab */}
        {activeTab === "predict" && (
          <>
            {/* Two Column Layout */}
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <PredictionForm onPredict={handlePredict} isLoading={isLoading} />
              </div>
              <div>
                <PredictionResults results={results} />
              </div>
            </div>

            {/* Info Section */}
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Coverage</h3>
                <p className="text-sm text-gray-600">
                  Predictions cover protests in Iraq, Lebanon, and Egypt based on historical data
                  from 2017-2022.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Outcomes</h3>
                <p className="text-sm text-gray-600">
                  7 outcome types predicted: verbal coercion, constraint, mild/severe/deadly
                  physical response, and security/militia presence.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Model</h3>
                <p className="text-sm text-gray-600">
                  Ensemble model combining Random Forest, XGBoost, and LightGBM for robust
                  predictions with calibrated probabilities.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Model Info Tab */}
        {activeTab === "model" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <ModelInfo />
            <FeatureImportance />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>Pro-Test v2.0 - Protest Outcome Prediction System</p>
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
