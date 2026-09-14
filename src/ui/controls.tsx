import type { KeyboardEvent, ReactNode } from "react";
import { parseMoney } from "../engine/money";

export function ActionGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="action-group">
      <span className="action-k">{label}</span>
      <div className="actions" style={{ marginTop: 0 }}>
        {children}
      </div>
    </div>
  );
}

export function Seg<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
  label?: string;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={value === opt.id}
          className={value === opt.id ? "on" : ""}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function MoneyField({
  id,
  label,
  value,
  onChange,
  hint,
  step = 0.01,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  step?: number;
}) {
  function nudge(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const jump = step >= 1 ? 10 : 1;
    const delta = (e.shiftKey ? jump : step) * (e.key === "ArrowUp" ? 1 : -1);
    const next = parseMoney(value) + delta;
    const digits = step >= 1 ? 0 : 2;
    onChange(Math.max(0, next).toFixed(digits));
  }
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={nudge}
        onBlur={() => {
          const digits = step >= 1 ? 0 : 2;
          onChange(Math.max(0, parseMoney(value)).toFixed(digits));
        }}
      />
      {hint && <div className="note">{hint}</div>}
    </div>
  );
}

export function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}
