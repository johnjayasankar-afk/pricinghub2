/** Integer cents. Avoids float drift in fee lines. */

export function dollarsToCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function parseMoney(raw: string): number {
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(cents: number, currency = "USD"): string {
  const abs = Math.abs(cents);
  const sign = cents < 0 ? "−" : "";
  try {
    return (
      sign +
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(abs / 100)
    );
  } catch {
    return `${sign}${(abs / 100).toFixed(2)}`;
  }
}

export function pct(rate: number): string {
  return `${(rate * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
}

export type CharmMode = "none" | "99" | "95" | "00";

/** Cents charm rounding adds above an exact floor. Never negative. */
export function charmTaxCents(exactCents: number, mode: CharmMode): number {
  return Math.max(0, charmUp(exactCents, mode) - exactCents);
}

/** Lowest charm price that is still >= floor cents. */
export function charmUp(cents: number, mode: CharmMode): number {
  if (mode === "none" || cents <= 0) return Math.max(0, cents);
  if (mode === "00") return Math.ceil(cents / 100) * 100;
  const suffix = mode === "99" ? 99 : 95;
  const major = Math.floor(cents / 100);
  let candidate = major * 100 + suffix;
  if (candidate < cents) candidate += 100;
  return candidate;
}

export function saleCharged(listCents: number, salePercent: number): number {
  if (salePercent <= 0) return Math.max(0, listCents);
  const keep = 1 - salePercent / 100;
  if (keep <= 0) return 0;
  return Math.max(0, Math.round(listCents * keep));
}

export function listFromCharged(chargedCents: number, salePercent: number): number {
  if (salePercent <= 0) return Math.max(0, chargedCents);
  const keep = 1 - salePercent / 100;
  if (keep <= 0) return 0;
  return Math.ceil(chargedCents / keep);
}

export function marginPct(profitCents: number, merchCents: number): number | null {
  if (merchCents <= 0) return null;
  return (profitCents / merchCents) * 100;
}

export function allocateListingFee(fullCents: number, mode: "none" | "sale" | "amortize", n: number): number {
  if (mode === "none") return 0;
  if (mode === "sale") return Math.max(0, fullCents);
  const count = Math.max(1, Math.round(n) || 1);
  return Math.round(Math.max(0, fullCents) / count);
}
