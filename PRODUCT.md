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
- Plans in the current flow: Flex, $249 one-time for 623 credits that never expire (one manual top-up); Growth (billed monthly) $99/month with 535 credits/month; Growth (billed yearly) $999/year ($83.25/month) with 6,094 credits/year; Business (sales-led, volume pricing). Figures match the PRD (`docs/PRD-billing-phase1.md`).
- Customers can top up credits anytime before a billing cycle ends (My Plan > Top up).
- Payments are processed through Stripe; AsiaVerify does not store card details.
- Cancellation is end-of-cycle: the plan stays active until the current billing cycle ends. Until the cycle ends, a cancelling customer can reactivate: the same plan, credits and Perpetual KYB continue, nothing is charged at that moment, and the plan renews on its original date. Choosing a different plan becomes available when the current plan ends or its credits run out.
- After a plan ends, historical reports stay accessible for 90 days and are then permanently deleted. Perpetual KYB monitoring stops when the plan ends.

## Capabilities and Constraints

- Billing flow states: active; cancelled but active with credits remaining (new plans locked, reactivation available); cancelled but active with 0 credits (new plans selectable, reactivation available); inactive (lapsed, 90-day report retention; reactivation no longer possible, a new plan must be purchased). A plan lapses either because the customer cancelled or because a renewal payment failed (auto-cancelled).
- Lapsed Billing page: one centred card, "Pick up right where you left off" (cancelled) or "We couldn't renew your subscription" (payment failed), with "Your subscription was cancelled on <date>[ after payment couldn't be processed]. Purchase a plan again to continue accessing our services.", three equal outlined boxes (Full verification suite; Full flexibility; Your report history with the 90-day deletion date) and Choose a plan. A failed renewal also logs "Payment failed · subscription cancelled" in Subscription history.
- Re-subscribing after a failed payment (Growth Plan: Auto-cancelled flow): Choose a plan → Choose plan page → "Plan confirmation" ("You're subscribing to the **Growth** plan"; the upgrade-style card with the Monthly ⟷ Yearly switch, Growth perks, "<plan> $99.00 = 535 Credits", "Total credits after renewal"; credits start fresh, no rollover; no terms checkboxes) → Confirm and pay → Stripe → Billing with "Plan activated · You successfully subscribed to <plan>!". A customer who cancelled voluntarily still goes through "Confirm plan & terms".
- Cancellation path (3 steps, kept deliberately to ease the decision): (1) "Are you sure you'd like to cancel?" ("Cancelling your plan would mean losing access to these features you currently enjoy") shows a white card, "Stay subscribed to retain your perks", with three perks whose key phrases are bold, then Keep current plan (primary) and Continue to cancel (link), both inside the card; the dated consequences now appear only in the step 3 receipt; (2) "Don't leave just yet" retention offer ("You could be missing out on better savings!", Explore other plans / Cancel anyway; the perks are not repeated here, since step 1 shows them), where "Cancel anyway" commits; (3) "Plan cancelled" receipt. After cancelling, the billing page shows an amber "Ends <date>" badge, "Your current plan will end on: <date>", a yellow (warning) "Subscription cancelled" notice, "Changed your mind?" with Choose a plan, and a Subscription history row.
- Reversing a cancellation ("reactivate"): offered in three places, all before the cycle ends. (1) The "Plan cancelled" receipt leads with **Reactivate subscription** (primary), then **View plans & pricing** (secondary), plus the dialog's close icon; a green strip above the actions says "You can reverse the cancellation any time before your current billing cycle ends." (2) Billing's "Changed your mind?" section ("You can reverse the cancellation any time before your current billing cycle ends.") offers Reactivate subscription (primary) and Choose a plan (secondary). (3) On Choose plan, the cancelled plan's own card shows "Reactivate this plan". Reactivating needs no Stripe checkout. It shows a "Don't miss out on your plan benefits" dialog ("Reactivate your subscription to continue enjoying your current plan benefits.") listing what the customer keeps by staying, with figures from the Choose plan page: Growth yearly: 22% discount on report unit costs, uninterrupted access all year, effective $83.25/month vs $99/month monthly; Growth monthly: 8% discount, uninterrupted access every month, 535 credits every month. Its **Reactivate subscription** button confirms (closing it changes nothing); the dialog then shows "Subscription reactivated" (renewal date and price) with Go to my plan, returns the page to the active state, and logs "Subscription reactivated" in Subscription history.
- Upgrade page: a plan estimator (jurisdictions by tier, information scope, reports per year) recommends a plan; plan cards (Flex, Growth with a monthly/yearly toggle, Business); a feature comparison; report credit rates by jurisdiction tier (Tier 1–3); FAQ; and a "Confirm plan & terms" step requiring Privacy Policy and Terms acceptance before payment.
- Upgrade only, no downgrades: Flex → Growth (monthly or yearly) or Business; Growth monthly → Growth yearly or Business; Growth yearly → Business. After a cancellation, once new plans unlock, any plan can be chosen.
- Upgrades carry unused credits into the new plan ("Unused credits from current plan", "Rolled over from Flex plan"); the (?) tooltip reads "Expires at your next renewal (<date>)", with the date being the new plan's first renewal (PRD: rolled-over credits expire with the next billing cycle). The Upgrade confirmation dialog: title, "You're upgrading from Flex to the **Growth** plan!" (for a same-plan billing change: "You're upgrading your Growth plan from monthly to **yearly billing**!"), a plan card (name, price / period, Monthly ⟷ Yearly · Save 22% switch for Flex customers, Growth perks with circled ticks), then the ledger ("<plan> $99.00 = 535 Credits", rolled-over line in green, divider, "Total credits after upgrade") and Confirm and pay. No terms checkboxes on upgrades; they remain on new purchases.
- Top-ups: Flex includes one top-up (623 credits for $249); Growth includes unlimited top-ups (prototype assumes 535 credits for $99, expiring at the end of the billing cycle; to be confirmed).
- Credit expiry display: every plan's balance reads "Resets <date>". Flex has no billing cycle, so the prototype shows its balance resetting one day out (product direction, 15 Oct 2026). This departs from the PRD, which says Starter Pack/Flex credits never expire; the Choose plan page and FAQ still say "never expire" until product confirms.
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
- **PRD (source of truth for plan rules):** Billing Phase 1 Package Logic: PLG Top-Up, Upgrade & Cancellation, transcribed in `docs/PRD-billing-phase1.md`. It confirms the figures here (Starter Pack/Flex $249, 623 credits, no expiry, one top-up; Monthly $99, 535 credits, expire in 1 month; Yearly $999, 6,094 credits, expire in 12 months; upgrade only with rollover; 90-day report retention). It contradicts itself on reverse cancellation (summary table: allowed anytime; Parts 2–3: not allowed); the prototype follows the summary table.
- No real customer data, testimonials or usage figures; all table rows and balances in the prototype are synthetic.

## Product Principles

1. Cancellation is never a trap: every retention step has a visible way through, and the consequences are stated plainly.
2. Money and dates are exact: amounts, billing dates and cycle-end dates are always shown in full.
3. Billing is a quiet task inside the portal; it inherits the shell and does not compete with it.
4. Data limitations are framed as registry-level restrictions, not product limitations.

## Accessibility & Inclusion

WCAG 2.2 AA. The token sheet's contrast checks (4.5:1 text, 3:1 UI edges) are binding in both modes.
