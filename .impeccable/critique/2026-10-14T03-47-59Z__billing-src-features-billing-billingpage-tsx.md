---
target: billing page, cancel flow and choose plan page
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/quynhchilai/PLG Phase 2/billing/src/features/billing/BillingPage.tsx"
target_fingerprint: "sha256:b4d8569a5fdf7fed46cf0097ba43c7afe58ccd18d24761de54f894044486cb64"
target_path: /Users/quynhchilai/PLG Phase 2/billing/src/features/billing/BillingPage.tsx
timestamp: 2026-10-14T03-47-59Z
slug: billing-src-features-billing-billingpage-tsx
---
Method: dual-agent (A: design review · B: detector + browser overlay)

# Critique: Billing page, cancel flow and Choose plan page

## Design Health Score
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | After cancelling, the plan card keeps a green "Active" badge next to a red "Subscription cancelled" notice |
| 2 | Match system / real world | 2 | Step 1 says "losing access… today" for an end-of-cycle cancellation |
| 3 | User control and freedom | 2 | No undo after "Cancel anyway"; "Choose a plan" leads to locked plan cards |
| 4 | Consistency and standards | 2 | The destructive commit is a green link styled like navigation |
| 5 | Error prevention | 1 | The irreversible commit happens before consequences are shown |
| 6 | Recognition rather than recall | 3 | "Subscribe again by then" leaves the user to work out the date |
| 7 | Flexibility and efficiency | 2 | Mandatory retention step: 3 clicks to commit where 2 would do |
| 8 | Aesthetic and minimalist design | 3 | The end date is repeated 4 times in the cancelled settings card |
| 9 | Error recovery | 1 | No resume; locked plan buttons explain themselves only in a toast |
| 10 | Help and documentation | 2 | The FAQ does not cover cancelling, refunds, or credits and reports |
| Total | | 20/40 | Acceptable |

## Priority Issues
- [P0] Consequences appear only after the irreversible commit, and step 1 is misleading. Fix: make step 1 the single confirm step with dated facts and "Keep plan" / "Cancel plan" buttons. (/impeccable clarify)
- [P1] The retention step ("Don't leave just yet") costs a click without offering anything; its autofocused primary button abandons the cancellation. Fix: remove the step; at most one quiet "Compare plans" link. (/impeccable distill)
- [P1] The cancelled state contradicts itself (Active badge vs red notice, sales list, amber meter at 79%), and "Choose a plan" is a dead end. Fix: amber "Ends <date>" badge, warning-tone "Cancellation scheduled" notice, keep the plan breakdown, colour the meter by percentage, hint text while plans are locked. (/impeccable clarify, /impeccable harden)
- [P2] Commit and trigger styling: green link commits, 13px/19.5px trigger. Fix: negative-outline "Cancel plan" button; 14px trigger with at least 24px height. (/impeccable polish)
- [P2] Focus is lost after Close; step 3 autofocuses the upsell; actions sit inside the "What you keep" region; no history row. (/impeccable harden)

## Detector
- CLI: 0 findings.
- Browser overlay: three undersized 10px "New" badges (shell.css .sidebar__new); thin-border-wide-shadow on the navy card; kicker-above-heading ×3 (user-requested); tight-leading on .faq__q; overused-font (Open Sans).
- False positives: text-overflow ×7 on .rates__label (hidden tooltip bubble).
- All 11 contrast checks pass AA. The design review found .no dashes at about 2.4:1, below 3:1.

## Persona red flags
- Jordan: misreads "losing access today"; mistakes the autofocused "Explore other plans" for the next step; sees "Active" after cancelling.
- Sam: "Continue to cancel" sits inside the "What you keep" region; Enter on step 2 navigates away; focus is lost on Close.
- Mei: no end date, no-further-charges statement or audit trail before committing; no export; no history row.

## Choose plan page: borders and spacing only
- .plan border: mint → --color-border-subtle, plus --shadow-card.
- .no dash: #a5a5a5 → --color-content-tertiary.
- .plans margin-top: 48 → 64px (title-to-toggle gap is 2px today).
- .plans margin-bottom: +20px.
- .plans gap: 16 → 20px.
- .plan__figures min-height: 91px at ≥1101px, so feature lists align.

## Minor
- The page lede mentions billing info but there is no payment section.
- Inactive state says "cancelled on" where it should say "ended on".
- "Upgrade now" shows while plans are locked.
- Flex users get no cancel link and no explanation.
- The featured comparison column has no mint edge.

## Questions
- Is "Changed your mind?" honest without a resume option?
- Does the retention step earn its click?
- Should the deletion warning become an export action?
