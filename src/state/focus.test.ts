import { describe, expect, it } from "vitest";
import { parseFocusFlag } from "./focus";

describe("loops 1.50 focus stays in this tab", () => {
  it("treats only the saved flag as on", () => {
    expect(parseFocusFlag("1")).toBe(true);
    expect(parseFocusFlag("0")).toBe(false);
    expect(parseFocusFlag(null)).toBe(false);
  });
});
