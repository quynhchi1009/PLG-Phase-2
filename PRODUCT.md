# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TypeScript + Vite (user's choice). Plain CSS with custom properties generated from the AsiaVerify colour token sheet; no CSS framework.

## Users

Compliance, KYB and onboarding teams at organisations doing business in Asia, using the self-serve (product-led growth, "PLG") tier of the AsiaVerify Portal. On this surface they are account owners or admins managing what their organisation pays for: checking the plan, credit balance and invoices, changing plan, or cancelling and reactivating. *(Inferred from the PLG billing flow; not yet confirmed with research.)*

## Product Purpose

AsiaVerify gives access to 340M+ corporate records from official Asian registries, used to generate KYB, AML and UBO reports and monitor entities. PLG Phase 2's billing surface lets self-serve customers manage their subscription without contacting sales: see the active plan and next billing date, track the credit balance, toggle auto top-up, update the payment method, browse usage and subscription history, change plan, and cancel or reactivate. Success means customers who cancel do so deliberately and informed, and those who would stay (or move to a better-fit plan) are given a clear, honest path to do so.

## Positioning

Registry-sourced corporate data across Asian jurisdictions, priced by credits: one subscription buys report credits that work across any report type.

## Operating Context

- Lives inside the AsiaVerify Portal shell: navy top bar and sidebar shared by every product (pKYB, Products & Pricing, My Plan, API Key, MCP, Account Settings).
- Plans in the current flow: Flex, $249 one-time for 623 credits that never expire (one manual top-up); Growth (billed monthly) $99/month with 267 credits/month; Growth (billed yearly) $999/year ($83.25/month) with 3,047 credits/year; Business (sales-led, volume pricing). Figures come from the design mockups and are placeholders until confirmed by product.
- Customers can top up credits anytime before a billing cycle ends (My Plan > Top up).
- Payments are processed through Stripe; AsiaVerify does not store card details.
- Cancellation is end-of-cycle: the plan stays active until the current billing cycle ends. There is no reactivation; a cancelling customer chooses a new plan, which becomes available when the current plan ends or its credits run out.
- After a plan ends, historical reports stay accessible for 90 days and are then permanently deleted. Perpetual KYB monitoring stops when the plan ends.

## Capabilities and Constraints

- Billing flow states: active; cancelled but active with credits remaining (new plans locked); cancelled but active with 0 credits (new plans selectable); inactive (lapsed, 90-day report retention).
- Cancellation path (3 steps, kept deliberately to ease the decision): (1) "Are you sure you'd like to cancel?" lists dated consequences before anything is committed (active until cycle end, no further charges, remaining credits usable until then, Perpetual KYB stops, reports kept for 90 days then deleted); (2) "Don't leave just yet" retention offer, where "Cancel anyway" commits; (3) "Plan cancelled" receipt. After cancelling, the billing page shows an amber "Ends <date>" badge, "Your current plan will end on: <date>", a yellow (warning) "Subscription cancelled" notice, "Changed your mind?" with Choose a plan, and a Subscription history row.
- Upgrade page: a plan estimator (jurisdictions by tier, information scope, reports per year) recommends a plan; plan cards (Flex, Growth with a monthly/yearly toggle, Business); a feature comparison; report credit rates by jurisdiction tier (Tier 1–3); FAQ; and a "Confirm plan & terms" step requiring Privacy Policy and Terms acceptance before payment.
- Upgrade only, no downgrades: Flex → Growth (monthly or yearly) or Business; Growth monthly → Growth yearly or Business; Growth yearly → Business. After a cancellation, once new plans unlock, any plan can be chosen.
- Upgrades carry unused credits into the new plan ("Unused credits from current plan", "Rolled over from Flex plan").
- Top-ups: Flex includes one top-up (623 credits for $249, never expire); Growth includes unlimited top-ups (prototype assumes 267 credits for $99, expiring at the end of the billing cycle; to be confirmed).
- When a report needs more credits than remain, the report page offers: Flex with top-up left → "Upgrade or top up your plan"; Flex without → upgrade to Growth yearly; Growth monthly → upgrade to yearly or top up; Growth yearly → Business (talk to sales) or top up.
- A Flex customer at 0 credits who presses Top up now on Billing first sees "Upgrade or top up your plan" (Growth, Save up to 22%; View upgrade options / Top up instead); only "Top up instead" continues to Stripe. With credits left, Top up now goes straight to Stripe.
- Flex customers who are out of credits, or have used their top-up, see a portal-wide banner prompting a top-up or upgrade.
- Payments hand off to Stripe Checkout and return to Billing with a success dialog ("Plan activated" / "N credits added!"). The prototype simulates this with its own sequence: redirect screen → checkout page (order summary, pre-filled test card, no card entry) → processing → success → Billing. "Back to AsiaVerify" cancels without charge.
- Current build is a clickable prototype with mocked data; no billing API is wired.
- Credit rates by tier (src/data/pricing.ts) are transcribed from the mockup; the estimator's scope-to-report mapping and the report-type tooltip descriptions are authored and need product confirmation.

## Brand Commitments

- AsiaVerify colour token sheet (`~/Documents/AsiaVerify/AsiaVerify Colour Tokens.html`) is the colour source of truth, light and dark modes. In code, token `content.main` is `--color-content-main`.
- Type: Roboto for every heading; Open Sans for all other text, figures and prices included (from the token sheet).
- Portal chrome: navy gradient shell (navy-700 → navy-900 → navy-950), "Asia" in the logo set in chrome accent green.
- Primary interactive green `#00735F`.

## Evidence on Hand

- Billing flow mockups (PLG Phase 2 flow image, 12 frames).
- Specs exist as PDFs in `~/Documents/AsiaVerify/` (PLG Top-Up, Upgrade, Downgrade & Cancellation; Billing Phase 1 Package Logic); not yet transcribed.
- No real customer data, testimonials or usage figures; all table rows and balances in the prototype are synthetic.

## Product Principles

1. Cancellation is never a trap: every retention step has a visible way through, and the consequences are stated plainly.
2. Money and dates are exact: amounts, billing dates and cycle-end dates are always shown in full.
3. Billing is a quiet task inside the portal; it inherits the shell and does not compete with it.
4. Data limitations are framed as registry-level restrictions, not product limitations.

## Accessibility & Inclusion

WCAG 2.2 AA. The token sheet's contrast checks (4.5:1 text, 3:1 UI edges) are binding in both modes.
