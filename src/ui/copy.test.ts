import { describe, expect, it } from "vitest";
import { copyNote, copyText } from "./copy";

describe("loops 1.16 copy", () => {
  it("refuses an empty string", async () => {
    expect(await copyText("")).toBe(false);
  });

  it("says when a copy failed", () => {
    expect(copyNote(true, "Price copied.")).toBe("Price copied.");
    expect(copyNote(false, "Price copied.")).toBe("Could not copy. Check clipboard permission.");
  });
});
