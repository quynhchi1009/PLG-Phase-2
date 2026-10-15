import { useEffect, useId, useState } from 'react'
import { Check, CircleHelp } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Checklist, InfoTip } from '../../components/ui/primitives'
import { GROWTH_PERKS, PLANS, UPGRADE_PERKS, formatAmount, formatCount, formatPrice, isUpgrade } from '../../data/plans'
import { formatDate } from '../../data/history'
import { TODAY, nextBillingDate, useBilling, type PaidPlanId } from '../../state/billing'
import { useCheckout } from './checkout'

/**
 * Confirms a paid plan before checkout.
 * - Active customer moving up: "Upgrade confirmation", with unused credits carried over.
 * - Plan auto-cancelled after a failed renewal: "Plan confirmation", credits start fresh.
 * - Any other new purchase (no plan, or after cancellation): "Confirm plan & terms".
 */
export function UpgradeConfirm({ planId, onClose }: { planId: PaidPlanId | null; onClose: () => void }) {
  const { state } = useBilling()
  const headingId = useId()
  const descId = useId()
  const upgrading = !!planId && state.status === 'active' && isUpgrade(state.planId, planId)
  // A returning customer whose renewal failed confirms like an upgrade, without the terms step.
  const renewing = !!planId && state.status === 'none' && state.endReason === 'payment-failed'

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
        (upgrading || renewing ? (
          <UpgradeBody planId={planId} renewing={renewing} headingId={headingId} descId={descId} onClose={onClose} />
        ) : (
          <PurchaseBody planId={planId} headingId={headingId} descId={descId} onClose={onClose} />
        ))}
    </Dialog>
  )
}

function UpgradeBody({
  planId,
  renewing,
  headingId,
  descId,
  onClose,
}: {
  planId: PaidPlanId
  /** Re-subscribing after an auto-cancellation: nothing carries over. */
  renewing: boolean
  headingId: string
  descId: string
  onClose: () => void
}) {
  const { state } = useBilling()
  const { upgrade, subscribe } = useCheckout()
  const from = PLANS[state.planId]
  const fromFlex = state.planId === 'flex'
  // Flex customers can still choose the billing period for Growth here.
  const [target, setTarget] = useState<PaidPlanId>(planId)
  useEffect(() => setTarget(planId), [planId])
  const plan = PLANS[target]
  const carry = renewing ? 0 : state.creditsRemaining
  const total = (plan.credits ?? 0) + carry
  const growth = target === 'monthly' || target === 'yearly'
  const yearly = target === 'yearly'
  // Rolled-over credits expire with the new plan's first renewal (PRD, Part 2).
  const renewsOn = formatDate(nextBillingDate(plan.cycle, TODAY))
  // Growth's period can still be switched here when coming from Flex or renewing.
  const canSwitch = growth && (fromFlex || renewing)
  const perks = canSwitch ? GROWTH_PERKS : growth ? UPGRADE_PERKS[target as 'monthly' | 'yearly'] : plan.features

  return (
    <div className="dialog__body upc">
      <div className="upc__head">
        <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
          {renewing ? 'Plan confirmation' : 'Upgrade confirmation'}
        </h2>
        <p id={descId} className="dialog__lede dialog__lede--left">
          {renewing ? (
            <>
              You're subscribing to the <strong>{plan.tier}</strong> plan
            </>
          ) : from.tier === plan.tier && plan.cycle ? (
            // Same plan, new billing period: name the change, not the plan twice.
            <>
              You're upgrading your {plan.tier} plan from {from.cycle === 'year' ? 'yearly' : 'monthly'} to{' '}
              <strong>{plan.cycle === 'year' ? 'yearly' : 'monthly'} billing</strong>!
            </>
          ) : (
            <>
              You're upgrading from {from.tier} to the <strong>{plan.tier}</strong> plan!
            </>
          )}
        </p>
      </div>

      {/* The plan card says what you're buying; the ledger below it adds up the credits. */}
      <section className="upc__card" aria-label="Selected plan">
        <div className="upc__plan">
          <h3 className="upc__name">{plan.tier}</h3>
          <p className="upc__price">
            {formatPrice(plan.price ?? 0)}
            <span>/ {plan.cycle ?? 'one-time'}</span>
          </p>

          {canSwitch && (
            <div className="upc__cycle">
              <button type="button" className="upc__cycle-label" onClick={() => setTarget('monthly')}>
                Monthly
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={yearly}
                aria-label="Bill yearly"
                className="switch"
                onClick={() => setTarget(yearly ? 'monthly' : 'yearly')}
              >
                <span className="switch__knob" aria-hidden />
              </button>
              <button type="button" className="upc__cycle-label" onClick={() => setTarget('yearly')}>
                Yearly · <span className="upc__save">{PLANS.yearly.badge}</span>
              </button>
            </div>
          )}

          {perks.length > 0 && (
            <ul className="upc__perks">
              {perks.map((f) => (
                <li key={f.title}>
                  <span className="upc__tick" aria-hidden>
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>
                    <strong>{f.title}</strong> {f.detail}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <dl className="upc__ledger">
        <div className="upc__line">
          <dt>{plan.name}</dt>
          <dd>
            {formatAmount(plan.price ?? 0)} = {formatCount(plan.credits ?? 0)} Credits
          </dd>
        </div>
        {carry > 0 && (
          <div className="upc__carry">
            <dt>
              {fromFlex ? 'Rolled over from Flex plan' : 'Unused credits from current plan'}
              <InfoTip label="When rolled-over credits expire" icon={<CircleHelp size={16} aria-hidden />}>
                Expires at your next renewal ({renewsOn})
              </InfoTip>
            </dt>
            <dd>+{formatCount(carry)} Credits</dd>
          </div>
        )}
        <div className="upc__total">
          <dt>{renewing ? 'Total credits after renewal' : 'Total credits after upgrade'}</dt>
          <dd>{formatCount(total)} Credits</dd>
        </div>
      </dl>

      {/* Focus lands on the title (Dialog's fallback), so the pay button isn't pre-selected. */}
      <Button
        block
        onClick={() => {
          // Close first so the dialog never re-renders against the new plan.
          onClose()
          if (renewing) subscribe(target)
          else upgrade(target)
        }}
      >
        Confirm and pay
      </Button>
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
    <div className="dialog__body confirm">
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
