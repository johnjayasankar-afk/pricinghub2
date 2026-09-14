import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_CHECKOUT, loadCheckoutConfig, rememberSandbox, type CheckoutConfig } from "./state/checkout";
import { catalogUnlocked } from "./state/license";
import { applyBackup, backupFilename, buildBackup, parseBackup } from "./state/backup";
import { Calculator } from "./ui/Calculator";
import { Catalog } from "./ui/Catalog";
import {
  HelpPage,
  NotFoundPage,
  PayPage,
  PrivacyPage,
  RefundPage,
  SourcesPage,
  TermsPage,
  ThanksPage,
} from "./ui/Pages";
import { Confirm, useConfirm } from "./ui/Confirm";
import { Keys } from "./ui/Keys";
import { downloadFile } from "./ui/download";
import { emitFlash, Flash, useFlashBus } from "./ui/flash";
import { Palette, type Cmd } from "./ui/Palette";
import { printRatesLine } from "./engine/copy";
import { RATES_AS_OF } from "./engine/policy";
import { catalogHref } from "./state/catalog-ui";
import { listingHref } from "./state/listing-href";
import { rememberReturn } from "./state/return-to";
import { SHEET_EVENT } from "./state/sheet";
import { catalogCmdHint, catalogLive, sheetCmdHint } from "./ui/cmd-scope";
import { PRINT_EVENT, printOnSheet, requestPrint } from "./ui/print-sheet";
import { href, readRoute, skipLabel, titles, type Route } from "./ui/route";

export function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [config, setConfig] = useState<CheckoutConfig>(DEFAULT_CHECKOUT);
  const [unlocked, setUnlocked] = useState(catalogUnlocked);
  const [calcHref, setCalcHref] = useState(listingHref);
  const [catHref, setCatHref] = useState(catalogHref);
  const [palette, setPalette] = useState(false);
  const [keys, setKeys] = useState(false);
  const restoreRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLElement>(null);
  const { ask, confirm, settle } = useConfirm();
  const appFlash = useFlashBus();

  useEffect(() => {
    const onHash = () => {
      rememberSandbox();
      setRoute(readRoute());
      setUnlocked(catalogUnlocked());
      setCalcHref(listingHref());
      setCatHref(catalogHref());
    };
    const onSheet = () => {
      setCalcHref(listingHref());
      setCatHref(catalogHref());
    };
    const onPrint = () => {
      setPalette(false);
      setKeys(false);
      emitFlash("");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => window.print());
      });
    };
    rememberSandbox();
    window.addEventListener("hashchange", onHash);
    window.addEventListener(SHEET_EVENT, onSheet);
    window.addEventListener(PRINT_EVENT, onPrint);
    void loadCheckoutConfig().then(setConfig);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener(SHEET_EVENT, onSheet);
      window.removeEventListener(PRINT_EVENT, onPrint);
    };
  }, []);

  useEffect(() => {
    document.title = titles(route);
    window.scrollTo(0, 0);
    if (route === "home" || route === "catalog") rememberReturn(route);
  }, [route]);

  useEffect(() => {
    const el = topRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const sync = () => {
      document.documentElement.style.setProperty("--shell", `${el.offsetHeight}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setKeys(false);
        setPalette((v) => !v);
        return;
      }
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey && !typing) {
        e.preventDefault();
        setPalette(false);
        setKeys((v) => !v);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        if (printOnSheet(readRoute(), catalogUnlocked())) {
          e.preventDefault();
          requestPrint();
          return;
        }
      }
      if (e.key === "Escape" && !document.querySelector(".palette-back")) {
        emitFlash("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const commands = useMemo<Cmd[]>(() => {
    const go = (r: Route) => {
      window.location.hash = href(r).slice(1);
    };
    const fire = (id: string) => window.dispatchEvent(new CustomEvent("keepfloor:cmd", { detail: id }));
    const onHome = route === "home";
    const onCat = route === "catalog";
    const catReady = catalogLive(onCat, unlocked);
    const sheetReady = onHome || catReady;
    return [
      { id: "home", label: "Open calculator", hint: onHome ? "This page" : "Listing", disabled: onHome, run: () => {
        window.location.hash = listingHref().slice(1);
      } },
      { id: "catalog", label: "Open catalog", hint: onCat ? "This page" : "Many listings", disabled: onCat, run: () => {
        window.location.hash = catalogHref().slice(1);
      } },
      { id: "copy-view", label: "Copy catalog view link", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("copy-view") },
      { id: "pay", label: unlocked ? "Open catalog unlock" : "Unlock catalog", hint: route === "pay" ? "This page" : "$19", disabled: route === "pay", run: () => go("pay") },
      { id: "help", label: "Open help", hint: route === "help" ? "This page" : undefined, disabled: route === "help", run: () => go("help") },
      { id: "keys", label: "Keyboard cheat sheet", hint: "?", run: () => setKeys(true) },
      { id: "sources", label: "Fee sources", hint: route === "sources" ? "This page" : undefined, disabled: route === "sources", run: () => go("sources") },
      { id: "privacy", label: "Privacy", hint: route === "privacy" ? "This page" : undefined, disabled: route === "privacy", run: () => go("privacy") },
      { id: "terms", label: "Terms of use", hint: route === "terms" ? "This page" : undefined, disabled: route === "terms", run: () => go("terms") },
      { id: "refund", label: "Refunds", hint: route === "refund" ? "This page" : undefined, disabled: route === "refund", run: () => go("refund") },
      { id: "safe", label: "Use ads-safe floor", hint: onHome ? "⌘/Ctrl+Enter" : "Calculator", disabled: !onHome, run: () => fire("safe") },
      { id: "survive", label: "Use survive-all floor", hint: onHome ? undefined : "Calculator", disabled: !onHome, run: () => fire("survive") },
      { id: "focus", label: "Toggle focus", hint: onHome ? undefined : "Calculator", disabled: !onHome, run: () => fire("focus") },
      { id: "brief", label: "Download listing briefing", hint: onHome ? undefined : "Calculator", disabled: !onHome, run: () => fire("brief") },
      { id: "qtycsv", label: "Download quantity-price CSV", hint: onHome ? undefined : "Calculator", disabled: !onHome, run: () => fire("qtycsv") },
      { id: "copy-link", label: "Copy listing link", hint: onHome ? undefined : "Calculator", disabled: !onHome, run: () => fire("copy-link") },
      { id: "copy-decision", label: "Copy decision line", hint: onHome ? undefined : "Calculator", disabled: !onHome, run: () => fire("copy-decision") },
      { id: "copy-versus", label: "Copy listing compare", hint: onHome ? undefined : "Calculator", disabled: !onHome, run: () => fire("copy-versus") },
      { id: "threshold", label: "Use free-over crossing list", hint: onHome ? undefined : "Calculator", disabled: !onHome, run: () => fire("threshold") },
      { id: "reset", label: "Reset this worksheet", hint: onHome ? undefined : "Calculator", disabled: !onHome, run: () => fire("reset") },
      { id: "undo", label: "Undo last change", hint: sheetCmdHint(onHome, onCat, unlocked, "⌘/Ctrl+Z"), disabled: !sheetReady, run: () => fire("undo") },
      { id: "redo", label: "Redo last change", hint: sheetCmdHint(onHome, onCat, unlocked, "⌘/Ctrl+Shift+Z"), disabled: !sheetReady, run: () => fire("redo") },
      { id: "copy-receipt", label: "Copy catalog apply receipt", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("copy-receipt") },
      { id: "floors", label: "Apply catalog ads-safe floors", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("floors") },
      { id: "show-all", label: "Show all catalog listings", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("show-all") },
      { id: "dedupe", label: "Remove duplicate catalog SKUs", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("dedupe") },
      { id: "sample", label: "Restore sample catalog", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("sample") },
      { id: "import-file", label: "Import catalog file", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("import-file") },
      { id: "paste-catalog", label: "Paste catalog CSV", hint: catalogCmdHint(onCat, unlocked, "⌘/Ctrl+V"), disabled: !catReady, run: () => fire("paste-catalog") },
      { id: "add-row", label: "Add a catalog row", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("add-row") },
      { id: "fill-blanks", label: "Fill blank catalog costs", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("fill-blanks") },
      { id: "fill-selected", label: "Fill selected catalog rows", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("fill-selected") },
      { id: "select-visible", label: "Select visible catalog rows", hint: catalogCmdHint(onCat, unlocked, "a"), disabled: !catReady, run: () => fire("select-visible") },
      { id: "select-problems", label: "Select problem catalog rows", hint: catReady ? "Includes missing costs" : catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("select-problems") },
      { id: "invert-visible", label: "Invert visible catalog selection", hint: catalogCmdHint(onCat, unlocked, "i"), disabled: !catReady, run: () => fire("invert-visible") },
      { id: "export-selected", label: "Export selected catalog rows", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("export-selected") },
      { id: "export-reprice", label: "Export reprice CSV", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("export-reprice") },
      { id: "export-catalog", label: "Export catalog CSV", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("export-catalog") },
      { id: "export-etsy", label: "Export Etsy price CSV", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("export-etsy") },
      { id: "delete-selected", label: "Delete selected catalog rows", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("delete-selected") },
      { id: "clear-catalog", label: "Clear catalog", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("clear-catalog") },
      { id: "brief-cat", label: "Download catalog briefing", hint: catalogCmdHint(onCat, unlocked), disabled: !catReady, run: () => fire("brief-catalog") },
      { id: "print", label: "Print this sheet", hint: sheetCmdHint(onHome, onCat, unlocked), disabled: !sheetReady, run: () => requestPrint() },
      {
        id: "backup",
        label: "Download local backup",
        hint: "Shop + listing + catalog",
        run: () => {
          const data = buildBackup();
          downloadFile(backupFilename(data.at), JSON.stringify(data, null, 2), "application/json");
        },
      },
      {
        id: "restore",
        label: "Restore local backup",
        run: () => restoreRef.current?.click(),
      },
    ];
  }, [route, unlocked]);

  return (
    <div className="app">
      <a className="skip noprint" href="#main">
        {skipLabel(route)}
      </a>
      <header className="top noprint" ref={topRef}>
        <div className="top-row">
          <a className="brand" href={calcHref}>
            <img className="brand-mark" src="/favicon.svg" alt="" width={26} height={26} />
            KeepFloor
          </a>
          <nav className="nav" aria-label="KeepFloor">
            <a className={route === "home" ? "active" : ""} aria-current={route === "home" ? "page" : undefined} href={calcHref}>
              Calculator
            </a>
            <a className={route === "catalog" ? "active" : ""} aria-current={route === "catalog" ? "page" : undefined} href={catHref}>
              Catalog
            </a>
            <a className={route === "pay" ? "active" : ""} aria-current={route === "pay" ? "page" : undefined} href={href("pay")}>
              Buy
            </a>
            <a className={route === "help" ? "active" : ""} aria-current={route === "help" ? "page" : undefined} href={href("help")}>
              Help
            </a>
            <a className={route === "sources" ? "active" : ""} aria-current={route === "sources" ? "page" : undefined} href={href("sources")}>
              Sources
            </a>
            <button type="button" className="nav-ctrl" aria-label="Commands" onClick={() => setPalette(true)}>
              ⌘K
            </button>
            <button type="button" className="nav-ctrl" aria-label="Keyboard shortcuts" onClick={() => setKeys(true)}>
              ?
            </button>
          </nav>
        </div>
        <p className="ribbon">
          Rates as of {RATES_AS_OF} ·{" "}
          <a href={href("sources")}>Fee sources</a> · Not affiliated with Etsy
        </p>
      </header>

      <main id="main">
      {route === "home" && <Calculator catalogOpen={unlocked} />}
      {route === "catalog" && <Catalog unlocked={unlocked} />}
      {route === "pay" && (
        <PayPage
          config={config}
          onUnlocked={() => {
            setUnlocked(true);
          }}
        />
      )}
      {route === "thanks" && <ThanksPage />}
      {route === "help" && <HelpPage config={config} />}
      {route === "privacy" && <PrivacyPage />}
      {route === "terms" && <TermsPage />}
      {route === "refund" && <RefundPage />}
      {route === "sources" && <SourcesPage />}
      {route === "notfound" && <NotFoundPage />}
      {(route === "home" || route === "catalog") && (
        <p className="print-only print-fine">{printRatesLine(RATES_AS_OF)}</p>
      )}
      </main>

      <footer className="fine noprint">
        Independent worksheet. Not affiliated with Etsy, Inc.{" "}
        <a href={href("privacy")}>Privacy</a> · <a href={href("terms")}>Terms</a> ·{" "}
        <a href={href("refund")}>Refunds</a>
        {config.supportEmail ? (
          <>
            {" "}
            · <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>
          </>
        ) : (
          " · Support email is published when checkout is connected."
        )}
        <p className="labs-credit">
          An independent product by <a href="https://johnjayasankar.com">John Jayasankar</a>, part of{" "}
          <a href="https://labs.johnjayasankar.com">Labs</a>.
        </p>
      </footer>

      <input
        ref={restoreRef}
        className="sr"
        type="file"
        accept="application/json,.json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          void file.text().then(async (raw) => {
            const parsed = parseBackup(raw);
            if (!parsed.ok) {
              await confirm({ title: "Backup not restored", body: parsed.error, notice: true });
              return;
            }
            const ok = await confirm({
              title: "Restore this backup?",
              body: "This replaces shop defaults, the current listing, and catalog rows on this device. The listing you are on is parked in Recents. The license key stays put.",
              confirmLabel: "Replace",
              danger: true,
            });
            if (!ok) return;
            applyBackup(parsed.data);
            emitFlash("Backup restored on this device.");
          });
        }}
      />
      <Flash msg={appFlash.msg} tick={appFlash.tick} onDismiss={appFlash.dismiss} />
      <Palette open={palette} onClose={() => setPalette(false)} commands={commands} />
      <Keys open={keys} onClose={() => setKeys(false)} />
      <Confirm ask={ask} onSettle={settle} />
    </div>
  );
}
