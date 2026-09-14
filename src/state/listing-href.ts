import { encodeListing, type ListingFields } from "../engine/worksheet";
import { isHomeHash } from "../ui/route";
import { loadListing } from "./listing";
import { loadShop, type ShopPrefs } from "./shop";

export function listingHref(shop = loadShop(), fields = loadListing()): string {
  const q = encodeListing(shop, fields);
  return q ? `#/?${q}` : "#/";
}

export function writeListingHash(shop: ShopPrefs, fields: ListingFields): string {
  const next = listingHref(shop, fields);
  if (typeof window === "undefined") return next;
  if (!isHomeHash(window.location.hash)) return next;
  if (window.location.hash !== next) window.history.replaceState(null, "", next);
  return next;
}
