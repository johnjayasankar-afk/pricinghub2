import { derive, type ListingFields } from "./worksheet";
import type { ShopPrefs } from "../state/shop";

export type QtyBreak = {
  qty: number;
  safeCents: number;
  possible: boolean;
  keepCents: number;
};

const QTYS = [1, 2, 3, 5];

export function qtyBreaks(shop: ShopPrefs, fields: ListingFields): QtyBreak[] {
  return QTYS.map((qty) => {
    const d = derive(shop, { ...fields, qty: String(qty) });
    return {
      qty,
      safeCents: d.safeCents,
      possible: d.adsFloor.possible,
      keepCents: d.atSafe.profitCents,
    };
  });
}

export function toQtyCsv(breaks: QtyBreak[]): string {
  const body = breaks.map((b) =>
    [b.qty, b.possible ? (b.safeCents / 100).toFixed(2) : "", (b.keepCents / 100).toFixed(2)].join(","),
  );
  return ["qty,ads_safe_list,keep_at_floor", ...body].join("\n");
}
