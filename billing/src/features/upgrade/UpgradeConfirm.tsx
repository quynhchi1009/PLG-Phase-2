import { useEffect, useId, useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Badge, Checklist, InfoTip } from '../../components/ui/primitives'
import { PLANS, UPGRADE_PERKS, formatAmount, formatCount, formatPrice, isUpgrade } from '../../data/plans'
import { useBilling, type PaidPlanId } from '../../state/billing'
import { useCheckout } from './checkout'

/**
 * Confirms a paid plan before checkout.
 * - Active customer moving up: "Upgrade confirmation", with unused credits carried over.
 * - New purchase (no plan, or after cancellation): "Confirm plan & terms".
 */
export function UpgradeConfirm({ planId, onClose }: { planId: PaidPlanId | null; onClose: () => void }) {
  const { state } = useBilling()
  const headingId = useId()
  const descId = useId()
  const upgrading = !!planId && state.status === 'active' && isUpgrade(state.planId, planId)

  return (
    <Dialog
      open={!!planId}
      onClose={onClose}
      labelledBy={headingId}
      describedBy={descId}
      size="md"
      stepKey={planId ?? undefined}
    >
      {planId &&
        (upgrading ? (
          <UpgradeBody planId={planId} headingId={headingId} descId={descId} onClose={onClose} />
        ) : (
          <PurchaseBody planId={planId} headingId={headingId} descId={descId} onClose={onClose} />
        ))}
    </Dialog>
  )
}

function UpgradeBody({
  planId,
  headingId,
  descId,
  onClose,
}: {
  planId: PaidPlanId
  headingId: string
  descId: string
  onClose: () => void
}) {
  const { state } = useBilling()
  const { upgrade } = useCheckout()
  const from = PLANS[state.planId]
  const fromFlex = state.planId === 'flex'
  // Flex customers can still choose the billing period for Growth here.
  const [target, setTarget] = useState<PaidPlanId>(planId)
  useEffect(() => setTarget(planId), [planId])
  const plan = PLANS[target]
  const carry = state.creditsRemaining
  const total = (plan.credits ?? 0) + carry
  const growth = target === 'monthly' || target === 'yearly'

  return (
    <div className="dialog__body">
      <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
        Upgrade confirmation
      </h2>
      <p id={descId} className="dialog__lede dialog__lede--left">
        You're upgrading from {from.name} to the <strong>{plan.tier}</strong> plan.
      </p>

      <section className="confirm-plan confirm-plan--plain" aria-label="Selected plan">
        <p className="confirm-plan__name">{plan.tier}</p>
        <p className="confirm-plan__price">
          {formatPrice(plan.price ?? 0)}
          <span>/ {plan.cycle ?? 'one-time'}</span>
          {plan.badge && <Badge tone="accent">{plan.badge}</Badge>}
        </p>
        {fromFlex && growth && (
          <div className="cycle-switch" role="group" aria-label="Billing period">
            {(['monthly', 'yearly'] as const).map((c) => (
              <button key={c} type="button" aria-pressed={target === c} onClick={() => setTarget(c)}>
                {c === 'monthly' ? 'Monthly' : 'Yearly'}
                {c === 'yearly' && <span className="cycle-switch__save">Save 22%</span>}
              </button>
            ))}
          </div>
        )}
        {growth && <Checklist items={UPGRADE_PERKS[target as 'monthly' | 'yearly']} size="sm" />}
      </section>

      <dl className="facts facts--ledger">
        <div>
          <dt>{plan.name}</dt>
          <dd>
            {formatAmount(plan.price ?? 0)} + {formatCount(plan.credits ?? 0)} credits
          </dd>
        </div>
        {carry > 0 && (
          <div>
            <dt className="facts__with-tip">
              {fromFlex ? 'Rolled over from Flex plan' : 'Unused credits from current plan'}
              <InfoTip label="About carried-over credits">
                {fromFlex
                  ? 'Your remaining Flex credits move to your new plan.'
                  : 'Expires at your next renewal date.'}
              </InfoTip>
            </dt>
            <dd className="facts__plus">+{formatCount(carry)} credits</dd>
          </div>
        )}
        <div className="facts__total">
          <dt>Total credits after upgrade</dt>
          <dd>{formatCount(total)} credits</dd>
        </div>
      </dl>

      <Button
        data-autofocus
        block
        onClick={() => {
          // Close first so the dialog never re-renders against the new plan.
          onClose()
          upgrade(target)
        }}
      >
        Confirm and pay
      </Button>
      <p className="dialog__fine">Payment is processed securely by Stripe.</p>
    </div>
  )
}

function PurchaseBody({
  planId,
  headingId,
  descId,
  onClose,
}: {
  planId: PaidPlanId
  headingId: string
  descId: string
  onClose: () => void
}) {
  const { subscribe } = useCheckout()
  const [privacy, setPrivacy] = useState(false)
  const [terms, setTerms] = useState(false)
  const [tried, setTried] = useState(false)
  const plan = PLANS[planId]
  const ok = privacy && terms

  return (
    <div className="dialog__body">
      <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
        Confirm plan &amp; terms
      </h2>
      <section className="confirm-plan" aria-label="Selected plan" id={descId}>
        <p className="confirm-plan__name">{plan.name}</p>
        <div className="plan__figures plan__figures--flat">
          <p className="plan__amount">
            {formatPrice(plan.price ?? 0)}
            <span>{plan.cycle ? `per ${plan.cycle}` : 'one-time'}</span>
          </p>
          <p className="plan__credits">
            {formatCount(plan.credits ?? 0)}
            <span>{plan.cycle ? `credits/${plan.cycle}` : 'credits'}</span>
          </p>
        </div>
        <Checklist items={plan.features} size="sm" />
      </section>
      <div className="confirm-terms">
        <label className="check">
          <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} data-autofocus />
          <span className="check__box" aria-hidden>
            <Check size={12} strokeWidth={3.5} />
          </span>
          <span>
            I have read and understood the{' '}
            <a href="#privacy" onClick={(e) => e.preventDefault()}>
              Privacy Policy
            </a>
          </span>
        </label>
        <label className="check">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span className="check__box" aria-hidden>
            <Check size={12} strokeWidth={3.5} />
          </span>
          <span>
            I agree to the{' '}
            <a href="#terms" onClick={(e) => e.preventDefault()}>
              Terms and Conditions
            </a>
          </span>
        </label>
        <p className="field-error" role="alert">
          {tried && !ok && 'Accept the Privacy Policy and the Terms and Conditions to continue.'}
        </p>
      </div>
      <Button
        block
        variant={ok ? 'primary' : 'quiet'}
        aria-disabled={!ok || undefined}
        onClick={() => {
          if (!ok) return setTried(true)
          onClose()
          subscribe(planId)
        }}
      >
        Proceed to payment
      </Button>
    </div>
  )
}
