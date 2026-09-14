import { sandboxMode, type CheckoutConfig } from "./checkout";

const STORAGE = "keepfloor.catalog";
const RECEIPT = "keepfloor.receipt";

export function catalogUnlocked(): boolean {
  if (import.meta.env.VITE_EDITION === "catalog") return true;
  try {
    return localStorage.getItem(STORAGE) === "1";
  } catch {
    return false;
  }
}

export function grantCatalog(receiptId: string): void {
  localStorage.setItem(STORAGE, "1");
  localStorage.setItem(RECEIPT, receiptId);
}

export function storedReceipt(): string {
  try {
    return localStorage.getItem(RECEIPT) ?? "";
  } catch {
    return "";
  }
}

export function revokeCatalog(): void {
  localStorage.removeItem(STORAGE);
  localStorage.removeItem(RECEIPT);
}

export function isSandboxKey(key: string): boolean {
  return key.trim().toUpperCase() === "KEEPFLOOR-SANDBOX";
}

export async function unlockWithKey(key: string, config: CheckoutConfig): Promise<string> {
  const trimmed = key.trim();
  if (!trimmed) return "Enter the license key from your receipt.";
  if (isSandboxKey(trimmed)) {
    if (!sandboxMode() && !import.meta.env.DEV) {
      return "The sandbox key only works in sandbox mode.";
    }
    grantCatalog(`sandbox-${Date.now()}`);
    return "";
  }
  if (!config.polarOrganizationId) {
    return "Live license checks are not connected yet. Use the file Polar emailed, or ask support to recover your purchase.";
  }
  try {
    const base = (config.polarApiBase || "https://api.polar.sh").replace(/\/$/, "");
    const res = await fetch(`${base}/v1/customer-portal/license-keys/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: trimmed,
        organization_id: config.polarOrganizationId,
      }),
    });
    if (!res.ok) return "Polar did not accept that key. Check the email receipt or contact support.";
    grantCatalog(trimmed.slice(0, 12));
    return "";
  } catch {
    return "Could not reach Polar from this browser. Open the catalog file from your receipt instead.";
  }
}
