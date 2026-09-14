# Economics model — KeepFloor

All figures are **planning scenarios**, not forecasts. Inputs are labeled.

## Offer and assumed inputs

| Input | Conservative | Base | Optimistic | Label |
| --- | --- | --- | --- | --- |
| Price | $19 | $19 | $19 | Set |
| Monthly units | 2 | 8 | 25 | **Assumed** |
| Discount | 0% | 0% | 0% | Set |
| Refund rate | 10% | 5% | 3% | **Assumed** |
| Polar fee (Starter) | 5% + $0.50 | 5% + $0.50 | 5% + $0.50 | Official |
| Intl card surcharge | 0% of sales | 20% of sales × 1.5% | 30% × 1.5% | **Assumed mix** |
| Hosting | $0 | $0 | $0 | Static / free tier |
| Domain | $0 | $0 | $0 until authorized | |
| Ads | $0 | $0 | $0 | |
| Owner hours / month after stable | 1 | 1 | 1 | **Target, unproven** |

Polar VAT collected from the buyer is **not** business income. It is remitted by Polar.

Stripe payout fees (Polar docs): $2/month when payouts are active + 0.25% + $0.25 per payout, plus cross-border FX 0.25–1%. Modeled only in the payout row.

## Unit economics (one $19 US-card sale, no refund)

- Polar: 0.05 × 19 + 0.50 = **$1.45**  
- Polar does not add a separate processing line on Starter beyond that headline (international +1.5% if non-US card → +$0.29).  
- Contribution before payout fees, refunds, and owner time: **$17.55** (US card) or **$17.26** (intl card).  
- Contribution margin: **~92%** US / **~91%** intl.

If Gumroad Discover is used instead: 30% of $19 = $5.70 plus whatever processing Gumroad includes in that take. Worse unit economics; only as a traffic experiment.

## Monthly scenarios (Polar Starter, 5% refunds in base)

| | Conservative | Base | Optimistic |
| --- | --- | --- | --- |
| Gross sales | $38 | $152 | $475 |
| Refunds (cash out) | $3.80 | $7.60 | $14.25 |
| Polar fees on charged sales (approx, US cards) | $2.90 | $11.60 | $36.25 |
| Hosting | $0 | $0 | $0 |
| Operating profit before owner income tax | **~$31** | **~$133** | **~$425** |
| Polar payout drag if one payout | ~$2.30 | ~$2.70 | ~$3.50 |
| Cash after one payout (approx) | **~$29** | **~$130** | **~$421** |

Low-sales case (0 units): **−$0** cash if nothing is deployed to paid infra. Time only.

## Sales needed for illustrative operating profit

Using **$17.00** contribution per net sale (fees + a reserve for one refund in twenty).

| Monthly operating profit | Net sales | Gross sales if 5% refund | Qualified calculator uses if 2% buy (**assumed**) |
| --- | --- | --- | --- |
| $100 | 6 | 7 | 350 |
| $500 | 30 | 32 | 1,600 |
| $1,000 | 59 | 62 | 3,100 |

The 2% close rate is an **assumption**, not evidence. If the close rate is 0.3%, traffic need rises ~7×.

## Cash-flow timing

Polar: customer pays → Polar holds as MoR → owner withdraws to a verified account (Stripe payout schedule + Polar manual withdraw). First payout requires identity and bank verification. Not instant.

## Taxes

Polar/Gumroad handle many **sales** taxes as merchant of record. They do **not** remove income-tax, self-employment, or local business registration duties. Sales tax Polar remits is not to be booked as KeepFloor revenue.
