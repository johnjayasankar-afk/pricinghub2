import { catalogHref } from "./catalog-ui";
import { listingHref } from "./listing-href";

const KEY = "keepfloor.return.v1";

export function returnKind(stored: string | null): "home" | "catalog" {
  return stored === "catalog" ? "catalog" : "home";
}

export function rememberReturn(route: "home" | "catalog"): void {
  try {
    sessionStorage.setItem(KEY, route);
  } catch {
    /* private mode */
  }
}

function loadKind(): "home" | "catalog" {
  try {
    return returnKind(sessionStorage.getItem(KEY));
  } catch {
    return "home";
  }
}

export function lastSheet(): "home" | "catalog" {
  return loadKind();
}

export function thanksOffersCalculator(kind: "home" | "catalog"): boolean {
  return kind === "home";
}

export function returnHref(): string {
  return loadKind() === "catalog" ? catalogHref() : listingHref();
}

export function returnLabel(): string {
  return loadKind() === "catalog" ? "Back to catalog" : "Back to calculator";
}

export function returnOpenLabel(): string {
  return loadKind() === "catalog" ? "Open catalog" : "Open calculator";
}
