export type SellerProfile = {
  id: string;
  label: string;
  currency: string;
  processingRate: number;
  processingFixed: number;
  processingRateIntl?: number;
  processingFixedIntl?: number;
  regulatoryRate: number;
  vatOnFeesRate: number;
  transactionExcludesSalesTax: boolean;
};

/**
 * Processing defaults from Etsy Payments Policy §9.B
 * https://www.etsy.com/legal/etsy-payments — accessed 2026-09-04
 *
 * Regulatory defaults from
 * https://help.etsy.com/hc/en-us/articles/1500011073202-What-is-a-Regulatory-Operating-Fee
 * accessed 2026-09-04
 *
 * VAT-on-fees defaults are typical statutory rates, not a determination that
 * Etsy will charge them on a given shop. Every rate is editable.
 */
export const SELLER_PROFILES: SellerProfile[] = [
  {
    id: "US",
    label: "United States",
    currency: "USD",
    processingRate: 0.03,
    processingFixed: 0.25,
    regulatoryRate: 0,
    vatOnFeesRate: 0,
    transactionExcludesSalesTax: true,
  },
  {
    id: "GB",
    label: "United Kingdom",
    currency: "GBP",
    processingRate: 0.04,
    processingFixed: 0.2,
    regulatoryRate: 0.0048,
    vatOnFeesRate: 0.2,
    transactionExcludesSalesTax: false,
  },
  {
    id: "CA-dom",
    label: "Canada (domestic or US buyer)",
    currency: "CAD",
    processingRate: 0.03,
    processingFixed: 0.25,
    processingRateIntl: 0.04,
    processingFixedIntl: 0.25,
    regulatoryRate: 0.005,
    vatOnFeesRate: 0,
    transactionExcludesSalesTax: false,
  },
  {
    id: "AU-dom",
    label: "Australia (domestic buyer)",
    currency: "AUD",
    processingRate: 0.03,
    processingFixed: 0.25,
    processingRateIntl: 0.04,
    processingFixedIntl: 0.25,
    regulatoryRate: 0,
    vatOnFeesRate: 0.1,
    transactionExcludesSalesTax: false,
  },
  {
    id: "EU",
    label: "Euro area (4% + €0.30)",
    currency: "EUR",
    processingRate: 0.04,
    processingFixed: 0.3,
    regulatoryRate: 0,
    vatOnFeesRate: 0,
    transactionExcludesSalesTax: false,
  },
  {
    id: "FR",
    label: "France",
    currency: "EUR",
    processingRate: 0.04,
    processingFixed: 0.3,
    regulatoryRate: 0.0114,
    vatOnFeesRate: 0.2,
    transactionExcludesSalesTax: false,
  },
  {
    id: "DE",
    label: "Germany",
    currency: "EUR",
    processingRate: 0.04,
    processingFixed: 0.3,
    regulatoryRate: 0,
    vatOnFeesRate: 0.19,
    transactionExcludesSalesTax: false,
  },
  {
    id: "ES",
    label: "Spain",
    currency: "EUR",
    processingRate: 0.04,
    processingFixed: 0.3,
    regulatoryRate: 0.0088,
    vatOnFeesRate: 0.21,
    transactionExcludesSalesTax: false,
  },
  {
    id: "IT",
    label: "Italy",
    currency: "EUR",
    processingRate: 0.04,
    processingFixed: 0.3,
    regulatoryRate: 0.008,
    vatOnFeesRate: 0.22,
    transactionExcludesSalesTax: false,
  },
  {
    id: "HU",
    label: "Hungary",
    currency: "EUR",
    processingRate: 0.04,
    processingFixed: 0.3,
    regulatoryRate: 0.0197,
    vatOnFeesRate: 0.27,
    transactionExcludesSalesTax: false,
  },
  {
    id: "IN",
    label: "India",
    currency: "INR",
    processingRate: 0.05,
    processingFixed: 25,
    regulatoryRate: 0.0005,
    vatOnFeesRate: 0,
    transactionExcludesSalesTax: false,
  },
  {
    id: "TR",
    label: "Türkiye",
    currency: "TRY",
    processingRate: 0.065,
    processingFixed: 14,
    regulatoryRate: 0.0167,
    vatOnFeesRate: 0,
    transactionExcludesSalesTax: false,
  },
  {
    id: "VN",
    label: "Vietnam",
    currency: "VND",
    processingRate: 0.045,
    processingFixed: 11550,
    regulatoryRate: 0.0124,
    vatOnFeesRate: 0,
    transactionExcludesSalesTax: false,
  },
  {
    id: "NZ-dom",
    label: "New Zealand (domestic buyer)",
    currency: "NZD",
    processingRate: 0.03,
    processingFixed: 0.3,
    processingRateIntl: 0.04,
    processingFixedIntl: 0.3,
    regulatoryRate: 0,
    vatOnFeesRate: 0.15,
    transactionExcludesSalesTax: false,
  },
  {
    id: "SG",
    label: "Singapore",
    currency: "SGD",
    processingRate: 0.044,
    processingFixed: 0.35,
    regulatoryRate: 0,
    vatOnFeesRate: 0.09,
    transactionExcludesSalesTax: false,
  },
  {
    id: "custom",
    label: "Custom rates",
    currency: "USD",
    processingRate: 0.03,
    processingFixed: 0.25,
    regulatoryRate: 0,
    vatOnFeesRate: 0,
    transactionExcludesSalesTax: true,
  },
];

export const TRANSACTION_RATE = 0.065;
export const LISTING_FEE_USD = 0.2;
export const OFFSITE_CAP_USD = 100;
export const FX_RATE = 0.025;

export function profileById(id: string): SellerProfile {
  return SELLER_PROFILES.find((p) => p.id === id) ?? SELLER_PROFILES[0];
}
