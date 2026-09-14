import { describe, expect, it } from "vitest";
import { emptyRow, fillSelectedRows } from "./catalog";
import { parseThreshold } from "./threshold";
import { DEFAULT_SHOP } from "../state/shop";
import { defaultListing, derive } from "./worksheet";

describe("shop rules 1.6", () => {
  it("does not change the current-shipping ads-safe floor when free-over is on", () => {
    const fields = defaultListing();
    const off = derive({ ...DEFAULT_SHOP, freeOver: "", charm: "none" }, fields);
    const on = derive({ ...DEFAULT_SHOP, freeOver: "35", charm: "none" }, fields);
    expect(off.safeCents).toBe(on.safeCents);
    expect(on.freeOver?.on).toBe(true);
    expect(on.freeOver?.cross.listCents).toBeGreaterThanOrEqual(3500);
  });

  it("crossing list is at least the charmed threshold and uses free shipping", () => {
    const d = derive({ ...DEFAULT_SHOP, freeOver: "35", charm: "99" }, defaultListing());
    expect(d.freeOver?.cross.freeShip).toBe(true);
    expect(d.freeOver?.cross.possible).toBe(true);
    expect(d.freeOver?.cross.listCents).toBeGreaterThanOrEqual(3599);
  });

  it("treats 0 as no free-over program", () => {
    expect(parseThreshold("0")).toBeNull();
    expect(parseThreshold("")).toBeNull();
    expect(parseThreshold("35")).toBe(3500);
    const d = derive({ ...DEFAULT_SHOP, freeOver: "0" }, defaultListing());
    expect(d.freeOver).toBeNull();
  });

  it("fills only selected catalog rows", () => {
    const rows = [
      { ...emptyRow(), name: "A", cogs: 1, targetProfit: 1 },
      { ...emptyRow(), name: "B", cogs: 2, targetProfit: 2 },
    ];
    const out = fillSelectedRows(rows, [1], { cogs: 8.4, shipPay: 3.2, target: 12 });
    expect(out[0].cogs).toBe(1);
    expect(out[1].cogs).toBe(8.4);
    expect(out[1].shippingYouPay).toBe(3.2);
    expect(out[1].targetProfit).toBe(12);
  });
});
