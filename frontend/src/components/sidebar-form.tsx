"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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

interface SidebarFormProps {
  onPredict: (input: PredictionInput) => void;
  isLoading: boolean;
}

export function SidebarForm({ onPredict, isLoading }: SidebarFormProps) {
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600 text-sm">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="sf-country" className="text-sm">Country</Label>
        <Select value={country} onValueChange={(v) => { setCountry(v); setGovernorate(""); }}>
          <SelectTrigger id="sf-country">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {regions?.countries.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sf-gov" className="text-sm">Governorate</Label>
        <Select value={governorate} onValueChange={setGovernorate} disabled={!country}>
          <SelectTrigger id="sf-gov">
            <SelectValue placeholder={country ? "Select region" : "Select country first"} />
          </SelectTrigger>
          <SelectContent>
            {governorates.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sf-loc" className="text-sm">Location Type</Label>
        <Select value={locationType} onValueChange={setLocationType}>
          <SelectTrigger id="sf-loc">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {options?.location_types.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sf-demand" className="text-sm">Demand Type</Label>
        <Select value={demandType} onValueChange={setDemandType}>
          <SelectTrigger id="sf-demand">
            <SelectValue placeholder="Select demand" />
          </SelectTrigger>
          <SelectContent>
            {options?.demand_types.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sf-tactic" className="text-sm">Primary Tactic</Label>
        <Select value={tactic} onValueChange={setTactic}>
          <SelectTrigger id="sf-tactic">
            <SelectValue placeholder="Select tactic" />
          </SelectTrigger>
          <SelectContent>
            {options?.tactics.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sf-violence" className="text-sm">Protester Violence</Label>
        <Select value={violence} onValueChange={setViolence}>
          <SelectTrigger id="sf-violence">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            {options?.violence_levels.map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sf-participants" className="text-sm">Estimated Participants</Label>
        <Input
          id="sf-participants"
          type="number"
          min="0"
          value={participants}
          onChange={(e) => setParticipants(e.target.value)}
          placeholder="Number of participants"
        />
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
  );
}
