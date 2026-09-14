# Product specification — KeepFloor

## Name and positioning

**KeepFloor** — the Etsy list price that still pays you after every published fee, including Offsite Ads.

Not affiliated with Etsy.

## Primary job

Given a listing’s price or a profit target, show:

1. Fee lines using the published stack  
2. Profit after the seller’s costs  
3. Organic price floor  
4. Offsite Ads–safe price floor (15% case, cap applied)

## Customer

An Etsy seller about to publish or repricing a listing, especially a low-priced physical or digital item, who has been surprised by Offsite Ads or stacked fees.

## Journey

1. Open the site.  
2. Pick bank country, ads case, and charm rounding. Enter price, shipping, costs, target.  
3. Read keep / organic floor / ads-safe floor / max sale %.  
4. Compare organic, 15%, 12%, free shipping, and free+ads.  
5. Optionally apply the ads-safe or survive-all floor, copy a briefing, or share a link.  
6. Name the listing; recent worksheets reopen on this device.  
7. If they have many listings, buy Catalog ($19). Provider emails receipt + file/key.  
8. Drop an Etsy or KeepFloor CSV (replace, append, or merge by SKU), fill blank costs, apply floors, export a reprice file.  
9. Check quantity-break floors and sale-stress before a shop sale or a multi-unit discount.  
10. Set the ads mix for expected keep. ⌘K for commands. Download a local backup before you clear the browser.  
11. Compare stay vs free-over-$N before you join Etsy’s free shipping program.  
12. Replay a payment-account sale. Undo restores shipping. Open a catalog row and come back.  
13. Compare this listing with a recent. Treat a payment reserve as cash held, not a fee.  
14. Read charm tax. Pin the listing you compare against. Apply catalog floors only where the list is not already safe; export the rows you checked. `?` for keys.  
15. Before upload: copy the apply receipt. Before a shop sale: filter lists that break when the sale turns on. Catalog undo is five deep.  
16. The shell stays in view. Actions are grouped. Unknown hashes do not silently become the calculator.  
17. Confirms stay in the paper overlay. Rates sit in the shell. An empty catalog says what to drop.  
18. A catalog hash restores filter, sort, search, and sale %. A pinned recent opens the versus table.  
19. The catalog bar says how many you are looking at. Empty offers the next file. Back and Catalog reopen the same pass.  
20. ⌘K disables the other page’s actions. Escape shows all catalog rows. The shell height is the real header.  
21. Copies say if they failed. Compare cannot point at a removed recent. Catalog money edits undo. Legal pages have a way back.  
22. The calculator hash is the listing. Calculator in the nav opens the worksheet you left.  
23. Status is one dismissible toast. The phone dock honors the notch.  
24. A render error stays on paper. Downloads are not revoked before Safari starts them.  
25. A sample or another recent parks the current listing first. The recent you are on does not rewind.  
26. Reset parks first. The sample you are already on does not reload.  
27. The address bar and the shell links stay on the listing or catalog pass you are on.  
28. Recents flush when you leave. A catalog row parks first. The header clears the notch.  
29. $32 and $32.00 are the same listing. Opening that catalog row keeps worksheet extras.  
30. Opening a recent or sample replaces the worksheet. Restore parks first. Notes travel in the hash.  
31. A different listing in the address bar boots clean. The same listing keeps extras the URL does not carry.  
32. Statement lines, deposit, and fee overrides travel with the listing. Price history flushes on leave.  
33. The catalog crumb is only the row you opened. The landscape notch clears the worksheet.  
34. Print names the listing floors or the catalog pass. An error sheet can open the saved listing.  
35. A printed sheet cites the rate date. ⌘K prints the calculator or catalog.  
36. Print waits until overlays close. Copy catalog view is disabled off the catalog.  
37. ⌘K copies the listing link. Undo stays on the calculator or catalog. The palette clears the notch.  
38. Calculator keys wait for the overlay. Empty undo tells the truth. ⌘P prints the sheet. Help teaches the product.  
39. Catalog commands wait for unlock. Open calculator disables on the calculator. Reset and Fill blanks are commands.  
40. Sandbox stays in the tab. Buy, Show all, and Dedupe are commands.  
41. Help and legal Back return to the calculator or catalog you left.  
42. `/` shows the calculator form if Focus is on, then focuses list price.  
43. Restore sample asks before it replaces a live catalog. Sample and add row are commands.  
44. Replace asks before a file or paste wipes listings already on this device.  
45. An empty catalog can add a blank row. Import folds once listings exist. Privacy, Terms, and Refunds are commands. Thanks offers the calculator you left.  
46. Clear catalog and delete selected ask before a wipe. Fill does not rewrite costs that are already the defaults. Copy catalog view waits for unlock.  
47. Catalog keys wait for unlock. Delete and Backspace match Del. ⌘K copies the live catalog pass.  
48. A CSV drops on the live catalog even when import is folded. Import catalog file is a command.  
49. ⌘V pastes a catalog CSV when you are not typing. A bad import opens the sheet and says why.  
50. Reprice, catalog, and Etsy price CSVs are commands. Select problems is a command. Empty export tells the truth.  
51. Add row reveals a hidden pass and focuses the name. Name and SKU commit on blur and undo.  
52. Catalog rows edit quantity, buyer shipping, and postage. Quantity is at least one.  
53. Postage is not a filled cost. Fill blanks keeps typed postage. Apply floors skips a row with no COGS or target.
54. Clear catalog stays empty after reload. Open calculator writes the listing back. Duplicate reveals the copy.
55. Catalog rows edit gift wrap, pack, and labor. Hours survive only while they match that labor. Focus stays in the tab. Help does not claim a catalog save.
56. Problems includes missing costs. Summary chips toggle the pass. Search finds a listing ID. Merge keeps gift wrap.
57. Restore replaces the live sheet without a reload. The open listing does not write back onto the restored catalog.
58. Restore shows every catalog listing and refreshes Recents at once.

## Pricing

| Offer | Price | What |
| --- | --- | --- |
| One listing | $0 | Full accuracy, no account |
| Catalog | $19 once | Many rows, CSV, print/export |

Not a subscription. Continuing value is reuse + fee-table updates we can ship as a static file.

## Architecture

Static Vite + React + TypeScript. All math in `src/engine`. No backend. No card data. Checkout URL lives in `public/checkout.json` after the owner pastes a Polar or Gumroad link.

## Out of scope

Etsy API sync, ads bidding, tax filing, “Etsy official” branding, accounts, inventory, shipping labels.
