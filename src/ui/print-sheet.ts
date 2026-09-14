export const PRINT_EVENT = "keepfloor:print";

export function printOnSheet(route: string, unlocked = true): boolean {
  if (route === "home") return true;
  return route === "catalog" && unlocked;
}

export function requestPrint(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PRINT_EVENT));
}
