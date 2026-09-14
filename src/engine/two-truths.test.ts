import { describe, expect, it } from "vitest";
import { cashAfterReserve, clampReserve } from "./cash";
import { compareCards, listingCard } from "./compare";
import { DEFAULT_SHOP } from "../state/shop";
import { defaultListing, derive } from "./worksheet";
import { applyUndoSnap, snapListing } from "./undo";

describe("two truths 1.8", () => {
  it("reserve lowers cash but not the ads-safe floor", () => {
    const off = derive({ ...DEFAULT_SHOP, reservePct: "", charm: "none" }, defaultListing());
    const on = derive({ ...DEFAULT_SHOP, reservePct: "25", charm: "none" }, defaultListing());
    expect(on.safeCents).toBe(off.safeCents);
    expect(on.reservePct).toBe(25);
    expect(on.cashCents).toBe(cashAfterReserve(on.quoted.profitCents, 25));
    expect(on.cashCents).toBeLessThan(on.quoted.profitCents);
    expect(clampReserve("")).toBe(0);
  });

  it("compares two listing cards", () => {
    const a = listingCard("Tote", derive(DEFAULT_SHOP, defaultListing()));
    const b = listingCard(
      "Cheap",
      derive(DEFAULT_SHOP, { ...defaultListing(), name: "Cheap", item: "12", target: "2" }),
    );
    const d = compareCards(a, b);
    expect(a.listCents).toBeGreaterThan(b.listCents);
    expect(typeof d.keepDelta).toBe("number");
  });

  it("redo is the inverse of undo on a snap", () => {
    const start = defaultListing();
    const mid = { ...start, item: "40", freeShip: true };
    const back = applyUndoSnap(mid, snapListing(start));
    const forth = applyUndoSnap(back, snapListing(mid));
    expect(back.item).toBe(start.item);
    expect(back.freeShip).toBe(false);
    expect(forth.item).toBe("40");
    expect(forth.freeShip).toBe(true);
  });
});
