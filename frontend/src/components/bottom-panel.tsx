"use client";

import { useState, useEffect } from "react";
import { FlaskConical, BarChart3, X } from "lucide-react";
import { PredictionFormCompact } from "./prediction-form-compact";
import { MethodsChart } from "./methods-chart";
import { RepressionOverview } from "./repression-overview";
import { PredictionInput, PredictionResponse } from "@/lib/api";

interface OverlayPanelsProps {
  results: PredictionResponse | null;
  isLoading: boolean;
  onPredict: (input: PredictionInput) => void;
  selectedCountry: string | null;
}

type Tab = "predict" | "historical" | null;

export function OverlayPanels({ results, isLoading, onPredict, selectedCountry }: OverlayPanelsProps) {
  const [activeTab, setActiveTab] = useState<Tab>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveTab(null);
    }
    if (activeTab) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [activeTab]);

  const toggleTab = (tab: Tab) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  return (
    <>
      {/* Persistent tab bar — centered below header */}
      <div className="absolute top-12 left-0 right-0 z-[1001] flex items-center justify-center h-14 px-4" style={{ background: "rgba(15, 17, 23, 0.55)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex gap-2">
          <button
            onClick={() => toggleTab("predict")}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "predict"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-white/[0.07] text-gray-300 border border-white/[0.1] hover:bg-white/[0.12] hover:text-white"
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            Predict
          </button>
          <button
            onClick={() => toggleTab("historical")}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "historical"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-white/[0.07] text-gray-300 border border-white/[0.1] hover:bg-white/[0.12] hover:text-white"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Historical Analysis
          </button>
        </div>

        {activeTab && (
          <button
            onClick={() => setActiveTab(null)}
            className="absolute right-4 w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Panel that slides down from the tab bar */}
      {activeTab && (
        <>
          {/* Backdrop — only over the map area below tab bar */}
          <div
            className="absolute top-[104px] left-0 right-0 bottom-0 z-[1000] bg-black/30"
            onClick={() => setActiveTab(null)}
          />

          {/* Panel */}
          <div
            className="absolute top-[104px] left-0 right-0 z-[1001] overflow-hidden"
            style={{
              background: "linear-gradient(180deg, rgba(28, 30, 38, 0.97) 0%, rgba(19, 21, 27, 0.98) 100%)",
              backdropFilter: "blur(40px)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="max-w-5xl mx-auto p-5 overflow-y-auto max-h-[calc(100vh-140px)]">
              {activeTab === "predict" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Protest Parameters</h3>
                    <PredictionFormCompact onPredict={onPredict} isLoading={isLoading} />
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Results</h3>
                    <MethodsChart results={results} />
                  </div>
                </div>
              )}

              {activeTab === "historical" && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                  <RepressionOverview country={selectedCountry} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
