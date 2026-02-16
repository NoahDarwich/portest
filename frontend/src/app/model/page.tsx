"use client";

import { ModelInfo } from "@/components/model-info";
import { FeatureImportance } from "@/components/feature-importance";
import { ArrowLeft, Brain, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function ModelPage() {
  return (
    <div className="min-h-screen bg-[#0f1117]">
      <header className="h-12 border-b border-white/10 sticky top-0 z-10 bg-[#0f1117]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-base font-bold text-white tracking-tight hover:text-gray-300 transition-colors">
              PRO-TEST
            </Link>
            <span className="text-[10px] text-gray-600">/ Model</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/about"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Guide</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </div>
        </div>
      </header>

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
