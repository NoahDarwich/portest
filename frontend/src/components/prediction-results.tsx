"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PredictionResponse } from "@/lib/api";
import {
  AlertTriangle,
  Shield,
  Users,
  MessageCircle,
  Lock,
  Zap,
  Skull,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PredictionResultsProps {
  results: PredictionResponse | null;
}

const outcomeConfig: Record<
  string,
  { label: string; description: string; icon: React.ElementType; color: string }
> = {
  verbal_coercion: {
    label: "Verbal Coercion",
    description: "Verbal threats, warnings, or intimidation",
    icon: MessageCircle,
    color: "text-yellow-600",
  },
  constraint: {
    label: "Constraint",
    description: "Movement restrictions, detentions, or arrests",
    icon: Lock,
    color: "text-orange-600",
  },
  physical_mild: {
    label: "Physical (Mild)",
    description: "Pushing, shoving, minor physical contact",
    icon: Zap,
    color: "text-orange-500",
  },
  physical_severe: {
    label: "Physical (Severe)",
    description: "Beatings, tear gas, water cannons",
    icon: AlertTriangle,
    color: "text-red-500",
  },
  physical_deadly: {
    label: "Physical (Deadly)",
    description: "Lethal force, live ammunition",
    icon: Skull,
    color: "text-red-700",
  },
  security_presence: {
    label: "Security Presence",
    description: "Security forces present at protest",
    icon: Shield,
    color: "text-blue-600",
  },
  militia_presence: {
    label: "Militia Presence",
    description: "Militia or paramilitary groups present",
    icon: Users,
    color: "text-purple-600",
  },
};

function ProbabilityBar({ probability }: { probability: number }) {
  const percentage = Math.round(probability * 100);
  const getBarColor = (prob: number) => {
    if (prob >= 0.7) return "bg-red-500";
    if (prob >= 0.5) return "bg-orange-500";
    if (prob >= 0.3) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", getBarColor(probability))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium w-12 text-right">{percentage}%</span>
    </div>
  );
}

function OutcomeCard({
  outcome,
  probability,
  prediction,
}: {
  outcome: string;
  probability: number;
  prediction: boolean;
}) {
  const config = outcomeConfig[outcome];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-5 w-5", config.color)} />
          <span className="font-medium">{config.label}</span>
        </div>
        {prediction ? (
          <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
            <CheckCircle className="h-3 w-3" />
            Likely
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
            <XCircle className="h-3 w-3" />
            Unlikely
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3">{config.description}</p>
      <ProbabilityBar probability={probability} />
    </div>
  );
}

export function PredictionResults({ results }: PredictionResultsProps) {
  if (!results) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Enter protest parameters and click &quot;Predict Outcomes&quot; to see results</p>
        </CardContent>
      </Card>
    );
  }

  const sortedOutcomes = Object.entries(results.predictions).sort(
    ([, a], [, b]) => b.probability - a.probability
  );

  const highRisk = sortedOutcomes.filter(([, p]) => p.probability >= 0.5);
  const lowRisk = sortedOutcomes.filter(([, p]) => p.probability < 0.5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Prediction Results</CardTitle>
            <CardDescription>
              Model: {results.model_id} | Version: {results.model_version}
              {results.cached && (
                <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">Cached</span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {highRisk.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Higher Risk Outcomes ({highRisk.length})
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              {highRisk.map(([outcome, pred]) => (
                <OutcomeCard
                  key={outcome}
                  outcome={outcome}
                  probability={pred.probability}
                  prediction={pred.prediction}
                />
              ))}
            </div>
          </div>
        )}

        {lowRisk.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Lower Risk Outcomes ({lowRisk.length})
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              {lowRisk.map(([outcome, pred]) => (
                <OutcomeCard
                  key={outcome}
                  outcome={outcome}
                  probability={pred.probability}
                  prediction={pred.prediction}
                />
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center pt-4 border-t">
          Predictions are based on historical data and should be used as guidance only.
          See documentation for model limitations.
        </p>
      </CardContent>
    </Card>
  );
}
