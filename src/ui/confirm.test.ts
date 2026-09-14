import { describe, expect, it } from "vitest";
import { askButtons } from "./Confirm";

describe("inch 1.12 confirms", () => {
  it("uses Continue / Cancel unless the ask is a notice", () => {
    expect(askButtons({ title: "Apply?", body: "12 lists" })).toEqual({
      yes: "Continue",
      no: "Cancel",
    });
    expect(askButtons({ title: "Broken file", body: "No v1", notice: true })).toEqual({
      yes: "OK",
      no: null,
    });
    expect(askButtons({ title: "Reset?", body: "Tote", confirmLabel: "Reset", danger: true }).yes).toBe("Reset");
  });
});
