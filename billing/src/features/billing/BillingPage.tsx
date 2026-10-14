import { useId, useRef, useState } from 'react'
import { CalendarX2, CircleAlert, Coins, PartyPopper } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge, Checklist, InfoTip, Notice } from '../../components/ui/primitives'
import { PLANS, REPORT_RETENTION_DAYS, formatCount, formatPrice, planBreakdown } from '../../data/plans'
import { addDays, formatDate } from '../../data/history'
import { canSelectPlan, canTopUp, useBilling } from '../../state/billing'
import { useUi } from '../../state/ui'
import { HistoryTabs } from './HistoryTabs'
import { SubscriptionFlow, type FlowStep } from './SubscriptionFlow'
import { UpgradePrompt } from '../upgrade/UpgradePrompt'
import { useCheckout } from '../upgrade/checkout'

export function BillingPage() {
  const { state } = useBilling()
  const [step, setStep] = useState<FlowStep | null>(null)
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
        <p>Keep track of your subscription details, update your billing information, and control your account's payments.</p>
      </header>

      {state.status === 'none' ? (
        <Resubscribe />
      ) : (
        <div className="billing-grid">
          <SubscriptionCard onCancel={() => setStep('cancel-confirm')} />
          <SettingsCard headingRef={settingsRef} />
        </div>
      )}

      <HistoryTabs key={state.status} />

      <SubscriptionFlow step={step} onStep={setStep} onClose={closeFlow} />
    </div>
  )
}

/* Left card: what the plan is. The price identifies the plan; credits and the
   breakdown support it at a quieter weight. */
function SubscriptionCard({ onCancel }: { onCancel: () => void }) {
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
      <div className="plan-card__head">
        <h2 id={headingId} className="plan-card__label">
          {plan.tier}
        </h2>
        {cancelling ? <Badge tone="warning">Ends {formatDate(state.cycleEnd)}</Badge> : <Badge>Active</Badge>}
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

      <div className="plan-card__breakdown">
        <p className="plan-card__lead">Subscription plan breakdown</p>
        <Checklist items={included} size="sm" />
      </div>

      {!cancelling && plan.cycle && (
        <div className="plan-card__foot">
          <button type="button" className="text-btn text-btn--quiet" onClick={onCancel}>
            Cancel subscription
          </button>
        </div>
      )}
    </section>
  )
}

/* Right card: what to do next. The credit balance is the one large figure. */
function SettingsCard({ headingRef }: { headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  const { state, dispatch } = useBilling()
  const { navigate } = useUi()
  const [prompt, setPrompt] = useState(false)
  const flex = state.planId === 'flex'
  const cancelling = state.status === 'cancelling'
  const oneTime = !state.cycleEnd
  const headingId = useId()
  const cycleEnd = oneTime ? '' : formatDate(state.cycleEnd)
  const deleteOn = oneTime ? '' : formatDate(addDays(state.cycleEnd, REPORT_RETENTION_DAYS))

  return (
    <>
      <section className="card settings" aria-labelledby={headingId}>
        <div className="settings__head">
          <div className="settings__head-text">
            <h2 id={headingId} ref={headingRef} tabIndex={-1} className="settings__title">
              Subscription settings
            </h2>
            <p className="settings__meta">
              {oneTime ? (
                'One-time purchase · no recurring billing'
              ) : (
                <>
                  {cancelling ? 'Your current plan will end on:' : 'Next billing date:'} <strong>{cycleEnd}</strong>
                </>
              )}
            </p>
          </div>
          {!cancelling && (
            <Button size="sm" onClick={() => (flex && canTopUp(state) ? setPrompt(true) : navigate('plans'))}>
              {state.planId === 'yearly' || flex ? 'Upgrade plan' : 'Change plan'}
            </Button>
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
            Your credits are ready to use.{oneTime ? ' They never expire.' : ` Your next billing date is ${cycleEnd}.`}
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
                  {canSelectPlan(state)
                    ? `You can choose a new plan now. Choose one by ${deleteOn} to keep your report history.`
                    : `You can choose a new plan from ${cycleEnd}, or as soon as your credits run out. Choose one by ${deleteOn} to keep your report history.`}
                </p>
              </div>
              <Button size="sm" onClick={() => navigate('plans')}>
                Choose a plan
              </Button>
            </div>
          </>
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
    ? 'Never expire'
    : cancelling
      ? `Usable until ${formatDate(state.cycleEnd)}`
      : `Resets ${formatDate(state.cycleEnd)}`

  return (
    <div className="balance-block">
      <p className="settings__label" id={labelId}>
        Current credit balance
        <InfoTip label="About credits">
          Each report uses credits depending on its type and jurisdiction. Top up anytime if you run out before your
          billing cycle ends.
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
      {canTopUp(state) && <TopUpRow onFlexTopUp={onFlexTopUp} />}
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
      <Button size="sm" variant="secondary" onClick={askFirst ? onFlexTopUp : topUp}>
        Top up now
      </Button>
    </div>
  )
}

const TILES = [
  { title: 'Full verification suite', text: 'KYB, AML & UBO checks, with real-time monitoring across Asia' },
  { title: 'Full flexibility', text: 'Unlimited top-ups, upgrade, or cancel anytime' },
]

function Resubscribe() {
  const { state } = useBilling()
  const { navigate } = useUi()
  const headingId = useId()
  const keepUntil = formatDate(addDays(state.endedOn, REPORT_RETENTION_DAYS))

  return (
    <section className="card resub" aria-labelledby={headingId}>
      <h2 id={headingId} className="resub__title">
        Pick up right where you left off
      </h2>
      <p className="resub__text">
        Your subscription ended on {formatDate(state.endedOn)}. Purchase a plan again to continue accessing our
        services.
      </p>
      <ul className="resub__tiles">
        {TILES.map((t) => (
          <li key={t.title} className="resub__tile">
            <p className="resub__tile-title">{t.title}</p>
            <p>{t.text}</p>
          </li>
        ))}
        <li className="resub__tile resub__tile--warn">
          <p className="resub__tile-title">Your report history</p>
          <p>
            Your historical reports remain accessible for {REPORT_RETENTION_DAYS} days, until <strong>{keepUntil}</strong>.
            Purchase a plan by then to keep access. After that, they'll be permanently deleted.
          </p>
        </li>
      </ul>
      <Button onClick={() => navigate('plans')}>Choose a plan</Button>
    </section>
  )
}
