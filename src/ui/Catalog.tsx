import { useEffect, useMemo, useRef, useState } from "react";
import {
  actionFor,
  catalogRollup,
  dedupeBySku,
  emptyRow,
  addRowRevealsPass,
  catalogRowMatches,
  catalogTextChanged,
  catalogQty,
  applyRowToListing,
  fillBlankRows,
  fillSelectedRows,
  deletePickedNeedsConfirm,
  applyFloorsNote,
  exportNeedRows,
  selectProblemNote,
  floorsToApply,
  mergeRows,
  rowsAt,
  priceCatalog,
  saleBreakIndexes,
  saleStress,
  shopHealth,
  type PricedRow,
} from "../engine/catalog";
import { catalogBriefing, catalogPrintTitle } from "../engine/copy";
import { buildApplyReceipt, receiptCsv, receiptText, type ApplyReceipt } from "../engine/receipt";
import { clampMix } from "../engine/mix";
import {
  catalogTemplate,
  clipboardLooksLikeCatalog,
  parseAnyCsv,
  toCatalogCsv,
  toEtsyPriceCsv,
  toRepriceCsv,
  type CatalogRow,
  type CsvKind,
} from "../engine/csv";
import { centsToDollars, formatMoney, parseMoney } from "../engine/money";
import { SELLER_PROFILES, profileById } from "../engine/profiles";
import { catalogIsProblem, riskLabel } from "../engine/risk";
import type { Charm, Risk } from "../engine/types";
import { encodeListing } from "../engine/worksheet";
import { loadApplyReceipt, saveApplyReceipt } from "../state/apply-receipt";
import { loadRows, saveRows } from "../state/catalog-rows";
import { catalogDropHint, catalogHash, catalogPassAfterRestore, importSheetOpen, isFileDrag, loadCatalogUi, parseCatalogView, saveCatalogUi, toggleCatalogFilter, type CatalogFilter, type CatalogSort } from "../state/catalog-ui";
import { listingHref } from "../state/listing-href";
import { clearCatalogEdit, markCatalogEdit } from "../state/catalog-edit";
import { RESTORE_EVENT } from "../state/sheet";
import { markFromCatalog } from "../state/nav";
import { loadListing } from "../state/listing";
import { parkIfDifferent } from "../state/recents";
import { loadShop, saveShop, type ShopPrefs } from "../state/shop";
import { parseThreshold } from "../engine/threshold";
import { catalogDeleteTarget, isCatalogDeleteKey, isCatalogPasteKey } from "../engine/keys";
import { replaceNeedsConfirm, sampleAskDanger, sampleNeedsConfirm } from "../engine/sample-ask";
import { Confirm, useConfirm } from "./Confirm";
import { ActionGroup, Check, MoneyField, Seg } from "./controls";
import { useFlash } from "./flash";
import { copyNote, copyText } from "./copy";
import { downloadFile } from "./download";
import { requestPrint } from "./print-sheet";
import { hashQuery, href } from "./route";

type ImportMode = "replace" | "append" | "merge";
type CatalogSnap = { rows: CatalogRow[]; receipt: ApplyReceipt | null };

const RANK: Record<Risk, number> = { impossible: 0, "ads-loss": 1, below: 2, safe: 3 };

export function Catalog({ unlocked }: { unlocked: boolean }) {
  const [shop, setShop] = useState<ShopPrefs>(loadShop);
  const [rows, setRows] = useState<CatalogRow[]>(loadRows);
  const [undoStack, setUndoStack] = useState<CatalogSnap[]>([]);
  const [redoStack, setRedoStack] = useState<CatalogSnap[]>([]);
  const [receipt, setReceipt] = useState<ApplyReceipt | null>(loadApplyReceipt);
  const [salePercent, setSalePercent] = useState(() => {
    const fromHash = parseCatalogView(hashQuery()).sale;
    return fromHash ?? (loadShop().defaultSale || "0");
  });
  const [filter, setFilter] = useState<CatalogFilter>(() => {
    return parseCatalogView(hashQuery()).filter ?? loadCatalogUi().filter;
  });
  const [sortBy, setSortBy] = useState<CatalogSort>(() => {
    return parseCatalogView(hashQuery()).sortBy ?? loadCatalogUi().sortBy;
  });
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [query, setQuery] = useState(() => parseCatalogView(hashQuery()).query ?? loadCatalogUi().query);
  const [text, setText] = useState(catalogTemplate);
  const [kind, setKind] = useState<CsvKind>("keepfloor");
  const [importMode, setImportMode] = useState<ImportMode>("replace");
  const [shopOpen, setShopOpen] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [pendingNameFocus, setPendingNameFocus] = useState<number | null>(null);
  const { flash } = useFlash();
  const { ask, confirm, settle } = useConfirm();
  const cursorRow = useRef<HTMLTableRowElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const currency = profileById(shop.profileId).currency;

  useEffect(() => {
    clearCatalogEdit();
  }, []);
  useEffect(() => {
    function onRestore() {
      const next = loadShop();
      const pass = catalogPassAfterRestore();
      setShop(next);
      setSalePercent(next.defaultSale || "0");
      setRows(loadRows());
      setFilter(pass.filter);
      setQuery(pass.query);
      setCursor(0);
      setPicked(new Set());
      setReceipt(null);
      setUndoStack([]);
      setRedoStack([]);
    }
    window.addEventListener(RESTORE_EVENT, onRestore);
    return () => window.removeEventListener(RESTORE_EVENT, onRestore);
  }, []);
  useEffect(() => saveShop(shop), [shop]);
  useEffect(() => {
    setShop((s) => (s.defaultSale === salePercent ? s : { ...s, defaultSale: salePercent }));
  }, [salePercent]);
  useEffect(() => saveRows(rows), [rows]);
  useEffect(() => saveApplyReceipt(receipt), [receipt]);
  useEffect(() => saveCatalogUi({ filter, sortBy, query }), [filter, sortBy, query]);
  useEffect(() => {
    if (!unlocked) return;
    const next = catalogHash({ filter, sortBy, query, sale: salePercent });
    if (window.location.hash !== next) window.history.replaceState(null, "", next);
  }, [filter, sortBy, query, salePercent, unlocked]);
  useEffect(() => {
    if (!unlocked) return;
    const bits = ["KeepFloor — catalog"];
    if (filter !== "all") bits.push(filter);
    if (query.trim()) bits.push(query.trim());
    if ((Number(salePercent) || 0) > 0) bits.push(`${salePercent}% sale`);
    document.title = bits.join(" · ");
  }, [filter, query, salePercent, unlocked]);
  useEffect(() => {
    function onCmd(e: Event) {
      if (!unlocked) return;
      const id = (e as CustomEvent<string>).detail;
      if (id === "floors") applyFloors("all");
      if (id === "brief-catalog") downloadCatalogBrief();
      if (id === "show-all") clearPass();
      if (id === "dedupe") dedupeSkus();
      if (id === "sample") void restoreSample();
      if (id === "add-row") addRow();
      if (id === "fill-blanks") fillBlanks();
      if (id === "fill-selected") fillSelected();
      if (id === "select-visible") selectVisible();
      if (id === "select-problems") selectProblems();
      if (id === "invert-visible") invertVisible();
      if (id === "export-selected") exportSelected();
      if (id === "export-reprice") exportReprice();
      if (id === "export-catalog") exportCatalogCsv();
      if (id === "export-etsy") exportEtsyPrice();
      if (id === "clear-catalog") void clearCatalog();
      if (id === "delete-selected") void deleteSelected();
      if (id === "undo") undoCatalog();
      if (id === "redo") redoCatalog();
      if (id === "copy-receipt") void copyReceipt();
      if (id === "copy-view") void copyView();
      if (id === "import-file") pickCatalogFile();
      if (id === "paste-catalog") void pasteCatalog();
    }
    window.addEventListener("keepfloor:cmd", onCmd);
    return () => window.removeEventListener("keepfloor:cmd", onCmd);
  });

  const priced = useMemo(() => priceCatalog(rows, shop, salePercent), [rows, shop, salePercent]);
  const saleOn = (Number(salePercent) || 0) > 0;
  const atZero = useMemo(
    () => (saleOn ? priceCatalog(rows, shop, "0") : priced),
    [rows, shop, saleOn, priced],
  );
  const breakIndexes = useMemo(
    () => (saleOn ? new Set(saleBreakIndexes(atZero, priced)) : new Set<number>()),
    [saleOn, atZero, priced],
  );
  const threshold = parseThreshold(shop.freeOver);
  const rollup = useMemo(() => catalogRollup(priced), [priced]);
  const health = useMemo(() => shopHealth(priced), [priced]);
  const stress = useMemo(() => saleStress(rows, shop), [rows, shop]);

  const counts = useMemo(() => {
    const c = { safe: 0, below: 0, "ads-loss": 0, impossible: 0, blank: 0 };
    for (const p of priced) {
      c[p.risk] += 1;
      if (p.blankCosts) c.blank += 1;
    }
    return c;
  }, [priced]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return priced
      .filter((p) => {
        if (filter === "problems" && !catalogIsProblem(p.risk, p.blankCosts)) return false;
        if (filter === "safe" && p.risk !== "safe") return false;
        if (filter === "sale") {
          const ix = rows.indexOf(p.row);
          if (!saleOn || ix < 0 || !breakIndexes.has(ix)) return false;
        }
        if (!q) return true;
        return catalogRowMatches(p.row, q);
      })
      .slice()
      .sort((a, b) => {
        if (sortBy === "gap") return b.gapCents - a.gapCents;
        if (sortBy === "lift") return b.liftCents - a.liftCents;
        if (sortBy === "name") return a.row.name.localeCompare(b.row.name);
        return RANK[a.risk] - RANK[b.risk] || a.row.name.localeCompare(b.row.name);
      });
  }, [priced, filter, query, sortBy, rows, saleOn, breakIndexes]);

  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(0, shown.length - 1)));
  }, [shown.length]);
  useEffect(() => {
    cursorRow.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [cursor, shown.length]);
  useEffect(() => {
    if (pendingNameFocus == null) return;
    const row = rows[pendingNameFocus];
    if (!row) return;
    const i = shown.findIndex((p) => p.row === row);
    if (i < 0) return;
    setCursor(i);
    const ix = pendingNameFocus;
    setPendingNameFocus(null);
    requestAnimationFrame(() => {
      const el = document.getElementById(`cat-name-${ix}`);
      el?.focus();
      if (el instanceof HTMLInputElement) el.select();
    });
  }, [pendingNameFocus, rows, shown]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!unlocked) return;
      if (document.querySelector(".palette-back")) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (isCatalogPasteKey(e)) {
        e.preventDefault();
        void pasteCatalog();
        return;
      }
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(shown.length - 1, c + 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === "a") {
        e.preventDefault();
        selectVisible();
      } else if (e.key === "i") {
        e.preventDefault();
        invertVisible();
      } else if (e.key === "x") {
        const p = shown[cursor];
        if (!p) return;
        const ix = rows.indexOf(p.row);
        if (ix < 0) return;
        setPicked((cur) => {
          const next = new Set(cur);
          if (next.has(ix)) next.delete(ix);
          else next.add(ix);
          return next;
        });
      } else if (e.key === "Enter") {
        const p = shown[cursor];
        if (p) {
          e.preventDefault();
          openRow(p);
        }
      } else if (e.key === "d" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const p = shown[cursor];
        if (p) {
          e.preventDefault();
          duplicateRow(p.row);
        }
      } else if (isCatalogDeleteKey(e.key)) {
        e.preventDefault();
        const target = catalogDeleteTarget(picked.size, Boolean(shown[cursor]));
        if (target === "selected") void deleteSelected();
        else if (target === "cursor") {
          const p = shown[cursor];
          if (p) void deleteRow(p.row);
        }
      } else if (e.key === "Escape") {
        if (query || filter !== "all") {
          e.preventDefault();
          clearPass();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redoCatalog();
        else undoCatalog();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function rememberCatalog() {
    setRedoStack([]);
    setUndoStack((s) => [{ rows, receipt }, ...s].slice(0, 5));
  }

  function undoCatalog() {
    const prev = undoStack[0];
    if (!prev) {
      flash("Nothing to undo.");
      return;
    }
    setUndoStack((s) => s.slice(1));
    setRedoStack((s) => [{ rows, receipt }, ...s].slice(0, 5));
    setRows(prev.rows);
    setReceipt(prev.receipt);
    flash("Catalog undone.");
  }

  function redoCatalog() {
    const next = redoStack[0];
    if (!next) {
      flash("Nothing to redo.");
      return;
    }
    setRedoStack((s) => s.slice(1));
    setUndoStack((s) => [{ rows, receipt }, ...s].slice(0, 5));
    setRows(next.rows);
    setReceipt(next.receipt);
    flash("Catalog redone.");
  }

  function clearPass() {
    if (filter === "all" && !query.trim()) {
      flash("Already showing all listings.");
      return;
    }
    setFilter("all");
    setQuery("");
    flash("Showing all listings.");
  }

  function dedupeSkus() {
    const next = dedupeBySku(rows);
    if (next.length === rows.length) {
      flash("No duplicate SKUs.");
      return;
    }
    rememberCatalog();
    setRows(next);
    flash(`Removed ${rows.length - next.length} duplicate SKU${rows.length - next.length === 1 ? "" : "s"}.`);
  }

  async function copyView() {
    const hash = catalogHash({ filter, sortBy, query, sale: salePercent });
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    const ok = await copyText(url);
    flash(copyNote(ok, "This catalog pass copied."));
  }

  function addRow() {
    rememberCatalog();
    const reveal = addRowRevealsPass(filter, query);
    if (reveal) {
      setFilter("all");
      setQuery("");
    }
    const ix = rows.length;
    setRows((all) => [...all, emptyRow()]);
    setShopOpen(false);
    setPendingNameFocus(ix);
    flash(reveal ? "Row added. Showing all listings." : "Row added.");
  }

  function pickCatalogFile() {
    document.getElementById("cfile")?.click();
  }

  async function pasteCatalog() {
    let text = "";
    try {
      text = await navigator.clipboard.readText();
    } catch {
      setShopOpen(true);
      flash("Could not read the clipboard. Open shop rates and paste, or use Import catalog file.");
      return;
    }
    if (!clipboardLooksLikeCatalog(text)) {
      flash("Clipboard is not a catalog CSV.");
      return;
    }
    setText(text);
    void ingest(text);
  }

  function takeDroppedFile(e: { preventDefault(): void; stopPropagation?: () => void; dataTransfer: DataTransfer | null }) {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer?.files[0];
    if (file) void file.text().then((raw) => ingest(raw));
  }

  function duplicateRow(row: CatalogRow) {
    const i = rows.indexOf(row);
    if (i < 0) return;
    rememberCatalog();
    const reveal = addRowRevealsPass(filter, query);
    if (reveal) {
      setFilter("all");
      setQuery("");
    }
    const copy = { ...row, name: row.name.trim() ? `${row.name} copy` : "copy" };
    setRows((all) => [...all.slice(0, i + 1), copy, ...all.slice(i + 1)]);
    setPendingNameFocus(i + 1);
    flash(reveal ? "Row duplicated. Showing all listings." : "Row duplicated.");
  }

  async function deleteRow(row: CatalogRow) {
    if (rows.length === 1) {
      const ok = await confirm({
        title: "Delete the last listing?",
        body: "The catalog will be empty on this device. Undo can put it back.",
        confirmLabel: "Delete",
        danger: true,
      });
      if (!ok) return;
    }
    rememberCatalog();
    if (rows.length === 1) {
      setRows([]);
      setPicked(new Set());
      setReceipt(null);
      setFilter("all");
      setQuery("");
      flash("Catalog cleared. Undo can put the listings back.");
      return;
    }
    const ix = rows.indexOf(row);
    setRows((all) => all.filter((r) => r !== row));
    setPicked((cur) => {
      if (ix < 0) return cur;
      const next = new Set<number>();
      for (const i of cur) {
        if (i === ix) continue;
        next.add(i > ix ? i - 1 : i);
      }
      return next;
    });
    flash("Listing deleted.");
  }

  async function restoreSample() {
    if (sampleNeedsConfirm(rows.length) && importMode !== "replace") {
      const ok = await confirm({
        title: "Restore the sample catalog?",
        body:
          importMode === "append"
            ? "This appends four example rows to the catalog on this device."
            : "This merges four example rows by SKU into the catalog on this device.",
        confirmLabel: "Continue",
        danger: sampleAskDanger(importMode),
      });
      if (!ok) return;
    }
    const sample = catalogTemplate();
    setText(sample);
    void ingest(sample, "sample");
  }

  async function copyReceipt() {
    if (!receipt) {
      flash("Apply ads-safe floors first.");
      return;
    }
    const ok = await copyText(receiptText(receipt, currency));
    flash(copyNote(ok, "Apply receipt copied."));
  }

  async function ingest(raw: string, source: "file" | "sample" = "file") {
    const parsed = parseAnyCsv(raw);
    if (parsed.error) {
      setError(parsed.error);
      setText(raw);
      setShopOpen(true);
      flash(parsed.error);
      return;
    }
    if (replaceNeedsConfirm(rows.length, importMode)) {
      const ok = await confirm({
        title: source === "sample" ? "Restore the sample catalog?" : "Replace this catalog?",
        body:
          source === "sample"
            ? "This replaces the listings on this device with four example rows. Undo can put your catalog back."
            : `This replaces ${rows.length} listing${rows.length === 1 ? "" : "s"} with ${parsed.rows.length} from the file. Undo can put your catalog back.`,
        confirmLabel: "Replace",
        danger: true,
      });
      if (!ok) return;
    }
    setError("");
    setKind(parsed.kind);
    setText(raw);
    rememberCatalog();
    const next =
      importMode === "append"
        ? [...rows, ...parsed.rows]
        : importMode === "merge"
          ? mergeRows(rows, parsed.rows)
          : parsed.rows;
    setRows(next);
    setShopOpen(false);
    const etsy = parsed.kind === "etsy" || parsed.kind === "etsy-listings";
    const verb = importMode === "append" ? "Appended" : importMode === "merge" ? "Merged" : etsy ? "Imported" : "Loaded";
    flash(
      etsy
        ? `${verb} ${parsed.rows.length} Etsy rows. Costs stay 0 unless merge kept ones you already typed.`
        : `${verb} ${parsed.rows.length} listings (${next.length} in the table).`,
    );
    setPicked(new Set());
  }

  async function applyFloors(scope: "all" | "picked") {
    const targets = new Set(
      scope === "picked" ? picked : priced.map((p) => rows.indexOf(p.row)).filter((i) => i >= 0),
    );
    const changing = priced.filter((p) => targets.has(rows.indexOf(p.row)));
    const { raise, already, blank } = floorsToApply(changing);
    if (raise.length === 0) {
      flash(applyFloorsNote(0, already.length, blank.length));
      return;
    }
    if (raise.length > 3) {
      const ok = await confirm({
        title: "Apply ads-safe floors?",
        body: `This sets ${raise.length} lists to the charmed ads-safe floor. Undo can put them back.`,
        confirmLabel: "Apply",
      });
      if (!ok) return;
    }
    const raiseSet = new Set(raise);
    rememberCatalog();
    setReceipt(buildApplyReceipt(raise, already.length, blank.length, salePercent));
    setRows(
      priced.map((p) => {
        if (!raiseSet.has(p)) return p.row;
        return { ...p.row, price: Math.round(centsToDollars(p.safeCents) * 100) / 100 };
      }),
    );
    flash(applyFloorsNote(raise.length, already.length, blank.length));
  }

  function visibleIndexes() {
    return shown.map((p) => rows.indexOf(p.row)).filter((i) => i >= 0);
  }

  function selectVisible() {
    const vis = visibleIndexes();
    setPicked(new Set(vis));
    flash(vis.length ? `Selected ${vis.length} visible row${vis.length === 1 ? "" : "s"}.` : "Nothing visible to select.");
  }

  function invertVisible() {
    const vis = visibleIndexes();
    if (vis.length === 0) {
      flash("Nothing visible to invert.");
      return;
    }
    setPicked((cur) => {
      const next = new Set(cur);
      for (const i of vis) {
        if (next.has(i)) next.delete(i);
        else next.add(i);
      }
      return next;
    });
    flash("Inverted the visible selection.");
  }

  function selectProblems() {
    const next = new Set<number>();
    priced.forEach((p) => {
      if (catalogIsProblem(p.risk, p.blankCosts)) {
        const ix = rows.indexOf(p.row);
        if (ix >= 0) next.add(ix);
      }
    });
    setPicked(next);
    flash(selectProblemNote(next.size));
  }

  function exportReprice() {
    const blocked = exportNeedRows(rows.length);
    if (blocked) {
      flash(blocked);
      return;
    }
    downloadFile(
      "keepfloor-reprice.csv",
      toRepriceCsv(
        priced.map((p) => ({
          name: p.row.name,
          current: p.row.price,
          safe: p.adsFloor.possible ? centsToDollars(p.safeCents) : null,
          action: actionFor(p),
        })),
      ),
      "text/csv",
    );
    flash("Reprice CSV downloaded.");
  }

  function exportCatalogCsv() {
    const blocked = exportNeedRows(rows.length);
    if (blocked) {
      flash(blocked);
      return;
    }
    downloadFile("keepfloor-catalog.csv", toCatalogCsv(rows), "text/csv");
    flash("Catalog CSV downloaded.");
  }

  function exportEtsyPrice() {
    const blocked = exportNeedRows(rows.length);
    if (blocked) {
      flash(blocked);
      return;
    }
    downloadFile(
      "etsy-price-update.csv",
      toEtsyPriceCsv(rows.map((r) => ({ sku: r.sku, name: r.name, price: r.price }))),
      "text/csv",
    );
    flash("Etsy price CSV downloaded.");
  }

  function exportSelected() {
    if (picked.size === 0) {
      flash("Select rows first.");
      return;
    }
    const chosen = rowsAt(priced, picked);
    const chosenRows = rowsAt(rows, picked);
    downloadFile(
      "keepfloor-reprice-selected.csv",
      toRepriceCsv(
        chosen.map((p) => ({
          name: p.row.name,
          current: p.row.price,
          safe: p.adsFloor.possible ? centsToDollars(p.safeCents) : null,
          action: actionFor(p),
        })),
      ),
      "text/csv",
    );
    downloadFile(
      "etsy-price-update-selected.csv",
      toEtsyPriceCsv(chosenRows.map((r) => ({ sku: r.sku, name: r.name, price: r.price }))),
      "text/csv",
    );
    flash(`Exported ${chosen.length} selected row${chosen.length === 1 ? "" : "s"}.`);
  }

  function fillBlanks() {
    const defaults = {
      cogs: parseMoney(shop.defaultCogs),
      shipPay: parseMoney(shop.defaultShipPay),
      target: parseMoney(shop.defaultTarget),
    };
    const next = fillBlankRows(rows, defaults);
    if (next.every((row, i) => row === rows[i])) {
      flash("No blank rows to fill.");
      return;
    }
    rememberCatalog();
    setRows(next);
    flash("Blank rows filled with your defaults. We still do not invent costs on import.");
  }

  async function fillSelected() {
    if (picked.size === 0) {
      flash("Select rows first.");
      return;
    }
    const next = fillSelectedRows(rows, picked, {
      cogs: parseMoney(shop.defaultCogs),
      shipPay: parseMoney(shop.defaultShipPay),
      target: parseMoney(shop.defaultTarget),
    });
    if (next.every((row, i) => row === rows[i])) {
      flash("Selected rows already have those defaults.");
      return;
    }
    if (picked.size > 3) {
      const ok = await confirm({
        title: "Overwrite costs on selected rows?",
        body: `This writes your default COGS, postage, and target on ${picked.size} rows.`,
        confirmLabel: "Overwrite",
        danger: true,
      });
      if (!ok) return;
    }
    rememberCatalog();
    setRows(next);
    flash(`Applied shop defaults to ${picked.size} selected row${picked.size === 1 ? "" : "s"}.`);
  }

  async function clearCatalog() {
    if (rows.length === 0) {
      flash("Catalog is already empty.");
      return;
    }
    const ok = await confirm({
      title: "Clear this catalog?",
      body: `This removes ${rows.length} listing${rows.length === 1 ? "" : "s"} from this device. Undo can put them back. The license stays put.`,
      confirmLabel: "Clear",
      danger: true,
    });
    if (!ok) return;
    rememberCatalog();
    setRows([]);
    setPicked(new Set());
    setReceipt(null);
    setFilter("all");
    setQuery("");
    flash("Catalog cleared. Undo can put the listings back.");
  }

  async function deleteSelected() {
    if (picked.size === 0) {
      flash("Select rows first.");
      return;
    }
    if (deletePickedNeedsConfirm(picked.size, rows.length)) {
      const wipe = picked.size === rows.length;
      const ok = await confirm({
        title: wipe ? "Clear this catalog?" : "Delete selected listings?",
        body: wipe
          ? `This removes ${rows.length} listing${rows.length === 1 ? "" : "s"} from this device. Undo can put them back. The license stays put.`
          : `This deletes ${picked.size} selected listings. Undo can put them back.`,
        confirmLabel: wipe ? "Clear" : "Delete",
        danger: true,
      });
      if (!ok) return;
    }
    const removing = picked;
    const wipe = removing.size === rows.length;
    rememberCatalog();
    setRows((all) => all.filter((_, i) => !removing.has(i)));
    setPicked(new Set());
    if (wipe) {
      setReceipt(null);
      setFilter("all");
      setQuery("");
    }
    flash(
      wipe
        ? "Catalog cleared. Undo can put the listings back."
        : `Deleted ${removing.size} listing${removing.size === 1 ? "" : "s"}.`,
    );
  }

  function downloadCatalogBrief() {
    const blocked = exportNeedRows(rows.length);
    if (blocked) {
      flash(blocked);
      return;
    }
    downloadFile(
      "keepfloor-catalog.txt",
      [
        catalogBriefing({
          currency,
          mixPct: clampMix(shop.adsMix),
          listings: health.listings,
          atRisk: health.atRisk,
          adsLoss: health.adsLoss,
          liftCents: health.liftCents,
          mixKeepCents: health.mixKeepCents,
          stress,
          rows: priced.map((p) => ({
            name: p.row.name,
            sku: p.row.sku,
            price: p.row.price,
            safe: p.adsFloor.possible ? centsToDollars(p.safeCents) : null,
            risk: p.risk,
            blank: p.blankCosts,
          })),
        }),
        saleOn ? `${breakIndexes.size} listings break on a ${salePercent}% sale.` : "",
        receipt ? receiptText(receipt, currency) : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      "text/plain",
    );
    flash("Catalog briefing downloaded.");
  }

  function openRow(p: PricedRow) {
    const current = loadListing();
    const next = applyRowToListing(p.row, salePercent, current, shop);
    const { parked } = parkIfDifferent(shop, current, next);
    markFromCatalog();
    markCatalogEdit({
      index: rows.indexOf(p.row),
      sku: p.row.sku,
      listingId: p.row.listingId,
      name: p.row.name,
    });
    const q = encodeListing(shop, next);
    window.location.hash = `#/?${q}`;
    const label = next.name.trim() || "listing";
    flash(parked ? `Opened ${label}. Your last listing is in Recents.` : `Opened ${label}.`);
  }

  function editRow(row: CatalogRow, next: Partial<CatalogRow>) {
    setRows((all) => all.map((r) => (r === row ? { ...r, ...next } : r)));
  }

  function commitMoney(row: CatalogRow, next: Partial<CatalogRow>) {
    const key = Object.keys(next)[0] as keyof CatalogRow | undefined;
    if (!key || row[key] === next[key]) return;
    rememberCatalog();
    editRow(row, next);
  }

  function commitText(row: CatalogRow, next: Partial<Pick<CatalogRow, "name" | "sku">>) {
    const key = Object.keys(next)[0] as "name" | "sku" | undefined;
    if (!key || !catalogTextChanged(String(row[key]), String(next[key] ?? ""))) return;
    rememberCatalog();
    editRow(row, { [key]: String(next[key] ?? "").trim() });
  }

  if (!unlocked) {
    return (
      <div className="legal">
        <h1>Catalog is a paid unlock</h1>
        <p>
          The single-listing calculator is free and uses the same engine. Catalog prices many
          listings at once, flags the ones Offsite Ads would erase, and writes a reprice file.
        </p>
        <ul>
          <li>Drop an Etsy Order items export or a KeepFloor CSV anywhere on the sheet</li>
          <li>Risk labels: ads-safe, below target, ads lose money, no safe price</li>
          <li>Apply charmed safe floors to lists that are not already there, then export selected or all</li>
          <li>Open any row back in the calculator</li>
          <li>Add or duplicate rows, type qty, shipping, postage, pack, labor, and gift wrap on the table, fill blank Etsy imports with your default costs, delete a selection, or clear the catalog</li>
          <li>Shop Manager listings CSV in, SKU/TITLE/PRICE out</li>
          <li>Replace, append, or merge by SKU so a fresh Etsy export does not wipe costs</li>
          <li>Apply floors skips blank-cost rows. Download a catalog briefing or a local backup</li>
          <li>Copy the apply receipt before you paste prices into Shop Manager</li>
        </ul>
        <div className="actions">
          <a className="btn" href={href("pay")}>
            Unlock for $19
          </a>
          <a className="btn secondary" href={listingHref()}>
            Back to one listing
          </a>
        </div>
      </div>
    );
  }

  const dropHint = catalogDropHint(rows.length, shopOpen);

  return (
    <div
      className={`${shop.compact ? "compact" : ""}${drag ? " catalog-drag" : ""}`}
      onDragOver={(e) => {
        if (!isFileDrag(e.dataTransfer.types)) return;
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDrag(false);
      }}
      onDrop={takeDroppedFile}
    >
      <h1 className="print-only">
        {catalogPrintTitle({
          filter,
          query,
          sale: salePercent,
          count: shown.length,
        })}
      </h1>
      {drag && (
        <div className="drop-veil noprint">
          Drop a CSV to import. Replace asks first if this catalog is not empty.
        </div>
      )}
      <section className="hero noprint">
        <h1>Price the catalog so Offsite Ads cannot erase it.</h1>
        <p className="lede">
          Each row gets an organic floor and a 15% Offsite Ads–safe floor using your saved shop
          rates. We do not invent COGS. Etsy Order items files import prices only.
        </p>
      </section>

      {rows.length === 0 && (
        <div className="empty noprint">
          <h2>No listings on this device yet</h2>
          <p>
            Drop an Etsy Order items file or a KeepFloor CSV below. Costs stay 0 until you type
            them.             Restore sample loads four example rows so you can see risk labels before you
            import your shop. Clear catalog stays empty after a reload. Or add a blank row
            and type one listing yourself.
          </p>
          <div className="actions empty-actions">
            <label className="btn" htmlFor="cfile">
              Choose file
            </label>
            <button className="btn secondary" type="button" onClick={restoreSample}>
              Restore sample
            </button>
            <button className="btn secondary" type="button" onClick={addRow}>
              Add a blank row
            </button>
          </div>
        </div>
      )}

      <details
        className="panel shop-sheet noprint"
        open={importSheetOpen(rows.length, shopOpen)}
        onToggle={(e) => {
          if (rows.length === 0) return;
          setShopOpen(e.currentTarget.open);
        }}
      >
        <summary>
          Shop rates and import
          {dropHint ? <span className="note"> · {dropHint}</span> : null}
        </summary>
        <div className="row2">
          <div>
            <label htmlFor="cprofile">Seller bank country</label>
            <select
              id="cprofile"
              value={shop.profileId}
              onChange={(e) => setShop((s) => ({ ...s, profileId: e.target.value }))}
            >
              {SELLER_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="csale">Shop sale % (floors are list prices)</label>
            <input
              id="csale"
              inputMode="decimal"
              value={salePercent}
              onChange={(e) => setSalePercent(e.target.value)}
              onBlur={() => {
                const n = Math.max(0, Number(salePercent) || 0);
                setSalePercent(Number.isInteger(n) ? String(n) : n.toFixed(2));
              }}
            />
          </div>
        </div>
        <label>Charm rounding</label>
        <Seg<Charm>
          label="Charm rounding"
          value={shop.charm}
          onChange={(v) => setShop((s) => ({ ...s, charm: v }))}
          options={[
            { id: "none", label: "Exact" },
            { id: "99", label: ".99" },
            { id: "95", label: ".95" },
            { id: "00", label: ".00" },
          ]}
        />
        <Check checked={shop.fx} onChange={(v) => setShop((s) => ({ ...s, fx: v }))}>
          Apply 2.5% currency conversion
        </Check>
        <label>Share of orders attributed</label>
        <div className="chips">
          {["0", "15", "25", "50", "100"].map((pct) => (
            <button
              key={pct}
              type="button"
              className={`chip slim${shop.adsMix === pct ? " on" : ""}`}
              onClick={() => setShop((s) => ({ ...s, adsMix: pct }))}
            >
              {pct}%
            </button>
          ))}
        </div>
        <p className="note">
          Expected keep uses this mix. Ads-safe floors still assume a fully attributed order.
        </p>
        <label>When a file drops</label>
        <Seg<ImportMode>
          value={importMode}
          onChange={setImportMode}
          options={[
            { id: "replace", label: "Replace" },
            { id: "append", label: "Append" },
            { id: "merge", label: "Merge by SKU" },
          ]}
        />

        <div
          className={`drop ${drag ? "on" : ""}`}
          onDragOver={(e) => {
            if (!isFileDrag(e.dataTransfer.types)) return;
            e.preventDefault();
            e.stopPropagation();
            setDrag(true);
          }}
          onDrop={(e) => {
            e.stopPropagation();
            takeDroppedFile(e);
          }}
        >
          <p>Drop an Etsy Order items file, a Shop Manager listings download, or a KeepFloor CSV.</p>
          <label className="btn secondary" htmlFor="cfile">
            Choose file
          </label>
          <input
            id="cfile"
            className="sr"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void file.text().then(ingest);
              e.target.value = "";
            }}
          />
        </div>
        <details>
          <summary>Paste CSV</summary>
          <textarea id="csv" rows={7} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="actions">
            <button className="btn" type="button" onClick={() => void ingest(text)}>
              Load pasted CSV
            </button>
            <button className="btn secondary" type="button" onClick={restoreSample}>
              Restore sample
            </button>
          </div>
        </details>
        {error && <p className="err">{error}</p>}
        {(kind === "etsy" || kind === "etsy-listings") && (
          <p className="note">Detected an Etsy-style header. Fill COGS and a target before trusting floors.</p>
        )}
        <div className="row3" style={{ marginTop: "0.75rem" }}>
          <MoneyField
            id="dcogs"
            label="Default COGS"
            value={shop.defaultCogs}
            onChange={(v) => setShop((s) => ({ ...s, defaultCogs: v }))}
          />
          <MoneyField
            id="dpay"
            label="Default postage you pay"
            value={shop.defaultShipPay}
            onChange={(v) => setShop((s) => ({ ...s, defaultShipPay: v }))}
          />
          <MoneyField
            id="dtgt"
            label="Default target"
            value={shop.defaultTarget}
            onChange={(v) => setShop((s) => ({ ...s, defaultTarget: v }))}
          />
        </div>
      </details>

      {rows.length > 0 && (
      <>
      <div className="summary">
        <span>
          {rows.length} listing{rows.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          className={`badge safe${filter === "safe" ? " on" : ""}`}
          aria-pressed={filter === "safe"}
          onClick={() => setFilter((f) => toggleCatalogFilter(f, "safe"))}
        >
          {counts.safe} ads-safe
        </button>
        <button
          type="button"
          className={`badge below${filter === "problems" ? " on" : ""}`}
          aria-pressed={filter === "problems"}
          title="Problems include missing costs"
          onClick={() => setFilter((f) => toggleCatalogFilter(f, "problems"))}
        >
          {counts.below} below target
        </button>
        <button
          type="button"
          className={`badge ads-loss${filter === "problems" ? " on" : ""}`}
          aria-pressed={filter === "problems"}
          title="Problems include missing costs"
          onClick={() => setFilter((f) => toggleCatalogFilter(f, "problems"))}
        >
          {counts["ads-loss"]} ads lose money
        </button>
        <button
          type="button"
          className={`badge impossible${filter === "problems" ? " on" : ""}`}
          aria-pressed={filter === "problems"}
          title="Problems include missing costs"
          onClick={() => setFilter((f) => toggleCatalogFilter(f, "problems"))}
        >
          {counts.impossible} no safe price
        </button>
        {counts.blank > 0 && (
          <button
            type="button"
            className={`badge${filter === "problems" ? " on" : ""}`}
            aria-pressed={filter === "problems"}
            title="Problems include missing costs"
            onClick={() => setFilter((f) => toggleCatalogFilter(f, "problems"))}
          >
            {counts.blank} missing costs
          </button>
        )}
        {rollup.raise > 0 && (
          <span className="badge below">
            {health.atRisk} at risk · {formatMoney(rollup.liftCents, currency)} extra keep per sale if they move
            {health.lostCents < 0 ? ` · ads currently lose ${formatMoney(health.lostCents, currency)}` : ""}
          </span>
        )}
        <span className="badge">
          expected keep {formatMoney(health.mixKeepCents, currency)} at a {clampMix(shop.adsMix)}% mix
        </span>
        {threshold != null && (
          <span className="badge">
            {priced.filter((p) => p.adsFloor.possible && p.safeCents < threshold).length} ads-safe lists
            sit under free-over {shop.freeOver}
          </span>
        )}
        {saleOn && (
          <button
            type="button"
            className={`badge ${breakIndexes.size ? "below" : "safe"}${filter === "sale" ? " on" : ""}`}
            aria-pressed={filter === "sale"}
            onClick={() => setFilter((f) => toggleCatalogFilter(f, "sale"))}
          >
            {breakIndexes.size} break on this {salePercent}% sale
          </button>
        )}
      </div>

      {rows.length > 0 && (
        <div className="stress" aria-label="Sale stress">
          {stress.map((s) => (
            <button
              key={s.pct}
              type="button"
              className={`stress-cell${s.atRisk > 0 ? " warn" : ""}${Number(salePercent) === s.pct ? " on" : ""}`}
              aria-pressed={Number(salePercent) === s.pct}
              onClick={() => setSalePercent(String(s.pct))}
            >
              <div className="k">{s.pct}% shop sale</div>
              <div className="v">
                {s.atRisk} miss ads-safe
              </div>
              <div className="note">{s.safe} still safe</div>
            </button>
          ))}
        </div>
      )}

      {receipt && (
        <div className="receipt panel">
          <h2>Last apply</h2>
          <p className="note">
            {receipt.raise} list{receipt.raise === 1 ? "" : "s"} raised ·{" "}
            {formatMoney(receipt.addedCents, currency)} added to lists
            {receipt.salePercent > 0 ? ` · floors at ${receipt.salePercent}% sale` : ""} ·{" "}
            {new Date(receipt.at).toLocaleString()}
          </p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th className="num">Was</th>
                  <th className="num">Now</th>
                  <th className="num">Added</th>
                </tr>
              </thead>
              <tbody>
                {receipt.lines.map((line, i) => (
                  <tr key={`${line.sku}-${line.name}-${i}`}>
                    <td>
                      {line.name}
                      {line.sku ? <span className="note"> {line.sku}</span> : null}
                    </td>
                    <td className="num">{formatMoney(line.fromCents, currency)}</td>
                    <td className="num">{formatMoney(line.toCents, currency)}</td>
                    <td className="num">{formatMoney(line.toCents - line.fromCents, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="actions noprint" style={{ marginTop: "0.6rem" }}>
            <button className="btn secondary" type="button" onClick={() => void copyReceipt()}>
              Copy receipt
            </button>
            <button
              className="btn secondary"
              type="button"
              onClick={() => downloadFile("keepfloor-apply-receipt.csv", receiptCsv(receipt), "text/csv")}
            >
              Receipt CSV
            </button>
            <button
              className="btn secondary"
              type="button"
              onClick={() => downloadFile("keepfloor-apply-receipt.txt", receiptText(receipt, currency), "text/plain")}
            >
              Receipt text
            </button>
          </div>
        </div>
      )}

      <div className="toolbar noprint">
        <input
          ref={searchRef}
          aria-label="Filter by name, SKU, or listing ID"
          placeholder="Search name, SKU, or listing ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            e.stopPropagation();
            if (query) setQuery("");
            else (e.target as HTMLInputElement).blur();
          }}
        />
        <div className="toolbar-side">
          <Seg<CatalogFilter>
            label="Catalog filter"
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all", label: "All" },
              { id: "problems", label: "Problems" },
              { id: "safe", label: "Ads-safe" },
              { id: "sale", label: "Breaks on sale" },
            ]}
          />
          <div>
            <label htmlFor="csort">Sort</label>
            <select id="csort" value={sortBy} onChange={(e) => setSortBy(e.target.value as CatalogSort)}>
              <option value="risk">Risk</option>
              <option value="gap">Gap</option>
              <option value="lift">Lift</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
        <p className="toolbar-count">
          {shown.length === rows.length
            ? `${rows.length} listing${rows.length === 1 ? "" : "s"}`
            : `Showing ${shown.length} of ${rows.length}`}
          {filter !== "all" ? ` · ${filter}` : ""}
          {query.trim() ? ` · “${query.trim()}”` : ""}
          {saleOn ? ` · ${salePercent}% sale` : ""}
        </p>
      </div>
      <div className="action-groups noprint">
        <ActionGroup label="Price">
          <button className="btn" type="button" onClick={() => applyFloors("all")}>
            Apply safe floors
          </button>
          <button className="btn secondary" type="button" disabled={picked.size === 0} onClick={() => applyFloors("picked")}>
            Apply to selected ({picked.size})
          </button>
        </ActionGroup>
        <ActionGroup label="Select">
          <button className="btn secondary" type="button" onClick={selectProblems}>
            Problems
          </button>
          <button className="btn secondary" type="button" disabled={shown.length === 0} onClick={selectVisible}>
            Visible ({shown.length})
          </button>
          <button className="btn secondary" type="button" disabled={shown.length === 0} onClick={invertVisible}>
            Invert
          </button>
          <button className="btn secondary" type="button" disabled={picked.size === 0} onClick={() => void deleteSelected()}>
            Delete selected ({picked.size})
          </button>
        </ActionGroup>
        <ActionGroup label="Costs">
          <button className="btn secondary" type="button" onClick={fillBlanks}>
            Fill blanks
          </button>
          <button className="btn secondary" type="button" disabled={picked.size === 0} onClick={fillSelected}>
            Fill selected ({picked.size})
          </button>
          <button className="btn secondary" type="button" onClick={addRow}>
            Add row
          </button>
          <button className="btn secondary" type="button" onClick={dedupeSkus}>
            Dedupe SKUs
          </button>
          <button className="btn secondary" type="button" onClick={() => void clearCatalog()}>
            Clear catalog
          </button>
        </ActionGroup>
        <ActionGroup label="History">
          <button className="btn secondary" type="button" disabled={undoStack.length === 0} onClick={undoCatalog}>
            Undo{undoStack.length > 1 ? ` (${undoStack.length})` : ""}
          </button>
          <button className="btn secondary" type="button" disabled={redoStack.length === 0} onClick={redoCatalog}>
            Redo{redoStack.length > 1 ? ` (${redoStack.length})` : ""}
          </button>
        </ActionGroup>
        <ActionGroup label="Export">
          <button className="btn secondary" type="button" onClick={exportReprice}>
            Reprice CSV
          </button>
          <button className="btn secondary" type="button" onClick={exportCatalogCsv}>
            Catalog CSV
          </button>
          <button className="btn secondary" type="button" onClick={exportEtsyPrice}>
            Etsy price CSV
          </button>
          <button className="btn secondary" type="button" disabled={picked.size === 0} onClick={exportSelected}>
            Selected ({picked.size})
          </button>
          <button className="btn secondary" type="button" onClick={downloadCatalogBrief}>
            Briefing
          </button>
          <button className="btn secondary" type="button" onClick={() => void copyView()}>
            Copy view
          </button>
          <button className="btn secondary" type="button" onClick={() => requestPrint()}>
            Print
          </button>
        </ActionGroup>
      </div>

      <div className="panel">
        {shown.length === 0 ? (
        <div className="empty">
          <h2>Nothing in this pass</h2>
          <p>
            {filter === "sale" && !saleOn
              ? "Set a shop sale % to see listings that are ads-safe at full price and miss once the sale is on."
              : filter === "problems"
                ? "Nothing needs a raise or costs. Problems includes missing COGS or target, even when ads-safe at a $0 target."
                : "No listings match that filter or search."}
          </p>
          <div className="actions empty-actions">
            <button className="btn" type="button" onClick={clearPass}>
              Show all
            </button>
          </div>
        </div>
        ) : (
        <div className="table-wrap">
          <table className="table catalog">
            <caption className="sr">
              Catalog listings with price, quantity, shipping, gift wrap, postage, costs, pack,
              labor, organic profit, 15% ads profit, and the ads-safe floor
            </caption>
            <thead>
              <tr>
                <th className="noprint">
                  <input
                    type="checkbox"
                    checked={
                      shown.length > 0 &&
                      shown.every((p) => {
                        const ix = rows.indexOf(p.row);
                        return ix >= 0 && picked.has(ix);
                      })
                    }
                    onChange={() => {
                      const vis = shown.map((p) => rows.indexOf(p.row)).filter((i) => i >= 0);
                      const allOn = vis.length > 0 && vis.every((i) => picked.has(i));
                      setPicked((cur) => {
                        const next = new Set(cur);
                        for (const i of vis) {
                          if (allOn) next.delete(i);
                          else next.add(i);
                        }
                        return next;
                      });
                    }}
                    aria-label="Select visible rows"
                  />
                </th>
                <th>Listing</th>
                <th className="num">Price</th>
                <th className="num" title="Units in this order">Qty</th>
                <th className="num" title="Shipping charged to the buyer">Ship</th>
                <th className="num" title="Gift wrap charged to the buyer">Gift</th>
                <th className="num" title="Postage you pay">Postage</th>
                <th className="num">COGS</th>
                <th className="num" title="Packaging you pay">Pack</th>
                <th className="num" title="Labor you pay, each">Labor</th>
                <th className="num">Target</th>
                <th className="num">Organic</th>
                <th className="num">If 15% ads</th>
                <th className="num">Safe floor</th>
                <th className="num">Gap</th>
                <th>Risk</th>
                <th className="noprint"></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p, i) => {
                const ix = rows.indexOf(p.row);
                const mark = [
                  i === cursor ? "on" : "",
                  ix >= 0 && picked.has(ix) ? "picked" : "",
                  ix >= 0 && breakIndexes.has(ix) ? "sale-break" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                <tr
                  key={`${p.row.sku}-${p.row.name}-${i}`}
                  className={mark}
                  aria-selected={i === cursor}
                  ref={i === cursor ? cursorRow : undefined}
                >
                  <td className="noprint">
                    <input
                      type="checkbox"
                      checked={picked.has(rows.indexOf(p.row))}
                      onChange={() => {
                        const ix = rows.indexOf(p.row);
                        setPicked((cur) => {
                          const next = new Set(cur);
                          if (next.has(ix)) next.delete(ix);
                          else next.add(ix);
                          return next;
                        });
                      }}
                      aria-label={`Select ${p.row.name}`}
                    />
                  </td>
                  <td>
                    <TextCell
                      id={ix >= 0 ? `cat-name-${ix}` : undefined}
                      className="cell name"
                      value={p.row.name}
                      ariaLabel="Listing name"
                      onCommit={(name) => commitText(p.row, { name })}
                    />
                    <TextCell
                      className="cell sku"
                      value={p.row.sku}
                      ariaLabel={`SKU for ${p.row.name || "listing"}`}
                      placeholder="SKU"
                      onCommit={(sku) => commitText(p.row, { sku })}
                    />
                    {p.blankCosts ? <div className="note">No costs or target yet</div> : null}
                    {ix >= 0 && breakIndexes.has(ix) ? <div className="note">Breaks on this sale</div> : null}
                  </td>
                  <td className="num">
                    <CellInput value={p.row.price} onCommit={(n) => commitMoney(p.row, { price: n })} />
                  </td>
                  <td className="num">
                    <CellInput
                      value={p.row.quantity}
                      integer
                      onCommit={(n) => commitMoney(p.row, { quantity: n })}
                    />
                  </td>
                  <td className="num">
                    <CellInput value={p.row.shipping} onCommit={(n) => commitMoney(p.row, { shipping: n })} />
                  </td>
                  <td className="num">
                    <CellInput value={p.row.gift} onCommit={(n) => commitMoney(p.row, { gift: n })} />
                  </td>
                  <td className="num">
                    <CellInput
                      value={p.row.shippingYouPay}
                      onCommit={(n) => commitMoney(p.row, { shippingYouPay: n })}
                    />
                  </td>
                  <td className="num">
                    <CellInput value={p.row.cogs} onCommit={(n) => commitMoney(p.row, { cogs: n })} />
                  </td>
                  <td className="num">
                    <CellInput value={p.row.packaging} onCommit={(n) => commitMoney(p.row, { packaging: n })} />
                  </td>
                  <td className="num">
                    <CellInput value={p.row.labor} onCommit={(n) => commitMoney(p.row, { labor: n })} />
                  </td>
                  <td className="num">
                    <CellInput value={p.row.targetProfit} onCommit={(n) => commitMoney(p.row, { targetProfit: n })} />
                  </td>
                  <td className="num">{formatMoney(p.organic.profitCents, currency)}</td>
                  <td className={`num ${p.ads.profitCents < 0 ? "neg" : ""}`}>
                    {formatMoney(p.ads.profitCents, currency)}
                  </td>
                  <td className="num">{p.adsFloor.possible ? formatMoney(p.safeCents, currency) : "—"}</td>
                  <td className={`num ${p.gapCents > 0 ? "neg" : ""}`}>
                    {p.gapCents === 0 ? "—" : formatMoney(p.gapCents, currency)}
                  </td>
                  <td>
                    <span className={`badge ${p.risk}`}>{riskLabel(p.risk)}</span>
                  </td>
                  <td className="noprint">
                    <button className="linkish" type="button" onClick={() => openRow(p)}>
                      Open
                    </button>{" "}
                    <button className="linkish" type="button" onClick={() => duplicateRow(p.row)}>
                      Dup
                    </button>{" "}
                    <button className="linkish" type="button" onClick={() => void deleteRow(p.row)}>
                      Del
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
        {shown.length > 0 && (
          <p className="note noprint">
            j/k move · / search · x select · a visible · i invert · d dup · Del delete · ⌘V paste · Esc show all · ⌘Z undo · ⌘Shift+Z redo · Enter open · ? keys
          </p>
        )}
      </div>
      </>
      )}
      {rows.length > 0 && (
      <div className="dock noprint">
        <span>
          {rollup.raise} to raise · {picked.size} selected
        </span>
        <button
          className="btn"
          type="button"
          onClick={() => void applyFloors(picked.size ? "picked" : "all")}
        >
          {picked.size ? `Apply ${picked.size}` : "Apply safe floors"}
        </button>
      </div>
      )}
      <Confirm ask={ask} onSettle={settle} />
    </div>
  );
}

function TextCell({
  id,
  className,
  value,
  ariaLabel,
  placeholder,
  onCommit,
}: {
  id?: string;
  className: string;
  value: string;
  ariaLabel: string;
  placeholder?: string;
  onCommit: (next: string) => void;
}) {
  const [raw, setRaw] = useState(value);
  useEffect(() => {
    setRaw(value);
  }, [value]);
  return (
    <input
      id={id}
      className={className}
      value={raw}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={() => {
        const next = raw.trim();
        setRaw(next);
        onCommit(next);
      }}
    />
  );
}

function CellInput({
  value,
  onCommit,
  integer,
}: {
  value: number;
  onCommit: (n: number) => void;
  integer?: boolean;
}) {
  const [raw, setRaw] = useState(integer ? String(value) : value.toFixed(2));
  useEffect(() => {
    setRaw(integer ? String(value) : value.toFixed(2));
  }, [value, integer]);
  return (
    <input
      className={integer ? "cell qty" : "cell"}
      inputMode={integer ? "numeric" : "decimal"}
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={() => {
        if (integer) {
          const n = catalogQty(raw);
          setRaw(String(n));
          onCommit(n);
          return;
        }
        const n = Math.round(parseMoney(raw) * 100) / 100;
        setRaw(n.toFixed(2));
        onCommit(n);
      }}
    />
  );
}
