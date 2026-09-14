import { describe, expect, it } from "vitest";
import { listingFromPreset, PRESETS, presetIsCurrent } from "./presets";

describe("loops 1.21 samples", () => {
  it("knows when the worksheet is already that sample", () => {
    const tote = PRESETS[0]!;
    expect(presetIsCurrent(tote, { name: tote.label, item: tote.item })).toBe(true);
    expect(presetIsCurrent(tote, { name: tote.label, item: Number(tote.item).toFixed(2) })).toBe(true);
    expect(presetIsCurrent(tote, { name: tote.label, item: "99" })).toBe(false);
    expect(presetIsCurrent(tote, { name: "Linen tote", item: tote.item })).toBe(false);
    const dirty = listingFromPreset(tote);
    expect(dirty.notes).toBe("");
    expect(dirty.sku).toBe("");
    expect(dirty.extraOn).toBe(false);
    expect(dirty.name).toBe(tote.label);
  });
});
