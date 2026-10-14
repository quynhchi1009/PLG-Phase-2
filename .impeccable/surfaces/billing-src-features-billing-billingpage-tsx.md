---
version: 1
slug: "billing-src-features-billing-billingpage-tsx"
primary_target: "billing/src/features/billing/BillingPage.tsx"
related_targets: ["billing/src/features/plans/PlansPage.tsx"]
---

# Billing & Subscription (PLG Phase 2, current flow)

Scope: My Plan > Billing (active, cancelled-active with credits > 0 and = 0, inactive), the three-step cancel dialog, and Products & Pricing (plan estimator + plan cards). Mode: Operate.

Audience and job: self-serve account owners checking plan, credits and usage; changing plan; cancelling; resubscribing after a plan lapses.
Constraints: extends the established AsiaVerify Portal world recorded in DESIGN.md (navy chrome, Registry Green interactions, Pale Ledger Tint for recommendation). Rebuilt from the user's current flow mockup; screenshot colours are NOT authoritative, DESIGN.md is. Precisely specified, so no concept round. Code-led (no image generation).

## Direction contract

THESIS: Billing as a quiet, exact ledger inside the portal shell. Cancellation is one honest conversation in a single dialog that reshapes per step, and lapsing is framed by what the customer keeps and the date it ends. This refuses both the retention maze and the vague "your plan has ended" dead end.
OWN-WORLD: DESIGN.md "Quiet Ledger". Navy gradient chrome, white hairline cards on Floor Grey, Registry Green for actions, money and checks. Pale Ledger Tint and Mint Hairline mark the featured yearly plan, the recommendation panel and good-news tiles. Sentiment-warning elevated marks retention deadlines. Roboto for money and headings, Open Sans for UI, tabular numerals throughout.
STORY: The customer sees their plan (Growth), its price and credits, and exactly when credits reset. They can cancel in three steps, with consequences stated in dates (pKYB stop date, report deletion date). After cancelling they are told when new plans unlock. On Products & Pricing they can estimate usage and get a recommended plan.
FIRST VIEWPORT (billing): Shell with an expanded My Plan group (Billing current, Top up). Unruled page head. A two-card row: Growth card (Active badge, $99 /billed monthly | 267 credits included, breakdown, quiet Cancel subscription link) and Settings card (next billing date + Change plan; credit balance figure with "Resets <date>" and a meter). The history card (Usage history default) follows.
FIRST VIEWPORT (plans): Estimator card (Jurisdiction and Information scope multi-selects, reports-per-year slider) beside a recommendation panel that turns from a 3-step checklist into a recommended plan. "Choose your plan" follows with three cards; the yearly card is featured.
FORM: Inherited portal form from the user's mockups (established world, extension). No seed key; concept-seed was not run because the request is precisely specified.
SIGNATURE INTERACTION: the cancel dialog keeps one modal open and animates its width between steps (560 → 440 → 560px) while content re-enters. Secondary: the estimator's recommendation panel resolves live and "Show me this plan" scrolls to and rings the recommended card.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
