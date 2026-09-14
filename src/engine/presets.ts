import { listingCents } from "./listing-id";
import { defaultListing, type ListingFields } from "./worksheet";

export type Preset = {
  id: string;
  label: string;
  blurb: string;
  profileId: string;
  item: string;
  qty: string;
  shipCharge: string;
  gift: string;
  cogs: string;
  shipPay: string;
  pack: string;
  labor: string;
  target: string;
  perso: string;
  salePercent: string;
  freeShip: boolean;
  salesVat?: string;
};

export function presetIsCurrent(pr: Pick<Preset, "label" | "item">, fields: { name: string; item: string }): boolean {
  return pr.label === fields.name && listingCents(pr.item) === listingCents(fields.item);
}

export function listingFromPreset(pr: Preset): ListingFields {
  return {
    ...defaultListing(),
    name: pr.label,
    item: pr.item,
    qty: pr.qty,
    shipCharge: pr.shipCharge,
    gift: pr.gift,
    cogs: pr.cogs,
    shipPay: pr.shipPay,
    pack: pr.pack,
    labor: pr.labor,
    target: pr.target,
    perso: pr.perso,
    salePercent: pr.salePercent,
    freeShip: pr.freeShip,
    salesVat: pr.salesVat ?? "",
  };
}

export const PRESETS: Preset[] = [
  {
    id: "tote",
    label: "Handmade tote",
    blurb: "Physical, charged shipping",
    profileId: "US",
    item: "32",
    qty: "1",
    shipCharge: "5.50",
    gift: "0",
    cogs: "8.40",
    shipPay: "3.20",
    pack: "0.80",
    labor: "2",
    target: "12",
    perso: "0",
    salePercent: "0",
    freeShip: false,
  },
  {
    id: "digital",
    label: "Digital download",
    blurb: "No postage, low cost",
    profileId: "US",
    item: "12",
    qty: "1",
    shipCharge: "0",
    gift: "0",
    cogs: "0",
    shipPay: "0",
    pack: "0",
    labor: "1",
    target: "6",
    perso: "0",
    salePercent: "0",
    freeShip: false,
  },
  {
    id: "sticker",
    label: "Cheap sticker",
    blurb: "The Offsite Ads trap",
    profileId: "US",
    item: "3",
    qty: "1",
    shipCharge: "1.50",
    gift: "0",
    cogs: "0.20",
    shipPay: "0.68",
    pack: "0.15",
    labor: "0.25",
    target: "2",
    perso: "0",
    salePercent: "0",
    freeShip: false,
  },
  {
    id: "pod",
    label: "POD shirt",
    blurb: "High COGS, free shipping",
    profileId: "US",
    item: "28",
    qty: "1",
    shipCharge: "0",
    gift: "0",
    cogs: "14.50",
    shipPay: "4.80",
    pack: "0",
    labor: "1",
    target: "6",
    perso: "0",
    salePercent: "0",
    freeShip: true,
  },
  {
    id: "uk-print",
    label: "UK print",
    blurb: "VAT-inclusive list",
    profileId: "GB",
    item: "18",
    qty: "1",
    shipCharge: "3.50",
    gift: "0",
    cogs: "2.40",
    shipPay: "2.10",
    pack: "0.60",
    labor: "1.50",
    target: "6",
    perso: "0",
    salePercent: "0",
    freeShip: false,
    salesVat: "20",
  },
  {
    id: "cap",
    label: "High-ticket",
    blurb: "Ads fee hits the $100 cap",
    profileId: "US",
    item: "420",
    qty: "1",
    shipCharge: "0",
    gift: "0",
    cogs: "90",
    shipPay: "35",
    pack: "8",
    labor: "25",
    target: "80",
    perso: "0",
    salePercent: "0",
    freeShip: true,
  },
];
