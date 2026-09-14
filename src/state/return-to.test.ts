import { describe, expect, it } from "vitest";
import { lastSheet, returnKind, thanksOffersCalculator } from "./return-to";

describe("loops 1.36 back goes to the sheet you left", () => {
  it("returns to the catalog only when that sheet was last", () => {
    expect(returnKind("catalog")).toBe("catalog");
    expect(returnKind("home")).toBe("home");
    expect(returnKind(null)).toBe("home");
    expect(returnKind("nope")).toBe("home");
  });
});

describe("loops 1.40 thanks offers the calculator you left", () => {
  it("defaults to the calculator when this tab has no sheet yet", () => {
    expect(lastSheet()).toBe("home");
  });

  it("does not double the catalog button after unlock", () => {
    expect(thanksOffersCalculator("home")).toBe(true);
    expect(thanksOffersCalculator("catalog")).toBe(false);
  });
});
