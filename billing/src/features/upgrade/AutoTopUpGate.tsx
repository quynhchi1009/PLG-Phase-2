import { useEffect, useId, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Check } from 'lucide-react'
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
  onFailed,
  needed,
  request,
}: {
  open: boolean
  onClose: () => void
  /** The charge was declined (PRD 3.2): the report page shows the "Payment failed" pop-up. Auto top up stays off. */
  onFailed: () => void
  /** Credits the chosen report costs. */
  needed: number
  /** The report being generated: "Continue with your report" in the success dialog generates it. */
  request?: ReportRequest
}) {
  const headingId = useId()
  const descId = useId()
  const { state, dispatch } = useBilling()
  const { paying, longer, pay } = useAutoTopUpPayment(
    () => {
      // The success dialog takes over from here, and it also opens on this page.
      onClose()
      dispatch({ type: 'charge-auto-top-up', today: TODAY, report: request })
    },
    () => {
      onClose()
      onFailed()
    },
  )

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
              {paying ? 'Processing…' : 'Enable Auto top up'}
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
  onFailed,
  needed,
  request,
}: {
  open: boolean
  onClose: () => void
  /** The charge was declined (PRD 3.2): the report page shows the "Payment failed" pop-up. */
  onFailed: () => void
  /** Credits the chosen report costs. */
  needed: number
  /** The report being generated: "Continue with your report" in the success dialog generates it. */
  request?: ReportRequest
}) {
  const headingId = useId()
  const descId = useId()
  return (
    // Not dismissible: closing mid-charge would leave the customer unsure what happened.
    <Dialog open={open} onClose={() => {}} labelledBy={headingId} describedBy={descId} size="sm" hideClose>
      {open && (
        <Renewing
          headingId={headingId}
          descId={descId}
          onDone={onClose}
          onFailed={onFailed}
          needed={needed}
          request={request}
        />
      )}
    </Dialog>
  )
}

function Renewing({
  headingId,
  descId,
  onDone,
  onFailed,
  needed,
  request,
}: {
  headingId: string
  descId: string
  onDone: () => void
  onFailed: () => void
  needed: number
  request?: ReportRequest
}) {
  const { state, dispatch } = useBilling()
  const { longer, pay } = useAutoTopUpPayment(
    () => {
      onDone()
      dispatch({ type: 'charge-auto-top-up', today: TODAY, report: request })
    },
    () => {
      onDone()
      onFailed()
    },
  )
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

/**
 * Version A, Growth yearly with a switch to monthly scheduled (27 Nov 2026): Auto top up is off while the
 * switch is scheduled, because a top-up renews the yearly plan. So a report that needs more credits than
 * are left asks first, in two steps inside one dialog:
 *
 * 1. "Not enough credits for this report": why Auto top up isn't helping, then "Renew current plan" or
 *    "Keep scheduled downgrade" (closes, nothing changes, the same prompt comes back next time).
 * 2. "Renew Growth yearly now?": what renewing means (the charge, the credits, Auto top up turns on, the switch
 *    is cancelled, the new billing date) before anything is charged, in the same box as "Don't miss out on your
 *    plan benefits". Paying works like every other Auto top up charge: the button spins, the X goes, the note
 *    asks the customer to stay. Success hands over
 *    to "Growth yearly renewed" (SuccessDialog); a declined card shows the Payment failed pop-up and the
 *    switch stays scheduled.
 */
export function RenewPlanGate({
  open,
  onClose,
  onFailed,
  needed,
  request,
}: {
  open: boolean
  onClose: () => void
  /** The charge was declined (PRD 3.2): the report page shows the "Payment failed" pop-up. Nothing else changes. */
  onFailed: () => void
  /** Credits the chosen report costs. */
  needed: number
  /** The report being generated: "Continue with your report" in the success dialog generates it. */
  request?: ReportRequest
}) {
  const headingId = useId()
  const descId = useId()
  const [step, setStep] = useState<'ask' | 'confirm'>('ask')
  const [paying, setPaying] = useState(false)
  // Every new "Generate report" starts from the first step.
  useEffect(() => {
    if (!open) setStep('ask')
  }, [open])

  return (
    <Dialog
      open={open}
      onClose={paying ? () => {} : onClose}
      labelledBy={headingId}
      describedBy={descId}
      // The confirmation carries a box of changes, so it takes the wider size of the other plan pop-ups.
      size={step === 'confirm' ? 'md' : 'sm'}
      stepKey={step}
      hideClose={paying}
    >
      {open && step === 'ask' && (
        <RenewAsk headingId={headingId} descId={descId} needed={needed} onRenew={() => setStep('confirm')} onKeep={onClose} />
      )}
      {open && step === 'confirm' && (
        <RenewConfirm
          headingId={headingId}
          descId={descId}
          onPaying={setPaying}
          onPaid={onClose}
          onFailed={() => {
            onClose()
            onFailed()
          }}
          request={request}
        />
      )}
    </Dialog>
  )
}

function RenewAsk({
  headingId,
  descId,
  needed,
  onRenew,
  onKeep,
}: {
  headingId: string
  descId: string
  needed: number
  onRenew: () => void
  onKeep: () => void
}) {
  const { state } = useBilling()
  return (
    <div className="dialog__body success">
      <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
        Not enough credits for this report
      </h2>
      <p id={descId} className="dialog__lede dialog__lede--left">
        You need {formatCount(needed - state.creditsRemaining)} more credits for this report. Auto top up is off because
        your plan switches to Growth monthly on {keepTogether(formatDate(state.cycleEnd))}. Renewing your current plan
        cancels the switch and turns Auto top up on.
      </p>
      <div className="dialog__pair dialog__pair--stack">
        <Button data-autofocus block onClick={onRenew}>
          Renew current plan
        </Button>
        <Button block variant="secondary" onClick={onKeep}>
          Keep scheduled downgrade
        </Button>
      </div>
    </div>
  )
}

function RenewConfirm({
  headingId,
  descId,
  onPaying,
  onPaid,
  onFailed,
  request,
}: {
  headingId: string
  descId: string
  /** Tells the dialog a charge is in flight, so it can refuse to close. */
  onPaying: (paying: boolean) => void
  onPaid: () => void
  onFailed: () => void
  request?: ReportRequest
}) {
  const { state, dispatch } = useBilling()
  const pack = TOP_UP[state.planId]
  const { paying, longer, pay } = useAutoTopUpPayment(
    () => {
      // The success dialog ("Growth yearly renewed") takes over, on this page.
      onPaid()
      dispatch({ type: 'charge-auto-top-up', today: TODAY, report: request })
    },
    onFailed,
  )
  useEffect(() => {
    onPaying(paying)
    return () => onPaying(false)
  }, [paying, onPaying])

  // Built like "Don't miss out on your plan benefits": what changes sits in one light box, key phrase first,
  // with the one action inside it. The dialog's X is the way out (nothing changes, the switch stays scheduled).
  const changes = [
    { key: `${formatCount(pack.credits)} credits added`, rest: `to your ${formatCount(state.creditsRemaining)} remaining credits` },
    { key: 'Auto top up turns on,', rest: `adding ${formatCount(pack.credits)} credits whenever you run out` },
    { key: 'Your switch to Growth monthly is cancelled;', rest: 'you stay on Growth yearly' },
    { key: 'Next billing date', rest: `moves to ${formatDate(earlyRenewalDate(state.planId, TODAY))}` },
  ]

  return (
    <div className="dialog__body success" aria-busy={paying}>
      <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
        Renew Growth yearly now?
      </h2>
      <p id={descId} className="dialog__lede dialog__lede--left">
        We&apos;ll charge {formatPrice(pack.price)} to your card today and start a new yearly billing period.
      </p>
      <section className="perk-box perk-box--panel" aria-label="What renewing changes">
        <p className="perk-box__title">Renewing your current plan means:</p>
        <ul className="upc__perks">
          {changes.map((c) => (
            <li key={c.key}>
              <span className="upc__tick" aria-hidden>
                <Check size={12} strokeWidth={3} />
              </span>
              <span>
                <strong>{c.key}</strong> {c.rest}
              </span>
            </li>
          ))}
        </ul>
        <div className="perk-box__action">
          <Button data-autofocus block loading={paying} onClick={pay}>
            {paying ? 'Processing…' : 'Renew your current plan'}
          </Button>
          <PaymentNote busy={paying} longer={longer} />
        </div>
      </section>
    </div>
  )
}

/** Keeps a date on one line when the sentence around it wraps. */
const keepTogether = (date: string) => date.replace(/ /g, '\u00a0')
