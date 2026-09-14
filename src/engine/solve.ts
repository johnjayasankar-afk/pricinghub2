import { quoteProfit } from "./fees";
import { charmUp, listFromCharged, saleCharged } from "./money";
import type { Charm, CostInput, FloorResult, SaleInput } from "./types";

const MAX_ITEM_CENTS = 10_000_000;

export function solveChargedFloor(
  base: Omit<SaleInput, "itemPriceCents">,
  costs: CostInput,
  targetProfitCents: number,
): FloorResult {
  const probe = quoteProfit({ ...base, itemPriceCents: 1_000_00 }, costs);
  const feeShare = probe.merchandiseCents > 0 ? probe.totalFeesCents / probe.merchandiseCents : 0;
  if (feeShare >= 0.98 && targetProfitCents + Math.max(0, costs.cogsCents) > 0) {
    return {
      possible: false,
      itemPriceCents: 0,
      merchCents: 0,
      profitCents: probe.profitCents,
      offsiteCapped: probe.offsiteCapped,
      reason: "Fees consume nearly the entire sale. Lower optional rates or costs, or this listing cannot hit the target.",
    };
  }

  const atZero = quoteProfit({ ...base, itemPriceCents: 0 }, costs);
  if (atZero.profitCents >= targetProfitCents) {
    return {
      possible: true,
      itemPriceCents: 0,
      merchCents: atZero.merchandiseCents,
      profitCents: atZero.profitCents,
      offsiteCapped: atZero.offsiteCapped,
    };
  }

  let lo = 0;
  let hi = MAX_ITEM_CENTS;
  const top = quoteProfit({ ...base, itemPriceCents: hi }, costs);
  if (top.profitCents < targetProfitCents) {
    return {
      possible: false,
      itemPriceCents: hi,
      merchCents: top.merchandiseCents,
      profitCents: top.profitCents,
      offsiteCapped: top.offsiteCapped,
      reason: "Even a $100,000 item price misses the target after fees and costs.",
    };
  }

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const q = quoteProfit({ ...base, itemPriceCents: mid }, costs);
    if (q.profitCents >= targetProfitCents) hi = mid;
    else lo = mid + 1;
  }

  const found = quoteProfit({ ...base, itemPriceCents: lo }, costs);
  return {
    possible: true,
    itemPriceCents: lo,
    merchCents: found.merchandiseCents,
    profitCents: found.profitCents,
    offsiteCapped: found.offsiteCapped,
  };
}

/** Floor for the advertised list price, after a shop-sale percent. */
export function solveListFloor(
  base: Omit<SaleInput, "itemPriceCents">,
  costs: CostInput,
  targetProfitCents: number,
  salePercent: number,
  charm: Charm = "none",
): FloorResult {
  const charged = solveChargedFloor(base, costs, targetProfitCents);
  if (!charged.possible) return charged;
  let list = listFromCharged(charged.itemPriceCents, salePercent);
  while (list <= MAX_ITEM_CENTS) {
    const q = quoteProfit({ ...base, itemPriceCents: saleCharged(list, salePercent) }, costs);
    if (q.profitCents >= targetProfitCents) {
      const listed = charmUp(list, charm);
      const q2 = quoteProfit({ ...base, itemPriceCents: saleCharged(listed, salePercent) }, costs);
      return {
        possible: true,
        itemPriceCents: listed,
        exactCents: list,
        merchCents: q2.merchandiseCents,
        profitCents: q2.profitCents,
        offsiteCapped: q2.offsiteCapped,
      };
    }
    list += 1;
  }
  return { ...charged, possible: false, reason: charged.reason };
}

export const solveFloor = solveChargedFloor;

/** Highest shop-sale percent at this list that still hits the profit target. */
export function maxSalePercent(
  base: Omit<SaleInput, "itemPriceCents">,
  costs: CostInput,
  listCents: number,
  targetProfitCents: number,
): number | null {
  if (listCents <= 0) return null;
  const full = quoteProfit({ ...base, itemPriceCents: listCents }, costs);
  if (full.profitCents < targetProfitCents) return null;
  let lo = 0;
  let hi = 100;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi + 1) / 2);
    const q = quoteProfit({ ...base, itemPriceCents: saleCharged(listCents, mid) }, costs);
    if (q.profitCents >= targetProfitCents) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
