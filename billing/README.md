# AsiaVerify · Billing & Subscription (PLG Phase 2)

Clickable prototype of the Portal's billing flow: active plan, cancellation (confirm → retention offer → reason survey → all set), cancelled-but-active state, reactivation, no-subscription state, and the Products & Pricing plan page with plan comparison and report credits by region.

React 19 + TypeScript + Vite. No backend; all data is mocked.

```bash
npm install
npm run dev
```

## Structure

- `src/styles/tokens.css` — generated from *AsiaVerify Colour Tokens.html* (light + dark). Don't hand-edit; regenerate from the sheet.
- `src/components/shell` — the navy Portal shell (top bar, sidebar, mobile drawer).
- `src/components/ui` — Button, Dialog (native `<dialog>`), Badge, Switch, InfoTip, Notice, Tabs, Toaster.
- `src/features/billing` — Billing page, history tabs, and the cancel/reactivate flow (one dialog that reshapes per step).
- `src/features/plans` — plan cards, plan-change confirmation, comparison tables.
- `src/features/dev/PrototypeControls.tsx` — demo-only switcher (Active / Cancelled / No plan, Monthly / Yearly). Remove before production.
- `src/state` — billing reducer and UI context (hash routing `#/billing`, `#/plans`, theme, toasts).

## Placeholder data to replace

- Plan prices and credits (`src/data/plans.ts`) come from the mockups.
- Report credits by region (`src/data/regions.ts`) are invented figures.
- Invoices, usage rows and entity names (`src/data/history.ts`) are synthetic.
- Stripe, invoice download, support and other nav items show a "not connected" toast.
