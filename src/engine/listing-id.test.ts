import { describe, expect, it } from "vitest";
import { listingKey, sameListing } from "./listing-id";

describe("loops 1.24 listing identity", () => {
  it("treats 32 and 32.00 as the same list", () => {
    expect(sameListing({ name: "Tote", item: "32" }, { name: "Tote", item: "32.00" })).toBe(true);
    expect(listingKey("Tote", "32")).toBe(listingKey("Tote", 32));
    expect(sameListing({ name: "Tote", item: "32" }, { name: "Tote", item: "18" })).toBe(false);
    expect(sameListing({ name: "Tote", item: "32" }, { name: "Mug", item: "32" })).toBe(false);
  });
});
