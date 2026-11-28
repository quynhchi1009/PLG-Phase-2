import { useId } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { FailedMark } from '../../components/ui/FailedMark'
import { PaymentFacts } from '../../components/ui/PaymentProgress'
import { PLANS, TOP_UP, formatCount, formatPrice } from '../../data/plans'
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
  kind,
  onClose,
}: {
  open: boolean
  /** 'renewal': "Renew current plan" was declined while a switch to monthly is scheduled (PRD 2.7). 'top-up': an
   *  Auto top up charge was declined, or a later report above the balance while that failed state is set. */
  kind: 'top-up' | 'renewal'
  onClose: () => void
}) {
  const headingId = useId()
  const descId = useId()
  const { state } = useBilling()
  const payOnStripe = usePayOnStripe()
  const renewal = kind === 'renewal'
  // With Auto top up off the declined charge was "Enable Auto top up" at the report gate (Scenario 3): it stays off
  // (PRD 2.5 #2), so the pop-up says so. With it on, Auto top up charged by itself (Scenario 7).
  const enableAttempt = !renewal && !state.autoTopUp
  const plan = PLANS[state.planId]
  const pack = TOP_UP[state.planId]

  return (
    <Dialog open={open} onClose={onClose} labelledBy={headingId} describedBy={descId} size="sm">
      {open && (
        // The same build as "Not enough credits for this report" (AutoTopUpGate), which opens at the same moment
        // in this flow: title, lede, the shared payment facts, the primary action, then "Not now". The red mark
        // above the title is the one addition, so a failed payment reads as one at a glance.
        <div className="dialog__body success">
          <FailedMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
            {renewal ? 'Renewal payment failed' : 'Payment failed'}
          </h2>
          {/* A declined Auto top up never cancels the plan (PRD 3.2): it stays active with its credits until the
              next billing date. All the customer needs is the credits, so updating the payment details tops them
              up. Only the renewal variant (a switch to monthly scheduled, "Renew current plan") renews the plan. */}
          {enableAttempt ? (
            // Scenario 3, "Enable Auto top up" at the report gate was declined (PRD 2.5 #2): what failed and what it
            // left as it was (Auto top up off, no report, plan active), then the way back. Growth has no manual
            // top-up, so the fix is the same step again once the card works, not a "Top up" offer.
            // Two paragraphs: what happened (and what didn't change), then the way back.
            <div id={descId} className="dialog__lede dialog__lede--left dialog__lede--paras">
              <p>
                We couldn&apos;t take the {formatPrice(pack.price)} payment, so Auto top up wasn&apos;t turned on and
                this report wasn&apos;t generated. Your plan remains active.
              </p>
              <p>Update your payment details, then generate the report again.</p>
            </div>
          ) : renewal ? (
            <p id={descId} className="dialog__lede dialog__lede--left">
              We couldn&apos;t process your payment, so your plan wasn&apos;t renewed and this report wasn&apos;t
              generated. Your plan remains active, and you can continue using your remaining credits. Update your
              payment details to renew your current plan.
            </p>
          ) : (
            // Scenario 7, Auto top up on charged by itself and was declined (Figma S7, 16033:52588): the same two
            // paragraphs as Scenario 3. Auto top up stays on, so the next report above the balance tries again.
            <div id={descId} className="dialog__lede dialog__lede--left dialog__lede--paras">
              <p>
                We couldn&apos;t process your payment, so this report wasn&apos;t generated. Your plan remains active,
                and you can continue using your remaining credits.
              </p>
              <p>Update your payment details, then generate the report again.</p>
            </div>
          )}
          {/* The balance that still works, the next billing date, and the Auto top up setting after the decline
              (off when the decline was "Enable Auto top up", on when it charged by itself), or for the renewal
              variant the plan at its full price. */}
          <PaymentFacts
            facts={[
              { label: 'Credits remaining', value: formatCount(state.creditsRemaining) },
              { label: 'Next billing date', value: formatDate(state.cycleEnd) },
              renewal
                ? { label: 'Current plan renews for', value: formatPrice(plan.price ?? 0) }
                : { label: 'Auto top up', value: enableAttempt ? 'Off' : 'On' },
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
