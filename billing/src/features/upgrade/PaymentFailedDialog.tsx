import { useId } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { FailedMark } from '../../components/ui/FailedMark'
import { formatCount } from '../../data/plans'
import { formatDate } from '../../data/history'
import { useBilling } from '../../state/billing'
import { usePayOnStripe } from './usePayOnStripe'

/**
 * Version A, Growth: "Payment failed" on the report page (PRD 3.2 #2).
 *
 * Shown when an Auto top up charge is declined (a report with Auto top up on, or "Enable and pay" at the
 * report gate), and again on every later report that costs more than the balance, with no new charge.
 * The plan is not cancelled, the billing date and the credits stay as they were, and reports that fit in
 * the balance still generate. The renewal on the billing date uses the same card, and a failed renewal cancels
 * the plan straight away (PRD 3.3), so the pop-up names that date as the deadline.
 *
 * Two exits: "Update your payment details" (the full plan price, then the user carries on) and closing, which changes
 * nothing. Stripe is not connected in the prototype, so "Update your payment details" only says so (PRD 3.2 #3 is built
 * later).
 */
export function PaymentFailedDialog({
  open,
  onClose,
  needed,
}: {
  open: boolean
  onClose: () => void
  /** Credits the report that triggered this costs. */
  needed: number
}) {
  const headingId = useId()
  const descId = useId()
  const { state } = useBilling()
  const payOnStripe = usePayOnStripe()
  // With a switch to monthly scheduled Auto top up is off, so the declined charge was "Renew current plan".
  const renewal = state.pendingDowngrade

  return (
    <Dialog open={open} onClose={onClose} labelledBy={headingId} describedBy={descId} size="sm">
      {open && (
        <div className="dialog__body success topped">
          <FailedMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
            {renewal ? 'Renewal payment failed' : 'Auto top up payment failed'}
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left">
            Your card was declined, so {renewal && "your plan wasn't renewed and "}this report ({formatCount(needed)}{' '}
            credits) wasn&apos;t generated. You can still run reports under your {formatCount(state.creditsRemaining)}{' '}
            credits. Update your payment details before{' '}
            {formatDate(state.cycleEnd).replace(/ /g, ' ')}, or your subscription will be cancelled.
          </p>
          <Button
            data-autofocus
            block
            onClick={() => {
              onClose()
              payOnStripe()
            }}
          >
            Update your payment details
          </Button>
        </div>
      )}
    </Dialog>
  )
}
