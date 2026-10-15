import { useEffect, useId, useState } from 'react'
import { ArrowLeft, CreditCard, FlaskConical, Lock } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { SuccessMark } from '../../components/ui/SuccessMark'
import { formatAmount } from '../../data/plans'
import { TODAY, useBilling } from '../../state/billing'
import { useUi } from '../../state/ui'
import { useOrder } from './order'

type Phase = 'redirect' | 'form' | 'processing' | 'success'

const WAIT = { redirect: 900, processing: 1400, success: 1100 }

/**
 * Stand-in for the hosted Stripe Checkout page. Simulated: no card details are
 * collected and nothing is charged. It exists so the flow shows the hand-off
 * the real product makes between "Confirm and pay" and the Billing page.
 */
export function CheckoutPage() {
  const { order, setOrder } = useOrder()
  const { dispatch } = useBilling()
  const { navigate, toast } = useUi()
  const [phase, setPhase] = useState<Phase>('redirect')
  const titleId = useId()

  useEffect(() => {
    if (!order) return
    if (phase === 'redirect') {
      const t = window.setTimeout(() => setPhase('form'), WAIT.redirect)
      return () => window.clearTimeout(t)
    }
    if (phase === 'processing') {
      const t = window.setTimeout(() => setPhase('success'), WAIT.processing)
      return () => window.clearTimeout(t)
    }
    if (phase === 'success') {
      const t = window.setTimeout(() => {
        // Payment confirmed: apply it, then return to Billing where the success dialog opens.
        if (order.kind === 'top-up') dispatch({ type: 'top-up', today: TODAY })
        else if (order.planId) dispatch({ type: order.kind, planId: order.planId, today: TODAY })
        navigate('billing')
      }, WAIT.success)
      return () => window.clearTimeout(t)
    }
  }, [phase, order, dispatch, navigate])

  const cancel = () => {
    const back = order?.returnTo ?? 'billing'
    setOrder(null)
    navigate(back === 'checkout' ? 'billing' : back)
    toast('Payment cancelled. You have not been charged.')
  }

  if (!order)
    return (
      <div className="checkout checkout--empty">
        <p>There's nothing to pay for right now.</p>
        <Button variant="secondary" onClick={() => navigate('billing')}>
          Back to Billing
        </Button>
      </div>
    )

  if (phase === 'redirect' || phase === 'processing' || phase === 'success')
    return (
      <div className="checkout checkout--status" role="status" aria-live="polite">
        {phase === 'success' ? (
          <SuccessMark />
        ) : (
          <span className="checkout__spinner" aria-hidden />
        )}
        <p className="checkout__status-title">
          {phase === 'redirect'
            ? 'Redirecting to secure checkout…'
            : phase === 'processing'
              ? 'Processing payment…'
              : 'Payment successful'}
        </p>
        <p className="checkout__status-text">
          {phase === 'redirect'
            ? 'You’ll complete your payment with Stripe.'
            : phase === 'processing'
              ? 'Please don’t close this page.'
              : 'Returning you to AsiaVerify…'}
        </p>
        <SimNote />
      </div>
    )

  return (
    <div className="checkout">
      <section className="checkout__summary" aria-labelledby={titleId}>
        <button type="button" className="checkout__back" onClick={cancel}>
          <ArrowLeft size={16} aria-hidden /> Back to AsiaVerify
        </button>
        <p className="checkout__merchant">
          <img src="/favicon.png" alt="" width={24} height={24} />
          AsiaVerify
        </p>
        <h1 id={titleId} className="checkout__label">
          Pay AsiaVerify
        </h1>
        <p className="checkout__total">{formatAmount(order.amount)}</p>
        <dl className="checkout__lines">
          <div>
            <dt>
              {order.item}
              <span>{order.detail}</span>
            </dt>
            <dd>{formatAmount(order.amount)}</dd>
          </div>
          <div className="checkout__subtotal">
            <dt>Subtotal</dt>
            <dd>{formatAmount(order.amount)}</dd>
          </div>
          <div className="checkout__grand">
            <dt>Total due today</dt>
            <dd>{formatAmount(order.amount)}</dd>
          </div>
        </dl>
      </section>

      <section className="checkout__pay" aria-label="Payment">
        <SimNote />
        <h2 className="checkout__pay-title">Pay with card</h2>
        <div className="checkout__field">
          <span className="checkout__field-label">Email</span>
          <span className="checkout__field-value">billing@your-company.example</span>
        </div>
        <div className="checkout__field">
          <span className="checkout__field-label">Card information</span>
          <span className="checkout__field-value checkout__card">
            <CreditCard size={18} aria-hidden />
            Test card ending 4242 · 12/34
          </span>
        </div>
        <div className="checkout__field">
          <span className="checkout__field-label">Cardholder name</span>
          <span className="checkout__field-value">Prototype Customer</span>
        </div>
        <Button block onClick={() => setPhase('processing')} icon={<Lock size={16} aria-hidden />}>
          Pay {formatAmount(order.amount)}
        </Button>
        <p className="checkout__fine">
          By paying, you agree to AsiaVerify's terms. Payments are processed by Stripe; AsiaVerify doesn't store your
          card details.
        </p>
      </section>
    </div>
  )
}

function SimNote() {
  return (
    <p className="checkout__sim">
      <FlaskConical size={14} aria-hidden />
      Simulated Stripe checkout for this prototype. No payment is taken.
    </p>
  )
}
