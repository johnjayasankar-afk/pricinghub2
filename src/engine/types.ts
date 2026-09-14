export type OffsiteMode = "off" | "15" | "12";
export type Charm = "none" | "99" | "95" | "00";
export type ListingFeeMode = "none" | "sale" | "amortize";
export type Risk = "safe" | "below" | "ads-loss" | "impossible";

export type SaleInput = {
  itemPriceCents: number;
  quantity: number;
  personalizationCents: number;
  discountCents: number;
  addonCents: number;
  shippingChargedCents: number;
  giftWrapCents: number;
  listingFeeCents: number;
  transactionRate: number;
  processingRate: number;
  processingFixedCents: number;
  regulatoryRate: number;
  offsiteRate: number;
  offsiteCapCents: number;
  currencyConversionRate: number;
  vatOnFeesRate: number;
  buyerTaxCents: number;
  depositFeeCents: number;
  salesVatRate: number;
};

export type FeeLine = {
  id: string;
  label: string;
  cents: number;
  detail: string;
};

export type SaleResult = {
  merchandiseCents: number;
  buyerPaysCents: number;
  processingBaseCents: number;
  lines: FeeLine[];
  feeSubtotalCents: number;
  vatOnFeesCents: number;
  totalFeesCents: number;
  sellerNetCents: number;
  offsiteCapped: boolean;
  offsiteRawCents: number;
};

export type CostInput = {
  cogsCents: number;
  shippingYouPayCents: number;
  packagingCents: number;
  laborCents: number;
  addonCostCents: number;
};

export type ProfitResult = SaleResult & {
  costCents: number;
  salesVatRemitCents: number;
  profitCents: number;
};

export type FloorResult = {
  possible: boolean;
  itemPriceCents: number;
  /** List cents before charm. Same as itemPriceCents when charm is none. */
  exactCents?: number;
  merchCents: number;
  profitCents: number;
  offsiteCapped: boolean;
  reason?: string;
};

export type Insight = {
  tone: "ok" | "warn" | "info";
  text: string;
};
