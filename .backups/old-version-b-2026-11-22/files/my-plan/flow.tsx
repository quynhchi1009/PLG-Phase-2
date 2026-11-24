import { createContext, useCallback, useContext, useId, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowLeft, Minus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { SuccessMark } from '../../components/ui/SuccessMark'
import { Badge } from '../../components/ui/primitives'
import { PLANS, TOP_UP, formatCount, formatPrice, perMonth } from '../../data/plans'
import { formatDate } from '../../data/history'
import { TODAY, nextBillingDate, useBilling, type BillingState, type PaidPlanId } from '../../state/billing'
import { useUi } from '../../state/ui'
import { useCheckout } from '../upgrade/checkout'
import { flagUpdated } from '../upgrade/flagUpdated'
import { canChangePlan, offeredPlans, type OfferId } from './view'

/* The three short dialogs behind My Plan: Change plan (four steps), Top up (Flex)
   and Auto top-up. They live above the page so the sticky banner, the report
   gate and Products & Pricing can open them from anywhere. */

type Step = 'choose' | 'review' | 'confirm' | 'done'

interface ChangeDraft {
  step: Step
  target: OfferId | null
  /** Where the flow began. "Select plan" on Products & Pricing begins at Review, so Back leaves the flow. */
  began: 'choose' | 'review'
}

interface AutoDraft {
  on: boolean
  step: 'confirm' | 'done'
}

interface PlanFlowApi {
  /** Opens Change plan at step 1, or at step 2 when a plan is already chosen. */
  openChangePlan: (planId?: OfferId) => void
  openTopUp: () => void
  openAutoTopUp: (on: boolean) => void
}

const PlanFlowContext = createContext<PlanFlowApi | null>(null)

export function usePlanFlow() {
  const ctx = useContext(PlanFlowContext)
  if (!ctx) throw new Error('usePlanFlow must be used inside PlanFlowProvider')
  return ctx
}

export function PlanFlowProvider({ children }: { children: ReactNode }) {
  const { state } = useBilling()
  const { version, toast } = useUi()
  const [change, setChange] = useState<ChangeDraft | null>(null)
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [auto, setAuto] = useState<AutoDraft | null>(null)

  const openChangePlan = useCallback(
    (planId?: OfferId) => {
      if (!canChangePlan(state)) {
        toast('You can change plan when your plan ends or your credits run out.')
        return
      }
      if (planId === 'business') return toast('Talk to sales isn’t connected in this prototype.')
      if (planId && offeredPlans(state).includes(planId)) setChange({ step: 'review', target: planId, began: 'review' })
      else setChange({ step: 'choose', target: null, began: 'choose' })
    },
    [state, toast],
  )

  const openTopUp = useCallback(() => {
    if (state.planId !== 'flex' || state.topUpUsed || state.status !== 'active') return openChangePlan()
    setTopUpOpen(true)
  }, [state, openChangePlan])

  const openAutoTopUp = useCallback(
    (on: boolean) => {
      if (state.planId === 'flex' || state.status !== 'active') return
      setAuto({ on, step: 'confirm' })
    },
    [state.planId, state.status],
  )

  const api = useMemo(() => ({ openChangePlan, openTopUp, openAutoTopUp }), [openChangePlan, openTopUp, openAutoTopUp])

  return (
    <PlanFlowContext.Provider value={api}>
      {children}
      {version === 'b' && (
        <>
          <ChangePlanDialog draft={change} onDraft={setChange} onClose={() => setChange(null)} />
          <TopUpDialog open={topUpOpen} onClose={() => setTopUpOpen(false)} />
          <AutoTopUpDialog draft={auto} onDraft={setAuto} onClose={() => setAuto(null)} />
        </>
      )}
    </PlanFlowContext.Provider>
  )
}

/* Change plan ------------------------------------------------------------------ */

type Kind = 'pay' | 'schedule' | 'sales'

/** Growth yearly to monthly takes effect at renewal; everything else is paid now. */
function kindOf(state: BillingState, target: OfferId): Kind {
  if (target === 'business') return 'sales'
  if (state.status === 'active' && state.planId === 'yearly' && target === 'monthly') return 'schedule'
  return 'pay'
}

function quote(state: BillingState, target: PaidPlanId) {
  const plan = PLANS[target]
  const upgrading = state.status === 'active'
  const carry = upgrading ? state.creditsRemaining : 0
  const fresh = plan.credits ?? 0
  return {
    plan,
    upgrading,
    carry,
    fresh,
    total: fresh + carry,
    price: plan.price ?? 0,
    next: nextBillingDate(plan.cycle, TODAY),
  }
}

const planLabel = (id: OfferId) =>
  id === 'monthly' ? 'Growth, billed monthly' : id === 'yearly' ? 'Growth, billed yearly' : PLANS[id].tier

function ChangePlanDialog({
  draft,
  onDraft,
  onClose,
}: {
  draft: ChangeDraft | null
  onDraft: (d: ChangeDraft | null) => void
  onClose: () => void
}) {
  const { state } = useBilling()
  const headingId = useId()
  const descId = useId()
  const wide = offeredPlans(state).length >= 3
  const size = !draft ? 'md' : draft.step === 'choose' ? (wide ? 'lg' : 'md') : draft.step === 'done' ? 'sm' : 'md'

  const finish = () => {
    onClose()
    flagUpdated(['.pb-strip', '.pb-plan'])
  }

  return (
    <Dialog
      open={draft !== null}
      onClose={draft?.step === 'done' ? finish : onClose}
      labelledBy={headingId}
      describedBy={descId}
      size={size}
      stepKey={draft ? `${draft.step}-${draft.target ?? 'none'}` : undefined}
    >
      {draft && (
        <ChangeStep draft={draft} onDraft={onDraft} onClose={onClose} onFinish={finish} headingId={headingId} descId={descId} />
      )}
    </Dialog>
  )
}

function ChangeStep({
  draft,
  onDraft,
  onClose,
  onFinish,
  headingId,
  descId,
}: {
  draft: ChangeDraft
  onDraft: (d: ChangeDraft | null) => void
  onClose: () => void
  onFinish: () => void
  headingId: string
  descId: string
}) {
  const { state, dispatch } = useBilling()
  const { navigate, toast } = useUi()
  const { upgrade, subscribe } = useCheckout()
  const [ack, setAck] = useState(false)
  const ackId = useId()
  const { step, target } = draft
  const kind: Kind | null = target ? kindOf(state, target) : null
  const goto = (next: Step, to: OfferId | null = target) => onDraft({ ...draft, step: next, target: to })
  const footer = (n: number, back?: () => void, next?: ReactNode) => (
    <div className="pb-flow__foot">
      {back ? (
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} aria-hidden />} onClick={back}>
          Back
        </Button>
      ) : (
        <span />
      )}
      <span className="pb-flow__step">Step {n} of 4</span>
      {next ?? <span />}
    </div>
  )

  /* 1. Choose: only the plans this customer may move to. */
  if (step === 'choose') {
    const ids = offeredPlans(state)
    const fresh = state.status !== 'active'
    const lede = fresh
      ? 'Pick the plan that fits how many reports you run.'
      : state.planId === 'yearly'
        ? 'Switching to monthly billing takes effect when your yearly plan renews.'
        : state.planId === 'flex'
          ? 'These are the plans you can move to. Your remaining credits roll over.'
          : 'These are the plans you can move to. Your unused credits carry over.'
    return (
      <div className="dialog__body pb-flow">
        <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
          {fresh ? 'Choose a plan' : 'Change plan'}
        </h2>
        <p id={descId} className="dialog__lede dialog__lede--left">
          {lede}
        </p>
        <ul className="pb-opts" style={{ '--n': ids.length } as CSSProperties}>
          {ids.map((id) => (
            <li key={id}>
              <OptionCard
                id={id}
                featured={id === 'yearly'}
                onPick={() => {
                  if (id === 'business') return toast('Talk to sales isn’t connected in this prototype.')
                  goto('review', id)
                }}
              />
            </li>
          ))}
        </ul>
        <div className="pb-flow__foot">
          <button
            type="button"
            className="text-btn"
            onClick={() => {
              onClose()
              navigate('plans')
            }}
          >
            Compare plans in detail
          </button>
          <span className="pb-flow__step">Step 1 of 4</span>
        </div>
      </div>
    )
  }

  if (!target || !kind || kind === 'sales') return null
  const back = (to: Step) => () => (draft.began === 'review' && to === 'choose' ? onClose() : goto(to, to === 'choose' ? null : target))

  /* Yearly to monthly, at the next renewal. */
  if (kind === 'schedule') {
    const date = formatDate(state.cycleEnd)
    const y = PLANS.yearly
    const m = PLANS.monthly
    const cut = (p: typeof y) => p.badge?.replace(/^Save\s+/i, '') ?? ''
    const losses = [
      { title: 'Smaller report discount:', detail: `${cut(y)} drops to ${cut(m)} off report unit costs` },
      { title: 'Higher monthly cost:', detail: `${formatPrice(perMonth(y) ?? 0)} a month becomes ${formatPrice(m.price ?? 0)} a month` },
      { title: 'Smaller credit allowance:', detail: `${formatCount(y.credits ?? 0)} credits a year becomes ${formatCount(m.credits ?? 0)} a month` },
    ]

    if (step === 'review')
      return (
        <div className="dialog__body pb-flow">
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
            Switch to monthly billing
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left">
            Nothing changes today. Growth monthly starts when your yearly plan renews on <strong>{date}</strong>.
          </p>
          <section className="perk-box perk-box--firm perk-box--loss" aria-label={`What changes from ${date}`}>
            <p className="perk-box__title">What changes from {date}:</p>
            <ul className="checklist checklist--md">
              {losses.map((l) => (
                <li key={l.title}>
                  <Minus className="checklist__mark" size={18} strokeWidth={2.25} aria-hidden />
                  <span>
                    <strong>{l.title}</strong> {l.detail}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          {footer(2, back('choose'), <Button onClick={() => goto('confirm')}>Continue</Button>)}
        </div>
      )

    if (step === 'confirm')
      return (
        <div className="dialog__body pb-flow">
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
            Switch to monthly billing?
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left">
            You keep Growth yearly until {date}. You can choose Keep yearly billing any time before then.
          </p>
          <label className="downgrade__ack" htmlFor={ackId}>
            <input id={ackId} type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
            <span>I understand unused credits from my yearly plan expire on {date}</span>
          </label>
          <div className="dialog__pair">
            <Button data-autofocus onClick={onClose}>
              Keep yearly billing
            </Button>
            <Button
              variant="secondary"
              disabled={!ack}
              onClick={() => {
                dispatch({ type: 'switch-to-monthly', today: TODAY })
                goto('done')
              }}
            >
              Switch to monthly billing
            </Button>
          </div>
          {footer(3, back('review'))}
        </div>
      )

    return (
      <div className="dialog__body success topped">
        <SuccessMark />
        <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
          Switch to monthly billing scheduled
        </h2>
        <p id={descId} className="dialog__lede dialog__lede--left">
          Your plan changes to Growth monthly on {date}. From then you pay {formatPrice(m.price ?? 0)} a month. Until then,
          nothing changes.
        </p>
        <Button data-autofocus block onClick={onFinish}>
          Back to My Plan
        </Button>
      </div>
    )
  }

  /* Paid now: Flex to Growth, monthly to yearly, or a fresh start. */
  const id = target as PaidPlanId
  const q = quote(state, id)
  const growth = id !== 'flex'
  const fromFlex = state.status === 'active' && state.planId === 'flex'

  if (step === 'review')
    return (
      <div className="dialog__body pb-flow">
        <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
          Review your change
        </h2>
        <p id={descId} className="dialog__lede dialog__lede--left">
          Check what you pay today, the credits you get and your dates.
        </p>
        <dl className="pb-ledger">
          <div>
            <dt>New plan</dt>
            <dd>{planLabel(id)}</dd>
          </div>
          <div className="pb-ledger__key">
            <dt>Charged today</dt>
            <dd>{formatPrice(q.price)}</dd>
          </div>
          <div>
            <dt>Credits you get</dt>
            <dd>
              {formatCount(q.total)}
              {q.carry > 0 && (
                <span>
                  {formatCount(q.fresh)} new and {formatCount(q.carry)} carried over
                </span>
              )}
            </dd>
          </div>
          {fromFlex && q.carry > 0 && (
            <div>
              <dt>Carried-over credits</dt>
              <dd>
                Expire at your next renewal
                <span>{formatDate(q.next)}</span>
              </dd>
            </div>
          )}
          <div>
            <dt>Next charge</dt>
            <dd>
              {growth ? `${formatDate(q.next)}, ${formatPrice(q.price)}` : 'None'}
              {!growth && <span>One-time payment, credits never expire</span>}
            </dd>
          </div>
          {growth && (
            <div>
              <dt>Auto top-up</dt>
              <dd>
                On
                <span>Renews your plan early and charges {formatPrice(q.price)} when credits run out. Change it in Credits.</span>
              </dd>
            </div>
          )}
        </dl>
        {footer(2, back('choose'), <Button onClick={() => goto('confirm')}>Continue</Button>)}
      </div>
    )

  // Step 3: confirm and pay. Stripe opens in the same tab; the success dialog is step 4.
  return (
    <div className="dialog__body pb-flow">
      <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
        Confirm and pay
      </h2>
      <p id={descId} className="dialog__lede dialog__lede--left">
        You pay <strong>{formatPrice(q.price)}</strong> today for {planLabel(id)}. Stripe opens in this tab and brings you
        back to My Plan when it is done.
      </p>
      <Button
        data-autofocus
        block
        onClick={() => {
          onClose()
          if (state.status === 'active') upgrade(id)
          else subscribe(id)
        }}
      >
        Confirm and pay {formatPrice(q.price)}
      </Button>
      <p className="dialog__fine">By paying, you agree to AsiaVerify’s terms.</p>
      {footer(3, back('review'))}
    </div>
  )
}

function OptionCard({ id, featured, onPick }: { id: OfferId; featured: boolean; onPick: () => void }) {
  const { state } = useBilling()
  const plan = PLANS[id]
  const kind = kindOf(state, id)
  const growth = id === 'monthly' || id === 'yearly'
  const name = growth ? 'Growth' : plan.tier
  const cycle = id === 'monthly' ? 'billed monthly' : id === 'yearly' ? 'billed yearly' : id === 'flex' ? 'one-time purchase' : 'volume pricing'
  const unit = id === 'monthly' ? 'per month' : id === 'yearly' ? 'per year' : id === 'flex' ? 'once' : ''
  const monthly = perMonth(plan)
  const carry = state.status === 'active' ? state.creditsRemaining : 0
  const effect =
    kind === 'sales'
      ? 'Volume pricing and a dedicated team. Our sales team will contact you.'
      : kind === 'schedule'
        ? `Starts on ${formatDate(state.cycleEnd)}. Nothing changes today.`
        : id === 'flex'
          ? 'Charged today. Credits never expire.'
          : carry > 0
            ? `Charged today. Your ${formatCount(carry)} unused credits carry over.`
            : 'Charged today.'
  const label = kind === 'sales' ? 'Talk to sales' : kind === 'schedule' ? 'Switch to monthly billing' : 'Select plan'

  return (
    <article className={`pb-opt ${featured ? 'is-featured' : ''}`} aria-label={`${name}, ${cycle}`}>
      <h3 className="pb-opt__name">
        {name}
        <span>{cycle}</span>
      </h3>
      <p className="pb-opt__price">
        <strong>{plan.price !== null ? formatPrice(plan.price) : 'Custom'}</strong>
        {unit && <span>{unit}</span>}
      </p>
      <p className="pb-opt__credits">
        {plan.credits !== null ? `${formatCount(plan.credits)} credits${plan.cycle ? ` ${unit}` : ', never expire'}` : 'Credits agreed with sales'}
      </p>
      {id === 'yearly' && monthly !== null && <p className="pb-opt__sub">{formatPrice(monthly)} a month</p>}
      {plan.badge && (
        <p className="pb-opt__badge">
          <Badge tone="accent">{plan.badge}</Badge>
        </p>
      )}
      <p className="pb-opt__effect">{effect}</p>
      <Button block variant={featured ? 'primary' : 'secondary'} onClick={onPick}>
        {label}
      </Button>
    </article>
  )
}

/* Top up (Flex, once) ----------------------------------------------------------- */

function TopUpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const headingId = useId()
  const descId = useId()
  const { topUp } = useCheckout()
  const pack = TOP_UP.flex
  return (
    <Dialog open={open} onClose={onClose} labelledBy={headingId} describedBy={descId} size="md">
      {open && (
        <div className="dialog__body pb-flow">
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
            Top up your credits
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left">
            Add credits to keep generating reports. Flex allows one top-up.
          </p>
          <dl className="pb-ledger">
            <div>
              <dt>Credits added</dt>
              <dd>{formatCount(pack.credits)}</dd>
            </div>
            <div className="pb-ledger__key">
              <dt>Charged today</dt>
              <dd>
                {formatPrice(pack.price)}
                <span>Once. You will not be charged again.</span>
              </dd>
            </div>
            <div>
              <dt>Expiry</dt>
              <dd>Never. Flex credits do not expire.</dd>
            </div>
          </dl>
          <p className="pb-flow__note">After this top-up, change plan to keep adding credits.</p>
          <div className="dialog__pair">
            <Button
              data-autofocus
              onClick={() => {
                onClose()
                topUp()
              }}
            >
              Top up for {formatPrice(pack.price)}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Not now
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}

/* Auto top-up (Growth): confirm, then done ------------------------------------- */

function AutoTopUpDialog({
  draft,
  onDraft,
  onClose,
}: {
  draft: AutoDraft | null
  onDraft: (d: AutoDraft | null) => void
  onClose: () => void
}) {
  const { state, dispatch } = useBilling()
  const headingId = useId()
  const descId = useId()
  const plan = PLANS[state.planId]
  const price = formatPrice(plan.price ?? 0)
  // Flex has no renewal date, and this dialog is mounted for every plan.
  const renews = state.cycleEnd ? formatDate(state.cycleEnd) : ''
  const close = () => {
    const done = draft?.step === 'done'
    onClose()
    if (done) flagUpdated(['.pb-addcredits'])
  }

  return (
    <Dialog
      open={draft !== null}
      onClose={close}
      labelledBy={headingId}
      describedBy={descId}
      size="sm"
      stepKey={draft ? `${draft.on}-${draft.step}` : undefined}
    >
      {draft?.step === 'confirm' && (
        <div className="dialog__body">
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
            {draft.on ? 'Turn on auto top-up?' : 'Turn off auto top-up?'}
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left">
            {draft.on
              ? `When your credits run out, we renew your plan early and charge ${price}. You get ${formatCount(plan.credits ?? 0)} new credits and your billing date moves to that day.`
              : `If your credits run out, reports that need more credits wait until ${renews}.`}
          </p>
          <div className="dialog__pair">
            <Button
              data-autofocus
              onClick={() => {
                if (draft.on) {
                  dispatch({ type: 'set-auto-top-up', on: true })
                  onDraft({ on: true, step: 'done' })
                } else onClose()
              }}
            >
              {draft.on ? 'Turn on' : 'Keep it on'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (draft.on) onClose()
                else {
                  dispatch({ type: 'set-auto-top-up', on: false })
                  onDraft({ on: false, step: 'done' })
                }
              }}
            >
              {draft.on ? 'Not now' : 'Turn off'}
            </Button>
          </div>
        </div>
      )}
      {draft?.step === 'done' && (
        <div className="dialog__body success topped">
          <SuccessMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
            {draft.on ? 'Auto top-up is on' : 'Auto top-up is off'}
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left">
            {draft.on
              ? `When your credits run out, we renew your plan early and charge ${price}.`
              : `Reports that need more credits wait until ${renews}. You can turn it back on any time.`}
          </p>
          <Button data-autofocus block onClick={close}>
            Back to My Plan
          </Button>
        </div>
      )}
    </Dialog>
  )
}
