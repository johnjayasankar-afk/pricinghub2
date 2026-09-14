# Launch and payment checklist

Do not create accounts or spend money until you authorize the matching line.

## Already done (no owner)

- [x] Product named and specified  
- [x] Fee engine + tests against official US worked example  
- [x] UI for one listing, catalog, help, privacy, terms, refunds, sources  
- [x] Sandbox payment simulator (`#/pay?sandbox=1`)  
- [x] Polar/Gumroad research from official pages  
- [x] Marketplace listing drafts (not posted)  
- [x] Economics and experiment definitions  

## Owner actions — batch A (about 25 minutes)

Do these only when you want sandbox payments.

1. **Create a Polar sandbox user and organization** at https://sandbox.polar.sh (~8 min). Separate from production.  
2. **Create product** “KeepFloor Catalog”, one-time **$19 USD**. Attach a File Download benefit: zip of `dist` plus `docs/fulfillment/BUYER.txt`. Optional: license-key benefit.  
3. **Copy the checkout link** into `public/checkout.json` as `polarCheckoutUrl`. Add `supportEmail`. Leave `polarApiBase` as `https://sandbox-api.polar.sh` for sandbox; switch to `https://api.polar.sh` only for production. (~3 min)  
4. **Set Polar success URL** to the deployed `#/thanks` (or local `http://127.0.0.1:4173/#/thanks`). Access is **not** granted by that page.  
5. **Pay with test card** `4242 4242 4242 4242` (Polar sandbox docs). Confirm email (sandbox mail only goes to org members). (~5 min)  
6. **Refund the sandbox order** in Polar to confirm the reverse path. (~3 min)

Cost: $0. No live charge.

## Owner actions — batch B (about 35 minutes, after you authorize live selling)

1. Create a **production** Polar org at https://polar.sh. Complete identity, tax, and payout details Polar asks for. I will not fill these in or accept agreements for you.  
2. Recreate the $19 product and file benefit. Paste the **production** checkout URL into `checkout.json`.  
3. Apply for Polar production approval if their dashboard still requires it (third-party reports mention delay; confirm in-product).  
4. Authorize a **static host** (Cloudflare Pages or equivalent free tier) and a domain only if you want one.  
5. Optional backup: Gumroad product, same file, $19. Discover takes 30%.  
6. Optional: Etsy digital listing ($0.20 listing fee + possible one-time shop set-up fee **shown at onboarding**). Do not list until you authorize that spend.

## Never without a separate yes

- Live card charge, live refund, payout withdraw  
- Publishing the site, ads, emails, community posts, marketplace listings  
- Buying a domain, paid Polar plan, or Etsy shop set-up  

## Payment-to-delivery (live)

1. Offer and $19 shown on `#/pay`.  
2. Customer pays on Polar (MoR).  
3. Polar records the order and emails receipt + file/key.  
4. KeepFloor does not grant access because a browser opened `#/thanks`.  
5. Customer downloads the file or pastes the key.  
6. Abandoned checkout delivers nothing.  
7. Lost email: help page + support address.  
8. Refunds: 14 days for a catalog that cannot read a valid template CSV, via Polar.  
9. Reconcile Polar export vs local notes monthly.  
10. Payout to the verified account Polar/Stripe support for your country.
