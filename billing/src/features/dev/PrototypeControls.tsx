import { useState } from 'react'
import { FlaskConical, X } from 'lucide-react'
import { useBilling, type EndReason, type PaidPlanId, type SubscriptionStatus } from '../../state/billing'
import { useUi, type Route } from '../../state/ui'

interface Scenario {
  id: string
  label: string
  status: SubscriptionStatus
  planId: PaidPlanId
  creditsLeft?: number | 'some' | 'none'
  topUpUsed?: boolean
  endReason?: EndReason
  route?: Route
}

const GROUPS: { title: string; items: Scenario[] }[] = [
  {
    title: 'Growth',
    items: [
      { id: 'g-m', label: 'Monthly, active', status: 'active', planId: 'monthly' },
      { id: 'g-y', label: 'Yearly, active', status: 'active', planId: 'yearly' },
      { id: 'g-m-low', label: 'Monthly, low credits', status: 'active', planId: 'monthly', creditsLeft: 6, route: 'report' },
      { id: 'g-y-low', label: 'Yearly, low credits', status: 'active', planId: 'yearly', creditsLeft: 6, route: 'report' },
    ],
  },
  {
    title: 'Flex',
    items: [
      { id: 'f-zero', label: '0 credits', status: 'active', planId: 'flex', creditsLeft: 0 },
      { id: 'f-used', label: 'Credits left, top-up used', status: 'active', planId: 'flex', creditsLeft: 124, topUpUsed: true },
      { id: 'f-low', label: 'Low credits, top-up available', status: 'active', planId: 'flex', creditsLeft: 6, route: 'report' },
      { id: 'f-low-used', label: 'Low credits, top-up used', status: 'active', planId: 'flex', creditsLeft: 6, topUpUsed: true, route: 'report' },
    ],
  },
  {
    title: 'Cancellation',
    items: [
      { id: 'c-some', label: 'Cancelled, credits > 0', status: 'cancelling', planId: 'monthly', creditsLeft: 'some' },
      { id: 'c-none', label: 'Cancelled, credits = 0', status: 'cancelling', planId: 'monthly', creditsLeft: 'none' },
      { id: 'inactive', label: 'Inactive', status: 'none', planId: 'monthly' },
      { id: 'failed', label: 'Payment failed (auto-cancelled)', status: 'none', planId: 'monthly', endReason: 'payment-failed' },
    ],
  },
]

/** Demo-only panel for jumping between account states. Not part of the product UI. */
export function PrototypeControls() {
  const { dispatch } = useBilling()
  const { navigate } = useUi()
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('g-m')

  if (!open)
    return (
      <button type="button" className="proto-toggle" onClick={() => setOpen(true)} aria-expanded={false}>
        <FlaskConical size={16} aria-hidden />
        Prototype states
      </button>
    )

  const set = (s: Scenario) => {
    setCurrent(s.id)
    dispatch({
      type: 'demo',
      status: s.status,
      planId: s.planId,
      creditsLeft: s.creditsLeft,
      topUpUsed: s.topUpUsed,
      endReason: s.endReason,
    })
    navigate(s.route ?? 'billing')
  }

  return (
    <div className="proto" role="group" aria-label="Prototype states">
      <div className="proto__head">
        <p>
          <FlaskConical size={16} aria-hidden />
          Prototype states
        </p>
        <button type="button" className="icon-btn icon-btn--chrome" aria-label="Close prototype states" onClick={() => setOpen(false)}>
          <X size={16} aria-hidden />
        </button>
      </div>
      {GROUPS.map((g) => (
        <div key={g.title} className="proto__group">
          <p className="proto__label">{g.title}</p>
          <div className="proto__seg proto__seg--stack">
            {g.items.map((s) => (
              <button key={s.id} type="button" aria-pressed={current === s.id} onClick={() => set(s)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="proto__hint">"Low credits" scenarios open the report page; generate a report to hit the limit.</p>
    </div>
  )
}
