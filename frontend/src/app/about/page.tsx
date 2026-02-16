"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, MapPin, Users, Target, AlertTriangle, CheckCircle, HelpCircle, Brain } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    number: 1,
    title: "Select Location",
    description: "Choose the country (Iraq, Lebanon, or Egypt) and specific governorate where the protest will occur.",
    icon: MapPin,
  },
  {
    number: 2,
    title: "Define Characteristics",
    description: "Specify the location type, demand type, primary tactic, and expected level of protester violence.",
    icon: Target,
  },
  {
    number: 3,
    title: "Estimate Participants",
    description: "Enter the expected number of participants. Larger protests may have different outcome patterns.",
    icon: Users,
  },
  {
    number: 4,
    title: "Get Predictions",
    description: "Click 'Predict Outcomes' to receive probability estimates for 7 repression methods.",
    icon: CheckCircle,
  },
];

const outcomes = [
  { name: "Tear Gas", description: "Use of tear gas against protesters by security forces", severity: "high" },
  { name: "Rubber Bullets", description: "Use of rubber bullets or similar non-lethal projectiles", severity: "high" },
  { name: "Live Ammunition", description: "Use of live ammunition against protesters", severity: "critical" },
  { name: "Sticks / Batons", description: "Use of batons, sticks, or blunt instruments", severity: "medium" },
  { name: "Surround", description: "Protesters surrounded or encircled by security forces", severity: "medium" },
  { name: "Area Cleared", description: "Protest area forcibly cleared by security forces", severity: "medium" },
  { name: "Police Repression", description: "General police repressive action against protesters", severity: "high" },
];

const faqs = [
  {
    question: "How accurate are the predictions?",
    answer: "The ensemble model achieves approximately 95% accuracy on historical data. However, predictions are based on patterns from 2017-2022 and may not account for recent changes in political dynamics.",
  },
  {
    question: "What data was used to train the model?",
    answer: "The model was trained on over 13,000 protest events from Iraq, Lebanon, and Egypt, documented between 2017 and 2022. Data includes protest characteristics and documented security responses.",
  },
  {
    question: "Can I use this for other countries?",
    answer: "Currently, the model only supports Iraq, Lebanon, and Egypt. Predictions for other regions would require additional training data and model validation.",
  },
  {
    question: "How should I interpret the probabilities?",
    answer: "Probabilities indicate the likelihood of each outcome based on similar historical events. Higher probabilities suggest more common responses for similar protest profiles, but don't guarantee outcomes.",
  },
  {
    question: "Is this data updated in real-time?",
    answer: "No, the model is trained on historical data. It does not incorporate real-time information about ongoing events or recent political developments.",
  },
];

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    low: "bg-yellow-500/10 text-yellow-400",
    medium: "bg-orange-500/10 text-orange-400",
    high: "bg-red-500/10 text-red-400",
    critical: "bg-red-500/20 text-red-300",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[severity]}`}>
      {severity}
    </span>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Header */}
      <header className="h-12 border-b border-white/10 sticky top-0 z-10 bg-[#0f1117]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-base font-bold text-white tracking-tight hover:text-gray-300 transition-colors">
              PRO-TEST
            </Link>
            <span className="text-[10px] text-gray-600">/ Guide</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/model"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Brain className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Model</span>
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

      {/* Hero */}
      <section className="border-b border-white/5 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Predict Protest Repression Methods
          </h2>
          <p className="text-sm text-gray-400 mb-6 max-w-xl mx-auto">
            Pro-Test uses an ensemble of machine learning models trained on historical protest
            data to predict likely repression methods used against protesters.
          </p>
          <Link href="/">
            <Button size="sm" className="gap-1.5">
              Start Predicting <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* How It Works */}
        <section className="mb-12">
          <h3 className="text-lg font-semibold text-white mb-5">How It Works</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-3 p-4 rounded-lg border border-white/10 bg-white/[0.02]">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <step.icon className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-medium text-blue-400">Step {step.number}</span>
                  </div>
                  <h4 className="text-sm font-medium text-white">{step.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Predicted Repression Methods */}
        <section className="mb-12">
          <h3 className="text-lg font-semibold text-white mb-5">Predicted Repression Methods</h3>
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <div className="divide-y divide-white/5">
              {outcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-white/[0.02]">
                  <div>
                    <h4 className="text-sm font-medium text-gray-200">{outcome.name}</h4>
                    <p className="text-xs text-gray-500">{outcome.description}</p>
                  </div>
                  <SeverityBadge severity={outcome.severity} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Important Notice */}
        <section className="mb-12">
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-5">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-yellow-400 mb-3">
              <AlertTriangle className="h-4 w-4" />
              Important Considerations
            </h4>
            <ul className="space-y-2 text-xs text-yellow-300/70">
              <li><strong className="text-yellow-400">Research Tool:</strong> This system is designed for research and risk assessment. It should not be the sole basis for safety decisions.</li>
              <li><strong className="text-yellow-400">Historical Data:</strong> Predictions are based on events from 2017-2022 and may not reflect current political conditions.</li>
              <li><strong className="text-yellow-400">Regional Scope:</strong> Only protests in Iraq, Lebanon, and Egypt are supported. Other regions require additional data.</li>
              <li><strong className="text-yellow-400">Probabilistic:</strong> Outputs are probabilities, not certainties. Multiple outcomes may occur simultaneously.</li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-5">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <h4 className="text-sm font-medium text-gray-200 mb-1.5">{faq.question}</h4>
                <p className="text-xs text-gray-500">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <p>Pro-Test v2.0 - Predictive Modelling for a Safer Forum of Dissent</p>
            <Link href="/" className="text-gray-500 hover:text-gray-300">
              Back to Map
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
