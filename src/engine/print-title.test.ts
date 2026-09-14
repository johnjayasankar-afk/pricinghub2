import { describe, expect, it } from "vitest";
import { catalogPrintTitle, listingPrintTitle, printRatesLine } from "./copy";

describe("loops 1.29 print titles", () => {
  const when = new Date("2026-09-04T12:00:00");

  it("names the listing, list, and ads-safe floor", () => {
    expect(listingPrintTitle("Tote", "$32.00", "$38.99", when)).toContain("Tote");
    expect(listingPrintTitle("Tote", "$32.00", "$38.99", when)).toContain("list $32.00");
    expect(listingPrintTitle("Tote", "$32.00", "$38.99", when)).toContain("ads-safe $38.99");
  });

  it("names the catalog pass that is on the paper", () => {
    const title = catalogPrintTitle({
      filter: "problems",
      query: "tote",
      sale: "20",
      count: 3,
      when,
    });
    expect(title).toContain("problems");
    expect(title).toContain("tote");
    expect(title).toContain("20% sale");
    expect(title).toContain("3 listings");
  });

  it("cites the rate date on the printed sheet", () => {
    expect(printRatesLine("4 September 2026")).toContain("4 September 2026");
    expect(printRatesLine("4 September 2026")).toContain("Not affiliated with Etsy");
  });
});
