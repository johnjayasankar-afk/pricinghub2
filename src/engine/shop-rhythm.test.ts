import { describe, expect, it } from "vitest";
import { emptyRow, mergeRows, saleStress } from "./catalog";
import { catalogTemplate, parseAnyCsv } from "./csv";
import { adsRule } from "./policy";
import { qtyBreaks } from "./qty";
import { DEFAULT_SHOP } from "../state/shop";
import { defaultListing, derive, laborEach } from "./worksheet";

describe("shop rhythm 1.4", () => {
  it("qty 3 ads-safe list per unit is at or below qty 1", () => {
    const shop = { ...DEFAULT_SHOP, charm: "none" as const };
    const breaks = qtyBreaks(shop, defaultListing());
    const q1 = breaks.find((b) => b.qty === 1);
    const q3 = breaks.find((b) => b.qty === 3);
    expect(q1?.possible).toBe(true);
    expect(q3?.possible).toBe(true);
    expect(q3!.safeCents).toBeLessThanOrEqual(q1!.safeCents);
  });

  it("hours times hourly become labor and override typed labor", () => {
    const shop = { ...DEFAULT_SHOP, hourly: "25" };
    const fields = { ...defaultListing(), hours: "2", labor: "1" };
    expect(laborEach(shop, fields)).toBe(50);
    const d = derive(shop, fields);
    expect(d.costs.laborCents).toBe(5000);
  });

  it("sale stress finds at least as many misses at 30% as at 0%", () => {
    const rows = parseAnyCsv(catalogTemplate()).rows;
    const s = saleStress(rows, { ...DEFAULT_SHOP, charm: "none" });
    expect(s.map((x) => x.pct)).toEqual([0, 10, 20, 30]);
    expect(s[3].atRisk).toBeGreaterThanOrEqual(s[0].atRisk);
  });

  it("merge by SKU keeps typed costs and takes the new price", () => {
    const existing = [{ ...emptyRow(), name: "Tote", sku: "T1", cogs: 8.4, targetProfit: 12, price: 32 }];
    const incoming = [{ ...emptyRow(), name: "Tote linen", sku: "T1", price: 40 }];
    const out = mergeRows(existing, incoming);
    expect(out).toHaveLength(1);
    expect(out[0].price).toBe(40);
    expect(out[0].name).toBe("Tote linen");
    expect(out[0].cogs).toBe(8.4);
    expect(out[0].targetProfit).toBe(12);
  });

  it("keeps typed gift wrap and takes incoming gift when it is set", () => {
    const existing = [{ ...emptyRow(), sku: "T1", gift: 1.5, price: 32 }];
    const etsy = [{ ...emptyRow(), sku: "T1", gift: 0, price: 40 }];
    expect(mergeRows(existing, etsy)[0]!.gift).toBe(1.5);
    const sheet = [{ ...emptyRow(), sku: "T1", gift: 2, price: 40 }];
    expect(mergeRows(existing, sheet)[0]!.gift).toBe(2);
  });

  it("reports ads headroom under $10k", () => {
    expect(adsRule(8000)?.headroomUsd).toBe(2000);
    expect(adsRule(10_000)?.headroomUsd).toBe(0);
  });
});
