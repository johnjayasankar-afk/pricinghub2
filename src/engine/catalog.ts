import { classifyRisk } from "./risk";
import { clampMix, mixKeepCents } from "./mix";
import type { CatalogRow } from "./csv";
import { quoteProfit } from "./fees";
import { parseMoney, saleCharged } from "./money";
import type { FloorResult, ProfitResult, Risk } from "./types";
import { listingCents, sameListing } from "./listing-id";
import { defaultListing, derive, laborEach, type ListingFields } from "./worksheet";
import type { ShopPrefs } from "../state/shop";

export type PricedRow = {
  row: CatalogRow;
  organic: ProfitResult;
  ads: ProfitResult;
  organicFloor: FloorResult;
  adsFloor: FloorResult;
  safeCents: number;
  gapCents: number;
  liftCents: number;
  risk: Risk;
  blankCosts: boolean;
  mixKeepCents: number;
};

export function fieldsFromRow(row: CatalogRow, salePercent: string): ListingFields {
  return {
    ...defaultListing(),
    name: row.name,
    item: String(row.price),
    qty: String(row.quantity),
    shipCharge: String(row.shipping),
    gift: String(row.gift),
    cogs: String(row.cogs),
    shipPay: String(row.shippingYouPay),
    pack: String(row.packaging),
    labor: String(row.labor),
    target: String(row.targetProfit),
    salePercent,
    unitsMonth: "0",
    proposed: "",
    statementFees: "",
    freeShip: false,
    extraOn: false,
    sku: row.sku,
  };
}

export function catalogKeepsHours(hours: string, laborFromHours: number, rowLabor: number): boolean {
  return (Number(hours) || 0) > 0 && laborFromHours === rowLabor;
}

export function applyRowToListing(
  row: CatalogRow,
  salePercent: string,
  current: ListingFields,
  shop: ShopPrefs,
): ListingFields {
  const next = fieldsFromRow(row, salePercent);
  if (!sameListing(current, next)) return next;
  const keepHours = catalogKeepsHours(current.hours, laborEach(shop, current), parseMoney(next.labor));
  return {
    ...current,
    name: next.name,
    item: listingCents(current.item) === listingCents(next.item) ? current.item : next.item,
    qty: next.qty,
    shipCharge: next.shipCharge,
    gift: next.gift,
    cogs: next.cogs,
    shipPay: next.shipPay,
    pack: next.pack,
    labor: next.labor,
    target: next.target,
    salePercent: next.salePercent,
    sku: next.sku,
    hours: keepHours ? current.hours : "",
  };
}

export type CatalogEditPtr = {
  index: number;
  sku: string;
  listingId: string;
  name: string;
};

export function findCatalogEdit(rows: CatalogRow[], edit: CatalogEditPtr): number {
  if (edit.listingId.trim()) {
    const i = rows.findIndex((r) => r.listingId === edit.listingId);
    if (i >= 0) return i;
  }
  const sku = edit.sku.trim().toLowerCase();
  if (sku) {
    const i = rows.findIndex((r) => r.sku.trim().toLowerCase() === sku);
    if (i >= 0) return i;
  }
  const at = rows[edit.index];
  if (at && at.name === edit.name) return edit.index;
  const named = rows.findIndex((r) => r.name === edit.name);
  if (named >= 0) return named;
  if (!edit.listingId.trim() && !edit.sku.trim() && at) return edit.index;
  return -1;
}

export function listingToCatalogPatch(shop: ShopPrefs, fields: ListingFields): Partial<CatalogRow> {
  return {
    name: fields.name.trim() || "New listing",
    sku: fields.sku.trim(),
    price: parseMoney(fields.item),
    quantity: catalogQty(fields.qty),
    shipping: parseMoney(fields.shipCharge),
    gift: parseMoney(fields.gift),
    cogs: parseMoney(fields.cogs),
    shippingYouPay: parseMoney(fields.shipPay),
    packaging: parseMoney(fields.pack),
    labor: laborEach(shop, fields),
    targetProfit: parseMoney(fields.target),
  };
}

export function priceRow(row: CatalogRow, shop: ShopPrefs, salePercent: string): PricedRow {
  const d = derive(shop, fieldsFromRow(row, salePercent));
  const organic = d.scenarios.find((s) => s.id === "organic")!.atPrice;
  const pct = Math.max(0, Number(salePercent) || 0);
  const atSafe = d.adsFloor.possible
    ? quoteProfit({ ...d.sale, itemPriceCents: saleCharged(d.safeCents, pct), offsiteRate: 0.15 }, d.costs)
    : d.ads15;
  return {
    row,
    organic,
    ads: d.ads15,
    organicFloor: d.organicFloor,
    adsFloor: d.adsFloor,
    safeCents: d.safeCents,
    gapCents: d.adsFloor.possible ? d.safeCents - d.listCents : 0,
    liftCents: d.adsFloor.possible ? atSafe.profitCents - d.ads15.profitCents : 0,
    risk: classifyRisk(d.ads15.profitCents, d.targetCents, d.adsFloor.possible),
    blankCosts: isBlankRow(row),
    mixKeepCents: mixKeepCents(organic.profitCents, d.ads15.profitCents, clampMix(shop.adsMix)),
  };
}

export function rowListCents(row: { price: number }): number {
  return Math.round(row.price * 100);
}

export function floorsToApply(rows: PricedRow[]): {
  ready: PricedRow[];
  blank: PricedRow[];
  raise: PricedRow[];
  already: PricedRow[];
} {
  const possible = rows.filter((p) => p.adsFloor.possible);
  const ready = possible.filter((p) => !p.blankCosts);
  const blank = possible.filter((p) => p.blankCosts);
  return {
    ready,
    blank,
    raise: ready.filter((p) => rowListCents(p.row) !== p.safeCents),
    already: ready.filter((p) => rowListCents(p.row) === p.safeCents),
  };
}

export function exportNeedRows(rowCount: number): string | null {
  return rowCount === 0 ? "Add listings first." : null;
}

export function selectProblemNote(count: number): string {
  return count === 0 ? "No problem listings." : `Selected ${count} problem listing${count === 1 ? "" : "s"}.`;
}

export function applyFloorsNote(raise: number, already: number, blank: number): string {
  if (raise === 0 && already === 0) {
    return blank
      ? `Skipped ${blank} row${blank === 1 ? "" : "s"} with no costs. Fill COGS and a target first.`
      : "No ads-safe floors to apply.";
  }
  if (raise === 0) {
    return `${already} already at ads-safe.${blank ? ` Skipped ${blank} with no costs.` : ""}`;
  }
  return `${raise} list${raise === 1 ? "" : "s"} set to ads-safe.${
    already ? ` ${already} already there.` : ""
  }${blank ? ` Skipped ${blank} with no costs.` : ""}`;
}

export function rowsAt<T>(rows: T[], indexes: Iterable<number>): T[] {
  const set = new Set(indexes);
  return rows.filter((_, i) => set.has(i));
}

export function priceCatalog(rows: CatalogRow[], shop: ShopPrefs, salePercent: string): PricedRow[] {
  return rows.map((row) => priceRow(row, shop, salePercent));
}

export function actionFor(p: PricedRow): string {
  if (p.risk === "impossible") return "review-costs";
  if (p.risk === "safe") return "keep";
  return "raise";
}

export function addRowRevealsPass(filter: string, query: string): boolean {
  return filter !== "all" || query.trim().length > 0;
}

export function catalogTextChanged(prev: string, next: string): boolean {
  return prev !== next.trim();
}

export function catalogRowMatches(row: CatalogRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return `${row.name} ${row.sku} ${row.listingId}`.toLowerCase().includes(q);
}

export function catalogQty(raw: string): number {
  return Math.max(1, Math.round(Number(raw) || 1));
}

export function emptyRow(): CatalogRow {
  return {
    name: "New listing",
    price: 0,
    shipping: 0,
    gift: 0,
    quantity: 1,
    cogs: 0,
    shippingYouPay: 0,
    packaging: 0,
    labor: 0,
    targetProfit: 0,
    sku: "",
    listingId: "",
  };
}

export function isBlankRow(row: CatalogRow): boolean {
  return row.cogs === 0 && row.packaging === 0 && row.labor === 0 && row.targetProfit === 0;
}

export function sameShopDefaults(
  row: CatalogRow,
  defaults: { cogs: number; shipPay: number; target: number },
): boolean {
  return row.cogs === defaults.cogs && row.shippingYouPay === defaults.shipPay && row.targetProfit === defaults.target;
}

export function fillBlankRows(
  rows: CatalogRow[],
  defaults: { cogs: number; shipPay: number; target: number },
): CatalogRow[] {
  return rows.map((row) => {
    if (!isBlankRow(row)) return row;
    const postage = row.shippingYouPay !== 0 ? row.shippingYouPay : defaults.shipPay;
    if (row.cogs === defaults.cogs && row.shippingYouPay === postage && row.targetProfit === defaults.target) {
      return row;
    }
    return { ...row, cogs: defaults.cogs, shippingYouPay: postage, targetProfit: defaults.target };
  });
}

export function fillSelectedRows(
  rows: CatalogRow[],
  indexes: Iterable<number>,
  defaults: { cogs: number; shipPay: number; target: number },
): CatalogRow[] {
  const set = new Set(indexes);
  return rows.map((row, i) => {
    if (!set.has(i) || sameShopDefaults(row, defaults)) return row;
    return { ...row, cogs: defaults.cogs, shippingYouPay: defaults.shipPay, targetProfit: defaults.target };
  });
}

export function deletePickedNeedsConfirm(picked: number, total: number): boolean {
  return picked > 1 || (picked > 0 && picked === total);
}

export function catalogRollup(rows: PricedRow[]): { raise: number; liftCents: number; gapCents: number } {
  let raise = 0;
  let liftCents = 0;
  let gapCents = 0;
  for (const p of rows) {
    if (p.gapCents > 0 && p.adsFloor.possible) {
      raise += 1;
      liftCents += p.liftCents;
      gapCents += p.gapCents;
    }
  }
  return { raise, liftCents, gapCents };
}

export function shopHealth(rows: PricedRow[]): {
  listings: number;
  atRisk: number;
  adsLoss: number;
  liftCents: number;
  lostCents: number;
  mixKeepCents: number;
} {
  const roll = catalogRollup(rows);
  let adsLoss = 0;
  let lostCents = 0;
  let mixKeep = 0;
  for (const p of rows) {
    if (p.risk === "ads-loss") adsLoss += 1;
    if (p.ads.profitCents < 0) lostCents += p.ads.profitCents;
    mixKeep += p.mixKeepCents;
  }
  return {
    listings: rows.length,
    atRisk: rows.filter((p) => p.risk !== "safe").length,
    adsLoss,
    liftCents: roll.liftCents,
    lostCents,
    mixKeepCents: mixKeep,
  };
}

/** Safe at full price, misses ads-safe once the shop sale is on. */
export function breaksOnSale(atZero: PricedRow, atSale: PricedRow): boolean {
  return atZero.risk === "safe" && atSale.risk !== "safe";
}

export function saleBreakIndexes(atZero: PricedRow[], atSale: PricedRow[]): number[] {
  const out: number[] = [];
  const n = Math.min(atZero.length, atSale.length);
  for (let i = 0; i < n; i++) {
    if (breaksOnSale(atZero[i]!, atSale[i]!)) out.push(i);
  }
  return out;
}

export function saleStress(
  rows: CatalogRow[],
  shop: ShopPrefs,
  percents = [0, 10, 20, 30],
): { pct: number; atRisk: number; safe: number }[] {
  return percents.map((pct) => {
    const priced = priceCatalog(rows, shop, String(pct));
    const atRisk = priced.filter((p) => p.risk !== "safe").length;
    return { pct, atRisk, safe: priced.length - atRisk };
  });
}

function rowKey(row: CatalogRow): string {
  return (row.sku || row.listingId || row.name).trim().toLowerCase();
}

export function mergeRows(existing: CatalogRow[], incoming: CatalogRow[]): CatalogRow[] {
  const map = new Map<string, CatalogRow>();
  for (const row of existing) map.set(rowKey(row), row);
  for (const row of incoming) {
    const key = rowKey(row);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, row);
      continue;
    }
    map.set(key, {
      ...prev,
      name: row.name || prev.name,
      price: row.price,
      quantity: row.quantity,
      shipping: row.shipping || prev.shipping,
      gift: row.gift || prev.gift,
      sku: row.sku || prev.sku,
      listingId: row.listingId || prev.listingId,
      cogs: isBlankRow(row) ? prev.cogs : row.cogs,
      shippingYouPay: isBlankRow(row) ? prev.shippingYouPay : row.shippingYouPay,
      packaging: isBlankRow(row) ? prev.packaging : row.packaging,
      labor: isBlankRow(row) ? prev.labor : row.labor,
      targetProfit: isBlankRow(row) ? prev.targetProfit : row.targetProfit,
    });
  }
  return [...map.values()];
}

export function dedupeBySku(rows: CatalogRow[]): CatalogRow[] {
  const map = new Map<string, CatalogRow>();
  for (const row of rows) {
    const key = row.sku.trim().toLowerCase() || `name:${row.name.toLowerCase()}`;
    const prev = map.get(key);
    if (!prev) map.set(key, row);
    else map.set(key, isBlankRow(prev) && !isBlankRow(row) ? row : prev);
  }
  return [...map.values()];
}
