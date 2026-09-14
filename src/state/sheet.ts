export const SHEET_EVENT = "keepfloor:sheet";
export const RESTORE_EVENT = "keepfloor:restore";

export function emitSheet(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SHEET_EVENT));
}

export function emitRestore(): void {
  emitSheet();
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(RESTORE_EVENT));
}