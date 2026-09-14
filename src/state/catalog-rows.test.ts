import { describe, expect, it } from "vitest";
import { parseStoredRows } from "./catalog-rows";

describe("loops 1.49 a cleared catalog stays empty", () => {
  it("keeps an empty array instead of restoring the sample shop", () => {
    expect(parseStoredRows([])).toEqual([]);
  });

  it("still seeds the sample when storage is not a list", () => {
    expect(parseStoredRows(null).length).toBe(4);
    expect(parseStoredRows({}).length).toBe(4);
  });
});
