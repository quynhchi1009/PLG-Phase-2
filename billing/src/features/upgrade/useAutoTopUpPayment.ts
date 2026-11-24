import { useCallback, useEffect, useRef, useState } from 'react'
import { simulateWait } from '../../state/paymentSim'
import { useTakingLonger } from '../../components/ui/useTakingLonger'

/**
 * Auto top up charges the payment method already on file (Stripe in production), so
 * there is no checkout page: the customer waits a moment, then the result lands.
 * `paying` is true while the charge is in flight and `longer` once it has taken more than a few
 * seconds, so the screen can say so. Closing the dialog mid-payment unmounts the caller and cancels
 * the simulated charge.
 */
export function useAutoTopUpPayment(onPaid: () => void) {
  const [paying, setPaying] = useState(false)
  const cancel = useRef<(() => void) | undefined>(undefined)
  const busy = useRef(false)
  const paid = useRef(onPaid)
  const longer = useTakingLonger(paying)

  useEffect(() => {
    paid.current = onPaid
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
      paid.current()
    })
  }, [])

  return { paying, longer, pay }
}
