import { useEffect, useMemo, useRef, useState } from "react";
import { firstEnabled, nextEnabled } from "./palette-nav";

export type Cmd = {
  id: string;
  label: string;
  hint?: string;
  disabled?: boolean;
  run: () => void;
};

export function Palette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Cmd[];
}) {
  const [q, setQ] = useState("");
  const [ix, setIx] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const prior = useRef<HTMLElement | null>(null);
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return commands.filter((c) => !n || `${c.label} ${c.hint ?? ""}`.toLowerCase().includes(n));
  }, [commands, q]);

  useEffect(() => {
    if (!open) {
      setQ("");
      setIx(0);
      document.body.style.overflow = "";
      const el = prior.current;
      prior.current = null;
      if (el) queueMicrotask(() => el.focus());
      return;
    }
    prior.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setIx(firstEnabled(shown));
  }, [q, shown]);

  useEffect(() => {
    if (!open) return;
    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab" || !box.current) return;
      const nodes = [...box.current.querySelectorAll<HTMLElement>("input, button:not([disabled])")];
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", trap);
    return () => window.removeEventListener("keydown", trap);
  }, [open]);

  if (!open) return null;
  const active = shown[ix];

  function go(cmd?: Cmd) {
    if (!cmd || cmd.disabled) return;
    cmd.run();
    onClose();
  }

  return (
    <div
      className="palette-back"
      role="dialog"
      aria-modal="true"
      aria-label="Commands"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="palette" ref={box}>
        <input
          autoFocus
          aria-label="Commands"
          value={q}
          placeholder="Type a command…"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIx((i) => nextEnabled(shown, i, 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setIx((i) => nextEnabled(shown, i, -1));
            }
            if (e.key === "Enter") {
              e.preventDefault();
              go(active);
            }
          }}
        />
        <ul>
          {shown.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={i === ix ? "on" : ""}
                disabled={c.disabled}
                onMouseEnter={() => {
                  if (!c.disabled) setIx(i);
                }}
                onClick={() => go(c)}
              >
                <span>{c.label}</span>
                {c.hint ? <span className="hint">{c.hint}</span> : null}
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="note">No matching command.</li>}
        </ul>
      </div>
    </div>
  );
}
