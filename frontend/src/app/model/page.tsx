"use client";

import { ModelInfo } from "@/components/model-info";
import { FeatureImportance } from "@/components/feature-importance";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ModelPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pro-Test</h1>
                <p className="text-xs text-gray-500">Model Information</p>
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <ModelInfo />
          <FeatureImportance />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-500 text-center">
            Pro-Test v2.0 - Predictive Modelling for a Safer Forum of Dissent
          </p>
        </div>
      </footer>
    </div>
  );
}
