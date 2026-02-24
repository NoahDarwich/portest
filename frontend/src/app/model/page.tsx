"use client";

import { ModelInfo } from "@/components/model-info";
import { FeatureImportance } from "@/components/feature-importance";
import { AppHeader } from "@/components/app-header";

export default function ModelPage() {
  return (
    <div className="min-h-screen bg-[#0f1117]">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <ModelInfo />
          <FeatureImportance />
        </div>
      </main>

      <footer className="border-t border-white/5 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <p className="text-xs text-gray-600 text-center">
            Pro-Test v2.0 - Predictive Modelling for a Safer Forum of Dissent
          </p>
        </div>
      </footer>
    </div>
  );
}
