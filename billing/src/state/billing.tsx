import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { PLANS, TOP_UP } from '../data/plans'
import { addDays } from '../data/history'

/**
 * active      paid plan in use
 * cancelling  cancelled, still active until cycle end (or until credits run out)
 * none        lapsed; report history kept for a retention window
 */
export type SubscriptionStatus = 'active' | 'cancelling' | 'none'
export type PaidPlanId = 'flex' | 'monthly' | 'yearly'
export type BillingNotice = 'plan-started' | null
/** Why a lapsed plan ended: the customer cancelled, or a renewal payment failed (auto-cancelled). */
export type EndReason = 'cancelled' | 'payment-failed'
/** Why Stripe could not save a new payment method. The card details themselves are entered and validated on Stripe's page. */
export type PaymentFailure = 'stripe-unavailable' | 'card-declined' | 'card-expired' | 'authentication-failed'
/** What brought up the "Update your payment method" popup: landing on Search, a Generate report click, or an
 *  "Update payment method" button (the sticky banner, the My Plan warning), which goes straight to Stripe. */
export type PaymentPromptReason = 'landing' | 'generate' | 'cta'

/** What the billing page celebrates after a (simulated) Stripe checkout. */
export type Success =
  /** A plan was bought: `via` says whether it moved up from an active plan or started fresh. */
  | { kind: 'upgraded'; planId: PaidPlanId; via: 'upgrade' | 'subscribe' }
  | { kind: 'topped-up'; credits: number }
  /** Asked to reactivate: shows what the customer keeps before they confirm. */
  | { kind: 'reactivate-confirm'; planId: PaidPlanId }
  /** A scheduled cancellation was withdrawn: same plan, same credits, billing resumes. */
  | { kind: 'reactivated'; planId: PaidPlanId; renewsOn: string }
  /** Asked to turn Auto top up off: confirm before anything changes. */
  | { kind: 'auto-top-up-confirm' }
  /** Auto top up was switched off. */
  | { kind: 'auto-top-up-off' }
  /** Asked to turn Auto top up back on: confirm before anything changes. */
  | { kind: 'auto-top-up-enable-confirm' }
  /** Auto top up was switched back on. */
  | { kind: 'auto-top-up-on' }
  /** Version A: asked to turn Auto top up on with 0 credits left, so turning it on also pays now. */
  | { kind: 'auto-top-up-pay-confirm' }
  /** Version A: Auto top up renewed the plan early: the pack was paid for and added, and the billing date moved. */
  | { kind: 'auto-top-up-charged'; credits: number; renewsOn: string }
  /** Asked to switch Growth yearly to monthly at renewal: confirm before anything changes. */
  | { kind: 'downgrade-confirm' }
  /** The switch to monthly is scheduled for the end of the yearly cycle. */
  | { kind: 'downgrade-scheduled'; renewsOn: string }
  /** Version A: asked to keep Growth yearly while a switch to monthly is scheduled: confirm before it is cancelled. */
  | { kind: 'keep-yearly-confirm' }
  /** Version A: the scheduled switch to monthly was cancelled; the yearly plan renews on `renewsOn`. */
  | { kind: 'downgrade-cancelled'; renewsOn: string }
  | null

export interface LedgerEvent {
  id: string
  type: string
  date: string
  amount: number | null
}

export interface GeneratedReport {
  orderId: string
  date: string
  report: string
  business: string
  channel: 'Portal'
  credits: number
}

export interface BillingState {
  status: SubscriptionStatus
  planId: PaidPlanId
  creditsRemaining: number
  /** Credits available this period: plan credits + carried-over + top-ups. */
  creditsTotal: number
  /** ISO date of the next charge and credit reset, or the day the plan ends. Empty for Flex. */
  cycleEnd: string
  /** ISO date the last plan ended, when status is 'none'. */
  endedOn: string
  /** Why the last plan ended, when status is 'none'. */
  endReason: EndReason
  /** Flex allows one manual top-up. Growth has none (it has Auto top up). */
  topUpUsed: boolean
  topUpUsedOn: string
  /** Growth only: automatically buy a top-up when credits run out. */
  autoTopUp: boolean
  /** Growth yearly only: a switch to Growth monthly is scheduled for the end of the cycle. */
  pendingDowngrade: boolean
  /** Counts jumps from the prototype panel, so a page drops dialogs left open from the previous state. */
  demoRun: number
  /** A renewal payment failed and the plan is still active: the customer has until `graceEndsOn` to update the payment method.
   *  `minimized`: the popup was closed, so a sticky banner stands in for it on every page. */
  paymentIssue: {
    graceEndsOn: string
    minimized: boolean
    /** Which popup is open, if any. */
    prompt: PaymentPromptReason | null
    /** Prototype only: how the first attempt to save a card ends. null = it saves. Later attempts save. */
    firstAttempt: PaymentFailure | null
    /** How the latest attempt to save a card failed, until a card is saved. The popup shows it while the customer
     *  tries; the My Plan warning keeps it once the popup is closed. After one failure, the next attempt saves. */
    lastFailure: PaymentFailure | null
  } | null
  notice: BillingNotice
  success: Success
  events: LedgerEvent[]
  generated: GeneratedReport[]
}

type Action =
  | { type: 'cancel' }
  | { type: 'request-downgrade' }
  | { type: 'schedule-downgrade'; today: string }
  | { type: 'cancel-downgrade'; today: string }
  | { type: 'request-reactivate' }
  /** `payNow` (Version A, 0 credits left): turning it on also buys the first pack right away. */
  | { type: 'request-enable-auto-top-up'; payNow?: boolean }
  | { type: 'enable-auto-top-up' }
  /** Auto top up renews the plan early with the payment method on file: pays the pack, adds the credits, moves the billing date, turns Auto top up on. */
  | { type: 'charge-auto-top-up'; today: string }
  | { type: 'request-disable-auto-top-up' }
  | { type: 'disable-auto-top-up' }
  | { type: 'reactivate'; today: string }
  | { type: 'subscribe'; planId: PaidPlanId; today: string }
  | { type: 'upgrade'; planId: PaidPlanId; today: string }
  | { type: 'top-up'; today: string }
  | { type: 'generate'; report: string; business: string; credits: number; today: string }
  | { type: 'dismiss-notice' }
  | { type: 'dismiss-success' }
  | { type: 'request-cancel-downgrade' }
  /** The "Update your payment method" popup was closed: from now on a sticky banner carries the reminder. */
  | { type: 'minimize-payment-issue' }
  | { type: 'open-payment-prompt'; reason: PaymentPromptReason }
  /** Stripe sent back an error instead of a saved card. */
  | { type: 'payment-method-failed'; failure: PaymentFailure }
  /** A new payment method was saved: the popup and the banner go away. */
  | { type: 'resolve-payment-issue' }
  | {
      type: 'demo'
      status: SubscriptionStatus
      planId?: PaidPlanId
      creditsLeft?: number | 'some' | 'none'
      topUpUsed?: boolean
      endReason?: EndReason
      /** Growth only: start with Auto top up off. Defaults to on, as after a Growth purchase. */
      autoTopUp?: boolean
      /** Growth yearly only: start with the switch to monthly already scheduled. */
      pendingDowngrade?: boolean
      /** Start inside the grace period after a failed renewal payment, with the popup open.
       *  The value is how the first attempt to save a card ends: 'ok' saves, or the failure shown. */
      paymentIssue?: 'ok' | PaymentFailure
    }

const CYCLE_END: Record<PaidPlanId, string> = {
  flex: '',
  monthly: '2026-10-28',
  yearly: '2027-09-28',
}

export const TODAY = '2026-10-14'

/** Days after a failed renewal payment before the plan is cancelled automatically (PRD: cancelled on day 7). */
export const PAYMENT_GRACE_DAYS = 7

/** Flex has no billing cycle; per product direction (15 Oct 2026) its balance resets one day out. */
export const FLEX_RESETS_ON = addDays(TODAY, 1)

export const INITIAL_STATE: BillingState = {
  status: 'active',
  planId: 'monthly',
  creditsRemaining: 423,
  creditsTotal: 535,
  cycleEnd: CYCLE_END.monthly,
  endedOn: '2026-09-12',
  endReason: 'cancelled',
  topUpUsed: false,
  topUpUsedOn: '',
  autoTopUp: true,
  pendingDowngrade: false,
  demoRun: 0,
  paymentIssue: null,
  notice: null,
  success: null,
  events: [],
  generated: [],
}

let eventSeq = 1
const event = (type: string, date: string, amount: number | null): LedgerEvent => ({
  id: `evt-${eventSeq++}`,
  type,
  date,
  amount,
})

function reducer(state: BillingState, action: Action): BillingState {
  switch (action.type) {
    // Growth only. Turning it on or off asks first, then confirms.
    case 'request-enable-auto-top-up':
      if (state.planId === 'flex' || state.status !== 'active' || state.autoTopUp) return state
      return {
        ...state,
        success: { kind: action.payNow ? 'auto-top-up-pay-confirm' : 'auto-top-up-enable-confirm' },
      }

    case 'enable-auto-top-up':
      if (state.planId === 'flex' || state.status !== 'active') return state
      return { ...state, autoTopUp: true, success: { kind: 'auto-top-up-on' } }

    // Auto top up renews the subscription early and adds credits immediately: when credits
    // run out with it on (report page), or when it is turned on while out of credits
    // (billing page, or the report page's "not enough credits" prompt). The pack is paid
    // for now, the new billing period starts today, so the next billing date moves to one
    // cycle from today. The card on file is charged, so there is no checkout page.
    case 'charge-auto-top-up': {
      if (state.planId === 'flex' || state.status !== 'active') return state
      const pack = TOP_UP[state.planId]
      const credits = state.creditsRemaining + pack.credits
      const renewsOn = earlyRenewalDate(state.planId, action.today)
      return {
        ...state,
        autoTopUp: true,
        creditsRemaining: credits,
        creditsTotal: credits,
        cycleEnd: renewsOn,
        success: { kind: 'auto-top-up-charged', credits: pack.credits, renewsOn },
        events: [event(`Auto top up · plan renewed early (${pack.credits} credits)`, action.today, pack.price), ...state.events],
      }
    }

    case 'request-disable-auto-top-up':
      if (!state.autoTopUp) return state
      return { ...state, success: { kind: 'auto-top-up-confirm' } }

    case 'disable-auto-top-up':
      return { ...state, autoTopUp: false, success: { kind: 'auto-top-up-off' } }

    // Growth yearly can move down to Growth monthly, at the end of the paid year.
    case 'request-downgrade':
      if (state.planId !== 'yearly' || state.status !== 'active' || state.pendingDowngrade) return state
      return { ...state, success: { kind: 'downgrade-confirm' } }

    case 'schedule-downgrade':
      if (state.planId !== 'yearly' || state.status !== 'active') return state
      return {
        ...state,
        pendingDowngrade: true,
        success: { kind: 'downgrade-scheduled', renewsOn: state.cycleEnd },
        events: [event('Downgrade to Growth monthly scheduled', action.today, null), ...state.events],
      }

    // Opens the "Keep your yearly plan?" confirmation; nothing changes yet.
    case 'request-cancel-downgrade':
      if (!state.pendingDowngrade || state.status !== 'active') return state
      return { ...state, success: { kind: 'keep-yearly-confirm' } }

    case 'minimize-payment-issue':
      if (!state.paymentIssue) return state
      return { ...state, paymentIssue: { ...state.paymentIssue, minimized: true, prompt: null } }

    case 'open-payment-prompt':
      if (!state.paymentIssue) return state
      return { ...state, paymentIssue: { ...state.paymentIssue, prompt: action.reason } }

    case 'payment-method-failed':
      if (!state.paymentIssue) return state
      return { ...state, paymentIssue: { ...state.paymentIssue, lastFailure: action.failure } }

    case 'resolve-payment-issue':
      return { ...state, paymentIssue: null }

    case 'cancel-downgrade':
      if (!state.pendingDowngrade) return state
      return {
        ...state,
        pendingDowngrade: false,
        // When the confirmation asked, it hands over to the result dialog; a cancel with no confirmation behind it shows none.
        success:
          state.success?.kind === 'keep-yearly-confirm'
            ? { kind: 'downgrade-cancelled', renewsOn: state.cycleEnd }
            : state.success,
        events: [event('Downgrade cancelled · keeping Growth yearly', action.today, null), ...state.events],
      }

    case 'cancel':
      // Cancelling switches Auto top up off: no automatic charges after the plan ends.
      return { ...state, status: 'cancelling', autoTopUp: false, pendingDowngrade: false, paymentIssue: null, notice: null }

    // Opens the "Don't miss out on your plan benefits" confirmation; nothing changes yet.
    case 'request-reactivate':
      if (state.status !== 'cancelling') return state
      return { ...state, success: { kind: 'reactivate-confirm', planId: state.planId } }

    // Undoes a scheduled cancellation before the cycle ends. Nothing is charged
    // now; the plan simply renews on the date it would have ended.
    case 'reactivate':
      if (state.status !== 'cancelling') return state
      return {
        ...state,
        status: 'active',
        // Growth gets Auto top up back, as it does on any successful Growth subscription.
        autoTopUp: state.planId !== 'flex',
        notice: null,
        success: { kind: 'reactivated', planId: state.planId, renewsOn: state.cycleEnd },
        events: [event('Subscription reactivated', action.today, null), ...state.events],
      }

    case 'subscribe': {
      // A fresh purchase after a plan lapsed or was cancelled: credits start clean.
      const plan = PLANS[action.planId]
      const credits = plan.credits ?? 0
      return {
        ...state,
        status: 'active',
        planId: action.planId,
        creditsRemaining: credits,
        creditsTotal: credits,
        cycleEnd: nextBillingDate(plan.cycle, action.today),
        topUpUsed: false,
        topUpUsedOn: '',
        autoTopUp: action.planId !== 'flex',
        pendingDowngrade: false,
        notice: null,
        success: { kind: 'upgraded', planId: action.planId, via: 'subscribe' },
        events: [event(plan.name, action.today, plan.price), ...state.events],
      }
    }

    case 'upgrade': {
      // Upgrades carry unused credits over into the new plan.
      const plan = PLANS[action.planId]
      const credits = (plan.credits ?? 0) + state.creditsRemaining
      return {
        ...state,
        status: 'active',
        planId: action.planId,
        creditsRemaining: credits,
        creditsTotal: credits,
        cycleEnd: nextBillingDate(plan.cycle, action.today),
        topUpUsed: false,
        topUpUsedOn: '',
        autoTopUp: action.planId !== 'flex',
        pendingDowngrade: false,
        notice: null,
        success: { kind: 'upgraded', planId: action.planId, via: 'upgrade' },
        events: [event(`Upgrade to ${plan.name}`, action.today, plan.price), ...state.events],
      }
    }

    case 'top-up': {
      // Manual top-ups are Flex-only (one, then used). Growth tops up through 'charge-auto-top-up'.
      if (!canTopUp(state)) return state
      const pack = TOP_UP[state.planId]
      return {
        ...state,
        creditsRemaining: state.creditsRemaining + pack.credits,
        creditsTotal: state.creditsRemaining + pack.credits,
        topUpUsed: pack.once ? true : state.topUpUsed,
        topUpUsedOn: pack.once ? action.today : state.topUpUsedOn,
        success: { kind: 'topped-up', credits: pack.credits },
        events: [event(`Top-up (${pack.credits} credits)`, action.today, pack.price), ...state.events],
      }
    }

    case 'generate':
      return {
        ...state,
        creditsRemaining: Math.max(0, state.creditsRemaining - action.credits),
        generated: [
          {
            orderId: String(113 + state.generated.length).padStart(10, '0'),
            date: action.today,
            report: action.report,
            business: action.business,
            channel: 'Portal',
            credits: action.credits,
          },
          ...state.generated,
        ],
      }

    case 'dismiss-notice':
      return { ...state, notice: null }

    case 'dismiss-success':
      return { ...state, success: null }

    case 'demo': {
      const planId = action.planId ?? state.planId
      const credits = PLANS[planId].credits ?? 0
      const scheduled = !!action.pendingDowngrade && planId === 'yearly' && action.status === 'active'
      const left = action.creditsLeft
      const creditsRemaining =
        action.status === 'none'
          ? 0
          : typeof left === 'number'
            ? left
            : left === 'none'
              ? 0
              : action.status === 'cancelling'
                ? Math.round(credits * 0.46)
                : Math.round(credits * 0.79)
      return {
        ...INITIAL_STATE,
        status: action.status,
        planId,
        cycleEnd: CYCLE_END[planId],
        creditsRemaining,
        creditsTotal: credits,
        autoTopUp: planId !== 'flex' && (action.autoTopUp ?? true),
        topUpUsed: !!action.topUpUsed,
        topUpUsedOn: action.topUpUsed ? '2026-09-30' : '',
        endReason: action.endReason ?? 'cancelled',
        demoRun: state.demoRun + 1,
        paymentIssue:
          action.paymentIssue && action.status === 'active'
            ? {
                graceEndsOn: addDays(TODAY, PAYMENT_GRACE_DAYS),
                minimized: false,
                prompt: 'landing',
                firstAttempt: action.paymentIssue === 'ok' ? null : action.paymentIssue,
                lastFailure: null,
              }
            : null,
        ...(scheduled && {
          pendingDowngrade: true,
          events: [event('Downgrade to Growth monthly scheduled', TODAY, null), ...INITIAL_STATE.events],
        }),
      }
    }
  }
}

interface BillingContextValue {
  state: BillingState
  dispatch: React.Dispatch<Action>
}

const BillingContext = createContext<BillingContextValue | null>(null)

export function BillingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
}

export function useBilling() {
  const ctx = useContext(BillingContext)
  if (!ctx) throw new Error('useBilling must be used inside BillingProvider')
  return ctx
}

/** ISO date one billing cycle after `from`; empty for one-time plans. */
export function nextBillingDate(cycle: 'month' | 'year' | null, from: string) {
  if (!cycle) return ''
  const d = new Date(`${from}T00:00:00Z`)
  if (cycle === 'year') d.setUTCFullYear(d.getUTCFullYear() + 1)
  else d.setUTCMonth(d.getUTCMonth() + 1)
  return d.toISOString().slice(0, 10)
}

/** The next billing date if Auto top up renews the plan today: one cycle from today. */
export function earlyRenewalDate(planId: PaidPlanId, today: string) {
  return nextBillingDate(PLANS[planId].cycle, today)
}

/** Can the customer buy a new plan right now? */
export function canSelectPlan(state: BillingState) {
  return state.status !== 'cancelling' || state.creditsRemaining === 0
}

/**
 * Can the customer buy a manual top-up right now? Only Flex can, and only once: Growth has no manual
 * top-ups (Phase 2); its credits are topped up by Auto top up. No "Top up" CTA or page for Growth.
 */
export function canTopUp(state: BillingState) {
  return state.status === 'active' && state.planId === 'flex' && !state.topUpUsed
}
