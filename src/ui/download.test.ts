import { describe, expect, it } from "vitest";
import { fileStem } from "./download";

describe("loops 1.19 download", () => {
  it("makes a safe file stem", () => {
    expect(fileStem("Linen tote")).toBe("Linen-tote");
    expect(fileStem("")).toBe("keepfloor");
    expect(fileStem("***")).toBe("keepfloor");
  });
});
