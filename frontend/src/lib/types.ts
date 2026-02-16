export interface MapFilters {
  countries: string[];
  repressionTypes: string[];
  violentOnly: boolean;
}

export const DEFAULT_FILTERS: MapFilters = {
  countries: [],
  repressionTypes: [],
  violentOnly: false,
};
