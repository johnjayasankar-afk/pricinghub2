import { describe, expect, it } from "vitest";
import { breaksOnSale, emptyRow, floorsToApply, priceCatalog, priceRow, saleBreakIndexes } from "./catalog";
import { buildApplyReceipt, receiptCsv, receiptText } from "./receipt";
import { DEFAULT_SHOP } from "../state/shop";

const tote = {
  ...emptyRow(),
  name: "Linen tote",
  sku: "TOTE",
  price: 45,
  cogs: 8.4,
  shippingYouPay: 3.2,
  packaging: 0.8,
  labor: 2,
  targetProfit: 12,
};

describe("upload 1.10", () => {
  it("builds an apply receipt from raised rows", () => {
    const shop = { ...DEFAULT_SHOP, charm: "none" as const };
    const priced = priceCatalog([{ ...tote, price: 12 }], shop, "0");
    const { raise, already, blank } = floorsToApply(priced);
    expect(raise.length).toBe(1);
    const receipt = buildApplyReceipt(raise, already.length, blank.length, "0", 1);
    expect(receipt.raise).toBe(1);
    expect(receipt.addedCents).toBe(raise[0]!.safeCents - 1200);
    expect(receipt.addedCents).toBeGreaterThan(0);
    const text = receiptText(receipt, "USD");
    expect(text).toContain("Linen tote");
    expect(text).toContain("[TOTE]");
    expect(text).toContain("→");
    expect(receiptCsv(receipt)).toContain("TOTE");
    expect(receiptCsv(receipt).split("\n")[0]).toBe("name,sku,from,to,added");
  });

  it("flags listings that are safe at full price and miss on sale", () => {
    const shop = { ...DEFAULT_SHOP, charm: "none" as const };
    const zero = priceRow(tote, shop, "0");
    const sale = priceRow(tote, shop, "30");
    expect(zero.risk).toBe("safe");
    expect(sale.risk).not.toBe("safe");
    expect(breaksOnSale(zero, sale)).toBe(true);
    expect(breaksOnSale(zero, zero)).toBe(false);
    expect(saleBreakIndexes([zero], [sale])).toEqual([0]);
  });
});
