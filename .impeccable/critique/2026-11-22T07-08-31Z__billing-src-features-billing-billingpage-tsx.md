---
target: critique the current design in version A
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/quynhchilai/PLG Phase 2/billing/src/features/billing/BillingPage.tsx"
target_fingerprint: "sha256:6c9236d00d8a32ac2302f4699388657cc763cbae9052c481486507e4b55e3c9e"
target_path: /Users/quynhchilai/PLG Phase 2/billing/src/features/billing/BillingPage.tsx
timestamp: 2026-11-22T07-08-31Z
slug: billing-src-features-billing-billingpage-tsx
---
⚠️ DEGRADED: single-context (critique and fixes requested in one pass; assessments run inline, detector ran, in-browser overlay did not)

# Critique of Version A (before changes)

Overall impression: not wrong, noisy. Ten text styles, four hairlines and a grey box inside a white card compete to say what belongs together. Biggest problem was grouping: the left card (facts) also held the only exit (Cancel subscription); the right card mixed status with settings.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Balance figure, meter and Active/Ends badge are clear |
| 2 | Match system / real world | 3 | Plain language |
| 3 | User control and freedom | 2 | Cancel filed with the facts: centred, no underline at rest, 400 weight |
| 4 | Consistency and standards | 2 | 10 text styles; same-rank labels in two families; two rows inset 16px off the content edge |
| 5 | Error prevention | 3 | Cancel and auto top-up both confirm in dialogs |
| 6 | Recognition rather than recall | 3 | Everything visible |
| 7 | Flexibility and efficiency | 3 | One-click top-up and toggle suit a rare admin task |
| 8 | Aesthetic and minimalist design | 2 | 4 rules, a box in a box, 12px/13px text under the 14px body |
| 9 | Error recovery | 3 | Notices name the problem and next step |
| 10 | Help and documentation | 2 | One tooltip, on the balance only |
| Total | | 26/40 | Acceptable |

Design specificity: tokens, green-for-action and navy shell are authored for AsiaVerify; card internals were generic admin-settings scaffolding (tinted callout bar, divider after divider, weight and size doing the emphasis). Detector on BillingPage.tsx: [] (clean).

Priority issues
- [P1] Grouping mixed facts and actions (Cancel in the fixed-info card). Fix: all actions in the right card. /impeccable layout
- [P1] Ten text styles; emphasis by size, weight and family. Fix: four styles, colour for the rest. /impeccable typeset
- [P2] Four dividers and a box in a box (price|credits vertical, under plan figures, under settings header, above balance block; grey fill on the top-up callout). Fix: space groups; drop the fill. /impeccable distill
- [P2] Top-up and Auto top up rows inset 16px from every label. Fix: flush to card edge. /impeccable layout

Persona red flags
- Alex (account owner topping up): "Top up now" was a 13px outlined button in a grey box, weaker than Upgrade plan.
- Sam (accessibility): 12px badge and 13px list text under the 14px body; Cancel was the only text button with no underline at rest. Contrast and dark mode not measured.

Minor: left card now ends with spare height (grid stretch); tooltip text and badge moved onto the four styles.

Questions to consider: is the credit balance a fact or a setting? Should Cancel have an underline at rest given the "never a trap" principle?

Applied (Version A only, scoped to [data-version='a'] in billing/src/styles/billing-a.css): Cancel moved to the right card; four text styles (Headline Roboto 700 26, Title Roboto 500 18, Body Open Sans 400 14, Button Open Sans 600 14), measured 4 in default, cancelled and Flex states; 4 dividers removed (0 leftover rules); top-up callout fill removed; CirclePlus icon on Top up now. History tables, dialogs and Version B untouched.
