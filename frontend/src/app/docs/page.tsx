"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

const endpoints = [
  {
    method: "GET",
    path: "/health",
    description: "Check API health status and model availability",
    response: `{
  "status": "healthy",
  "version": "2.0.0",
  "environment": "production",
  "model_loaded": true,
  "cache_enabled": true,
  "timestamp": "2026-01-26T12:00:00Z"
}`,
  },
  {
    method: "GET",
    path: "/predict",
    description: "Get predictions for protest outcomes based on input parameters",
    params: [
      { name: "country", type: "string", required: true, desc: "Country name (Iraq, Lebanon, Egypt)" },
      { name: "governorate", type: "string", required: true, desc: "Governorate/region within country" },
      { name: "location_type", type: "string", required: true, desc: "Type of location (urban, rural, etc.)" },
      { name: "demand_type", type: "string", required: true, desc: "Type of protest demand" },
      { name: "protest_tactic", type: "string", required: true, desc: "Primary tactic used" },
      { name: "protester_violence", type: "string", required: true, desc: "Level of protester violence" },
      { name: "combined_sizes", type: "integer", required: true, desc: "Estimated number of participants" },
    ],
    response: `{
  "predictions": {
    "verbal_coercion": { "probability": 0.65, "prediction": true },
    "constraint": { "probability": 0.42, "prediction": false },
    ...
  },
  "model_id": "ensemble_2415a4b0",
  "model_version": "2.0.0",
  "cached": false,
  "timestamp": "2026-01-26T12:00:00Z"
}`,
  },
  {
    method: "GET",
    path: "/regions",
    description: "Get available countries and their governorates/regions",
    response: `{
  "countries": ["Egypt", "Iraq", "Lebanon"],
  "Egypt": ["Cairo", "Alexandria", ...],
  "Iraq": ["Baghdad", "Basra", ...],
  "Lebanon": ["Beirut", "Tripoli", ...]
}`,
  },
  {
    method: "GET",
    path: "/options",
    description: "Get available options for prediction input fields",
    response: `{
  "location_types": ["urban", "rural", ...],
  "demand_types": ["political", "economic", ...],
  "tactics": ["march", "rally", ...],
  "violence_levels": ["peaceful", "property damage", ...]
}`,
  },
  {
    method: "GET",
    path: "/model/info",
    description: "Get information about the loaded prediction model",
    response: `{
  "model_type": "EnsembleModel",
  "version": "2.0.0",
  "target_columns": ["verbal_coercion", "constraint", ...],
  "feature_columns": ["country", "governorate", ...],
  "is_loaded": true,
  "timestamp": "2026-01-26T12:00:00Z"
}`,
  },
  {
    method: "GET",
    path: "/model/features",
    description: "Get feature importance scores from the model",
    response: `{
  "feature_importance": {
    "country": 0.15,
    "protester_violence": 0.12,
    "combined_sizes": 0.10,
    ...
  },
  "model_version": "2.0.0",
  "timestamp": "2026-01-26T12:00:00Z"
}`,
  },
  {
    method: "GET",
    path: "/metrics",
    description: "Prometheus metrics endpoint for monitoring",
    response: "# HELP protest_prediction_requests_total Total predictions\n# TYPE protest_prediction_requests_total counter\nprotest_prediction_requests_total{country=\"Iraq\",status=\"success\"} 1234",
  },
];

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-green-100 text-green-700",
    POST: "bg-blue-100 text-blue-700",
    PUT: "bg-yellow-100 text-yellow-700",
    DELETE: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-1 text-xs font-mono font-semibold rounded ${colors[method] || "bg-gray-100"}`}>
      {method}
    </span>
  );
}

export default function DocsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
                <p className="text-xs text-gray-500">API Documentation</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">API Reference</h2>
          <p className="text-gray-600">
            The Pro-Test API provides endpoints for predicting protest outcomes based on
            historical data from Iraq, Lebanon, and Egypt.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <code className="px-3 py-1 bg-gray-100 rounded text-sm font-mono">
              Base URL: {apiUrl}
            </code>
            <a
              href={`${apiUrl}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              OpenAPI Docs <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="space-y-6">
          {endpoints.map((endpoint, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <MethodBadge method={endpoint.method} />
                  <code className="text-lg font-mono font-semibold">{endpoint.path}</code>
                </div>
                <CardDescription>{endpoint.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {endpoint.params && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Parameters</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-4">Name</th>
                            <th className="text-left py-2 pr-4">Type</th>
                            <th className="text-left py-2 pr-4">Required</th>
                            <th className="text-left py-2">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {endpoint.params.map((param, pidx) => (
                            <tr key={pidx} className="border-b last:border-0">
                              <td className="py-2 pr-4 font-mono text-blue-600">{param.name}</td>
                              <td className="py-2 pr-4 text-gray-500">{param.type}</td>
                              <td className="py-2 pr-4">
                                {param.required ? (
                                  <span className="text-red-600">Yes</span>
                                ) : (
                                  <span className="text-gray-400">No</span>
                                )}
                              </td>
                              <td className="py-2 text-gray-600">{param.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Response</h4>
                  <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-xs">
                    {endpoint.response}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Model Limitations */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Model Limitations</CardTitle>
            <CardDescription>Important considerations when using predictions</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ul className="space-y-2 text-gray-600">
              <li>
                <strong>Geographic Coverage:</strong> Model is trained only on data from Iraq,
                Lebanon, and Egypt (2017-2022). Predictions for other regions are not supported.
              </li>
              <li>
                <strong>Historical Bias:</strong> Predictions reflect patterns in historical data
                and may not account for recent political changes or emerging trends.
              </li>
              <li>
                <strong>Probability Interpretation:</strong> Output probabilities indicate
                likelihood based on similar historical events, not certainty of outcomes.
              </li>
              <li>
                <strong>Feature Dependencies:</strong> Some outcomes are correlated (e.g.,
                security presence often precedes physical responses). Consider predictions
                holistically.
              </li>
              <li>
                <strong>Intended Use:</strong> This tool is designed for research and risk
                assessment purposes. It should not be the sole basis for safety decisions.
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-500 text-center">
            Pro-Test v2.0 - Protest Outcome Prediction System
          </p>
        </div>
      </footer>
    </div>
  );
}
