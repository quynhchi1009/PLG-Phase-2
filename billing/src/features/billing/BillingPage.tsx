import { useId, useRef, useState } from 'react'
import { CalendarX2, CircleAlert, CirclePlus, Coins, PartyPopper } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge, Checklist, InfoTip, Notice } from '../../components/ui/primitives'
import { PLANS, REPORT_RETENTION_DAYS, TOP_UP, formatCount, formatPrice, planBreakdown } from '../../data/plans'
import { addDays, formatDate } from '../../data/history'
import { FLEX_RESETS_ON, canSelectPlan, canTopUp, useBilling } from '../../state/billing'
import { useUi } from '../../state/ui'
import { HistoryTabs } from './HistoryTabs'
import { SubscriptionFlow, type FlowStep } from './SubscriptionFlow'
import { UpgradePrompt } from '../upgrade/UpgradePrompt'
import { useCheckout } from '../upgrade/checkout'
import { usePayOnStripe } from '../upgrade/usePayOnStripe'

export function BillingPage() {
  const { state } = useBilling()
  const [step, setStep] = useState<FlowStep | null>(null)
  // Jumping to another state from the prototype panel closes a cancel dialog left open: its copy
  // reads dates the new state may not have (Flex has no billing date).
  const [demoRun, setDemoRun] = useState(state.demoRun)
  if (demoRun !== state.demoRun) {
    setDemoRun(state.demoRun)
    setStep(null)
  }
  // The cancel trigger disappears once a plan is cancelled, so closing the
  // dialog hands focus to the settings heading instead of dropping it on <body>.
  const settingsRef = useRef<HTMLHeadingElement>(null)
  const closeFlow = () => {
    setStep(null)
    requestAnimationFrame(() => settingsRef.current?.focus())
  }

  return (
    <div className="page">
      <header className="page__head page__head--flush">
        <h1>Billing &amp; Subscription</h1>
        <p>
          Keep track of your subscription details, update your billing information, and control your account's payments.
        </p>
      </header>

      {/* PRD 3.2 #5: while the last Auto top up charge is unpaid, a banner with "Update your payment details" runs across the
          page above the cards. It goes once the payment is made on Stripe (the failed state is cleared). */}
      {state.status === 'active' && state.planId !== 'flex' && state.paymentFailed && <PaymentFailedBanner />}

      {state.status === 'none' ? (
        <Resubscribe />
      ) : (
        <div className="billing-grid">
          <SubscriptionCard />
          <SettingsCard headingRef={settingsRef} onCancel={() => setStep('cancel-confirm')} />
        </div>
      )}

      <HistoryTabs key={state.status} />

      <SubscriptionFlow step={step} onStep={setStep} onClose={closeFlow} />
    </div>
  )
}

/* Growth, after a declined Auto top up charge (PRD 3.2): the plan is not cancelled and the credits are
   untouched, so the banner says what happened and offers the one way on, paying on Stripe. While it shows,
   "Update your payment details" is the page's one primary button and Change plan steps down to secondary (see SettingsCard). */
function PaymentFailedBanner() {
  const payOnStripe = usePayOnStripe()
  return (
    <div className="billing-alert">
      <Notice
        tone="negative"
        icon={<CircleAlert size={18} />}
        title="Auto top up payment failed"
        action={
          <Button size="sm" onClick={payOnStripe}>
            Update your payment details
          </Button>
        }
      >
        We couldn&apos;t charge your card. Your plan is still active and your credits are unchanged.
      </Notice>
    </div>
  )
}

/* Left card: fixed facts about the plan (name, price, allowance, what is
   included). Nothing here is actionable; everything you can change lives in
   the settings card on the right. */
function SubscriptionCard() {
  const { state } = useBilling()
  const plan = PLANS[state.planId]
  const flex = state.planId === 'flex'
  const cancelling = state.status === 'cancelling'
  const headingId = useId()
  const cadence = plan.cycle === 'year' ? 'yearly' : 'monthly'

  const included = flex
    ? [
        ...(state.topUpUsed ? [] : ['One-time top-up available']),
        'Ability to generate any report on the Portal',
        'All features available on the Portal',
        'All add-on features in the Portal',
      ]
    : planBreakdown(plan)

  return (
    <section className="card plan-card" aria-labelledby={headingId}>
      <div className="plan-card__summary">
        <div className="plan-card__head">
          <h2 id={headingId} className="plan-card__label">
            {plan.tier}
          </h2>
          {cancelling ? (
            <Badge tone="warning">Ends {formatDate(state.cycleEnd)}</Badge>
          ) : state.pendingDowngrade ? (
            // The date lives in the settings card ("Next billing date" and the switch notice), so the
            // tag only names the state and stays short enough for the 388px card.
            <Badge tone="warning">Downgrade scheduled</Badge>
          ) : (
            <Badge>Active</Badge>
          )}
        </div>

        <div className="plan-card__figures">
          <p className="plan-card__price">
            {formatPrice(plan.price ?? 0)}
            <span>{plan.cycle ? `/billed ${cadence}` : 'one-time'}</span>
          </p>
          <p className="plan-card__credits">
            {formatCount(plan.credits ?? 0)}
            <span>credits {plan.cycle ? (plan.cycle === 'year' ? 'per year' : 'per month') : 'included'}</span>
          </p>
        </div>
      </div>

      <div className="plan-card__breakdown">
        <p className="plan-card__lead">Subscription plan breakdown</p>
        <Checklist items={included} size="sm" />
      </div>
    </section>
  )
}

/* Right card: everything you can configure or act on: upgrade, credits and
   top-ups, and the way out (cancel). */
function SettingsCard({
  headingRef,
  onCancel,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>
  onCancel: () => void
}) {
  const { state, dispatch } = useBilling()
  const { navigate } = useUi()
  const [prompt, setPrompt] = useState(false)
  const plan = PLANS[state.planId]
  const flex = state.planId === 'flex'
  const cancelling = state.status === 'cancelling'
  const oneTime = !state.cycleEnd
  const headingId = useId()
  const cycleEnd = oneTime ? '' : formatDate(state.cycleEnd)
  // The "Payment failed" banner above the cards owns the page's one primary button while the charge is unpaid.
  const payFailed = !flex && state.status === 'active' && state.paymentFailed

  return (
    <>
      <section className="card settings" aria-labelledby={headingId}>
        <div className="settings__head">
          <div className="settings__head-text">
            <h2 id={headingId} ref={headingRef} tabIndex={-1} className="settings__title">
              Subscription settings
            </h2>
            {/* One-time plans (Flex) have no billing date, so there is no line under the title. */}
            {!oneTime && (
              <p className="settings__meta">
                {cancelling ? 'Your current plan will end on:' : 'Next billing date:'} <strong>{cycleEnd}</strong>
              </p>
            )}
          </div>
          {/* Plan-level actions live together: Change plan leads, Cancel plan
              sits beside it as a quiet ghost button. Change plan only shows while the plan is
              untouched: once a cancellation or a switch to monthly is scheduled, the card's one
              story is the way back ("Reactivate subscription" / "Keep yearly plan" below), and
              every other plan is either already included or opens from Products & Pricing.
              Cancel plan stays while a switch is scheduled (cancelling clears the switch). */}
          {!cancelling && (
            <div className="settings__head-actions">
              {plan.cycle && (
                <Button size="sm" variant="ghost" onClick={onCancel}>
                  Cancel plan
                </Button>
              )}
              {!state.pendingDowngrade && (
                <Button
                  size="sm"
                  variant={payFailed ? 'secondary' : 'primary'}
                  onClick={() => (flex && canTopUp(state) ? setPrompt(true) : navigate('plans'))}
                >
                  Change plan
                </Button>
              )}
            </div>
          )}
        </div>

        {flex && state.topUpUsed && (
          <Notice tone="warning" icon={<CircleAlert size={18} />} title="Your one-time top-up has been used">
            You used your Flex top-up on {formatDate(state.topUpUsedOn)}. To keep generating reports and access all
            features,{' '}
            <button type="button" className="text-btn" onClick={() => navigate('plans')}>
              upgrade your plan
            </button>
            .
          </Notice>
        )}

        {state.notice === 'plan-started' && (
          <Notice
            tone="positive"
            icon={<PartyPopper size={18} />}
            title="Your plan is active"
            onDismiss={() => dispatch({ type: 'dismiss-notice' })}
          >
            Your credits are ready to use.
            {oneTime ? ` They reset on ${formatDate(FLEX_RESETS_ON)}.` : ` Your next billing date is ${cycleEnd}.`}
          </Notice>
        )}

        {cancelling && (
          <>
            <Notice tone="warning" icon={<CalendarX2 size={18} />} title="Subscription cancelled">
              Your plan is scheduled for cancellation on {cycleEnd}. You keep full access until then and won't be
              charged again.
            </Notice>
            <div className="settings__row settings__changed">
              <div>
                <h3 className="settings__subtitle">Changed your mind?</h3>
                <p className="settings__hint">
                  You can reverse the cancellation any time before your current billing cycle ends.
                </p>
              </div>
              <div className="settings__actions">
                <Button size="sm" onClick={() => dispatch({ type: 'request-reactivate' })}>
                  Reactivate subscription
                </Button>
                {/* Another plan can only be bought once the credits run out, so until then the
                    button would open a Plans page where every card is locked. */}
                {canSelectPlan(state) && (
                  <Button size="sm" variant="secondary" onClick={() => navigate('plans')}>
                    Choose a plan
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* The way back from a scheduled switch: text on the left, the primary button on the
            card's right edge with the other controls. It opens a confirmation first
            ("Keep your yearly plan?"); the switch is only cancelled once that is confirmed. */}
        {state.pendingDowngrade && !cancelling && (
          <div className="settings__row settings__changed settings__changed--downgrade">
            <div>
              <h3 className="settings__subtitle">Your plan changes to Growth monthly on {cycleEnd}</h3>
              <p className="settings__hint">
                You keep Growth yearly and your credits until then. Changed your mind? You can stay on yearly any time
                before that date.
              </p>
            </div>
            <div className="settings__actions">
              <Button size="sm" onClick={() => dispatch({ type: 'request-cancel-downgrade' })}>
                Keep yearly plan
              </Button>
            </div>
          </div>
        )}

        {/* Flex at 0 credits sees the upgrade-or-top-up choice before Stripe. */}
        <CreditBalance onFlexTopUp={() => setPrompt(true)} />
      </section>
      {/* Kept outside the card so the card's spacing never reaches the dialog. */}
      <UpgradePrompt open={prompt} onClose={() => setPrompt(false)} reason="choose" />
    </>
  )
}

function CreditBalance({ onFlexTopUp }: { onFlexTopUp: () => void }) {
  const { state } = useBilling()
  const total = Math.max(state.creditsTotal, state.creditsRemaining)
  const remaining = state.creditsRemaining
  const labelId = useId()
  const pct = total ? Math.min(100, (remaining / total) * 100) : 0
  const cancelling = state.status === 'cancelling'
  const flexTopUp = canTopUp(state)
  const growthActive = state.status === 'active' && state.planId !== 'flex'
  const tone = remaining === 0 ? 'empty' : pct <= 15 ? 'low' : 'ok'
  const resets = !state.cycleEnd
    ? `Resets ${formatDate(FLEX_RESETS_ON)}`
    : cancelling
      ? `Usable until ${formatDate(state.cycleEnd)}`
      : `Resets ${formatDate(state.cycleEnd)}`

  return (
    <div className="balance-block" role="group" aria-labelledby={labelId}>
      {/* One block, read top to bottom: what you have, then what you can do about it.
          The actions carry no header of their own; they belong to the balance. */}
      <div className="balance-group">
        <p className="settings__label">
          <span id={labelId}>Current credit balance</span>
          <InfoTip label="About credits">
            Each report uses credits depending on its type and jurisdiction.
          </InfoTip>
        </p>
        <div className={`balance balance--${tone}`}>
          <p className="balance__figure">
            <Coins size={24} aria-hidden />
            <strong>{formatCount(remaining)}</strong>
            <span>of {formatCount(total)} remaining</span>
          </p>
          <p className="balance__reset">{resets}</p>
        </div>
        <div
          className={`meter meter--${tone}`}
          role="meter"
          aria-labelledby={labelId}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={remaining}
          aria-valuetext={`${remaining} of ${total} credits remaining`}
        >
          <span className="meter__fill" style={{ inlineSize: `${pct}%` }} />
        </div>
        {cancelling && remaining === 0 && (
          <p className="settings__hint">You've used all your credits. You can choose a new plan now.</p>
        )}
      </div>
      {/* Flex: the one manual top-up. Growth: no manual top-up (Phase 2), only Auto top up. */}
      {(flexTopUp || growthActive) && (
        <div className="balance-actions">
          {flexTopUp && <TopUpRow onFlexTopUp={onFlexTopUp} />}
          {growthActive && <AutoTopUp />}
        </div>
      )}
    </div>
  )
}

/* Flex only: its one manual top-up. Growth never sees this row. */
function TopUpRow({ onFlexTopUp }: { onFlexTopUp: () => void }) {
  const { state } = useBilling()
  const { topUp } = useCheckout()
  const askFirst = state.creditsRemaining === 0
  return (
    <div className="topup" id="top-up">
      <p className="topup__text">Top up credits to keep generating reports without interruption.</p>
      <Button size="sm" variant="secondary" icon={<CirclePlus size={16} aria-hidden />} onClick={askFirst ? onFlexTopUp : topUp}>
        Top up now
      </Button>
    </div>
  )
}

/* Growth only (monthly and yearly): buys a top-up automatically when credits run out. */
function AutoTopUp() {
  const { state, dispatch } = useBilling()
  const labelId = useId()
  const hintId = useId()
  const pack = TOP_UP[state.planId]
  // Turning it on with no credits left also pays for a pack now ("toggle ON to continue
  // immediately"); with credits left it only switches the setting on.
  const toggle = () => {
    if (state.autoTopUp) dispatch({ type: 'request-disable-auto-top-up' })
    else dispatch({ type: 'request-enable-auto-top-up', payNow: state.creditsRemaining === 0 })
  }
  return (
    <div className="autotopup">
      <div className="autotopup__text">
        <p className="autotopup__label" id={labelId}>
          Auto top up
        </p>
        {/* PRD 2.2: the message is the default text, or after an Auto top up the date of the last one (it
            changes with every new charge). The scheduled-downgrade and cancelled states have their own rows
            above (settings__changed, the cancelled notice), and a lapsed account has no box at all. */}
        <p className="settings__hint" id={hintId}>
          {state.autoTopUp ? 'On. ' : ''}
          {state.autoTopUp && state.lastAutoTopUpOn && (
            <>
              Last auto top up on <strong>{formatDate(state.lastAutoTopUpOn)}</strong>.{' '}
            </>
          )}
          Adds {formatCount(pack.credits)} credits when your credits run out.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={state.autoTopUp}
        aria-labelledby={labelId}
        aria-describedby={hintId}
        className="switch"
        onClick={toggle}
      >
        <span className="switch__knob" aria-hidden />
      </button>
    </div>
  )
}

const TILES = [
  { title: 'Full verification suite', text: 'KYB, AML & UBO checks, with real-time monitoring across Asia' },
  { title: 'Full flexibility', text: 'Auto top up, upgrade, or cancel anytime' },
]

/* A lapsed account: why the plan ended, what a new plan brings back, and the
   report-history deadline, then one way forward. */
function Resubscribe() {
  const { state } = useBilling()
  const { navigate } = useUi()
  const headingId = useId()
  const failed = state.endReason === 'payment-failed'
  const endedOn = formatDate(state.endedOn)
  const keepUntil = formatDate(addDays(state.endedOn, REPORT_RETENTION_DAYS))

  return (
    <section className="card resub" aria-labelledby={headingId}>
      <h2 id={headingId} className="resub__title">
        {failed ? "We couldn't renew your subscription" : 'Pick up right where you left off'}
      </h2>
      <p className="resub__text">
        Your subscription was cancelled on <strong>{endedOn}</strong>
        {failed && " after payment couldn't be processed"}. Purchase a plan again to continue accessing our services.
      </p>
      <ul className="resub__tiles">
        {TILES.map((t) => (
          <li key={t.title} className="resub__tile">
            <p className="resub__tile-title">{t.title}</p>
            <p>{t.text}</p>
          </li>
        ))}
        <li className="resub__tile">
          <p className="resub__tile-title">Your report history</p>
          <p>
            Your historical reports will remain accessible for {REPORT_RETENTION_DAYS} days until{' '}
            <strong>{keepUntil}</strong>. Purchase a plan by then to keep access. After that, they'll be permanently
            deleted.
          </p>
        </li>
      </ul>
      <Button onClick={() => navigate('plans')}>Choose a plan</Button>
    </section>
  )
}
