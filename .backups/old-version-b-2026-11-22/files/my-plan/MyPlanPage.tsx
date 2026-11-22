import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { CalendarClock, CalendarX2, CircleAlert, Coins } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge, Checklist, InfoTip, Notice, Tabs } from '../../components/ui/primitives'
import { PLANS, REPORT_RETENTION_DAYS, TOP_UP, formatCount, formatPrice } from '../../data/plans'
import { addDays, formatDate } from '../../data/history'
import { useBilling } from '../../state/billing'
import { useUi, type BillingTab } from '../../state/ui'
import { SubscriptionFlow, type FlowStep } from '../billing/SubscriptionFlow'
import { usePlanActions } from './actions'
import { usePlanFlow } from './flow'
import { CreditHistory, PaymentHistory } from './history'
import {
  LOW_CREDIT_SHARE,
  cadenceOf,
  canChangePlan,
  creditPool,
  creditShare,
  isLowFlex,
  isPaymentFailed,
  paymentDue,
  perksFor,
  stripView,
} from './view'

/**
 * My Plan (Version B). One page for the one thing a customer controls: the plan
 * they are on and the credits inside it. A status strip answers "where do I
 * stand" on both tabs; Credits and Plan & billing hold the modules.
 */
export function MyPlanPage() {
  const { billingTab, setBillingTab } = useUi()
  const [step, setStep] = useState<FlowStep | null>(null)
  // The cancel trigger disappears once the plan is cancelled, so closing the flow
  // hands focus to the plan heading instead of dropping it on <body>.
  const planRef = useRef<HTMLHeadingElement>(null)
  const closeFlow = () => {
    setStep(null)
    requestAnimationFrame(() => planRef.current?.focus())
  }

  // The browser tab carries the page's name, as the sidebar and the h1 do.
  useEffect(() => {
    const before = document.title
    document.title = 'My Plan · AsiaVerify'
    return () => {
      document.title = before
    }
  }, [])

  return (
    <div className="page pb-page">
      <header className="page__head page__head--flush">
        <h1>My Plan</h1>
      </header>

      <StatusStrip />

      <Tabs<BillingTab>
        label="My Plan sections"
        idPrefix="myplan"
        value={billingTab}
        onChange={setBillingTab}
        tabs={[
          { id: 'credits', label: 'Credits' },
          { id: 'plan', label: 'Plan & billing' },
        ]}
      />
      <div
        role="tabpanel"
        id={`myplan-panel-${billingTab}`}
        aria-labelledby={`myplan-tab-${billingTab}`}
        className="pb-panel"
        tabIndex={0}
      >
        {billingTab === 'credits' ? (
          <CreditsTab />
        ) : (
          <PlanTab planRef={planRef} onCancel={() => setStep('cancel-confirm')} />
        )}
      </div>

      <SubscriptionFlow step={step} onStep={setStep} onClose={closeFlow} />
    </div>
  )
}

/* Status strip ------------------------------------------------------------------ */

function StatusStrip() {
  const { state } = useBilling()
  const run = usePlanActions()
  const v = stripView(state)
  const pool = creditPool(state)
  const none = state.status === 'none'

  return (
    <section className="card pb-strip" aria-label="Plan status">
      <dl className="pb-strip__facts">
        <div className="pb-fact pb-fact--plan">
          <dt>Plan</dt>
          <dd>
            {v.plan.name}
            <span>{v.plan.sub}</span>
          </dd>
          <dd>
            <Badge tone={v.badge.tone}>{v.badge.label}</Badge>
          </dd>
        </div>
        <div className="pb-fact">
          <dt>Credits left</dt>
          <dd>
            {formatCount(none ? 0 : state.creditsRemaining)}
            {!none && pool > 0 && <span>of {formatCount(pool)}</span>}
          </dd>
        </div>
        <div className="pb-fact">
          <dt>{v.fact.label}</dt>
          <dd>
            {v.fact.value}
            {v.fact.sub && <span>{v.fact.sub}</span>}
          </dd>
        </div>
      </dl>
      {v.action && (
        <Button className="pb-strip__action" onClick={() => run(v.action!.kind)}>
          {v.action.label}
        </Button>
      )}
    </section>
  )
}

/* Credits tab -------------------------------------------------------------------- */

function CreditsTab() {
  const { state } = useBilling()
  const addable = state.status === 'active' && !isPaymentFailed(state)
  return (
    <div className={`pb-grid ${addable ? '' : 'pb-grid--solo'}`}>
      <CreditsLeft />
      {addable && <AddCredits />}
      <CreditHistory />
    </div>
  )
}

function CreditsLeft() {
  const { state } = useBilling()
  const headingId = useId()
  const pool = creditPool(state)
  const left = state.status === 'none' ? 0 : state.creditsRemaining
  const share = creditShare(state)
  const pct = state.status === 'none' ? 0 : Math.round(share * 100)
  const tone = left === 0 ? 'empty' : share < LOW_CREDIT_SHARE ? 'low' : 'ok'
  const resets =
    state.status === 'none'
      ? 'No active plan'
      : state.planId === 'flex'
        ? 'No expiry'
        : state.status === 'cancelling'
          ? `Usable until ${formatDate(state.cycleEnd)}`
          : `Resets ${formatDate(state.cycleEnd)}`
  const low = isLowFlex(state)

  return (
    <section className="card pb-module pb-balance" aria-labelledby={headingId}>
      <h2 id={headingId} className="pb-module__title">
        Credits left
        <InfoTip label="About credits">
          Each report uses credits depending on its type and jurisdiction.
        </InfoTip>
      </h2>
      <p className={`pb-figure pb-figure--${tone}`}>
        <Coins size={24} aria-hidden />
        <strong>{formatCount(left)}</strong>
        {state.status !== 'none' && <span>of {formatCount(pool)} credits</span>}
      </p>
      <div
        className={`meter meter--${tone}`}
        role="meter"
        aria-labelledby={headingId}
        aria-valuemin={0}
        aria-valuemax={pool}
        aria-valuenow={left}
        aria-valuetext={`${left} of ${pool} credits left`}
      >
        <span className="meter__fill" style={{ inlineSize: `${pct}%` }} />
      </div>
      <p className="pb-meta">
        {state.status !== 'none' && <span>{pct}% left</span>}
        <span>{resets}</span>
      </p>
      {low && (
        <p className="pb-low" role="status">
          <CircleAlert size={16} aria-hidden />
          <span>
            {left === 0 ? 'You are out of credits. ' : 'Your credits are running low. '}
            {state.topUpUsed
              ? 'You have used your one top-up. Change plan to keep generating reports.'
              : 'Top up once or change plan to keep generating reports.'}
          </span>
        </p>
      )}
      {state.status === 'none' && (
        <p className="pb-low">
          <CircleAlert size={16} aria-hidden />
          <span>You have no credits. Choose a plan to generate new reports.</span>
        </p>
      )}
    </section>
  )
}

function AddCredits() {
  const { state } = useBilling()
  const flow = usePlanFlow()
  const headingId = useId()
  const flex = state.planId === 'flex'

  return (
    <section className="card pb-module pb-addcredits" aria-labelledby={headingId}>
      <h2 id={headingId} className="pb-module__title">
        Add credits
      </h2>
      {flex ? <FlexTopUp onTopUp={flow.openTopUp} onChange={() => flow.openChangePlan()} /> : <AutoTopUp />}
    </section>
  )
}

/* Flex: one top-up, and only once credits run low (below 25%). */
function FlexTopUp({ onTopUp, onChange }: { onTopUp: () => void; onChange: () => void }) {
  const { state } = useBilling()
  const pack = TOP_UP.flex
  const low = isLowFlex(state)

  if (state.topUpUsed)
    return (
      <>
        <p className="pb-lead">Top-up used on {formatDate(state.topUpUsedOn)}.</p>
        <p className="pb-hint">Flex allows one top-up. To keep adding credits, change plan.</p>
        {low && (
          <div className="pb-row">
            <Button variant="secondary" onClick={onChange}>
              Change plan
            </Button>
          </div>
        )}
      </>
    )

  if (!low)
    return (
      <>
        <p className="pb-lead">You have one top-up available.</p>
        <p className="pb-hint">It opens when your credits fall below 25%.</p>
      </>
    )

  return (
    <>
      <p className="pb-lead">
        Add {formatCount(pack.credits)} credits for {formatPrice(pack.price)}, once.
      </p>
      <p className="pb-hint">This is your only Flex top-up. The credits never expire.</p>
      <div className="pb-row">
        <Button onClick={onTopUp}>Top up for {formatPrice(pack.price)}</Button>
      </div>
    </>
  )
}

/* Growth: auto top-up renews the plan early, so the line under it says so. */
function AutoTopUp() {
  const { state } = useBilling()
  const flow = usePlanFlow()
  const labelId = useId()
  const hintId = useId()
  const price = formatPrice(PLANS[state.planId].price ?? 0)

  return (
    <div className="pb-auto">
      <div className="pb-auto__text">
        <p className="pb-lead" id={labelId}>
          Auto top-up
        </p>
        <p className="pb-hint" id={hintId}>
          {state.autoTopUp
            ? `On. When your credits run out, we renew your plan early and charge ${price}. Your billing date moves to that day.`
            : `Off. Reports that need more credits wait until ${formatDate(state.cycleEnd)}.`}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={state.autoTopUp}
        aria-labelledby={labelId}
        aria-describedby={hintId}
        className="switch"
        onClick={() => flow.openAutoTopUp(!state.autoTopUp)}
      >
        <span className="switch__knob" aria-hidden />
      </button>
    </div>
  )
}

/* Plan & billing tab -------------------------------------------------------------- */

function PlanTab({ planRef, onCancel }: { planRef: RefObject<HTMLHeadingElement | null>; onCancel: () => void }) {
  return (
    <div className="pb-stack">
      <PlanNotice />
      <YourPlan headingRef={planRef} onCancel={onCancel} />
      <PaymentHistory />
    </div>
  )
}

/* Only when something needs saying: a failed payment, a scheduled switch, an end date. */
function PlanNotice() {
  const { state } = useBilling()
  const plan = PLANS[state.planId]

  // The notice explains; the action lives once in the status strip and once in Your plan.
  if (isPaymentFailed(state))
    return (
      <Notice tone="negative" icon={<CircleAlert size={18} />} title="Payment failed">
        We could not charge {formatPrice(plan.price ?? 0)} on {formatDate(state.paymentFailedOn)}. Update your payment
        method by <strong>{formatDate(paymentDue(state))}</strong> or your plan ends.
      </Notice>
    )

  if (state.status === 'cancelling')
    return (
      <Notice tone="warning" icon={<CalendarX2 size={18} />} title={`Your plan ends on ${formatDate(state.cycleEnd)}`}>
        You keep full access until then and will not be charged again.
      </Notice>
    )

  if (state.status === 'active' && state.pendingDowngrade)
    return (
      <Notice
        tone="warning"
        icon={<CalendarClock size={18} />}
        title={`Switching to monthly billing on ${formatDate(state.cycleEnd)}`}
      >
        You keep Growth yearly and your credits until then.
      </Notice>
    )

  return null
}

function YourPlan({ headingRef, onCancel }: { headingRef: RefObject<HTMLHeadingElement | null>; onCancel: () => void }) {
  const { state } = useBilling()
  const run = usePlanActions()
  const headingId = useId()
  const plan = PLANS[state.planId]
  const head = (
    <h2 id={headingId} ref={headingRef} tabIndex={-1} className="pb-module__title">
      Your plan
    </h2>
  )

  if (state.status === 'none') {
    const failed = state.endReason === 'payment-failed'
    const keepUntil = formatDate(addDays(state.endedOn, REPORT_RETENTION_DAYS))
    return (
      <section className="card pb-module pb-plan" aria-labelledby={headingId}>
        {head}
        <p className="pb-lead">No active plan</p>
        <p className="pb-hint">
          {failed
            ? `We could not renew your plan because payment failed. `
            : `Your ${plan.tier} plan ended on ${formatDate(state.endedOn)}. `}
          Your reports stay available until {keepUntil}. Choose a plan to generate new reports.
        </p>
        <div className="pb-plan__actions">
          <Button onClick={() => run('choose-plan')}>Choose a plan</Button>
        </div>
      </section>
    )
  }

  const v = stripView(state)
  const cancelling = state.status === 'cancelling'
  const failed = isPaymentFailed(state)
  const unit = plan.cycle === 'year' ? 'per year' : plan.cycle === 'month' ? 'per month' : 'one-time'
  const growth = state.planId !== 'flex'
  const unlocked = canChangePlan(state)

  return (
    <section className="card pb-module pb-plan" aria-labelledby={headingId}>
      {head}
      <div className="pb-plan__body">
        <div className="pb-plan__main">
          <p className="pb-plan__name">
            {plan.tier}
            <span>{cadenceOf(state.planId)}</span>
          </p>
          <p className="pb-figs">
            <span className="pb-fig">
              <strong>{formatPrice(plan.price ?? 0)}</strong>
              {unit}
            </span>
            <span className="pb-fig">
              <strong>{formatCount(plan.credits ?? 0)}</strong>
              credits {plan.cycle ? unit : 'included'}
            </span>
          </p>
          <p className="pb-plan__date">
            <span>{v.fact.label}</span>
            {v.fact.value}
            {v.fact.sub && <em>{v.fact.sub}</em>}
          </p>
        </div>
        <Checklist items={perksFor(state.planId)} size="sm" />
      </div>

      <div className="pb-plan__actions">
        {cancelling && <Button onClick={() => run('reactivate')}>Reactivate plan</Button>}
        {failed && <Button onClick={() => run('update-payment')}>Update payment method</Button>}
        {state.pendingDowngrade && !cancelling && <Button onClick={() => run('keep-yearly')}>Keep yearly billing</Button>}
        {!failed && (
          <Button
            variant="secondary"
            aria-disabled={!unlocked || undefined}
            className={unlocked ? undefined : 'btn--locked'}
            onClick={() => run('change-plan')}
          >
            Change plan
          </Button>
        )}
        {growth && !cancelling && (
          <button type="button" className="text-btn text-btn--quiet" onClick={onCancel}>
            Cancel plan
          </button>
        )}
      </div>
      {cancelling && !unlocked && (
        <p className="pb-hint">You can change plan when your plan ends or your credits run out.</p>
      )}
    </section>
  )
}
