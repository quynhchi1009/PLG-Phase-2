import { useEffect, useId } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { TOP_UP, formatCount, formatPrice } from '../../data/plans'
import { formatDate } from '../../data/history'
import { TODAY, earlyRenewalDate, useBilling } from '../../state/billing'
import { useAutoTopUpPayment } from './useAutoTopUpPayment'

/* Auto top up renews the subscription early and adds credits immediately: the pack is
   paid for now, the new billing period starts today and the next billing date moves. */

/**
 * Version A, Growth with Auto top up off: shown when a report needs more credits than
 * the customer has. The only way to keep going before the plan resets is to turn Auto
 * top up on, which renews the plan early. Closing it changes nothing, so the same
 * prompt returns on the next "Generate report".
 */
export function AutoTopUpGate({
  open,
  onClose,
  needed,
}: {
  open: boolean
  onClose: () => void
  /** Credits the chosen report costs. */
  needed: number
}) {
  const headingId = useId()
  const descId = useId()
  const { state, dispatch } = useBilling()
  const pack = TOP_UP[state.planId]
  const { paying, pay } = useAutoTopUpPayment(() => {
    // The success dialog takes over from here, and it also opens on this page.
    onClose()
    dispatch({ type: 'charge-auto-top-up', today: TODAY })
  })

  return (
    <Dialog open={open} onClose={paying ? () => {} : onClose} labelledBy={headingId} describedBy={descId} size="sm">
      {open && (
        <div className="dialog__body success" aria-busy={paying}>
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
            Not enough credits for this report
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left">
            This report needs {formatCount(needed)} credits and you have {formatCount(state.creditsRemaining)}. Auto top
            up is off, so turn it on to renew your plan early: we'll charge {formatPrice(pack.price)}, add{' '}
            {formatCount(pack.credits)} credits and move your next billing date to{' '}
            {formatDate(earlyRenewalDate(state.planId, TODAY))}. Or wait until {formatDate(state.cycleEnd)}, when your
            credits reset.
          </p>
          <div className="dialog__actions dialog__actions--stack">
            <Button data-autofocus block aria-disabled={paying} onClick={pay}>
              {paying ? 'Processing payment…' : `Enable Auto top up and pay ${formatPrice(pack.price)}`}
            </Button>
            <Button variant="link" aria-disabled={paying} onClick={paying ? undefined : onClose}>
              Not now
            </Button>
          </div>
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
export function AutoTopUpRenewal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const headingId = useId()
  const descId = useId()
  return (
    // Not dismissible: closing mid-charge would leave the customer unsure what happened.
    <Dialog open={open} onClose={() => {}} labelledBy={headingId} describedBy={descId} size="sm">
      {open && <Renewing headingId={headingId} descId={descId} onDone={onClose} />}
    </Dialog>
  )
}

function Renewing({ headingId, descId, onDone }: { headingId: string; descId: string; onDone: () => void }) {
  const { state, dispatch } = useBilling()
  const pack = TOP_UP[state.planId]
  const { pay } = useAutoTopUpPayment(() => {
    onDone()
    dispatch({ type: 'charge-auto-top-up', today: TODAY })
  })
  // The charge starts as soon as the dialog opens.
  useEffect(() => {
    pay()
  }, [pay])

  return (
    <div className="dialog__body success topped" role="status" aria-busy>
      <span className="checkout__spinner" aria-hidden />
      <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
        Adding credits with Auto top up
      </h2>
      <p id={descId} className="dialog__lede dialog__lede--left">
        You don't have enough credits for this report, so we're renewing your plan early: charging{' '}
        {formatPrice(pack.price)}, adding {formatCount(pack.credits)} credits and moving your next billing date to{' '}
        {formatDate(earlyRenewalDate(state.planId, TODAY))}.
      </p>
    </div>
  )
}
