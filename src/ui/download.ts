export function fileStem(name: string): string {
  const stem = (name || "keepfloor").replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
  return stem || "keepfloor";
}

export function downloadFile(name: string, body: string, type: string): void {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
