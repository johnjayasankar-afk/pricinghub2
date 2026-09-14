import { useState, type FormEvent } from "react";
import {
  liveCheckoutReady,
  sandboxMode,
  type CheckoutConfig,
} from "../state/checkout";
import { grantCatalog, isSandboxKey, storedReceipt, unlockWithKey } from "../state/license";
import { catalogHref } from "../state/catalog-ui";
import { lastSheet, returnHref, returnLabel, returnOpenLabel, thanksOffersCalculator } from "../state/return-to";
import { href } from "./route";

function LegalBack() {
  return (
    <div className="actions">
      <a className="btn secondary" href={returnHref()}>
        {returnLabel()}
      </a>
    </div>
  );
}

export function PayPage({
  config,
  onUnlocked,
}: {
  config: CheckoutConfig;
  onUnlocked: () => void;
}) {
  const live = liveCheckoutReady(config);
  const sandbox = sandboxMode();
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState("");

  async function onKey(e: FormEvent) {
    e.preventDefault();
    const err = await unlockWithKey(key, config);
    setMsg(err || "Catalog unlocked on this browser.");
    if (!err) onUnlocked();
  }

  function simulate() {
    grantCatalog(`sandbox-${Date.now()}`);
    onUnlocked();
    window.location.hash = "/thanks?sandbox=1";
  }

  return (
    <div className="legal">
      <h1>{config.productName}</h1>
      <p>
        ${config.priceUsd} once. You receive catalog pricing, Etsy CSV import, risk labels,
        one-click safe floors, and a reprice file. The one-listing calculator stays free.
        Polar or Gumroad is the seller of record when live checkout is connected — they
        send the receipt.
      </p>
      <ul>
        <li>Automatic delivery: license key and/or file from the payment provider</li>
        <li>14-day refund if the catalog engine cannot price a well-formed CSV</li>
        <li>No subscription. No account on KeepFloor. Listing math stays in this browser.</li>
      </ul>
      {live ? (
        <div className="actions">
          {config.polarCheckoutUrl && (
            <a className="btn" href={config.polarCheckoutUrl}>
              Pay with Polar
            </a>
          )}
          {config.gumroadUrl && (
            <a className="btn secondary" href={config.gumroadUrl}>
              Pay with Gumroad
            </a>
          )}
        </div>
      ) : (
        <div className="callout warn">
          <p>
            Live checkout is not connected. No real payment can be taken from this copy.
            The owner still needs a Polar (preferred) or Gumroad account. See the launch
            checklist.
          </p>
        </div>
      )}
      {sandbox && (
        <div className="panel" style={{ marginTop: "1rem" }}>
          <h2>Sandbox</h2>
          <p className="note">
            This simulator does not charge a card. It only unlocks catalog locally so the
            payment-to-delivery path can be tested. Use Polar’s sandbox at sandbox.polar.sh
            with card 4242 4242 4242 4242 after the owner account exists.
          </p>
          <button className="btn" type="button" onClick={simulate}>
            Simulate successful payment
          </button>
        </div>
      )}
      <form onSubmit={onKey} style={{ marginTop: "1.25rem" }}>
        <label htmlFor="key">Already purchased? Paste your license key</label>
        <input id="key" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" />
        <div className="actions">
          <button className="btn secondary" type="submit">
            Unlock
          </button>
        </div>
        {msg && <p className={msg.includes("unlocked") ? "note" : "err"}>{msg}</p>}
        {sandbox && (
          <p className="note">
            Sandbox key: <code>KEEPFLOOR-SANDBOX</code>
            {isSandboxKey(key) ? "" : ""}
          </p>
        )}
      </form>
      <LegalBack />
    </div>
  );
}

export function ThanksPage() {
  const receipt = storedReceipt();
  return (
    <div className="legal">
      <h1>You can use the catalog</h1>
      <p>
        Payment providers send the official receipt. This page does not grant access by
        itself — access was recorded only after a sandbox grant or a license check.
      </p>
      {receipt && <p className="note">Local receipt reference: {receipt}</p>}
      <div className="actions">
        <a className="btn" href={catalogHref()}>
          Open catalog
        </a>
        {thanksOffersCalculator(lastSheet()) && (
          <a className="btn secondary" href={returnHref()}>
            {returnLabel()}
          </a>
        )}
        <a className="btn secondary" href={href("help")}>
          Recover a purchase
        </a>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="legal">
      <h1>That page is not here</h1>
      <p>
        KeepFloor is a hash-routed worksheet. A mistyped link does not open the calculator
        silently — it stops here so you know the URL is wrong.
      </p>
      <div className="actions">
        <a className="btn" href={returnHref()}>
          {returnOpenLabel()}
        </a>
        <a className="btn secondary" href={href("help")}>
          Help
        </a>
      </div>
    </div>
  );
}

export function HelpPage({ config }: { config: CheckoutConfig }) {
  return (
    <div className="legal">
      <h1>How to use KeepFloor</h1>
      <ol>
        <li>Choose the country of the bank account on your Etsy Payments settings.</li>
        <li>Enter the list price, shipping charged, costs, and the profit you want to keep.</li>
        <li>Set the ads case (organic / 15% / 12%), charm rounding, and whether a shop sale is on.</li>
        <li>Read the scenario matrix. The ads-safe floor is the list to use if you cannot opt out.</li>
        <li>If a fee on your statement differs, override that rate. The engine is a worksheet, not Etsy.</li>
      </ol>
      <h2>What the floors mean</h2>
      <p>
        Ads-safe is 15% Offsite Ads at the shipping you charge, then charm-rounded{" "}
        <em>up</em>. Survive-all is the highest floor across every case, including free
        shipping plus ads. Floors are <em>list</em> prices. A 20% sale means the buyer
        pays less and every percentage fee is computed on that lower amount. Optional
        personalization is added to the displayed price before fees. Free shipping zeroes
        the buyer’s shipping charge; you still pay postage.
      </p>
      <p>
        Charm leftover above the exact floor is not a fee. A payment reserve is cash Etsy
        holds — it does not raise the ads-safe floor. Expected keep blends organic and 15%
        ads by the share you think are attributed; 25% is the starting guess. Floors still
        assume a fully attributed order.
      </p>
      <h2>Quantity, VAT, and free-over</h2>
      <p>
        Quantity-break floors are ads-safe lists at 1, 2, 3, and 5 units in one order —
        the target stays per order. Hours × hourly rate become labor if you fill them. If
        the list includes VAT, remitted VAT is a cost; Etsy still fees the gross. Stay is
        today’s ads-safe list with the shipping you already charge. Cross is free shipping
        plus the higher of that free+ads floor and your program minimum (often $35 in the
        US). Crossing can keep less — the worksheet will say so.
      </p>
      <h2>Catalog</h2>
      <p>
        After unlock, drop an Etsy Order items export, a Shop Manager listings file, or a
        KeepFloor CSV anywhere on the catalog — import folds after listings exist, the
        drop does not. Costs default to zero — we do not invent COGS. Import can replace,
        append, or merge by SKU. Type quantity, buyer shipping, gift wrap, postage, pack,
        and labor on the table — the same fields the floors already use. Postage is not
        COGS: Fill blanks still fills a row that only has postage, and Apply floors will
        not raise a list that has no COGS or target. Open calculator writes those fields
        back onto the row when you return — Help does not claim that save. Hours stay on
        the worksheet only while they still match the row’s labor. Clear catalog stays
        empty after a reload. Focus stays in this tab until you turn it off. Problems
        includes rows with no COGS or target — even if they look ads-safe at a $0 target —
        and the summary chips toggle that pass. Search finds a Shop Manager listing ID.
        Merge keeps gift wrap you already typed. Fill blanks
        with your defaults, filter problems, apply
        charmed safe floors (blank-cost and already-safe rows are skipped), export a
        reprice or SKU/TITLE/PRICE file, delete a selection, or clear the catalog. Sale-stress
        shows how many listings miss ads-safe at 0 / 10 / 20 / 30% off. Copy the apply
        receipt before you paste prices into Shop Manager.
      </p>
      <h2>Commands, keys, and print</h2>
      <p>
        ⌘/Ctrl+K opens commands. ⌘/Ctrl+Enter applies the ads-safe floor.
        ⌘/Ctrl+Z undoes on the calculator or catalog — not on Help. ⌘/Ctrl+Shift+Z
        redoes. ⌘/Ctrl+P prints this sheet after overlays close. Copy listing link
        copies the address-bar worksheet. Copy catalog view copies the live filter,
        sort, search, and sale — the same pass as the Copy view button.
        Press <kbd>?</kbd> for the cheat sheet. Page-specific commands stay visible but
        disabled on the other page. Catalog actions stay disabled until Catalog is
        unlocked. Open calculator, Open catalog, Unlock catalog, Help, Fee sources,
        Privacy, Terms, and Refunds disable on the page you are already on. Reset, Fill
        blanks, Show all, Dedupe SKUs, Restore sample, Import catalog file, Paste catalog
        CSV, Add a row, Select problems (includes missing costs), Export reprice CSV, Export catalog CSV, Export
        Etsy price CSV, Delete selected, and Clear catalog are commands. An empty catalog
        can start with a blank row — Add row shows all listings and focuses the name.
        Name and SKU save when you leave the cell, and undo. After listings are on this
        device, shop rates and import fold so
        the table is the work — drop a CSV anywhere on the sheet, or paste with
        ⌘/Ctrl+V when you are not typing. ⌘K Import catalog file and Paste catalog CSV
        do the same. A bad file opens shop rates and says why. Export and briefing say
        add listings first when the catalog is empty. After unlock, Open
        catalog — and Back to calculator if that is the sheet
        you left. Replace asks first if the catalog is not empty — a dropped file, a
        paste, or Restore sample. Clear catalog and deleting the last listing or a
        selection ask first. Fill blanks does nothing when costs are already those
        defaults. Copy catalog view waits for unlock. Copies say if the clipboard blocked them. Opening{" "}
        <code>#/pay?sandbox=1</code> keeps sandbox in this tab so Help and Calculator do
        not hide the simulator.
      </p>
      <p>
        On the catalog, <kbd>j</kbd>/<kbd>k</kbd> move, <kbd>x</kbd> selects,{" "}
        <kbd>a</kbd> selects visible, <kbd>i</kbd> inverts, <kbd>d</kbd> duplicates,
        Delete or Backspace deletes the selection or the highlight, Enter opens the
        calculator (return writes the listing back), Escape
        shows all, and <kbd>/</kbd> focuses search. ⌘/Ctrl+V pastes a catalog CSV when
        you are not in a field. Catalog keys do nothing on the paywall. On the
        calculator, <kbd>/</kbd> shows the
        form if Focus is on, then focuses list price. Focus stays in this tab until you
        turn it off. Shift-click a recent to pin it.
        Destructive actions ask in the same overlay as commands, not a browser alert.
      </p>
      <h2>Memory on this device</h2>
      <p>
        The address bar is the listing. Recents, pins, statement lines, and a local
        backup stay in this browser. Opening a different listing, sample, or catalog row
        parks the one you were on first. $32 and $32.00 are the same listing. Restore
        asks first, then replaces the live sheet — no reload — and will not write the
        listing you had open back onto the restored catalog. The catalog shows every
        restored listing, not the last filter. Recents update at once. The license key is not in
        the backup file. A mistyped hash opens a
        not-found page. Back from Help, Buy, or a legal page returns to the calculator or
        catalog you were on. If the sheet errors, your data stays here — open the
        calculator or catalog from the error sheet.
      </p>
      <h2>Replay a statement</h2>
      <p>
        Paste a sale as <code>item 32</code>, <code>ship 5.50</code>,{" "}
        <code>fees 5.68</code>, <code>ads 15</code> to replay it against the worksheet.
        Override a published rate only when a payment-account line differs.
      </p>
      <h2>Recover a purchase</h2>
      <p>
        Open the email from Polar or Gumroad. Download the catalog file or paste the
        license key on the pay page. If that email is missing, write to{" "}
        {config.supportEmail || "the address published when checkout goes live"} with the
        payment date and the last four digits of the card or the order id. Do not send
        card numbers.
      </p>
      <h2>Refunds</h2>
      <p>
        Ask within 14 days if the catalog cannot process a CSV that matches the template
        headers. Refunds are issued by the payment provider. Listing prices you choose
        remain your responsibility.
      </p>
      <LegalBack />
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="legal">
      <h1>Privacy</h1>
      <p>Last updated 4 September 2026.</p>
      <p>
        KeepFloor is a browser worksheet. Listing prices, costs, and CSV files are
        processed in this browser and are not uploaded to a KeepFloor server. This copy
        does not set advertising cookies and does not include a third-party analytics
        script.
      </p>
      <p>
        If you buy Catalog, Polar or Gumroad — not KeepFloor — collects the payment
        details their checkout requires. Read that provider’s privacy policy before
        paying. KeepFloor only stores a license flag and a short receipt reference in
        this browser’s localStorage so you do not have to paste the key on every visit.
      </p>
      <p>
        To delete local data, clear this site’s storage in your browser. There is no
        KeepFloor user account to delete. If you emailed support, ask that inbox to
        delete the thread.
      </p>
      <LegalBack />
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="legal">
      <h1>Terms of use</h1>
      <p>Last updated 4 September 2026.</p>
      <p>
        KeepFloor is an independent calculator. It is not affiliated with, endorsed by,
        or sponsored by Etsy, Inc. “Etsy” is used only to describe the marketplace whose
        published seller fees the worksheet applies.
      </p>
      <p>
        Results are estimates from the rates you enter and the defaults copied from
        Etsy’s public policies on the sources page. Etsy can change fees. Your payment
        account is the record of what you were charged. KeepFloor is not tax, legal, or
        accounting advice and does not file anything on your behalf.
      </p>
      <p>
        The free calculator may be used without a purchase. Catalog is a one-time
        digital product. When live payments are enabled, the merchant of record is Polar
        or Gumroad as shown at checkout. You must have the right to use any CSV you
        import.
      </p>
      <LegalBack />
    </div>
  );
}

export function RefundPage() {
  return (
    <div className="legal">
      <h1>Refunds</h1>
      <p>
        If Catalog cannot price a CSV that uses the documented headers, email support
        within 14 days of purchase with the order id from Polar or Gumroad. The provider
        issues the refund to the original payment method. Transaction fees they keep on
        refunds are described in their docs. Chargebacks cost extra; email first.
      </p>
      <p>
        Changing your mind about an Etsy pricing decision is not a defect. The free
        single-listing tool remains available without a refund.
      </p>
      <LegalBack />
    </div>
  );
}

export function SourcesPage() {
  return (
    <div className="legal">
      <h1>Fee sources</h1>
      <p>Read on 4 September 2026. Defaults are editable when your statement differs.</p>
      <ul>
        <li>
          <a href="https://www.etsy.com/legal/fees/">Etsy Fees &amp; Payments Policy</a> —
          $0.20 listing fee; 6.5% transaction fee on item + shipping + gift wrap; Offsite
          Ads 15% or 12% on attributed orders, $100 USD cap; 2.5% currency conversion
          when listing currency ≠ payment-account currency.
        </li>
        <li>
          <a href="https://www.etsy.com/legal/etsy-payments">Etsy Payments Policy §9.B</a> —
          processing percent + flat fee by bank-account country, assessed on the gross
          order including delivery and tax.
        </li>
        <li>
          <a href="https://help.etsy.com/hc/en-us/articles/1500011073202-What-is-a-Regulatory-Operating-Fee">
            Regulatory Operating Fee help article
          </a>{" "}
          — country percentages applied to item + shipping + gift wrap.
        </li>
        <li>
          <a href="https://help.etsy.com/hc/en-us/articles/360000338367-How-Etsy-s-Offsite-Ads-Work">
            How Etsy’s Offsite Ads work
          </a>{" "}
          — 15% under the $10,000 trailing-sales threshold (opt-out available); 12% and
          mandatory after the threshold; $100 cap per order.
        </li>
      </ul>
      <LegalBack />
    </div>
  );
}
