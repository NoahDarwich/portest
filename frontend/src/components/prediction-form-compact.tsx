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
import { Loader2, MapPin, Megaphone } from "lucide-react";

interface PredictionFormCompactProps {
  onPredict: (input: PredictionInput) => void;
  isLoading: boolean;
}

export function PredictionFormCompact({ onPredict, isLoading }: PredictionFormCompactProps) {
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

  const isValid = country && governorate && locationType && demandType && tactic && violence;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-400 text-sm mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Location group */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Location</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cf-country" className="text-xs text-gray-400">Country</Label>
            <Select value={country} onValueChange={(v) => { setCountry(v); setGovernorate(""); }}>
              <SelectTrigger id="cf-country">
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
            <Label htmlFor="cf-gov" className="text-xs text-gray-400">Governorate</Label>
            <Select value={governorate} onValueChange={setGovernorate} disabled={!country}>
              <SelectTrigger id="cf-gov">
                <SelectValue placeholder={country ? "Select region" : "Country first"} />
              </SelectTrigger>
              <SelectContent>
                {governorates.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Protest details group */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <Megaphone className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Protest Details</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cf-loc" className="text-xs text-gray-400">Location Type</Label>
            <Select value={locationType} onValueChange={setLocationType}>
              <SelectTrigger id="cf-loc">
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
            <Label htmlFor="cf-demand" className="text-xs text-gray-400">Demand Type</Label>
            <Select value={demandType} onValueChange={setDemandType}>
              <SelectTrigger id="cf-demand">
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
            <Label htmlFor="cf-tactic" className="text-xs text-gray-400">Primary Tactic</Label>
            <Select value={tactic} onValueChange={setTactic}>
              <SelectTrigger id="cf-tactic">
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
            <Label htmlFor="cf-violence" className="text-xs text-gray-400">Protester Violence</Label>
            <Select value={violence} onValueChange={setViolence}>
              <SelectTrigger id="cf-violence">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {options?.violence_levels.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Participants + Submit */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="cf-participants" className="text-xs text-gray-400">Est. Participants</Label>
          <Input
            id="cf-participants"
            type="number"
            min="0"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            placeholder="100"
          />
        </div>
        <Button
          type="submit"
          className="h-9 px-6"
          disabled={isLoading || !isValid}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Predicting...
            </>
          ) : (
            "Predict Outcomes"
          )}
        </Button>
      </div>
    </form>
  );
}
