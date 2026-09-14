import { describe, expect, it } from "vitest";
import { priceCatalog } from "./catalog";
import { catalogTemplate, parseAnyCsv } from "./csv";
import { PRESETS } from "./presets";
import { maxSalePercent } from "./solve";
import { DEFAULT_SHOP } from "../state/shop";
import { applyQuery, bootListing, defaultListing, derive, encodeListing, openQuery } from "./worksheet";

describe("worksheet 1.1", () => {
  it("prices the tote with a higher ads-safe floor than organic", () => {
    const tote = PRESETS[0];
    const d = derive(
      { ...DEFAULT_SHOP, profileId: tote.profileId, charm: "none", listingMode: "sale" },
      {
        ...defaultListing(),
        item: tote.item,
        qty: tote.qty,
        shipCharge: tote.shipCharge,
        cogs: tote.cogs,
        shipPay: tote.shipPay,
        pack: tote.pack,
        labor: tote.labor,
        target: tote.target,
        freeShip: tote.freeShip,
      },
    );
    expect(d.organicFloor.possible).toBe(true);
    expect(d.adsFloor.possible).toBe(true);
    expect(d.safeCents).toBeGreaterThan(d.organicFloor.itemPriceCents);
    expect(d.scenarios.map((s) => s.id)).toContain("freeAds");
    expect(d.maxSalePct).not.toBeNull();
    expect(d.margin).not.toBeNull();
    expect(d.surviveAllCents).toBeGreaterThanOrEqual(d.safeCents);
    expect(d.volume.units).toBe(8);
  });

  it("round-trips a share query", () => {
    const fields = { ...defaultListing(), name: "Sale tote", item: "41.99", salePercent: "20", freeShip: true, notes: "shop note" };
    const shop = { ...DEFAULT_SHOP, fx: true, charm: "95" as const, offsite: "15" as const };
    const next = applyQuery(DEFAULT_SHOP, defaultListing(), encodeListing(shop, fields));
    expect(next.fields.name).toBe("Sale tote");
    expect(next.fields.item).toBe("41.99");
    expect(next.fields.salePercent).toBe("20");
    expect(next.fields.freeShip).toBe(true);
    expect(next.fields.notes).toBe("shop note");
    expect(next.shop.fx).toBe(true);
    expect(next.shop.charm).toBe("95");
    expect(next.shop.offsite).toBe("15");
  });

  it("opens a stored query without the worksheet you are leaving", () => {
    const q = encodeListing(DEFAULT_SHOP, { ...defaultListing(), name: "Mug", item: "18", notes: "" });
    const next = openQuery({ ...DEFAULT_SHOP, fx: true }, q);
    expect(next.fields.name).toBe("Mug");
    expect(next.fields.freeShip).toBe(false);
    expect(next.fields.extraOn).toBe(false);
    expect(next.fields.notes).toBe("");
    expect(next.shop.fx).toBe(false);
  });

  it("boots a different hash without the stored listing's extras", () => {
    const stored = { ...defaultListing(), name: "Tote", item: "32", notes: "keep", freeShip: true, extraOn: true };
    const q = encodeListing(DEFAULT_SHOP, { ...defaultListing(), name: "Mug", item: "18" });
    const next = bootListing(DEFAULT_SHOP, stored, q);
    expect(next.fields.name).toBe("Mug");
    expect(next.fields.notes).toBe("");
    expect(next.fields.freeShip).toBe(false);
    expect(next.fields.extraOn).toBe(false);
  });

  it("boots the same listing without dropping extras the hash does not carry", () => {
    const stored = { ...defaultListing(), name: "Tote", item: "32.00", notes: "keep", deposit: "5" };
    const q = encodeListing(DEFAULT_SHOP, stored);
    const next = bootListing(DEFAULT_SHOP, stored, q);
    expect(next.fields.notes).toBe("keep");
    expect(next.fields.deposit).toBe("5");
  });

  it("round-trips statement lines and fee overrides", () => {
    const fields = {
      ...defaultListing(),
      name: "Tote",
      deposit: "2.50",
      statementFees: "5.68",
      stmtListing: "0.20",
      stmtTxn: "3.58",
      stmtProc: "1.90",
      stmtOffsite: "0",
      txn: "7",
      procRate: "3",
      procFixed: "0.25",
      vat: "20",
    };
    const next = applyQuery(DEFAULT_SHOP, defaultListing(), encodeListing(DEFAULT_SHOP, fields));
    expect(next.fields.deposit).toBe("2.50");
    expect(next.fields.statementFees).toBe("5.68");
    expect(next.fields.stmtListing).toBe("0.20");
    expect(next.fields.stmtTxn).toBe("3.58");
    expect(next.fields.stmtProc).toBe("1.90");
    expect(next.fields.txn).toBe("7");
    expect(next.fields.procRate).toBe("3");
    expect(next.fields.procFixed).toBe("0.25");
    expect(next.fields.vat).toBe("20");
  });

  it("finds a max sale percent at a high list", () => {
    const d = derive(DEFAULT_SHOP, { ...defaultListing(), item: "60" });
    const max = maxSalePercent(d.sale, d.costs, d.listCents, d.targetCents);
    expect(max).toBeGreaterThan(0);
    expect(max).toBeLessThanOrEqual(100);
  });

  it("flags the sample sticker as an ads problem", () => {
    const rows = parseAnyCsv(catalogTemplate()).rows;
    const priced = priceCatalog(rows, { ...DEFAULT_SHOP, charm: "none" }, "0");
    const sticker = priced.find((p) => /sticker/i.test(p.row.name));
    expect(sticker).toBeTruthy();
    expect(sticker?.risk).toBe("below");
  });
});
