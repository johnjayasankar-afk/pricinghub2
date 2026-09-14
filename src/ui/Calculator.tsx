import { useEffect, useMemo, useRef, useState } from "react";
import { briefing, decisionLine, listingPrintTitle, snapshotJson } from "../engine/copy";
import { dollarsToCents, formatMoney, parseMoney } from "../engine/money";
import { listingFromPreset, PRESETS, presetIsCurrent } from "../engine/presets";
import { SELLER_PROFILES, profileById } from "../engine/profiles";
import type { Charm, ListingFeeMode, OffsiteMode } from "../engine/types";
import { qtyBreaks, toQtyCsv } from "../engine/qty";
import { compareCards, compareText, listingCard } from "../engine/compare";
import { parseReplay } from "../engine/replay";
import { slashShowsForm } from "../engine/keys";
import { applyUndoSnap, snapListing, type UndoSnap } from "../engine/undo";
import { bootListing, defaultListing, derive, encodeListing, laborEach, openQuery, type ListingFields } from "../engine/worksheet";
import type { ScenarioId } from "../engine/scenarios";
import { loadSnapshots, rememberSnapshot } from "../state/snapshots";
import { coachDismissed, dismissCoach } from "../state/coach";
import { loadFocus, saveFocus } from "../state/focus";
import { loadListing, saveListing } from "../state/listing";
import { RESTORE_EVENT } from "../state/sheet";
import { lastUnpinned, loadRecents, recentId, rememberRecent, removeRecent, togglePin, type Recent } from "../state/recents";
import { loadReplays, rememberReplay } from "../state/replays";
import { clearCatalogEdit, writeListingToCatalog } from "../state/catalog-edit";
import { cameFromCatalog, clearFromCatalog } from "../state/nav";
import { DEFAULT_SHOP, loadShop, saveShop, type ShopPrefs } from "../state/shop";
import { Confirm, useConfirm } from "./Confirm";
import { ActionGroup, Check, MoneyField, Seg } from "./controls";
import { FeeStack } from "./FeeStack";
import { copyNote, copyText } from "./copy";
import { downloadFile, fileStem } from "./download";
import { useFlash } from "./flash";
import { catalogHref } from "../state/catalog-ui";
import { writeListingHash } from "../state/listing-href";
import { requestPrint } from "./print-sheet";
import { hashQuery, href, titles } from "./route";

function boot() {
  const shop = loadShop();
  const fields = loadListing();
  const q = hashQuery();
  return bootListing(shop, fields, q);
}

export function Calculator({ catalogOpen }: { catalogOpen: boolean }) {
  const [seed] = useState(boot);
  const [shop, setShop] = useState<ShopPrefs>(seed.shop);
  const [fields, setFields] = useState<ListingFields>(seed.fields);
  const [undoStack, setUndoStack] = useState<UndoSnap[]>([]);
  const [redoStack, setRedoStack] = useState<UndoSnap[]>([]);
  const [replayText, setReplayText] = useState("");
  const [replayHist, setReplayHist] = useState(loadReplays);
  const [compareId, setCompareId] = useState(() => loadRecents().find((r) => r.pinned)?.id ?? "");
  const [fromCatalog, setFromCatalog] = useState(cameFromCatalog);
  const [showCoach, setShowCoach] = useState(() => !coachDismissed());
  const [focus, setFocus] = useState(loadFocus);
  const [recents, setRecents] = useState<Recent[]>(loadRecents);
  const [snaps, setSnaps] = useState(loadSnapshots);
  const { flash } = useFlash();
  const { ask, confirm, settle } = useConfirm();
  const sheetRef = useRef({ shop, fields });
  sheetRef.current = { shop, fields };
  const snapRef = useRef({ name: fields.name, list: 0, safe: 0, keep: 0 });
  const d = useMemo(() => derive(shop, fields), [shop, fields]);
  snapRef.current = {
    name: fields.name,
    list: d.listCents / 100,
    safe: d.safeCents / 100,
    keep: d.quoted.profitCents / 100,
  };
  const breaks = useMemo(() => qtyBreaks(shop, fields), [shop, fields]);
  const versus = useMemo(() => {
    const r = recents.find((x) => x.id === compareId);
    if (!r) return null;
    const next = openQuery(shop, r.query);
    return { name: r.name, card: listingCard(r.name, derive(next.shop, next.fields)) };
  }, [compareId, recents, shop]);
  const profile = profileById(shop.profileId);
  const currency = d.currency;
  const below = d.quoted.profitCents < d.targetCents;

  useEffect(() => saveShop(shop), [shop]);
  useEffect(() => saveListing(fields), [fields]);
  useEffect(() => {
    writeListingHash(shop, fields);
  }, [shop, fields]);
  useEffect(() => {
    if (!compareId) return;
    if (recents.some((r) => r.id === compareId)) return;
    setCompareId(recents.find((r) => r.pinned)?.id ?? "");
  }, [compareId, recents]);
  useEffect(() => {
    const name = fields.name.trim();
    document.title = name ? `KeepFloor — ${name}` : titles("home");
  }, [fields.name]);
  useEffect(() => saveFocus(focus), [focus]);
  useEffect(() => {
    return () => {
      writeListingToCatalog(sheetRef.current.fields);
    };
  }, []);
  useEffect(() => {
    function onRestore() {
      clearFromCatalog();
      setFromCatalog(false);
      setShop(loadShop());
      setFields(loadListing());
      setRecents(loadRecents());
      setUndoStack([]);
      setRedoStack([]);
    }
    window.addEventListener(RESTORE_EVENT, onRestore);
    return () => window.removeEventListener(RESTORE_EVENT, onRestore);
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => setRecents(rememberRecent(shop, fields)), 800);
    return () => window.clearTimeout(t);
  }, [shop, fields]);
  useEffect(() => {
    const flush = () => {
      const { shop: s, fields: f } = sheetRef.current;
      rememberRecent(s, f);
      const snap = snapRef.current;
      rememberSnapshot({
        name: snap.name || "Listing",
        at: Date.now(),
        list: snap.list,
        safe: snap.safe,
        keep: snap.keep,
      });
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => {
      setSnaps(
        rememberSnapshot({
          name: fields.name || "Listing",
          at: Date.now(),
          list: d.listCents / 100,
          safe: d.safeCents / 100,
          keep: d.quoted.profitCents / 100,
        }),
      );
    }, 1600);
    return () => window.clearTimeout(t);
  }, [fields.name, d.listCents, d.safeCents, d.quoted.profitCents]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (document.querySelector(".palette-back")) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        applySafe();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        if (e.shiftKey) redoOnce();
        else undoOnce();
      }
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !typing) {
        e.preventDefault();
        focusListPrice();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [d.adsFloor.possible, d.safeCents, d.listCents, fields, flash, focus, undoStack.length, redoStack.length]);
  useEffect(() => {
    function onCmd(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      if (id === "safe") applySafe();
      if (id === "survive") {
        if (!d.surviveAllPossible) flash("No survive-all floor.");
        else applyList(d.surviveAllCents, "the survive-all floor");
      }
      if (id === "reset") resetSheet();
      if (id === "focus") toggleFocus();
      if (id === "brief") downloadBrief();
      if (id === "qtycsv") downloadQty();
      if (id === "copy-link") void shareLink();
      if (id === "copy-decision") void copyDecision();
      if (id === "copy-versus") void copyVersus();
      if (id === "threshold") applyCross();
      if (id === "undo") undoOnce();
      if (id === "redo") redoOnce();
    }
    window.addEventListener("keepfloor:cmd", onCmd);
    return () => window.removeEventListener("keepfloor:cmd", onCmd);
  });

  function patchShop(next: Partial<ShopPrefs>) {
    setShop((s) => ({ ...s, ...next }));
  }
  function patch(next: Partial<ListingFields>) {
    setFields((f) => ({ ...f, ...next }));
  }
  function rememberUndo(from = fields) {
    setUndoStack((s) => [snapListing(from), ...s].slice(0, 5));
    setRedoStack([]);
  }
  function undoOnce() {
    if (undoStack.length === 0) {
      flash("Nothing to undo.");
      return;
    }
    setUndoStack((s) => {
      const [head, ...rest] = s;
      if (!head) return s;
      setFields((f) => {
        setRedoStack((r) => [snapListing(f), ...r].slice(0, 5));
        return applyUndoSnap(f, head);
      });
      return rest;
    });
    flash("Undid the last list change.");
  }
  function redoOnce() {
    if (redoStack.length === 0) {
      flash("Nothing to redo.");
      return;
    }
    setRedoStack((s) => {
      const [head, ...rest] = s;
      if (!head) return s;
      setFields((f) => {
        setUndoStack((u) => [snapListing(f), ...u].slice(0, 5));
        return applyUndoSnap(f, head);
      });
      return rest;
    });
    flash("Redid the last list change.");
  }
  function toggleFocus() {
    const next = !focus;
    setFocus(next);
    flash(next ? "Focus on — the form is hidden. Press / for list price." : "Form shown.");
  }
  function focusListPrice() {
    if (slashShowsForm(focus)) {
      setFocus(false);
      flash("Form shown.");
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => document.getElementById("item")?.focus());
    });
  }
  function dropCatalogCrumb() {
    clearFromCatalog();
    clearCatalogEdit();
    setFromCatalog(false);
  }

  function returnToCatalog() {
    if (writeListingToCatalog(fields)) flash("Saved back to the catalog.");
    dropCatalogCrumb();
  }
  function applyProfile(id: string) {
    patchShop({ profileId: id, intlBuyer: false });
    patch({ procRate: "", procFixed: "", reg: "", vat: "" });
  }
  function applyPreset(id: string) {
    const pr = PRESETS.find((p) => p.id === id);
    if (!pr) return;
    if (presetIsCurrent(pr, fields)) {
      flash("Already on this sample.");
      return;
    }
    setRecents(rememberRecent(shop, fields));
    dropCatalogCrumb();
    applyProfile(pr.profileId);
    setFields(listingFromPreset(pr));
    setUndoStack([]);
    flash(`Loaded ${pr.label}. Your last listing is in Recents.`);
  }
  function applyList(cents: number, label: string) {
    if (cents < 0) return;
    if (d.listCents === cents) {
      flash(`Already at ${label}.`);
      return;
    }
    rememberUndo();
    patch({ item: (cents / 100).toFixed(2) });
    flash(`List set to ${label}.`);
  }
  function resetSheet() {
    void confirm({
      title: "Reset this worksheet?",
      body: "Shop defaults and the current listing go back to the sample tote. The listing you are on is parked in Recents. The catalog stays.",
      confirmLabel: "Reset",
      danger: true,
    }).then((ok) => {
      if (!ok) return;
      setRecents(rememberRecent(shop, fields));
      dropCatalogCrumb();
      setShop({ ...DEFAULT_SHOP });
      setFields(defaultListing());
      setUndoStack([]);
      setRedoStack([]);
      flash("Worksheet reset. Your last listing is in Recents.");
    });
  }
  function applySafe() {
    if (!d.adsFloor.possible) {
      flash("No ads-safe floor.");
      return;
    }
    if (d.listCents === d.safeCents) {
      flash("Already at the ads-safe floor.");
      return;
    }
    applyList(d.safeCents, "the Offsite Ads–safe floor");
  }
  async function copyVersus() {
    if (!versus) {
      flash("Pick a recent listing to compare.");
      return;
    }
    const ok = await copyText(compareText(listingCard(fields.name, d), versus.card, currency));
    flash(copyNote(ok, "Compare copied."));
  }
  function applyCross() {
    if (!d.freeOver?.cross.possible) {
      flash("No free-over crossing list.");
      return;
    }
    const cents = d.freeOver.cross.listCents;
    if (fields.freeShip && d.listCents === cents) {
      flash("Already on the free-over crossing list.");
      return;
    }
    rememberUndo();
    patch({ freeShip: true, item: (cents / 100).toFixed(2) });
    flash("List set to free-over crossing (free shipping + ads-safe).");
  }
  async function copyDecision() {
    const ok = await copyText(decisionLine(d));
    flash(copyNote(ok, "Decision line copied."));
  }
  function applyReplay() {
    const parsed = parseReplay(replayText);
    if (parsed.error) {
      flash(parsed.error);
      return;
    }
    rememberUndo();
    patch(parsed.fields);
    if (parsed.offsite) patchShop({ offsite: parsed.offsite });
    setReplayHist(rememberReplay(replayText));
    flash("Sale replayed. Check the statement match.");
  }
  function openRecent(r: Recent) {
    if (r.id === recentId(fields)) {
      flash("Already on this listing.");
      return;
    }
    setRecents(rememberRecent(shop, fields));
    dropCatalogCrumb();
    const next = openQuery(shop, r.query);
    setShop(next.shop);
    setFields(next.fields);
    setUndoStack([]);
    const hash = r.query ? `#/?${r.query}` : "#/";
    if (window.location.hash !== hash) window.history.replaceState(null, "", hash);
    flash(`Opened ${r.name}.`);
  }
  async function copyBrief() {
    const ok = await copyText(briefing(d, fields.name));
    flash(copyNote(ok, "Briefing copied."));
  }
  async function copyJson() {
    const ok = await copyText(snapshotJson(fields.name, d));
    flash(copyNote(ok, "JSON snapshot copied."));
  }
  function downloadBrief() {
    downloadFile(`${fileStem(fields.name)}.txt`, briefing(d, fields.name), "text/plain");
    flash("Briefing downloaded.");
  }
  function downloadQty() {
    downloadFile(`${fileStem(fields.name)}-qty.csv`, toQtyCsv(breaks), "text/csv");
    flash("Quantity-price CSV downloaded.");
  }
  async function shareLink() {
    const q = encodeListing(shop, fields);
    const url = `${window.location.origin}${window.location.pathname}#/?${q}`;
    window.history.replaceState(null, "", `#/?${q}`);
    const ok = await copyText(url);
    flash(copyNote(ok, "Link copied. Same listing opens from that URL."));
  }

  const mine = snaps.filter((s) => s.name === (fields.name || "Listing")).slice(0, 8);

  return (
    <div className={`${focus ? "focus-on" : ""}${shop.compact ? " compact" : ""}`}>
      {fromCatalog && (
        <p className="crumb noprint">
          <a href={catalogHref()} onClick={() => returnToCatalog()} title="Saves this listing back to the catalog">
            Catalog
          </a>
          <span aria-hidden="true">/</span>
          <span>{fields.name || "Listing"}</span>
        </p>
      )}
      <h1 className="print-only">
        {listingPrintTitle(
          fields.name,
          formatMoney(d.listCents, currency),
          d.adsFloor.possible ? formatMoney(d.safeCents, currency) : "—",
        )}
      </h1>

      <section className="hero noprint focus-hide">
        <h1>The list price that still pays you after Etsy fees.</h1>
        <p className="lede">
          One listing, the published fee stack, and the lowest charmed price that survives
          Offsite Ads. Math stays on this device.
        </p>
      </section>

      {recents.length > 0 && (
        <div className="recents noprint focus-hide">
          <span className="recents-k">Recent</span>
          {recents.slice(0, 8).map((r) => (
            <button
              key={r.id}
              type="button"
              className={`chip slim${r.pinned ? " on" : ""}${r.id === recentId(fields) ? " now" : ""}`}
              title="Click to open · Shift-click to pin"
              onClick={(e) => {
                if (e.shiftKey) {
                  const next = togglePin(r.id);
                  setRecents(next);
                  const pinned = next.find((x) => x.id === r.id)?.pinned;
                  if (pinned) setCompareId(r.id);
                  flash(pinned ? `Pinned ${r.name}.` : `Unpinned ${r.name}.`);
                  return;
                }
                openRecent(r);
              }}
            >
              {r.pinned ? `★ ${r.name}` : r.name}
            </button>
          ))}
          {lastUnpinned(recents) && (
            <button
              type="button"
              className="linkish"
              onClick={() => {
                const victim = lastUnpinned(recents);
                if (victim) setRecents(removeRecent(victim.id));
              }}
            >
              Remove last
            </button>
          )}
        </div>
      )}

      <div className="chips noprint focus-hide" role="list">
        {PRESETS.map((pr) => (
          <button
            key={pr.id}
            type="button"
            className={`chip${presetIsCurrent(pr, fields) ? " now" : ""}`}
            aria-pressed={presetIsCurrent(pr, fields)}
            onClick={() => applyPreset(pr.id)}
          >
            <span>{pr.label}</span>
            <span className="chip-sub">{pr.blurb}</span>
          </button>
        ))}
      </div>

      <div className="statbar sticky">
        <div className={`stat keep ${below ? "warn" : ""}`}>
          <div className="k">You keep</div>
          <div className="v">{formatMoney(d.quoted.profitCents, currency)}</div>
          <div className="s">
            {d.margin == null ? "—" : `${d.margin.toFixed(0)}% of merchandise`} · target{" "}
            {formatMoney(d.targetCents, currency)}
          </div>
        </div>
        <div className="stat">
          <div className="k">Organic floor</div>
          <div className="v">
            {d.organicFloor.possible ? formatMoney(d.organicFloor.itemPriceCents, currency) : "—"}
          </div>
          <div className="s">No Offsite Ads fee</div>
        </div>
        <div className={`stat ${d.adsFloor.possible && d.safeCents > d.listCents ? "warn" : ""}`}>
          <div className="k">Ads-safe floor</div>
          <div className="v">{d.adsFloor.possible ? formatMoney(d.safeCents, currency) : "—"}</div>
          <div className="s">
            {d.charmTaxCents > 0
              ? `exact ${formatMoney(d.exactSafeCents, currency)} · charm +${formatMoney(d.charmTaxCents, currency)}`
              : `15% attributed, charmed ${shop.charm === "none" ? "exact" : `.${shop.charm}`}`}
          </div>
        </div>
        <div className={`stat ${d.surviveAllPossible && d.surviveAllCents > d.safeCents ? "warn" : ""}`}>
          <div className="k">Survive-all floor</div>
          <div className="v">{d.surviveAllPossible ? formatMoney(d.surviveAllCents, currency) : "—"}</div>
          <div className="s">
            Sale up to {d.maxSalePct == null ? "—" : `${d.maxSalePct}%`} · break-even{" "}
            {d.breakEvenCents == null ? "—" : formatMoney(d.breakEvenCents, currency)}
          </div>
        </div>
      </div>
      <p className={`decision${below ? " warn" : ""}`}>{decisionLine(d)}</p>

      <div className="action-groups noprint">
        <ActionGroup label="Price">
          <button className="btn" type="button" disabled={!d.adsFloor.possible} onClick={applySafe}>
            Use ads-safe floor
          </button>
          <button
            className="btn secondary"
            type="button"
            disabled={!d.surviveAllPossible}
            onClick={() => applyList(d.surviveAllCents, "the survive-all floor")}
          >
            Use survive-all
          </button>
          <button
            className="btn secondary"
            type="button"
            disabled={!d.freeOver?.cross.possible}
            onClick={applyCross}
          >
            Use free-over list
          </button>
        </ActionGroup>
        <ActionGroup label="History">
          <button className="btn secondary" type="button" disabled={undoStack.length === 0} onClick={undoOnce}>
            Undo{undoStack.length > 1 ? ` (${undoStack.length})` : ""}
          </button>
          <button className="btn secondary" type="button" disabled={redoStack.length === 0} onClick={redoOnce}>
            Redo{redoStack.length > 1 ? ` (${redoStack.length})` : ""}
          </button>
          <button className="btn secondary" type="button" onClick={resetSheet}>
            Reset
          </button>
        </ActionGroup>
        <ActionGroup label="Copy">
          <button className="btn secondary" type="button" onClick={() => void copyDecision()}>
            Decision
          </button>
          <button className="btn secondary" type="button" onClick={() => void copyText(fields.item).then((ok) => flash(copyNote(ok, "Price copied.")))}>
            Price
          </button>
          <button className="btn secondary" type="button" onClick={() => void copyBrief()}>
            Briefing
          </button>
          <button className="btn secondary" type="button" onClick={() => void shareLink()}>
            Link
          </button>
          <button className="btn secondary" type="button" onClick={() => void copyJson()}>
            JSON
          </button>
        </ActionGroup>
        <ActionGroup label="View">
          <button className="btn secondary" type="button" onClick={downloadBrief}>
            Download
          </button>
          <button className="btn secondary" type="button" onClick={() => requestPrint()}>
            Print
          </button>
          <button className="btn secondary" type="button" onClick={toggleFocus}>
            {focus ? "Show form" : "Focus"}
          </button>
        </ActionGroup>
      </div>
      {showCoach && (
        <div className="coach noprint focus-hide">
          <p>
            <strong>Three steps.</strong> 1) Bank country. 2) List, shipping, costs, target. 3) Read
            ads-safe and survive-all. Override a rate only if a payment-account line differs.
          </p>
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              dismissCoach();
              setShowCoach(false);
            }}
          >
            Got it
          </button>
        </div>
      )}

      <div className="grid">
        <div className="panel noprint focus-hide">
          <h2>Shop</h2>
          <label htmlFor="profile">Seller bank country</label>
          <select id="profile" value={shop.profileId} onChange={(e) => applyProfile(e.target.value)}>
            {SELLER_PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          {profile.processingRateIntl != null && (
            <Check checked={shop.intlBuyer} onChange={(v) => patchShop({ intlBuyer: v })}>
              Buyer is international (higher processing)
            </Check>
          )}
          <Check checked={shop.fx} onChange={(v) => patchShop({ fx: v })}>
            Listing currency differs from the payment account (2.5% FX)
          </Check>

          <label>Offsite Ads on this order</label>
          <Seg<OffsiteMode>
            label="Offsite Ads on this order"
            value={shop.offsite}
            onChange={(v) => patchShop({ offsite: v })}
            options={[
              { id: "off", label: "Organic" },
              { id: "15", label: "15%" },
              { id: "12", label: "12%" },
            ]}
          />
          <label>Share of orders attributed (expected keep)</label>
          <div className="chips">
            {["0", "15", "25", "50", "100"].map((pct) => (
              <button
                key={pct}
                type="button"
                className={`chip slim${shop.adsMix === pct ? " on" : ""}`}
                onClick={() => patchShop({ adsMix: pct })}
              >
                {pct}%
              </button>
            ))}
          </div>
          <MoneyField
            id="adsmix"
            label="Or type a percent"
            value={shop.adsMix}
            onChange={(v) => patchShop({ adsMix: v })}
            step={1}
            hint="Floors still assume a fully attributed 15% order. This mix only changes expected keep."
          />
          <Check checked={shop.compact} onChange={(v) => patchShop({ compact: v })}>
            Compact density
          </Check>
          <MoneyField
            id="freeover"
            label="Free-shipping program over"
            value={shop.freeOver}
            onChange={(v) => patchShop({ freeOver: v })}
            hint="US shops often use $35. Leave 0 to hide the stay vs cross compare. Floors on the current shipping case do not change."
          />

          <label>Charm rounding</label>
          <Seg<Charm>
            label="Charm rounding"
            value={shop.charm}
            onChange={(v) => patchShop({ charm: v })}
            options={[
              { id: "none", label: "Exact" },
              { id: "99", label: ".99" },
              { id: "95", label: ".95" },
              { id: "00", label: ".00" },
            ]}
          />

          <label>Listing fee ($0.20)</label>
          <Seg<ListingFeeMode>
            label="Listing fee"
            value={shop.listingMode}
            onChange={(v) => patchShop({ listingMode: v })}
            options={[
              { id: "none", label: "Ignore" },
              { id: "sale", label: "This sale" },
              { id: "amortize", label: "Split" },
            ]}
          />
          {shop.listingMode === "amortize" && (
            <MoneyField
              id="amort"
              label="Expected sales for this listing"
              value={shop.amortizeN}
              onChange={(v) => patchShop({ amortizeN: v })}
            />
          )}

          <h2>Listing</h2>
          <label htmlFor="lname">Listing name</label>
          <input id="lname" value={fields.name} onChange={(e) => patch({ name: e.target.value })} />
          <div className="row2">
            <div>
              <label htmlFor="sku">SKU</label>
              <input id="sku" value={fields.sku} onChange={(e) => patch({ sku: e.target.value })} />
            </div>
            <MoneyField
              id="svat"
              label="VAT included in this list %"
              value={fields.salesVat}
              onChange={(v) => patch({ salesVat: v })}
              hint="Remitted VAT is treated as a cost. Etsy still fees the gross. Not tax advice."
            />
          </div>
          <label htmlFor="notes">Note (saved with this listing)</label>
          <input id="notes" value={fields.notes} onChange={(e) => patch({ notes: e.target.value })} />
          <div className="row2">
            <MoneyField id="item" label="List price" value={fields.item} onChange={(v) => patch({ item: v })} />
            <MoneyField id="qty" label="Quantity" value={fields.qty} onChange={(v) => patch({ qty: v })} step={1} />
          </div>
          <div className="row2">
            <MoneyField
              id="prop"
              label="Proposed list (what-if)"
              value={fields.proposed}
              onChange={(v) => patch({ proposed: v })}
              hint="Does not change the current list until you apply it."
            />
            <MoneyField
              id="units"
              label="Expected sales this month"
              value={fields.unitsMonth}
              onChange={(v) => patch({ unitsMonth: v })}
            />
          </div>
          <div className="row2">
            <MoneyField
              id="goal"
              label="Monthly profit goal"
              value={fields.monthlyGoal}
              onChange={(v) => patch({ monthlyGoal: v })}
            />
            <MoneyField
              id="trail"
              label="Trailing 12-month shop sales (USD)"
              value={shop.trailingUsd}
              onChange={(v) => patchShop({ trailingUsd: v })}
              hint="From Etsy shop stats. We apply the published $10k Offsite Ads threshold."
            />
          </div>
          <MoneyField
            id="active"
            label="Active listings in the shop"
            value={shop.activeListings}
            onChange={(v) => patchShop({ activeListings: v })}
            step={1}
            hint="Listing fee × this count ÷ 4 months. The monthly renewals load if every listing renews."
          />
          <div className="row2">
            <MoneyField
              id="reserve"
              label="Payment reserve %"
              value={shop.reservePct}
              onChange={(v) => patchShop({ reservePct: v })}
              step={1}
              hint="Cash held by Etsy, not a fee. Floors stay the same."
            />
            <MoneyField
              id="defsale"
              label="Shop default sale %"
              value={shop.defaultSale}
              onChange={(v) => patchShop({ defaultSale: v })}
              step={1}
              hint="Catalog opens on this sale. Apply writes it onto this listing."
            />
          </div>
          {Number(shop.defaultSale) > 0 && (
            <button
              className="linkish"
              type="button"
              onClick={() => patch({ salePercent: shop.defaultSale })}
            >
              Apply shop sale % to this listing
            </button>
          )}
          {d.reservePct > 0 && (
            <p className="note">
              Cash this payout after a {d.reservePct}% reserve: {formatMoney(d.cashCents, currency)} on
              the selected case, {formatMoney(d.mixCashCents, currency)} at the ads mix.
            </p>
          )}
          {d.adsPolicy && (
            <p className="note">
              {d.adsPolicy.text}{" "}
              <button
                type="button"
                className="linkish"
                onClick={() => patchShop({ offsite: d.adsPolicy!.suggested })}
              >
                Use {d.adsPolicy.suggested}% on this order
              </button>
            </p>
          )}
          {Number(fields.salePercent) > 0 && (
            <p className="note">
              Buyer is charged {formatMoney(d.chargedCents, currency)} after the {fields.salePercent}% sale.
            </p>
          )}
          <div className="row2">
            <MoneyField
              id="sale"
              label="Shop sale %"
              value={fields.salePercent}
              onChange={(v) => patch({ salePercent: v })}
            />
            <MoneyField
              id="coupon"
              label="Coupon amount"
              value={fields.coupon}
              onChange={(v) => patch({ coupon: v })}
            />
          </div>
          <MoneyField
            id="perso"
            label="Personalization (added to the displayed price)"
            value={fields.perso}
            onChange={(v) => patch({ perso: v })}
          />
          <div className="row2">
            <MoneyField
              id="ship"
              label="Shipping charged"
              value={fields.shipCharge}
              onChange={(v) => patch({ shipCharge: v })}
            />
            <MoneyField id="gift" label="Gift wrap" value={fields.gift} onChange={(v) => patch({ gift: v })} />
          </div>
          <Check checked={fields.freeShip} onChange={(v) => patch({ freeShip: v })}>
            Free shipping — buyer pays $0, you still pay postage
          </Check>
          <div className="chips">
            {shop.shipProfiles.map((p) => {
              const free = p.charge === "0" && p.youPay !== "0";
              const on = fields.shipCharge === p.charge && fields.shipPay === p.youPay && fields.freeShip === free;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`chip slim${on ? " on" : ""}`}
                  onClick={() => patch({ shipCharge: p.charge, shipPay: p.youPay, freeShip: free })}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <MoneyField
            id="tax"
            label="Buyer sales tax collected by Etsy (not kept)"
            value={fields.tax}
            onChange={(v) => patch({ tax: v })}
          />

          <h3>Your costs</h3>
          <div className="row2">
            <MoneyField id="cogs" label="Materials / COGS (each)" value={fields.cogs} onChange={(v) => patch({ cogs: v })} />
            <MoneyField
              id="shippay"
              label="Shipping you pay"
              value={fields.shipPay}
              onChange={(v) => patch({ shipPay: v })}
            />
          </div>
          <div className="row2">
            <MoneyField id="pack" label="Packaging (each)" value={fields.pack} onChange={(v) => patch({ pack: v })} />
            <MoneyField id="labor" label="Labor $ (each)" value={fields.labor} onChange={(v) => patch({ labor: v })} />
          </div>
          <div className="chips">
            {shop.packProfiles.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`chip slim${fields.pack === p.pack ? " on" : ""}`}
                onClick={() => patch({ pack: p.pack })}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="row2">
            <MoneyField id="hours" label="Hours of work" value={fields.hours} onChange={(v) => patch({ hours: v })} />
            <MoneyField id="hourly" label="Hourly rate" value={shop.hourly} onChange={(v) => patchShop({ hourly: v })} />
          </div>
          {Number(fields.hours) > 0 && parseMoney(shop.hourly) > 0 && (
            <p className="note">
              Labor used: {formatMoney(dollarsToCents(laborEach(shop, fields)), currency)} each (
              {fields.hours} h × {shop.hourly}).
            </p>
          )}
          <MoneyField
            id="target"
            label="Profit you want to keep"
            value={fields.target}
            onChange={(v) => patch({ target: v })}
          />

          <details>
            <summary>Also in this order</summary>
            <Check checked={fields.extraOn} onChange={(v) => patch({ extraOn: v })}>
              Add a second line (shares one processing flat and one ads cap)
            </Check>
            {fields.extraOn && (
              <div className="row3">
                <MoneyField
                  id="ep"
                  label="Add-on price"
                  value={fields.extraPrice}
                  onChange={(v) => patch({ extraPrice: v })}
                />
                <MoneyField
                  id="eq"
                  label="Add-on qty"
                  value={fields.extraQty}
                  onChange={(v) => patch({ extraQty: v })}
                />
                <MoneyField
                  id="ec"
                  label="Add-on cost"
                  value={fields.extraCogs}
                  onChange={(v) => patch({ extraCogs: v })}
                />
              </div>
            )}
          </details>

          <details>
            <summary>Override published rates</summary>
            <p className="note">
              Defaults follow Etsy’s published policies as of 4 Sep 2026. If a payment-account
              line differs, type that number.
            </p>
            <div className="row2">
              <MoneyField id="txn" label="Transaction %" value={fields.txn} onChange={(v) => patch({ txn: v })} />
              <MoneyField
                id="listing"
                label="Listing fee"
                value={shop.listingFee}
                onChange={(v) => patchShop({ listingFee: v })}
              />
            </div>
            <div className="row2">
              <div>
                <label htmlFor="pr">Processing %</label>
                <input
                  id="pr"
                  placeholder={`${profile.processingRate * 100}`}
                  value={fields.procRate}
                  onChange={(e) => patch({ procRate: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="pf">Processing flat</label>
                <input
                  id="pf"
                  placeholder={`${profile.processingFixed}`}
                  value={fields.procFixed}
                  onChange={(e) => patch({ procFixed: e.target.value })}
                />
              </div>
            </div>
            <div className="row2">
              <div>
                <label htmlFor="reg">Regulatory %</label>
                <input
                  id="reg"
                  placeholder={`${profile.regulatoryRate * 100}`}
                  value={fields.reg}
                  onChange={(e) => patch({ reg: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="vatf">Tax on Etsy fees %</label>
                <input
                  id="vatf"
                  placeholder={`${profile.vatOnFeesRate * 100}`}
                  value={fields.vat}
                  onChange={(e) => patch({ vat: e.target.value })}
                />
              </div>
            </div>
            <div className="row2">
              <MoneyField id="cap" label="Offsite Ads cap" value={shop.cap} onChange={(v) => patchShop({ cap: v })} />
              <MoneyField
                id="dep"
                label="Deposit fee"
                value={fields.deposit}
                onChange={(v) => patch({ deposit: v })}
              />
            </div>
          </details>
        </div>

        <div className="panel">
          <h2>What the numbers say</h2>
          <ul className="insights">
            {d.insightList.map((i) => (
              <li key={i.text} className={`insight ${i.tone}`}>
                {i.text}
              </li>
            ))}
          </ul>

          <div className="reprice">
            <p>
              At {formatMoney(d.listCents, currency)} you keep{" "}
              <strong>{formatMoney(d.quoted.profitCents, currency)}</strong> on the selected ads
              case.
            </p>
            <p>
              The Offsite Ads–safe list is{" "}
              <strong>{d.adsFloor.possible ? formatMoney(d.safeCents, currency) : "not possible"}</strong>
              {d.adsFloor.possible && d.safeCents !== d.listCents
                ? ` — ${formatMoney(d.safeCents - d.listCents, currency)} from here.`
                : "."}
              {d.charmTaxCents > 0
                ? ` Charm added ${formatMoney(d.charmTaxCents, currency)} above the exact floor.`
                : ""}
            </p>
          </div>

          <h3>Compare lists</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th className="num">List</th>
                  <th className="num">Keep</th>
                  <th className="noprint"></th>
                </tr>
              </thead>
              <tbody>
                <tr className="on">
                  <td>Now</td>
                  <td className="num">{formatMoney(d.listCents, currency)}</td>
                  <td className="num">{formatMoney(d.quoted.profitCents, currency)}</td>
                  <td className="noprint"></td>
                </tr>
                {d.proposedCents != null && d.atProposed && (
                  <tr>
                    <td>Proposed</td>
                    <td className="num">{formatMoney(d.proposedCents, currency)}</td>
                    <td className="num">{formatMoney(d.atProposed.profitCents, currency)}</td>
                    <td className="noprint">
                      <button className="linkish" type="button" onClick={() => applyList(d.proposedCents!, "the proposed list")}>
                        Use
                      </button>
                    </td>
                  </tr>
                )}
                <tr>
                  <td>Ads-safe</td>
                  <td className="num">{d.adsFloor.possible ? formatMoney(d.safeCents, currency) : "—"}</td>
                  <td className="num">{formatMoney(d.atSafe.profitCents, currency)}</td>
                  <td className="noprint">
                    <button className="linkish" type="button" disabled={!d.adsFloor.possible} onClick={applySafe}>
                      Use
                    </button>
                  </td>
                </tr>
                {d.freeOver?.on && (
                  <tr className={d.freeOver.pick === "cross" ? "on" : ""}>
                    <td>Free-over {formatMoney(d.freeOver.thresholdCents, currency)}</td>
                    <td className="num">
                      {d.freeOver.cross.possible ? formatMoney(d.freeOver.cross.listCents, currency) : "—"}
                    </td>
                    <td className="num">{d.freeOver.cross.possible ? formatMoney(d.freeOver.cross.keepCents, currency) : "—"}</td>
                    <td className="noprint">
                      <button
                        className="linkish"
                        type="button"
                        disabled={!d.freeOver.cross.possible}
                        onClick={applyCross}
                      >
                        Use
                      </button>
                    </td>
                  </tr>
                )}
                <tr>
                  <td>Survive-all</td>
                  <td className="num">{d.surviveAllPossible ? formatMoney(d.surviveAllCents, currency) : "—"}</td>
                  <td className="num">—</td>
                  <td className="noprint">
                    <button
                      className="linkish"
                      type="button"
                      disabled={!d.surviveAllPossible}
                      onClick={() => applyList(d.surviveAllCents, "the survive-all floor")}
                    >
                      Use
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {recents.length > 0 && (
            <div className="noprint">
              <label htmlFor="versus">Compare with a recent listing</label>
              <select id="versus" value={compareId} onChange={(e) => setCompareId(e.target.value)}>
                <option value="">—</option>
                {recents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.pinned ? "★ " : ""}
                    {r.name} · {r.item}
                  </option>
                ))}
              </select>
              {compareId && (
                <div className="actions" style={{ marginTop: "0.4rem" }}>
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() => setRecents(togglePin(compareId))}
                  >
                    {recents.find((r) => r.id === compareId)?.pinned ? "Unpin" : "Pin"} this recent
                  </button>
                  <button className="btn secondary" type="button" disabled={!versus} onClick={() => void copyVersus()}>
                    Copy compare
                  </button>
                </div>
              )}
              {versus && (
                <div className="table-wrap" style={{ marginTop: "0.5rem" }}>
                  <table className="table">
                    <caption className="sr">
                      Compare this listing with {versus.name}: list, keep, expected keep, and ads-safe
                    </caption>
                    <thead>
                      <tr>
                        <th></th>
                        <th className="num">This listing</th>
                        <th className="num">{versus.name}</th>
                        <th className="num">Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const here = listingCard(fields.name, d);
                        const delta = compareCards(here, versus.card);
                        return (
                          <>
                            <tr>
                              <td>List</td>
                              <td className="num">{formatMoney(here.listCents, currency)}</td>
                              <td className="num">{formatMoney(versus.card.listCents, currency)}</td>
                              <td className="num">{formatMoney(here.listCents - versus.card.listCents, currency)}</td>
                            </tr>
                            <tr>
                              <td>Keep</td>
                              <td className="num">{formatMoney(here.keepCents, currency)}</td>
                              <td className="num">{formatMoney(versus.card.keepCents, currency)}</td>
                              <td className={`num ${delta.keepDelta < 0 ? "neg" : ""}`}>{formatMoney(delta.keepDelta, currency)}</td>
                            </tr>
                            <tr>
                              <td>Expected keep</td>
                              <td className="num">{formatMoney(here.mixKeepCents, currency)}</td>
                              <td className="num">{formatMoney(versus.card.mixKeepCents, currency)}</td>
                              <td className={`num ${delta.mixDelta < 0 ? "neg" : ""}`}>{formatMoney(delta.mixDelta, currency)}</td>
                            </tr>
                            <tr>
                              <td>Ads-safe</td>
                              <td className="num">{here.safePossible ? formatMoney(here.safeCents, currency) : "—"}</td>
                              <td className="num">{versus.card.safePossible ? formatMoney(versus.card.safeCents, currency) : "—"}</td>
                              <td className="num">{formatMoney(delta.safeDelta, currency)}</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {(d.volume.units > 0 || d.volume.listingDragCents > 0) && (
            <div className="callout">
              {d.volume.units > 0 && (
              <p>
                {d.volume.units} sales this month: keep {formatMoney(d.volume.keepNowCents, currency)} at
                this list, {formatMoney(d.volume.keepMixCents, currency)} if {d.mixPct}% are attributed,{" "}
                {formatMoney(d.volume.keepSafeCents, currency)} at the ads-safe list
                {d.volume.liftCents !== 0 ? ` (${formatMoney(d.volume.liftCents, currency)} lift)` : ""}.
              </p>
              )}
              {d.volume.unitsForGoal != null && (
                <p>
                  To hit {formatMoney(dollarsToCents(Number(fields.monthlyGoal) || 0), currency)} a
                  month: {d.volume.unitsForGoal} sales here
                  {d.volume.unitsForGoalSafe != null ? `, or ${d.volume.unitsForGoalSafe} at the ads-safe list` : ""}.
                </p>
              )}
              {d.volume.listingDragCents > 0 && (
                <p>
                  {shop.activeListings} active listings renew at about{" "}
                  {formatMoney(d.volume.listingDragCents, currency)} / month in listing fees ($0.20 every
                  four months, allocated evenly).
                </p>
              )}
            </div>
          )}

          {mine.length > 0 && (
            <div className="recents noprint">
              <span className="recents-k">Restore list</span>
              {mine.map((s, i) => (
                <button
                  key={`${s.at}-${i}`}
                  type="button"
                  className="chip slim"
                  onClick={() => applyList(Math.round(s.list * 100), s.list.toFixed(2))}
                >
                  {s.list.toFixed(2)}
                </button>
              ))}
            </div>
          )}

          <h3>Quantity breaks</h3>
          <p className="note">
            Ads-safe list per unit if this many sell in one order. Target is per order.{" "}
            <button type="button" className="linkish" onClick={downloadQty}>
              Quantity-price CSV
            </button>
          </p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Qty</th>
                  <th className="num">Ads-safe list</th>
                  <th className="num">Keep at that floor</th>
                </tr>
              </thead>
              <tbody>
                {breaks.map((b) => (
                  <tr key={b.qty} className={String(b.qty) === fields.qty ? "on" : ""}>
                    <td>{b.qty}</td>
                    <td className="num">
                      {b.possible ? (
                        <button
                          type="button"
                          className="linkish"
                          onClick={() => {
                            if (String(b.qty) === fields.qty && d.listCents === b.safeCents) {
                              flash(`Already at qty ${b.qty} ads-safe.`);
                              return;
                            }
                            rememberUndo();
                            patch({ qty: String(b.qty), item: (b.safeCents / 100).toFixed(2) });
                            flash(`Qty ${b.qty} at the ads-safe list.`);
                          }}
                        >
                          {formatMoney(b.safeCents, currency)}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="num">{formatMoney(b.keepCents, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Price ladder</h3>
          <p className="note">Charm prices at or above the ads-safe floor. Click a rung to use it.</p>
          <div className="ladder">
            {d.ladder.map((r) => (
              <button
                key={r.listCents}
                type="button"
                className={`ladder-rung ${r.mark}`}
                onClick={() => applyList(r.listCents, formatMoney(r.listCents, currency))}
              >
                <span className="v">{formatMoney(r.listCents, currency)}</span>
                <span className="k">keep {formatMoney(r.keepCents, currency)}</span>
              </button>
            ))}
          </div>

          <h3>Scenario matrix</h3>
          <p className="note noprint">The highlighted row is the ads case you selected. Click a floor to use it.</p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th className="num">Profit now</th>
                  <th className="num">List floor</th>
                </tr>
              </thead>
              <tbody>
                {d.scenarios.map((s) => (
                  <tr key={s.id} className={activeScenario(shop.offsite, fields.freeShip) === s.id ? "on" : ""}>
                    <td>{s.label}</td>
                    <td className={`num ${s.atPrice.profitCents < d.targetCents ? "neg" : ""}`}>
                      {formatMoney(s.atPrice.profitCents, currency)}
                    </td>
                    <td className="num">
                      {s.floor.possible ? (
                        <button
                          type="button"
                          className="linkish"
                          onClick={() => applyList(s.floor.itemPriceCents, `the ${s.label} floor`)}
                        >
                          {formatMoney(s.floor.itemPriceCents, currency)}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>If the list moves $1</h3>
          <div className="sens">
            {d.sensitivity.map((s) => (
              <div key={s.id} className="sens-cell">
                <div className="k">{s.label}</div>
                <div className="v">{formatMoney(s.profitCents, currency)}</div>
              </div>
            ))}
          </div>

          <h3>Statement line</h3>
          <label htmlFor="replay">Replay a sale (one field per line)</label>
          <textarea
            id="replay"
            rows={5}
            value={replayText}
            onChange={(e) => setReplayText(e.target.value)}
            placeholder={"item 32.00\nship 5.50\ntax 2.40\nfees 5.68\nads 15"}
          />
          {replayHist.length > 0 && (
            <div className="recents">
              <span className="recents-k">Recent pastes</span>
              {replayHist.map((block) => (
                <button
                  key={block}
                  type="button"
                  className="chip slim"
                  onClick={() => setReplayText(block)}
                >
                  {block.split("\n")[0].slice(0, 28)}
                </button>
              ))}
            </div>
          )}
          <div className="actions" style={{ marginTop: "0.5rem" }}>
            <button className="btn secondary" type="button" onClick={applyReplay}>
              Replay this sale
            </button>
          </div>
          <MoneyField
            id="stmt"
            label="Etsy-side fees on this order (from your payment account)"
            value={fields.statementFees}
            onChange={(v) => patch({ statementFees: v })}
          />
          <div className="row2">
            <MoneyField id="sl" label="Statement listing fee" value={fields.stmtListing} onChange={(v) => patch({ stmtListing: v })} />
            <MoneyField id="st" label="Statement transaction" value={fields.stmtTxn} onChange={(v) => patch({ stmtTxn: v })} />
          </div>
          <div className="row2">
            <MoneyField id="sp" label="Statement processing" value={fields.stmtProc} onChange={(v) => patch({ stmtProc: v })} />
            <MoneyField id="so" label="Statement Offsite Ads" value={fields.stmtOffsite} onChange={(v) => patch({ stmtOffsite: v })} />
          </div>
          {d.lineMatch.length > 0 && (
            <ul className="insights">
              {d.lineMatch.map((m) => (
                <li key={m.id} className={`insight ${m.status === "off" ? "warn" : "ok"}`}>
                  {m.label}: worksheet {formatMoney(m.oursCents, currency)} vs statement{" "}
                  {formatMoney(m.theirsCents, currency)} — {m.status}
                  {m.status !== "match" ? ` (${formatMoney(m.deltaCents, currency)})` : ""}
                </li>
              ))}
            </ul>
          )}
          {d.reconcile && (
            <p className={`note ${d.reconcile.status === "off" ? "err" : ""}`}>
              Worksheet fees {formatMoney(d.quoted.totalFeesCents, currency)} · statement{" "}
              {formatMoney(dollarsToCents(Number(fields.statementFees) || 0), currency)} ·{" "}
              {d.reconcile.status === "match"
                ? "match"
                : d.reconcile.status === "close"
                  ? `close (${formatMoney(d.reconcile.deltaCents, currency)})`
                  : `off by ${formatMoney(d.reconcile.deltaCents, currency)} — override a rate if a line differs`}
            </p>
          )}

          <h3>Fee stack</h3>
          <FeeStack lines={d.quoted.lines} merch={d.quoted.merchandiseCents} currency={currency} />

          <table className="table">
            <thead>
              <tr>
                <th>Line</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Merchandise (after sale, coupon, personalization, add-on)</td>
                <td className="num">{formatMoney(d.quoted.merchandiseCents, currency)}</td>
              </tr>
              {d.quoted.lines.map((line) => (
                <tr key={line.id} className={line.cents === 0 ? "dim" : ""}>
                  <td>
                    {line.label}
                    <div className="note">{line.detail}</div>
                  </td>
                  <td className="num">{formatMoney(line.cents, currency)}</td>
                </tr>
              ))}
              {d.quoted.salesVatRemitCents > 0 && (
                <tr>
                  <td>VAT you remit (included in the list)</td>
                  <td className="num">{formatMoney(d.quoted.salesVatRemitCents, currency)}</td>
                </tr>
              )}
              {d.quoted.vatOnFeesCents > 0 && (
                <tr>
                  <td>Tax on Etsy fees</td>
                  <td className="num">{formatMoney(d.quoted.vatOnFeesCents, currency)}</td>
                </tr>
              )}
              <tr>
                <td>Total Etsy-side fees</td>
                <td className="num">{formatMoney(d.quoted.totalFeesCents, currency)}</td>
              </tr>
              <tr>
                <td>Payout before your costs</td>
                <td className="num">{formatMoney(d.quoted.sellerNetCents, currency)}</td>
              </tr>
              <tr>
                <td>Your costs</td>
                <td className="num">{formatMoney(d.quoted.costCents, currency)}</td>
              </tr>
              <tr>
                <td>Profit</td>
                <td className="num">{formatMoney(d.quoted.profitCents, currency)}</td>
              </tr>
            </tbody>
          </table>

          <p className="note noprint">
            One listing is free. Catalog pricing, CSV import, and a printable sheet are a $19
            one-time unlock.
          </p>
          <div className="actions noprint">
            {catalogOpen ? (
              <a className="btn" href={catalogHref()}>
                Open catalog
              </a>
            ) : (
              <a className="btn" href={href("pay")}>
                Unlock catalog — $19
              </a>
            )}
            <a className="btn secondary" href={href("sources")}>
              Fee sources
            </a>
          </div>
        </div>
      </div>

      <div className="dock noprint">
        <span>
          Ads-safe {d.adsFloor.possible ? formatMoney(d.safeCents, currency) : "—"}
        </span>
        <button className="btn" type="button" disabled={!d.adsFloor.possible} onClick={applySafe}>
          Use ads-safe floor
        </button>
      </div>
      <Confirm ask={ask} onSettle={settle} />
    </div>
  );
}

function activeScenario(offsite: OffsiteMode, freeShip: boolean): ScenarioId {
  if (freeShip) return offsite === "off" ? "freeShip" : "freeAds";
  if (offsite === "off") return "organic";
  if (offsite === "15") return "ads15";
  return "ads12";
}
