import { findCatalogEdit, listingToCatalogPatch, type CatalogEditPtr } from "../engine/catalog";
import type { ListingFields } from "../engine/worksheet";
import { loadRows, saveRows } from "./catalog-rows";
import { loadShop } from "./shop";

const KEY = "keepfloor.catalog.edit.v1";

export function markCatalogEdit(edit: CatalogEditPtr): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(edit));
  } catch {
    /* private mode */
  }
}

export function loadCatalogEdit(): CatalogEditPtr | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CatalogEditPtr>;
    if (typeof parsed.index !== "number") return null;
    return {
      index: parsed.index,
      sku: String(parsed.sku ?? ""),
      listingId: String(parsed.listingId ?? ""),
      name: String(parsed.name ?? ""),
    };
  } catch {
    return null;
  }
}

export function clearCatalogEdit(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}

export function writeListingToCatalog(fields: ListingFields): boolean {
  const edit = loadCatalogEdit();
  if (!edit) return false;
  const rows = loadRows();
  const i = findCatalogEdit(rows, edit);
  if (i < 0) {
    clearCatalogEdit();
    return false;
  }
  const next = rows.slice();
  next[i] = { ...next[i]!, ...listingToCatalogPatch(loadShop(), fields) };
  saveRows(next);
  return true;
}
