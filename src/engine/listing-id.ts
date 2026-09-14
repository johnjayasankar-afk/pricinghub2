import { dollarsToCents, parseMoney } from "./money";

export function listingCents(item: string | number): number {
  return dollarsToCents(typeof item === "number" ? item : parseMoney(item));
}

export function listingKey(name: string, item: string | number): string {
  const label = name.trim() || `Untitled ${item}`;
  return `${label.toLowerCase()}|${listingCents(item)}`;
}

export function sameListing(
  a: { name: string; item: string | number },
  b: { name: string; item: string | number },
): boolean {
  return listingKey(a.name, a.item) === listingKey(b.name, b.item);
}
