"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, PredictionInput, RegionsResponse, OptionsResponse } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface PredictionFormProps {
  onPredict: (input: PredictionInput) => void;
  isLoading: boolean;
}

export function PredictionForm({ onPredict, isLoading }: PredictionFormProps) {
  const [regions, setRegions] = useState<RegionsResponse | null>(null);
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [country, setCountry] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [locationType, setLocationType] = useState("");
  const [demandType, setDemandType] = useState("");
  const [tactic, setTactic] = useState("");
  const [violence, setViolence] = useState("");
  const [participants, setParticipants] = useState("100");

  useEffect(() => {
    async function loadData() {
      try {
        const [regionsData, optionsData] = await Promise.all([
          api.getRegions(),
          api.getOptions(),
        ]);
        setRegions(regionsData);
        setOptions(optionsData);
        setError(null);
      } catch (err) {
        setError("Failed to load form options. Is the API running?");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPredict({
      country,
      governorate,
      location_type: locationType,
      demand_type: demandType,
      protest_tactic: tactic,
      protester_violence: violence,
      combined_sizes: parseInt(participants, 10) || 0,
    });
  };

  const governorates = country && regions ? regions[country] || [] : [];

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
          <p className="text-red-600">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protest Parameters</CardTitle>
        <CardDescription>
          Enter the characteristics of the protest to predict outcomes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={country} onValueChange={(v) => { setCountry(v); setGovernorate(""); }}>
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {regions?.countries.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Governorate */}
            <div className="space-y-2">
              <Label htmlFor="governorate">Governorate / Region</Label>
              <Select value={governorate} onValueChange={setGovernorate} disabled={!country}>
                <SelectTrigger id="governorate">
                  <SelectValue placeholder={country ? "Select region" : "Select country first"} />
                </SelectTrigger>
                <SelectContent>
                  {governorates.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Type */}
            <div className="space-y-2">
              <Label htmlFor="location">Location Type</Label>
              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location type" />
                </SelectTrigger>
                <SelectContent>
                  {options?.location_types.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Demand Type */}
            <div className="space-y-2">
              <Label htmlFor="demand">Demand Type</Label>
              <Select value={demandType} onValueChange={setDemandType}>
                <SelectTrigger id="demand">
                  <SelectValue placeholder="Select demand type" />
                </SelectTrigger>
                <SelectContent>
                  {options?.demand_types.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Protest Tactic */}
            <div className="space-y-2">
              <Label htmlFor="tactic">Primary Tactic</Label>
              <Select value={tactic} onValueChange={setTactic}>
                <SelectTrigger id="tactic">
                  <SelectValue placeholder="Select tactic" />
                </SelectTrigger>
                <SelectContent>
                  {options?.tactics.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Violence Level */}
            <div className="space-y-2">
              <Label htmlFor="violence">Protester Violence</Label>
              <Select value={violence} onValueChange={setViolence}>
                <SelectTrigger id="violence">
                  <SelectValue placeholder="Select violence level" />
                </SelectTrigger>
                <SelectContent>
                  {options?.violence_levels.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Participant Count */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="participants">Estimated Participants</Label>
              <Input
                id="participants"
                type="number"
                min="0"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Enter number of participants"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              isLoading ||
              !country ||
              !governorate ||
              !locationType ||
              !demandType ||
              !tactic ||
              !violence
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Predicting...
              </>
            ) : (
              "Predict Outcomes"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
