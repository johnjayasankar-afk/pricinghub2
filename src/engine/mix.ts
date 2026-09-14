/** Share of orders Etsy attributes to Offsite Ads. Does not change floors. */
export function clampMix(raw: string | number | null | undefined): number {
  if (raw === "" || raw == null) return 25;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 25;
  return Math.min(100, Math.max(0, n));
}

export function mixKeepCents(organicCents: number, adsCents: number, mixPct: number): number {
  const p = clampMix(mixPct) / 100;
  return Math.round((1 - p) * organicCents + p * adsCents);
}
