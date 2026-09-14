const KEY = "keepfloor.focus.v1";

export function parseFocusFlag(raw: string | null): boolean {
  return raw === "1";
}

export function loadFocus(): boolean {
  try {
    return parseFocusFlag(sessionStorage.getItem(KEY));
  } catch {
    return false;
  }
}

export function saveFocus(on: boolean): void {
  try {
    if (on) sessionStorage.setItem(KEY, "1");
    else sessionStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}
