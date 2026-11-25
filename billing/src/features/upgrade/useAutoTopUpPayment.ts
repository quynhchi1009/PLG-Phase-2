import { useCallback, useEffect, useRef, useState } from 'react'
import { paymentOutcome, simulateWait } from '../../state/paymentSim'
import { useTakingLonger } from '../../components/ui/useTakingLonger'

/**
 * Auto top up charges the payment method already on file (Stripe in production), so
 * there is no checkout page: the customer waits a moment, then the result lands.
 * `paying` is true while the charge is in flight and `longer` once it has taken more than a few
 * seconds, so the screen can say so. Closing the dialog mid-payment unmounts the caller and cancels
 * the simulated charge.
 *
 * The charge can fail (PRD 3.2). `onFailed` then runs instead of `onPaid`; nothing has been charged,
 * so the caller closes its dialog and shows the "Payment failed" pop-up. A caller that passes no
 * `onFailed` (the My Plan turn-on at 0 credits, still an open question) always succeeds.
 */
export function useAutoTopUpPayment(onPaid: () => void, onFailed?: () => void) {
  const [paying, setPaying] = useState(false)
  const cancel = useRef<(() => void) | undefined>(undefined)
  const busy = useRef(false)
  const paid = useRef(onPaid)
  const failed = useRef(onFailed)
  const longer = useTakingLonger(paying)

  useEffect(() => {
    paid.current = onPaid
    failed.current = onFailed
  })

  // Unmounting cancels a charge in flight. It also clears `busy`, so a remount (React
  // StrictMode runs effects twice in development) can start the charge again.
  useEffect(
    () => () => {
      cancel.current?.()
      busy.current = false
    },
    [],
  )

  const pay = useCallback(() => {
    if (busy.current) return
    busy.current = true
    setPaying(true)
    cancel.current = simulateWait(() => {
      busy.current = false
      setPaying(false)
      if (paymentOutcome() === 'fail' && failed.current) failed.current()
      else paid.current()
    })
  }, [])

  return { paying, longer, pay }
}
