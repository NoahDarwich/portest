"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const formatColumnName = (name: string) =>
    name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Model Information
        </CardTitle>
        <CardDescription>
          Details about the prediction model
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Row */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${data.is_loaded ? "bg-green-100" : "bg-red-100"}`}>
              {data.is_loaded ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="font-medium">{data.model_type}</p>
              <p className="text-sm text-gray-500">Version {data.version}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            data.is_loaded
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
            {data.is_loaded ? "Active" : "Not Loaded"}
          </span>
        </div>

        {/* Target Outcomes */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-gray-500" />
            <h4 className="font-medium text-sm">Predicted Outcomes ({data.target_columns.length})</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.target_columns.map((col) => (
              <span
                key={col}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
              >
                {formatColumnName(col)}
              </span>
            ))}
          </div>
        </div>

        {/* Input Features */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-gray-500" />
            <h4 className="font-medium text-sm">Input Features ({data.feature_columns.length})</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.feature_columns.slice(0, 12).map((col) => (
              <span
                key={col}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
              >
                {formatColumnName(col)}
              </span>
            ))}
            {data.feature_columns.length > 12 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                +{data.feature_columns.length - 12} more
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
