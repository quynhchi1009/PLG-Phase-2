import { useId, type CSSProperties } from 'react'
import { Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { SuccessMark } from '../../components/ui/SuccessMark'
import { PLANS, formatCount, formatPrice, stayPerks } from '../../data/plans'
import { formatDate } from '../../data/history'
import { TODAY, useBilling } from '../../state/billing'
import { useUi } from '../../state/ui'
import { flagUpdated } from './flagUpdated'

/* Choreography (ms after the dialog opens). Each step lands before the next
   starts: the badge, the title, then what the customer now has. */
const T = { head: 80, title: 160, lede: 240, panel: 320, list: 460 }

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
  const compact = s?.kind === 'topped-up' || s?.kind === 'reactivated'

  const close = () => {
    // Backing out of the reactivation confirmation changes nothing on the page.
    if (s?.kind === 'reactivate-confirm') return dispatch({ type: 'dismiss-success' })
    const changed = s?.kind === 'topped-up' ? ['.settings'] : ['.plan-card', '.settings']
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
              {PLANS[s.planId].features.map((f, i) => (
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
    </Dialog>
  )
}
