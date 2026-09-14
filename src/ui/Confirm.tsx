import { useEffect, useRef, useState } from "react";

export type Ask = {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  notice?: boolean;
};

export function askButtons(ask: Ask): { yes: string; no: string | null } {
  return {
    yes: ask.confirmLabel ?? (ask.notice ? "OK" : "Continue"),
    no: ask.notice ? null : (ask.cancelLabel ?? "Cancel"),
  };
}

export function useConfirm() {
  const [ask, setAsk] = useState<Ask | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const prior = useRef<HTMLElement | null>(null);

  function confirm(next: Ask): Promise<boolean> {
    resolver.current?.(false);
    prior.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setAsk(next);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }

  function settle(value: boolean) {
    resolver.current?.(value);
    resolver.current = null;
    setAsk(null);
    const el = prior.current;
    prior.current = null;
    queueMicrotask(() => el?.focus?.());
  }

  return { ask, confirm, settle };
}

export function Confirm({ ask, onSettle }: { ask: Ask | null; onSettle: (value: boolean) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const buttons = ask ? askButtons(ask) : { yes: "OK", no: "Cancel" };

  useEffect(() => {
    if (!ask) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [ask]);

  useEffect(() => {
    if (!ask) return;
    const notice = Boolean(ask.notice);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onSettle(notice);
      }
      if (e.key !== "Tab" || !box.current) return;
      const nodes = [...box.current.querySelectorAll<HTMLElement>("button:not([disabled])")];
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
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ask, onSettle]);

  if (!ask) return null;

  return (
    <div
      className="palette-back"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onSettle(Boolean(ask.notice));
      }}
    >
      <div className="palette confirm-sheet" ref={box}>
        <div className="confirm-body">
          <h2 id="confirm-title">{ask.title}</h2>
          <p id="confirm-body">{ask.body}</p>
          <div className="actions" style={{ marginTop: "1rem" }}>
            {buttons.no ? (
              <button type="button" className="btn secondary" onClick={() => onSettle(false)}>
                {buttons.no}
              </button>
            ) : null}
            <button
              type="button"
              className={ask.danger ? "btn danger" : "btn"}
              autoFocus
              onClick={() => onSettle(true)}
            >
              {buttons.yes}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
