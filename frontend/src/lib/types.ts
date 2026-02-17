export type ColorMode = "type" | "severity";

export interface MapFilters {
  countries: string[];
  repressionTypes: string[];
  demandTypes: string[];
  tactics: string[];
  colorMode: ColorMode;
}

export const DEFAULT_FILTERS: MapFilters = {
  countries: [],
  repressionTypes: [],
  demandTypes: [],
  tactics: [],
  colorMode: "severity",
};
