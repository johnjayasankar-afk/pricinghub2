import { useEffect, useRef } from "react";
import { KEY_HINTS } from "../engine/keys";

export function Keys({ open, onClose }: { open: boolean; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const prior = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
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
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key !== "Tab" || !box.current) return;
      const nodes = [...box.current.querySelectorAll<HTMLElement>("button")];
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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="palette-back"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="palette keys-sheet" ref={box}>
        <div className="keys-head">
          <h2>Keys</h2>
          <button type="button" className="linkish" autoFocus onClick={onClose}>
            Close
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Where</th>
              <th>Does</th>
            </tr>
          </thead>
          <tbody>
            {KEY_HINTS.map((h) => (
              <tr key={`${h.keys}-${h.when}`}>
                <td>
                  <kbd>{h.keys}</kbd>
                </td>
                <td>{h.when}</td>
                <td>{h.does}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
