import type { PricedRow } from "./catalog";
import { rowListCents } from "./catalog";
import { formatMoney } from "./money";

export type ApplyLine = {
  name: string;
  sku: string;
  fromCents: number;
  toCents: number;
};

export type ApplyReceipt = {
  at: number;
  salePercent: number;
  raise: number;
  already: number;
  blank: number;
  addedCents: number;
  lines: ApplyLine[];
};

export function buildApplyReceipt(
  raise: PricedRow[],
  already: number,
  blank: number,
  salePercent: string,
  at = Date.now(),
): ApplyReceipt {
  const lines = raise.map((p) => ({
    name: p.row.name,
    sku: p.row.sku,
    fromCents: rowListCents(p.row),
    toCents: p.safeCents,
  }));
  return {
    at,
    salePercent: Math.max(0, Number(salePercent) || 0),
    raise: lines.length,
    already,
    blank,
    addedCents: lines.reduce((sum, line) => sum + (line.toCents - line.fromCents), 0),
    lines,
  };
}

export function receiptText(receipt: ApplyReceipt, currency: string): string {
  const when = new Date(receipt.at).toLocaleString();
  const sale = receipt.salePercent > 0 ? ` · sale ${receipt.salePercent}%` : "";
  const lines = [
    `KeepFloor apply receipt${sale}`,
    when,
    `${receipt.raise} list${receipt.raise === 1 ? "" : "s"} raised · ${formatMoney(receipt.addedCents, currency)} added to lists${
      receipt.already ? ` · ${receipt.already} already safe` : ""
    }${receipt.blank ? ` · ${receipt.blank} skipped (no costs)` : ""}`,
    "",
    ...receipt.lines.map((line) => {
      const sku = line.sku ? ` [${line.sku}]` : "";
      return `${line.name}${sku}  ${formatMoney(line.fromCents, currency)} → ${formatMoney(line.toCents, currency)}  (${formatMoney(line.toCents - line.fromCents, currency)})`;
    }),
    "Not affiliated with Etsy. Check the new lists in Shop Manager before you publish.",
  ];
  return lines.join("\n");
}

export function receiptCsv(receipt: ApplyReceipt): string {
  const header = "name,sku,from,to,added";
  const rows = receipt.lines.map((line) => {
    const name = `"${line.name.replace(/"/g, '""')}"`;
    const sku = `"${line.sku.replace(/"/g, '""')}"`;
    const from = (line.fromCents / 100).toFixed(2);
    const to = (line.toCents / 100).toFixed(2);
    const added = ((line.toCents - line.fromCents) / 100).toFixed(2);
    return `${name},${sku},${from},${to},${added}`;
  });
  return [header, ...rows].join("\n");
}
