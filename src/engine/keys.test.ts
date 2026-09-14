import { describe, expect, it } from "vitest";
import { catalogDeleteTarget, isCatalogDeleteKey, isCatalogPasteKey, KEY_HINTS, slashShowsForm } from "./keys";

describe("loops 1.37 slash shows the form", () => {
  it("reveals the form only when Focus is on", () => {
    expect(slashShowsForm(true)).toBe(true);
    expect(slashShowsForm(false)).toBe(false);
  });

  it("documents slash as show-the-form then price", () => {
    const row = KEY_HINTS.find((h) => h.keys === "/" && h.when === "Calculator");
    expect(row?.does.toLowerCase()).toContain("form");
  });
});

describe("loops 1.42 catalog keys stay on the live table", () => {
  it("treats Delete and Backspace as the Del button", () => {
    expect(isCatalogDeleteKey("Delete")).toBe(true);
    expect(isCatalogDeleteKey("Backspace")).toBe(true);
    expect(isCatalogDeleteKey("x")).toBe(false);
  });

  it("deletes a selection before the highlight", () => {
    expect(catalogDeleteTarget(3, true)).toBe("selected");
    expect(catalogDeleteTarget(0, true)).toBe("cursor");
    expect(catalogDeleteTarget(0, false)).toBe("none");
  });

  it("treats ⌘V as paste only with a modifier", () => {
    expect(isCatalogPasteKey({ key: "v", metaKey: true, ctrlKey: false })).toBe(true);
    expect(isCatalogPasteKey({ key: "v", metaKey: false, ctrlKey: true })).toBe(true);
    expect(isCatalogPasteKey({ key: "v", metaKey: false, ctrlKey: false })).toBe(false);
  });
});
