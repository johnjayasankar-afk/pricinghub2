export function sampleNeedsConfirm(rowCount: number): boolean {
  return rowCount > 0;
}

export function sampleAskDanger(mode: "replace" | "append" | "merge"): boolean {
  return mode === "replace";
}

export function replaceNeedsConfirm(
  rowCount: number,
  mode: "replace" | "append" | "merge",
): boolean {
  return rowCount > 0 && mode === "replace";
}
