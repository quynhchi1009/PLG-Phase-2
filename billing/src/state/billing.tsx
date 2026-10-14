import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { PLANS, TOP_UP } from '../data/plans'

/**
 * active      paid plan in use
 * cancelling  cancelled, still active until cycle end (or until credits run out)
 * none        lapsed; report history kept for a retention window
 */
export type SubscriptionStatus = 'active' | 'cancelling' | 'none'
export type PaidPlanId = 'flex' | 'monthly' | 'yearly'
export type BillingNotice = 'plan-started' | null

/** What the billing page celebrates after a (simulated) Stripe checkout. */
/* Each carries the before-state so the dialog can show the change, not just the result. */
export type Success =
  | {
      kind: 'upgraded'
      planId: PaidPlanId
      /** The plan being replaced; null for a fresh purchase after a plan ended or was cancelled. */
      fromPlanId: PaidPlanId | null
      /** Balance before checkout; on a fresh purchase these credits do not carry over. */
      before: number
      /** Unused credits rolled into the new plan. */
      carried: number
      /** Credits the new plan adds. */
      added: number
    }
  | { kind: 'topped-up'; credits: number; before: number }
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
    }

const CYCLE_END: Record<PaidPlanId, string> = {
  flex: '',
  monthly: '2026-10-28',
  yearly: '2027-09-28',
}

export const TODAY = '2026-10-14'

export const INITIAL_STATE: BillingState = {
  status: 'active',
  planId: 'monthly',
  creditsRemaining: 212,
  creditsTotal: 267,
  cycleEnd: CYCLE_END.monthly,
  endedOn: '2026-09-12',
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
        success: { kind: 'upgraded', planId: action.planId, fromPlanId: null, before: state.creditsRemaining, carried: 0, added: credits },
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
        success: {
          kind: 'upgraded',
          planId: action.planId,
          fromPlanId: state.planId,
          before: state.creditsRemaining,
          carried: state.creditsRemaining,
          added: plan.credits ?? 0,
        },
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
        success: { kind: 'topped-up', credits: pack.credits, before: state.creditsRemaining },
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
