"use client";

import { useState, useEffect } from "react";
import { api, ModelInfoResponse } from "@/lib/api";
import { Brain, CheckCircle, XCircle, Loader2, Database, Target } from "lucide-react";

export function ModelInfo() {
  const [data, setData] = useState<ModelInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await api.getModelInfo();
        setData(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load model info");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center py-12">
        <Brain className="h-10 w-10 mx-auto mb-3 text-gray-700" />
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const formatColumnName = (name: string) =>
    name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Brain className="h-4 w-4 text-gray-400" />
          Model Information
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">Details about the prediction model</p>
      </div>

      <div className="space-y-5">
        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/5">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-full ${data.is_loaded ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
              {data.is_loaded ? (
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">{data.model_type}</p>
              <p className="text-[10px] text-gray-500">Version {data.version}</p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
            data.is_loaded
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}>
            {data.is_loaded ? "Active" : "Not Loaded"}
          </span>
        </div>

        {/* Target Outcomes */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="h-3.5 w-3.5 text-gray-500" />
            <h4 className="text-xs font-medium text-gray-400">Predicted Outcomes ({data.target_columns.length})</h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.target_columns.map((col) => (
              <span key={col} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded">
                {formatColumnName(col)}
              </span>
            ))}
          </div>
        </div>

        {/* Input Features */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Database className="h-3.5 w-3.5 text-gray-500" />
            <h4 className="text-xs font-medium text-gray-400">Input Features ({data.feature_columns.length})</h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.feature_columns.slice(0, 12).map((col) => (
              <span key={col} className="px-2 py-0.5 bg-white/5 text-gray-400 text-[10px] rounded">
                {formatColumnName(col)}
              </span>
            ))}
            {data.feature_columns.length > 12 && (
              <span className="px-2 py-0.5 bg-white/5 text-gray-600 text-[10px] rounded">
                +{data.feature_columns.length - 12} more
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
