import { emitSheet } from "./sheet";
import { loadShop } from "./shop";

export type CatalogFilter = "all" | "problems" | "safe" | "sale";
export type CatalogSort = "risk" | "gap" | "lift" | "name";

export type CatalogUi = {
  filter: CatalogFilter;
  sortBy: CatalogSort;
  query: string;
};

const KEY = "keepfloor.catalog.ui.v1";

const DEFAULT_UI: CatalogUi = { filter: "all", sortBy: "risk", query: "" };

export function loadCatalogUi(): CatalogUi {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_UI };
    const parsed = JSON.parse(raw) as Partial<CatalogUi>;
    const filter = parsed.filter;
    const sortBy = parsed.sortBy;
    return {
      filter:
        filter === "problems" || filter === "safe" || filter === "all" || filter === "sale" ? filter : "all",
      sortBy: sortBy === "gap" || sortBy === "lift" || sortBy === "name" || sortBy === "risk" ? sortBy : "risk",
      query: typeof parsed.query === "string" ? parsed.query : "",
    };
  } catch {
    return { ...DEFAULT_UI };
  }
}

export type CatalogView = CatalogUi & { sale: string };

export function parseCatalogView(query: string): Partial<CatalogView> {
  const p = new URLSearchParams(query);
  const out: Partial<CatalogView> = {};
  const f = p.get("f");
  if (f === "all" || f === "problems" || f === "safe" || f === "sale") out.filter = f;
  const sort = p.get("sort");
  if (sort === "risk" || sort === "gap" || sort === "lift" || sort === "name") out.sortBy = sort;
  const q = p.get("q");
  if (q != null) out.query = q;
  const sale = p.get("sale");
  if (sale != null) out.sale = sale;
  return out;
}

export function catalogHash(view: CatalogView): string {
  const p = new URLSearchParams();
  if (view.filter !== "all") p.set("f", view.filter);
  if (view.sortBy !== "risk") p.set("sort", view.sortBy);
  if (view.query.trim()) p.set("q", view.query.trim());
  if (view.sale && view.sale !== "0") p.set("sale", view.sale);
  const qs = p.toString();
  return qs ? `#/catalog?${qs}` : "#/catalog";
}

export function catalogHref(): string {
  const ui = loadCatalogUi();
  const sale = loadShop().defaultSale || "0";
  return catalogHash({ ...ui, sale });
}

export function saveCatalogUi(ui: CatalogUi): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ui));
    emitSheet();
  } catch {
    /* private mode */
  }
}

export function toggleCatalogFilter(current: CatalogFilter, next: CatalogFilter): CatalogFilter {
  return current === next ? "all" : next;
}

export function catalogPassAfterRestore(): Pick<CatalogUi, "filter" | "query"> {
  return { filter: "all", query: "" };
}

export function importSheetOpen(rowCount: number, userOpen: boolean): boolean {
  return rowCount === 0 || userOpen;
}

export function catalogDropHint(rowCount: number, sheetOpen: boolean): string | null {
  return rowCount > 0 && !sheetOpen ? "drop or paste a CSV anywhere" : null;
}

export function isFileDrag(types: Iterable<string>): boolean {
  for (const t of types) {
    if (t === "Files") return true;
  }
  return false;
}
