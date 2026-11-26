import { useId } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { FailedMark } from '../../components/ui/FailedMark'
import { formatCount } from '../../data/plans'
import { useBilling } from '../../state/billing'
import { usePayOnStripe } from './usePayOnStripe'

/**
 * Version A, Growth: "Payment failed" on the report page (PRD 3.2 #2).
 *
 * Shown when an Auto top up charge is declined (a report with Auto top up on, or "Enable and pay" at the
 * report gate), and again on every later report that costs more than the balance, with no new charge.
 * The plan is not cancelled, the billing date and the credits stay as they were, and reports that fit in
 * the balance still generate.
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

  return (
    <Dialog open={open} onClose={onClose} labelledBy={headingId} describedBy={descId} size="sm">
      {open && (
        <div className="dialog__body success topped">
          <FailedMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
            Auto top up payment failed
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left">
            We couldn&apos;t charge your card, so this report ({formatCount(needed)} credits) was not generated. Your{' '}
            {formatCount(state.creditsRemaining)} credits are still yours, and reports that cost less than that still
            work. Update your payment details on Stripe to add more credits.
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
