"use client";

import { PredictionFormCompact } from "./prediction-form-compact";
import { MethodsChart } from "./methods-chart";
import { RepressionOverview } from "./repression-overview";
import { PredictionInput, PredictionResponse } from "@/lib/api";

interface PredictionPanelProps {
  activeTab: "predict" | "historical";
  results: PredictionResponse | null;
  isLoading: boolean;
  onPredict: (input: PredictionInput) => void;
  selectedCountry: string | null;
}

export function PredictionPanel({
  activeTab,
  results,
  isLoading,
  onPredict,
  selectedCountry,
}: PredictionPanelProps) {
  return (
    <div className="flex flex-col">
      {/* Tab label */}
      <div className="px-6 pt-4 pb-2">
        <h2 className="text-sm font-bold text-gray-200 tracking-tight">
          {activeTab === "predict" ? "Predict Repression Outcome" : "Historical Analysis"}
        </h2>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {activeTab === "predict"
            ? "Configure protest parameters and predict likely repression methods using the ensemble ML model."
            : "Explore historical repression patterns across countries and time periods."}
        </p>
      </div>

      <div
        className="overflow-y-auto px-6 pb-5"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.15) transparent" }}
      >
        {activeTab === "predict" && (
          <div className="grid grid-cols-2 gap-5">
            {/* Left: Form */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Protest Parameters
              </h3>
              <PredictionFormCompact onPredict={onPredict} isLoading={isLoading} />
            </div>

            {/* Right: Results */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Prediction Results
              </h3>
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
  );
}
