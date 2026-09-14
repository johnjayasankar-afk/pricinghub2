import type { OffsiteMode } from "./types";
import type { ListingFields } from "./worksheet";

export type ReplayResult = {
  fields: Partial<ListingFields>;
  offsite?: OffsiteMode;
  error?: string;
};

const KEYS: Record<string, keyof ListingFields | "ads"> = {
  item: "item",
  list: "item",
  price: "item",
  qty: "qty",
  quantity: "qty",
  ship: "shipCharge",
  shipping: "shipCharge",
  tax: "tax",
  fee: "statementFees",
  fees: "statementFees",
  total: "statementFees",
  coupon: "coupon",
  sale: "salePercent",
  ads: "ads",
  offsite: "ads",
};

function adsValue(raw: string): OffsiteMode {
  const n = raw.toLowerCase();
  if (n.includes("12")) return "12";
  if (n.includes("off") || n.includes("organic") || n === "0") return "off";
  return "15";
}

export function parseReplay(raw: string): ReplayResult {
  const text = raw.trim();
  if (!text) return { fields: {}, error: "Nothing to replay." };

  const fields: Partial<ListingFields> = {};
  let offsite: OffsiteMode | undefined;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^([a-z]+)\s*[:=]?\s*(.+)$/i);
    if (m && KEYS[m[1].toLowerCase()]) {
      const dest = KEYS[m[1].toLowerCase()];
      const val = m[2].trim();
      if (dest === "ads") offsite = adsValue(val);
      else {
        const cleaned = val.replace(/[^0-9.-]/g, "") || val;
        if (dest === "item") fields.item = cleaned;
        else if (dest === "qty") fields.qty = cleaned;
        else if (dest === "shipCharge") fields.shipCharge = cleaned;
        else if (dest === "tax") fields.tax = cleaned;
        else if (dest === "statementFees") fields.statementFees = cleaned;
        else if (dest === "coupon") fields.coupon = cleaned;
        else if (dest === "salePercent") fields.salePercent = cleaned;
      }
      continue;
    }
    if (/ads/i.test(trimmed)) offsite = adsValue(trimmed);
  }

  if (fields.item == null) {
    const nums = text.match(/[0-9]+(?:\.[0-9]+)?/);
    if (nums) fields.item = nums[0];
  }

  if (fields.item == null && offsite == null && Object.keys(fields).length === 0) {
    return { fields: {}, error: "Need at least a list price, e.g. item 32.00" };
  }

  if (fields.shipCharge === "0") fields.freeShip = true;
  return { fields, offsite };
}

/** Monthly listing-fee load if every listing renews every four months. */
export function listingFeeDragCents(listingFeeDollars: number, activeListings: number): number {
  if (!(listingFeeDollars > 0) || !(activeListings > 0)) return 0;
  return Math.round(listingFeeDollars * 100 * activeListings / 4);
}
