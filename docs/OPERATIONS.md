# Operations runbook

Target after stabilization: **under 60 minutes / month**. That is a design goal, not a measured fact. Startup (Polar + deploy) is separate.

| Task | Frequency | Minutes | Automation | Exception |
| --- | --- | --- | --- | --- |
| Re-read Etsy Fees + Payments pages | When Etsy announces a change; else quarterly | 20 | Calendar reminder (you set) | Update `profiles.ts` + tests + sources page |
| Polar payout / reconcile | Monthly if sales > 0 | 10 | Polar dashboard | Mismatch → export CSV, do not guess |
| Support email | As received | 5–15 | Templates in Help | Refund via Polar if within policy |
| License recovery | As received | 5 | Polar customer portal | If Polar outage, resend file |
| Hosting / TLS | Continuous | 0 | Static host | Host outage → local file still works for buyers who downloaded |
| Cost alerts | n/a at $0 infra | 0 | None | If any paid API is added later, cap it before enable |
| Backup of engine + checkout.json | After each edit | 2 | Git | — |

Notify the owner only for: required account action, payment-provider suspension, fee-policy change that ships wrong numbers, or first real sale.

This session does **not** install a hosted cron. Nothing continues running after the chat unless you deploy and set your own reminders.
