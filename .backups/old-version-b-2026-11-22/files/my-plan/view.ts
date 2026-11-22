import { PLANS, REPORT_RETENTION_DAYS, formatPrice, type PlanFeature } from '../../data/plans'
import { addDays, formatDate } from '../../data/history'
import type { BillingState, PaidPlanId } from '../../state/billing'

/* What My Plan (Version B) shows for each account state. Everything the strip,
   the banner and the modules need to agree on lives here, so the same fact is
   never worked out twice. The states follow Figure 2 of IA draft 4. */

/** Flex credits count as low below this share of what the customer holds. */
export const LOW_CREDIT_SHARE = 0.25
/** A failed renewal gets a grace period; the plan ends on day 7. */
export const PAYMENT_GRACE_DAYS = 7

export const creditPool = (s: BillingState) => Math.max(s.creditsTotal, s.creditsRemaining)

export const creditShare = (s: BillingState) => {
  const pool = creditPool(s)
  return pool ? Math.min(1, s.creditsRemaining / pool) : 0
}

export const isLowFlex = (s: BillingState) =>
  s.status === 'active' && s.planId === 'flex' && creditShare(s) < LOW_CREDIT_SHARE

export const isPaymentFailed = (s: BillingState) => s.status === 'active' && !!s.paymentFailedOn

export const paymentDue = (s: BillingState) => addDays(s.paymentFailedOn, PAYMENT_GRACE_DAYS)

export const cadenceOf = (id: PaidPlanId) =>
  id === 'flex' ? 'one-time purchase' : id === 'yearly' ? 'billed yearly' : 'billed monthly'

/** The one primary action the strip offers, chosen by state. */
export type PlanAction = 'top-up' | 'change-plan' | 'keep-yearly' | 'reactivate' | 'update-payment' | 'choose-plan'

export interface StripView {
  badge: { tone: 'positive' | 'warning' | 'negative' | 'neutral'; label: string }
  plan: { name: string; sub: string }
  fact: { label: string; value: string; sub?: string }
  action: { kind: PlanAction; label: string } | null
}

const ACTION_LABEL: Record<PlanAction, string> = {
  'top-up': 'Top up',
  'change-plan': 'Change plan',
  'keep-yearly': 'Keep yearly billing',
  reactivate: 'Reactivate plan',
  'update-payment': 'Update payment method',
  'choose-plan': 'Choose a plan',
}

const action = (kind: PlanAction) => ({ kind, label: ACTION_LABEL[kind] })

export function stripView(s: BillingState): StripView {
  const plan = PLANS[s.planId]
  const price = formatPrice(plan.price ?? 0)
  const sub = cadenceOf(s.planId)

  if (s.status === 'none') {
    return {
      badge: { tone: 'neutral', label: 'No active plan' },
      plan: { name: 'No plan', sub: `${plan.tier} ended ${formatDate(s.endedOn)}` },
      fact: { label: 'Reports kept until', value: formatDate(addDays(s.endedOn, REPORT_RETENTION_DAYS)) },
      action: action('choose-plan'),
    }
  }

  if (s.status === 'cancelling') {
    return {
      badge: { tone: 'warning', label: `Ends on ${formatDate(s.cycleEnd)}` },
      plan: { name: plan.tier, sub },
      fact: { label: 'Plan ends', value: formatDate(s.cycleEnd), sub: 'No further charges' },
      action: action('reactivate'),
    }
  }

  if (s.planId === 'flex') {
    const low = isLowFlex(s)
    return {
      badge: { tone: 'positive', label: 'Active' },
      plan: { name: plan.tier, sub },
      fact: { label: 'Billing', value: 'One-time', sub: 'Credits never expire' },
      action: low ? action(s.topUpUsed ? 'change-plan' : 'top-up') : null,
    }
  }

  if (isPaymentFailed(s)) {
    return {
      badge: { tone: 'negative', label: 'Payment failed' },
      plan: { name: plan.tier, sub },
      fact: { label: 'Pay by', value: formatDate(paymentDue(s)), sub: 'Your plan ends if unpaid' },
      action: action('update-payment'),
    }
  }

  if (s.pendingDowngrade) {
    return {
      badge: { tone: 'warning', label: `Switches to monthly on ${formatDate(s.cycleEnd)}` },
      plan: { name: plan.tier, sub },
      fact: { label: 'Next charge', value: formatDate(s.cycleEnd), sub: `${formatPrice(PLANS.monthly.price ?? 0)} as Growth monthly` },
      action: action('keep-yearly'),
    }
  }

  return {
    badge: { tone: 'positive', label: `Active, ${s.planId === 'yearly' ? 'yearly' : 'monthly'}` },
    plan: { name: plan.tier, sub },
    fact: { label: 'Next charge', value: formatDate(s.cycleEnd), sub: price },
    action: null,
  }
}

/** The sticky banner: one at a time, lowest rank first. Information-only states never become one. */
export type BannerView =
  | { kind: 'payment-failed'; due: string }
  | { kind: 'low-credits'; topUpUsed: boolean; empty: boolean }
  | null

export function bannerView(s: BillingState): BannerView {
  if (isPaymentFailed(s)) return { kind: 'payment-failed', due: formatDate(paymentDue(s)) }
  if (isLowFlex(s)) return { kind: 'low-credits', topUpUsed: s.topUpUsed, empty: s.creditsRemaining === 0 }
  return null
}

/** Plans Change plan offers, by what the customer holds now. Plans only move up, bar yearly to monthly. */
export type OfferId = 'flex' | 'monthly' | 'yearly' | 'business'

export function offeredPlans(s: BillingState): OfferId[] {
  if (s.status !== 'active') return ['flex', 'monthly', 'yearly', 'business']
  if (s.planId === 'flex') return ['monthly', 'yearly', 'business']
  if (s.planId === 'monthly') return ['yearly', 'business']
  return ['monthly', 'business']
}

/** Can Change plan open right now? A cancelled plan with credits left is locked; Reactivate plan is offered. */
export const canChangePlan = (s: BillingState) => s.status !== 'cancelling' || s.creditsRemaining === 0

/** What each plan includes, written for the Your plan module. */
export function perksFor(id: PaidPlanId): PlanFeature[] {
  const suite = { title: 'Full verification suite:', detail: 'KYB, AML & UBO checks, with real-time monitoring across Asia' }
  if (id === 'flex')
    return [
      suite,
      { title: 'No expiry:', detail: 'credits and Portal access never expire' },
      { title: 'One top-up:', detail: 'add 623 more credits for $249, once' },
      { title: 'API access:', detail: 'included until your credits run out' },
    ]
  const cycle = id === 'yearly' ? 'year' : 'month'
  return [
    suite,
    { title: 'API access:', detail: "unlimited use for as long as you're on the plan" },
    { title: 'Auto-renews:', detail: `each ${cycle}; unused credits expire at the end of the billing period` },
    { title: 'Auto top-up:', detail: 'renews your plan early when credits run out, if you turn it on' },
  ]
}
