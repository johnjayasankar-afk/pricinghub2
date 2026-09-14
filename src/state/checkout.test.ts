import { describe, expect, it } from "vitest";
import { sandboxFlag } from "./checkout";

describe("loops 1.35 sandbox stays in the tab", () => {
  it("reads sandbox from the search or the hash", () => {
    expect(sandboxFlag("?sandbox=1", "#/help", false)).toBe(true);
    expect(sandboxFlag("", "#/pay?sandbox=1", false)).toBe(true);
    expect(sandboxFlag("", "#/help", false)).toBe(false);
  });

  it("keeps sandbox after the hash loses the flag", () => {
    expect(sandboxFlag("", "#/help", true)).toBe(true);
    expect(sandboxFlag("", "#/", false)).toBe(false);
  });
});
