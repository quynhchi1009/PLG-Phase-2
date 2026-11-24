import { CircleAlert } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { formatDate } from '../../data/history'
import { useBilling } from '../../state/billing'

/**
 * Failed renewal payment, popup closed: the reminder moves here and stays under the top bar on
 * every page until the payment method is updated (PRD, Payment Failed: "minimize to sticky banner").
 * It has no close button on purpose; only updating the card or the end of the grace period removes it.
 */
export function PaymentBanner() {
  const { state, dispatch } = useBilling()
  const issue = state.paymentIssue
  if (!issue?.minimized) return null
  return (
    <div className="pay-banner" role="status">
      <div className="pay-banner__body">
        <span className="pay-banner__icon" aria-hidden>
          <CircleAlert size={18} />
        </span>
        <p className="pay-banner__text">
          <span className="pay-banner__title">Update your payment method</span> by {formatDate(issue.graceEndsOn)} or
          your subscription will be cancelled automatically.
        </p>
      </div>
      {/* Goes straight to Stripe; if that fails, the popup opens with the reason. */}
      <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'open-payment-prompt', reason: 'cta' })}>
        Update payment method
      </Button>
    </div>
  )
}
