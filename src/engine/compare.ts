import { formatMoney } from "./money";
import type { Derived } from "./worksheet";

export type ListingCard = {
  name: string;
  listCents: number;
  keepCents: number;
  mixKeepCents: number;
  safeCents: number;
  safePossible: boolean;
  cashCents: number;
};

export function listingCard(name: string, d: Derived): ListingCard {
  return {
    name: name.trim() || "Listing",
    listCents: d.listCents,
    keepCents: d.quoted.profitCents,
    mixKeepCents: d.mixKeepCents,
    safeCents: d.safeCents,
    safePossible: d.adsFloor.possible,
    cashCents: d.cashCents,
  };
}

export function compareCards(a: ListingCard, b: ListingCard): { keepDelta: number; safeDelta: number; mixDelta: number } {
  return {
    keepDelta: a.keepCents - b.keepCents,
    mixDelta: a.mixKeepCents - b.mixKeepCents,
    safeDelta: (a.safePossible ? a.safeCents : 0) - (b.safePossible ? b.safeCents : 0),
  };
}

export function compareText(a: ListingCard, b: ListingCard, currency: string): string {
  const d = compareCards(a, b);
  const money = (n: number) => formatMoney(n, currency);
  const safe = (c: ListingCard) => (c.safePossible ? money(c.safeCents) : "n/a");
  return [
    `${a.name} vs ${b.name}`,
    `List ${money(a.listCents)} / ${money(b.listCents)} (\u0394 ${money(a.listCents - b.listCents)})`,
    `Keep ${money(a.keepCents)} / ${money(b.keepCents)} (\u0394 ${money(d.keepDelta)})`,
    `Expected keep ${money(a.mixKeepCents)} / ${money(b.mixKeepCents)} (\u0394 ${money(d.mixDelta)})`,
    `Ads-safe ${safe(a)} / ${safe(b)} (\u0394 ${money(d.safeDelta)})`,
    `Cash ${money(a.cashCents)} / ${money(b.cashCents)}`,
  ].join("\n");
}
