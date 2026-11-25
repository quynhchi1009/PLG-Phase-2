import { useEffect, useId } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { PaymentFacts, PaymentNote, PaymentStatus } from '../../components/ui/PaymentProgress'
import { TOP_UP, formatCount, formatPrice } from '../../data/plans'
import { formatDate } from '../../data/history'
import { TODAY, earlyRenewalDate, useBilling, type PaidPlanId, type ReportRequest } from '../../state/billing'
import { useAutoTopUpPayment } from './useAutoTopUpPayment'

/* Auto top up renews the subscription early and adds credits immediately: the pack is
   paid for now, the new billing period starts today and the next billing date moves. */

/** The three figures of an Auto top up charge, shown in the prompt and again while the charge goes through. */
function autoTopUpFacts(planId: PaidPlanId) {
  const pack = TOP_UP[planId]
  return [
    { label: 'Charged to your card', value: formatPrice(pack.price) },
    { label: 'Credits added', value: formatCount(pack.credits) },
    { label: 'Next billing date', value: formatDate(earlyRenewalDate(planId, TODAY)) },
  ]
}

/**
 * Version A, Growth with Auto top up off: shown when a report needs more credits than
 * the customer has. The only way to keep going before the plan resets is to turn Auto
 * top up on, which renews the plan early. Closing it changes nothing, so the same
 * prompt returns on the next "Generate report".
 *
 * While the charge goes through the dialog stays as it is: the button becomes a spinner, "Not now"
 * and the X wait, and the note under the buttons asks the customer to stay.
 */
export function AutoTopUpGate({
  open,
  onClose,
  needed,
  request,
}: {
  open: boolean
  onClose: () => void
  /** Credits the chosen report costs. */
  needed: number
  /** The report being generated: "Continue with report" in the success dialog generates it. */
  request?: ReportRequest
}) {
  const headingId = useId()
  const descId = useId()
  const { state, dispatch } = useBilling()
  const pack = TOP_UP[state.planId]
  const { paying, longer, pay } = useAutoTopUpPayment(() => {
    // The success dialog takes over from here, and it also opens on this page.
    onClose()
    dispatch({ type: 'charge-auto-top-up', today: TODAY, report: request })
  })

  return (
    <Dialog
      open={open}
      onClose={paying ? () => {} : onClose}
      labelledBy={headingId}
      describedBy={descId}
      size="sm"
      hideClose={paying}
    >
      {open && (
        <div className="dialog__body success" aria-busy={paying}>
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
            Not enough credits for this report
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left">
            This report needs {formatCount(needed)} credits and you have {formatCount(state.creditsRemaining)}. Turn on
            Auto top up to add more.
          </p>
          <PaymentFacts facts={autoTopUpFacts(state.planId)} />
          <div className="dialog__actions dialog__actions--stack">
            <Button data-autofocus block loading={paying} onClick={pay}>
              {paying ? 'Processing…' : `Enable and pay ${formatPrice(pack.price)}`}
            </Button>
            <Button variant="link" aria-disabled={paying} onClick={paying ? undefined : onClose}>
              Not now
            </Button>
          </div>
          <PaymentNote busy={paying} longer={longer} />
        </div>
      )}
    </Dialog>
  )
}

/**
 * Version A, Growth with Auto top up on: a report needs more credits than the customer
 * has, so Auto top up does its job. There is nothing to decide: the dialog says what is
 * happening while the charge goes through, then hands over to the success dialog, and
 * the customer carries on with the same report.
 */
export function AutoTopUpRenewal({
  open,
  onClose,
  needed,
  request,
}: {
  open: boolean
  onClose: () => void
  /** Credits the chosen report costs. */
  needed: number
  /** The report being generated: "Continue with report" in the success dialog generates it. */
  request?: ReportRequest
}) {
  const headingId = useId()
  const descId = useId()
  return (
    // Not dismissible: closing mid-charge would leave the customer unsure what happened.
    <Dialog open={open} onClose={() => {}} labelledBy={headingId} describedBy={descId} size="sm" hideClose>
      {open && <Renewing headingId={headingId} descId={descId} onDone={onClose} needed={needed} request={request} />}
    </Dialog>
  )
}

function Renewing({
  headingId,
  descId,
  onDone,
  needed,
  request,
}: {
  headingId: string
  descId: string
  onDone: () => void
  needed: number
  request?: ReportRequest
}) {
  const { state, dispatch } = useBilling()
  const { longer, pay } = useAutoTopUpPayment(() => {
    onDone()
    dispatch({ type: 'charge-auto-top-up', today: TODAY, report: request })
  })
  // The charge starts as soon as the dialog opens.
  useEffect(() => {
    pay()
  }, [pay])

  return (
    <PaymentStatus
      className="dialog__body"
      title="Adding credits to your plan"
      headingId={headingId}
      descId={descId}
      longer={longer}
      facts={autoTopUpFacts(state.planId)}
    >
      This report needs {formatCount(needed)} credits and you have {formatCount(state.creditsRemaining)}. Auto top up is
      adding more.
    </PaymentStatus>
  )
}
