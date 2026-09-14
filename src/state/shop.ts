import type { Charm, ListingFeeMode, OffsiteMode } from "../engine/types";
import { emitSheet } from "./sheet";

export type ShopPrefs = {
  profileId: string;
  intlBuyer: boolean;
  fx: boolean;
  charm: Charm;
  listingMode: ListingFeeMode;
  amortizeN: string;
  listingFee: string;
  cap: string;
  offsite: OffsiteMode;
  trailingUsd: string;
  defaultCogs: string;
  defaultShipPay: string;
  defaultTarget: string;
  hourly: string;
  adsMix: string;
  compact: boolean;
  freeOver: string;
  activeListings: string;
  reservePct: string;
  defaultSale: string;
  shipProfiles: ShipProfile[];
  packProfiles: PackProfile[];
};

export type PackProfile = {
  id: string;
  label: string;
  pack: string;
};

export type ShipProfile = {
  id: string;
  label: string;
  charge: string;
  youPay: string;
};

export const DEFAULT_SHIPS: ShipProfile[] = [
  { id: "charged", label: "Charged shipping", charge: "5.50", youPay: "3.20" },
  { id: "free", label: "Free shipping", charge: "0", youPay: "4.80" },
  { id: "digital", label: "Digital / none", charge: "0", youPay: "0" },
];

export const DEFAULT_PACKS: PackProfile[] = [
  { id: "none", label: "No pack", pack: "0" },
  { id: "mailer", label: "Mailer", pack: "0.80" },
  { id: "box", label: "Box + wrap", pack: "2.40" },
];

const KEY = "keepfloor.shop.v2";

export const DEFAULT_SHOP: ShopPrefs = {
  profileId: "US",
  intlBuyer: false,
  fx: false,
  charm: "99",
  listingMode: "sale",
  amortizeN: "8",
  listingFee: "0.20",
  cap: "100",
  offsite: "off",
  trailingUsd: "",
  defaultCogs: "8.40",
  defaultShipPay: "3.20",
  defaultTarget: "12",
  hourly: "20",
  adsMix: "25",
  compact: false,
  freeOver: "35",
  activeListings: "",
  reservePct: "",
  defaultSale: "0",
  shipProfiles: DEFAULT_SHIPS,
  packProfiles: DEFAULT_PACKS,
};

export function loadShop(): ShopPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SHOP };
    const parsed = JSON.parse(raw) as Partial<ShopPrefs>;
    return {
      ...DEFAULT_SHOP,
      ...parsed,
      shipProfiles: parsed.shipProfiles?.length ? parsed.shipProfiles : DEFAULT_SHIPS,
      packProfiles: parsed.packProfiles?.length ? parsed.packProfiles : DEFAULT_PACKS,
    };
  } catch {
    return { ...DEFAULT_SHOP };
  }
}

export function saveShop(prefs: ShopPrefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
    emitSheet();
  } catch {
    /* private mode */
  }
}
