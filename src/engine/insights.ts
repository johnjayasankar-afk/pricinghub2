import { formatMoney } from "./money";
import type { ThresholdCompare } from "./threshold";
import type { FloorResult, Insight, ProfitResult } from "./types";

export function insights(args: {
  currency: string;
  current: ProfitResult;
  ads15: ProfitResult;
  targetCents: number;
  listCents: number;
  organic: FloorResult;
  ads: FloorResult;
  safeCents: number;
  salePercent: number;
  freeShip: boolean;
  shipYouPayCents: number;
  listingFeeCents: number;
  freeAds?: FloorResult;
  surviveAllCents?: number;
  adsPolicy?: { over: boolean; text: string } | null;
  volumeLift?: number;
  volumeUnits?: number;
  salesVatRemitCents?: number;
  salesVatRate?: number;
  mixPct?: number;
  mixKeepCents?: number;
  organicKeepCents?: number;
  freeOver?: ThresholdCompare | null;
  reservePct?: number;
  mixCashCents?: number;
  charmTaxCents?: number;
  exactSafeCents?: number;
}): Insight[] {
  const out: Insight[] = [];
  const { currency } = args;

  if (!args.ads.possible) {
    out.push({
      tone: "warn",
      text: args.ads.reason ?? "No Offsite Ads–safe list price exists with these costs and rates.",
    });
  } else if (args.ads15.profitCents < 0) {
    out.push({
      tone: "warn",
      text: `A 15% Offsite Ad on this order loses ${formatMoney(args.ads15.profitCents, currency)}. List at ${formatMoney(args.safeCents, currency)} to keep your target if the sale is attributed.`,
    });
  } else if (args.current.profitCents < args.targetCents) {
    out.push({
      tone: "warn",
      text: `This price keeps ${formatMoney(args.current.profitCents, currency)}, which is below your ${formatMoney(args.targetCents, currency)} target.`,
    });
  } else {
    out.push({
      tone: "ok",
      text: `At ${formatMoney(args.listCents, currency)} you keep ${formatMoney(args.current.profitCents, currency)} on the selected ads case.`,
    });
  }

  if (args.charmTaxCents && args.charmTaxCents > 0 && args.exactSafeCents != null) {
    out.push({
      tone: "info",
      text: `Charm rounding adds ${formatMoney(args.charmTaxCents, currency)} above the exact ads-safe floor of ${formatMoney(args.exactSafeCents, currency)}. That leftover is not an Etsy fee.`,
    });
  }

  if (args.organic.possible && args.ads.possible && args.safeCents > args.organic.itemPriceCents) {
    const gap = args.safeCents - args.organic.itemPriceCents;
    out.push({
      tone: "info",
      text: `The Offsite Ads–safe floor is ${formatMoney(gap, currency)} above the organic floor. Price the higher number if you cannot opt out of Offsite Ads.`,
    });
  }

  if (args.ads15.offsiteCapped) {
    out.push({
      tone: "info",
      text: "Offsite Ads hit the cap on this order. Raising the price further does not increase the ads take.",
    });
  }

  if (args.current.merchandiseCents > 0) {
    const share = args.current.totalFeesCents / args.current.merchandiseCents;
    if (share >= 0.22) {
      out.push({
        tone: "warn",
        text: `Etsy-side fees are ${(share * 100).toFixed(0)}% of merchandise. Low list prices and free shipping make the percentage stack worse.`,
      });
    }
  }

  if (args.listingFeeCents > 0 && args.current.merchandiseCents > 0 && args.listingFeeCents / args.current.merchandiseCents >= 0.04) {
    out.push({
      tone: "info",
      text: `The listing fee is a large share of this sale. Split it across expected units, or ignore it if it is already spent.`,
    });
  }

  if (args.freeShip && args.shipYouPayCents > 0) {
    out.push({
      tone: "info",
      text: `Free shipping still costs you ${formatMoney(args.shipYouPayCents, currency)} in postage, and Etsy does not take 6.5% of a shipping charge you never collected.`,
    });
  }

  if (args.freeAds?.possible && args.freeAds.itemPriceCents > args.safeCents) {
    out.push({
      tone: "info",
      text: `If you also offer free shipping on an attributed order, the list floor rises to ${formatMoney(args.freeAds.itemPriceCents, currency)}.`,
    });
  }

  if (args.adsPolicy) {
    out.push({ tone: args.adsPolicy.over ? "warn" : "info", text: args.adsPolicy.text });
  }

  if (args.surviveAllCents && args.surviveAllCents > args.safeCents) {
    out.push({
      tone: "info",
      text: `The survive-all floor is ${formatMoney(args.surviveAllCents, currency)} — high enough for free shipping and a 15% ad on the same order.`,
    });
  }

  if (args.salesVatRemitCents && args.salesVatRemitCents > 0 && args.salesVatRate) {
    out.push({
      tone: "info",
      text: `This list includes ${(args.salesVatRate * 100).toFixed(0)}% VAT. You remit ${formatMoney(args.salesVatRemitCents, currency)} and Etsy still fees the gross. Not tax advice.`,
    });
  }

  if (args.volumeUnits && args.volumeUnits > 0 && args.volumeLift && args.volumeLift > 0) {
    out.push({
      tone: "info",
      text: `At ${args.volumeUnits} sales, moving to the ads-safe list keeps ${formatMoney(args.volumeLift, currency)} more this month.`,
    });
  }

  if (
    args.mixPct != null &&
    args.mixPct > 0 &&
    args.mixPct < 100 &&
    args.mixKeepCents != null &&
    args.organicKeepCents != null
  ) {
    out.push({
      tone: "info",
      text: `If ${args.mixPct}% of orders are attributed, expected keep is ${formatMoney(args.mixKeepCents, currency)} (organic ${formatMoney(args.organicKeepCents, currency)}, ads ${formatMoney(args.ads15.profitCents, currency)}). The ads-safe floor still assumes a fully attributed order.`,
    });
  }

  if (args.reservePct && args.reservePct > 0 && args.mixCashCents != null) {
    out.push({
      tone: "info",
      text: `A ${args.reservePct}% payment reserve would hold back cash — expected cash this payout is ${formatMoney(args.mixCashCents, currency)}. That is not an Etsy fee and does not change the ads-safe floor.`,
    });
  }

  if (args.freeOver?.on) {
    const t = args.freeOver;
    const line = formatMoney(t.thresholdCents, currency);
    if (t.pick === "cross" && t.cross.possible) {
      out.push({
        tone: "info",
        text: `Free shipping over ${line} is the better ads-safe path at ${formatMoney(t.cross.listCents, currency)} (keep ${formatMoney(t.cross.keepCents, currency)} if ads hit). Stay with charged shipping keeps ${formatMoney(t.stay.keepCents, currency)} at ${formatMoney(t.stay.listCents, currency)}.`,
      });
    } else if (t.stay.possible && t.stay.listCents < t.thresholdCents) {
      out.push({
        tone: "info",
        text: `You keep more under ${line} with charged shipping (${formatMoney(t.stay.keepCents, currency)} at ${formatMoney(t.stay.listCents, currency)}). Joining free-over-${line} needs ${t.cross.possible ? formatMoney(t.cross.listCents, currency) : "n/a"} and keeps ${t.cross.possible ? formatMoney(t.cross.keepCents, currency) : "n/a"} if ads hit.`,
      });
    }
  }

  if (args.salePercent > 0) {
    out.push({
      tone: "info",
      text: `Floors are list prices. A ${args.salePercent}% sale means the buyer pays less and every percentage fee is computed on that lower amount.`,
    });
  }

  if (
    args.listCents > 0 &&
    args.listCents <= 500 &&
    args.current.costCents <= 150 &&
    args.ads15.profitCents < args.targetCents
  ) {
    out.push({
      tone: "warn",
      text: "Sub-$5 digital or sticker listings rarely survive Offsite Ads after the flat processing fee. Raise the list or keep the item opted out if you still can.",
    });
  }

  return out.slice(0, 8);
}
