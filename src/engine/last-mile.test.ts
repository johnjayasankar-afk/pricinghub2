import { describe, expect, it } from "vitest";
import { listingFeeDragCents, parseReplay } from "./replay";
import { applyUndoSnap, snapListing } from "./undo";
import { defaultListing, derive } from "./worksheet";
import { DEFAULT_SHOP } from "../state/shop";

describe("last mile 1.7", () => {
  it("undo restores free shipping after a crossing-style snap", () => {
    const before = { ...defaultListing(), item: "32.00", freeShip: false, shipCharge: "5.50" };
    const snap = snapListing(before);
    const after = { ...before, item: "38.99", freeShip: true };
    const undone = applyUndoSnap(after, snap);
    expect(undone.item).toBe("32.00");
    expect(undone.freeShip).toBe(false);
    expect(undone.shipCharge).toBe("5.50");
  });

  it("parses a pasted sale block", () => {
    const r = parseReplay("item 32.00\nship 5.50\ntax 2.40\nfees 5.68\nads 15");
    expect(r.error).toBeUndefined();
    expect(r.fields.item).toBe("32.00");
    expect(r.fields.shipCharge).toBe("5.50");
    expect(r.fields.tax).toBe("2.40");
    expect(r.fields.statementFees).toBe("5.68");
    expect(r.offsite).toBe("15");
  });

  it("treats ship 0 as free shipping and a lone number as the list", () => {
    const r = parseReplay("41.99\nship 0\nads organic");
    expect(r.fields.item).toBe("41.99");
    expect(r.fields.freeShip).toBe(true);
    expect(r.offsite).toBe("off");
  });

  it("counts monthly listing-fee drag", () => {
    expect(listingFeeDragCents(0.2, 40)).toBe(200);
    expect(listingFeeDragCents(0.2, 0)).toBe(0);
    const d = derive({ ...DEFAULT_SHOP, activeListings: "40", listingFee: "0.20" }, defaultListing());
    expect(d.volume.listingDragCents).toBe(200);
  });
});
