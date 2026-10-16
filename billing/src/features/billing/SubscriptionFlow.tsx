import { useId } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog'
import { Button } from '../../components/ui/Button'
import { PLANS, REPORT_RETENTION_DAYS, STAY_PERKS, formatCount } from '../../data/plans'
import { addDays, formatDate } from '../../data/history'
import { useBilling } from '../../state/billing'
import { useUi } from '../../state/ui'

/**
 * Cancellation runs inside one dialog that reshapes per step, so it reads as
 * one conversation with a visible way through at every point.
 */
export type FlowStep = 'cancel-confirm' | 'cancel-offer' | 'cancel-done'

// One width for every step, so buttons never move under the pointer between steps.
const SIZE: Record<FlowStep, 'sm' | 'md' | 'lg'> = {
  'cancel-confirm': 'md',
  'cancel-offer': 'md',
  'cancel-done': 'md',
}

export function SubscriptionFlow({
  step,
  onStep,
  onClose,
}: {
  step: FlowStep | null
  onStep: (step: FlowStep) => void
  onClose: () => void
}) {
  const headingId = useId()
  const descId = useId()
  return (
    <Dialog
      open={step !== null}
      onClose={onClose}
      labelledBy={headingId}
      describedBy={descId}
      size={step ? SIZE[step] : 'md'}
      stepKey={step ?? undefined}
    >
      {step && <StepContent step={step} onStep={onStep} onClose={onClose} headingId={headingId} descId={descId} />}
    </Dialog>
  )
}

function StepContent({
  step,
  onStep,
  onClose,
  headingId,
  descId,
}: {
  step: FlowStep
  onStep: (step: FlowStep) => void
  onClose: () => void
  headingId: string
  descId: string
}) {
  const { state, dispatch } = useBilling()
  const { navigate } = useUi()
  const plan = PLANS[state.planId]
  const cycleEnd = formatDate(state.cycleEnd)
  const deleteOn = formatDate(addDays(state.cycleEnd, REPORT_RETENTION_DAYS))
  const credits = state.creditsRemaining

  switch (step) {
    case 'cancel-confirm':
      // Title and lede set the question; the card holds what's at stake and
      // both ways out, with keeping the plan as the obvious one.
      return (
        <div className="dialog__body dialog__body--center stay">
          <h2 id={headingId} tabIndex={-1} className="dialog__title stay__title">
            Are you sure you'd like to cancel?
          </h2>
          <p id={descId} className="dialog__lede stay__lede">
            Cancelling your plan would mean losing access to these features you currently enjoy
          </p>
          <section className="stay__card" aria-labelledby={`${headingId}-perks`}>
            <h3 id={`${headingId}-perks`} className="stay__card-title">
              Stay subscribed to retain your perks
            </h3>
            <ul className="stay__perks">
              {STAY_PERKS.map((line) => (
                <li key={line}>
                  <span className="stay__tick" aria-hidden>
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>{emphasise(line)}</span>
                </li>
              ))}
            </ul>
            <div className="stay__actions">
              <Button data-autofocus block onClick={onClose}>
                Keep current plan
              </Button>
              <button type="button" className="text-btn text-btn--quiet" onClick={() => onStep('cancel-offer')}>
                Continue to cancel
              </button>
            </div>
          </section>
        </div>
      )

    case 'cancel-offer':
      return (
        <div className="dialog__body dialog__body--center">
          <h2 id={headingId} tabIndex={-1} className="dialog__title">
            Don't leave just yet
          </h2>
          <p className="offer__title">You could be missing out on better savings!</p>
          <p id={descId} className="dialog__lede">
            Explore other plans tailored to your needs and see how report credits can give you more value from your
            subscription.
          </p>
          <div className="dialog__actions dialog__actions--stack">
            <Button
              block
              onClick={() => {
                onClose()
                navigate('plans')
              }}
            >
              Explore other plans
            </Button>
            <Button
              variant="danger"
              block
              onClick={() => {
                dispatch({ type: 'cancel' })
                onStep('cancel-done')
              }}
            >
              Cancel anyway
            </Button>
          </div>
        </div>
      )

    case 'cancel-done':
      // The receipt doubles as the way back: reactivating here undoes the
      // cancellation without a new purchase, and the dialog's close icon dismisses.
      return (
        <div className="cancelled">
          <span className="cancelled__badge">Plan cancelled</span>
          <h2 id={headingId} tabIndex={-1} className="dialog__title">
            We're sorry to see you go
          </h2>
          <div className="cancelled__box">
            <ul id={descId} className="cancelled__list" aria-label="What happens next">
              <li>
                <span className="cancelled__mark" aria-hidden>
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>
                  Your {plan.tier} plan and {formatCount(credits)} credits stay active until <strong>{cycleEnd}</strong>
                  . You won't be charged again.
                </span>
              </li>
              <li>
                <span className="cancelled__mark" aria-hidden>
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>
                  Perpetual KYB stops on <strong>{cycleEnd}</strong>.
                </span>
              </li>
              <li>
                <span className="cancelled__mark" aria-hidden>
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>
                  Your historical reports remain accessible until <strong>{deleteOn}</strong>. After that, they're
                  permanently deleted.
                </span>
              </li>
            </ul>
            <p className="cancelled__reverse">
              <RotateCcw size={16} aria-hidden />
              <span>You can reverse the cancellation any time before your current billing cycle ends.</span>
            </p>
            <div className="cancelled__actions">
              <Button
                block
                onClick={() => {
                  onClose()
                  dispatch({ type: 'request-reactivate' })
                }}
              >
                Reactivate subscription
              </Button>
              <Button
                block
                variant="secondary"
                onClick={() => {
                  onClose()
                  navigate('plans')
                }}
              >
                View plans &amp; pricing
              </Button>
            </div>
          </div>
        </div>
      )
  }
}

/** Renders a perk sentence, turning its **marked** phrases into <strong>. */
function emphasise(line: string) {
  return line.split(/\*\*(.+?)\*\*/).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))
}
