import { describe, expect, it } from "vitest";
import { catalogDropHint, catalogHash, catalogHref, catalogPassAfterRestore, importSheetOpen, isFileDrag, parseCatalogView, toggleCatalogFilter } from "./catalog-ui";

describe("loops 1.13 catalog hash", () => {
  it("omits default view from the hash", () => {
    expect(catalogHash({ filter: "all", sortBy: "risk", query: "", sale: "0" })).toBe("#/catalog");
    expect(catalogHash({ filter: "problems", sortBy: "gap", query: "tote", sale: "20" })).toBe(
      "#/catalog?f=problems&sort=gap&q=tote&sale=20",
    );
  });

  it("reads a shared catalog pass", () => {
    const view = parseCatalogView("f=sale&sort=lift&q=sticker&sale=10");
    expect(view.filter).toBe("sale");
    expect(view.sortBy).toBe("lift");
    expect(view.query).toBe("sticker");
    expect(view.sale).toBe("10");
    expect(parseCatalogView("f=nope").filter).toBeUndefined();
  });

  it("opens a bare catalog when nothing is saved", () => {
    expect(catalogHref()).toBe("#/catalog");
  });
});

describe("loops 1.40 import folds once listings exist", () => {
  it("stays open on an empty catalog and follows the seller after that", () => {
    expect(importSheetOpen(0, false)).toBe(true);
    expect(importSheetOpen(4, false)).toBe(false);
    expect(importSheetOpen(4, true)).toBe(true);
  });
});

describe("loops 1.53 restore shows the whole shop", () => {
  it("clears filter and search so restored rows are visible", () => {
    expect(catalogPassAfterRestore()).toEqual({ filter: "all", query: "" });
  });
});

describe("loops 1.51 summary chips toggle the pass", () => {
  it("clears the filter when you click the same chip again", () => {
    expect(toggleCatalogFilter("all", "problems")).toBe("problems");
    expect(toggleCatalogFilter("problems", "problems")).toBe("all");
    expect(toggleCatalogFilter("safe", "sale")).toBe("sale");
  });
});

describe("loops 1.43 drop still works when import is folded", () => {
  it("hints a page drop only after listings exist and the sheet is closed", () => {
    expect(catalogDropHint(0, false)).toBeNull();
    expect(catalogDropHint(4, true)).toBeNull();
    expect(catalogDropHint(4, false)).toBe("drop or paste a CSV anywhere");
  });

  it("ignores text drags", () => {
    expect(isFileDrag(["text/plain"])).toBe(false);
    expect(isFileDrag(["Files", "text/uri-list"])).toBe(true);
  });
});
