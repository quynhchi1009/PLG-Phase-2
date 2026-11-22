import { useCallback } from 'react'
import { TODAY, useBilling } from '../../state/billing'
import { useUi } from '../../state/ui'
import { useCheckout } from '../upgrade/checkout'
import { usePlanFlow } from './flow'
import type { PlanAction } from './view'

/**
 * One place that knows what each strip, banner or module action does, so the
 * same label always leads to the same thing wherever the customer meets it.
 */
export function usePlanActions() {
  const { dispatch } = useBilling()
  const { toast } = useUi()
  const flow = usePlanFlow()
  const { recoverPayment } = useCheckout()

  return useCallback(
    (kind: PlanAction) => {
      switch (kind) {
        case 'top-up':
          return flow.openTopUp()
        case 'change-plan':
        case 'choose-plan':
          return flow.openChangePlan()
        case 'keep-yearly':
          dispatch({ type: 'cancel-downgrade', today: TODAY })
          toast('You keep yearly billing. The switch to monthly is cancelled.')
          return
        case 'reactivate':
          // Nothing is charged: the plan renews on the date it would have ended.
          dispatch({ type: 'reactivate', today: TODAY })
          return
        case 'update-payment':
          return recoverPayment()
      }
    },
    [dispatch, toast, flow, recoverPayment],
  )
}
