import { describe, expect, it } from "vitest";
import { applyFlashDetail } from "./flash";

describe("loops 1.18 flash", () => {
  it("shows a message, dismisses on empty, ignores junk", () => {
    expect(applyFlashDetail("Price copied.")).toEqual({ show: "Price copied." });
    expect(applyFlashDetail("")).toBe("dismiss");
    expect(applyFlashDetail(null)).toBe("ignore");
  });
});
