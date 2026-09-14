import { formatMoney } from "./money";
import { RATES_AS_OF } from "./policy";
import { catalogIsProblem } from "./risk";
import type { Risk } from "./types";
import type { Derived } from "./worksheet";

export function decisionLine(d: Derived): string {
  const c = d.currency;
  const safe = d.adsFloor.possible ? formatMoney(d.safeCents, c) : "n/a";
  const cash =
    d.reservePct > 0
      ? ` · cash ${formatMoney(d.mixCashCents, c)} after a ${d.reservePct}% reserve`
      : "";
  return `List ${formatMoney(d.listCents, c)} · expected keep ${formatMoney(d.mixKeepCents, c)} if ${d.mixPct}% of orders are attributed (target ${formatMoney(d.targetCents, c)}) · ads-safe ${safe}${cash}`;
}

export function briefing(d: Derived, name?: string): string {
  const c = d.currency;
  const title = name?.trim() ? name.trim() : "Listing";
  const lines = [
    `KeepFloor briefing — ${title}`,
    `Rates as of ${RATES_AS_OF}`,
    `List ${formatMoney(d.listCents, c)} → buyer item ${formatMoney(d.chargedCents, c)}`,
    `Keep on selected case: ${formatMoney(d.quoted.profitCents, c)} (target ${formatMoney(d.targetCents, c)})`,
    `Expected keep at ${d.mixPct}% attribution: ${formatMoney(d.mixKeepCents, c)}`,
    ...(d.reservePct > 0
      ? [`Cash after ${d.reservePct}% payment reserve: ${formatMoney(d.mixCashCents, c)} (not a fee; floors unchanged)`]
      : []),
    ...(d.freeOver?.on
      ? [
          `Free-over ${formatMoney(d.freeOver.thresholdCents, c)}: stay ${d.freeOver.stay.possible ? formatMoney(d.freeOver.stay.listCents, c) : "n/a"} (keep ${formatMoney(d.freeOver.stay.keepCents, c)}) vs cross ${d.freeOver.cross.possible ? formatMoney(d.freeOver.cross.listCents, c) : "n/a"} (keep ${formatMoney(d.freeOver.cross.keepCents, c)}) · pick ${d.freeOver.pick}`,
        ]
      : []),
    `Organic floor: ${d.organicFloor.possible ? formatMoney(d.organicFloor.itemPriceCents, c) : "n/a"}`,
    `Offsite Ads–safe floor: ${d.adsFloor.possible ? formatMoney(d.safeCents, c) : "n/a"}`,
    ...(d.charmTaxCents > 0
      ? [`Charm tax: ${formatMoney(d.charmTaxCents, c)} above exact ${formatMoney(d.exactSafeCents, c)} (not a fee)`]
      : []),
    `Survive-all floor: ${d.surviveAllPossible ? formatMoney(d.surviveAllCents, c) : "n/a"}`,
    `Fees: ${formatMoney(d.quoted.totalFeesCents, c)} on ${formatMoney(d.quoted.merchandiseCents, c)} merchandise`,
  ];
  if (d.volume.units > 0) {
    lines.push(
      `${d.volume.units} sales: keep ${formatMoney(d.volume.keepNowCents, c)} now, ${formatMoney(d.volume.keepMixCents, c)} at a ${d.mixPct}% mix, ${formatMoney(d.volume.keepSafeCents, c)} at the ads-safe list (${formatMoney(d.volume.liftCents, c)} lift)`,
    );
  }
  if (d.reconcile) {
    lines.push(`Statement fees vs worksheet: ${d.reconcile.status} (${formatMoney(d.reconcile.deltaCents, c)})`);
  }
  lines.push(...d.insightList.map((i) => `• ${i.text}`));
  lines.push("Not affiliated with Etsy. Your payment account is the record.");
  return lines.join("\n");
}

export function snapshotJson(name: string, d: Derived): string {
  return JSON.stringify(
    {
      name,
      asOf: RATES_AS_OF,
      list: d.listCents / 100,
      keep: d.quoted.profitCents / 100,
      fees: d.quoted.totalFeesCents / 100,
      organicFloor: d.organicFloor.possible ? d.organicFloor.itemPriceCents / 100 : null,
      adsSafeFloor: d.adsFloor.possible ? d.safeCents / 100 : null,
      exactSafeFloor: d.adsFloor.possible ? d.exactSafeCents / 100 : null,
      charmTax: d.charmTaxCents / 100,
      mixPct: d.mixPct,
      expectedKeep: d.mixKeepCents / 100,
      surviveAllFloor: d.surviveAllPossible ? d.surviveAllCents / 100 : null,
      currency: d.currency,
    },
    null,
    2,
  );
}

export function catalogBriefing(args: {
  currency: string;
  mixPct: number;
  listings: number;
  atRisk: number;
  adsLoss: number;
  liftCents: number;
  mixKeepCents: number;
  stress: { pct: number; atRisk: number; safe: number }[];
  rows: { name: string; sku: string; price: number; safe: number | null; risk: Risk; blank: boolean }[];
}): string {
  const c = args.currency;
  const lines = [
    `KeepFloor catalog — ${new Date().toLocaleDateString()}`,
    `Rates as of ${RATES_AS_OF}`,
    `${args.listings} listings · ${args.atRisk} miss ads-safe · ${args.adsLoss} lose money if ads hit`,
    `Expected keep per sale at a ${args.mixPct}% mix: ${formatMoney(args.mixKeepCents, c)}`,
    args.liftCents > 0
      ? `If problem rows move to ads-safe: ${formatMoney(args.liftCents, c)} extra keep per sale`
      : "No extra lift from moving to ads-safe.",
    "Sale stress (listings that miss ads-safe):",
    ...args.stress.map((s) => `  ${s.pct}% off → ${s.atRisk} miss, ${s.safe} safe`),
    "",
    "Rows to raise or review:",
  ];
  const problems = args.rows.filter((r) => catalogIsProblem(r.risk, r.blank));
  if (problems.length === 0) lines.push("  None. Catalog is ads-safe at this sale %.");
  for (const r of problems) {
    const sku = r.sku ? ` [${r.sku}]` : "";
    const safe = r.safe == null ? "n/a" : r.safe.toFixed(2);
    const blank = r.blank ? " · no costs yet" : "";
    lines.push(`  ${r.name}${sku}  ${r.price.toFixed(2)} → ${safe}  ${r.risk}${blank}`);
  }
  lines.push("Not affiliated with Etsy. Your payment account is the record.");
  return lines.join("\n");
}

export function listingPrintTitle(name: string, list: string, safe: string, when = new Date()): string {
  const title = name.trim() || "Listing";
  return `${title} · list ${list} · ads-safe ${safe} · ${when.toLocaleDateString()}`;
}

export function printRatesLine(asOf: string): string {
  return `Rates as of ${asOf} · Independent worksheet. Not affiliated with Etsy, Inc.`;
}

export function catalogPrintTitle(opts: {
  filter: string;
  query: string;
  sale: string;
  count: number;
  when?: Date;
}): string {
  const bits = ["KeepFloor catalog", (opts.when ?? new Date()).toLocaleDateString()];
  if (opts.filter !== "all") bits.push(opts.filter);
  const q = opts.query.trim();
  if (q) bits.push(q);
  if ((Number(opts.sale) || 0) > 0) bits.push(`${opts.sale}% sale`);
  bits.push(`${opts.count} listing${opts.count === 1 ? "" : "s"}`);
  return bits.join(" · ");
}
