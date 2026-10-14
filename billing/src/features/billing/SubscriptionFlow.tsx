import { useId } from 'react'
import { CalendarCheck, Check, Clock, Coins, Radar } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog'
import { Button } from '../../components/ui/Button'
import { Checklist } from '../../components/ui/primitives'
import { CANCEL_PERKS, PLANS, REPORT_RETENTION_DAYS, formatCount } from '../../data/plans'
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

  // The same dated facts appear before the commit (step 1) and in the receipt (step 3).
  const facts = (
    <ul className="consequences" aria-label="What happens if you cancel">
      <li>
        <CalendarCheck size={16} aria-hidden />
        <span>
          Your plan stays active until <strong>{cycleEnd}</strong>. You won't be charged again.
        </span>
      </li>
      <li>
        <Coins size={16} aria-hidden />
        <span>
          Your <strong>{formatCount(credits)} remaining credits</strong> stay usable until {cycleEnd}.
        </span>
      </li>
      <li>
        <Radar size={16} aria-hidden />
        <span>
          Perpetual KYB monitoring stops on <strong>{cycleEnd}</strong>.
        </span>
      </li>
      <li>
        <Clock size={16} aria-hidden />
        <span>
          Your reports stay accessible until <strong>{deleteOn}</strong>, then they're permanently deleted.
        </span>
      </li>
    </ul>
  )

  switch (step) {
    case 'cancel-confirm':
      return (
        <div className="dialog__body dialog__body--center">
          <h2 id={headingId} tabIndex={-1} className="dialog__title">
            Are you sure you'd like to cancel?
          </h2>
          <p id={descId} className="dialog__lede">
            Here's what happens if you cancel your {plan.tier} plan:
          </p>
          {facts}
          <div className="dialog__actions dialog__actions--stack">
            <Button data-autofocus block onClick={onClose}>
              Keep current plan
            </Button>
            <Button variant="link" onClick={() => onStep('cancel-offer')}>
              Continue to cancel
            </Button>
          </div>
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
          <section className="perk-box" aria-label={`What your ${plan.tier} plan includes`}>
            <p className="perk-box__title">Stay subscribed to retain your perks:</p>
            <Checklist items={CANCEL_PERKS} size="sm" />
          </section>
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
                  Your historical reports will remain accessible until <strong>{deleteOn}</strong>.
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
                  Re-subscribe by {deleteOn} to keep access. After that, they'll be permanently deleted.
                </span>
              </li>
            </ul>
            <Button
              block
              onClick={() => {
                onClose()
                navigate('plans')
              }}
            >
              View plans &amp; pricing
            </Button>
            <Button variant="link" data-autofocus onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )
  }
}
