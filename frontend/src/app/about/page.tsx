"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, ArrowRight, MapPin, Users, Target, AlertTriangle, CheckCircle } from "lucide-react";
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
  {
    name: "Tear Gas",
    description: "Use of tear gas against protesters by security forces",
    severity: "high",
  },
  {
    name: "Rubber Bullets",
    description: "Use of rubber bullets or similar non-lethal projectiles",
    severity: "high",
  },
  {
    name: "Live Ammunition",
    description: "Use of live ammunition against protesters",
    severity: "critical",
  },
  {
    name: "Sticks / Batons",
    description: "Use of batons, sticks, or blunt instruments",
    severity: "medium",
  },
  {
    name: "Surround",
    description: "Protesters surrounded or encircled by security forces",
    severity: "medium",
  },
  {
    name: "Area Cleared",
    description: "Protest area forcibly cleared by security forces",
    severity: "medium",
  },
  {
    name: "Police Repression",
    description: "General police repressive action against protesters",
    severity: "high",
  },
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
    low: "bg-yellow-100 text-yellow-700",
    medium: "bg-orange-100 text-orange-700",
    high: "bg-red-100 text-red-700",
    critical: "bg-red-200 text-red-800",
    info: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[severity]}`}>
      {severity}
    </span>
  );
}

export default function AboutPage() {
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
                <p className="text-xs text-gray-500">Getting Started</p>
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

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Predict Protest Repression Methods with Machine Learning
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Pro-Test uses an ensemble of machine learning models trained on historical protest
            data to predict likely repression methods used against protesters.
          </p>
          <Link href="/">
            <Button className="gap-2">
              Start Predicting <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* How It Works */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4 p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <step.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-blue-600">Step {step.number}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Predicted Repression Methods */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Predicted Repression Methods</h3>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {outcomes.map((outcome, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{outcome.name}</h4>
                      <p className="text-sm text-gray-500">{outcome.description}</p>
                    </div>
                    <SeverityBadge severity={outcome.severity} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Important Notice */}
        <section className="mb-16">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                Important Considerations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-yellow-800">
              <ul className="space-y-2 text-sm">
                <li>
                  <strong>Research Tool:</strong> This system is designed for research and risk
                  assessment. It should not be the sole basis for safety decisions.
                </li>
                <li>
                  <strong>Historical Data:</strong> Predictions are based on events from 2017-2022
                  and may not reflect current political conditions.
                </li>
                <li>
                  <strong>Regional Scope:</strong> Only protests in Iraq, Lebanon, and Egypt are
                  supported. Other regions require additional data.
                </li>
                <li>
                  <strong>Probabilistic:</strong> Outputs are probabilities, not certainties.
                  Multiple outcomes may occur simultaneously.
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Pro-Test v2.0 - Predictive Modelling for a Safer Forum of Dissent
            </p>
            <div className="flex gap-4 text-sm">
              <Link href="/docs" className="text-gray-500 hover:text-gray-900">
                API Docs
              </Link>
              <Link href="/" className="text-gray-500 hover:text-gray-900">
                Predict
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
