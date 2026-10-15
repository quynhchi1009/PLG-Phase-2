# PRD: Billing Phase 1 Package Logic (PLG Top-Up, Upgrade & Cancellation)

Source: `AVProduct-Billing Phase 1 Package Logic_ PLG Top-Up, Upgrade & Cancellation-151026-020628.pdf` (5 pages, exported 15 Oct 2026). Transcribed and structured from the PDF; table cells were reflowed, so wording is condensed, not verbatim.

## Plan summary

| | Starter Pack (shown as **Flex**) | Subscription Monthly | Subscription Yearly | Enterprise (shown as **Business**) |
|---|---|---|---|---|
| Price | $249 one-time | $99/month | $999/year | Talk to sales |
| Credits | 623 | 535 per month | 6,094 per year | – |
| Minimum commitment | No limit | 1 month | 12 months | – |
| Unused credits | **No expiry** | Expire in 1 month | Expire in 12 months | – |
| Auto top-up | Not in scope | Not in scope | Not in scope | – |
| $249 top-up | Yes, **1 time only** | Yes, unlimited | Yes, unlimited | – |
| Cancellation | No | Yes, anytime | Yes, anytime | – |
| Reverse cancellation | – | Yes, anytime | Yes, anytime | – |
| Upgrade | Yes, to any subscription; unused credits roll over and expire with the next billing period | Yes, to Yearly or Enterprise; same rollover | Yes, to Enterprise only; same rollover | – |
| Downgrade | Not in scope | Not in scope | Not in scope | – |

## Part 1: Self-serve top-up (done)

### 1.2 Transition for existing Monthly/Yearly subscribers
- Before rollout: existing rules unchanged, including unlimited $249 top-ups.
- On rollout: remaining credits convert ×2.5; report credit values move to the new PLG pricing catalogue; existing balances convert to the new scale.
- After rollout, Monthly: continues at $99/month with **535 credits** refreshed each month.
- After rollout, Yearly: 12-month access limit removed; continues at $999/year with **6,094 credits** refreshed each annual renewal. Unlimited $249 top-ups remain.

### 1.3 Transition for Starter Pack
- Before rollout: existing Starter rules unchanged, including unlimited top-ups.
- On rollout: remaining credits convert ×2.5; report values move to the new catalogue; 12-month expiry removed.
- After rollout: credits have **no expiry**; users receive **1 additional $249 top-up (623 credits)**. After that one top-up is used, the user must upgrade to Monthly/Yearly for more credits.

### Communication timeline (both transitions)
| Timing | Communication |
|---|---|
| T-21 | Announcement email + persistent in-app banner/pop-up |
| T-14 | Reminder email; same in-app content |
| T-7 | Final reminder email; same in-app content |
| T (rollout) | Rollout email; replace pre-rollout in-app messaging with post-rollout messaging |
| First login after rollout → T+14 | Intro pop-up showing updated credit balance / plan changes; can be minimised/dismissed to an in-app top banner |
| Inactive between T-21 and T+14 | Show the intro pop-up on first login; no need to restore the banner |

## Part 2: Upgrade & downgrade

| Change | Immediate? | Billing | Credits |
|---|---|---|---|
| Starter → Monthly | Yes | New billing starts immediately after payment on Stripe | Pay full amount for new plan; remaining credits roll over and expire with the next billing cycle |
| Starter → Yearly | Yes | Same | Same |
| Monthly → Yearly | Yes | Same | Same |
| Monthly → Starter, Yearly → Starter, Yearly → Monthly | **Not available** | Downgrades not allowed; only cancellation, no refunds | – |

## Part 3: Cancellation

| Plan | Can cancel? | Portal access + billing | Credits | Reports |
|---|---|---|---|---|
| Starter Pack | Not available | – | – | – |
| Monthly / Yearly | Yes | Portal 2 features stop at (1) billing-period expiry, or (2) when all credits are exhausted | Usable until the end of the billing period | pKYB monitoring stops on the billing end date; all historical reports (incl. pKYB) stay accessible for up to 90 days; re-subscribing within 90 days of the cancelled date restores them; otherwise all historical reports are permanently deleted |

## Open conflict in the PRD
The summary table allows **reverse cancellation "Yes, anytime"** for Monthly and Yearly, but Parts 2 and 3 state **"Reverse-cancellation is NOT allowed"** (the user must pick a plan and pay via Stripe after the plan ends). The prototype follows the summary table and the product owner's request (Reactivate subscription in the cancellation flow, 15 Oct 2026). Confirm with product before build.
