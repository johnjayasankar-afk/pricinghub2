# Test results — 4 September 2026

## Passed

| Check | Result |
| --- | --- |
| `vitest run` in `venture/keepfloor` | 101/101 tests |
| US $50 + $5 shipping | listing 20¢, transaction 358¢, processing 190¢, total 568¢, net 4932¢ |
| Offsite Ads 15% on that sale | +825¢; $900 item hits $100 cap |
| Processing includes buyer tax; transaction does not | Matches Payments Policy §9.A–B vs Fees policy |
| Floor solver | Lowest cent that meets target; ads floor > organic |
| CSV template parse / empty file error | Pass |
| `tsc --noEmit` | Pass |
| `vite build` | Pass — 338 kB JS gzip 102 kB |
| Invalid / zero prices | Fees and net stay 0; no throw |
| `#/thanks` does not grant catalog | Grant only via sandbox button, sandbox key, or Polar key check |
| Live pay buttons | Hidden until `checkout.json` has a URL |

## Failed

None in the local engine or build.

## Untested here

| Check | Why |
| --- | --- |
| Polar sandbox card `4242…` | Needs your Polar sandbox org |
| Polar production, payouts, refunds | Needs identity + authorization |
| Gumroad / Etsy listing live | Not published |
| Browser layout on a phone | No browser tool in this session; CSS has a 800px breakpoint |
| Polar license API CORS from the browser | May fail; file download is the reliable fulfillment |
| Duplicate Polar webhooks | No server webhook |

Improve next only if a buyer hits them: Polar file zip, phone pass, statement-matched fee override UX.
