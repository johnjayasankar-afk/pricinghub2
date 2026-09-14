import { describe, expect, it } from "vitest";
import { catalogCmdHint, catalogLive, sheetCmdHint } from "./cmd-scope";

describe("loops 1.34 catalog commands need the unlocked sheet", () => {
  it("treats the locked catalog as not live", () => {
    expect(catalogLive(true, false)).toBe(false);
    expect(catalogLive(true, true)).toBe(true);
    expect(catalogLive(false, true)).toBe(false);
  });

  it("hints unlock on the locked catalog page", () => {
    expect(catalogCmdHint(true, false)).toBe("Unlock catalog");
    expect(catalogCmdHint(true, true)).toBeUndefined();
    expect(catalogCmdHint(true, true, "a")).toBe("a");
    expect(catalogCmdHint(false, false)).toBe("Catalog");
  });

  it("keeps undo and print on the calculator", () => {
    expect(sheetCmdHint(true, false, false, "⌘/Ctrl+Z")).toBe("⌘/Ctrl+Z");
    expect(sheetCmdHint(false, true, false)).toBe("Unlock catalog");
    expect(sheetCmdHint(false, false, false)).toBe("Calculator or catalog");
  });
});
