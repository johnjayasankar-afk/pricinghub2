export function slashShowsForm(focusOn: boolean): boolean {
  return focusOn;
}

export function isCatalogDeleteKey(key: string): boolean {
  return key === "Backspace" || key === "Delete";
}

export function catalogDeleteTarget(selected: number, hasCursor: boolean): "selected" | "cursor" | "none" {
  if (selected > 0) return "selected";
  return hasCursor ? "cursor" : "none";
}

export function isCatalogPasteKey(e: { key: string; metaKey: boolean; ctrlKey: boolean }): boolean {
  return (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "v";
}

export type KeyHint = {
  keys: string;
  when: string;
  does: string;
};

export const KEY_HINTS: KeyHint[] = [
  { keys: "⌘/Ctrl+K", when: "Anywhere", does: "Open commands" },
  { keys: "?", when: "Not typing", does: "This cheat sheet" },
  { keys: "Esc", when: "Palette or sheet", does: "Close" },
  { keys: "Esc", when: "Status toast", does: "Dismiss" },
  { keys: "Esc", when: "Catalog", does: "Show all listings" },
  { keys: "⌘/Ctrl+Enter", when: "Calculator", does: "Use ads-safe floor" },
  { keys: "⌘/Ctrl+Z", when: "Calculator or catalog", does: "Undo last change" },
  { keys: "⌘/Ctrl+Shift+Z", when: "Calculator or catalog", does: "Redo" },
  { keys: "j / k", when: "Catalog", does: "Move highlight" },
  { keys: "x", when: "Catalog", does: "Select highlighted row" },
  { keys: "Enter", when: "Catalog", does: "Open row; returning writes it back" },
  { keys: "d", when: "Catalog", does: "Duplicate highlighted row" },
  { keys: "Delete / Backspace", when: "Catalog", does: "Delete selected or highlighted row" },
  { keys: "a", when: "Catalog", does: "Select visible rows" },
  { keys: "i", when: "Catalog", does: "Invert visible selection" },
  { keys: "/", when: "Calculator", does: "Show the form and focus list price" },
  { keys: "/", when: "Catalog", does: "Focus search" },
  { keys: "Shift-click", when: "Recent chip", does: "Pin or unpin" },
  { keys: "⌘/Ctrl+P", when: "Calculator or catalog", does: "Print this sheet" },
  { keys: "⌘/Ctrl+V", when: "Catalog, not typing", does: "Paste a catalog CSV" },
];
