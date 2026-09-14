import { describe, expect, it } from "vitest";
import { deletePickedNeedsConfirm, emptyRow, fillBlankRows, fillSelectedRows, floorsToApply, isBlankRow, priceCatalog } from "./catalog";
import { adsRule, reconcileFees, reconcileLines, unitsForGoal, vatRemitFromGross } from "./policy";
import { ladderLists } from "./ladder";
import { clipboardLooksLikeCatalog, parseAnyCsv, toEtsyPriceCsv } from "./csv";
import { DEFAULT_SHOP } from "../state/shop";

describe("ads rule and reconcile", () => {
  it("treats under $10k as 15% with opt-out", () => {
    const r = adsRule(9999.99);
    expect(r?.over).toBe(false);
    expect(r?.suggested).toBe("15");
  });

  it("treats $10k as 12% mandatory", () => {
    const r = adsRule(10_000);
    expect(r?.over).toBe(true);
    expect(r?.suggested).toBe("12");
  });

  it("ignores empty trailing sales", () => {
    expect(adsRule(0)).toBeNull();
  });

  it("matches fees within a cent", () => {
    expect(reconcileFees(568, 568)?.status).toBe("match");
    expect(reconcileFees(568, 567)?.status).toBe("match");
    expect(reconcileFees(568, 550)?.status).toBe("close");
    expect(reconcileFees(568, 400)?.status).toBe("off");
    expect(reconcileFees(568, 0)).toBeNull();
  });

  it("counts units to a monthly goal", () => {
    expect(unitsForGoal(1200, 9600)).toBe(8);
    expect(unitsForGoal(0, 9600)).toBeNull();
  });

  it("backs VAT out of a VAT-inclusive gross", () => {
    expect(vatRemitFromGross(1800, 0.2)).toBe(300);
    expect(vatRemitFromGross(1800, 0)).toBe(0);
  });

  it("matches statement fee lines", () => {
    const lines = reconcileLines(
      [
        { id: "listing", label: "Listing fee", cents: 20 },
        { id: "transaction", label: "Transaction fee", cents: 358 },
      ],
      { listing: 20, transaction: 400 },
    );
    expect(lines[0].status).toBe("match");
    expect(lines[1].status).toBe("off");
  });
});

describe("ladder and etsy listings csv", () => {
  it("never lists a charm price below the floor", () => {
    const lists = ladderLists(3147, 3200, "99");
    expect(lists[0]).toBeGreaterThanOrEqual(3147);
    expect(lists.some((c) => c === 3200 || c === 3199)).toBe(true);
  });

  it("parses a Shop Manager listings file and writes a price CSV", () => {
    const csv = ["TITLE,PRICE,SKU,LISTING ID", "Linen tote,32.00,TOTE,123"].join("\n");
    const parsed = parseAnyCsv(csv);
    expect(parsed.kind).toBe("etsy-listings");
    expect(parsed.rows[0].name).toBe("Linen tote");
    expect(parsed.rows[0].sku).toBe("TOTE");
    expect(parsed.rows[0].listingId).toBe("123");
    expect(toEtsyPriceCsv([{ sku: "TOTE", name: "Linen tote", price: 38.99 }])).toContain("38.99");
  });
});

describe("loops 1.44 clipboard looks like a catalog", () => {
  it("accepts a header row and rejects a copied price", () => {
    expect(clipboardLooksLikeCatalog("name,price\nTote,32")).toBe(true);
    expect(clipboardLooksLikeCatalog("TITLE\tPRICE\nTote\t32")).toBe(true);
    expect(clipboardLooksLikeCatalog("32.00")).toBe(false);
    expect(clipboardLooksLikeCatalog("")).toBe(false);
  });
});

describe("catalog blanks", () => {
  it("fills only rows with no costs or target", () => {
    const blank = emptyRow();
    const filled = { ...emptyRow(), name: "Tote", cogs: 8.4, targetProfit: 12 };
    const out = fillBlankRows([blank, filled], { cogs: 5, shipPay: 2, target: 9 });
    expect(isBlankRow(blank)).toBe(true);
    expect(out[0].cogs).toBe(5);
    expect(out[0].targetProfit).toBe(9);
    expect(out[1].cogs).toBe(8.4);
    expect(out[1].targetProfit).toBe(12);
  });

  it("does not rewrite a blank row when defaults are already zero", () => {
    const blank = emptyRow();
    const out = fillBlankRows([blank], { cogs: 0, shipPay: 0, target: 0 });
    expect(out[0]).toBe(blank);
  });
});

describe("loops 1.48 postage is not a filled cost", () => {
  it("still treats a row as blank when only postage is typed", () => {
    const row = { ...emptyRow(), name: "Tote", shippingYouPay: 3.2 };
    expect(isBlankRow(row)).toBe(true);
    const filled = fillBlankRows([row], { cogs: 8.4, shipPay: 2, target: 12 });
    expect(filled[0].cogs).toBe(8.4);
    expect(filled[0].shippingYouPay).toBe(3.2);
    expect(filled[0].targetProfit).toBe(12);
  });

  it("will not apply a floor to a postage-only row", () => {
    const priced = priceCatalog([{ ...emptyRow(), name: "Tote", price: 12, shippingYouPay: 3.2 }], DEFAULT_SHOP, "0");
    expect(priced[0].blankCosts).toBe(true);
    const { raise, blank } = floorsToApply(priced);
    expect(raise.length).toBe(0);
    expect(blank.length).toBe(1);
  });
});

describe("loops 1.41 catalog wipe and fill honesty", () => {
  it("asks before deleting more than one or the last listing", () => {
    expect(deletePickedNeedsConfirm(0, 4)).toBe(false);
    expect(deletePickedNeedsConfirm(1, 4)).toBe(false);
    expect(deletePickedNeedsConfirm(1, 1)).toBe(true);
    expect(deletePickedNeedsConfirm(3, 8)).toBe(true);
    expect(deletePickedNeedsConfirm(8, 8)).toBe(true);
  });

  it("leaves selected rows in place when they already have those defaults", () => {
    const row = { ...emptyRow(), name: "Tote", cogs: 8.4, shippingYouPay: 2, targetProfit: 12 };
    const out = fillSelectedRows([row], [0], { cogs: 8.4, shipPay: 2, target: 12 });
    expect(out[0]).toBe(row);
  });
});
