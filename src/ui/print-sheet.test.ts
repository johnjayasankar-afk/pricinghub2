import { describe, expect, it } from "vitest";
import { PRINT_EVENT, printOnSheet, requestPrint } from "./print-sheet";

describe("loops 1.31 print after overlays", () => {
  it("names the print event and does not throw without a listener", () => {
    expect(PRINT_EVENT).toBe("keepfloor:print");
    requestPrint();
  });

  it("intercepts print only on the calculator and unlocked catalog", () => {
    expect(printOnSheet("home")).toBe(true);
    expect(printOnSheet("catalog", true)).toBe(true);
    expect(printOnSheet("catalog", false)).toBe(false);
    expect(printOnSheet("help")).toBe(false);
    expect(printOnSheet("pay")).toBe(false);
  });
});
