import type { Risk } from "./types";

export function classifyRisk(adsProfit: number, target: number, adsPossible: boolean): Risk {
  if (!adsPossible) return "impossible";
  if (adsProfit < 0) return "ads-loss";
  if (adsProfit < target) return "below";
  return "safe";
}

export function catalogIsProblem(risk: Risk, blank: boolean): boolean {
  return risk !== "safe" || blank;
}

export function riskLabel(risk: Risk): string {
  if (risk === "impossible") return "No safe price";
  if (risk === "ads-loss") return "Ads lose money";
  if (risk === "below") return "Below target";
  return "Ads-safe";
}
