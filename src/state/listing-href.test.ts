import { describe, expect, it } from "vitest";
import { defaultListing } from "../engine/worksheet";
import { listingHref, writeListingHash } from "./listing-href";
import { DEFAULT_SHOP } from "./shop";

describe("loops 1.17 / 1.22 listing hash", () => {
  it("opens the saved listing, not a bare hash", () => {
    expect(listingHref().startsWith("#/?")).toBe(true);
    expect(listingHref()).toContain("item=");
  });

  it("builds the href from the listing on the worksheet", () => {
    const href = listingHref(DEFAULT_SHOP, { ...defaultListing(), name: "Mug", item: "48" });
    expect(href.startsWith("#/?")).toBe(true);
    expect(href).toContain("item=48");
    expect(href).toContain("n=Mug");
  });

  it("returns that href when the address bar cannot be written", () => {
    const fields = { ...defaultListing(), name: "Mug", item: "48" };
    expect(writeListingHash(DEFAULT_SHOP, fields)).toBe(listingHref(DEFAULT_SHOP, fields));
  });
});
