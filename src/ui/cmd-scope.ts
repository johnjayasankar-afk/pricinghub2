export function catalogLive(onCat: boolean, unlocked: boolean): boolean {
  return onCat && unlocked;
}

export function catalogCmdHint(onCat: boolean, unlocked: boolean, whenLive?: string): string | undefined {
  if (onCat && unlocked) return whenLive;
  if (onCat) return "Unlock catalog";
  return "Catalog";
}

export function sheetCmdHint(
  onHome: boolean,
  onCat: boolean,
  unlocked: boolean,
  whenLive?: string,
): string | undefined {
  if (onHome || catalogLive(onCat, unlocked)) return whenLive;
  if (onCat) return "Unlock catalog";
  return "Calculator or catalog";
}
