# KeepFloor

Browser worksheet for the Etsy list price that still pays you after published seller fees, including Offsite Ads.

v1.54 restyles KeepFloor in the Labs family look: Inter and IBM Plex Mono served from the app, porcelain and forest, pill controls and rounded cards. The math, the flows, and what stays on the device are unchanged.

Not affiliated with Etsy, Inc. No live payments are connected in this copy.

```
npm install
npm test
npm run dev
```

Sandbox unlock (no card): open `/#/pay?sandbox=1` and use **Simulate successful payment**.

## GitHub + Vercel

This folder is the app root (`package.json` and `vercel.json` live here).

1. Create an empty GitHub repo. Upload these files (or `git init` here and push). Do not nest them inside another `keepfloor` folder.
2. In Vercel: **Add New Project** → import that repo. Framework is Vite. Build `npm run build`, output `dist`. No env vars required.
3. `public/checkout.json` has empty payment URLs. The live site will not charge a card. Sandbox unlock is still `/#/pay?sandbox=1`.

Records: `docs/`.
