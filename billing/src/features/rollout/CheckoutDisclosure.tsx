import { Info } from 'lucide-react'
import { PLANS, formatPrice } from '../../data/plans'
import { formatDate } from '../../data/history'
import type { PaidPlanId } from '../../state/billing'
import { ROLLOUT_ON, useRollout } from '../../state/rollout'

/**
 * From T-30 until rollout, buying or upgrading to a Growth plan says what is about to change (PRD 5.2,
 * "Checkout disclosure"). It sits on the confirmation step of both flows, the last screen the portal owns:
 * the payment itself is Stripe's page. It names the price of the plan being bought.
 */
export function CheckoutDisclosure({ planId }: { planId: PaidPlanId }) {
  const { phase } = useRollout()
  if (phase !== 'pre' || planId === 'flex') return null
  return (
    <p className="rollout-note">
      <Info size={16} aria-hidden />
      <span>
        On {formatDate(ROLLOUT_ON)}, Growth plans will move from manual top-ups to auto top up. If you run out of
        credits, your plan will renew early at {formatPrice(PLANS[planId].price ?? 0)} and your billing date will
        reset.
      </span>
    </p>
  )
}
