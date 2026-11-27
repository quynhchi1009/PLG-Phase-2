import { useId } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { FailedMark } from '../../components/ui/FailedMark'
import { PaymentFacts } from '../../components/ui/PaymentProgress'
import { PLANS, formatCount, formatPrice } from '../../data/plans'
import { formatDate } from '../../data/history'
import { useBilling } from '../../state/billing'
import { usePayOnStripe } from './usePayOnStripe'

/**
 * Version A, Growth: "Payment failed" on the report page (PRD 3.2 #2).
 *
 * Shown when an Auto top up charge is declined (a report with Auto top up on, or "Enable Auto top up" at the
 * report gate), and again on every later report that costs more than the balance, with no new charge.
 * The plan is not cancelled, the billing date and the credits stay as they were, and reports that fit in
 * the balance still generate. The renewal on the billing date uses the same card, and a failed renewal cancels
 * the plan straight away (PRD 3.3), so the pop-up names that date as the deadline.
 *
 * Two exits: "Update payment details" (the full plan price, then the user carries on) and closing, which changes
 * nothing. Stripe is not connected in the prototype, so "Update payment details" only says so (PRD 3.2 #3 is built
 * later).
 */
export function PaymentFailedDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const headingId = useId()
  const descId = useId()
  const { state } = useBilling()
  const payOnStripe = usePayOnStripe()
  // With a switch to monthly scheduled Auto top up is off, so the declined charge was "Renew current plan".
  const renewal = state.pendingDowngrade
  const plan = PLANS[state.planId]

  return (
    <Dialog open={open} onClose={onClose} labelledBy={headingId} describedBy={descId} size="sm">
      {open && (
        // The same build as "Not enough credits for this report" (AutoTopUpGate), which opens at the same moment
        // in this flow: title, lede, the shared payment facts, the primary action, then "Not now". The red mark
        // above the title is the one addition, so a failed payment reads as one at a glance.
        <div className="dialog__body success">
          <FailedMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
            {renewal ? 'Renewal payment failed' : 'Auto top up payment failed'}
          </h2>
          {/* A declined Auto top up never cancels the plan (PRD 3.2): it stays active with its credits until the
              next billing date. Updating the payment details renews the current plan at its full price. */}
          <p id={descId} className="dialog__lede dialog__lede--left">
            We couldn&apos;t process your payment, so {renewal && "your plan wasn't renewed and "}this report wasn&apos;t
            generated. Your plan remains active, and you can continue using your remaining credits. Update your payment
            details to renew your current plan.
          </p>
          {/* The deadline (the next billing date, PRD 3.3) and what renewing costs once the payment details are
              updated (PRD 3.2 #3), with the balance that still works until then. */}
          <PaymentFacts
            facts={[
              { label: 'Credits remaining', value: formatCount(state.creditsRemaining) },
              { label: 'Next billing date', value: formatDate(state.cycleEnd) },
              { label: 'Current plan renews for', value: formatPrice(plan.price ?? 0) },
            ]}
          />
          <div className="dialog__actions dialog__actions--stack">
            <Button
              data-autofocus
              block
              onClick={() => {
                onClose()
                payOnStripe()
              }}
            >
              Update payment details
            </Button>
            <Button variant="link" onClick={onClose}>
              Not now
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
