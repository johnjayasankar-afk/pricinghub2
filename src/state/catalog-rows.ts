import { catalogTemplate, parseCatalogCsv, type CatalogRow } from "../engine/csv";

const KEY = "keepfloor.catalog.rows.v1";

export function defaultRows(): CatalogRow[] {
  return parseCatalogCsv(catalogTemplate()).rows;
}

export function parseStoredRows(parsed: unknown): CatalogRow[] {
  if (!Array.isArray(parsed)) return defaultRows();
  return parsed.map((row: CatalogRow) => ({
    name: String(row?.name ?? ""),
    price: Number(row?.price) || 0,
    shipping: Number(row?.shipping) || 0,
    gift: Number(row?.gift) || 0,
    quantity: Math.max(1, Number(row?.quantity) || 1),
    cogs: Number(row?.cogs) || 0,
    shippingYouPay: Number(row?.shippingYouPay) || 0,
    packaging: Number(row?.packaging) || 0,
    labor: Number(row?.labor) || 0,
    targetProfit: Number(row?.targetProfit) || 0,
    sku: String(row?.sku ?? ""),
    listingId: String(row?.listingId ?? ""),
  }));
}

export function loadRows(): CatalogRow[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultRows();
    return parseStoredRows(JSON.parse(raw));
  } catch {
    return defaultRows();
  }
}

export function saveRows(rows: CatalogRow[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* private mode */
  }
}
