import { describe, expect, it } from "vitest";
import { defaultListing } from "../engine/worksheet";
import { coalesceRecents, parkIfDifferent, recentId } from "./recents";
import { DEFAULT_SHOP } from "./shop";

describe("loops 1.23 park before a jump", () => {
  it("parks when the next listing is a different one", () => {
    const current = { ...defaultListing(), name: "Tote", item: "32" };
    const next = { ...defaultListing(), name: "Mug", item: "18" };
    const result = parkIfDifferent(DEFAULT_SHOP, current, next);
    expect(result.parked).toBe(true);
    expect(result.recents.some((r) => r.id === recentId(current))).toBe(true);
  });

  it("does not rewrite Recents when the row is the listing already on the worksheet", () => {
    const current = { ...defaultListing(), name: "Tote", item: "32" };
    expect(parkIfDifferent(DEFAULT_SHOP, current, current).parked).toBe(false);
    expect(parkIfDifferent(DEFAULT_SHOP, current, { ...current, item: "32.00" }).parked).toBe(false);
  });

  it("merges 32 and 32.00 recents and keeps the pin", () => {
    const merged = coalesceRecents([
      { id: "tote|32", name: "Tote", item: "32", savedAt: 1, query: "old" },
      { id: "tote|32.00", name: "Tote", item: "32.00", savedAt: 2, query: "new", pinned: true },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.id).toBe(recentId({ name: "Tote", item: "32" }));
    expect(merged[0]!.pinned).toBe(true);
    expect(merged[0]!.query).toBe("new");
  });
});
