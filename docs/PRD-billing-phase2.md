# PRD: PLG Automated Billing Phase 2 (Downgrade, Auto Top-up, Failed Payment on Auto Top-up)

Source: `AVProduct-PLG Automated Billing Phase 2 (Downgrade, Auto Top-up, Failed Payment on Auto Top-up)-251126-022824.pdf` (17 pages, exported 25 Nov 2026; the file name is ddmmyy-hhmmss, as with Phase 1). Text transcribed from the PDF. Only 10 of its "Design" screenshots are embedded images (pages 3 and 8-11); the rest are vector drawings that could not be extracted. See "What the embedded design images show" at the end. Figma is the source for layout.

- Figma: https://www.figma.com/design/ot8NEpgFxGsI3f6XiY7pfr/PLG?node-id=13223-242997 (only frames labelled "Phase 2")
- Confluence: Phase 2 page 2020474893, Phase 1 page 1854308368 (Phase 1 PRD sections 2.2, 2.5, 2.6, 2.7 are referenced)
- Rollout: **23 March 2027**, all Growth users

## How to use this file (decision from 25 Nov 2026)
- **Text copies in the PRD are ignored.** The PM reviews copy in Figma and tech takes it from there. Wording below is kept only where it carries logic (e.g. "must state the charge"). Email bodies, banner and pop-up copy (PRD sections 4 and 5.2) are listed but their wording is not transcribed and must not be used in conflict checks.
- PRD says: Figma is the source of truth for final layout and copy; all text sentence-cased; all subscription text dynamic (plan name, price, date), never a static placeholder.

## Scope
- Applies to **Growth (Monthly)** and **Growth (Yearly)** only. Flex keeps its one-time top-up. Business is out of scope.
- Three features: downgrade (Yearly → Monthly), auto top-up, failed-payment handling on auto top-up.
- A failed auto top-up charge is the **only** failed charge that does not cancel the subscription. A failed auto-renewal (billing date) or a failed first monthly charge on a downgrade date → cancelled and inactive straight away (Phase 1 section 2.7). No grace period, no "Update payment method" flow.
- Payment failures at the Stripe checkout page (e.g. an upgrade) stay as Phase 1: Stripe handles them natively, user retries on the Stripe page.
- **Not in Phase 2:** cancellation survey, payment-failure grace period, "Update payment method" flow.

## 1. Downgrade (Growth Yearly → Growth Monthly)

### 1.1 Logic
| Element | Logic |
|---|---|
| Who can downgrade | Growth (Yearly) only, to Growth (Monthly). Growth (Monthly) cannot downgrade to Flex. Business out of scope. |
| Effective date | Scheduled, not immediate. Takes effect on the end date of the current Yearly billing period. User keeps Growth (Yearly) access and credits until then. No refund. |
| On the effective date | Plan changes to Growth (Monthly). First monthly charge taken from the saved payment method, monthly credits added. Unused Yearly credits **expire, no rollover**. |
| Failed monthly charge | Follow 3.3: cancelled and inactive straight away. |
| Cancel downgrade | Any time before the effective date. User stays on Growth (Yearly), nothing charged. |
| Interaction | See 1.6. |

### 1.2 Products & Pricing page (entry point) and 1.3 confirmation flow
1. A Growth (Yearly) user clicks **"Change plan"** on My Plan, or **"Products & Pricing"** in the navbar → Products & Pricing page, jumps to the card section.
2. Card section shows **Growth (Monthly), Growth (Yearly) and Business** (replaces Phase 1 section 2.5, which hid the Monthly card for Yearly users).
3. Growth (Yearly) card: CTA "Your current plan", not clickable.
4. Growth (Monthly) card: CTA "Select plan" → starts the downgrade flow (1.3).
5. Business card: CTA "Talk to sales" → HubSpot booking page (no change).
6. Pricing calculator for Yearly users stays (Phase 1 rule, section 2.2). If Growth (Monthly) is the suggested plan, its CTA "Select plan" starts the downgrade flow, same as Phase 1 upgrade logic for plan selection from the calculator.

### 1.4 Downgrade scheduled state
1. "Select plan" under Growth (Monthly) → **pop-up 1**. CTAs: "Keep current plan" (close, no change), "Proceed to downgrade" (open pop-up 2). On "Proceed to downgrade" the backend schedules the downgrade for the end of the current billing period.
2. **Pop-up 2** shows the confirmation and the downgrade date (dynamic). CTA: "Back to my plan" (closes pop-up 2). Billing page reflects the scheduled downgrade messaging and date (dynamic).
3. **My Plan:** orange "Downgrade scheduled" box with explanatory text and the downgrade date; the CTA in the box opens the cancel-downgrade pop-up (1.5).
4. **My Plan:** a "Cancel downgrade" button **beside "Change plan"**, opens the same pop-up.
5. **My Plan:** the Auto top-up text box shows the scheduled-downgrade text (see 2.2).
6. **Products & Pricing, Growth (Monthly) card:** button disabled, scheduled downgrade date shown below.
7. **Products & Pricing, Growth (Yearly) card:** button disabled, "Your current plan" and an "Ends [date]" label.
8. **Products & Pricing:** a "Cancel downgrade" button **below the Growth (Monthly) CTA**, opens the cancel-downgrade pop-up.

### 1.5 Cancel downgrade
- Entry points (all open the same pop-up): the orange box CTA on My Plan; the "Cancel downgrade" button on My Plan; the "Cancel downgrade" button on Products & Pricing; the "Cancel downgrade" CTA in pop-up 3.
- CTAs: "Close" → downgrade stays scheduled. "Cancel downgrade" → backend removes the scheduled downgrade; **a pop-up shows successful downgrade** (PRD wording; read as "successful cancellation of the downgrade", confirm in Figma).
- After cancelling: remove all scheduled-downgrade indicators on My Plan and Products & Pricing. User stays on Growth (Yearly), not charged, Auto top-up text box returns to default text.

### 1.6 Edge cases
| # | Case | Logic |
|---|---|---|
| 1 | User cancels the subscription while a downgrade is scheduled | Scheduled downgrade is removed; the "Downgrade scheduled" box and button disappear. Follow Phase 1 section 2.6 for cancellation. If the user reverses the cancellation before the billing period ends, the user stays on Growth (Yearly) with **no downgrade scheduled**. |
| 2 | Auto top-up triggers while a downgrade is scheduled | Auto top-up works as normal: full Growth (Yearly) price charged, billing date resets. Downgrade stays scheduled, its effective date **moves to the end of the new billing period**. Update the date on My Plan, Products & Pricing and the downgrade emails. The auto top-up success message shows the new downgrade date. Same when the user pays on Stripe after a failed auto top-up (3.2). |
| 3 | First monthly charge fails on the effective date | Follow 3.3 (cancelled and inactive straight away). |

## 2. Auto top-up

### 2.1 Logic
| # | Element | Logic |
|---|---|---|
| 1 | Scope | Growth (Monthly) and Growth (Yearly). Flex keeps its one-time top-up. Business out of scope. |
| 2 | Default | Auto top-up is **ON by default** for: new Growth subscribers; users who subscribe again after being cancelled; all existing Growth users from rollout day (23 Mar 2027). |
| 3 | Manual top-up | Manual $249 top-ups no longer available for Growth. **Remove the top-up CTAs and the Top-up page for Growth users.** |
| 4 | Trigger (ON) | User clicks "Generate report" and the report cost is higher than the credit balance. Same for a report requested through the API: if auto top-up is ON on the Portal and credits are insufficient, auto top-up triggers and the report is generated after the charge succeeds. |
| 5 | What it does | Renews the billing period early and charges the **full plan price** (Growth Monthly or Yearly) to the saved payment method. Billing date resets to the day of the charge. New plan credits added immediately. |
| 6 | After a successful charge | Success message (final copy in Figma). The report continues with the same company selected. Update the Auto top-up text box on My Plan. Send a payment confirmation email. |
| 7 | Limit | No cap on the number of auto top-ups per billing period. |
| 8 | Failed charge | Subscription **not cancelled**. Follow 3.1 and 3.2: "Payment failed" pop-up, user can pay on Stripe. Applies ONLY to a charge started by (1) a report request (auto top-up ON) and (2) "Enable auto top-up" in 2.5. |
| 9 | Cancellation scheduled (account still active) | Auto top-up does **not** trigger. When credits run out the user must reactivate the subscription to continue. |
| 10 | Auto top-up OFF | User cannot generate a report when credits are insufficient (see 2.5). API returns an error that credits are insufficient and auto top-up must be turned ON on the Portal. No charge. |

### 2.2 Auto top-up section on My Plan
All Growth users see a message for auto top-up on My Plan. Which text shows:
| # | State | Text |
|---|---|---|
| 1 | Default | New subscribers; users who subscribed again after being cancelled and inactive; users with auto top-up OFF; Growth (Monthly) users who upgraded to Growth (Yearly) |
| 2 | After an auto top-up | Text showing the date of the last auto top-up; the date updates every time an auto top-up happens |
| 3 | Growth (Yearly) with a downgrade scheduled | Scheduled-downgrade text until the effective date. Once the downgrade happens, or the user cancels it, show the default text |
| 4 | Cancelled but still active | Cancelled text until the billing period ends and the account becomes cancelled and inactive. If the user reverses the cancellation, show the default text |
| 5 | Cancelled and inactive | No text box |

### 2.3 Turn auto top-up OFF
1. User toggles auto top-up OFF → **pop-up 1**. "Stay enabled" → close, no backend change.
2. "Disable auto top-up" → **confirmation pop-up**. Backend: auto top-up = OFF. Frontend: toggle shows OFF on My Plan and the text box shows the default text.

### 2.4 Turn auto top-up ON
1. User toggles ON → pop-up. The copy **must state the charge**: if credits run out, the plan renews early for {{plan_price}} and the billing date resets.
2. "Enable auto top-up" → **confirmation pop-up**. Backend: auto top-up = ON. Frontend: toggle shows ON on My Plan.

### 2.5 Insufficient credits with auto top-up OFF
1. User clicks "Generate report" with insufficient credits → **pop-up 1**. The copy **must state the charge** ({{plan_price}}).
2. "Enable auto top-up" → backend attempts the charge as in 2.1. **If it succeeds:** show a success pop-up, set auto top-up = ON (backend and My Plan), user continues generating the report with the same company.
3. **If the charge fails:** follow 3.1 and 3.2: subscription not cancelled, **auto top-up stays OFF**, user sees the "Payment failed" pop-up.
4. Other options in this pop-up: keep **"View upgrade options"** and, for Growth (Yearly) users, **"Talk to sales"** (both from Phase 1). **Remove "Top up instead".** (Ambiguous: it follows the failed-charge item, so "this pop-up" most likely means the "Payment failed" pop-up. The insufficient-credits pop-up image on page 10 shows only two CTAs, enable-and-pay and "Not now".)

## 3. Failed payment during auto top-up

### 3.1 Logic
| # | Element | Logic |
|---|---|---|
| 1 | Scope | A failed auto top-up charge, started by a report request (Portal or API) while auto top-up is ON, or by "Enable auto top-up" in 2.5. A failed auto-renewal is different (3.3). |
| 2 | Subscription | **Not cancelled.** Plan stays active, user keeps remaining credits, **billing date does not change**. This is the ONLY case where a failed charge does not cancel the subscription. |
| 3 | Failed charge on the billing date | If the normal auto-renewal charge on the billing date fails → cancelled and inactive straight away (Phase 1 section 2.7), whether auto top-up is ON or OFF. The same applies to a failed first monthly charge on a downgrade effective date. |
| 4 | Report that triggered the charge | Not generated, no credits deducted. User can still generate reports that cost less than the balance. |
| 5 | Auto top-up toggle | Stays as it was. ON stays ON, OFF stays OFF. |
| 6 | After a failure | The saved card is **not charged again** until the user pays on Stripe. A report request above the balance shows the "Payment failed" pop-up (Portal) or an error message (API), not a new charge attempt. |
| 7 | How the user continues | Pays on Stripe (3.2). A successful payment works like a successful auto top-up: billing period renews, billing date resets, plan credits added. |
| 8 | Scheduled downgrade | Not affected by the failure. A successful Stripe payment moves the downgrade date, as in 1.6. |
| 9 | No grace period | No grace period and no "Update payment method" flow. |

### 3.2 "Payment failed" pop-up and Pay on Stripe during report generation
1. **Backend:** on a failed auto top-up charge: do not cancel, deduct no credits, do not generate the report. Save a "payment failed" state on the account.
2. **Portal:** show the "Payment failed" pop-up. It says the auto top-up payment failed and the report was not generated, that the user keeps their credits, and that reports below the balance still work. CTAs: "Pay on Stripe" and close. "Pay on Stripe" → Stripe checkout for the user's current plan (Growth Monthly or Yearly) at the **full plan price**. The **new card is saved** as the payment method for future charges. If the user closes the pop-up or leaves Stripe without paying: no change; they can still generate reports below the balance; a report above the balance shows the "Payment failed" pop-up again, with no new charge attempt.
3. After a successful payment: redirect back to the report generation page with the **same company selected** and show a success pop-up. Backend: renew the billing period, reset the billing date, add plan credits, clear the "payment failed" state. **The auto top-up toggle does not change.**
4. **API:** a report request above the balance while in the "payment failed" state returns an error saying the payment failed and the user needs to pay on the Portal.
5. **My Plan:** show a **banner with a "Pay on Stripe" CTA** while the account is in the "payment failed" state. The banner disappears once the user pays on Stripe.
6. The "payment failed" state is also cleared if the next normal renewal succeeds. If the renewal fails, follow 3.3.

### 3.3 Stage 1: charge fails (auto-renewal, or first monthly charge on downgrade date)
BE/FE checklist: (1) subscription status → cancelled and inactive immediately; (2) all active pKYB monitoring stops; (3) new report generation blocked on Portal and API, API key deactivated automatically; (4) historical reports (incl. pKYB) remain accessible 90 days from this date; (5) send the failure email; (6) FE shows the cancelled-and-inactive screen from Phase 1 section 2.7 as it is; (7) "Choose a plan" → Products & Pricing with all plan cards showing "Select plan" → plan confirmation pop-up → Stripe payment → back to My Plan with a confirmation pop-up (same as Phase 1 section 2.7).

### 3.3 Stage 2 and Stage 3
Same as Phase 1: Stage 2: 10 days before the 90-day deletion deadline, send the reminder email. Stage 3a: no plan purchased within 90 days → Phase 1 section 2.6 (historical reports permanently deleted, user can no longer view reports). Stage 3b: a plan purchased within 90 days → historical reports restored, user gets access again.

## 4. Emails (copy ignored)
Needs: Plan downgraded (sent when the effective date is reached); Auto top-up payment confirmation (after a successful auto top-up charge); Auto top-up failed, subscription cancelled; Downgrade scheduled and downgrade cancelled confirmations (**[need input: needed or not?]**). Emails are not part of the prototype.

## 5. Pre and post-rollout (23 March 2027)

### 5.1 Transition logic
| When | Logic |
|---|---|
| Before rollout (until 22 Mar 2027) | Existing Growth rules from Phase 1 remain, including unlimited $249 manual top-ups. |
| On rollout (23 Mar 2027) | Auto top-up turns ON by default for all existing Growth (Monthly and Yearly) users. Manual $249 top-ups removed for Growth. Downgrade (Yearly → Monthly) becomes available. **Credit balances and billing dates do not change.** |
| After rollout | Growth users follow sections 1 to 3. Flex unchanged. |
| Users who activate between T-30 and rollout day | Phase 1 pre-rollout PRD section 4: T-30 catch-up email, then only the scheduled emails not yet sent, the in-app banner on first login, and the checkout disclosure. |

### 5.2 Communication timeline (copy ignored; timing kept)
| Stage | Method |
|---|---|
| T-30 (22 Feb 2027) | Announcement email + persistent in-app banner and pop-up A |
| T-14 (9 Mar 2027) | Reminder email B (14 days); same in-app content |
| T-7 (16 Mar 2027) | Reminder email B (7 days); same in-app content |
| T = rollout (23 Mar 2027) | Rollout email C; replace pre-rollout in-app messaging with banner and pop-up B |
| First login after rollout, up to T+14 (6 Apr 2027) | Intro pop-up B; minimise to a persistent top banner |
| Inactive users, T-21 (2 Mar 2027) to T+14 | If never logged in during the period, show pop-up B on first login; do not restore the banner |
| Checkout, from T-30 until rollout | Purchase and upgrade pages show a checkout disclosure |

Notes: plan name, price and billing period in emails and in-app messages must be dynamic. **[need input]** T-30 is Sunday 21 Feb 2027 (send Sunday or Monday 22 Feb?). PRD-internal inconsistency: heading says T-30 = 21 Feb, table says 22 Feb.

## PRD-internal notes (not conflicts with the prototype)
- Page 2 says emails are "see section 6"; the emails are in section 4. Section 3.3 is used for both "Stage 1" and "Stage 2 and 3".
- 1.5 says "a pop-up shows successful downgrade" after cancelling the downgrade, which reads like a wording slip.
- 1.1 says Phase 1 section 2.5 hid the Monthly card for Yearly users; Phase 1 Part 2 in the old PRD (docs/PRD-billing-phase1.md) said Yearly → Monthly is "Not available".

## What the embedded design images show (pages 3 and 8-11)
Read on 25 Nov 2026. All use a Growth (Monthly) account, $99 / 535 credits, billing date 12 June 2024, so for Monthly "full plan price" and the $99 pack are the same number. No image shows a Yearly auto top-up.
- p3: My Plan (Growth Monthly) still shows a **"Top up now"** button, and the Products & Pricing page for a Yearly user shows the Monthly card CTA as "Switch at renewal" (the PRD text says "Select plan"). The Top up now button contradicts PRD 2.1 #3 (remove top-up CTAs), so these images are older than the text.
- p8-9: "Turn off Auto top up?" with "Stay enabled" / "Disable", then the "turned off" confirmation with "View balance"; My Plan with the toggle OFF.
- p9: **"Turn on Auto top up?" at 0 credits with "Enable and pay $99" / "Stay disabled"**, i.e. turning it on from My Plan with 0 credits charges the pack and renews early. This disagrees with the PRD text in 2.4 and 2.1 #8, where toggling ON only sets ON and a charge starts only from a report request or from "Enable auto top-up" in 2.5.
- p10: "535 credits added" confirmation on My Plan after that charge; My Plan with the toggle ON; the report-page "Not enough credits" pop-up with only "Enable Auto top up and pay $99" and "Not now".
- p11: report-page success pop-up "535 credits added" with "Continue with report".

## Decisions made after the export (product owner, 25 Nov 2026)
These settle gaps and conflicts in the text above; the prototype and Figma follow them.
- **Toggling auto top-up ON with 0 credits charges at once** (2.4, and the p9 image): $99 on Growth Monthly, $999 on Growth Yearly, the plan's pack is added and the plan renews early. Every payment goes through Stripe, which is why the PRD does not write it down.
- **"Continue with report" generates the report** (2.1 and 2.5, and the p11 image): after Auto top up has paid for the credits, the button requests the report the user chose, for the same company. It does not just close the pop-up.
- **Plan credits:** Growth Monthly $99 = 267 credits; Growth Yearly $999 = 3,047 credits (no 535 or 6,094 anywhere). An auto top-up adds the plan's own credits: 267 on Monthly, 3,047 on Yearly.
- **No grace period and no "Update payment method" flow** (3.3), as already stated above.
