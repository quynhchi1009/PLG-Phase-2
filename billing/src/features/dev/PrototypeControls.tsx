import { useState } from 'react'
import { FlaskConical, Moon, Sun, X } from 'lucide-react'
import {
  useBilling,
  type EndReason,
  type PaidPlanId,
  type PaymentFailure,
  type SubscriptionStatus,
} from '../../state/billing'
import { useUi, type Route } from '../../state/ui'

/** One row of the panel: a flow, opened on the screen where that flow starts. */
interface Scenario {
  id: string
  label: string
  /** What to click next. Shown under the row once it is picked, so the flow can be found without knowing the UI. */
  steps: string
  status: SubscriptionStatus
  planId: PaidPlanId
  creditsLeft?: number | 'some' | 'none'
  topUpUsed?: boolean
  endReason?: EndReason
  autoTopUp?: boolean
  /** Growth yearly with the switch to monthly already scheduled. */
  pendingDowngrade?: boolean
  /** Inside the grace period after a failed renewal payment, with its popup open. The value is how the
   *  first attempt to save a card ends: 'ok' saves, anything else is the error shown. */
  paymentIssue?: 'ok' | PaymentFailure
  route?: Route
}

interface Group {
  title: string
  items: Scenario[]
}

const REPORT_STEPS = 'Opens the report page. Generate a report to hit the limit.'

/* The panel is organised the way the Figma file is: one group per journey, one row per lane, named
   with the lane's own title ("Downgrade (Yearly → Monthly)"). A row is a flow, not a bare account
   state: several rows start from the same account (Growth yearly, active) and differ in what you do
   next, which is why each one says so.

   Auto top up renews the plan early: it charges the pack, adds the credits and moves the billing
   date to one cycle from today.
   1 turn it off (billing page, credits left)
   2 turn it back on after running out (billing page, 0 credits): on renews early right away
   3 out of credits at the report page with it off: the prompt offers to turn it on
   4 out of credits at the report page with it on: it renews early by itself */
const GROUPS: Group[] = [
  {
    title: 'Growth',
    items: [
      {
        id: 'g-up-year',
        label: 'Upgrade · Monthly → Yearly',
        steps: 'Click Change plan, then Select plan on the Growth yearly card.',
        status: 'active',
        planId: 'monthly',
      },
      {
        id: 'g-up-biz',
        label: 'Upgrade · Yearly → Business',
        steps: 'Click Change plan, then Talk to sales on the Business card.',
        status: 'active',
        planId: 'yearly',
      },
      {
        id: 'g-down',
        label: 'Downgrade · Yearly → Monthly',
        steps: 'Click Change plan, then Switch at renewal on the Growth monthly card.',
        status: 'active',
        planId: 'yearly',
      },
      {
        id: 'g-down-keep',
        label: 'Downgrade scheduled · Keep yearly plan',
        steps: 'The downgrade to monthly is already scheduled. Click Keep yearly plan to undo it.',
        status: 'active',
        planId: 'yearly',
        pendingDowngrade: true,
      },
      { id: 'g-m-low', label: 'Low credits · Monthly', steps: REPORT_STEPS, status: 'active', planId: 'monthly', creditsLeft: 6, route: 'report' },
      { id: 'g-y-low', label: 'Low credits · Yearly', steps: REPORT_STEPS, status: 'active', planId: 'yearly', creditsLeft: 6, route: 'report' },
    ],
  },
  {
    title: 'Auto top up',
    items: [
      {
        id: 'a-off',
        label: '1 · Turn off',
        steps: 'Switch Auto top up off in the credit balance card.',
        status: 'active',
        planId: 'monthly',
        autoTopUp: true,
      },
      {
        id: 'a-on',
        label: '2 · Turn back on at 0 credits, renew early',
        steps: 'Switch Auto top up on. With 0 credits it pays the pack and renews the plan at once.',
        status: 'active',
        planId: 'monthly',
        creditsLeft: 0,
        autoTopUp: false,
      },
      {
        id: 'a-gate',
        label: '3 · Out of credits at report, off',
        steps: `${REPORT_STEPS} The prompt offers to turn Auto top up on.`,
        status: 'active',
        planId: 'monthly',
        creditsLeft: 6,
        autoTopUp: false,
        route: 'report',
      },
      {
        id: 'a-auto',
        label: '4 · Out of credits at report, on',
        steps: `${REPORT_STEPS} Auto top up renews the plan by itself.`,
        status: 'active',
        planId: 'monthly',
        creditsLeft: 6,
        autoTopUp: true,
        route: 'report',
      },
    ],
  },
  {
    title: 'Flex',
    items: [
      {
        id: 'f-zero',
        label: '1 · 0 credits',
        steps: 'Click Top up now or Change plan to see Upgrade or top up your plan.',
        status: 'active',
        planId: 'flex',
        creditsLeft: 0,
      },
      {
        id: 'f-used',
        label: '2 · Credits left, top-up used',
        steps: 'Click Change plan to upgrade. The one-time top-up is already used.',
        status: 'active',
        planId: 'flex',
        creditsLeft: 124,
        topUpUsed: true,
      },
      { id: 'f-low', label: '3 · Low credits, top-up available', steps: REPORT_STEPS, status: 'active', planId: 'flex', creditsLeft: 6, route: 'report' },
      { id: 'f-low-used', label: '4 · Low credits, top-up used', steps: REPORT_STEPS, status: 'active', planId: 'flex', creditsLeft: 6, topUpUsed: true, route: 'report' },
    ],
  },
  {
    title: 'Cancellation',
    items: [
      {
        id: 'c-flow',
        label: 'Cancel plan · Growth monthly',
        steps: 'Click Cancel plan, then walk the three steps.',
        status: 'active',
        planId: 'monthly',
      },
      {
        id: 'c-some',
        label: 'Cancelled · credits > 0',
        steps: 'Click Reactivate subscription. Choose a plan stays hidden until the credits run out.',
        status: 'cancelling',
        planId: 'monthly',
        creditsLeft: 'some',
      },
      {
        id: 'c-none',
        label: 'Cancelled · credits = 0',
        steps: 'Click Reactivate subscription, or Choose a plan: any plan is open at 0 credits.',
        status: 'cancelling',
        planId: 'monthly',
        creditsLeft: 'none',
      },
      {
        id: 'inactive',
        label: 'Inactive',
        steps: 'The plan has ended. Click Choose a plan to subscribe again.',
        status: 'none',
        planId: 'monthly',
      },
    ],
  },
  {
    title: 'Failed payment',
    items: [
      {
        id: 'p-grace',
        label: 'Grace period · Update payment method',
        steps:
          'Opens Search with the popup. Update payment method opens Stripe (simulated) and the card saves. Close the popup and a sticky banner follows you on every page; Generate report brings the popup back and generates nothing. My Plan shows the red warning under Top up now.',
        status: 'active',
        planId: 'monthly',
        paymentIssue: 'ok',
        route: 'report',
      },
      {
        id: 'p-unavailable',
        label: 'Grace period · Stripe won’t open',
        steps: 'Click Update payment method to see the error. Close the popup and My Plan keeps it in the red warning; Try again saves the card.',
        status: 'active',
        planId: 'monthly',
        paymentIssue: 'stripe-unavailable',
        route: 'report',
      },
      {
        id: 'p-declined',
        label: 'Grace period · Card declined',
        steps: 'Click Update payment method to see the error. Close the popup and My Plan keeps it in the red warning; Try again saves the card.',
        status: 'active',
        planId: 'monthly',
        paymentIssue: 'card-declined',
        route: 'report',
      },
      {
        id: 'p-expired',
        label: 'Grace period · Card expired',
        steps: 'Click Update payment method to see the error. Close the popup and My Plan keeps it in the red warning; Try again saves the card.',
        status: 'active',
        planId: 'monthly',
        paymentIssue: 'card-expired',
        route: 'report',
      },
      {
        id: 'p-verify',
        label: 'Grace period · Bank verification fails',
        steps: 'Click Update payment method to see the error. Close the popup and My Plan keeps it in the red warning; Try again saves the card.',
        status: 'active',
        planId: 'monthly',
        paymentIssue: 'authentication-failed',
        route: 'report',
      },
      {
        id: 'failed',
        label: 'Day 7 · Auto-cancelled',
        steps: 'The renewal payment failed and the grace period ended. Click Choose a plan to subscribe again.',
        status: 'none',
        planId: 'monthly',
        endReason: 'payment-failed',
      },
    ],
  },
]

/** Demo-only panel for jumping between account states. Not part of the product UI. */
export function PrototypeControls() {
  const { dispatch } = useBilling()
  const { navigate, theme, toggleTheme } = useUi()
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)

  if (!open)
    return (
      <button type="button" className="proto-toggle" onClick={() => setOpen(true)} aria-expanded={false}>
        <FlaskConical size={16} aria-hidden />
        Prototype states
      </button>
    )

  const set = (s: Scenario) => {
    setCurrent(s.id)
    dispatch({
      type: 'demo',
      status: s.status,
      planId: s.planId,
      creditsLeft: s.creditsLeft,
      topUpUsed: s.topUpUsed,
      endReason: s.endReason,
      autoTopUp: s.autoTopUp,
      pendingDowngrade: s.pendingDowngrade,
      paymentIssue: s.paymentIssue,
    })
    navigate(s.route ?? 'billing')
  }

  return (
    <div className="proto" role="group" aria-label="Prototype states">
      <div className="proto__head">
        <p>
          <FlaskConical size={16} aria-hidden />
          Prototype states
        </p>
        <span className="proto__head-actions">
          <button
            type="button"
            className="icon-btn icon-btn--chrome"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
          </button>
          <button type="button" className="icon-btn icon-btn--chrome" aria-label="Close prototype states" onClick={() => setOpen(false)}>
            <X size={16} aria-hidden />
          </button>
        </span>
      </div>
      <p className="proto__hint">Pick a flow to open it where it starts. The next click appears under it.</p>
      {GROUPS.map((g) => (
        <div key={g.title} className="proto__group">
          <p className="proto__label">{g.title}</p>
          <div className="proto__seg proto__seg--stack">
            {g.items.map((s) => (
              <div key={s.id} className="proto__item">
                <button type="button" aria-pressed={current === s.id} aria-describedby={current === s.id ? `${s.id}-steps` : undefined} onClick={() => set(s)}>
                  {s.label}
                </button>
                {current === s.id && (
                  <p id={`${s.id}-steps`} className="proto__steps">
                    {s.steps}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
