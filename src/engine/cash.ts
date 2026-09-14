/** Etsy payment reserve holds a percent. It is not a fee and does not change floors. */
export function clampReserve(raw: string | number | null | undefined): number {
  if (raw === "" || raw == null) return 0;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export function cashAfterReserve(keepCents: number, reservePct: number): number {
  const p = clampReserve(reservePct) / 100;
  return Math.round(keepCents * (1 - p));
}
