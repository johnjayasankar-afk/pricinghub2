# Decision memo — KeepFloor

**Date:** 4 September 2026  
**Status:** Opportunity selected. Prototype complete. Public launch not authorized. No customer payments.

## Selection

Build **KeepFloor**: a browser worksheet that applies Etsy’s published seller-fee stack and solves for the lowest list price that still leaves a stated profit, including the Offsite Ads case.

Commercial hypothesis:

> Etsy sellers who price handmade or digital listings will pay $19 once for catalog pricing that computes an Offsite Ads–safe floor from Etsy’s published fees, because Offsite Ads (15% or 12%, $100 cap) can erase profit on cheap items, sellers already buy similar worksheets, and we can reach them through a working tool on a purchase-intent query plus a marketplace listing.

## Why this, not the runner-up

The runner-up was a **local WhatsApp export viewer/PDF**. Direct willingness-to-pay is stronger there: ChatXport lists $29 / $69 one-time (and $9 web), ChatExport lists $34.99, Print Chat lists $1.99 (vendor pages read 2026-09-04). That market is already populated by polished local apps that own the privacy story. A new entrant’s “why us” is weak, WhatsApp export formats and media ZIPs create support, and claiming “court-ready” would be reckless. KeepFloor is narrower, deterministic, and can be finished as a complete product in this session.

S-corp reasonable-compensation tools score well on price (RCReports $499 per owner report) and were **rejected** as a fatal fit: they are high-stakes tax products. The assignment forbids leaning on that class of advice.

CSV-to-QuickBooks converters have real prices (ProperConvert $19.99/mo; MoneyThumb Online from $24.95/mo) but free in-browser converters now exist. Paid demand is shifting to PDF/OCR, which raises cost and support.

## Scoring used (weights as specified)

| Candidate | WTP 25 | Dist 20 | Work 20 | Econ 15 | Speed 10 | Legal 10 | Total | Fatal? |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| KeepFloor (Etsy price floor + catalog) | 14 | 16 | 16 | 13 | 9 | 8 | **76** | No |
| WhatsApp local transcript | 20 | 16 | 10 | 13 | 6 | 6 | **71** | Crowded “why us” |
| Two-file money reconciler | 13 | 10 | 12 | 13 | 8 | 9 | **65** | Weak channel |
| S-corp RC estimator | 22 | 14 | 8 | 12 | 7 | 2 | **65** | Yes — tax advice |
| Contact CSV deduper | 11 | 12 | 10 | 12 | 7 | 9 | **61** | Dedupely owns CRM |
| CSV → QBO converter | 12 | 12 | 8 | 13 | 8 | 5 | **58** | Free tools + Intuit format |

Scores structure judgment. They are not market forecasts.

## What remains assumed

- Sellers who use a free one-listing tool will pay $19 for catalog. Listings on Etsy prove other people *offer* worksheets; they do not prove those listings sell.
- Search or a marketplace listing can reach enough qualified sellers without an audience or ads.
- Annual fee-table edits stay under an hour.
