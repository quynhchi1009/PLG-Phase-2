import { useUi } from '../../state/ui'

/**
 * "Pay on Stripe" after a failed Auto top up charge (PRD 3.2 #2 and #5): the "Payment failed" pop-up on the
 * report page and the banner on My Plan both start the same payment. Stripe checkout for the current plan
 * at its full price is not built yet (PRD 3.2 #3), so for now it only says so. The failed state stays until
 * that payment clears it, so the pop-up and the banner keep showing.
 */
export function usePayOnStripe() {
  const { toast } = useUi()
  return () => toast("Paying on Stripe isn't connected in this prototype.")
}
