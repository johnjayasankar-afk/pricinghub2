import { useCallback, useEffect, useRef, useState } from "react";

export function emitFlash(msg: string) {
  window.dispatchEvent(new CustomEvent("keepfloor:flash", { detail: msg }));
}

export function applyFlashDetail(detail: unknown): "ignore" | "dismiss" | { show: string } {
  if (typeof detail !== "string") return "ignore";
  if (!detail) return "dismiss";
  return { show: detail };
}

export function useFlash() {
  return { flash: emitFlash };
}

export function useFlashBus() {
  const [msg, setMsg] = useState("");
  const [tick, setTick] = useState(0);
  const timer = useRef(0);
  const show = useCallback((next: string) => {
    setMsg(next);
    setTick((n) => n + 1);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(""), 2400);
  }, []);
  const dismiss = useCallback(() => {
    setMsg("");
    window.clearTimeout(timer.current);
  }, []);
  useEffect(() => {
    function onFlash(e: Event) {
      const next = applyFlashDetail((e as CustomEvent<string>).detail);
      if (next === "ignore") return;
      if (next === "dismiss") {
        dismiss();
        return;
      }
      show(next.show);
    }
    window.addEventListener("keepfloor:flash", onFlash);
    return () => window.removeEventListener("keepfloor:flash", onFlash);
  }, [show, dismiss]);
  return { msg, tick, dismiss };
}

export function Flash({
  msg,
  tick = 0,
  onDismiss,
}: {
  msg: string;
  tick?: number;
  onDismiss?: () => void;
}) {
  if (!msg) return null;
  return (
    <button
      key={tick}
      type="button"
      className="flash noprint"
      role="status"
      aria-live="polite"
      title="Dismiss"
      onClick={onDismiss}
    >
      {msg}
    </button>
  );
}
