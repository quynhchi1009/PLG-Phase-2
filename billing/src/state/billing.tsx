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

/** What the billing page celebrates after a (simulated) Stripe checkout. */
export type Success =
  /** A plan was bought: `via` says whether it moved up from an active plan or started fresh. */
  | { kind: 'upgraded'; planId: PaidPlanId; via: 'upgrade' | 'subscribe' }
  | { kind: 'topped-up'; credits: number }
  /** Asked to reactivate: shows what the customer keeps before they confirm. */
  | { kind: 'reactivate-confirm'; planId: PaidPlanId }
  /** A scheduled cancellation was withdrawn: same plan, same credits, billing resumes. */
  | { kind: 'reactivated'; planId: PaidPlanId; renewsOn: string }
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
  /** Flex allows one top-up. */
  topUpUsed: boolean
  topUpUsedOn: string
  notice: BillingNotice
  success: Success
  events: LedgerEvent[]
  generated: GeneratedReport[]
}

type Action =
  | { type: 'cancel' }
  | { type: 'request-reactivate' }
  | { type: 'reactivate'; today: string }
  | { type: 'subscribe'; planId: PaidPlanId; today: string }
  | { type: 'upgrade'; planId: PaidPlanId; today: string }
  | { type: 'top-up'; today: string }
  | { type: 'generate'; report: string; business: string; credits: number; today: string }
  | { type: 'dismiss-notice' }
  | { type: 'dismiss-success' }
  | {
      type: 'demo'
      status: SubscriptionStatus
      planId?: PaidPlanId
      creditsLeft?: number | 'some' | 'none'
      topUpUsed?: boolean
      endReason?: EndReason
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
  creditsRemaining: 423,
  creditsTotal: 535,
  cycleEnd: CYCLE_END.monthly,
  endedOn: '2026-09-12',
  endReason: 'cancelled',
  topUpUsed: false,
  topUpUsedOn: '',
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
    case 'cancel':
      return { ...state, status: 'cancelling', notice: null }

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
        notice: null,
        success: { kind: 'upgraded', planId: action.planId, via: 'upgrade' },
        events: [event(`Upgrade to ${plan.name}`, action.today, plan.price), ...state.events],
      }
    }

    case 'top-up': {
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
        topUpUsed: !!action.topUpUsed,
        topUpUsedOn: action.topUpUsed ? '2026-09-30' : '',
        endReason: action.endReason ?? 'cancelled',
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

/** Can the customer buy a new plan right now? */
export function canSelectPlan(state: BillingState) {
  return state.status !== 'cancelling' || state.creditsRemaining === 0
}

/** Is a top-up available on the current plan? */
export function canTopUp(state: BillingState) {
  return state.status === 'active' && !(state.planId === 'flex' && state.topUpUsed)
}
