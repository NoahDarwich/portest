const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface PredictionInput {
  country: string;
  governorate: string;
  location_type: string;
  demand_type: string;
  protest_tactic: string;
  protester_violence: string;
  combined_sizes: number;
}

export interface OutcomePrediction {
  probability: number;
  prediction: boolean;
}

export interface PredictionResponse {
  predictions: Record<string, OutcomePrediction>;
  model_id: string;
  model_version: string;
  cached: boolean;
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  model_loaded: boolean;
  cache_enabled: boolean;
  timestamp: string;
}

export interface RegionsResponse {
  countries: string[];
  [country: string]: string[];
}

export interface OptionsResponse {
  location_types: string[];
  demand_types: string[];
  tactics: string[];
  violence_levels: string[];
}

export interface FeatureImportanceResponse {
  feature_importance: Record<string, number>;
  model_version: string;
  timestamp: string;
}

export interface ModelInfoResponse {
  model_type: string;
  version: string;
  target_columns: string[];
  feature_columns: string[];
  is_loaded: boolean;
  timestamp: string;
}

export interface MapDataPoint {
  lat: number;
  lng: number;
  repression: string;
  country: string;
  violence_heat: number;
  demand: string;
  tactic: string;
  severity: number;
}

export interface RepressionStatsResponse {
  counts: Record<string, number>;
  total: number;
  country_filter: string | null;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async health(): Promise<HealthResponse> {
    return this.fetch<HealthResponse>("/health");
  }

  async predict(input: PredictionInput): Promise<PredictionResponse> {
    const params = new URLSearchParams({
      country: input.country,
      governorate: input.governorate,
      location_type: input.location_type,
      demand_type: input.demand_type,
      protest_tactic: input.protest_tactic,
      protester_violence: input.protester_violence,
      combined_sizes: input.combined_sizes.toString(),
    });

    return this.fetch<PredictionResponse>(`/predict?${params}`);
  }

  async getRegions(): Promise<RegionsResponse> {
    return this.fetch<RegionsResponse>("/regions");
  }

  async getOptions(): Promise<OptionsResponse> {
    return this.fetch<OptionsResponse>("/options");
  }

  async getFeatureImportance(): Promise<FeatureImportanceResponse> {
    return this.fetch<FeatureImportanceResponse>("/model/features");
  }

  async getModelInfo(): Promise<ModelInfoResponse> {
    return this.fetch<ModelInfoResponse>("/model/info");
  }

  async getMapData(): Promise<MapDataPoint[]> {
    return this.fetch<MapDataPoint[]>("/mapdata");
  }

  async getRepressionStats(country?: string): Promise<RepressionStatsResponse> {
    const params = country ? `?country=${encodeURIComponent(country)}` : "";
    return this.fetch<RepressionStatsResponse>(`/repression-stats${params}`);
  }
}

export const api = new ApiClient();
