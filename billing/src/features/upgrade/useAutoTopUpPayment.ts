import { useCallback, useEffect, useRef, useState } from 'react'

/** How long the simulated charge takes before it succeeds. */
const PAYMENT_MS = 1200

/**
 * Auto top up charges the payment method already on file (Stripe in production), so
 * there is no checkout page: the customer waits a moment, then the result lands.
 * Closing the dialog mid-payment unmounts the caller and cancels the simulated charge.
 */
export function useAutoTopUpPayment(onPaid: () => void) {
  const [paying, setPaying] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const busy = useRef(false)
  const paid = useRef(onPaid)

  useEffect(() => {
    paid.current = onPaid
  })

  // Unmounting cancels a charge in flight. It also clears `busy`, so a remount (React
  // StrictMode runs effects twice in development) can start the charge again.
  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      busy.current = false
    },
    [],
  )

  const pay = useCallback(() => {
    if (busy.current) return
    busy.current = true
    setPaying(true)
    timer.current = window.setTimeout(() => {
      busy.current = false
      setPaying(false)
      paid.current()
    }, PAYMENT_MS)
  }, [])

  return { paying, pay }
}
