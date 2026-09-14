# KeepFloor 1.1 — what we added and why

The product still has one job: **set an Etsy price that still pays you after the published fee stack.** These features make that job complete. They are not a second product.

## 1. Scenario matrix (always on)

One listing, four cases, same costs:

| Case | What changes |
| --- | --- |
| Organic | No Offsite Ads fee |
| Offsite 15% | Under-$10k shop, attributed order |
| Offsite 12% | $10k+ shop, attributed order |
| Free shipping | Buyer pays $0 shipping; you still pay postage |

Each column shows profit at the current price and the list-price floor that hits the target. The “safe” floor is the highest of organic and 15% ads (the stricter ads case).

## 2. Sale price and coupons

Shop sales and coupons reduce the amount fees attach to. The worksheet:

- Charges the item at `list × (1 − sale%)` minus a coupon amount.
- Solves for the **list** price that still hits the target **after** the sale.

A 20% off sale on a $40 list is not the same as a $32 list.

## 3. Personalization and add-on line

Etsy adds optional personalization to the displayed listing price for fees. An optional “also in this order” line shares one processing flat fee and one Offsite Ads cap — the way a real cart works.

## 4. Listing-fee allocation

$0.20 is not a per-sale tax. Modes: ignore (already paid), charge this sale, or split across N expected sales.

## 5. Charm rounding

Floors are exact cents. Sellers list $31.99, not $31.47. After the floor, round **up** to .00 / .95 / .99 so the charm price never undershoots.

## 6. Insights, not slogans

The engine writes specific sentences: ads lose money, listing fee is a large share, free shipping ate the target, the $100 ads cap has kicked in, a $3 sticker cannot survive 15%.

## 7. Sensitivity

Profit if you raise or cut the list by $1, and if COGS rises $1. Shows whether the listing is fragile.

## 8. Shop memory and share URL

Country, FX, charm, and listing-fee mode persist in this browser. A copy-link button encodes the current listing in the hash so a seller can reopen the same worksheet.

## 9. Catalog that decides

- Risk labels from **15% ads profit at the current list**: ads-safe, below target, ads lose money, no safe price.
- Filter to the problem rows.
- Apply safe (charmed) floors in one click.
- Export a reprice CSV (`name,current_price,safe_floor,action`).
- Drop an Etsy **Order items** or KeepFloor CSV. Costs default to 0 until filled — we do not invent COGS.

## 10. Printable sheet and copy

Print hides chrome. Copy puts a plain-text briefing on the clipboard.

## 11. Max sale % and break-even

At the current list, the engine reports the highest shop-sale percent that still hits the target, and the break-even list (target $0) on the selected ads case.

## 12. Apply floor, undo, share, memory

One click writes the charmed ads-safe list into the price field, with undo. Shop prefs and the last listing persist in this browser. A share link encodes the full worksheet.

## 13. Free shipping + ads

A fifth scenario column: buyer pays $0 shipping *and* the order is attributed at 15%. That is the case that erases POD and “free shipping” shops.

## 14. Catalog that decides (detail)

Search, filter to problems, sort by risk, inline COGS/target edits, persist rows, drop files, open a row in the calculator. Reprice CSV columns: `name,current_price,safe_floor,action`.

## 15. Fee waterfall and sensitivity

A stacked bar of fee lines vs merchandise, plus profit if the list moves ±$1 or COGS rises $1.

## KeepFloor 1.2 — the weekly tool

1.1 answers one listing. 1.2 is what a seller comes back to.

### 16. Named worksheets and recents

A listing has a name. The last 12 worksheets stay on this device and reopen in one click. Share links carry the name.

### 17. Survive-all floor

Ads-safe is 15% ads at the shipping you charge. Survive-all is the highest floor across organic, 15%, 12%, free shipping, and free+ads. Price that number if a week can include a sale, free shipping, *and* an attributed order.

### 18. Volume and a monthly goal

Expected units this month × keep at the current list vs at the ads-safe list. Optional monthly profit goal → units needed at this price vs at the safe floor.

### 19. Trailing $10k ads rule

Etsy’s published Offsite Ads rule: under $10,000 trailing 12-month sales, 15% and opt-out; at or over, 12% and mandatory. Enter the USD figure from your shop stats. We do not compute Etsy’s window — we apply the published threshold to the number you type.

### 20. Statement reconcile

Paste the Etsy-side fee total from a payment account line. Match (≤1¢), close (≤25¢), or off. Trust the worksheet against a real order without uploading anything.

### 21. Proposed list (what-if)

A second price that does not overwrite the current list. Compare keep at now / proposed / ads-safe / survive-all. Apply any of them.

### 22. Catalog you can edit

Add, duplicate, and delete rows. Fill blank Etsy imports with your default COGS, postage, and target. Gap and per-sale lift columns. A rollup of how much extra you keep if every problem row moves to its safe floor.

### 23. Rates ribbon and print identity

Every page shows “Rates as of 4 September 2026.” Print includes the listing name and the date.

## KeepFloor 1.3 — speed and trust

The weekly tool is in place. 1.3 is how a seller prices faster and checks a real statement line by line.

### 24. Price ladder

Sellers think in charm points, not exact cents. Around the ads-safe floor the worksheet shows a short ladder of .99 / .95 / .00 prices and what you keep at each. Click a rung to use it.

### 25. Line-item statement match

Optional fields for listing, transaction, processing, and Offsite Ads as they appear on the payment account. Each line is match / close / off against the worksheet. The total reconcile from 1.2 still works alone.

### 26. VAT included in the list

UK and EU shops often list VAT-inclusive. Etsy still fees the gross. If you enter the included VAT %, KeepFloor treats the remitted VAT as a cost so floors stay honest. This is not tax advice and is not VAT-on-Etsy-fees (already a separate rate).

### 27. Etsy listings CSV in, bulk price CSV out

Shop Manager listing downloads (`TITLE`, `PRICE`, `SKU`, `LISTING ID`) import alongside Order items. Export `SKU,TITLE,PRICE` for a bulk price pass. Costs stay 0 until filled.

### 28. Catalog select, sort, shop health

Sort by risk, gap, lift, or name. Select rows and apply floors only to those. Applying more than three rows asks once. A shop-health strip: how many listings are at risk, and how much extra you keep per sale if they move.

### 29. SKU, notes, undo stack

SKU and a private note travel with the worksheet. The last five list prices undo in order.

### 30. COGS shock

Sensitivity now includes materials +5% and +10%, not only +$1.

### 31. First-run coach and live status

A dismissible three-step coach on first visit. Flash messages are announced to assistive tech.

## KeepFloor 1.4 — shop rhythm

The worksheet is complete for one listing. 1.4 is how a shop actually runs a week: quantity discounts, a sale that does not sink the catalog, and imports that do not wipe costs.

### 32. Quantity-break floors

Etsy quantity discounts change the per-unit floor because the processing flat and listing fee are shared. The worksheet shows the ads-safe list at 1, 2, 3, and 5 units. The target is still per order.

### 33. Labor from time

Hours × your hourly rate becomes labor. The dollar labor field remains if you prefer to type it.

### 34. Ads headroom

If trailing sales are under $10k, the worksheet shows how much room is left before Offsite Ads become 12% and mandatory.

### 35. Catalog sale-stress

At 0 / 10 / 20 / 30% off, how many listings miss the ads-safe target. Run the sale on paper before you turn it on in Etsy.

### 36. Shipping profiles

Named postage presets (charged, free, digital). One click fills shipping charged and shipping you pay.

### 37. Import replace, append, or merge

Drop a CSV and choose replace, append, or merge by SKU. Merge keeps the costs you already typed. Dedupe by SKU is one click.

### 38. Focus mode, snapshots, and a mobile dock

Focus hides the form and leaves the numbers. The last eight floors for this listing name stay on the device. A bottom dock on small screens applies the ads-safe floor. Reset asks first. Briefing downloads as a text file.

## KeepFloor 1.5 — decide with confidence

1.4 runs the week. 1.5 is the last inch: expected keep when only some orders are attributed, a backup you can take to another browser, and commands that do not make you hunt.

### 39. Ads mix

Floors still assume a 15% attributed order — that is the safe list. Real weeks are a mix. A shop-level attribution % (0 / 15 / 25 / 50 / 100, or typed) blends organic keep and 15% ads keep. It never lowers the ads-safe floor.

### 40. Decision line

One sentence under the statbar: current list, expected keep at the mix, target, ads-safe list. Readable in two seconds.

### 41. Catalog apply guard

Apply floors skips rows with no costs or target. Those rows are counted in the flash. We do not invent a price from a blank Etsy import.

### 42. Restore snapshots

The last eight floors for this listing name are chips. Click one to put that list back, with undo.

### 43. Local backup

Download shop prefs, the current worksheet, and the catalog as one JSON file. Restore overwrites this browser only, after confirm. The catalog license key is not in the file.

### 44. Catalog briefing

A shop report: health, sale-stress, expected keep at the mix, and every row that should rise. Download as text.

### 45. Command palette

⌘/Ctrl+K. Apply ads-safe or survive-all, focus, open catalog, download briefing or backup, restore backup. Escape closes.

### 46. Quantity-price CSV

Export qty → ads-safe list for Etsy quantity discounts. Target is still per order.

### 47. Compact density

A shop toggle tightens type and hides the lede. Same math. Built for a second monitor next to Shop Manager.

## KeepFloor 1.6 — shop rules that change the floor

1.5 tells you what you keep. 1.6 answers the Etsy setting that quietly rewrites the list: free shipping over a threshold, and the catalog after a Shop Manager dump.

### 48. Free-over compare

US shops often join free shipping on orders of $35 or more. That is not the same as today’s ads-safe list. The worksheet compares two ads-safe paths:

- **Stay** — current shipping, ads-safe list (may sit under $35)
- **Cross** — buyer pays $0 shipping, list is the higher of the free+ads floor and the charmed threshold

Keep is measured on a 15% attributed order. The ads-safe floor on the current shipping case does not change.

### 49. Use the crossing list

One click writes free shipping and the crossing list. Undo still restores the previous list.

### 50. Bulk-fill selected catalog rows

After an Etsy import, many rows share one COGS. Select them and apply shop default COGS, postage you pay, and target. Blank-only fill remains for raw imports. Apply still skips rows with no costs.

### 51. Packaging profiles

Mailer / box chips, same idea as shipping profiles.

### 52. Copy the decision line

One click or ⌘K copies the two-second sentence.

### 53. Arrow-key nudge

↑/↓ on money fields steps a cent. Shift steps $1. Quantity and percents step by 1.

### 54. Catalog remembers the view

Filter, sort, and search persist on this device so a second visit opens on the problem rows.

## KeepFloor 1.7 — the week after you price it

1.6 decides the shop rule. 1.7 is what happens next: you undo a crossing, you check a real payment-account line, and you go back to the catalog without losing your place.

### 55. Honest undo

Undo now restores the last list *and* the shipping case (free vs charged), quantity, shipping charged, and sale %. Crossing to free-over and then undoing no longer leaves free shipping on a pre-cross price. ⌘/Ctrl+Z undoes when you are not typing in a field.

### 56. Replay a sale

Paste a short sale block (`item 32`, `ship 5.50`, `tax 2.40`, `fees 5.68`, `ads 15`). The worksheet fills those fields and the existing statement match runs against the fee total. We do not scrape Etsy.

### 57. Back to catalog

Opening a catalog row marks this visit. The calculator shows a back link so you return to the same filter and sort.

### 58. Catalog keyboard

On the catalog page, `j` / `k` move the highlight, `x` selects, Enter opens the row. Ignored while a field or the command palette has focus.

### 59. Listing-fee drag

Active listings × $0.20 ÷ 4 months = the monthly listing-fee load if every listing renews. Shown next to volume. Zero hides it.

### 60. Palette that stays put

Tab cycles inside the command palette. Background scroll is locked. Escape still closes.

## KeepFloor 1.8 — two truths at once

1.7 lets you replay and undo. 1.8 is the other number you need next to keep: cash if Etsy is holding a reserve, and the same math on a second listing.

### 61. Redo

⌘/Ctrl+Shift+Z puts the last undo back. A new apply or crossing clears redo.

### 62. Compare with a recent

Pick a named recent. Side by side: list, keep, expected keep at the mix, ads-safe floor. The current worksheet does not change until you open that recent.

### 63. Payment reserve

Etsy payment reserve holds a percent of an order. That is not a fee — keep is unchanged. The worksheet shows cash this payout after the hold. 0 hides it. Floors do not move.

### 64. Sticky catalog columns

The checkbox and listing name stay in view when you scroll the risk columns. The header stays when you scroll down.

### 65. Shop default sale %

A shop-level sale percent opens the catalog on that sale. The calculator can apply it to this listing without touching other fields.

### 66. Replay history

The last six pasted sale blocks stay on this device as chips.

## KeepFloor 1.9 — Friday night edges

1.8 gives you cash next to keep, and a second listing next to this one. 1.9 is the pass you run before you upload prices: the leftover charm rounding costs you, the catalog does not rewrite lists that are already safe, and you can take only the rows you checked.

### 67. Charm tax

Charm only rounds up. The ads-safe number you apply is the charmed list. The worksheet also shows the exact (uncharmed) floor and the cents charm added. That leftover is not an Etsy fee — it stays in keep. Floors do not change.

### 68. Skip lists that are already safe

Apply ads-safe floors only to rows whose current list is not already the charmed floor. The flash says how many rose, how many were already there, and how many were skipped for blank costs. Applying the calculator ads-safe button when you are already there is a no-op.

### 69. Select the visible catalog, export those

Select all visible rows, invert that set, or use the header checkbox. `a` selects what the filter shows; `i` inverts. Export selected writes a reprice CSV and an Etsy price file for only the checked rows.

### 70. Pin a recent

A pinned recent stays at the top of the list and is not dropped when newer worksheets fill the twelve slots. Compare defaults stay usable for the listing you keep checking against.

### 71. Copy the versus table

The side-by-side compare copies as plain text: list, keep, expected keep, ads-safe, cash.

### 72. Keyboard cheat sheet

`?` opens the keys on this page. Escape closes it. Same overlay pattern as the command palette — tab stays inside, background scroll locks.

## KeepFloor 1.10 — before you upload

1.9 gets the rows selected. 1.10 is the paper you keep next to Shop Manager, and the filter you run the week before a shop sale.

### 73. Apply receipt

After ads-safe floors land, KeepFloor keeps a receipt: name, SKU, old list, new list, cents added. Copy or download it. It stays on this device until the next apply. Undo restores the previous prices and the previous receipt.

### 74. Catalog undo and redo

Catalog undo is a five-deep stack, not one shot. A second apply, fill, import, or delete no longer erases the first undo. Redo puts the last undo back. ⌘/Ctrl+Z and ⌘/Ctrl+Shift+Z work on the catalog page when you are not typing. A new change clears redo.

### 75. Breaks on sale

A listing can be ads-safe at full price and miss the target the moment a shop sale turns on. With a sale % set, the catalog can show only those rows. Floors still assume the sale you typed.

### 76. Printable shop sheet

Print on the catalog page includes the date, sale %, shop health, sale-stress counts, and the last apply receipt, then the table. Toolbars stay off the page.

## KeepFloor 1.11 — production finish

1.10 is the upload paper. 1.11 is the last pass so the worksheet feels like one product: one shell, grouped actions, honest empty routes, and a tighter paper system. Floors do not change.

### 77. One shell

The top bar stays in view. An unknown hash opens a not-found page instead of silently becoming the calculator. Changing pages scrolls to the top. The skip link names the page you landed on.

### 78. Grouped actions

Calculator and catalog actions sit in labeled groups (price, history, copy, export) instead of one undifferentiated row. Mobile catalog gets the same dock pattern as the calculator.

### 79. Rows you already chose

A checked catalog row and a row that breaks on the current sale are marked in the table, not only by the checkbox or a filter.

### 80. Flash you can hear twice

The same status can fire again and still announce. Worksheet reset clears redo.

### 81. Production head

Theme color, manifest, Open Graph title, and the typefaces the CSS already named. No service worker — listing math stays a static file.

## KeepFloor 1.12 — the last inch

1.11 is one product. 1.12 removes the remaining browser chrome and the leftover seams so a Friday pass never leaves the paper.

### 82. In-app confirms

Apply floors, fill selected, reset, and restore backup ask in the same overlay language as ⌘K. Escape cancels. A failed backup is a notice, not `window.alert`. Floors do not change.

### 83. Catalog cursor stays in view

`j` / `k` scroll the highlighted row to the nearest visible edge of the table. The highlight is no longer allowed to walk off-screen.

### 84. Rates live in the shell

The as-of date sits in the sticky header. There is one chrome band, not a bar plus a ribbon that scrolls away.

### 85. Empty catalog

An unlocked catalog with no rows states the next step — drop a file or restore the sample — instead of an empty table.

### 86. Scroll padding and legal surfaces

Skip-to-content and in-page focus land below the shell. Help, pay, and legal pages use the same panel language as the worksheet.

## KeepFloor 1.13 — close the loops

1.12 removed browser chrome. 1.13 connects features that already existed so a Friday pass does not drop the view you were in.

### 87. Catalog view in the hash

Filter, sort, search, and sale % write into `#/catalog?…`. A shared or bookmarked link opens the same pass. Local storage still remembers the view if the hash is bare.

### 88. The sale you are pricing

Sale-stress tiles mark the percent the catalog is actually using. Clicking 20% is no longer a silent field change.

### 89. A pin opens the compare

If a recent is pinned, the versus table opens on that listing instead of an empty dropdown.

### 90. Confirm returns focus

Closing an in-app confirm puts the keyboard back on the control that asked.

### 91. Money fields settle

Leaving a money field writes a clean 0.00 (or a whole number when the step is 1). Floors still use integer cents.

### 92. Flash on an empty catalog

Status stays visible when there are no rows — a failed drop or a restore no longer has nowhere to land.

## KeepFloor 1.14 — the last surface

1.13 connected the loops. 1.14 is the last pass on the paper itself: the catalog bar, empty next steps, print, and the way you get back to the pass you were in. Floors do not change.

### 93. One catalog bar

Search, filter, and sort sit in one bar. When a filter or search is on, the bar says how many of the shop you are looking at.

### 94. Empty catalog next steps

An unlocked catalog with no rows offers Choose file and Restore sample in the empty surface, not only inside Paste CSV.

### 95. Catalog money settles; print stays a sheet

Leaving a price, COGS, or target cell writes 0.00. Print drops input chrome so the catalog is a shop sheet.

### 96. Selected sale that still hurts

A sale-stress tile that is both the active percent and at-risk keeps both marks.

### 97. Copy this catalog pass

One action copies the current catalog URL — filter, sort, search, and sale — so Friday’s pass can be pasted.

### 98. Back opens the same pass

Catalog in the nav, ⌘K, and the calculator back link use the last saved catalog view, not a bare `#/catalog`.

### 99. Captions and the last inch of chrome

The fee stack has a readable caption. The skip link is a real chip. The mobile dock clears the home indicator. A catalog filter updates the document title. Opening a row from the catalog leaves a breadcrumb, not a lone note.

## KeepFloor 1.15 — the page you are on

1.14 finished the paper. 1.15 makes chrome tell the truth: commands know the page, overlays give the keyboard back, and a filtered catalog has a way out. Floors do not change.

### 100. Commands that know the page

Palette actions that only work on the calculator or catalog are disabled on the other page, with a hint. Arrow keys skip them. A catalog copy from ⌘K still announces.

### 101. Overlays return focus

⌘K and `?` put the keyboard back on the control that opened them, the same way confirms already do.

### 102. A filtered catalog can leave

Zero matches is an empty surface with Show all, not a blank table. Escape clears search and filter. Search Escape clears the query.

### 103. Sale % settles; the row is selected

Leaving shop sale % writes a clean number. The j/k highlight is `aria-selected`.

### 104. Nav and the shell tell the truth

The current page is `aria-current`. ⌘K and `?` sit as nav controls. The sticky shell height is the real header, including a wrapped mobile nav. The calculator title includes the listing name. A keep-below-target decision uses the warn treatment.

## KeepFloor 1.16 — copies and exits that work

1.15 made chrome honest. 1.16 makes the last Friday failures speak: a copy that cannot write, a compare that points at a ghost, a cell edit with no undo, and a legal page with no way back. Floors do not change.

### 105. Copies that say if they failed

Every copy uses one helper: clipboard API, then a fallback, then a status if both fail. ⌘K copy-view is included.

### 106. Compare cannot point at a ghost

If the selected recent was removed, the versus table clears (or lands on a remaining pin) instead of hanging on a missing id.

### 107. `/` focuses catalog search

When you are not typing, `/` puts the caret in the catalog search. Same muscle memory as a filter bar.

### 108. Shift-click pins a recent

Shift-click a recent chip pins or unpins it and opens the versus table on a new pin. A plain click still opens the listing.

### 109. Last listing asks

Deleting the only catalog row asks first. Undo can still put it back.

### 110. Catalog money is undoable

Committing a price, COGS, or target writes an undo step. Typing a name does not.

### 111. Legal pages have a way back

Help, sources, and the legal sheets end with Back to calculator. Price-ladder tiles use the same hover language as sale-stress.

## KeepFloor 1.17 — the listing hash

1.16 made copies and exits speak. 1.17 gives the calculator the same hash memory the catalog already has. Floors do not change.

### 112. The address bar is the worksheet

The calculator writes the listing into `#/?…` after you pause typing, the same way the catalog writes its pass. A copied URL from the bar is the listing you are on.

### 113. Calculator opens the listing you left

Brand, Calculator in the nav, ⌘K, Back to calculator, and the locked-catalog exit use the saved listing hash — not a bare `#/`.

### 114. A recent writes the hash

Opening a recent replaces the hash immediately so the bar matches the listing you opened.

### 115. The recent you are on

The recent chip for the listing on the worksheet is marked current. Pin is still the star.

### 116. `/` focuses list price

On the calculator, when you are not typing, `/` focuses the list price field.

## KeepFloor 1.18 — one status

1.17 made the address bar the worksheet. 1.18 puts status in one place and lets the phone chrome tell the truth. Floors do not change.

### 117. One toast

Calculator and catalog announce through the same status. It sits in a fixed bar, not mid-worksheet on one page and at the table on the other.

### 118. Dismiss it

Click the toast to dismiss. Escape dismisses it when no overlay is open.

### 119. The notch is in the viewport

`viewport-fit=cover` so the mobile dock’s safe-area padding is real. Text does not inflate on iOS. Buttons skip the double-tap delay.

### 120. Compare has a caption

The versus table states what it is comparing, the same way the catalog table already does.

## KeepFloor 1.19 — it stays a worksheet

1.18 unified status. 1.19 keeps the paper on screen when a render fails, and lets Safari finish a download before the blob is revoked. Floors do not change.

### 121. Error stays on paper

A thrown render does not white-screen. The sheet says the listing is still in this browser and offers Reload.

### 122. Downloads finish

One download helper. The object URL is revoked after the browser has had time to start the file — Safari no longer gets an empty download.

## KeepFloor 1.20 — do not lose the listing

1.19 kept the paper on screen. 1.20 keeps the listing you were on when you jump. Floors do not change.

### 123. Samples park the current listing

Loading a sample writes the worksheet you are on into Recents first. A flash says so.

### 124. The recent you are already on

Clicking the recent chip for the listing already on the worksheet does not rewind it to an older save.

### 125. Opening a different recent parks first

The current listing is saved to Recents before another recent opens, even if the 800ms autosave had not fired.

### 126. The sample you are on

The sample chip for the listing on the worksheet is marked current, the same way a recent is.

### 127. Controls name themselves

The status toast is a button. Palette search, ⌘K, and `?` have accessible names. A confirm describes its body.

## KeepFloor 1.21 — reset and the sample you are on

1.20 parked before a jump. 1.21 parks before Reset, and will not reload the sample already on the worksheet. Floors do not change.

### 128. Reset parks first

Reset writes the current listing into Recents, then restores the sample tote. The confirm still says Recents stay — now the listing you reset is actually there.

### 129. The sample you are already on

Clicking the sample chip for the listing already on the worksheet does not reload defaults or overwrite that recent with a clean sample.

## KeepFloor 1.22 — the chrome is the worksheet

1.21 kept Reset and samples from throwing away the listing. 1.22 keeps the address bar and the shell links on the listing you are typing. Floors do not change.

### 130. The address bar writes now

The listing hash updates as you type. Leaving Help or Catalog no longer remounts an older query because a 400ms write was cancelled.

### 131. Shell links stay current

KeepFloor, Calculator, and Catalog in the header always point at the saved listing or catalog pass — including open-in-new-tab — not the href from the last route change.

## KeepFloor 1.23 — leave without losing it

1.22 kept the address bar honest. 1.23 keeps Recents honest when you leave, and parks before a catalog row overwrites the worksheet. Floors do not change.

### 132. Recents flush on leave

The 800ms recents write is not cancelled into nothing. Leaving the calculator — or hiding the tab — writes the listing you were on.

### 133. A catalog row parks first

Opening a catalog row writes the current listing into Recents when it is a different listing. The toast says so.

### 134. The notch does not cover the brand

The sticky header and skip link honor `safe-area-inset-top`, the same way the dock already honors the home indicator.

## KeepFloor 1.24 — $32 is $32.00

1.23 parked before a catalog row. 1.24 treats a blurred list price as the same listing, so a sample, a recent, and a catalog row do not fork or wipe the worksheet. Floors do not change.

### 135. One listing, one id

Recents and samples key on name + cents. `$32` and `$32.00` are the same tote. Old recents with both strings collapse to one chip, and the pin stays.

### 136. A catalog row keeps the extras

Opening the row that is already on the worksheet applies catalog columns and leaves notes, hours, personalization, and statement fields alone.

### 137. Recents also flush when the tab hides

Safari backgrounding writes Recents, not only a full page hide.

## KeepFloor 1.25 — open replaces, it does not merge

1.24 kept extras when the catalog row was the same listing. 1.25 stops the last worksheet from leaking into a recent, a sample, or compare. Floors do not change.

### 138. Notes travel with the listing

The address bar and Recents store the note (up to 240 characters).

### 139. Open is a clean listing

Opening a recent or sample starts from a blank worksheet, then applies that query. Free shipping, add-ons, FX, and notes do not carry over from the listing you left. Compare uses the same open.

### 140. Restore parks first

Restoring a backup writes the current listing into Recents before it replaces shop, listing, and catalog.

## KeepFloor 1.26 — the hash boot is an open

1.25 cleaned in-page opens. 1.26 cleans the remount when Catalog (or a shared link) changes the listing in the address bar. Floors do not change.

### 141. A different hash opens clean

If the hash is another listing, boot uses a clean open. Free shipping, add-ons, and notes from the stored listing do not leak. The same listing still keeps extras the URL does not carry (deposit, statement lines).

## KeepFloor 1.27 — the statement is the listing

1.26 kept deposit on a same-listing remount. 1.27 puts deposit, statement lines, and fee overrides in the address bar and Recents, so opening that listing again still reconciles. Floors do not change.

### 142. Statement and overrides travel

Deposit, payment-account fee lines, and rate overrides encode with the listing. A recent or share link opens the same reconcile.

### 143. Price history flushes on leave

The 1600ms snapshot write is not cancelled into nothing. Leaving the calculator keeps the last keep / ads-safe / list rung.

## KeepFloor 1.28 — the crumb is the row

1.27 kept the statement on the listing. 1.28 keeps the catalog back-link honest, and keeps the worksheet out of the landscape notch. Floors do not change.

### 144. The crumb is only that row

Opening a recent or sample, or Reset, clears the Catalog crumb. It is not a permanent back link after you have left that row.

### 145. The landscape notch clears the worksheet

Horizontal safe-area insets the paper. The header still bleeds edge to edge and keeps its own notch padding.

## KeepFloor 1.29 — the paper tells the truth

1.28 kept the crumb honest. 1.29 keeps print and a crashed sheet honest. Floors do not change.

### 146. Print names the pass

A listing print states list and ads-safe. A catalog print states filter, search, sale %, and how many rows are on the paper — the same `shown` table you see.

### 147. An error can still open the listing

The error sheet offers Open calculator and Open catalog from this browser’s saved worksheet, then reloads so the paper can render again.

## KeepFloor 1.30 — the printed sheet is dated

1.29 named the pass. 1.30 puts the rate date on the paper — the ribbon does not print — and lets ⌘K print the sheet you are on. Floors do not change.

### 148. Print cites the rates

A calculator or catalog print ends with the same “Rates as of” line as the shell, plus the not-affiliated notice.

### 149. ⌘K prints this sheet

Print this sheet is in the command palette on the calculator and catalog, and on the cheat sheet as ⌘/Ctrl+P.

## KeepFloor 1.31 — print after the overlay

1.30 put Print in ⌘K. 1.31 closes the palette, keys, and toast before the print dialog, so the preview is the worksheet. Floors do not change.

### 150. Overlays leave before print

Print this sheet — from ⌘K or the Print button — dismisses commands, the cheat sheet, and the toast, then prints on the next frame.

### 151. Copy view is a catalog command

Copy catalog view link is disabled off the catalog page, the same way other page-specific commands already are.

## KeepFloor 1.32 — commands match the page

1.31 disabled Copy view off catalog. 1.32 puts the listing link in ⌘K, and will not pretend Undo works on Help. Floors do not change.

### 152. Copy listing link

⌘K copies the address-bar listing on the calculator — the same Link button.

### 153. Undo stays on the sheet

Undo and redo are disabled on Help, Buy, and legal pages. Nothing is listening there.

### 154. The palette clears the notch

Command, keys, and confirm overlays honor the same safe-area insets as the header.

## KeepFloor 1.33 — the overlay owns the keys

1.32 put the listing link in ⌘K. 1.33 will not undo under a dialog, will not claim an empty undo worked, and prints from the keyboard the same way ⌘K does. Help teaches the product. Floors do not change.

### 155. Nothing to undo

Calculator undo and redo say so when the stack is empty — the same words as the catalog.

### 156. Keys wait for the overlay

Calculator shortcuts ignore the command palette, keys sheet, and confirm. The catalog already did.

### 157. Already at that list

Survive-all, free-over, ladder, proposed, and quantity-break do not push a no-op onto undo.

### 158. ⌘P prints the sheet

⌘/Ctrl+P on the calculator or catalog closes overlays first, then prints. Help still uses the browser’s own print.

### 159. Help is the product, not the changelog

Help lists floors, catalog, commands, and memory. It does not recap every increment.

### 160. Disabled uses and short screens

Disabled “Use” links look disabled. The command list and keys sheet scroll inside the notch-safe overlay.

## KeepFloor 1.34 — catalog commands need the catalog

1.33 made empty undo honest. 1.34 will not pretend Apply floors works on the locked catalog page. Floors do not change.

### 161. Unlock first

Catalog commands, undo, redo, and print stay disabled on the locked catalog page. Nothing is listening there.

### 162. Already on this page

Open calculator and Open catalog disable when you are already there.

### 163. Reset and fill blanks

⌘K resets the worksheet (asks first) and fills blank catalog costs.

### 164. Impossible floors say so

No ads-safe, no survive-all, and no free-over crossing flash instead of doing nothing.

### 165. No blank rows

Fill blanks does not push a no-op onto catalog undo.

## KeepFloor 1.35 — sandbox stays in the tab

1.34 locked catalog commands. 1.35 keeps the payment simulator after you leave Buy, and puts the rest of the nav in ⌘K. Floors do not change.

### 166. Sandbox survives Help

Opening `#/pay?sandbox=1` remembers sandbox for this tab. Calculator, Help, and Buy still show the simulator. A new tab without that flag stays live.

### 167. Buy is a command

⌘K opens Unlock catalog. Help, Sources, and Buy disable on the page you are already on.

### 168. Show all and dedupe

⌘K shows all catalog listings — and says so if the pass is already clear. Remove duplicate SKUs is the same command as the button.

## KeepFloor 1.36 — back goes to the sheet you left

1.35 kept sandbox in the tab. 1.36 will not send a catalog seller to a blank calculator when they leave Help. Floors do not change.

### 169. Back is the last sheet

Help, Buy, Sources, and legal pages return to the calculator or catalog you were on — the current listing or the current catalog pass.

### 170. A mistyped hash opens that sheet

The not-found page’s primary button opens the same sheet, not always the calculator.

## KeepFloor 1.37 — slash shows the form

1.36 sent Back to the last sheet. 1.37 will not focus a hidden list price. Floors do not change.

### 171. / leaves Focus

On the calculator, `/` shows the form if Focus is on, then focuses list price.

### 172. Focus says what it did

Toggle focus tells you the form is hidden, and that `/` brings the price back.

## KeepFloor 1.38 — sample does not wipe the shop

1.37 showed the form before focusing price. 1.38 will not replace a live catalog with four example rows without asking. Floors do not change.

### 173. Restore sample asks

If listings are already on this device, Restore sample asks first. Replace is the dangerous import mode. An empty catalog still loads the sample in one click.

### 174. Sample and add row are commands

⌘K restores the sample catalog and adds a blank row — the same buttons.

## KeepFloor 1.39 — replace asks for any ingest

1.38 asked before Restore sample. 1.39 asks before Replace wipes a live catalog from a file or a paste. Floors do not change.

### 175. A dropped file is not a silent wipe

Replace + listings already on this device asks first. Append and merge do not. An empty catalog still loads in one drop.

### 176. One ask for sample replace

Restore sample in Replace mode uses the same confirm as a file. Undo still puts the catalog back.

## KeepFloor 1.40 — empty catalog and the legal exits

1.39 asked before Replace. 1.40 lets an empty catalog start by hand, folds import once listings exist, and puts legal pages on ⌘K. Floors do not change.

### 177. Empty catalog can start with one row

Choose file and Restore sample are not the only doors. Add a blank row is on the empty surface — the same command as ⌘K.

### 178. Listings are the work

Shop rates and import stay open while the catalog is empty. After a row lands they fold so the table is what you see. Open the sheet when you need it.

### 179. Thanks and legal from the palette

After unlock, Open catalog. If you came from the calculator, Back to calculator is there too. Privacy, Terms, and Refunds are commands — disabled on the page you are already on.

## KeepFloor 1.41 — catalog wipe is honest

1.40 let an empty catalog start by hand. 1.41 lets a live catalog empty the same way it fills — with an ask, and undo. Floors do not change.

### 180. Clear catalog asks

Clear catalog removes every listing on this device after you confirm. Undo puts them back. The license stays put. An already-empty catalog says so.

### 181. Delete selected

A selection deletes in one move. One of many does not ask — same as Del. More than one, or the last listing, asks first.

### 182. Fill does not fake a write

Fill blanks and Fill selected leave rows in place when costs are already those defaults — including $0 defaults. Copy catalog view waits for unlock.

## KeepFloor 1.42 — the paywall is not the table

1.41 made wipe honest. 1.42 keeps catalog keys on the live sheet, and Delete matches Del. Floors do not change.

### 183. Locked catalog does not hear the table

Until Catalog is unlocked, keys and commands do not move, open, or delete rows behind the paywall. The address bar and the document title stay on the catalog page — not a leftover filter.

### 184. Delete and duplicate are keys

Delete or Backspace removes the selection, or the highlighted row when nothing is selected — the same asks as the buttons. <kbd>d</kbd> duplicates the highlight.

### 185. Copy view is the live pass

⌘K Copy catalog view copies the filter, sort, search, and sale on the sheet — not a stale saved link.

## KeepFloor 1.43 — drop still reaches the catalog

1.42 kept keys off the paywall. 1.43 puts the file drop back on the live sheet after import folds. Floors do not change.

### 186. A CSV can land anywhere on the sheet

Shop rates and import still fold once listings exist. Drop a file on the table, the hero, or the folded summary. Replace asks first if the catalog is not empty.

### 187. Import is a command

⌘K Import catalog file opens the same picker as Choose file — even when the import sheet is closed.

## KeepFloor 1.44 — paste reaches the catalog

1.43 put drop back on the live sheet. 1.44 does the same for a copied CSV, and a bad import is no longer silent inside the fold. Floors do not change.

### 188. ⌘V pastes a catalog

When you are not typing, ⌘/Ctrl+V reads the clipboard. A header row ingests the same way as a file — Replace still asks. A copied price is not a catalog.

### 189. A bad import opens the sheet

If the file or paste cannot parse, shop rates and import open and the toast says why. The pasted text stays in the box.

## KeepFloor 1.45 — Shop Manager files are commands

1.44 put paste on the live sheet. 1.45 puts the files you paste into Shop Manager on ⌘K — the same buttons. Floors do not change.

### 190. Export is the last mile

Reprice CSV, catalog CSV, and Etsy SKU/TITLE/PRICE are commands. They flash when the file lands. An empty catalog says add listings first — including briefing.

### 191. Select problems is a command

The Problems button and ⌘K select the same at-risk rows. If every listing is ads-safe, the toast says so.

## KeepFloor 1.46 — a new row is ready to type

1.45 put Shop Manager files on ⌘K. 1.46 lands you in the listing you just added. Floors do not change.

### 192. Add row shows the new listing

If a filter or search would hide it, Add row shows all listings first. The name field focuses and selects “New listing” so you can type over it.

### 193. Name and SKU undo

Name and SKU save when you leave the cell — the same undo as a money edit. Typing no longer rewrites the catalog on every key.

## KeepFloor 1.47 — the table shows what the floor uses

1.46 let you type a name. 1.47 shows quantity, buyer shipping, and postage on the catalog — Fill blanks already wrote postage you could not see. Floors do not change.

### 194. Qty, ship, and postage are columns

Etsy imports already carry quantity and shipping. Default postage already lands on fill. They are editable on the row, and undo, like price.

### 195. Quantity is at least one

A blank or zero qty becomes one unit. The engine already prices a one-unit order that way.

## KeepFloor 1.48 — postage is not COGS

1.47 put postage on the table. 1.48 stops treating a typed postage as “this row has costs.” Floors do not change.

### 196. Fill blanks still sees a postage-only row

A row with postage and no COGS or target is still blank. Fill blanks writes COGS and target and keeps the postage you typed.

### 197. Apply floors will not raise a postage-only list

Ads-safe apply still skips rows with no COGS or target. Postage alone is not enough to trust a floor.

## KeepFloor 1.49 — the catalog remembers what you did

1.48 stopped treating postage as a filled cost. 1.49 stops two lies: Clear catalog coming back as the sample shop, and Open calculator edits vanishing. Floors do not change.

### 198. An empty catalog stays empty

Clear writes `[]`. Reload keeps the empty sheet. First visit with no storage still loads the sample so a new device has something to read.

### 199. Open calculator writes the listing back

Packaging, labor, hours, gift, and the rest of the worksheet land on the row when you return to the catalog — header, commands, or the crumb. Reset, a preset, or another recent drops the crumb without overwriting that row. Help can leave the calculator and come back; the pointer stays until the catalog opens.

### 200. Duplicate shows the copy

A filtered pass reveals, and the new name is focused, the same way Add a row already worked.

## KeepFloor 1.50 — the table shows the rest of the floor

1.49 wrote pack, labor, and gift back onto the row. 1.50 lets you see and edit them, and stops Help from claiming a catalog save. Floors do not change.

### 201. Pack, labor, and gift are columns

Buyer gift wrap sits with shipping. Pack and labor sit with COGS. A KeepFloor CSV already carried them; the table no longer hides what the floor uses.

### 202. Hours only survive when they still match labor

Opening a row keeps hours if they still produce that labor. Edit labor on the catalog and hours clear so the row you typed is the source.

### 203. Returning to Help is not a catalog save

The listing still writes when you leave the calculator so Help can come back. The toast only fires when you actually return to the catalog.

### 204. Focus stays in this tab

Refresh keeps Focus on. A new tab starts with the form shown.

## KeepFloor 1.51 — problems means needs attention

1.50 put pack, labor, and gift on the table. 1.51 stops treating a blank Etsy import as ads-safe just because the target is $0. Floors do not change.

### 205. Problems includes missing costs

Filter Problems and Select problems include blank-cost rows. The catalog briefing already did. A $0 target is not a filled shop.

### 206. Summary chips are the filter

Ads-safe, below, missing costs, and sale-break chips toggle the same pass as the toolbar. Click again to show all.

### 207. Search finds a listing ID

A Shop Manager listings file already carried the id. Type it in search.

### 208. Merge keeps gift wrap

An Etsy export with gift 0 does not wipe wrap you typed. A KeepFloor CSV with gift set wins.

## KeepFloor 1.52 — restore is a live replace

1.51 made Problems mean needs attention. 1.52 stops restore from reloading the page and from painting the open listing onto the file you just put back. Floors do not change.

### 209. A backup replaces the sheet you are looking at

Shop, listing, and catalog update in place. Recents still park the listing you left.

### 210. Restore drops the catalog write-back pointer

If you opened a row, then restored, that listing does not overwrite a restored row on leave.

### 211. Sparse backup rows become real rows

A missing quantity is one unit. The same normalize as a cleared-then-reloaded catalog.

## KeepFloor 1.53 — restore shows the shop you put back

1.52 replaced the data. 1.53 stops a Problems filter or a stale Recents strip from making that look like a no-op. Floors do not change.

### 212. A restored catalog shows every listing

Filter and search clear. Sort stays. You are not staring at an empty pass of a full shop.

### 213. Recents chips update with the park

The listing restore parked is on the strip immediately, not after the next autosave.

## KeepFloor 1.54 — the Labs family look

1.53 made restore show the shop you put back. 1.54 changes how KeepFloor looks, not what it does, so it sits with the other products on labs.johnjayasankar.com. Floors do not change.

### 214. Inter and IBM Plex Mono ship with the app

Source Serif 4 and Avenir Next are gone. Inter sets the words; Plex Mono sets money, labels, and keys. The fonts are bundled into the build, so the page no longer loads anything from Google Fonts. Tabular figures stay on mono text, because Inter's tabular set also widens the hyphen.

### 215. Porcelain, forest, and rust

The ground is the family porcelain with a faint dot grid. What you keep is forest; what a fee or a sale takes stays rust. Buttons, segmented controls, nav, chips, and badges are pills. Panels, stats, the toolbar, and dialogs are rounded cards. Table headers and group labels are small mono capitals.

### 216. Controls fit what they hold

The command palette and confirms size to their content instead of running to the bottom of the screen. The catalog filter sizes each pill to its label, so Breaks on sale stays on one line. A checked catalog row is marked once at its left edge, not at every cell.

### 217. A mark, a preview card, a credit

The favicon and the header mark share one forest tile. A shared link shows a preview card. The footer credits John Jayasankar and links to Labs.

## Still out of scope

Etsy OAuth, ads bidding, Shopify, accounts, cloud sync, tax filing, “official Etsy” branding.
