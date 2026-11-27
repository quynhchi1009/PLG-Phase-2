# PRD: PLG Automated Billing Phase 2 (Downgrade, Auto Top-up, Failed Payment on Auto Top-up)

Source: `AVProduct-PLG Automated Billing Phase 2 (Downgrade, Auto Top-up, Failed Payment on Auto Top-up)-271126-093628.pdf` (**26 pages, exported 27 Nov 2026 at 09:36:28**; file name is ddmmyy-hhmmss). Transcribed on 27 Nov 2026. **This replaces every earlier PRD file in `docs/`** (the 25 Nov Phase 2 exports and the 15 Oct Phase 1 transcription). The PDF still links the Phase 1 PRD and the old Full PRD on Confluence "for ref"; their sections are cited below by number only.

- Figma: https://www.figma.com/design/ot8NEpgFxGsI3f6XiY7pfr/PLG?node-id=13223-242997 (only frames labelled "Phase 2")
- Rollout: **23 March 2027**, all Growth users

## How to use this file
- **Text copy in the PRD is ignored** (decision of 25 Nov 2026). The PM reviews copy in Figma and tech takes it from there. Wording is kept below only where it carries logic. Email bodies (section 4) and banner/pop-up copy (5.2) are listed, not transcribed, and are not used in conflict checks.
- PRD says: Figma is the source of truth for final layout and copy; sentence case everywhere; all subscription text (plan name, price, dates) is dynamic.
- The PRD now calls the page **"Billing"** (left nav "Billing", CTA "Back to Billing"). Earlier exports said "My Plan".

## What changed from the 25 Nov export (100439)
1. **"Update payment method" is back.** A failed auto top-up before the billing date shows a "Payment failed" pop-up with **"Update payment method"** (→ Stripe checkout for the current plan at full price; the new card is saved) and close. The Billing page shows a banner with an "Update payment method" button while the "payment failed" state is set. The 25 Nov text said "no Update payment method flow, pay on Stripe". Still not in Phase 2: the grace period and the cancellation survey.
2. **2.4 Turn auto top-up ON never charges** ("Enable" → set ON, no payment now; payment only later from a report request). Matches the product decision of 27 Nov and replaces the 25 Nov decision that turning it on at 0 credits charged.
3. **2.7 is new: credits run out while a downgrade is scheduled.** Auto top-up does not apply (toggle ON or OFF). Pop-up "Renew current plan" / "Keep scheduled downgrade"; a second pop-up confirms and charges the full Yearly price; on success the downgrade is cancelled, auto top-up turned ON, credits added. A failure here saves **no** "payment failed" state. This replaces the 25 Nov 1.6 #2 (charge and move the downgrade date).
4. **2.8 is new: credits run out while a cancellation is scheduled.** Pop-up "Reactivate subscription" (reactivate only, **auto top-up setting unchanged**, no payment) / "Close".
5. **2.2 #3: the toggle is greyed out while a downgrade is scheduled** and cannot be changed.
6. **1.5 entry points:** "Keep current plan" on Billing (the 1.4 text still calls the same button "Keep yearly plan") and "Cancel downgrade" on Products & Pricing. Pop-up 3 is gone.
7. **3.2 #3 after a successful "Update payment method":** back to where the user started (report page with the same company, or Billing) with a success pop-up; toggle unchanged.
8. **3.3 #7:** cancelled and inactive → "Choose a plan" → Products & Pricing with every card showing "Select plan".
9. **Section 6 API responses** added (no new error codes; tech to confirm the wait time).

## Scope (Overview)
- Growth (Monthly) and Growth (Yearly) only. Flex keeps its one-time top-up. Business out of scope.
- Auto top-up renews the plan early, charges the full plan price, and replaces manual $249 top-ups for Growth.
- A failed payment **on the billing date** (normal auto-renewal) cancels the plan straight away, auto top-up ON or OFF (Phase 1 2.7). No grace period.
- A failed **auto top-up** payment before the billing date does **not** cancel. The user keeps remaining credits and can use "Update payment method" (section 3).
- While a downgrade is scheduled, auto top-up does not apply (1.6, 2.7).
- Not in Phase 2: cancellation survey, payment-failure grace period. "Update payment method" is used only after a failed auto top-up before the billing date.

## 1. Downgrade (Growth Yearly → Growth Monthly)

### 1.1 Logic
| Element | Logic |
|---|---|
| Who | Growth (Yearly) only, to Growth (Monthly). Growth (Monthly) cannot go to Flex. Business out of scope. |
| Effective date | Scheduled, not immediate: end of the current Yearly period. Yearly access and credits kept until then. No refund. |
| On the effective date | Plan becomes Growth (Monthly); first monthly charge from the saved card; monthly credits added; unused Yearly credits expire, no rollover. |
| Failed monthly charge | Plan cancelled straight away (3.3). |
| Cancel downgrade | Any time before the effective date; stays on Yearly; nothing charged. |
| Other flows | 1.6 and 2.7. |

### 1.2 Products & Pricing (entry point)
1. A Growth (Yearly) user opens Products & Pricing by "Change plan" on Billing or "Products & Pricing" in the navbar. **The page jumps to the card section.**
2. Cards: Growth (Monthly), Growth (Yearly), Business (replaces Phase 1 2.5, which hid Monthly for Yearly users). Yearly: "Your current plan" (not clickable). Monthly: "Select plan" → 1.3. Business: "Talk to sales" → HubSpot booking page (no change).

### 1.3 Downgrade confirmation flow
1. "Select plan" on Growth (Monthly) → pop-up 1: "Keep current plan" (close, no change) / "Proceed to downgrade" (→ pop-up 2; backend schedules the downgrade for the end of the period).
2. Pop-up 2: confirmation with the (dynamic) downgrade date. CTA "Back to Billing" → closes pop-up 2. Billing then shows the scheduled state (1.4).

### 1.4 Downgrade scheduled state
1. **Billing:** "Downgrade scheduled" label on the Growth card, explanatory text and the date. **"Change plan" hidden** (as with a scheduled cancellation). No separate "Cancel downgrade" button: **"Keep yearly plan" is the only primary button, "Cancel plan" beside it.** "Keep current plan" opens the cancel-downgrade pop-up (1.5). "Cancel plan" starts the Phase 1 2.6 cancellation. To upgrade to Business the user goes to Products & Pricing in the left nav. *(Design image: Billing card with "Downgrade scheduled" chip, "Keep yearly plan" button, Auto top up toggle greyed with "Unavailable while your switch to monthly is scheduled".)*
2. **Products & Pricing:** Growth (Monthly) button disabled, showing the scheduled date; a **"Cancel downgrade"** button below it opens the cancel-downgrade pop-up. Growth (Yearly) button disabled, "Plan Ends [date]" label. *(Design image: Monthly "Scheduled for [date]" + "Cancel downgrade" link; Yearly "Plan ends [date]".)*

### 1.5 Cancel downgrade
1. Entry points (same pop-up): "Keep current plan" on Billing; "Cancel downgrade" on Products & Pricing.
2. Pop-up CTAs: "Close" (downgrade stays) / "Keep current plan" (backend removes the downgrade; pop-up "Downgrade cancelled successfully!").
3. After: remove every scheduled-downgrade indicator on Billing and Products & Pricing; stays on Yearly, not charged; **auto top-up message returns to the default text**.

### 1.6 Edge cases
| Case | Logic |
|---|---|
| 1. Cancels the subscription while a downgrade is scheduled | Downgrade removed; "Downgrade scheduled" label and "Keep yearly plan" go; cancelled state from Phase 1 2.6 shows. Reversing the cancellation before the period ends → stays on Yearly, no downgrade. |
| 2. Credits run out while a downgrade is scheduled | Auto top-up does not trigger (it renews the current plan, and the downgrade replaces that plan). User sees the 2.7 pop-up. |
| 3. First monthly charge fails on the effective date | 3.3 (cancelled and inactive straight away). |

## 2. Auto top-up

### 2.1 Logic
| # | Element | Logic |
|---|---|---|
| 1 | Applies to | Growth (Monthly) and Growth (Yearly). Flex keeps its one-time top-up. Business out of scope. |
| 2 | Default | ON by default for new Growth subscribers, users who subscribe again after being cancelled, and all existing Growth users from rollout (23 Mar 2027). |
| 3 | Manual top-up | Manual $249 top-ups removed for Growth: remove the top-up CTAs and the Top-up page for Growth. |
| 4 | Triggers when | Auto top-up is ON **and** the user asks for a report that costs more than their balance (Portal or API). |
| 5 | What it does | Renews the plan early; charges the full plan price (Monthly or Yearly) to the saved card; billing date resets to the charge day; new plan credits added immediately. |
| 6 | After success | Success message (copy in Figma); report carries on with the same company; update the Billing auto top-up message (2.2); send Email 4. |
| 7 | Limit | No limit per billing period. |
| 8 | Payment fails | Plan not cancelled; section 3 ("Payment failed" pop-up, "Update payment method"). Same for 2.5, 2.6 and 2.7, except **2.7 saves no "payment failed" state**. |
| 9 | Cancellation scheduled (still active) | Does not trigger. Credits run out → 2.8 pop-up; must reactivate to continue. |
| 10 | Downgrade scheduled | Does not trigger, toggle ON or OFF. Credits run out → 2.7 pop-up. |
| 11 | Auto top-up OFF | Cannot generate a report when credits are not enough → 2.5 pop-up. No payment. API: section 6. |

### 2.2 Auto top-up section on Billing (message by state)
| # | State | Message |
|---|---|---|
| 1 | Default: new subscribers, re-subscribers after cancelled and inactive, users with auto top-up OFF, Monthly users who upgraded to Yearly | Default text |
| 2 | After an auto top-up | Date of the last auto top-up; updates on every auto top-up |
| 3 | Yearly with a downgrade scheduled | Scheduled-downgrade text until the effective date; default text once it happens or is cancelled. **Toggle greyed out and cannot be changed while scheduled**; works normally again after. |
| 4 | Cancelled but still active | Cancelled text until the account is cancelled and inactive; default text if the cancellation is reversed |
| 5 | Cancelled and inactive | No message |

### 2.3 Turn auto top-up OFF
1. Toggle OFF → pop-up 1. "Stay enabled" → close, no change.
2. "Disable auto top-up" → confirmation pop-up; backend OFF; Billing toggle OFF; message back to default text.

### 2.4 Turn auto top-up ON (insufficient credits, before the billing date)
1. Toggle ON → pop-up. Copy must state the charge: if credits run out, the plan renews early for {{plan_price}} and the billing date resets.
2. "Enable" → next pop-up. Backend ON. **No payment now**; a payment is only taken later from a report request above the balance (2.6). Billing toggle ON.

### 2.5 Insufficient credits at "Generate report", auto top-up OFF
1. Pop-up 1 (dynamic). "Enable auto top-up" → backend takes the payment as in 2.1. Success → success pop-up; auto top-up ON (backend and Billing); user carries on with the same company.
2. Failure → section 3. Plan not cancelled; **auto top-up stays OFF**; "Payment failed" pop-up and the Billing banner.

### 2.6 Insufficient credits at "Generate report", auto top-up ON
1. Payment taken straight away as in 2.1, no extra click. Success → success pop-up, carry on with the same company.
2. Failure → section 3. Plan not cancelled; **auto top-up stays ON**; "Payment failed" pop-up and the Billing banner.

### 2.7 Insufficient credits while a downgrade is scheduled (before the effective date)
1. Yearly user with a scheduled downgrade asks for a report above the balance → pop-up. Auto top-up does not apply, toggle ON or OFF.
   - "Renew current plan" → pop-up 2. Its "Renew current plan" takes the full Yearly price from the saved card with a processing state. Nothing changes until the payment works; on success cancel the downgrade, **turn auto top-up ON**, add the credits so the report can be generated → next pop-up.
   - "Keep scheduled downgrade" → close, no change.
   *(Design images: "Not enough credits for this report" with "Renew current plan" / "Keep scheduled downgrade"; "Renew Growth yearly now?" listing credits added, auto top-up turns on, switch to monthly cancelled, next billing date; "Renew and pay $999" → "Processing…".)*

### 2.8 Insufficient credits while a cancellation is scheduled (account still active)
1. Pop-up. "Reactivate subscription" → **reactivate the plan only; auto top-up setting does not change; no payment.** "Close" → no change. After reactivating, "Generate report" again: if still short, 2.5 (OFF) or 2.6 (ON) applies.

## 3. Failed payment during auto top-up

### 3.1 Logic
| # | Element | Logic |
|---|---|---|
| 1 | Plan NOT cancelled | An auto top-up payment fails before the billing date: report request with ON (2.6); "Enable auto top-up" in a report pop-up (2.5); "Keep current plan & turn auto top-up ON" (2.7, no "payment failed" state saved). |
| 2 | Plan | Stays active; credits kept; billing date unchanged; the report is not generated, no credits deducted; reports within the balance still work. |
| 3 | State | System saves a "payment failed" state. Toggle unchanged (ON stays ON, OFF stays OFF). |
| 4 | User can | Use "Update payment method" (3.2). A successful payment works like a successful auto top-up: period renews, billing date resets, plan credits added. |
| 5 | While set | ON: card not charged again automatically; a report above the balance shows "Payment failed" (Portal) or the standard insufficient-credits response (API). OFF: the user sees the "Enable auto top-up" pop-up (2.5); if that payment fails again, the same "Payment failed" pop-up. |
| 6 | Cleared when | The user pays through "Update payment method"; a later auto top-up payment works; the next normal renewal works. |
| 7 | Failure on the billing date | Plan cancelled straight away (Phase 1 2.7), ON or OFF. Same for a failed first monthly charge on a downgrade date (3.3). |
| 8 | No grace period | "Update payment method" only after a failed auto top-up before the billing date. |

### 3.2 "Payment failed" pop-up and Update payment method (report generation)
1. Backend: do not cancel, do not deduct credits, do not generate the report, save the "payment failed" state.
2. Portal: "Payment failed" pop-up saying the payment did not go through, the report was not generated, credits are still there and smaller reports still work, and the price ("Your plan will renew for {{plan_price}} today"). CTAs **"Update payment method"** and close. "Update payment method" → **Stripe checkout for the current plan at full price; the new card is saved**. Closing or leaving Stripe without paying → nothing changes; smaller reports work; a report above the balance shows "Payment failed" again. **Billing page: banner with an "Update payment method" button while the state is set**; it goes once the user pays.
3. After a successful payment: **back to where the user started (the report page with the same company selected, or Billing) with a success pop-up**. Backend renews the period, resets the billing date, adds the plan credits, clears the state. Toggle unchanged.

### 3.3 Failed renewal, Stage 1 (billing date; plan cancelled)
Applies to a failed normal renewal (ON or OFF) and a failed first monthly charge on a downgrade date.
1. BE: status → cancelled and inactive immediately. 2. BE: all pKYB monitoring stops. 3. BE: new reports blocked on Portal and API; API key deactivated. 4. BE: history kept 90 days. 5. BE: Email 6. 6. FE: Phase 1 2.7 cancelled-and-inactive screen as it is. 7. FE: **"Choose a plan" → Products & Pricing with all cards "Select plan" → plan confirmation pop-up → Stripe → back to Billing with a confirmation pop-up** (Phase 1 2.7).

### 3.4 Failed renewal, Stage 2 and 3
Stage 2: 10 days before the 90-day deletion deadline, Email 7. Stage 3a: no plan within 90 days → Phase 1 2.6 (reports deleted). Stage 3b: plan bought within 90 days → reports restored.

## 4. Emails (copy ignored; not part of the prototype)
1 Plan downgraded (effective date). 2 Downgrade scheduled (on confirm). 3 Downgrade cancelled. 4 Auto top-up payment confirmation (after a report request, "Enable auto top-up", "Keep current plan & turn auto top-up ON", or "Update payment method"). 5 Auto top-up payment failed (plan stays active; CTA "Update payment method"). 6 Plan cancelled after a failed billing-date payment, 90 days left (Stage 1). 7 Same, 10 days left (Stage 2).

## 5. Pre and post-rollout (23 March 2027)

### 5.1 Transition logic
| When | Logic |
|---|---|
| Until 22 Mar 2027 | Phase 1 Growth rules, including unlimited $249 manual top-ups. |
| 23 Mar 2027, 00:00 SGT | Auto top-up ON for all existing Growth users in one update. Manual top-ups removed for Growth. Downgrade available. Credit balances and billing dates unchanged. |
| After | Growth follows sections 1-3. Flex unchanged. |
| Activated between T-30 and rollout | Phase 1 pre-rollout PRD section 4: T-30 catch-up email, then only unsent scheduled emails; in-app banner on first login. |

### 5.2 Communication timeline (copy ignored)
| When | Method | Messaging |
|---|---|---|
| T-30, Monday 22 Feb 2027 | Announcement email; persistent banner and pop-up | Email A; banner and pop-up A |
| T-14, 9 Mar 2027 | Reminder email; same in-app | Email B (14 days) |
| T-7, 16 Mar 2027 | Final reminder; same in-app | Email B (7 days) |
| T, 23 Mar 2027 | Rollout email; replace pre-rollout in-app messaging | Email C; banner and pop-up B |
| First login after rollout, to T+14 (6 Apr 2027) | Intro pop-up, minimisable to a persistent top banner | Banner and pop-up B |
| Inactive users, T-21 (2 Mar) to T+14 | Never logged in during the period → intro pop-up on first login; no banner | Pop-up B only |

5.2.2 structure (logic only): banner A has a link that opens pop-up A; **pop-up A CTA "Got it" minimises to the banner**. Banner B has "Manage auto top-up"; **pop-up B CTAs "Manage auto top-up" (→ Billing) and "Got it" (minimise to the persistent banner until T+14)**.

## 6. API responses
- Works as on the Portal (2.1). With ON and too few credits, the request waits for the payment; on success the report is generated. **[need input: tech to confirm max wait time and timeout behaviour.]**
- Credits deducted at request; async failures use the existing refund logic.
- Auto top-up can only be turned ON/OFF on the Portal.
- Flex and cancelled-and-inactive accounts: no change (inactive → API key deactivated).
- No new error messages: whenever credits are short and no report is generated (OFF, failed payment, "payment failed" state, scheduled cancellation or downgrade) return `{"errorCode": "INSUFFICIENT_CREDITS", "message": "Insufficient credits to generate this report. Please top up or upgrade your plan."}`.

## PRD-internal inconsistencies (27 Nov export)
- **One button, two names on Billing:** 1.4 says "Keep yearly plan" is the only primary button; the next bullet and 1.5 #1 call it "Keep current plan". The 1.4 design image shows "Keep yearly plan".
- **2.7 CTA naming:** 2.7 says "Renew current plan"; 3.1 #1 and Email 4 call the same flow "Keep current plan & turn auto top-up ON".
- **2.7 failure UI is not described.** 2.1 #8 / 3.1 #1 say only that no "payment failed" state is saved; it is not said whether the "Payment failed" pop-up shows, or whether "Update payment method" is offered.
- **Toggle value while a downgrade is scheduled and after it is cancelled** is not stated: 2.2 #3 says greyed out and "works normally again" after; 1.5 #3 says only that the message returns to default.
- **Toggle value through a cancellation:** 2.8 says reactivating does not change the auto top-up setting, which implies the setting survives the cancellation. 2.2 #4 says only that the message shows the cancelled text.
- 3.2 #2 says the pop-up states "Your plan will renew for {{plan_price}} today" (copy, Figma decides).
- 2.6 #2 and 2.5 #2 sit on the same PDF page; the PDF heading order makes 2.5 #2 look like part of 2.6.

## Product decisions not in the PRD (still in force, 27 Nov 2026)
- **Plan credits:** Growth Monthly $99 = 267 credits; Growth Yearly $999 = 3,047 credits. An auto top-up adds the plan's own credits.
- **Report-page success after an auto top-up (2.5, 2.6): "Got it" only closes**, the company stays selected and the user clicks "Generate report" again (27 Nov). After "Renew current plan" (2.7) the success pop-up's "Continue with your report" generates the report.
- **While a downgrade is scheduled the toggle is set OFF**, and "Keep current plan" does not turn it back on (27 Nov, Claude's choice, not confirmed by the user; the PRD only says greyed out).
- **A failed auto top-up is fixed by topping up credits, never described as renewing the plan** (user, 27 Nov, before this export). **Conflicts with 3.1 #4 and 3.2 #3 of this export**, which say the "Update payment method" payment renews the period and resets the billing date. Open.
- Superseded and dropped: "toggling ON at 0 credits charges at once" (25 Nov; replaced by 2.4 and the 27 Nov decision); "Continue with report generates the report" for 2.5/2.6 (25 Nov; replaced by "Got it"); "no Update payment method flow" (25 Nov; replaced by 3.2 in this export).
