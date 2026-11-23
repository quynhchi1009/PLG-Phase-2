---
target: critique the current billing and subscription page in version a (too many actions)
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/quynhchilai/PLG Phase 2/billing/src/features/billing/BillingPage.tsx"
target_fingerprint: "sha256:6c9236d00d8a32ac2302f4699388657cc763cbae9052c481486507e4b55e3c9e"
target_path: /Users/quynhchilai/PLG Phase 2/billing/src/features/billing/BillingPage.tsx
timestamp: 2026-11-22T07-19-19Z
slug: billing-src-features-billing-billingpage-tsx
---
Method: dual-agent (A: design review sub-agent, B: detector and browser-evidence sub-agent). B's report arrived before A's; judgments were formed from A, B used as evidence.

# Critique of Billing & Subscription, Version A (current state), lens: too many actions

Overall impression: cards are calm after the last round; the overload is mostly elsewhere. History holds two-thirds of the controls and shares the screen with the cards; inside the right card three controls answer "I'm running low" and the loudest one is an upsell.

Measured control counts (1440px): active states 5 in cards (4 actions + tooltip) + 10 history = 15 (17 on the Subscription history tab); Flex top-up used and Cancelled 3 + 10 = 13; Inactive and Payment failed 1 + 10 = 11. Cards end at y=563, history starts at y=583.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Cancelled state repeats one date four times |
| 2 | Match system / real world | 3 | "Subscription settings" holds buy actions |
| 3 | User control and freedom | 3 | Choose a plan when cancelled leads to a locked page |
| 4 | Consistency and standards | 2 | Upgrade plan vs Choose a plan: two verbs, one destination |
| 5 | Error prevention | 3 | Cancel last and away from Upgrade |
| 6 | Recognition rather than recall | 3 | Invoice and Receipt downloads use identical glyphs |
| 7 | Flexibility and efficiency | 2 | No search, no date presets, 5 rows per page |
| 8 | Aesthetic and minimalist design | 3 | Top-up advice stated four times; left card is static bullets |
| 9 | Error recovery | 2 | Payment failed offers only Choose a plan |
| 10 | Help and documentation | 2 | One 22px tooltip |
| Total | | 26/40 | Acceptable |

Design specificity: mixed. States and copy are authored; composition is a generic SaaS billing template.

Deterministic scan: detector on BillingPage.tsx, HistoryTabs.tsx, SubscriptionFlow.tsx: [] (clean). Live overlay: 4 findings, all page or shell level: 3x undersized-ui-text (10px "New" sidebar badges, portal shell), overused-font (Open Sans 96%, brand choice, accepted), monotonous-spacing (4px 87%, artifact of the 4px scale, accepted). No overlay left open (isolated tab, closed).

What's working: lapsed states are one card with one action; Cancel is quiet, last and away from Upgrade; inapplicable controls disappear.

Priority issues
- [P1] Right card answers "running low" three ways (Upgrade plan solid, Top up now outline, Auto top up switch) and repeats top-up advice four times. Fix: balance leads, one contextual button, Auto top up into the top-up dialog, Upgrade as text link, drop duplicate sentences. /impeccable distill
- [P1] History is the biggest action surface and open by default (filters before 5 rows, 4 pager buttons, 10 near-identical download icons). Fix: latest 3 rows + View all, one Download menu per row, prev/next only. Not applied: user earlier said do not touch the history tables. /impeccable distill
- [P2] Cancelled state stacks and repeats (end date x4, two amber blocks, Choose a plan leads to locked page). Fix: one merged block; hide Choose a plan until credits reach 0. /impeccable clarify
- [P2] Lede promises "update your billing information" but no control exists; Payment failed has no cure. Fix: match lede to reality; lead with new card at checkout. Factual copy: ask first. /impeccable clarify
- [P2] Mobile: read-only plan card first so actions sit below the fold (Upgrade y=685, Top up y=940, Cancel y=1089 of 844); tooltip 22px; Cancel not underlined at rest. /impeccable adapt

Persona red flags
- Alex: no search on business name or order ID; date range popover with no presets; 4 pager clicks per 5 rows.
- Sam: 22px tip; 10 download buttons differing only by hidden labels; Cancel styled like a label, no underline.
- Compliance account owner: invoices behind second tab; no billing-details or tax-ID control; Perpetual KYB shutdown date only after Cancel anyway commits.

Minor: history sample row "Top-up (100 credits)" vs Auto top up 535 (verified in data); 10px sidebar "New" badges; usage table 803px in a 324px scroller on mobile; "Subscription plan breakdown" is marketing bullets.

Questions to consider: if a typical visit is "check my balance", why is the only filled button an upsell? Does a read-only plan card deserve half the page? Should billing history be its own Invoices page?
