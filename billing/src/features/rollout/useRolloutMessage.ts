import { PLANS, formatCount, formatPrice } from '../../data/plans'
import { formatDate } from '../../data/history'
import { useBilling } from '../../state/billing'
import { ROLLOUT_ON, useRollout } from '../../state/rollout'

/**
 * What the rollout messaging (PRD 5.2) says to the account in front of us, or `null` when it says nothing.
 * It is for Growth monthly and yearly only, while the plan is active: Flex keeps its one top-up, and a plan
 * that is cancelled or lapsed has no Auto top up to announce. Plan name and price are the account's own.
 *
 * The copy here is a stand-in; Figma has the final wording. One sentence of the PRD's pop-up A is left out on
 * purpose: "If the charge fails, your subscription will be cancelled straight away" says the opposite of
 * sections 2.1 and 3.2 (question C1 in the conflicts doc is still open).
 */
export function useRolloutMessage() {
  const { state } = useBilling()
  const rollout = useRollout()
  if (rollout.phase === 'off' || state.status !== 'active' || state.planId === 'flex') return null
  const plan = PLANS[state.planId]
  return {
    ...rollout,
    // "Growth monthly" / "Growth yearly", as the rest of My Plan names it ("Your plan changes to Growth monthly").
    planName: `${plan.tier} ${plan.cycle === 'year' ? 'yearly' : 'monthly'}`,
    price: formatPrice(plan.price ?? 0),
    // What one auto top up adds: the plan's own allowance (267 on monthly, 3,047 on yearly).
    credits: formatCount(plan.credits ?? 0),
    rolloutDate: formatDate(ROLLOUT_ON),
  }
}
