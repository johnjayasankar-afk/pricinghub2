import { defaultListing, type ListingFields } from "../engine/worksheet";
import { emitSheet } from "./sheet";

const KEY = "keepfloor.listing.v1";

export function loadListing(): ListingFields {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultListing();
    return { ...defaultListing(), ...(JSON.parse(raw) as Partial<ListingFields>) };
  } catch {
    return defaultListing();
  }
}

export function saveListing(fields: ListingFields): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(fields));
    emitSheet();
  } catch {
    /* private mode */
  }
}
