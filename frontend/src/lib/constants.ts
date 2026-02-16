export const METHOD_LABELS: Record<string, string> = {
  teargas: "Tear Gas",
  rubberbullets: "Rubber Bullets",
  liveammo: "Live Ammo",
  sticks: "Sticks/Batons",
  surround: "Surround",
  cleararea: "Area Cleared",
  policerepress: "Police Repression",
};

export const REPRESSION_SHORT_LABELS: Record<string, string> = {
  "No known coercion, no security presence": "No coercion",
  "Security forces or other repressive groups present at event": "Repressive groups present",
  "Injuries inflicted": "Injuries",
  "Physical harassment": "Physical harassment",
  "Security forces present at event": "Security present",
  "Deaths inflicted": "Deaths",
  "Army present at event": "Army present",
  "Arrests / detentions": "Arrests",
  "Party Militias/ Baltagia present at event": "Militias present",
  "Participants summoned to security facility": "Summoned to facility",
};

export const REPRESSION_COLORS: string[] = [
  "#e63946", // red
  "#f4a261", // orange
  "#e9c46a", // gold
  "#2a9d8f", // teal
  "#264653", // dark blue
  "#a8dadc", // light teal
  "#457b9d", // steel blue
  "#6d6875", // purple gray
  "#b5838d", // mauve
  "#ffb4a2", // peach
];

export const COUNTRIES = ["Iraq", "Lebanon", "Egypt"] as const;

export function getBarColor(probability: number): string {
  if (probability >= 0.7) return "#bd0026";
  if (probability >= 0.5) return "#f03b20";
  if (probability >= 0.3) return "#fd8d3c";
  if (probability >= 0.15) return "#fecc5c";
  return "#ffffb2";
}
