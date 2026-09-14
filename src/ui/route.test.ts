import { describe, expect, it } from "vitest";
import { isHomeHash, pathFromHash, routeFromPath, skipLabel, titles } from "./route";

describe("finish 1.11 routes", () => {
  it("treats listing query hashes as home", () => {
    expect(pathFromHash("#/?item=32")).toBe("");
    expect(routeFromPath("")).toBe("home");
    expect(routeFromPath("catalog")).toBe("catalog");
    expect(isHomeHash("#/?item=32")).toBe(true);
    expect(isHomeHash("#/")).toBe(true);
    expect(isHomeHash("#/help")).toBe(false);
    expect(isHomeHash("#/catalog?f=problems")).toBe(false);
  });

  it("does not silently open the calculator on a mistyped hash", () => {
    expect(routeFromPath("nope")).toBe("notfound");
    expect(routeFromPath("not-found")).toBe("notfound");
    expect(titles("notfound")).toContain("not found");
    expect(skipLabel("catalog")).toBe("Skip to catalog");
    expect(skipLabel("help")).toBe("Skip to content");
  });
});
