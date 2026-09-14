import type { ApplyReceipt } from "../engine/receipt";

const KEY = "keepfloor.catalog.apply.v1";

export function loadApplyReceipt(): ApplyReceipt | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ApplyReceipt;
    if (!parsed || !Array.isArray(parsed.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveApplyReceipt(receipt: ApplyReceipt | null): void {
  try {
    if (!receipt) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(receipt));
  } catch {
    /* private mode */
  }
}
