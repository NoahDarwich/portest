const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface PredictionInput {
  country: string;
  governorate: string;
  location_type: string;
  demand_type: string;
  protest_tactic: string;
  combined_sizes: number;
}

export interface PredictionResponse {
  repression_level: number;
  repression_label: string;
  level_probabilities: Record<string, number>;
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
  year: number | null;
  month: number | null;
}

export interface RepressionStatsResponse {
  counts: Record<string, number>;
  total: number;
  country_filter: string | null;
}

export interface HistoricalKPIsResponse {
  total_events: number;
  total_killed: number;
  total_injured: number;
  total_arrested: number;
  repressed_count: number;
  repressed_pct: number;
  lethal_pct: number;
  injury_pct: number;
  arrest_pct: number;
}

export interface HistoricalTrendsResponse {
  monthly: Array<{
    month: string;
    Iraq: number;
    Lebanon: number;
    Egypt: number;
    total: number;
  }>;
  countries: string[];
}

export interface HistoricalCrossTabResponse {
  data: Array<Record<string, string | number>>;
  repression_labels: string[];
}

export interface HistoricalDemandsResponse {
  data: Array<{
    demand: string;
    total: number;
    not_repressed: number;
    repressed_count: number;
    repressed_pct: number;
    lethal_count: number;
    lethal_pct: number;
  }>;
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

  async getHistoricalKPIs(country?: string): Promise<HistoricalKPIsResponse> {
    const params = country ? `?country=${encodeURIComponent(country)}` : "";
    return this.fetch<HistoricalKPIsResponse>(`/historical/kpis${params}`);
  }

  async getHistoricalTrends(country?: string): Promise<HistoricalTrendsResponse> {
    const params = country ? `?country=${encodeURIComponent(country)}` : "";
    return this.fetch<HistoricalTrendsResponse>(`/historical/trends${params}`);
  }

  async getHistoricalCrossTab(country?: string): Promise<HistoricalCrossTabResponse> {
    const params = country ? `?country=${encodeURIComponent(country)}` : "";
    return this.fetch<HistoricalCrossTabResponse>(`/historical/cross-tab${params}`);
  }

  async getHistoricalDemands(country?: string): Promise<HistoricalDemandsResponse> {
    const params = country ? `?country=${encodeURIComponent(country)}` : "";
    return this.fetch<HistoricalDemandsResponse>(`/historical/demands${params}`);
  }
}

export const api = new ApiClient();
