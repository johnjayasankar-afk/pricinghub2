import { charmUp, dollarsToCents, parseMoney, saleCharged } from "./money";
import { quoteProfit } from "./fees";
import type { Charm, CostInput, FloorResult, SaleInput } from "./types";

export type ThresholdPath = {
  id: "stay" | "cross";
  listCents: number;
  keepCents: number;
  possible: boolean;
  freeShip: boolean;
};

export type ThresholdCompare = {
  on: boolean;
  thresholdCents: number;
  stay: ThresholdPath;
  cross: ThresholdPath;
  pick: "stay" | "cross" | "none";
};

export function parseThreshold(raw: string): number | null {
  const n = parseMoney(raw);
  if (n <= 0) return null;
  return dollarsToCents(n);
}

export function compareFreeOver(args: {
  charm: Charm;
  salePercent: number;
  thresholdCents: number;
  stayListCents: number;
  stayPossible: boolean;
  stayKeepCents: number;
  stayFreeShip: boolean;
  freeAdsFloor: FloorResult;
  sale: SaleInput;
  costs: CostInput;
}): ThresholdCompare {
  const minCross = charmUp(args.thresholdCents, args.charm);
  const crossPossible = args.freeAdsFloor.possible;
  const crossList = crossPossible ? Math.max(args.freeAdsFloor.itemPriceCents, minCross) : 0;
  const crossKeep = crossPossible
    ? quoteProfit(
        {
          ...args.sale,
          shippingChargedCents: 0,
          itemPriceCents: saleCharged(crossList, args.salePercent),
          offsiteRate: 0.15,
        },
        args.costs,
      ).profitCents
    : 0;

  const stay: ThresholdPath = {
    id: "stay",
    listCents: args.stayListCents,
    keepCents: args.stayKeepCents,
    possible: args.stayPossible,
    freeShip: args.stayFreeShip,
  };
  const cross: ThresholdPath = {
    id: "cross",
    listCents: crossList,
    keepCents: crossKeep,
    possible: crossPossible,
    freeShip: true,
  };

  let pick: ThresholdCompare["pick"] = "none";
  if (stay.possible && cross.possible) pick = cross.keepCents > stay.keepCents ? "cross" : "stay";
  else if (cross.possible) pick = "cross";
  else if (stay.possible) pick = "stay";

  return {
    on: true,
    thresholdCents: args.thresholdCents,
    stay,
    cross,
    pick,
  };
}
