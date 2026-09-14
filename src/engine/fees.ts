import { vatRemitFromGross } from "./policy";
import type { CostInput, FeeLine, ProfitResult, SaleInput, SaleResult } from "./types";

function rateAmount(baseCents: number, rate: number): number {
  return Math.round(baseCents * rate);
}

/**
 * Etsy fee stack for one order, using published policy mechanics.
 * Amounts are integer cents in the shop currency the seller enters.
 *
 * Sources (accessed 2026-09-04):
 * - https://www.etsy.com/legal/fees/ — listing $0.20, 6.5% transaction,
 *   Offsite Ads 15%/12% on attributed orders, $100 USD cap, 2.5% FX
 * - https://www.etsy.com/legal/etsy-payments — processing = % of gross
 *   (including delivery and tax) + flat per order
 * - https://help.etsy.com/hc/en-us/articles/1500011073202-What-is-a-Regulatory-Operating-Fee
 */
export function quoteSale(input: SaleInput): SaleResult {
  const qty = Math.max(1, Math.floor(input.quantity));
  const item = Math.max(0, input.itemPriceCents);
  const perso = Math.max(0, input.personalizationCents);
  const ship = Math.max(0, input.shippingChargedCents);
  const wrap = Math.max(0, input.giftWrapCents);
  const tax = Math.max(0, input.buyerTaxCents);
  const addon = Math.max(0, input.addonCents);
  const discount = Math.max(0, input.discountCents);
  const merch = Math.max(0, (item + perso) * qty + ship + wrap + addon - discount);
  const buyerPays = merch + tax;
  const processingBase = merch + tax;
  const fxBase = merch + tax;

  const listing = Math.max(0, input.listingFeeCents);
  const transaction = rateAmount(merch, input.transactionRate);
  const processing =
    rateAmount(processingBase, input.processingRate) + Math.max(0, input.processingFixedCents);
  const regulatory = rateAmount(merch, input.regulatoryRate);
  const offsiteRaw = rateAmount(merch, input.offsiteRate);
  const cap = Math.max(0, input.offsiteCapCents);
  const offsiteCapped = input.offsiteRate > 0 && offsiteRaw > cap;
  const offsite = offsiteCapped ? cap : offsiteRaw;
  const fx = rateAmount(fxBase, input.currencyConversionRate);
  const deposit = Math.max(0, input.depositFeeCents);

  const lines: FeeLine[] = [
    {
      id: "listing",
      label: "Listing fee",
      cents: listing,
      detail: "Charged when a listing is published or renewed. Allocate $0.20 USD, ignore it, or split it across expected sales.",
    },
    {
      id: "transaction",
      label: "Transaction fee",
      cents: transaction,
      detail: `${(input.transactionRate * 100).toFixed(1)}% of item + personalization + shipping charged + gift wrap + add-ons, after coupons. US sales tax is excluded.`,
    },
    {
      id: "processing",
      label: "Payment processing",
      cents: processing,
      detail: "Percent of the gross order (including tax and shipping) plus the flat per-order fee for the seller’s bank country.",
    },
    {
      id: "regulatory",
      label: "Regulatory operating fee",
      cents: regulatory,
      detail: "Percent of item + shipping + gift wrap in listed countries. 0% elsewhere.",
    },
    {
      id: "offsite",
      label: "Offsite Ads",
      cents: offsite,
      detail: offsiteCapped
        ? `Capped. Uncapped amount would have been ${(offsiteRaw / 100).toFixed(2)}.`
        : "Only on orders Etsy attributes to an Offsite Ad. 0% if this sale is organic.",
    },
    {
      id: "fx",
      label: "Currency conversion",
      cents: fx,
      detail: "2.5% of the sale amount when listing currency ≠ payment-account currency.",
    },
    {
      id: "deposit",
      label: "Deposit fee",
      cents: deposit,
      detail: "Some bank countries charge a flat fee when a payout is under a published threshold.",
    },
  ];

  const feeSubtotal = lines.reduce((sum, line) => sum + line.cents, 0);
  const vatOnFees = rateAmount(feeSubtotal, input.vatOnFeesRate);
  const totalFees = feeSubtotal + vatOnFees;
  const sellerNet = merch - totalFees;

  return {
    merchandiseCents: merch,
    buyerPaysCents: buyerPays,
    processingBaseCents: processingBase,
    lines,
    feeSubtotalCents: feeSubtotal,
    vatOnFeesCents: vatOnFees,
    totalFeesCents: totalFees,
    sellerNetCents: sellerNet,
    offsiteCapped,
    offsiteRawCents: offsiteRaw,
  };
}

export function quoteProfit(sale: SaleInput, costs: CostInput): ProfitResult {
  const result = quoteSale(sale);
  const salesVatRemitCents = vatRemitFromGross(result.merchandiseCents, sale.salesVatRate);
  const costCents =
    Math.max(0, costs.cogsCents) +
    Math.max(0, costs.shippingYouPayCents) +
    Math.max(0, costs.packagingCents) +
    Math.max(0, costs.laborCents) +
    Math.max(0, costs.addonCostCents) +
    salesVatRemitCents;
  return {
    ...result,
    costCents,
    salesVatRemitCents,
    profitCents: result.sellerNetCents - costCents,
  };
}

export function emptyCosts(): CostInput {
  return { cogsCents: 0, shippingYouPayCents: 0, packagingCents: 0, laborCents: 0, addonCostCents: 0 };
}
