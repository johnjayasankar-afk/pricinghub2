import { charmUp, saleCharged } from "./money";
import { quoteProfit } from "./fees";
import type { Charm, CostInput, SaleInput } from "./types";

export type LadderRung = {
  listCents: number;
  keepCents: number;
  mark: "floor" | "now" | "above";
};

/** Charm prices around the ads-safe floor. Never undershoots the floor. */
export function ladderLists(safeCents: number, listCents: number, charm: Charm): number[] {
  const mode = charm === "none" ? "99" : charm;
  const floor = Math.max(0, safeCents);
  const out = new Set<number>();
  if (floor > 0) out.add(charmUp(floor, charm));
  if (listCents > 0) out.add(listCents);
  let p = floor > 0 ? floor : Math.max(0, listCents);
  for (let i = 0; i < 6; i++) {
    p = charmUp(p + 1, mode);
    if (p > 0) out.add(p);
  }
  return [...out].sort((a, b) => a - b).slice(0, 8);
}

export function buildLadder(
  sale: SaleInput,
  costs: CostInput,
  safeCents: number,
  listCents: number,
  charm: Charm,
  salePercent: number,
): LadderRung[] {
  return ladderLists(safeCents, listCents, charm).map((list) => {
    const keep = quoteProfit({ ...sale, itemPriceCents: saleCharged(list, salePercent) }, costs);
    return {
      listCents: list,
      keepCents: keep.profitCents,
      mark: list === listCents ? "now" : list === safeCents ? "floor" : "above",
    };
  });
}
