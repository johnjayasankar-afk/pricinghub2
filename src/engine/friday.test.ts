import { describe, expect, it } from "vitest";
import { applyFloorsNote, emptyRow, exportNeedRows, floorsToApply, priceCatalog, rowsAt, selectProblemNote } from "./catalog";
import { compareText, listingCard } from "./compare";
import { KEY_HINTS } from "./keys";
import { charmTaxCents } from "./money";
import { DEFAULT_SHOP } from "../state/shop";
import { lastUnpinned, recentId, sortRecents, trimRecents, type Recent } from "../state/recents";
import { defaultListing, derive } from "./worksheet";

function recent(partial: Partial<Recent> & Pick<Recent, "id">): Recent {
  return {
    name: partial.name ?? partial.id,
    item: partial.item ?? "1",
    savedAt: partial.savedAt ?? 1,
    query: partial.query ?? "",
    pinned: partial.pinned,
    id: partial.id,
  };
}

describe("friday 1.9", () => {
  it("charm tax is the leftover above the exact ads-safe floor", () => {
    expect(charmTaxCents(3147, "99")).toBe(52);
    expect(charmTaxCents(3199, "99")).toBe(0);
    expect(charmTaxCents(3200, "none")).toBe(0);
    const none = derive({ ...DEFAULT_SHOP, charm: "none" }, defaultListing());
    const charm = derive({ ...DEFAULT_SHOP, charm: "99" }, defaultListing());
    expect(none.charmTaxCents).toBe(0);
    expect(none.exactSafeCents).toBe(none.safeCents);
    expect(charm.safeCents).toBeGreaterThanOrEqual(none.safeCents);
    expect(charm.charmTaxCents).toBe(charm.safeCents - charm.exactSafeCents);
    expect(charm.charmTaxCents).toBe(charmTaxCents(charm.exactSafeCents, "99"));
    expect(charm.safeCents).toBeGreaterThanOrEqual(charm.exactSafeCents);
  });

  it("skips catalog rows already at the ads-safe list", () => {
    const shop = { ...DEFAULT_SHOP, charm: "none" as const };
    const pricedLow = priceCatalog(
      [
        {
          ...emptyRow(),
          name: "Tote",
          price: 12,
          cogs: 8.4,
          shippingYouPay: 3.2,
          packaging: 0.8,
          labor: 2,
          targetProfit: 12,
        },
      ],
      shop,
      "0",
    );
    const { raise, already } = floorsToApply(pricedLow);
    expect(raise.length).toBe(1);
    expect(already.length).toBe(0);

    const safePrice = pricedLow[0]!.safeCents / 100;
    const pricedSafe = priceCatalog(
      [
        {
          ...emptyRow(),
          name: "Tote",
          price: safePrice,
          cogs: 8.4,
          shippingYouPay: 3.2,
          packaging: 0.8,
          labor: 2,
          targetProfit: 12,
        },
      ],
      shop,
      "0",
    );
    const split = floorsToApply(pricedSafe);
    expect(split.raise.length).toBe(0);
    expect(split.already.length).toBe(1);
    expect(applyFloorsNote(0, 3, 2)).toContain("already at ads-safe");
    expect(applyFloorsNote(4, 1, 2)).toContain("already there");
    expect(applyFloorsNote(1, 0, 0)).toBe("1 list set to ads-safe.");
  });

  it("copies a versus table and slices selected rows", () => {
    const a = listingCard("Tote", derive(DEFAULT_SHOP, defaultListing()));
    const b = listingCard("Cheap", derive(DEFAULT_SHOP, { ...defaultListing(), name: "Cheap", item: "12", target: "2" }));
    const text = compareText(a, b, "USD");
    expect(text).toContain("Tote vs Cheap");
    expect(text).toContain("Ads-safe");
    expect(text).toContain("Expected keep");
    expect(rowsAt(["a", "b", "c"], [0, 2])).toEqual(["a", "c"]);
  });

  it("keeps pinned recents when trimming", () => {
    const many = Array.from({ length: 14 }, (_, i) =>
      recent({ id: `n${i}`, savedAt: i, pinned: i === 1 || i === 3 }),
    );
    const trimmed = trimRecents(many, 12);
    expect(trimmed.some((r) => r.id === "n1" && r.pinned)).toBe(true);
    expect(trimmed.some((r) => r.id === "n3" && r.pinned)).toBe(true);
    expect(trimmed[0]!.pinned).toBe(true);
    expect(trimmed.length).toBe(12);
    const onlyPins = trimRecents(
      Array.from({ length: 5 }, (_, i) => recent({ id: `p${i}`, pinned: true, savedAt: i })),
      3,
    );
    expect(onlyPins).toHaveLength(3);
    expect(onlyPins.every((r) => r.pinned)).toBe(true);
    expect(lastUnpinned(sortRecents(many))?.pinned).toBeFalsy();
  });

  it("lists the friday keys", () => {
    const blob = KEY_HINTS.map((h) => `${h.keys} ${h.does}`).join(" ");
    expect(blob).toContain("?");
    expect(blob).toContain("Select visible");
    expect(blob).toContain("Invert");
  });

  it("keys a recent by name and list", () => {
    expect(recentId({ name: "Linen tote", item: "32" })).toBe("linen tote|3200");
    expect(recentId({ name: "Linen tote", item: "32.00" })).toBe("linen tote|3200");
    expect(recentId({ name: "  ", item: "12" })).toBe("untitled 12|1200");
  });
});

describe("loops 1.45 shop manager files tell the truth", () => {
  it("blocks export when the catalog is empty", () => {
    expect(exportNeedRows(0)).toBe("Add listings first.");
    expect(exportNeedRows(3)).toBeNull();
  });

  it("says when every listing is already ads-safe", () => {
    expect(selectProblemNote(0)).toBe("No problem listings.");
    expect(selectProblemNote(1)).toBe("Selected 1 problem listing.");
    expect(selectProblemNote(4)).toBe("Selected 4 problem listings.");
  });
});
