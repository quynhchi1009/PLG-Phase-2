import type { ReactNode } from 'react'
import { FlaskConical, Lock } from 'lucide-react'
import { usePaymentSim } from '../../state/paymentSim'

export function Spinner({ className }: { className?: string }) {
  return <span className={['spinner', className].filter(Boolean).join(' ')} aria-hidden />
}

const LONGER = 'This is taking longer than usual. Please keep this window open. We’ll confirm as soon as Stripe responds.'

/**
 * The line that goes with a payment button. At rest it says who processes the payment; while the payment
 * is going through it says what is happening and asks the customer to stay (it is a live region, so
 * screen readers hear the change); past a few seconds it says the wait is longer than usual.
 * It occupies the same slot in every state, so nothing shifts when the payment starts.
 */
export function PaymentNote({
  busy,
  longer = false,
  busyText = 'Please keep this window open.',
  className,
}: {
  busy: boolean
  longer?: boolean
  /** What is happening, in place of "processing your payment" (for example the hand-off to Stripe). */
  busyText?: string
  className?: string
}) {
  const { speed, finish } = usePaymentSim()
  return (
    <>
      <p className={['pay-note', busy && 'is-busy', className].filter(Boolean).join(' ')} role="status">
        <Lock size={14} aria-hidden />
        <span>{busy ? (longer ? LONGER : busyText) : 'Secured by Stripe'}</span>
      </p>
      {/* Prototype only, and only when "Hold" is picked in the prototype panel. It sits here because an
          open dialog blocks the panel, so this is the one place the held payment can be released from. */}
      {busy && speed === 'hold' && (
        <button type="button" className="pay-release" onClick={finish}>
          <FlaskConical size={14} aria-hidden />
          Prototype: finish payment
        </button>
      )}
    </>
  )
}

/**
 * A payment with no button to carry it (Auto top up charging by itself, the page between Stripe and the
 * Portal): a spinner, what is happening, the figures being charged, and the same note as the buttons.
 * `aria-busy` marks the region as still changing; the note announces it.
 */
export function PaymentStatus({
  title,
  headingId,
  descId,
  facts,
  longer,
  children,
  mark,
  busyText,
  className,
}: {
  title: string
  headingId?: string
  descId?: string
  /** What is being paid for, as label and value pairs. */
  facts?: { label: string; value: string }[]
  longer?: boolean
  /** One sentence on why the payment is happening. */
  children: ReactNode
  /** Replaces the spinner (the success mark, once the payment went through). */
  mark?: ReactNode
  busyText?: string
  className?: string
}) {
  return (
    <div className={['pay-status', className].filter(Boolean).join(' ')} aria-busy={!mark}>
      {mark ?? <Spinner />}
      <h2 id={headingId} tabIndex={-1} className="pay-status__title">
        {title}
      </h2>
      <p id={descId} className="pay-status__text">
        {children}
      </p>
      {facts && <PaymentFacts facts={facts} />}
      <PaymentNote busy={!mark} longer={longer} busyText={busyText} />
    </div>
  )
}

/**
 * What a payment is for, as label and value rows (Charged to your card, Credits added, Next billing
 * date). The same rows sit in the status dialog while an Auto top up goes through and in the prompt that
 * asks for it, so the figures read the same before and during the charge.
 */
export function PaymentFacts({ facts }: { facts: { label: string; value: string }[] }) {
  return (
    <dl className="pay-status__facts">
      {facts.map((f) => (
        <div key={f.label}>
          <dt>{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}
