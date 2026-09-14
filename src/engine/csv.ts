export type CatalogRow = {
  name: string;
  price: number;
  shipping: number;
  gift: number;
  quantity: number;
  cogs: number;
  shippingYouPay: number;
  packaging: number;
  labor: number;
  targetProfit: number;
  sku: string;
  listingId: string;
};

export type CsvKind = "keepfloor" | "etsy" | "etsy-listings" | "unknown";

const HEADER =
  "name,price,shipping,gift,quantity,cogs,shipping_you_pay,packaging,labor,target_profit,sku";

export function clipboardLooksLikeCatalog(text: string): boolean {
  const first = text.replace(/^\uFEFF/, "").split(/\r?\n/).find((l) => l.trim()) ?? "";
  return first.includes(",") || first.includes("\t") || first.includes(";");
}

export function parseAnyCsv(text: string): { rows: CatalogRow[]; error?: string; kind: CsvKind } {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { rows: [], kind: "unknown", error: "The file is empty." };
  const header = splitCsvLine(lines[0]).map((h) => normHeader(h));
  if (header.length < 2) return { rows: [], kind: "unknown", error: "Need a header row." };

  const kind = detectKind(header);
  const col = (...names: string[]) => {
    for (const name of names) {
      const i = header.indexOf(name);
      if (i >= 0) return i;
    }
    return -1;
  };

  const nameI = col("name", "item name", "title", "listing title", "item title");
  const priceI = col("price", "item price", "amount");
  const itemTotalI = col("item total");
  const shipI = col("shipping", "order shipping");
  const giftI = col("gift", "gift wrap");
  const qtyI = col("quantity", "number of items", "qty");
  const cogsI = col("cogs", "materials");
  const shipPayI = col("shipping_you_pay", "shipping you pay");
  const packI = col("packaging");
  const laborI = col("labor");
  const targetI = col("target_profit", "target profit", "target");
  const skuI = col("sku", "seller sku");
  const orderI = col("order id", "order");
  const listingI = col("listing id", "listingid", "id");

  if (nameI < 0 && priceI < 0 && itemTotalI < 0) {
    return {
      rows: [],
      kind,
      error: "Need a name/title column and a price or item-total column. KeepFloor and Etsy Order items CSVs both work.",
    };
  }

  const rows: CatalogRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const numAt = (idx: number, fallback: number) => {
      if (idx < 0) return fallback;
      const n = Number(String(cols[idx] ?? "").replace(/[^0-9.-]/g, ""));
      return Number.isFinite(n) ? n : fallback;
    };
    const qty = Math.max(1, Math.round(numAt(qtyI, 1)));
    let price = numAt(priceI, NaN);
    if (!Number.isFinite(price) && itemTotalI >= 0) {
      const total = numAt(itemTotalI, 0);
      price = qty > 0 ? total / qty : total;
    }
    if (!Number.isFinite(price)) price = 0;
    const name =
      (nameI >= 0 ? (cols[nameI] ?? "").trim() : "") ||
      (orderI >= 0 ? `Order ${cols[orderI]}` : `Listing ${i}`);
    rows.push({
      name,
      price,
      shipping: numAt(shipI, 0),
      gift: numAt(giftI, 0),
      quantity: qty,
      cogs: numAt(cogsI, 0),
      shippingYouPay: numAt(shipPayI, 0),
      packaging: numAt(packI, 0),
      labor: numAt(laborI, 0),
      targetProfit: numAt(targetI, 0),
      sku: skuI >= 0 ? (cols[skuI] ?? "").trim() : "",
      listingId: listingI >= 0 ? (cols[listingI] ?? "").trim() : "",
    });
  }
  return { rows, kind };
}

export function parseCatalogCsv(text: string) {
  const parsed = parseAnyCsv(text);
  return { rows: parsed.rows, error: parsed.error };
}

export function catalogTemplate(): string {
  return [
    HEADER,
    "Linen tote,32,5.50,0,1,8.40,3.20,0.80,2.00,12,TOTE",
    "Art print 8x10,18,0,0,1,2.10,0,0.40,0.50,8,PRINT",
    "Digital planner,12,0,0,1,0,0,0,1.00,6,PLAN",
    "Vinyl sticker,3,1.50,0,1,0.20,0.68,0.15,0.25,2,STICK",
  ].join("\n");
}

export function toCatalogCsv(rows: CatalogRow[]): string {
  const body = rows.map((r) =>
    [
      csvEscape(r.name),
      r.price,
      r.shipping,
      r.gift,
      r.quantity,
      r.cogs,
      r.shippingYouPay,
      r.packaging,
      r.labor,
      r.targetProfit,
      csvEscape(r.sku),
      csvEscape(r.listingId),
    ].join(","),
  );
  return [HEADER + ",listing_id", ...body].join("\n");
}

export function toEtsyPriceCsv(rows: { sku: string; name: string; price: number }[]): string {
  const header = "SKU,TITLE,PRICE";
  const body = rows.map((r) => [csvEscape(r.sku), csvEscape(r.name), r.price].join(","));
  return [header, ...body].join("\n");
}

export function toRepriceCsv(
  rows: { name: string; current: number; safe: number | null; action: string }[],
): string {
  const header = "name,current_price,safe_floor,action";
  const body = rows.map((r) =>
    [csvEscape(r.name), r.current, r.safe ?? "", csvEscape(r.action)].join(","),
  );
  return [header, ...body].join("\n");
}

export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function detectKind(header: string[]): CsvKind {
  if (header.includes("item name") || header.includes("order id") || header.includes("sale date")) {
    return "etsy";
  }
  if (
    header.includes("title") &&
    header.includes("price") &&
    (header.includes("listing id") || header.includes("listingid") || header.includes("tags"))
  ) {
    return "etsy-listings";
  }
  if (header.includes("name") && header.includes("price")) return "keepfloor";
  if (header.includes("title") && header.includes("price")) return "etsy-listings";
  return "unknown";
}
