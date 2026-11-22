import { CircleAlert, TriangleAlert } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useBilling } from '../../state/billing'
import { usePlanActions } from './actions'
import { bannerView } from './view'

/**
 * The sticky banner, across the whole portal. Only two states earn one, because
 * only two need the customer to act now: a failed payment (rank 1) and Flex
 * credits running low (rank 2). One shows at a time. Everything that only
 * informs ("Ends on", a scheduled switch) stays in the strip and the Notice box.
 */
export function StickyBanner() {
  const { state } = useBilling()
  const run = usePlanActions()
  const view = bannerView(state)
  if (!view) return null

  if (view.kind === 'payment-failed')
    return (
      <div className="pb-banner pb-banner--negative" role="alert">
        <TriangleAlert size={16} aria-hidden />
        <p>Your payment failed. Update your payment method by {view.due} to keep your plan.</p>
        <Button size="sm" onClick={() => run('update-payment')}>
          Update payment method
        </Button>
      </div>
    )

  return (
    <div className="pb-banner" role="status">
      <CircleAlert size={16} aria-hidden />
      <p>{view.empty ? 'You are out of credits.' : 'Your credits are running low.'}</p>
      <Button size="sm" onClick={() => run(view.topUpUsed ? 'change-plan' : 'top-up')}>
        {view.topUpUsed ? 'Change plan' : 'Top up'}
      </Button>
    </div>
  )
}
