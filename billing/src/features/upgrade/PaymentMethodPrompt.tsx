import { useEffect, useId, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { PaymentNote } from '../../components/ui/PaymentProgress'
import { useTakingLonger } from '../../components/ui/useTakingLonger'
import { Notice } from '../../components/ui/primitives'
import { SuccessMark } from '../../components/ui/SuccessMark'
import { PLANS } from '../../data/plans'
import { formatDate } from '../../data/history'
import { useBilling, type PaymentFailure, type PaymentPromptReason } from '../../state/billing'
import { simulateWait } from '../../state/paymentSim'
import { PAYMENT_FAILURE } from './paymentFailure'

type Phase = 'idle' | 'opening' | 'saved'

/**
 * Grace period after a failed renewal payment (PRD, Payment Failed). It opens when the customer
 * lands on Search, when they click Generate report (reports are on hold), and from the "Update payment
 * method" button on the sticky banner and on the My Plan warning. "Update payment method" hands off to
 * Stripe, which answers with a saved card or one of the failures in `PAYMENT_FAILURE`; "Try again" runs
 * it once more. A failure is also recorded in billing state, so the My Plan warning keeps it after the
 * popup closes. However the popup is closed before a card is saved, the reminder minimizes to the
 * sticky banner on every page.
 * In production the hand-off leaves the Portal; the prototype keeps the whole exchange in this dialog.
 */
export function PaymentMethodPrompt() {
  const headingId = useId()
  const descId = useId()
  const { state, dispatch } = useBilling()
  const issue = state.paymentIssue
  const prompt = issue?.prompt ?? null
  const [phase, setPhase] = useState<Phase>('idle')
  const [failure, setFailure] = useState<PaymentFailure | null>(null)
  const [seen, setSeen] = useState<PaymentPromptReason | null>(prompt)

  // Each time the popup opens it starts over. From an "Update payment method" button it goes straight to Stripe.
  if (seen !== prompt) {
    setSeen(prompt)
    setFailure(null)
    setPhase(prompt === 'cta' ? 'opening' : 'idle')
  }

  const firstAttempt = issue?.firstAttempt ?? null
  const failedBefore = !!issue?.lastFailure
  useEffect(() => {
    if (phase !== 'opening') return
    // The simulated hand-off to Stripe takes about a second before it answers.
    return simulateWait(() => {
      // The first attempt ends the way the prototype state says; once one has failed, the next saves,
      // even when the popup was closed and opened again from the banner or the My Plan warning.
      const failed = failedBefore ? null : firstAttempt
      if (failed) dispatch({ type: 'payment-method-failed', failure: failed })
      setFailure(failed)
      setPhase(failed ? 'idle' : 'saved')
    })
  }, [phase, failedBefore, firstAttempt, dispatch])

  const close = () => dispatch({ type: phase === 'saved' ? 'resolve-payment-issue' : 'minimize-payment-issue' })
  const start = () => {
    setFailure(null)
    setPhase('opening')
  }

  const opening = phase === 'opening'
  const longer = useTakingLonger(opening)
  const plan = PLANS[state.planId].name
  const due = issue ? formatDate(issue.graceEndsOn) : ''

  return (
    <Dialog
      open={prompt !== null}
      onClose={opening ? () => {} : close}
      labelledBy={headingId}
      describedBy={descId}
      size="sm"
      stepKey={phase === 'saved' ? 'saved' : 'ask'}
      // The primary button already ends the "saved" step, and nothing should interrupt the hand-off.
      hideClose={phase !== 'idle'}
    >
      {issue && prompt && phase === 'saved' && (
        <div className="dialog__body success topped">
          <SuccessMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
            Payment method updated
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left">
            Your subscription won’t be cancelled, and you can generate reports again.
          </p>
          <Button data-autofocus block onClick={close}>
            Done
          </Button>
        </div>
      )}
      {issue && prompt && phase !== 'saved' && (
        <div className="dialog__body" aria-busy={opening}>
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
            Update your payment method
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left">
            {prompt === 'generate'
              ? `Reports are on hold until you update your payment method. Your ${plan} renewal payment didn’t go through.`
              : `Your ${plan} renewal payment didn’t go through.`}
          </p>
          {failure ? (
            <Notice tone="negative" icon={<CircleAlert size={18} />} title={PAYMENT_FAILURE[failure].title}>
              {PAYMENT_FAILURE[failure].text}
            </Notice>
          ) : (
            <Notice tone="warning" icon={<CircleAlert size={18} />} title={`Update by ${due}`}>
              After that date, your subscription is cancelled automatically.
            </Notice>
          )}
          {/* The hint's slot becomes the note while Stripe opens, so the dialog doesn't change height. */}
          {opening ? (
            <PaymentNote
              className="pay-note--hint"
              busy
              longer={longer}
              busyText="Taking you to Stripe’s secure page. Please keep this window open."
            />
          ) : (
            <p className="dialog__hint">
              {failure
                ? `You can try again until ${due}. After that, your subscription is cancelled automatically.`
                : 'You’ll enter your new card on Stripe’s secure page, then come back here.'}
            </p>
          )}
          <div className="dialog__actions dialog__actions--stack">
            <Button data-autofocus block loading={opening} onClick={start}>
              {opening ? 'Opening Stripe…' : failure ? 'Try again' : 'Update payment method'}
            </Button>
            <Button variant="link" aria-disabled={opening} onClick={opening ? undefined : close}>
              Not now
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
