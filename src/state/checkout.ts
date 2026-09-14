export type CheckoutConfig = {
  productName: string;
  priceUsd: number;
  currency: string;
  polarCheckoutUrl: string;
  polarOrganizationId: string;
  polarApiBase: string;
  gumroadUrl: string;
  supportEmail: string;
};

export const DEFAULT_CHECKOUT: CheckoutConfig = {
  productName: "KeepFloor Catalog",
  priceUsd: 19,
  currency: "USD",
  polarCheckoutUrl: "",
  polarOrganizationId: "",
  polarApiBase: "https://api.polar.sh",
  gumroadUrl: "",
  supportEmail: "",
};

export async function loadCheckoutConfig(): Promise<CheckoutConfig> {
  try {
    const res = await fetch("/checkout.json", { cache: "no-store" });
    if (!res.ok) return DEFAULT_CHECKOUT;
    const data = (await res.json()) as Partial<CheckoutConfig>;
    return { ...DEFAULT_CHECKOUT, ...data };
  } catch {
    return DEFAULT_CHECKOUT;
  }
}

export function liveCheckoutReady(config: CheckoutConfig): boolean {
  return Boolean(config.polarCheckoutUrl || config.gumroadUrl);
}

export const SANDBOX_STORE = "keepfloor.sandbox";

export function sandboxFlag(search: string, hash: string, stored: boolean): boolean {
  return stored || search.includes("sandbox=1") || hash.includes("sandbox=1");
}

export function rememberSandbox(): boolean {
  if (typeof window === "undefined") return false;
  if (sandboxFlag(window.location.search, window.location.hash, false)) {
    try {
      sessionStorage.setItem(SANDBOX_STORE, "1");
    } catch {
      /* private mode */
    }
  }
  return sandboxMode();
}

export function sandboxMode(): boolean {
  if (typeof window === "undefined") return false;
  let stored = false;
  try {
    stored = sessionStorage.getItem(SANDBOX_STORE) === "1";
  } catch {
    stored = false;
  }
  return sandboxFlag(window.location.search, window.location.hash, stored);
}
