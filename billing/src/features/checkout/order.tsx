import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { PaidPlanId } from '../../state/billing'
import type { Route } from '../../state/ui'

/** What the customer is about to pay for, handed to the checkout step. */
export interface Order {
  kind: 'upgrade' | 'subscribe' | 'top-up'
  planId?: PaidPlanId
  /** Line shown on the checkout summary, e.g. "Growth (billed yearly)". */
  item: string
  /** Second line, e.g. "3,047 credits · renews yearly". */
  detail: string
  amount: number
  /** Where "Back" returns to if the customer abandons checkout. */
  returnTo: Route
}

interface OrderContextValue {
  order: Order | null
  setOrder: (o: Order | null) => void
}

const OrderContext = createContext<OrderContextValue | null>(null)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [order, setOrder] = useState<Order | null>(null)
  const value = useMemo(() => ({ order, setOrder }), [order])
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrder() {
  const ctx = useContext(OrderContext)
  if (!ctx) throw new Error('useOrder must be used inside OrderProvider')
  return ctx
}
