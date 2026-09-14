import { describe, expect, it } from "vitest";
import {
  addRowRevealsPass,
  applyRowToListing,
  catalogKeepsHours,
  catalogQty,
  catalogRowMatches,
  catalogTextChanged,
  emptyRow,
  fieldsFromRow,
  findCatalogEdit,
  listingToCatalogPatch,
} from "./catalog";
import { defaultListing } from "./worksheet";
import { catalogIsProblem } from "./risk";
import { DEFAULT_SHOP } from "../state/shop";

describe("loops 1.24 catalog row onto the worksheet", () => {
  it("keeps notes and hours when the row labor still matches those hours", () => {
    const current = { ...defaultListing(), name: "Tote", item: "32.00", notes: "shop note", hours: "1.5" };
    const row = { ...emptyRow(), name: "Tote", price: 32, cogs: 9, labor: 30 };
    const next = applyRowToListing(row, "0", current, DEFAULT_SHOP);
    expect(next.notes).toBe("shop note");
    expect(next.hours).toBe("1.5");
    expect(next.cogs).toBe("9");
    expect(next.item).toBe("32.00");
  });

  it("starts clean when the row is a different listing", () => {
    const current = { ...defaultListing(), name: "Tote", item: "32", notes: "shop note", hours: "1.5" };
    const row = { ...emptyRow(), name: "Mug", price: 18, cogs: 4 };
    const next = applyRowToListing(row, "0", current, DEFAULT_SHOP);
    expect(next).toEqual(fieldsFromRow(row, "0"));
    expect(next.notes).toBe("");
  });
});

describe("loops 1.46 a new row is ready to type", () => {
  it("reveals a filtered pass so the new listing is visible", () => {
    expect(addRowRevealsPass("all", "")).toBe(false);
    expect(addRowRevealsPass("safe", "")).toBe(true);
    expect(addRowRevealsPass("all", "tote")).toBe(true);
  });

  it("treats trimmed name and SKU as the commit", () => {
    expect(catalogTextChanged("Tote", "Tote")).toBe(false);
    expect(catalogTextChanged("Tote", " Tote ")).toBe(false);
    expect(catalogTextChanged("New listing", "Tote")).toBe(true);
  });
});

describe("loops 1.49 the worksheet writes back to the row", () => {
  it("finds the row by listing id, then sku, then the seat", () => {
    const rows = [
      { ...emptyRow(), name: "Tote", sku: "TOTE", listingId: "111" },
      { ...emptyRow(), name: "Mug", sku: "MUG", listingId: "" },
      { ...emptyRow(), name: "Print", sku: "", listingId: "" },
    ];
    expect(findCatalogEdit(rows, { index: 0, sku: "", listingId: "111", name: "Tote" })).toBe(0);
    expect(findCatalogEdit(rows, { index: 0, sku: "mug", listingId: "", name: "Other" })).toBe(1);
    expect(findCatalogEdit(rows, { index: 2, sku: "", listingId: "", name: "Print" })).toBe(2);
    expect(findCatalogEdit(rows, { index: 2, sku: "", listingId: "", name: "Renamed" })).toBe(2);
    expect(findCatalogEdit([], { index: 0, sku: "", listingId: "", name: "Tote" })).toBe(-1);
  });

  it("writes hours as labor and keeps postage you typed", () => {
    const patch = listingToCatalogPatch(DEFAULT_SHOP, {
      ...defaultListing(),
      name: "Tote",
      item: "34.99",
      qty: "2",
      shipCharge: "5.50",
      gift: "1",
      cogs: "8.40",
      shipPay: "3.20",
      pack: "0.80",
      labor: "2",
      hours: "1.5",
      target: "12",
      sku: "TOTE",
    });
    expect(patch.price).toBe(34.99);
    expect(patch.quantity).toBe(2);
    expect(patch.shippingYouPay).toBe(3.2);
    expect(patch.packaging).toBe(0.8);
    expect(patch.labor).toBe(30);
    expect(patch.targetProfit).toBe(12);
  });
});

describe("loops 1.50 catalog labor is the source", () => {
  it("keeps hours only when they still produce the row labor", () => {
    expect(catalogKeepsHours("1.5", 30, 30)).toBe(true);
    expect(catalogKeepsHours("1.5", 30, 5)).toBe(false);
    expect(catalogKeepsHours("", 0, 0)).toBe(false);
  });

  it("drops hours when the catalog labor no longer matches", () => {
    const current = { ...defaultListing(), name: "Tote", item: "32.00", hours: "1.5", labor: "2" };
    const row = { ...emptyRow(), name: "Tote", price: 32, labor: 5 };
    const next = applyRowToListing(row, "0", current, DEFAULT_SHOP);
    expect(next.hours).toBe("");
    expect(next.labor).toBe("5");
  });
});

describe("loops 1.51 problems include missing costs", () => {
  it("treats a blank ads-safe row as a problem", () => {
    expect(catalogIsProblem("safe", true)).toBe(true);
    expect(catalogIsProblem("safe", false)).toBe(false);
    expect(catalogIsProblem("below", false)).toBe(true);
  });

  it("finds a listing by Etsy listing id", () => {
    const row = { ...emptyRow(), name: "Tote", sku: "TOTE", listingId: "123456" };
    expect(catalogRowMatches(row, "123456")).toBe(true);
    expect(catalogRowMatches(row, "tote")).toBe(true);
    expect(catalogRowMatches(row, "mug")).toBe(false);
  });
});

describe("loops 1.47 catalog qty is at least one", () => {
  it("clamps a blank or zero quantity to one unit", () => {
    expect(catalogQty("")).toBe(1);
    expect(catalogQty("0")).toBe(1);
    expect(catalogQty("2.4")).toBe(2);
    expect(catalogQty("5")).toBe(5);
  });
});
