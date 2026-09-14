import { formatMoney } from "../engine/money";
import type { FeeLine } from "../engine/types";

export function FeeStack({
  lines,
  merch,
  currency,
}: {
  lines: FeeLine[];
  merch: number;
  currency: string;
}) {
  const fees = lines.filter((l) => l.cents > 0);
  const total = fees.reduce((sum, l) => sum + l.cents, 0);
  if (merch <= 0 || total <= 0) return null;
  const share = ((total / merch) * 100).toFixed(0);
  const caption = [
    `${formatMoney(total, currency)} Etsy-side fees`,
    `${share}% of merchandise`,
    ...fees.map((line) => `${line.label} ${formatMoney(line.cents, currency)}`),
  ].join(". ");
  return (
    <div className="stack-wrap">
      <p className="sr">{caption}</p>
      <div className="stack" aria-hidden="true">
        {fees.map((line) => (
          <div
            key={line.id}
            className={`stack-seg stack-${line.id}`}
            style={{ flexGrow: line.cents, flexBasis: 0 }}
            title={`${line.label} ${formatMoney(line.cents, currency)}`}
          />
        ))}
      </div>
      <div className="note">
        {formatMoney(total, currency)} Etsy-side fees · {((total / merch) * 100).toFixed(0)}% of
        merchandise
      </div>
    </div>
  );
}
