import { sameListing } from "./listing-id";
import { insights } from "./insights";
import { clampMix, mixKeepCents } from "./mix";
import { allocateListingFee, dollarsToCents, marginPct, parseMoney, saleCharged } from "./money";
import { buildLadder, type LadderRung } from "./ladder";
import { adsRule, reconcileFees, reconcileLines, unitsForGoal, type AdsRule, type LineMatch, type Reconcile } from "./policy";
import { FX_RATE, OFFSITE_CAP_USD, TRANSACTION_RATE, profileById } from "./profiles";
import { quoteProfit } from "./fees";
import { runScenarios, sensitivity, type Scenario } from "./scenarios";
import { maxSalePercent, solveListFloor } from "./solve";
import { cashAfterReserve, clampReserve } from "./cash";
import { listingFeeDragCents } from "./replay";
import { compareFreeOver, parseThreshold, type ThresholdCompare } from "./threshold";
import type { Charm, CostInput, FloorResult, Insight, ListingFeeMode, ProfitResult, SaleInput } from "./types";
import type { ShopPrefs } from "../state/shop";

export type ListingFields = {
  name: string;
  item: string;
  qty: string;
  perso: string;
  salePercent: string;
  coupon: string;
  shipCharge: string;
  freeShip: boolean;
  gift: string;
  tax: string;
  cogs: string;
  shipPay: string;
  pack: string;
  labor: string;
  target: string;
  extraOn: boolean;
  extraPrice: string;
  extraQty: string;
  extraCogs: string;
  deposit: string;
  procRate: string;
  procFixed: string;
  reg: string;
  vat: string;
  txn: string;
  unitsMonth: string;
  monthlyGoal: string;
  proposed: string;
  statementFees: string;
  sku: string;
  notes: string;
  salesVat: string;
  stmtListing: string;
  stmtTxn: string;
  stmtProc: string;
  stmtOffsite: string;
  hours: string;
};

export type Derived = {
  currency: string;
  chargedCents: number;
  listCents: number;
  sale: SaleInput;
  costs: CostInput;
  quoted: ProfitResult;
  ads15: ProfitResult;
  organicFloor: FloorResult;
  adsFloor: FloorResult;
  freeAdsFloor: FloorResult;
  breakEvenCents: number | null;
  safeCents: number;
  surviveAllCents: number;
  surviveAllPossible: boolean;
  maxSalePct: number | null;
  margin: number | null;
  atSafe: ProfitResult;
  atProposed: ProfitResult | null;
  proposedCents: number | null;
  volume: {
    units: number;
    keepNowCents: number;
    keepSafeCents: number;
    liftCents: number;
    unitsForGoal: number | null;
    unitsForGoalSafe: number | null;
    keepMixCents: number;
    listingDragCents: number;
  };
  organicNow: ProfitResult;
  mixPct: number;
  mixKeepCents: number;
  reservePct: number;
  cashCents: number;
  mixCashCents: number;
  exactSafeCents: number;
  charmTaxCents: number;
  freeOver: ThresholdCompare | null;
  adsPolicy: AdsRule | null;
  reconcile: Reconcile | null;
  lineMatch: LineMatch[];
  ladder: LadderRung[];
  scenarios: Scenario[];
  insightList: Insight[];
  sensitivity: ReturnType<typeof sensitivity>;
  targetCents: number;
};

export function laborEach(shop: ShopPrefs, fields: ListingFields): number {
  const hours = Number(fields.hours) || 0;
  const hourly = parseMoney(shop.hourly);
  if (hours > 0 && hourly > 0) return hours * hourly;
  return parseMoney(fields.labor);
}

export function ratesFromShop(
  shop: ShopPrefs,
  fields: Pick<ListingFields, "procRate" | "procFixed" | "reg" | "vat" | "txn">,
) {
  const profile = profileById(shop.profileId);
  const intl = shop.intlBuyer && profile.processingRateIntl != null;
  return {
    profile,
    processingRate: fields.procRate ? Number(fields.procRate) / 100 : intl ? profile.processingRateIntl! : profile.processingRate,
    processingFixed: fields.procFixed ? parseMoney(fields.procFixed) : intl ? profile.processingFixedIntl! : profile.processingFixed,
    regulatoryRate: fields.reg ? Number(fields.reg) / 100 : profile.regulatoryRate,
    vatOnFeesRate: fields.vat ? Number(fields.vat) / 100 : profile.vatOnFeesRate,
    transactionRate: Number(fields.txn) / 100 || TRANSACTION_RATE,
  };
}

export function derive(shop: ShopPrefs, fields: ListingFields): Derived {
  const rates = ratesFromShop(shop, fields);
  const listCents = dollarsToCents(parseMoney(fields.item));
  const salePercent = Math.max(0, Number(fields.salePercent) || 0);
  const chargedCents = saleCharged(listCents, salePercent);
  const qty = Math.max(1, Math.round(Number(fields.qty) || 1));
  const listingFee = allocateListingFee(
    dollarsToCents(parseMoney(shop.listingFee)),
    shop.listingMode as ListingFeeMode,
    Number(shop.amortizeN) || 1,
  );
  const shipCharge = fields.freeShip ? 0 : dollarsToCents(parseMoney(fields.shipCharge));
  const extraQty = Math.max(1, Math.round(Number(fields.extraQty) || 1));
  const addonCents = fields.extraOn ? dollarsToCents(parseMoney(fields.extraPrice)) * extraQty : 0;
  const addonCost = fields.extraOn ? dollarsToCents(parseMoney(fields.extraCogs)) * extraQty : 0;

  const rest = {
    quantity: qty,
    personalizationCents: dollarsToCents(parseMoney(fields.perso)),
    discountCents: dollarsToCents(parseMoney(fields.coupon)),
    addonCents,
    shippingChargedCents: shipCharge,
    giftWrapCents: dollarsToCents(parseMoney(fields.gift)),
    listingFeeCents: listingFee,
    transactionRate: rates.transactionRate,
    processingRate: rates.processingRate,
    processingFixedCents: dollarsToCents(rates.processingFixed),
    regulatoryRate: rates.regulatoryRate,
    offsiteCapCents: dollarsToCents(parseMoney(shop.cap) || OFFSITE_CAP_USD),
    currencyConversionRate: shop.fx ? FX_RATE : 0,
    vatOnFeesRate: rates.vatOnFeesRate,
    buyerTaxCents: dollarsToCents(parseMoney(fields.tax)),
    depositFeeCents: dollarsToCents(parseMoney(fields.deposit)),
    salesVatRate: Math.max(0, Number(fields.salesVat) || 0) / 100,
  };

  const offsiteRate = shop.offsite === "off" ? 0 : shop.offsite === "15" ? 0.15 : 0.12;
  const sale: SaleInput = { ...rest, itemPriceCents: chargedCents, offsiteRate };
  const costs: CostInput = {
    cogsCents: dollarsToCents(parseMoney(fields.cogs)) * qty,
    shippingYouPayCents: dollarsToCents(parseMoney(fields.shipPay)),
    packagingCents: dollarsToCents(parseMoney(fields.pack)) * qty,
    laborCents: dollarsToCents(laborEach(shop, fields)) * qty,
    addonCostCents: addonCost,
  };
  const targetCents = dollarsToCents(parseMoney(fields.target));
  const charm = shop.charm as Charm;
  const quoted = quoteProfit(sale, costs);
  const ads15 = quoteProfit({ ...sale, offsiteRate: 0.15 }, costs);
  const organicFloor = solveListFloor({ ...rest, offsiteRate: 0 }, costs, targetCents, salePercent, charm);
  const adsFloor = solveListFloor({ ...rest, offsiteRate: 0.15 }, costs, targetCents, salePercent, charm);
  const freeAdsFloor = solveListFloor({ ...rest, shippingChargedCents: 0, offsiteRate: 0.15 }, costs, targetCents, salePercent, charm);
  const breakEven = solveListFloor({ ...rest, offsiteRate }, costs, 0, salePercent, charm);
  const winningFloor =
    adsFloor.possible && organicFloor.possible
      ? adsFloor.itemPriceCents >= organicFloor.itemPriceCents
        ? adsFloor
        : organicFloor
      : adsFloor.possible
        ? adsFloor
        : organicFloor;
  const safeCents = winningFloor.possible ? winningFloor.itemPriceCents : 0;
  const exactSafeCents = winningFloor.possible ? (winningFloor.exactCents ?? winningFloor.itemPriceCents) : 0;
  const charmTaxCents = winningFloor.possible ? Math.max(0, safeCents - exactSafeCents) : 0;
  const scenarios = runScenarios({ ...rest, itemPriceCents: chargedCents }, costs, targetCents, salePercent, charm);
  const floors = [organicFloor, adsFloor, freeAdsFloor, ...scenarios.map((s) => s.floor)].filter((f) => f.possible);
  const surviveAllCents = floors.reduce((m, f) => Math.max(m, f.itemPriceCents), 0);
  const surviveAllPossible = floors.length > 0;
  const atSafe = quoteProfit(
    { ...sale, itemPriceCents: saleCharged(safeCents, salePercent), offsiteRate: 0.15 },
    costs,
  );
  const proposedCents = fields.proposed.trim() === "" ? null : dollarsToCents(parseMoney(fields.proposed));
  const atProposed =
    proposedCents == null
      ? null
      : quoteProfit({ ...sale, itemPriceCents: saleCharged(proposedCents, salePercent) }, costs);
  const units = Math.max(0, Math.round(Number(fields.unitsMonth) || 0));
  const goalCents = dollarsToCents(parseMoney(fields.monthlyGoal));
  const organicNow = quoteProfit({ ...sale, offsiteRate: 0 }, costs);
  const mixPct = clampMix(shop.adsMix);
  const mixKeep = mixKeepCents(organicNow.profitCents, ads15.profitCents, mixPct);
  const reservePct = clampReserve(shop.reservePct);
  const cashCents = cashAfterReserve(quoted.profitCents, reservePct);
  const mixCashCents = cashAfterReserve(mixKeep, reservePct);
  const thresholdCents = parseThreshold(shop.freeOver);
  const freeOver =
    thresholdCents == null
      ? null
      : compareFreeOver({
          charm,
          salePercent,
          thresholdCents,
          stayListCents: safeCents,
          stayPossible: adsFloor.possible,
          stayKeepCents: atSafe.profitCents,
          stayFreeShip: fields.freeShip,
          freeAdsFloor,
          sale,
          costs,
        });
  const volume = {
    units,
    keepNowCents: quoted.profitCents * units,
    keepSafeCents: atSafe.profitCents * units,
    liftCents: (atSafe.profitCents - quoted.profitCents) * units,
    unitsForGoal: unitsForGoal(quoted.profitCents, goalCents),
    unitsForGoalSafe: unitsForGoal(atSafe.profitCents, goalCents),
    keepMixCents: mixKeep * units,
    listingDragCents: listingFeeDragCents(parseMoney(shop.listingFee), Math.max(0, Math.round(Number(shop.activeListings) || 0))),
  };
  const adsPolicy = adsRule(parseMoney(shop.trailingUsd));
  const reconcile = reconcileFees(quoted.totalFeesCents, dollarsToCents(parseMoney(fields.statementFees)));
  const lineMatch = reconcileLines(quoted.lines, {
    listing: dollarsToCents(parseMoney(fields.stmtListing)),
    transaction: dollarsToCents(parseMoney(fields.stmtTxn)),
    processing: dollarsToCents(parseMoney(fields.stmtProc)),
    offsite: dollarsToCents(parseMoney(fields.stmtOffsite)),
  });
  const ladder = buildLadder(sale, costs, safeCents, listCents, charm, salePercent);
  const insightList = insights({
    currency: rates.profile.currency,
    current: quoted,
    ads15,
    targetCents,
    listCents,
    organic: organicFloor,
    ads: adsFloor,
    safeCents,
    salePercent,
    freeShip: fields.freeShip,
    shipYouPayCents: costs.shippingYouPayCents,
    listingFeeCents: listingFee,
    freeAds: freeAdsFloor,
    surviveAllCents,
    adsPolicy,
    volumeLift: volume.liftCents,
    volumeUnits: units,
    salesVatRemitCents: quoted.salesVatRemitCents,
    salesVatRate: rest.salesVatRate,
    mixPct,
    mixKeepCents: mixKeep,
    organicKeepCents: organicNow.profitCents,
    freeOver,
    reservePct,
    mixCashCents,
    charmTaxCents,
    exactSafeCents,
  });
  return {
    currency: rates.profile.currency,
    chargedCents,
    listCents,
    sale,
    costs,
    quoted,
    ads15,
    organicFloor,
    adsFloor,
    freeAdsFloor,
    breakEvenCents: breakEven.possible ? breakEven.itemPriceCents : null,
    safeCents,
    surviveAllCents,
    surviveAllPossible,
    maxSalePct: maxSalePercent({ ...rest, offsiteRate }, costs, listCents, targetCents),
    margin: marginPct(quoted.profitCents, quoted.merchandiseCents),
    atSafe,
    atProposed,
    proposedCents,
    volume,
    organicNow,
    mixPct,
    mixKeepCents: mixKeep,
    reservePct,
    cashCents,
    mixCashCents,
    exactSafeCents,
    charmTaxCents,
    freeOver,
    adsPolicy,
    reconcile,
    lineMatch,
    ladder,
    scenarios,
    insightList,
    sensitivity: sensitivity(sale, costs, listCents, (list) => saleCharged(list, salePercent)),
    targetCents,
  };
}

export function defaultListing(): ListingFields {
  return {
    name: "Linen tote",
    item: "32",
    qty: "1",
    perso: "0",
    salePercent: "0",
    coupon: "0",
    shipCharge: "5.50",
    freeShip: false,
    gift: "0",
    tax: "0",
    cogs: "8.40",
    shipPay: "3.20",
    pack: "0.80",
    labor: "2",
    target: "12",
    extraOn: false,
    extraPrice: "4",
    extraQty: "1",
    extraCogs: "0.80",
    deposit: "0",
    procRate: "",
    procFixed: "",
    reg: "",
    vat: "",
    txn: String(TRANSACTION_RATE * 100),
    unitsMonth: "8",
    monthlyGoal: "0",
    proposed: "",
    statementFees: "",
    sku: "",
    notes: "",
    salesVat: "",
    stmtListing: "",
    stmtTxn: "",
    stmtProc: "",
    stmtOffsite: "",
    hours: "",
  };
}

export function encodeListing(shop: ShopPrefs, fields: ListingFields): string {
  const p = new URLSearchParams();
  p.set("p", shop.profileId);
  if (fields.name) p.set("n", fields.name);
  p.set("item", fields.item);
  p.set("qty", fields.qty);
  p.set("ship", fields.shipCharge);
  p.set("cogs", fields.cogs);
  p.set("target", fields.target);
  p.set("pay", fields.shipPay);
  p.set("pack", fields.pack);
  p.set("labor", fields.labor);
  p.set("perso", fields.perso);
  p.set("sale", fields.salePercent);
  p.set("coupon", fields.coupon);
  p.set("gift", fields.gift);
  p.set("tax", fields.tax);
  p.set("charm", shop.charm);
  p.set("ads", shop.offsite);
  p.set("lm", shop.listingMode);
  p.set("an", shop.amortizeN);
  p.set("lf", shop.listingFee);
  if (fields.freeShip) p.set("fs", "1");
  if (shop.fx) p.set("fx", "1");
  if (shop.intlBuyer) p.set("intl", "1");
  if (fields.unitsMonth && fields.unitsMonth !== "0") p.set("u", fields.unitsMonth);
  if (fields.monthlyGoal && fields.monthlyGoal !== "0") p.set("g", fields.monthlyGoal);
  if (fields.proposed) p.set("prop", fields.proposed);
  if (shop.trailingUsd) p.set("trail", shop.trailingUsd);
  if (fields.sku) p.set("sku", fields.sku);
  if (fields.salesVat) p.set("svat", fields.salesVat);
  if (fields.hours) p.set("hrs", fields.hours);
  const note = fields.notes.trim();
  if (note) p.set("note", note.slice(0, 240));
  if (shop.hourly) p.set("hrly", shop.hourly);
  if (shop.adsMix && shop.adsMix !== "25") p.set("mix", shop.adsMix);
  if (shop.freeOver !== "35") p.set("fo", shop.freeOver);
  if (shop.activeListings) p.set("al", shop.activeListings);
  if (shop.reservePct) p.set("rsv", shop.reservePct);
  if (shop.defaultSale && shop.defaultSale !== "0") p.set("ds", shop.defaultSale);
  if (fields.extraOn) {
    p.set("extra", "1");
    p.set("ep", fields.extraPrice);
    p.set("eq", fields.extraQty);
    p.set("ec", fields.extraCogs);
  }
  if (fields.deposit && fields.deposit !== "0") p.set("dep", fields.deposit);
  if (fields.statementFees) p.set("sf", fields.statementFees);
  if (fields.stmtListing) p.set("sl", fields.stmtListing);
  if (fields.stmtTxn) p.set("st", fields.stmtTxn);
  if (fields.stmtProc) p.set("sp", fields.stmtProc);
  if (fields.stmtOffsite) p.set("so", fields.stmtOffsite);
  if (fields.txn && fields.txn !== String(TRANSACTION_RATE * 100)) p.set("txn", fields.txn);
  if (fields.procRate) p.set("pr", fields.procRate);
  if (fields.procFixed) p.set("pf", fields.procFixed);
  if (fields.reg) p.set("reg", fields.reg);
  if (fields.vat) p.set("vat", fields.vat);
  return p.toString();
}

export function applyQuery(shop: ShopPrefs, fields: ListingFields, query: string): { shop: ShopPrefs; fields: ListingFields } {
  const p = new URLSearchParams(query);
  const nextShop = { ...shop };
  const next = { ...fields };
  const take = (key: string) => p.get(key) ?? undefined;
  if (take("p")) nextShop.profileId = take("p")!;
  if (take("n")) next.name = take("n")!;
  if (take("item")) next.item = take("item")!;
  if (take("qty")) next.qty = take("qty")!;
  if (take("ship")) next.shipCharge = take("ship")!;
  if (take("cogs")) next.cogs = take("cogs")!;
  if (take("target")) next.target = take("target")!;
  if (take("pay")) next.shipPay = take("pay")!;
  if (take("pack")) next.pack = take("pack")!;
  if (take("labor")) next.labor = take("labor")!;
  if (take("perso")) next.perso = take("perso")!;
  if (take("sale")) next.salePercent = take("sale")!;
  if (take("coupon")) next.coupon = take("coupon")!;
  if (take("gift")) next.gift = take("gift")!;
  if (take("tax")) next.tax = take("tax")!;
  const charm = take("charm");
  if (charm === "none" || charm === "99" || charm === "95" || charm === "00") nextShop.charm = charm;
  const ads = take("ads");
  if (ads === "off" || ads === "15" || ads === "12") nextShop.offsite = ads;
  const lm = take("lm");
  if (lm === "none" || lm === "sale" || lm === "amortize") nextShop.listingMode = lm;
  if (take("an")) nextShop.amortizeN = take("an")!;
  if (take("lf")) nextShop.listingFee = take("lf")!;
  if (take("u")) next.unitsMonth = take("u")!;
  if (take("g")) next.monthlyGoal = take("g")!;
  if (take("prop")) next.proposed = take("prop")!;
  if (take("trail")) nextShop.trailingUsd = take("trail")!;
  if (take("sku")) next.sku = take("sku")!;
  if (take("svat")) next.salesVat = take("svat")!;
  if (take("hrs")) next.hours = take("hrs")!;
  if (take("note")) next.notes = take("note")!;
  if (take("hrly")) nextShop.hourly = take("hrly")!;
  if (take("mix")) nextShop.adsMix = take("mix")!;
  if (take("fo") != null) nextShop.freeOver = take("fo")!;
  if (take("al")) nextShop.activeListings = take("al")!;
  if (take("rsv")) nextShop.reservePct = take("rsv")!;
  if (take("ds")) nextShop.defaultSale = take("ds")!;
  if (p.get("fs") === "1") next.freeShip = true;
  if (p.get("fx") === "1") nextShop.fx = true;
  if (p.get("intl") === "1") nextShop.intlBuyer = true;
  if (p.get("extra") === "1") {
    next.extraOn = true;
    if (take("ep")) next.extraPrice = take("ep")!;
    if (take("eq")) next.extraQty = take("eq")!;
    if (take("ec")) next.extraCogs = take("ec")!;
  }
  if (take("dep")) next.deposit = take("dep")!;
  if (take("sf")) next.statementFees = take("sf")!;
  if (take("sl")) next.stmtListing = take("sl")!;
  if (take("st")) next.stmtTxn = take("st")!;
  if (take("sp")) next.stmtProc = take("sp")!;
  if (take("so")) next.stmtOffsite = take("so")!;
  if (take("txn")) next.txn = take("txn")!;
  if (take("pr")) next.procRate = take("pr")!;
  if (take("pf")) next.procFixed = take("pf")!;
  if (take("reg")) next.reg = take("reg")!;
  if (take("vat")) next.vat = take("vat")!;
  return { shop: nextShop, fields: next };
}

/** Open a stored query as its own listing. Does not keep free shipping, extras, notes, or FX from the worksheet you are leaving. */
export function openQuery(shop: ShopPrefs, query: string): { shop: ShopPrefs; fields: ListingFields } {
  const p = new URLSearchParams(query);
  const next = applyQuery(shop, defaultListing(), query);
  next.fields.freeShip = p.get("fs") === "1";
  next.fields.extraOn = p.get("extra") === "1";
  next.fields.notes = p.get("note") ?? "";
  next.shop.fx = p.get("fx") === "1";
  next.shop.intlBuyer = p.get("intl") === "1";
  return next;
}

/** Hash boot: same listing keeps extras not in the URL; a different listing opens clean. */
export function bootListing(
  shop: ShopPrefs,
  stored: ListingFields,
  query: string,
): { shop: ShopPrefs; fields: ListingFields } {
  if (!query) return { shop, fields: stored };
  const opened = openQuery(shop, query);
  if (sameListing(stored, opened.fields)) return applyQuery(shop, stored, query);
  return opened;
}
