import { useId, useRef, useState } from 'react'
import { CalendarX2, CircleAlert, PartyPopper, Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { MenuButton } from '../../components/ui/MenuButton'
import { Badge, Checklist, InfoTip, Notice } from '../../components/ui/primitives'
import { PLANS, REPORT_RETENTION_DAYS, TOP_UP, formatCount, planBreakdown } from '../../data/plans'
import { addDays, formatDate } from '../../data/history'
import { FLEX_RESETS_ON, TODAY, canTopUp, useBilling } from '../../state/billing'
import { useUi } from '../../state/ui'
import { HistoryTabs } from './HistoryTabs'
import { SubscriptionFlow, type FlowStep } from './SubscriptionFlow'
import { UpgradePrompt } from '../upgrade/UpgradePrompt'
import { useCheckout } from '../upgrade/checkout'

export function BillingPageB() {
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

type BillingState = ReturnType<typeof useBilling>['state']

/* One place decides how urgent the balance is, so the figure, the meter and the
   button emphasis (top up leads when credits are low, upgrade otherwise) agree. */
function balanceTone(state: BillingState): 'ok' | 'low' | 'empty' {
  const total = Math.max(state.creditsTotal, state.creditsRemaining)
  const pct = total ? Math.min(100, (state.creditsRemaining / total) * 100) : 0
  return state.creditsRemaining === 0 ? 'empty' : pct <= 15 ? 'low' : 'ok'
}

/* Money on this page is exact: "$99.00", never "$99". */
function usd(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/* The top-up point follows the line about credits refreshing. It is listed only
   while a top up can actually be bought, so a cancelling plan does not promise it. */
function withTopUpPoint(points: string[], topUpAvailable: boolean) {
  if (!topUpAvailable) return points
  return [
    points[0],
    'Top up anytime if you run out of credits before the billing cycle ends',
    ...points.slice(1),
  ]
}

/* Left card: what you have. Plan, price and allowance, what the plan includes,
   and the credit balance. Nothing here asks for a decision; the actions sit in
   the settings card beside it. */
function SubscriptionCard() {
  const { state } = useBilling()
  const plan = PLANS[state.planId]
  const flex = state.planId === 'flex'
  const cancelling = state.status === 'cancelling'
  const oneTime = !state.cycleEnd
  const headingId = useId()
  const cadence = plan.cycle === 'year' ? 'yearly' : 'monthly'

  const included = flex
    ? [
        ...(state.topUpUsed ? [] : ['One-time top-up available']),
        'Ability to generate any report on the Portal',
        'All features available on the Portal',
        'All add-on features in the Portal',
      ]
    : // Version A's list carries its own top-up line; B places that point itself.
      withTopUpPoint(
        planBreakdown(plan).filter((point) => !point.startsWith('Top up anytime')),
        canTopUp(state),
      )

  return (
    <section className="card plan-card" aria-labelledby={headingId}>
      <div className="plan-card__summary">
        <div className="plan-card__head">
          <div className="plan-card__title">
            <h2 id={headingId} className="plan-card__label">
              {plan.tier}
            </h2>
            {/* Outside the heading, so the card is still named by the plan alone. */}
            {state.status === 'active' && <Badge tone="positive">Active</Badge>}
          </div>
          <p className="plan-card__meta">
            {oneTime ? (
              'One-time purchase · no recurring billing'
            ) : (
              <>
                {cancelling ? 'Your current plan will end on:' : 'Next billing date:'}{' '}
                <strong>{formatDate(state.cycleEnd)}</strong>
              </>
            )}
          </p>
        </div>

        <div className="plan-card__figures">
          <div className="plan-card__figure">
            <p className="plan-card__price">
              {usd(plan.price ?? 0)}
              <span>USD</span>
            </p>
            <p className="plan-card__caption">{plan.cycle ? `Billed ${cadence}` : 'One-time'}</p>
          </div>
          <div className="plan-card__figure">
            <p className="plan-card__credits">
              {formatCount(plan.credits ?? 0)}
              <span>credits</span>
            </p>
            <p className="plan-card__caption">
              {plan.cycle ? (plan.cycle === 'year' ? 'Per year' : 'Per month') : 'Included'}
            </p>
          </div>
        </div>
      </div>

      <div className="plan-card__breakdown">
        <h3 className="plan-card__lead">What's included</h3>
        <Checklist items={included} circled />
      </div>

      <CreditBalance />
    </section>
  )
}

/* Right card: what to do. Upgrade and cancel (or choose a plan once cancelled)
   sit in the header; top-up and auto top-up follow. */
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
  const tone = balanceTone(state)
  const leadVariant = tone === 'ok' ? 'primary' : 'secondary'

  return (
    <>
      <section className="card settings" aria-labelledby={headingId}>
        <div className="settings__head">
          <h2 id={headingId} ref={headingRef} tabIndex={-1} className="settings__title">
            Subscription settings
          </h2>
          <div className="settings__head-actions">
            {cancelling ? (
              <Button size="sm" onClick={() => navigate('plans')}>
                Choose plan
              </Button>
            ) : plan.cycle ? (
              // Upgrade and cancel stay in a menu until the customer asks to change their plan.
              <MenuButton
                label="Choose plan"
                // Primary while the balance is fine; once credits run low, Top up takes the lead instead.
                variant={leadVariant}
                items={[
                  { label: 'Change plan', onSelect: () => navigate('plans') },
                  { label: 'Cancel subscription', onSelect: onCancel, tone: 'danger' },
                ]}
              />
            ) : (
              // Flex has nothing to cancel, so upgrade stands alone.
              <Button
                size="sm"
                variant={leadVariant}
                onClick={() => (flex && canTopUp(state) ? setPrompt(true) : navigate('plans'))}
              >
                Change plan
              </Button>
            )}
          </div>
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
                <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'request-reactivate' })}>
                  Reactivate subscription
                </Button>
              </div>
            </div>
          </>
        )}

        {state.pendingDowngrade && !cancelling && (
          <div className="settings__row settings__changed">
            <div>
              <h3 className="settings__subtitle">Switching to Growth monthly on {cycleEnd}</h3>
              <p className="settings__hint">
                You keep Growth yearly and your credits until then. Changed your mind? You can stay on yearly any time
                before that date.
              </p>
            </div>
            <div className="settings__actions">
              <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'cancel-downgrade', today: TODAY })}>
                Keep yearly plan
              </Button>
            </div>
          </div>
        )}

        {/* Flex at 0 credits sees the upgrade-or-top-up choice before Stripe. */}
        {canTopUp(state) && <TopUpRow tone={tone} onFlexTopUp={() => setPrompt(true)} />}
        {canTopUp(state) && !flex && <AutoTopUp />}
      </section>
      {/* Kept outside the card so the card's spacing never reaches the dialog. */}
      <UpgradePrompt open={prompt} onClose={() => setPrompt(false)} reason="choose" />
    </>
  )
}

/* "Credit": the live balance, in the plan card. The figure takes the tone of the
   balance (green, amber, red), and the meter agrees with it. */
function CreditBalance() {
  const { state } = useBilling()
  const total = Math.max(state.creditsTotal, state.creditsRemaining)
  const remaining = state.creditsRemaining
  const pct = total ? Math.min(100, (remaining / total) * 100) : 0
  const cancelling = state.status === 'cancelling'
  const tone = balanceTone(state)
  // The date sits beside the balance on purpose, even when it repeats the billing
  // date at the top of the card: this is where customers look to see when credits return.
  const resets = !state.cycleEnd
    ? `Resets ${formatDate(FLEX_RESETS_ON)}`
    : cancelling
      ? `Usable until ${formatDate(state.cycleEnd)}`
      : `Resets ${formatDate(state.cycleEnd)}`

  return (
    <div className="balance-block">
      <div className={`balance balance--${tone}`}>
        <p className="balance__figure">
          <strong>{formatCount(remaining)}</strong>
          <span>{remaining === 1 ? 'credit' : 'credits'} remaining</span>
          <InfoTip label="About credits">
            Each report uses credits depending on its type and jurisdiction. Top up anytime if you run out before your
            billing cycle ends.
          </InfoTip>
        </p>
        <p className="balance__reset">{resets}</p>
      </div>
      <div
        className={`meter meter--${tone}`}
        role="meter"
        aria-label="Credit balance"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={remaining}
        aria-valuetext={`${remaining} of ${total} credits remaining`}
      >
        <span className="meter__fill" style={{ inlineSize: `${pct}%` }} />
      </div>
      {cancelling && remaining === 0 && (
        <p className="balance-block__hint">You've used all your credits. You can choose a new plan now.</p>
      )}
    </div>
  )
}

function TopUpRow({ tone, onFlexTopUp }: { tone: 'ok' | 'low' | 'empty'; onFlexTopUp: () => void }) {
  const { state } = useBilling()
  const { topUp } = useCheckout()
  const offerId = useId()
  const pack = TOP_UP[state.planId]
  const askFirst = state.planId === 'flex' && state.creditsRemaining === 0
  const act = askFirst ? onFlexTopUp : topUp
  return (
    <div className="topup" id="top-up">
      {/* The price and the expiry date are shown at checkout, before anything is charged. */}
      <p className="topup__offer" id={offerId}>
        Add {formatCount(pack.credits)} more credits
      </p>
      {tone === 'ok' ? (
        <button type="button" className="text-btn topup__link" onClick={act} aria-describedby={offerId}>
          <Plus size={16} strokeWidth={2} aria-hidden />
          Top up
        </button>
      ) : (
        <Button size="sm" onClick={act} aria-describedby={offerId}>
          Top up
        </Button>
      )}
    </div>
  )
}

/* Growth only (monthly and yearly): buys a top-up automatically when credits run out. */
function AutoTopUp() {
  const { state, dispatch } = useBilling()
  const labelId = useId()
  const hintId = useId()
  const pack = TOP_UP[state.planId]
  return (
    <div className="autotopup">
      <div className="autotopup__head">
        <p className="autotopup__label" id={labelId}>
          Auto top up
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={state.autoTopUp}
          aria-labelledby={labelId}
          aria-describedby={hintId}
          className="switch"
          onClick={() => dispatch({ type: state.autoTopUp ? 'request-disable-auto-top-up' : 'request-enable-auto-top-up' })}
        >
          <span className="switch__knob" aria-hidden />
        </button>
      </div>
      <p className="settings__hint" id={hintId}>
        {state.autoTopUp
          ? 'Automatically charge and add credit when your balance reaches 0.'
          : `Never get interrupted. When your balance reaches 0, we'll add ${formatCount(pack.credits)} credits for ${usd(pack.price)} USD automatically.`}
      </p>
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
