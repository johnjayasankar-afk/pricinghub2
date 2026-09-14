import { defaultListing, type ListingFields } from "../engine/worksheet";
import type { CatalogRow } from "../engine/csv";
import { DEFAULT_SHOP, loadShop, saveShop, type ShopPrefs } from "./shop";
import { clearCatalogEdit } from "./catalog-edit";
import { loadListing, saveListing } from "./listing";
import { rememberRecent } from "./recents";
import { parseStoredRows, loadRows, saveRows } from "./catalog-rows";
import { emitRestore } from "./sheet";

export const BACKUP_VERSION = 1;

export type ShopBackup = {
  v: number;
  at: number;
  shop: ShopPrefs;
  listing: ListingFields;
  rows: CatalogRow[];
};

export function buildBackup(
  shop = loadShop(),
  listing = loadListing(),
  rows = loadRows(),
): ShopBackup {
  return { v: BACKUP_VERSION, at: Date.now(), shop, listing, rows };
}

export function parseBackup(raw: string): { ok: true; data: ShopBackup } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as Partial<ShopBackup>;
    if (parsed.v !== BACKUP_VERSION) return { ok: false, error: "This file is not a KeepFloor 1 backup." };
    if (!parsed.shop || !parsed.listing || !Array.isArray(parsed.rows)) {
      return { ok: false, error: "Backup is missing shop, listing, or catalog rows." };
    }
    return {
      ok: true,
      data: {
        v: BACKUP_VERSION,
        at: Number(parsed.at) || Date.now(),
        shop: { ...DEFAULT_SHOP, ...parsed.shop },
        listing: { ...defaultListing(), ...parsed.listing },
        rows: parseStoredRows(parsed.rows),
      },
    };
  } catch {
    return { ok: false, error: "Could not read that file as JSON." };
  }
}

export function applyBackup(data: ShopBackup): void {
  rememberRecent(loadShop(), loadListing());
  clearCatalogEdit();
  saveShop(data.shop);
  saveListing(data.listing);
  saveRows(parseStoredRows(data.rows));
  emitRestore();
}

export function backupFilename(at = Date.now()): string {
  const d = new Date(at);
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `keepfloor-backup-${stamp}.json`;
}
