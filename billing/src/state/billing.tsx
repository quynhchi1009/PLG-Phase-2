import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { PLANS, TOP_UP, formatCount } from '../data/plans'
import { addDays } from '../data/history'

/**
 * active      paid plan in use
 * cancelling  cancelled, still active until cycle end (or until credits run out)
 * none        lapsed; report history kept for a retention window
 */
export type SubscriptionStatus = 'active' | 'cancelling' | 'none'
export type PaidPlanId = 'flex' | 'monthly' | 'yearly'
export type BillingNotice = 'plan-started' | null
/** Why a lapsed plan ended: the customer cancelled, or a renewal payment failed (cancelled and inactive straight away, no grace period). */
export type EndReason = 'cancelled' | 'payment-failed'

/** What the billing page celebrates after a (simulated) Stripe checkout. */
export type Success =
  /** A plan was bought: `via` says whether it moved up from an active plan or started fresh. */
  | { kind: 'upgraded'; planId: PaidPlanId; via: 'upgrade' | 'subscribe' }
  | { kind: 'topped-up'; credits: number }
  /** Asked to reactivate: shows what the customer keeps before they confirm. `needed` is set when it opened
   *  from "Generate report" with too few credits: the credits that report costs, so the pop-up can say so. */
  | { kind: 'reactivate-confirm'; planId: PaidPlanId; needed?: number }
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
  /** Version A: Auto top up renewed the plan early: the pack was paid for and added, and the billing date moved.
   *  `downgradeCancelled`: a switch to monthly was scheduled, and renewing now cancelled it ("Renew current plan"). */
  | { kind: 'auto-top-up-charged'; credits: number; renewsOn: string; downgradeCancelled?: boolean; report?: ReportRequest }
  /** Version A: the charge from turning Auto top up on at 0 credits was declined (PRD 3.2). Auto top up stays off. */
  | { kind: 'auto-top-up-failed' }
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

/** The report a customer asked for on the Choose report page, held while Auto top up pays for it. */
export interface ReportRequest {
  report: string
  business: string
  credits: number
}

/** The toast shown when a report is requested, from the Generate button or from "Continue with your report". */
export function reportRequestedMessage(r: ReportRequest) {
  return `${r.report} report requested for ${r.business}. ${r.credits} credits used.`
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
  /** Growth only (PRD 2.2 #2): ISO date of the last Auto top up charge, shown in the Auto top up message on
   *  My Plan and replaced by every new charge. Empty means the default text. Cleared when Auto top up is
   *  turned off, the plan is cancelled, reactivated, bought again or upgraded. */
  lastAutoTopUpOn: string
  /** Growth yearly only: a switch to Growth monthly is scheduled for the end of the cycle. Auto top up is off
   *  and can't be turned on meanwhile: a top-up renews the yearly plan, which would undo the switch (27 Nov 2026). */
  pendingDowngrade: boolean
  /** Growth only (PRD 3.2): the last Auto top up charge failed and has not been paid on Stripe. The plan
   *  is not cancelled and nothing else changes; reports that cost more than the balance show the
   *  "Payment failed" pop-up again, with no new charge. */
  paymentFailed: boolean
  /** Counts jumps from the prototype panel, so a page drops dialogs left open from the previous state. */
  demoRun: number
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
  | { type: 'request-reactivate'; needed?: number }
  /** `payNow` (Version A, 0 credits left): turning it on also buys the first pack right away. */
  | { type: 'request-enable-auto-top-up'; payNow?: boolean }
  | { type: 'enable-auto-top-up' }
  /** Auto top up renews the plan early with the payment method on file: pays the pack, adds the credits, moves the billing date, turns Auto top up on. */
  | { type: 'charge-auto-top-up'; today: string; report?: ReportRequest }
  /** The Auto top up charge was declined (PRD 3.2). Only remembers it: no credits, no new billing date, the plan is not cancelled and Auto top up keeps its setting. */
  /** `showResult`: the charge came from My Plan, so the Payment failed pop-up takes the confirmation's place there. */
  | { type: 'fail-auto-top-up'; showResult?: boolean }
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
      /** Growth only: start with a failed Auto top up charge not yet paid on Stripe. */
      paymentFailed?: boolean
      /** Growth only: start a few days after an Auto top up charge, so My Plan shows its date. */
      afterAutoTopUp?: boolean
    }

const CYCLE_END: Record<PaidPlanId, string> = {
  flex: '',
  monthly: '2026-10-28',
  yearly: '2027-09-28',
}

export const TODAY = '2026-10-14'

/** Flex has no billing cycle; per product direction (15 Oct 2026) its balance resets one day out. */
export const FLEX_RESETS_ON = addDays(TODAY, 1)

export const INITIAL_STATE: BillingState = {
  status: 'active',
  planId: 'monthly',
  creditsRemaining: 211,
  creditsTotal: 267,
  cycleEnd: CYCLE_END.monthly,
  endedOn: '2026-09-12',
  endReason: 'cancelled',
  topUpUsed: false,
  topUpUsedOn: '',
  autoTopUp: true,
  lastAutoTopUpOn: '',
  pendingDowngrade: false,
  paymentFailed: false,
  demoRun: 0,
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
      // While a switch to monthly is scheduled, Auto top up stays off (see `pendingDowngrade`).
      if (state.planId === 'flex' || state.status !== 'active' || state.autoTopUp || state.pendingDowngrade) return state
      // PRD 3.1 #6: after a failed charge the card is not charged again until the customer pays on Stripe,
      // so turning it on at 0 credits shows the Payment failed pop-up instead of a new charge.
      if (action.payNow && state.paymentFailed) return { ...state, success: { kind: 'auto-top-up-failed' } }
      return {
        ...state,
        success: { kind: action.payNow ? 'auto-top-up-pay-confirm' : 'auto-top-up-enable-confirm' },
      }

    case 'enable-auto-top-up':
      if (state.planId === 'flex' || state.status !== 'active' || state.pendingDowngrade) return state
      return { ...state, autoTopUp: true, success: { kind: 'auto-top-up-on' } }

    // Auto top up renews the subscription early and adds credits immediately: when credits
    // run out with it on (report page), or when it is turned on while out of credits
    // (billing page, or the report page's "not enough credits" prompt). The pack is paid
    // for now, the new billing period starts today, so the next billing date moves to one
    // cycle from today. The card on file is charged, so there is no checkout page.
    // A scheduled switch to monthly can't survive this (27 Nov 2026, replacing PRD 1.6 #2): the charge renews the
    // yearly plan, so the only way it runs while one is scheduled is "Renew current plan" on the report page,
    // which cancels the switch and turns Auto top up on. The success message says so.
    case 'charge-auto-top-up': {
      if (state.planId === 'flex' || state.status !== 'active') return state
      const pack = TOP_UP[state.planId]
      const credits = state.creditsRemaining + pack.credits
      const renewsOn = earlyRenewalDate(state.planId, action.today)
      const downgradeCancelled = state.pendingDowngrade
      return {
        ...state,
        autoTopUp: true,
        pendingDowngrade: false,
        // PRD 2.2 #2: My Plan names the date of the last Auto top up, and every new charge replaces it.
        lastAutoTopUpOn: action.today,
        paymentFailed: false,
        creditsRemaining: credits,
        creditsTotal: credits,
        cycleEnd: renewsOn,
        success: {
          kind: 'auto-top-up-charged',
          credits: pack.credits,
          renewsOn,
          downgradeCancelled,
          report: action.report,
        },
        events: [
          event(
            downgradeCancelled
              ? `Plan renewed early · downgrade cancelled, Auto top up on (${formatCount(pack.credits)} credits)`
              : `Auto top up · plan renewed early (${formatCount(pack.credits)} credits)`,
            action.today,
            pack.price,
          ),
          ...state.events,
        ],
      }
    }

    // PRD 3.2: a failed Auto top up charge does not cancel the plan. Credits, billing date and the
    // Auto top up setting stay as they were; the report page shows the "Payment failed" pop-up.
    case 'fail-auto-top-up':
      if (state.planId === 'flex' || state.status !== 'active') return state
      return {
        ...state,
        paymentFailed: true,
        ...(action.showResult ? { success: { kind: 'auto-top-up-failed' as const } } : {}),
      }

    case 'request-disable-auto-top-up':
      if (!state.autoTopUp) return state
      return { ...state, success: { kind: 'auto-top-up-confirm' } }

    // PRD 2.3 #2: with Auto top up off the message goes back to the default text, so the date is dropped.
    case 'disable-auto-top-up':
      return { ...state, autoTopUp: false, lastAutoTopUpOn: '', success: { kind: 'auto-top-up-off' } }

    // Growth yearly can move down to Growth monthly, at the end of the paid year.
    case 'request-downgrade':
      if (state.planId !== 'yearly' || state.status !== 'active' || state.pendingDowngrade) return state
      return { ...state, success: { kind: 'downgrade-confirm' } }

    case 'schedule-downgrade':
      if (state.planId !== 'yearly' || state.status !== 'active') return state
      return {
        ...state,
        pendingDowngrade: true,
        // Auto top up would renew the yearly plan and undo the switch, so it goes off until the switch happens.
        autoTopUp: false,
        lastAutoTopUpOn: '',
        success: { kind: 'downgrade-scheduled', renewsOn: state.cycleEnd },
        events: [event('Downgrade to Growth monthly scheduled', action.today, null), ...state.events],
      }

    // Opens the "Keep your yearly plan?" confirmation; nothing changes yet.
    case 'request-cancel-downgrade':
      if (!state.pendingDowngrade || state.status !== 'active') return state
      return { ...state, success: { kind: 'keep-yearly-confirm' } }

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
      return { ...state, status: 'cancelling', autoTopUp: false, lastAutoTopUpOn: '', pendingDowngrade: false, notice: null }

    // Opens the "Don't miss out on your plan benefits" confirmation; nothing changes yet.
    case 'request-reactivate':
      if (state.status !== 'cancelling') return state
      return { ...state, success: { kind: 'reactivate-confirm', planId: state.planId, needed: action.needed } }

    // Undoes a scheduled cancellation before the cycle ends. Nothing is charged
    // now; the plan simply renews on the date it would have ended.
    case 'reactivate':
      if (state.status !== 'cancelling') return state
      return {
        ...state,
        status: 'active',
        // Growth gets Auto top up back, as it does on any successful Growth subscription.
        autoTopUp: state.planId !== 'flex',
        lastAutoTopUpOn: '',
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
        lastAutoTopUpOn: '',
        pendingDowngrade: false,
        paymentFailed: false,
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
        // Monthly to Yearly is a default-text case (PRD 2.2 #1): the new plan has had no Auto top up yet.
        lastAutoTopUpOn: '',
        pendingDowngrade: false,
        paymentFailed: false,
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
      // A scheduled switch to monthly keeps Auto top up off (see `pendingDowngrade`).
      const autoTopUp = planId !== 'flex' && !scheduled && (action.autoTopUp ?? true)
      // "After an auto top-up": the last charge was a few days ago, so the billing date is one cycle from it.
      const afterAutoTopUp = !!action.afterAutoTopUp && autoTopUp && action.status === 'active'
      const lastAutoTopUpOn = afterAutoTopUp ? addDays(TODAY, -4) : ''
      return {
        ...INITIAL_STATE,
        status: action.status,
        planId,
        cycleEnd: afterAutoTopUp ? earlyRenewalDate(planId, lastAutoTopUpOn) : CYCLE_END[planId],
        creditsRemaining,
        creditsTotal: credits,
        autoTopUp,
        lastAutoTopUpOn,
        topUpUsed: !!action.topUpUsed,
        topUpUsedOn: action.topUpUsed ? '2026-09-30' : '',
        endReason: action.endReason ?? 'cancelled',
        paymentFailed: !!action.paymentFailed && planId !== 'flex' && action.status === 'active',
        demoRun: state.demoRun + 1,
        ...(scheduled && {
          pendingDowngrade: true,
          events: [event('Downgrade to Growth monthly scheduled', TODAY, null), ...INITIAL_STATE.events],
        }),
        ...(afterAutoTopUp && {
          events: [
            event(`Auto top up · plan renewed early (${formatCount(TOP_UP[planId].credits)} credits)`, lastAutoTopUpOn, TOP_UP[planId].price),
            ...INITIAL_STATE.events,
          ],
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
