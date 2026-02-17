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

// Muted categorical colors for repression type view — softer against dark bg
export const REPRESSION_COLORS: string[] = [
  "#8b9dc3", // muted steel blue — no coercion
  "#7eb8a4", // sage green — repressive groups
  "#c97b7b", // dusty rose — injuries
  "#d4a87c", // warm sand — harassment
  "#6fa8c9", // soft sky blue — security present
  "#b07090", // muted plum — deaths
  "#9bb07a", // olive — army
  "#c4956a", // terracotta — arrests
  "#8a8ab0", // lavender gray — militias
  "#79b5a2", // seafoam — summoned
];

// Severity gradient: muted tones that feel intuitive
// 0 = calm/neutral → 5 = danger
export const SEVERITY_COLORS: Record<number, string> = {
  0: "#6b7280", // neutral gray — no coercion
  1: "#7eb8a4", // sage green — security present (calm)
  2: "#d4a87c", // warm sand — escalated (caution)
  3: "#c98a5a", // amber — force used (warning)
  4: "#c97b7b", // dusty rose — injuries (serious)
  5: "#a35555", // muted crimson — deaths (severe)
};

export const SEVERITY_LABELS: Record<number, string> = {
  0: "None",
  1: "Presence",
  2: "Escalated",
  3: "Force used",
  4: "Injuries",
  5: "Lethal",
};

export const COUNTRIES = ["Iraq", "Lebanon", "Egypt"] as const;

export function getBarColor(probability: number): string {
  if (probability >= 0.7) return "#a35555";
  if (probability >= 0.5) return "#c97b7b";
  if (probability >= 0.3) return "#c98a5a";
  if (probability >= 0.15) return "#d4a87c";
  return "#7eb8a4";
}
