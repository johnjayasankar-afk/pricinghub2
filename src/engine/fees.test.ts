import { describe, expect, it } from "vitest";
import { catalogTemplate, parseAnyCsv, parseCatalogCsv } from "./csv";
import { quoteProfit, quoteSale } from "./fees";
import { insights } from "./insights";
import { classifyRisk } from "./risk";
import { allocateListingFee, charmUp, dollarsToCents, listFromCharged, saleCharged } from "./money";
import { solveFloor, solveListFloor } from "./solve";

const extras = {
  personalizationCents: 0,
  discountCents: 0,
  addonCents: 0,
  depositFeeCents: 0,
  salesVatRate: 0,
};

const usBase = {
  ...extras,
  quantity: 1,
  shippingChargedCents: dollarsToCents(5),
  giftWrapCents: 0,
  listingFeeCents: dollarsToCents(0.2),
  transactionRate: 0.065,
  processingRate: 0.03,
  processingFixedCents: dollarsToCents(0.25),
  regulatoryRate: 0,
  offsiteRate: 0,
  offsiteCapCents: dollarsToCents(100),
  currencyConversionRate: 0,
  vatOnFeesRate: 0,
  buyerTaxCents: 0,
};

const costs0 = { cogsCents: 0, shippingYouPayCents: 0, packagingCents: 0, laborCents: 0, addonCostCents: 0 };

describe("quoteSale US official stack", () => {
  it("matches a $50 item + $5 shipping with published US rates", () => {
    const q = quoteSale({ ...usBase, itemPriceCents: dollarsToCents(50) });
    expect(q.merchandiseCents).toBe(5500);
    expect(q.lines.find((l) => l.id === "listing")?.cents).toBe(20);
    expect(q.lines.find((l) => l.id === "transaction")?.cents).toBe(358);
    expect(q.lines.find((l) => l.id === "processing")?.cents).toBe(190);
    expect(q.totalFeesCents).toBe(568);
    expect(q.sellerNetCents).toBe(4932);
  });

  it("adds personalization to the fee base", () => {
    const q = quoteSale({
      ...usBase,
      itemPriceCents: dollarsToCents(50),
      personalizationCents: dollarsToCents(10),
    });
    expect(q.merchandiseCents).toBe(6500);
    expect(q.lines.find((l) => l.id === "transaction")?.cents).toBe(423);
  });

  it("treats included VAT as a cost so the floor can rise", () => {
    const noVat = quoteProfit({ ...usBase, itemPriceCents: dollarsToCents(50) }, costs0);
    const vat = quoteProfit({ ...usBase, itemPriceCents: dollarsToCents(50), salesVatRate: 0.2 }, costs0);
    expect(vat.salesVatRemitCents).toBeGreaterThan(0);
    expect(vat.profitCents).toBe(noVat.profitCents - vat.salesVatRemitCents);
  });

  it("subtracts a coupon before percentage fees", () => {
    const q = quoteSale({
      ...usBase,
      itemPriceCents: dollarsToCents(50),
      discountCents: dollarsToCents(10),
    });
    expect(q.merchandiseCents).toBe(4500);
  });

  it("caps Offsite Ads and records the raw amount", () => {
    const ads = quoteSale({ ...usBase, itemPriceCents: dollarsToCents(50), offsiteRate: 0.15 });
    expect(ads.lines.find((l) => l.id === "offsite")?.cents).toBe(825);
    const big = quoteSale({
      ...usBase,
      itemPriceCents: dollarsToCents(900),
      shippingChargedCents: 0,
      offsiteRate: 0.15,
    });
    expect(big.lines.find((l) => l.id === "offsite")?.cents).toBe(10000);
    expect(big.offsiteCapped).toBe(true);
    expect(big.offsiteRawCents).toBeGreaterThan(10000);
  });

  it("assesses processing on merchandise plus buyer tax", () => {
    const q = quoteSale({
      ...usBase,
      itemPriceCents: dollarsToCents(50),
      buyerTaxCents: dollarsToCents(4.13),
    });
    expect(q.processingBaseCents).toBe(5500 + 413);
    expect(q.lines.find((l) => l.id === "processing")?.cents).toBe(Math.round(5913 * 0.03) + 25);
    expect(q.lines.find((l) => l.id === "transaction")?.cents).toBe(358);
  });
});

describe("floors, sales, charm", () => {
  const costs = { cogsCents: 840, shippingYouPayCents: 320, packagingCents: 80, laborCents: 200, addonCostCents: 0 };

  it("finds the lowest charged price that hits the profit target", () => {
    const floor = solveFloor(usBase, costs, dollarsToCents(12));
    expect(floor.possible).toBe(true);
    const hit = quoteProfit({ ...usBase, itemPriceCents: floor.itemPriceCents }, costs);
    expect(hit.profitCents).toBeGreaterThanOrEqual(1200);
    const below = quoteProfit({ ...usBase, itemPriceCents: floor.itemPriceCents - 1 }, costs);
    expect(below.profitCents).toBeLessThan(1200);
  });

  it("raises the list floor when a 20% sale is on", () => {
    const full = solveListFloor(usBase, costs, dollarsToCents(12), 0, "none");
    const sale = solveListFloor(usBase, costs, dollarsToCents(12), 20, "none");
    expect(sale.itemPriceCents).toBeGreaterThan(full.itemPriceCents);
    expect(saleCharged(sale.itemPriceCents, 20)).toBeGreaterThanOrEqual(full.itemPriceCents - 1);
  });

  it("rounds charm prices up, never down", () => {
    expect(charmUp(3147, "99")).toBe(3199);
    expect(charmUp(3199, "99")).toBe(3199);
    expect(charmUp(3200, "99")).toBe(3299);
    expect(charmUp(3200, "00")).toBe(3200);
    expect(charmUp(3201, "00")).toBe(3300);
    expect(charmUp(3110, "95")).toBe(3195);
  });

  it("converts charged to list under a sale", () => {
    expect(listFromCharged(3200, 20)).toBe(4000);
    expect(saleCharged(4000, 20)).toBe(3200);
  });

  it("allocates listing fee", () => {
    expect(allocateListingFee(20, "none", 8)).toBe(0);
    expect(allocateListingFee(20, "sale", 8)).toBe(20);
    expect(allocateListingFee(20, "amortize", 8)).toBe(3);
  });
});

describe("insights and csv", () => {
  it("labels ads-safe vs below from ads profit, not organic", () => {
    expect(classifyRisk(50, 100, true)).toBe("below");
    expect(classifyRisk(120, 100, true)).toBe("safe");
    expect(classifyRisk(-10, 100, true)).toBe("ads-loss");
    expect(classifyRisk(50, 100, false)).toBe("impossible");
  });

  it("warns when ads lose money", () => {
    const costly = { ...costs0, cogsCents: 400 };
    const loss = quoteProfit({ ...usBase, itemPriceCents: 300, shippingChargedCents: 0, offsiteRate: 0.15 }, costly);
    const list = insights({
      currency: "USD",
      current: loss,
      ads15: loss,
      targetCents: 100,
      listCents: 300,
      organic: { possible: true, itemPriceCents: 400, merchCents: 0, profitCents: 0, offsiteCapped: false },
      ads: { possible: true, itemPriceCents: 900, merchCents: 0, profitCents: 0, offsiteCapped: false },
      safeCents: 900,
      salePercent: 0,
      freeShip: false,
      shipYouPayCents: 0,
      listingFeeCents: 20,
    });
    expect(loss.profitCents).toBeLessThan(0);
    expect(list.some((i) => /lose/i.test(i.text))).toBe(true);
  });

  it("parses the KeepFloor template", () => {
    const { rows, error } = parseCatalogCsv(catalogTemplate());
    expect(error).toBeUndefined();
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(rows[0].name).toBe("Linen tote");
  });

  it("parses an Etsy-style order items file", () => {
    const csv = [
      "Sale Date,Item Name,Quantity,Price,Shipping,SKU,Order ID",
      "1/15/26,Linen tote,1,32.00,5.50,TOTE,1001",
    ].join("\n");
    const parsed = parseAnyCsv(csv);
    expect(parsed.kind).toBe("etsy");
    expect(parsed.rows[0].name).toBe("Linen tote");
    expect(parsed.rows[0].price).toBe(32);
    expect(parsed.rows[0].sku).toBe("TOTE");
  });
});
