import { useId, useRef, useState } from 'react'
import { CalendarX2, CircleAlert, CirclePlus, Coins, PartyPopper } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge, Checklist, InfoTip, Notice } from '../../components/ui/primitives'
import { PLANS, REPORT_RETENTION_DAYS, TOP_UP, formatCount, formatPrice, planBreakdown } from '../../data/plans'
import { addDays, formatDate } from '../../data/history'
import { FLEX_RESETS_ON, canTopUp, useBilling, type PaymentFailure } from '../../state/billing'
import { useUi } from '../../state/ui'
import { HistoryTabs } from './HistoryTabs'
import { SubscriptionFlow, type FlowStep } from './SubscriptionFlow'
import { PAYMENT_FAILURE } from '../upgrade/paymentFailure'
import { UpgradePrompt } from '../upgrade/UpgradePrompt'
import { useCheckout } from '../upgrade/checkout'

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
            <Badge tone="warning">Switching to monthly</Badge>
          ) : state.paymentIssue ? (
            // Grace period after a failed renewal: the plan is still running, but the one thing to do
            // is update the card. The red warning in the settings card carries the date and the button.
            <Badge tone="warning">Update method</Badge>
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
              sits beside it as a quiet outlined button. While a switch to monthly is
              scheduled, "Keep yearly plan" below is the one primary of the card, so
              Change plan steps down to secondary. */}
          {!cancelling && (
            <div className="settings__head-actions">
              {plan.cycle && (
                <Button size="sm" variant="ghost" onClick={onCancel}>
                  Cancel plan
                </Button>
              )}
              <Button
                size="sm"
                variant={state.pendingDowngrade ? 'secondary' : 'primary'}
                onClick={() => (flex && canTopUp(state) ? setPrompt(true) : navigate('plans'))}
              >
                Change plan
              </Button>
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
                <Button size="sm" variant="secondary" onClick={() => navigate('plans')}>
                  Choose a plan
                </Button>
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
              <h3 className="settings__subtitle">Switching to Growth monthly on {cycleEnd}</h3>
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
      {canTopUp(state) && (
        <div className="balance-actions">
          <TopUpRow onFlexTopUp={onFlexTopUp} />
          {state.paymentIssue && (
            <PaymentWarning dueOn={state.paymentIssue.graceEndsOn} failure={state.paymentIssue.lastFailure} />
          )}
          {state.planId !== 'flex' && <AutoTopUp />}
        </div>
      )}
    </div>
  )
}

function TopUpRow({ onFlexTopUp }: { onFlexTopUp: () => void }) {
  const { state } = useBilling()
  const { topUp } = useCheckout()
  const askFirst = state.planId === 'flex' && state.creditsRemaining === 0
  return (
    <div className="topup" id="top-up">
      <p className="topup__text">Top up credits to keep generating reports without interruption.</p>
      <Button size="sm" variant="secondary" icon={<CirclePlus size={16} aria-hidden />} onClick={askFirst ? onFlexTopUp : topUp}>
        Top up now
      </Button>
    </div>
  )
}

/* Grace period after a failed renewal payment (PRD, Payment Failed: "My Plan page: red payment update
   warning with due date", with the Update payment method CTA). It stays for the whole grace period,
   whether or not the popup or the sticky banner is showing, and sits right under Top up now: a top-up
   is charged to the same card. The button goes straight to Stripe (simulated in the popup).
   Two states, one sentence of news each:
   - nothing tried yet: the renewal failed, the deadline, and what is on hold meanwhile;
   - an attempt to save a card failed: what failed and how to recover, in the words the popup used
     (the popup is closed by then), and the button becomes "Try again".
   The card is entered and checked on Stripe's page, so there is no form here and nothing to validate. */
function PaymentWarning({ dueOn, failure }: { dueOn: string; failure: PaymentFailure | null }) {
  const { dispatch } = useBilling()
  const due = formatDate(dueOn)
  return (
    <Notice
      tone="negative"
      icon={<CircleAlert size={18} />}
      title={failure ? PAYMENT_FAILURE[failure].title : 'Your renewal payment didn’t go through'}
      action={
        <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'open-payment-prompt', reason: 'cta' })}>
          {failure ? 'Try again' : 'Update payment method'}
        </Button>
      }
    >
      {failure
        ? `${PAYMENT_FAILURE[failure].text} You can try again until ${due}. After that, your subscription is cancelled automatically.`
        : `Update your payment method by ${due} or your subscription will be cancelled automatically. Reports are on hold until you do.`}
    </Notice>
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
        <p className="settings__hint" id={hintId}>
          {state.autoTopUp ? 'On. ' : ''}
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
  { title: 'Full flexibility', text: 'Unlimited top-ups, upgrade, or cancel anytime' },
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
