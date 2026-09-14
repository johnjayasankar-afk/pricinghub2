import { describe, expect, it } from "vitest";
import { emptyRow, floorsToApply, priceCatalog } from "./catalog";
import { catalogBriefing, decisionLine } from "./copy";
import { catalogTemplate, parseAnyCsv } from "./csv";
import { clampMix, mixKeepCents } from "./mix";
import { qtyBreaks, toQtyCsv } from "./qty";
import { parseBackup } from "../state/backup";
import { DEFAULT_SHOP } from "../state/shop";
import { defaultListing, derive } from "./worksheet";

describe("confidence 1.5", () => {
  it("blends organic and ads keep at 50%", () => {
    expect(mixKeepCents(1000, 400, 50)).toBe(700);
    expect(clampMix("")).toBe(25);
    expect(clampMix(140)).toBe(100);
  });

  it("mix does not change the ads-safe floor", () => {
    const fields = defaultListing();
    const a = derive({ ...DEFAULT_SHOP, adsMix: "0", charm: "none" }, fields);
    const b = derive({ ...DEFAULT_SHOP, adsMix: "100", charm: "none" }, fields);
    expect(a.safeCents).toBe(b.safeCents);
    expect(a.mixKeepCents).toBeGreaterThan(b.mixKeepCents);
  });

  it("writes a decision line with expected keep", () => {
    const d = derive(DEFAULT_SHOP, defaultListing());
    const line = decisionLine(d);
    expect(line).toContain("expected keep");
    expect(line).toContain(`${d.mixPct}%`);
    expect(line).toContain("ads-safe");
  });

  it("skips blank-cost rows when applying floors", () => {
    const blank = emptyRow();
    blank.name = "Empty import";
    blank.price = 12;
    const priced = priceCatalog(
      [blank, { ...emptyRow(), name: "Tote", price: 32, cogs: 8.4, shippingYouPay: 3.2, packaging: 0.8, labor: 2, targetProfit: 12 }],
      { ...DEFAULT_SHOP, charm: "none" },
      "0",
    );
    const { ready, blank: skipped } = floorsToApply(priced);
    expect(skipped.length).toBeGreaterThanOrEqual(1);
    expect(ready.every((p) => !p.blankCosts)).toBe(true);
  });

  it("writes a quantity-price CSV and a catalog briefing", () => {
    const breaks = qtyBreaks({ ...DEFAULT_SHOP, charm: "none" }, defaultListing());
    const csv = toQtyCsv(breaks);
    expect(csv.startsWith("qty,ads_safe_list,keep_at_floor")).toBe(true);
    expect(csv).toContain("\n1,");
    const rows = parseAnyCsv(catalogTemplate()).rows;
    const priced = priceCatalog(rows, DEFAULT_SHOP, "0");
    const brief = catalogBriefing({
      currency: "USD",
      mixPct: 25,
      listings: priced.length,
      atRisk: priced.filter((p) => p.risk !== "safe").length,
      adsLoss: 0,
      liftCents: 100,
      mixKeepCents: 2000,
      stress: [{ pct: 0, atRisk: 1, safe: 3 }],
      rows: priced.map((p) => ({
        name: p.row.name,
        sku: p.row.sku,
        price: p.row.price,
        safe: 40,
        risk: p.risk,
        blank: p.blankCosts,
      })),
    });
    expect(brief).toContain("25%");
    expect(brief).toContain("sticker");
  });

  it("rejects a garbage backup and accepts a v1 file", () => {
    expect(parseBackup("nope").ok).toBe(false);
    const ok = parseBackup(
      JSON.stringify({
        v: 1,
        at: 1,
        shop: { ...DEFAULT_SHOP, adsMix: "40" },
        listing: defaultListing(),
        rows: [emptyRow()],
      }),
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.data.shop.adsMix).toBe("40");
  });

  it("fills missing catalog fields so a restore is a real shop", () => {
    const ok = parseBackup(
      JSON.stringify({
        v: 1,
        at: 1,
        shop: DEFAULT_SHOP,
        listing: defaultListing(),
        rows: [{ name: "Tote" }],
      }),
    );
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.data.rows).toHaveLength(1);
    expect(ok.data.rows[0]!.name).toBe("Tote");
    expect(ok.data.rows[0]!.quantity).toBe(1);
    expect(ok.data.rows[0]!.price).toBe(0);
  });

  it("keeps an empty catalog empty inside a backup", () => {
    const ok = parseBackup(
      JSON.stringify({
        v: 1,
        at: 1,
        shop: DEFAULT_SHOP,
        listing: defaultListing(),
        rows: [],
      }),
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.data.rows).toEqual([]);
  });
});
