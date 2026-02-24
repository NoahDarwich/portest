export type ColorMode = "type" | "severity";

export interface MapFilters {
  years: number[];
  months: number[];
  countries: string[];
  repressionTypes: string[];
  demandTypes: string[];
  tactics: string[];
  colorMode: ColorMode;
}

export const DEFAULT_FILTERS: MapFilters = {
  years: [],
  months: [],
  countries: [],
  repressionTypes: [],
  demandTypes: [],
  tactics: [],
  colorMode: "severity",
};
