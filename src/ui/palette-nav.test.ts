import { describe, expect, it } from "vitest";
import { firstEnabled, nextEnabled } from "./palette-nav";

describe("loops 1.15 palette nav", () => {
  const cmds = [{ disabled: true }, { disabled: false }, { disabled: true }, { disabled: false }];

  it("starts on the first live command", () => {
    expect(firstEnabled(cmds)).toBe(1);
    expect(firstEnabled([{ disabled: true }])).toBe(0);
  });

  it("skips disabled commands", () => {
    expect(nextEnabled(cmds, 1, 1)).toBe(3);
    expect(nextEnabled(cmds, 3, -1)).toBe(1);
    expect(nextEnabled(cmds, 3, 1)).toBe(3);
  });
});
