import { useCallback } from 'react'
import { PLANS, TOP_UP, formatCount } from '../../data/plans'
import { useBilling, type PaidPlanId } from '../../state/billing'
import { useUi } from '../../state/ui'
import { useOrder } from '../checkout/order'

/**
 * Payment hand-offs. Each builds an order and sends the customer to the
 * checkout step (Stripe Checkout in production; a simulated page in the
 * prototype). The billing change is applied only after payment succeeds.
 */
export function useCheckout() {
  const { state } = useBilling()
  const { navigate, route } = useUi()
  const { setOrder } = useOrder()

  const planOrder = useCallback(
    (kind: 'upgrade' | 'subscribe', planId: PaidPlanId) => {
      const plan = PLANS[planId]
      const carry = kind === 'upgrade' ? state.creditsRemaining : 0
      const credits = (plan.credits ?? 0) + carry
      setOrder({
        kind,
        planId,
        item: plan.name,
        detail: [
          `${formatCount(credits)} credits${carry ? ` (incl. ${formatCount(carry)} carried over)` : ''}`,
          plan.cycle ? `renews ${plan.cycle === 'year' ? 'yearly' : 'monthly'}` : 'one-time payment',
        ].join(' · '),
        amount: plan.price ?? 0,
        returnTo: route,
      })
      navigate('checkout')
    },
    [navigate, route, setOrder, state.creditsRemaining],
  )

  const upgrade = useCallback((planId: PaidPlanId) => planOrder('upgrade', planId), [planOrder])
  const subscribe = useCallback((planId: PaidPlanId) => planOrder('subscribe', planId), [planOrder])

  const topUp = useCallback(() => {
    const pack = TOP_UP[state.planId]
    setOrder({
      kind: 'top-up',
      item: `${PLANS[state.planId].tier} top-up`,
      detail: `${formatCount(pack.credits)} credits · ${
        pack.once ? 'one-time, never expire' : 'expire at the end of your billing cycle'
      }`,
      amount: pack.price,
      returnTo: route,
    })
    navigate('checkout')
  }, [navigate, route, setOrder, state.planId])

  return { upgrade, subscribe, topUp }
}
