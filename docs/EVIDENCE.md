# Evidence ledger

Access date for all rows: **2026-09-04**. Do not treat search chatter as revenue.

| Claim | Source | What it actually establishes | Kind | Uncertainty | Next experiment |
| --- | --- | --- | --- | --- | --- |
| Etsy listing fee is $0.20 USD; transaction fee is 6.5% of displayed price + shipping + gift wrap | https://www.etsy.com/legal/fees/ | Official fee mechanics | Direct | Policy can change | Re-read policy when Etsy announces fee changes |
| Offsite Ads: 15% under $10k trailing sales (opt-out available); 12% and mandatory after; fee on attributed orders; $100 USD cap per order | https://www.etsy.com/legal/fees/ and https://help.etsy.com/hc/en-us/articles/360000338367-How-Etsy-s-Offsite-Ads-Work | Official ads-fee mechanics | Direct | Help page was behind Cloudflare in one fetch; policy text was retrieved | Keep policy URL as source of truth |
| US processing is 3% + $0.25; UK 4% + £0.20; table by bank country | https://www.etsy.com/legal/etsy-payments §9.B | Official processing table | Direct | Domestic vs international rows for CA/AU/NZ | Let users override |
| Currency conversion 2.5% when listing currency ≠ payment-account currency | Fees policy + Payments policy §9.C | Official FX fee | Direct | Market FX rate is separate from the 2.5% | Toggle in UI |
| Regulatory operating fee percentages by country | https://help.etsy.com/hc/en-us/articles/1500011073202-What-is-a-Regulatory-Operating-Fee | Official country list (Canada 0.50%, France 1.14%, Hungary 1.97%, Italy 0.80%, India 0.05%, Spain 0.88%, Türkiye 1.67%, UK 0.48%, Vietnam 1.24%) | Direct | Rates reviewed annually (community post on June 2026 changes) | Editable rates |
| People list paid Etsy fee/profit worksheets on Etsy | https://www.etsy.com/listing/4434905011/etsy-profit-calculator-spreadsheet-o-fee and similar listings | Sellers *offer* paid worksheets | Indirect | No verified sales or review counts captured | Marketplace listing test after authorization |
| Many free Etsy fee calculators exist | sellerfeecalc.com, etsyfeecalc.org, payoutmath.com, Craftybase | Free single-sale calculators are common | Direct | Does not prove $0 WTP for catalog/reverse-price | Measure CTA clicks on our free tool |
| ProperConvert is $19.99/mo or $179.99/yr | https://www.propersoft.net/purchase/ | Bookkeepers pay for statement conversion | Direct (other market) | Not Etsy sellers | Not used as KeepFloor demand proof |
| MoneyThumb Online from $24.95/mo for 5 conversions | https://www.moneythumb.com/quickbooks-converters-benefits/ | Paid bank-statement conversion | Direct (other market) | CSV-only is being given away free | Rejected as our product |
| Free in-browser CSV→QBO tools exist | https://qbofile.com/ | CSV→QBO is commoditized | Direct | Paid PDF/OCR may remain | Do not build QBO |
| RCReports owner report $499; firm plans from $1,500/yr | https://rcreports.com/pricing-ng/ | Strong WTP for S-corp salary reports | Direct | High-stakes tax product | Rejected |
| ChatXport $29 / $69 one-time, $9 web; 300-message free tier | https://www.chatxport.com/ | People are asked to pay for local chat viewers | Direct (other market) | Crowded | Runner-up only |
| Polar Starter: no monthly fee; 5% + 50¢ per transaction; MoR; sandbox at sandbox.polar.sh; file downloads; license keys | https://polar.sh/resources/pricing https://polar.sh/docs/merchant-of-record/fees https://polar.sh/docs/integrate/sandbox https://polar.sh/docs/features/benefits/file-downloads | Current Polar commercial terms | Direct | Polar can change fees; payouts use Stripe’s payout fees | Owner creates sandbox org |
| Gumroad: 10% + $0.50 direct; 30% Discover; MoR since 1 Jan 2025 | https://gumroad.com/pricing | Alternate MoR + marketplace | Direct | Discover take-rate is high | Backup channel |
| Polar does not refund its transaction fee on refunds; disputes $15 | Polar fees docs | Refund economics | Direct | — | Use 14-day refund only for product defects |
| Etsy shop set-up fee may apply and is shown at onboarding | https://www.etsy.com/legal/fees/ (Set-Up Fee) | Opening an Etsy shop can cost money; amount not fixed on that page | Direct | Amount unknown until onboarding | Do not open an Etsy shop until authorized |

**Not claimed:** keyword volumes, conversion rates, competitor revenue, “sellers will pay,” or that KeepFloor is already earning.
