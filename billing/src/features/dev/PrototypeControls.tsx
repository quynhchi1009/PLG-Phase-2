import { useState } from 'react'
import { FlaskConical, Moon, Sun, X } from 'lucide-react'
import {
  useBilling,
  type EndReason,
  type PaidPlanId,
  type SubscriptionStatus,
} from '../../state/billing'
import { usePaymentSim, type PaymentSpeed } from '../../state/paymentSim'
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
   4 out of credits at the report page with it on: it renews early by itself
   5 the same as 4 on Growth yearly with the switch to monthly scheduled: the switch stays and moves
     to the new billing date, and the success message names it */
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
        steps: 'The downgrade to monthly is already scheduled. Click Keep yearly plan to undo it, or open Products & Pricing and click Cancel downgrade under the Growth monthly card.',
        status: 'active',
        planId: 'yearly',
        pendingDowngrade: true,
      },
      { id: 'g-m-low', label: 'Low credits · Monthly', steps: REPORT_STEPS, status: 'active', planId: 'monthly', creditsLeft: 6, route: 'report' },
      { id: 'g-y-low', label: 'Low credits · Yearly', steps: REPORT_STEPS, status: 'active', planId: 'yearly', creditsLeft: 6, route: 'report' },
      {
        id: 'g-y-zero',
        label: 'Turn on at 0 credits · Yearly',
        steps: 'Switch Auto top up on in the credit balance card. With 0 credits it charges $999 at once.',
        status: 'active',
        planId: 'yearly',
        creditsLeft: 0,
        autoTopUp: false,
      },
      {
        id: 'g-y-zero-down',
        label: 'Turn on at 0 credits · Yearly, downgrade scheduled',
        steps: 'Switch Auto top up on in the credit balance card. It charges $999 at once, and the success message names the new date of the switch to monthly.',
        status: 'active',
        planId: 'yearly',
        creditsLeft: 0,
        autoTopUp: false,
        pendingDowngrade: true,
      },
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
      {
        id: 'a-down',
        label: '5 · Out of credits at report, downgrade scheduled',
        steps: `${REPORT_STEPS} Auto top up charges $999 and moves the billing date. The switch to monthly stays scheduled for the new date: check it on My Plan and Products & Pricing.`,
        status: 'active',
        planId: 'yearly',
        creditsLeft: 6,
        autoTopUp: true,
        pendingDowngrade: true,
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
        id: 'c-low',
        label: 'Cancelled · low credits at report',
        steps: `${REPORT_STEPS} Auto top up does not run while the plan is cancelled, so the "Don't miss out on your plan benefits" pop-up (the same one as on My Plan) asks to reactivate, with no upgrade offer. After reactivating, Generate report again: Auto top up renews the plan.`,
        status: 'cancelling',
        planId: 'monthly',
        creditsLeft: 6,
        autoTopUp: false,
        route: 'report',
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
        id: 'failed',
        label: 'Renewal failed · Auto-cancelled',
        steps: 'The renewal payment failed, so the plan is cancelled and inactive straight away. Click Choose a plan to subscribe again.',
        status: 'none',
        planId: 'monthly',
        endReason: 'payment-failed',
      },
    ],
  },
]

const PAYMENT_SPEEDS: { id: PaymentSpeed; label: string; hint: string }[] = [
  { id: 'normal', label: 'Normal', hint: 'Payments take about a second.' },
  { id: 'slow', label: 'Slow', hint: 'Payments take 10 seconds. After 8 the loading state says it is taking longer than usual.' },
  { id: 'hold', label: 'Hold', hint: 'Loading stays until you press “Prototype: finish payment” under it.' },
]

/** Demo-only panel for jumping between account states. Not part of the product UI. */
export function PrototypeControls() {
  const { dispatch } = useBilling()
  const { navigate, theme, toggleTheme } = useUi()
  const { speed, setSpeed } = usePaymentSim()
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
      {/* Every payment (Stripe checkout, a charge to the card on file, saving a new card) shows a loading
          state while it goes through. Normal flashes by in about a second; these keep it on screen. */}
      <div className="proto__group">
        <p className="proto__label">Payment loading</p>
        <div className="proto__seg" role="group" aria-label="How long payments take">
          {PAYMENT_SPEEDS.map((p) => (
            <button key={p.id} type="button" aria-pressed={speed === p.id} onClick={() => setSpeed(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        <p className="proto__hint">{PAYMENT_SPEEDS.find((p) => p.id === speed)?.hint}</p>
      </div>
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
