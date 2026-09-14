/** Published policy constants we copy, dated. Every rate stays editable. */
export const RATES_AS_OF = "4 September 2026";
export const TRAILING_ADS_USD = 10_000;

export type AdsRule = {
  over: boolean;
  suggested: "15" | "12";
  text: string;
  headroomUsd: number;
};

/** Etsy Offsite Ads: 15% + opt-out under $10k trailing; 12% mandatory after. */
export function adsRule(trailingUsd: number): AdsRule | null {
  if (!Number.isFinite(trailingUsd) || trailingUsd <= 0) return null;
  if (trailingUsd < TRAILING_ADS_USD) {
    const headroomUsd = Math.round((TRAILING_ADS_USD - trailingUsd) * 100) / 100;
    return {
      over: false,
      suggested: "15",
      headroomUsd,
      text: `Trailing sales are under $${TRAILING_ADS_USD.toLocaleString("en-US")}. You have about $${headroomUsd.toLocaleString("en-US")} of room before Offsite Ads become 12% and mandatory. Until then they are 15% and you can still opt out.`,
    };
  }
  return {
    over: true,
    suggested: "12",
    headroomUsd: 0,
    text: `Trailing sales are at or over $${TRAILING_ADS_USD.toLocaleString("en-US")}. Offsite Ads are 12% and mandatory on attributed orders.`,
  };
}

export type Reconcile = {
  deltaCents: number;
  status: "match" | "close" | "off";
};

export function reconcileFees(oursCents: number, statementCents: number): Reconcile | null {
  if (!Number.isFinite(statementCents) || statementCents <= 0) return null;
  const deltaCents = oursCents - statementCents;
  const abs = Math.abs(deltaCents);
  const status = abs <= 1 ? "match" : abs <= 25 ? "close" : "off";
  return { deltaCents, status };
}

/** VAT remitted when the list is VAT-inclusive. Gross is the fee merchandise. */
export function vatRemitFromGross(grossCents: number, rate: number): number {
  if (rate <= 0 || grossCents <= 0) return 0;
  return Math.round((grossCents * rate) / (1 + rate));
}

export type LineMatch = {
  id: string;
  label: string;
  oursCents: number;
  theirsCents: number;
  deltaCents: number;
  status: "match" | "close" | "off";
};

export function reconcileLines(
  ours: { id: string; label: string; cents: number }[],
  theirs: Partial<Record<string, number>>,
): LineMatch[] {
  const ids = ["listing", "transaction", "processing", "offsite"] as const;
  return ids
    .filter((id) => theirs[id] != null && (theirs[id] ?? 0) > 0)
    .map((id) => {
      const line = ours.find((l) => l.id === id);
      const oursCents = line?.cents ?? 0;
      const theirsCents = theirs[id] ?? 0;
      const deltaCents = oursCents - theirsCents;
      const abs = Math.abs(deltaCents);
      const status = abs <= 1 ? "match" : abs <= 25 ? "close" : "off";
      return { id, label: line?.label ?? id, oursCents, theirsCents, deltaCents, status };
    });
}

export function unitsForGoal(profitCents: number, goalCents: number): number | null {
  if (goalCents <= 0) return null;
  if (profitCents <= 0) return null;
  return Math.ceil(goalCents / profitCents);
}
