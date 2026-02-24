"use client";

import { PredictionFormCompact } from "./prediction-form-compact";
import { MethodsChart } from "./methods-chart";
import { PredictionInput, PredictionResponse } from "@/lib/api";

interface PredictionPanelProps {
  results: PredictionResponse | null;
  isLoading: boolean;
  onPredict: (input: PredictionInput) => void;
}

export function PredictionPanel({
  results,
  isLoading,
  onPredict,
}: PredictionPanelProps) {
  return (
    <div className="flex flex-col">
      <div className="px-8 pt-6 pb-3">
        <h2 className="text-lg font-bold text-gray-200 tracking-tight">
          Predict Repression Outcome
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure protest parameters and predict likely repression methods using the ensemble ML model.
        </p>
      </div>

      <div
        className="overflow-y-auto px-8 pb-6"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.15) transparent" }}
      >
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">
              Protest Parameters
            </h3>
            <PredictionFormCompact onPredict={onPredict} isLoading={isLoading} />
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">
              Prediction Results
            </h3>
            <MethodsChart results={results} />
          </div>
        </div>
      </div>
    </div>
  );
}
