import { useState } from 'react'
import { FlaskConical, Moon, Sun, X } from 'lucide-react'
import {
  useBilling,
  type EndReason,
  type PaidPlanId,
  type SubscriptionStatus,
} from '../../state/billing'
import { formatDate } from '../../data/history'
import { usePaymentSim, type PaymentOutcome, type PaymentSpeed } from '../../state/paymentSim'
import {
  POST_ROLLOUT_UNTIL,
  PRE_ROLLOUT_FROM,
  RETURNING_FROM,
  ROLLOUT_ON,
  useRollout,
  type RolloutPhase,
} from '../../state/rollout'
import { useUi, type Route } from '../../state/ui'

/** One row of the panel: a flow, opened on the screen where that flow starts. */
interface Scenario {
  id: string
  label: string
  status: SubscriptionStatus
  planId: PaidPlanId
  creditsLeft?: number | 'some' | 'none'
  topUpUsed?: boolean
  endReason?: EndReason
  autoTopUp?: boolean
  /** Growth yearly with the switch to monthly already scheduled. */
  pendingDowngrade?: boolean
  /** The Auto top up charge in this flow is declined (PRD 3.2). Every other row leaves charges succeeding. */
  failPayment?: boolean
  /** Growth with a failed Auto top up charge not yet paid on Stripe: no new charge, the pop-up just shows. */
  paymentFailed?: boolean
  /** Growth, Auto top up on, charged a few days ago: My Plan names the date of that last charge (PRD 2.2 #2). */
  afterAutoTopUp?: boolean
  /** After the switch to monthly, the first monthly charge failed: the plan is cancelled and the pop-up says so. */
  switchPaymentFailed?: boolean
  route?: Route
}

interface Group {
  title: string
  items: Scenario[]
}

/* The panel is organised the way the Figma file is: one group per journey, one row per lane, named
   with the lane's own title ("Downgrade (Yearly → Monthly)"). A row is a flow, not a bare account
   state: several rows start from the same account (Growth yearly, active) and differ in what you do
   next.

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
        status: 'active',
        planId: 'monthly',
      },
      {
        id: 'g-up-biz',
        label: 'Upgrade · Yearly → Business',
        status: 'active',
        planId: 'yearly',
      },
      {
        id: 'g-down',
        label: 'Downgrade · Yearly → Monthly',
        status: 'active',
        planId: 'yearly',
      },
      {
        id: 'g-down-keep',
        label: 'Downgrade scheduled · Keep yearly plan',
        status: 'active',
        planId: 'yearly',
        pendingDowngrade: true,
      },
      // 28 Nov 2026: the switch went through but the first monthly charge failed, so the plan is cancelled straight away.
      {
        id: 'g-down-failed',
        label: 'Downgrade · first monthly charge fails',
        status: 'none',
        planId: 'monthly',
        endReason: 'payment-failed',
        switchPaymentFailed: true,
      },
      { id: 'g-m-low', label: 'Low credits · Monthly', status: 'active', planId: 'monthly', creditsLeft: 6, route: 'report' },
      { id: 'g-y-low', label: 'Low credits · Yearly', status: 'active', planId: 'yearly', creditsLeft: 6, route: 'report' },
      {
        id: 'g-y-zero',
        label: 'Turn on at 0 credits · Yearly',
        status: 'active',
        planId: 'yearly',
        creditsLeft: 0,
        autoTopUp: false,
      },
    ],
  },
  {
    title: 'Auto top up',
    items: [
      {
        id: 'a-off',
        label: '1 · Turn off',
        status: 'active',
        planId: 'monthly',
        autoTopUp: true,
      },
      {
        id: 'a-on',
        label: '2 · Turn back on at 0 credits',
        status: 'active',
        planId: 'monthly',
        creditsLeft: 0,
        autoTopUp: false,
      },
      {
        id: 'a-gate',
        label: '3 · Out of credits at report, off',
        status: 'active',
        planId: 'monthly',
        creditsLeft: 6,
        autoTopUp: false,
        route: 'report',
      },
      {
        id: 'a-auto',
        label: '4 · Out of credits at report, on',
        status: 'active',
        planId: 'monthly',
        creditsLeft: 6,
        autoTopUp: true,
        route: 'report',
      },
      {
        id: 'a-down',
        label: '5 · Out of credits at report, downgrade scheduled',
        status: 'active',
        planId: 'yearly',
        creditsLeft: 6,
        // Auto top up is off while a switch to monthly is scheduled: the report page offers "Renew current plan".
        autoTopUp: false,
        pendingDowngrade: true,
        route: 'report',
      },
      // PRD 2.2 #2: after an Auto top up the box on My Plan names the date of the last one. Flows 2, 4 and 5
      // end the same way once the charge goes through; this row opens it directly.
      {
        id: 'a-after',
        label: 'My Plan after an auto top-up · last date',
        status: 'active',
        planId: 'monthly',
        autoTopUp: true,
        afterAutoTopUp: true,
      },
    ],
  },
  {
    title: 'Flex',
    items: [
      {
        id: 'f-zero',
        label: '1 · 0 credits',
        status: 'active',
        planId: 'flex',
        creditsLeft: 0,
      },
      {
        id: 'f-used',
        label: '2 · Credits left, top-up used',
        status: 'active',
        planId: 'flex',
        creditsLeft: 124,
        topUpUsed: true,
      },
      { id: 'f-low', label: '3 · Low credits, top-up available', status: 'active', planId: 'flex', creditsLeft: 6, route: 'report' },
      { id: 'f-low-used', label: '4 · Low credits, top-up used', status: 'active', planId: 'flex', creditsLeft: 6, topUpUsed: true, route: 'report' },
    ],
  },
  {
    title: 'Cancellation',
    items: [
      {
        id: 'c-flow',
        label: 'Cancel plan · Growth monthly',
        status: 'active',
        planId: 'monthly',
      },
      {
        id: 'c-some',
        label: 'Cancelled · credits > 0',
        status: 'cancelling',
        planId: 'monthly',
        creditsLeft: 'some',
      },
      {
        id: 'c-none',
        label: 'Cancelled · credits = 0',
        status: 'cancelling',
        planId: 'monthly',
        creditsLeft: 'none',
      },
      {
        id: 'c-low',
        label: 'Cancelled · low credits at report',
        status: 'cancelling',
        planId: 'monthly',
        creditsLeft: 6,
        autoTopUp: false,
        route: 'report',
      },
      {
        id: 'inactive',
        label: 'Inactive',
        status: 'none',
        planId: 'monthly',
      },
    ],
  },
  {
    title: 'Failed payment',
    items: [
      /* PRD 3.2: a declined Auto top up charge does not cancel the plan. The report is not generated, the
         credits and the billing date stay, and the "Payment failed" pop-up shows. The balance is 15 so KYB
         LITE (10) still fits while KYB BASIC (20, the one selected) does not. */
      {
        id: 'p-on',
        label: 'Auto top up charge fails · on',
        status: 'active',
        planId: 'monthly',
        creditsLeft: 15,
        autoTopUp: true,
        failPayment: true,
        route: 'report',
      },
      {
        id: 'p-off',
        label: 'Enable Auto top up fails · off',
        status: 'active',
        planId: 'monthly',
        creditsLeft: 15,
        autoTopUp: false,
        failPayment: true,
        route: 'report',
      },
      {
        id: 'p-again',
        label: 'Later report above the balance',
        status: 'active',
        planId: 'monthly',
        creditsLeft: 15,
        autoTopUp: true,
        paymentFailed: true,
        route: 'report',
      },
      // PRD 3.2 #5: My Plan carries a banner with Update payment details while the charge is unpaid.
      {
        id: 'p-banner',
        label: 'My Plan banner · charge failed',
        status: 'active',
        planId: 'monthly',
        creditsLeft: 15,
        autoTopUp: true,
        paymentFailed: true,
      },
      {
        id: 'failed',
        label: 'Renewal failed · Auto-cancelled',
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

const PAYMENT_OUTCOMES: { id: PaymentOutcome; label: string; hint: string }[] = [
  { id: 'success', label: 'Succeeds', hint: 'The charge goes through.' },
  {
    id: 'fail',
    label: 'Fails',
    hint: 'The charge is declined: the Payment failed pop-up shows and nothing is added. It covers the report page.',
  },
]

/* PRD 5.2: the in-app messaging around the 23 Mar 2027 rollout. Picking one starts that stage as a first login
   would: its pop-up opens. It works on any account; only an active Growth plan sees it. */
const ROLLOUT_STAGES: { id: RolloutPhase; label: string; hint: string }[] = [
  { id: 'off', label: 'Off', hint: `Nothing shows: before ${formatDate(PRE_ROLLOUT_FROM)} and after ${formatDate(POST_ROLLOUT_UNTIL)}.` },
  {
    id: 'pre',
    label: `Before rollout · from ${formatDate(PRE_ROLLOUT_FROM)}`,
    hint: 'Pop-up A opens, then the banner stays. Buying or upgrading to Growth shows the disclosure on its confirmation step.',
  },
  {
    id: 'post',
    label: `Rollout · from ${formatDate(ROLLOUT_ON)}`,
    hint: `Pop-up B opens, then the banner stays until ${formatDate(POST_ROLLOUT_UNTIL)}.`,
  },
  {
    id: 'returning',
    label: 'Returning after a break',
    hint: `Did not log in between ${formatDate(RETURNING_FROM)} and ${formatDate(POST_ROLLOUT_UNTIL)}: pop-up B only, no banner.`,
  },
]

/** Demo-only panel for jumping between account states. Not part of the product UI. */
export function PrototypeControls() {
  const { dispatch } = useBilling()
  const { navigate, theme, toggleTheme } = useUi()
  const { speed, setSpeed, outcome, setOutcome } = usePaymentSim()
  const { phase: rolloutPhase, setPhase: setRolloutPhase } = useRollout()
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
    // Only the failed-payment rows decline the Auto top up charge; picking any other row puts it back.
    setOutcome(s.failPayment ? 'fail' : 'success')
    dispatch({
      type: 'demo',
      status: s.status,
      planId: s.planId,
      creditsLeft: s.creditsLeft,
      topUpUsed: s.topUpUsed,
      endReason: s.endReason,
      autoTopUp: s.autoTopUp,
      pendingDowngrade: s.pendingDowngrade,
      paymentFailed: s.paymentFailed,
      afterAutoTopUp: s.afterAutoTopUp,
      switchPaymentFailed: s.switchPaymentFailed,
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
      <p className="proto__hint">Pick a flow to open it where it starts.</p>
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
      {/* An Auto top up charge can be declined (PRD 3.2). The Failed payment rows switch this on by themselves. */}
      <div className="proto__group">
        <p className="proto__label">Auto top up charge</p>
        <div className="proto__seg" role="group" aria-label="How the Auto top up charge ends">
          {PAYMENT_OUTCOMES.map((o) => (
            <button key={o.id} type="button" aria-pressed={outcome === o.id} onClick={() => setOutcome(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
        <p className="proto__hint">{PAYMENT_OUTCOMES.find((o) => o.id === outcome)?.hint}</p>
      </div>
      {/* The rollout stage is its own control, so any account row below can be looked at in any stage. */}
      <div className="proto__group">
        <p className="proto__label">Rollout messaging</p>
        <div className="proto__seg proto__seg--stack" role="group" aria-label="Which rollout stage the messaging is in">
          {ROLLOUT_STAGES.map((r) => (
            <div key={r.id} className="proto__item">
              <button type="button" aria-pressed={rolloutPhase === r.id} onClick={() => setRolloutPhase(r.id)}>
                {r.label}
              </button>
            </div>
          ))}
        </div>
        <p className="proto__hint">{ROLLOUT_STAGES.find((r) => r.id === rolloutPhase)?.hint}</p>
      </div>
      {GROUPS.map((g) => (
        <div key={g.title} className="proto__group">
          <p className="proto__label">{g.title}</p>
          <div className="proto__seg proto__seg--stack">
            {g.items.map((s) => (
              <div key={s.id} className="proto__item">
                <button type="button" aria-pressed={current === s.id} onClick={() => set(s)}>
                  {s.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
