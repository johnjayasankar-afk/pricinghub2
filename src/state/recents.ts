import { listingKey } from "../engine/listing-id";
import { encodeListing, type ListingFields } from "../engine/worksheet";
import type { ShopPrefs } from "./shop";

export type Recent = {
  id: string;
  name: string;
  item: string;
  savedAt: number;
  query: string;
  pinned?: boolean;
};

const KEY = "keepfloor.recents.v1";
export const MAX_RECENTS = 12;

export function sortRecents(all: Recent[]): Recent[] {
  return [...all].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.savedAt - a.savedAt);
}

/** Keep pinned first. Never drop a pin to make room unless pins alone exceed the cap. */
export function trimRecents(all: Recent[], max = MAX_RECENTS): Recent[] {
  const sorted = sortRecents(all);
  const pinned = sorted.filter((r) => r.pinned);
  if (pinned.length >= max) return pinned.slice(0, max);
  return [...pinned, ...sorted.filter((r) => !r.pinned)].slice(0, max);
}

export function coalesceRecents(all: Recent[]): Recent[] {
  const map = new Map<string, Recent>();
  for (const raw of all) {
    const id = recentId({ name: raw.name, item: raw.item });
    const r = { ...raw, id };
    const prev = map.get(id);
    if (!prev) {
      map.set(id, r);
      continue;
    }
    const newer = r.savedAt >= prev.savedAt ? r : prev;
    map.set(id, {
      ...newer,
      pinned: Boolean(prev.pinned || r.pinned),
      savedAt: Math.max(prev.savedAt, r.savedAt),
    });
  }
  return trimRecents([...map.values()]);
}

function persist(all: Recent[]): Recent[] {
  const next = coalesceRecents(all);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}

export function loadRecents(): Recent[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Recent[];
    return Array.isArray(parsed) ? coalesceRecents(parsed) : [];
  } catch {
    return [];
  }
}

export function recentId(fields: Pick<ListingFields, "name" | "item">): string {
  return listingKey(fields.name, fields.item);
}

export function rememberRecent(shop: ShopPrefs, fields: ListingFields): Recent[] {
  const name = fields.name.trim() || `Untitled ${fields.item}`;
  const query = encodeListing(shop, fields);
  const id = recentId(fields);
  const prev = loadRecents();
  const existing = prev.find((r) => r.id === id);
  const next: Recent = {
    id,
    name,
    item: fields.item,
    savedAt: Date.now(),
    query,
    pinned: existing?.pinned,
  };
  return persist([next, ...prev.filter((r) => r.id !== next.id)]);
}

export function parkIfDifferent(
  shop: ShopPrefs,
  current: ListingFields,
  next: Pick<ListingFields, "name" | "item">,
): { recents: Recent[]; parked: boolean } {
  if (recentId(current) === recentId(next)) {
    return { recents: loadRecents(), parked: false };
  }
  return { recents: rememberRecent(shop, current), parked: true };
}

export function removeRecent(id: string): Recent[] {
  return persist(loadRecents().filter((r) => r.id !== id));
}

export function togglePin(id: string): Recent[] {
  return persist(loadRecents().map((r) => (r.id === id ? { ...r, pinned: !r.pinned } : r)));
}

export function lastUnpinned(all: Recent[]): Recent | undefined {
  return sortRecents(all).find((r) => !r.pinned);
}
