import { describe, expect, it } from "vitest";
import { replaceNeedsConfirm, sampleAskDanger, sampleNeedsConfirm } from "./sample-ask";

describe("loops 1.38 restore sample asks first", () => {
  it("skips the ask on an empty catalog", () => {
    expect(sampleNeedsConfirm(0)).toBe(false);
    expect(sampleNeedsConfirm(1)).toBe(true);
  });

  it("treats replace as the dangerous import mode", () => {
    expect(sampleAskDanger("replace")).toBe(true);
    expect(sampleAskDanger("append")).toBe(false);
    expect(sampleAskDanger("merge")).toBe(false);
  });
});

describe("loops 1.39 replace asks for any ingest", () => {
  it("asks only when replace would wipe listings", () => {
    expect(replaceNeedsConfirm(3, "replace")).toBe(true);
    expect(replaceNeedsConfirm(0, "replace")).toBe(false);
    expect(replaceNeedsConfirm(3, "append")).toBe(false);
    expect(replaceNeedsConfirm(3, "merge")).toBe(false);
  });
});
