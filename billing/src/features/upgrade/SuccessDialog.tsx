import { useId, useState, type CSSProperties } from 'react'
import { Check, Minus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { SuccessMark } from '../../components/ui/SuccessMark'
import { PLANS, TOP_UP, formatCount, formatPrice, perMonth, stayPerks } from '../../data/plans'
import { formatDate } from '../../data/history'
import { TODAY, useBilling } from '../../state/billing'
import { useUi } from '../../state/ui'
import { flagUpdated } from './flagUpdated'

/* Choreography (ms after the dialog opens). Each step lands before the next
   starts: the badge, the title, then what the customer now has. */
const T = { head: 80, title: 160, lede: 240, panel: 320, list: 460 }

/* Growth plans switch Auto top up on at purchase, so the activation dialog says so. */
const AUTO_TOP_UP_PERK = {
  title: 'Auto top up:',
  detail: "turned on, so we add credits automatically when you run out. Turn it off anytime in your plan settings",
}

const at = (ms: number) => ({ '--at': `${ms}ms` }) as CSSProperties

/**
 * Confirms what just changed on the Billing page: a (simulated) Stripe checkout,
 * or a reactivation (asked to confirm first, then confirmed).
 */
export function SuccessDialog() {
  const { state, dispatch } = useBilling()
  const { route } = useUi()
  const headingId = useId()
  const descId = useId()
  const s = state.success
  const open = !!s && route === 'billing'
  // Short confirmations (a top-up, a reactivation) take the narrow dialog.
  const compact = s?.kind === 'topped-up' || s?.kind === 'reactivated' || s?.kind === 'auto-top-up-confirm' || s?.kind === 'auto-top-up-off' || s?.kind === 'auto-top-up-enable-confirm' || s?.kind === 'auto-top-up-on' || s?.kind === 'downgrade-scheduled'

  const close = () => {
    // Backing out of the reactivation confirmation changes nothing on the page.
    if (s?.kind === 'reactivate-confirm' || s?.kind === 'auto-top-up-confirm' || s?.kind === 'auto-top-up-enable-confirm' || s?.kind === 'downgrade-confirm') return dispatch({ type: 'dismiss-success' })
    const changed = s?.kind === 'topped-up' || s?.kind === 'auto-top-up-off' || s?.kind === 'auto-top-up-on' ? ['.settings'] : ['.plan-card', '.settings']
    dispatch({ type: 'dismiss-success' })
    flagUpdated(changed)
  }

  return (
    <Dialog open={open} onClose={close} labelledBy={headingId} describedBy={descId} size={compact ? 'sm' : 'md'} stepKey={s?.kind}>
      {open && s?.kind === 'upgraded' && (
        <div className="activated">
          <span className="activated__badge success__in success__in--pop" style={at(T.head)}>
            Plan activated
          </span>
          <h2 id={headingId} tabIndex={-1} className="dialog__title success__in" style={at(T.title)}>
            You successfully {s.via === 'subscribe' ? 'subscribed' : 'upgraded'} to{' '}
            <span className="dialog__title-accent">{PLANS[s.planId].name}</span>!
          </h2>
          <div className="activated__box success__in" style={at(T.panel)}>
            <ul id={descId} className="upc__perks" aria-label="What your plan includes">
              {(s.planId === 'flex' ? PLANS[s.planId].features : [...PLANS[s.planId].features, AUTO_TOP_UP_PERK]).map((f, i) => (
                <li key={f.title} className="success__in" style={at(T.list + i * 60)}>
                  <span className="upc__tick" aria-hidden>
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>
                    <strong>{f.title}</strong> {f.detail}
                  </span>
                </li>
              ))}
            </ul>
            <Button data-autofocus block onClick={close}>
              Back to my plan
            </Button>
          </div>
        </div>
      )}

      {open && s?.kind === 'topped-up' && (
        <div className="dialog__body success topped">
          <SuccessMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            {formatCount(s.credits)} credits added!
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            You have successfully topped-up your credits
          </p>
          <Button data-autofocus block onClick={close}>
            View balance
          </Button>
        </div>
      )}

      {open && s?.kind === 'reactivate-confirm' && (
        <div className="dialog__body success">
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            Don't miss out on your plan benefits
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            Reactivate your subscription to continue enjoying your current plan benefits.
          </p>
          <section className="perk-box perk-box--firm success__in" style={at(T.panel)} aria-label="What you keep">
            <p className="perk-box__title">Stay on current plan to continue enjoying:</p>
            <ul className="checklist checklist--md">
              {stayPerks(s.planId === 'yearly' ? 'yearly' : 'monthly').map((f, i) => (
                <li key={f.title} className="success__in" style={at(T.list + i * 80)}>
                  <Check className="checklist__mark" size={18} strokeWidth={2.25} aria-hidden />
                  <span>
                    <strong>{f.title}</strong> {f.detail}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <Button data-autofocus block onClick={() => dispatch({ type: 'reactivate', today: TODAY })}>
            Reactivate subscription
          </Button>
        </div>
      )}

      {open && s?.kind === 'reactivated' && (
        <div className="dialog__body success topped">
          <SuccessMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            Subscription reactivated
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            Your {PLANS[s.planId].tier} plan renews on {formatDate(s.renewsOn)} at{' '}
            {formatPrice(PLANS[s.planId].price ?? 0)}. Your credits and Perpetual KYB stay as they are.
          </p>
          <Button data-autofocus block onClick={close}>
            Go to my plan
          </Button>
        </div>
      )}

      {open && s?.kind === 'downgrade-confirm' && (
        <DowngradeConfirm headingId={headingId} descId={descId} onKeep={close} />
      )}

      {open && s?.kind === 'downgrade-scheduled' && (
        <div className="dialog__body success topped">
          <SuccessMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            Switch to monthly scheduled
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            Your plan changes to Growth monthly on {formatDate(s.renewsOn)}. From then you'll be billed{' '}
            {formatPrice(PLANS.monthly.price ?? 0)} per month. Until then, nothing changes.
          </p>
          <Button data-autofocus block onClick={close}>
            Back to my plan
          </Button>
        </div>
      )}

      {open && s?.kind === 'auto-top-up-confirm' && (
        <div className="dialog__body success">
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            Turn off Auto top up?
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            If your credits run out, we won't add more automatically. Reports will pause until you top up manually or your
            plan renews.
          </p>
          <div className="dialog__pair success__in" style={at(T.panel)}>
            <Button data-autofocus block onClick={close}>
              Stay enabled
            </Button>
            <Button block variant="secondary" onClick={() => dispatch({ type: 'disable-auto-top-up' })}>
              Disable
            </Button>
          </div>
        </div>
      )}

      {open && s?.kind === 'auto-top-up-enable-confirm' && (
        <div className="dialog__body success">
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            Turn on Auto top up?
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            When your credits run out, we'll add {formatCount(TOP_UP[state.planId].credits)} credits for{' '}
            {formatPrice(TOP_UP[state.planId].price)} automatically, so your reports keep running.
          </p>
          <div className="dialog__pair success__in" style={at(T.panel)}>
            <Button data-autofocus block onClick={() => dispatch({ type: 'enable-auto-top-up' })}>
              Enable
            </Button>
            <Button block variant="secondary" onClick={close}>
              Stay disabled
            </Button>
          </div>
        </div>
      )}

      {open && s?.kind === 'auto-top-up-on' && (
        <div className="dialog__body success topped">
          <SuccessMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            Auto top up turned on
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            We'll add credits automatically whenever you run out. You can turn it off anytime from your plan page.
          </p>
          <Button data-autofocus block onClick={close}>
            View balance
          </Button>
        </div>
      )}

      {open && s?.kind === 'auto-top-up-off' && (
        <div className="dialog__body success topped">
          <SuccessMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            Auto top up turned off
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            We won't add credits automatically anymore. You can turn it back on anytime from your plan page.
          </p>
          <Button data-autofocus block onClick={close}>
            View balance
          </Button>
        </div>
      )}
    </Dialog>
  )
}

/* The one step before a yearly plan is scheduled to move to monthly: what stays until then,
   what changes, and an acknowledgement that unused credits do not carry over. */
function DowngradeConfirm({ headingId, descId, onKeep }: { headingId: string; descId: string; onKeep: () => void }) {
  const { state, dispatch } = useBilling()
  const [ack, setAck] = useState(false)
  const ackId = useId()
  const y = PLANS.yearly
  const date = formatDate(state.cycleEnd)
  const discount = (p: typeof y) => p.badge?.replace(/^Save\s+/i, '') ?? ''
  const m = PLANS.monthly
  const losses = [
    { title: 'Smaller report discount:', detail: `${discount(y)} drops to ${discount(m)} off report unit costs` },
    {
      title: 'Higher monthly cost:',
      detail: `${formatPrice(perMonth(y) ?? 0)}/month becomes ${formatPrice(m.price ?? 0)}/month`,
    },
    {
      title: 'Smaller credit allowance:',
      detail: `${formatCount(y.credits ?? 0)} credits a year becomes ${formatCount(m.credits ?? 0)} a month`,
    },
  ]

  return (
    <div className="dialog__body success">
      <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
        Switch to monthly billing?
      </h2>
      <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
        Nothing changes today. Growth monthly starts when your yearly plan renews on <strong>{date}</strong>.
      </p>

      <section className="perk-box perk-box--firm perk-box--loss success__in" style={at(T.list)} aria-label={`What you lose from ${date}`}>
        <p className="perk-box__title">What you'll lose from {date}:</p>
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

      <label className="downgrade__ack success__in" style={at(T.list)} htmlFor={ackId}>
        <input id={ackId} type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
        <span>I understand unused credits from my yearly plan expire on {date}.</span>
      </label>

      <div className="dialog__pair success__in" style={at(T.list)}>
        <Button data-autofocus block onClick={onKeep}>
          Keep yearly plan
        </Button>
        <Button
          block
          variant="secondary"
          disabled={!ack}
          onClick={() => dispatch({ type: 'schedule-downgrade', today: TODAY })}
        >
          Switch to monthly
        </Button>
      </div>
    </div>
  )
}
