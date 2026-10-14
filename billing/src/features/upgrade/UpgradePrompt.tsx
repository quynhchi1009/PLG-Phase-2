import { useId } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Badge, Checklist } from '../../components/ui/primitives'
import { PLANS, TOP_UP, UPGRADE_PERKS, formatCount, formatPrice } from '../../data/plans'
import { canTopUp, useBilling } from '../../state/billing'
import { useUi } from '../../state/ui'
import { useCheckout } from './checkout'

/**
 * The nudge shown when credits run out (report page) or when a Flex customer
 * asks to top up or upgrade (billing page). What it offers depends on the plan:
 * plans only move up.
 */
export function UpgradePrompt({
  open,
  onClose,
  reason,
}: {
  open: boolean
  onClose: () => void
  reason: 'insufficient' | 'choose'
}) {
  const headingId = useId()
  const descId = useId()
  const { state } = useBilling()
  const { navigate, toast } = useUi()
  const { upgrade, topUp } = useCheckout()
  const topUpOpen = canTopUp(state)
  const short = reason === 'insufficient' ? "You don't have enough credits for this report. " : ''

  const viewPlans = () => {
    onClose()
    navigate('plans')
  }
  const doTopUp = () => {
    onClose()
    topUp()
  }

  let body
  if (state.planId === 'flex' && topUpOpen) {
    body = (
      <>
        <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
          Upgrade or top up your plan
        </h2>
        <p id={descId} className="dialog__lede dialog__lede--left">
          {short}Upgrade to a Growth plan and enjoy lower report costs.
        </p>
        <section className="confirm-plan confirm-plan--plain" aria-label="Growth plan">
          <p className="confirm-plan__name">
            Growth <Badge tone="accent">Save up to 22%</Badge>
          </p>
          <Checklist items={UPGRADE_PERKS.yearly} size="sm" />
          <div className="dialog__actions dialog__actions--stack">
            <Button data-autofocus block onClick={viewPlans}>
              View upgrade options
            </Button>
            <Button variant="link" onClick={doTopUp}>
              Top up instead
            </Button>
          </div>
        </section>
      </>
    )
  } else if (state.planId === 'yearly') {
    const biz = PLANS.business
    body = (
      <>
        <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
          Upgrade your plan
        </h2>
        <p id={descId} className="dialog__lede dialog__lede--left">
          {short}Top up now, or move to Business for volume pricing.
        </p>
        <section className="confirm-plan confirm-plan--plain" aria-label="Business plan">
          <p className="confirm-plan__name">
            Business <Badge tone="accent">{biz.badge}</Badge>
          </p>
          <Checklist items={biz.features} size="sm" />
          <Button
            data-autofocus
            block
            onClick={() => {
              onClose()
              toast('Talk to sales isn’t connected in this prototype.')
            }}
          >
            Talk to sales
          </Button>
        </section>
        <TopUpFooter onTopUp={doTopUp} />
      </>
    )
  } else {
    // Growth monthly, or Flex with its one top-up already used: offer Growth yearly.
    const y = PLANS.yearly
    body = (
      <>
        <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left">
          Upgrade your plan
        </h2>
        <p id={descId} className="dialog__lede dialog__lede--left">
          {short}
          {state.planId === 'flex'
            ? 'Upgrade to a Growth plan and enjoy lower report costs.'
            : 'Top up now, or switch to yearly for credits that last longer.'}
        </p>
        <section className="confirm-plan confirm-plan--plain" aria-label="Growth billed yearly">
          <p className="confirm-plan__name">{y.name}</p>
          <p className="confirm-plan__price">
            {formatPrice(y.price ?? 0)}
            <span>/ year · {formatCount(y.credits ?? 0)} credits</span>
            <Badge tone="accent">{y.badge}</Badge>
          </p>
          <Checklist items={UPGRADE_PERKS.yearly} size="sm" />
          <div className="dialog__actions dialog__actions--stack">
            <Button
              data-autofocus
              block
              onClick={() => {
                onClose()
                upgrade('yearly')
              }}
            >
              Confirm and pay {formatPrice(y.price ?? 0)}
            </Button>
            <Button variant="link" onClick={viewPlans}>
              View other upgrade options
            </Button>
          </div>
        </section>
        {state.planId !== 'flex' && topUpOpen && <TopUpFooter onTopUp={doTopUp} />}
      </>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} labelledBy={headingId} describedBy={descId} size="md">
      {open && <div className="dialog__body">{body}</div>}
    </Dialog>
  )
}

function TopUpFooter({ onTopUp }: { onTopUp: () => void }) {
  const { state } = useBilling()
  const pack = TOP_UP[state.planId]
  return (
    <div className="prompt-foot">
      <p>
        Not ready to upgrade?{' '}
        <button type="button" className="text-btn" onClick={onTopUp}>
          Top up {formatCount(pack.credits)} credits for {formatPrice(pack.price)}
        </button>
      </p>
      <p className="prompt-foot__note">Top-up credits expire at the end of your current billing cycle.</p>
    </div>
  )
}
