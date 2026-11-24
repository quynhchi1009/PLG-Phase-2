import { useId, type CSSProperties, type ReactNode } from 'react'
import { Check, Minus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { SuccessMark } from '../../components/ui/SuccessMark'
import { PLANS, TOP_UP, formatAmount, formatCount, formatPrice, perMonth, stayPerks } from '../../data/plans'
import { formatDate } from '../../data/history'
import { TODAY, earlyRenewalDate, useBilling } from '../../state/billing'
import { useUi } from '../../state/ui'
import { flagUpdated } from './flagUpdated'
import { useAutoTopUpPayment } from './useAutoTopUpPayment'

/* Choreography (ms after the dialog opens). Each step lands before the next
   starts: the badge, the title, then what the customer now has. */
const T = { head: 80, title: 160, lede: 240, panel: 320, list: 460 }

/* Growth plans switch Auto top up on at purchase, so the activation dialog says so. */
const AUTO_TOP_UP_PERK = {
  title: 'Auto top up:',
  detail: "turned on, so we add credits automatically when you run out. Turn it off anytime in your plan settings",
}

const at = (ms: number) => ({ '--at': `${ms}ms` }) as CSSProperties

/**
 * Confirms what just changed on the Billing page: a (simulated) Stripe checkout,
 * or a reactivation (asked to confirm first, then confirmed).
 */
export function SuccessDialog() {
  const { state, dispatch } = useBilling()
  const { route } = useUi()
  const headingId = useId()
  const descId = useId()
  const s = state.success
  // An Auto top up that was paid for on the report page confirms there, so the customer
  // can carry on with the report they were generating.
  const onReport = route === 'report' && s?.kind === 'auto-top-up-charged'
  const open = !!s && (route === 'billing' || onReport)
  // Short confirmations (a top-up, a reactivation) take the narrow dialog.
  const compact = s?.kind === 'topped-up' || s?.kind === 'reactivated' || s?.kind === 'auto-top-up-confirm' || s?.kind === 'auto-top-up-off' || s?.kind === 'auto-top-up-enable-confirm' || s?.kind === 'auto-top-up-on' || s?.kind === 'auto-top-up-pay-confirm' || s?.kind === 'auto-top-up-charged'

  // When the primary button already just closes the dialog (every result dialog, and the
  // confirmations whose primary is "stay as you are"), the X is a second way to do the same thing,
  // so it goes. Where the primary does something else (reactivate, enable, keep yearly plan), the
  // X stays as the neutral way out. Escape and the backdrop still close every dialog.
  const hideClose =
    s?.kind === 'upgraded' ||
    s?.kind === 'topped-up' ||
    s?.kind === 'reactivated' ||
    s?.kind === 'downgrade-scheduled' ||
    s?.kind === 'downgrade-cancelled' ||
    s?.kind === 'auto-top-up-on' ||
    s?.kind === 'auto-top-up-off' ||
    s?.kind === 'auto-top-up-charged' ||
    s?.kind === 'auto-top-up-confirm' ||
    s?.kind === 'downgrade-confirm'

  const close = () => {
    // Backing out of the reactivation confirmation changes nothing on the page.
    if (s?.kind === 'reactivate-confirm' || s?.kind === 'auto-top-up-confirm' || s?.kind === 'auto-top-up-enable-confirm' || s?.kind === 'auto-top-up-pay-confirm' || s?.kind === 'downgrade-confirm' || s?.kind === 'keep-yearly-confirm') return dispatch({ type: 'dismiss-success' })
    const settingsOnly =
      s?.kind === 'auto-top-up-off' || s?.kind === 'auto-top-up-on' || s?.kind === 'auto-top-up-charged' || s?.kind === 'topped-up'
    const changed = settingsOnly ? ['.settings'] : ['.plan-card', '.settings']
    dispatch({ type: 'dismiss-success' })
    flagUpdated(changed)
    // "Keep yearly plan" left the page when the switch was cancelled, so there is nothing to
    // hand focus back to: land on the settings card instead of <body>.
    if (s?.kind === 'downgrade-cancelled') {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('.settings__title')?.focus())
    }
  }

  return (
    <Dialog open={open} onClose={close} labelledBy={headingId} describedBy={descId} size={compact ? 'sm' : 'md'} stepKey={s?.kind} hideClose={hideClose}>
      {open && s?.kind === 'upgraded' && (
        <div className="activated">
          <span className="activated__badge success__in success__in--pop" style={at(T.head)}>
            Plan activated
          </span>
          <h2 id={headingId} tabIndex={-1} className="dialog__title success__in" style={at(T.title)}>
            You successfully {s.via === 'subscribe' ? 'subscribed' : 'upgraded'} to{' '}
            <span className="dialog__title-accent">{PLANS[s.planId].name}</span>
          </h2>
          <div className="activated__box success__in" style={at(T.panel)}>
            <ul id={descId} className="upc__perks" aria-label="What your plan includes">
              {(s.planId === 'flex' ? PLANS[s.planId].features : [...PLANS[s.planId].features, AUTO_TOP_UP_PERK]).map((f, i) => (
                <li key={f.title} className="success__in" style={at(T.list + i * 60)}>
                  <span className="upc__tick" aria-hidden>
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>
                    <strong>{f.title}</strong> {f.detail}
                  </span>
                </li>
              ))}
            </ul>
            <Button data-autofocus block onClick={close}>
              Back to my plan
            </Button>
          </div>
        </div>
      )}

      {open && s?.kind === 'topped-up' && (
        <div className="dialog__body success topped">
          <SuccessMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            {formatCount(s.credits)} credits added!
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            You have successfully topped-up your credits
          </p>
          <Button data-autofocus block onClick={close}>
            View balance
          </Button>
        </div>
      )}

      {open && s?.kind === 'reactivate-confirm' && (
        <div className="dialog__body success">
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            Don't miss out on your plan benefits
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            Reactivate your subscription to continue enjoying your current plan benefits.
          </p>
          <section className="perk-box perk-box--firm success__in" style={at(T.panel)} aria-label="What you keep">
            <p className="perk-box__title">Stay on current plan to continue enjoying:</p>
            <ul className="checklist checklist--md">
              {stayPerks(s.planId === 'yearly' ? 'yearly' : 'monthly').map((f, i) => (
                <li key={f.title} className="success__in" style={at(T.list + i * 80)}>
                  <Check className="checklist__mark" size={18} strokeWidth={2.25} aria-hidden />
                  <span>
                    <strong>{f.title}</strong> {f.detail}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <Button data-autofocus block onClick={() => dispatch({ type: 'reactivate', today: TODAY })}>
            Reactivate subscription
          </Button>
        </div>
      )}

      {open && s?.kind === 'reactivated' && (
        <div className="dialog__body success topped">
          <SuccessMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            Subscription reactivated
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            Your {PLANS[s.planId].tier} plan renews on {formatDate(s.renewsOn)} at{' '}
            {formatPrice(PLANS[s.planId].price ?? 0)}. Your credits and Perpetual KYB stay as they are.
          </p>
          <Button data-autofocus block onClick={close}>
            Go to my plan
          </Button>
        </div>
      )}

      {open && s?.kind === 'downgrade-confirm' && (
        <DowngradeConfirm headingId={headingId} descId={descId} onKeep={close} />
      )}

      {open && s?.kind === 'keep-yearly-confirm' && (
        <KeepYearlyConfirm headingId={headingId} descId={descId} />
      )}

      {open && s?.kind === 'downgrade-cancelled' && <DowngradeCancelled headingId={headingId} descId={descId} renewsOn={s.renewsOn} onDone={close} />}

      {open && s?.kind === 'downgrade-scheduled' && <DowngradeScheduled headingId={headingId} descId={descId} renewsOn={s.renewsOn} onDone={close} />}

      {open && s?.kind === 'auto-top-up-confirm' && (
        <div className="dialog__body success">
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            Turn off Auto top up?
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            If your credits run out, we won't add more automatically. Reports will pause until you top up manually or your
            plan renews.
          </p>
          <div className="dialog__pair success__in" style={at(T.panel)}>
            <Button data-autofocus block onClick={close}>
              Stay enabled
            </Button>
            <Button block variant="secondary" onClick={() => dispatch({ type: 'disable-auto-top-up' })}>
              Disable
            </Button>
          </div>
        </div>
      )}

      {open && s?.kind === 'auto-top-up-enable-confirm' && (
        <div className="dialog__body success">
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            Turn on Auto top up?
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            When your credits run out, we'll renew your plan early for {formatPrice(TOP_UP[state.planId].price)} and add{' '}
            {formatCount(TOP_UP[state.planId].credits)} credits, so your reports keep running. Your next billing date
            moves to the day we renew.
          </p>
          <div className="dialog__pair success__in" style={at(T.panel)}>
            <Button data-autofocus block onClick={() => dispatch({ type: 'enable-auto-top-up' })}>
              Enable
            </Button>
            <Button block variant="secondary" onClick={close}>
              Stay disabled
            </Button>
          </div>
        </div>
      )}

      {open && s?.kind === 'auto-top-up-pay-confirm' && (
        <AutoTopUpPayConfirm headingId={headingId} descId={descId} onStay={close} />
      )}

      {open && s?.kind === 'auto-top-up-charged' && (
        <div className="dialog__body success topped">
          <SuccessMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            {formatCount(s.credits)} credits added
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            We charged {formatPrice(TOP_UP[state.planId].price)} and renewed your plan early. You now have{' '}
            {formatCount(state.creditsRemaining)} credits and your next billing date is {formatDate(s.renewsOn)}. Auto
            top up is still on, so we'll charge {formatPrice(TOP_UP[state.planId].price)} and add{' '}
            {formatCount(TOP_UP[state.planId].credits)} credits again whenever you run out.
          </p>
          <Button data-autofocus block onClick={close}>
            {onReport ? 'Continue with report' : 'View balance'}
          </Button>
        </div>
      )}

      {open && s?.kind === 'auto-top-up-on' && (
        <div className="dialog__body success topped">
          <SuccessMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            Auto top up turned on
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            We'll add credits automatically whenever you run out. You can turn it off anytime from your plan page.
          </p>
          <Button data-autofocus block onClick={close}>
            View balance
          </Button>
        </div>
      )}

      {open && s?.kind === 'auto-top-up-off' && (
        <div className="dialog__body success topped">
          <SuccessMark />
          <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
            Auto top up turned off
          </h2>
          <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
            We won't add credits automatically anymore. You can turn it back on anytime from your plan page.
          </p>
          <Button data-autofocus block onClick={close}>
            View balance
          </Button>
        </div>
      )}
    </Dialog>
  )
}

/* A date is read as one thing, so a row may wrap before it but not inside it ("28 / September 2027"). */
const keepTogether = (date: string) => date.replace(/ /g, ' ')

/* The receipt for a change to the plan's billing: it is built like "Plan activated" (centred badge and
   title, one white box of ticked rows, the way back), since what changes, and when, is the one thing the
   customer needs to leave with. Every row comes from the confirmation step and the Billing notice, so the
   two switch receipts (scheduled, cancelled) share this layout and differ only in their finish:
   - 'plain': the neutral floor, neutral marks and a secondary button, for a plan that is about to change;
   - 'activated': exactly "Plan activated" (green tint, green ticks, primary button), for a plan that
     stays as it was. */
function SwitchReceipt({
  headingId,
  descId,
  badge,
  warn,
  look,
  title,
  rows,
  rowsLabel,
  onDone,
}: {
  headingId: string
  descId: string
  badge: string
  /* Amber pill when the plan is about to change; the default green when it stays as it was. */
  warn?: boolean
  look: 'plain' | 'activated'
  title: ReactNode
  rows: { title: string; detail: string }[]
  rowsLabel: string
  onDone: () => void
}) {
  const plain = look === 'plain'
  return (
    <div className={`activated${plain ? ' activated--neutral' : ''}`}>
      <span
        className={`activated__badge${warn ? ' activated__badge--warning' : ''} success__in success__in--pop`}
        style={at(T.head)}
      >
        {badge}
      </span>
      <h2 id={headingId} tabIndex={-1} className="dialog__title success__in" style={at(T.title)}>
        {title}
      </h2>
      <div className="activated__box success__in" style={at(T.panel)}>
        <ul id={descId} className="upc__perks" aria-label={rowsLabel}>
          {rows.map((r, i) => (
            <li key={r.title} className="success__in" style={at(T.list + i * 60)}>
              <span className={`upc__tick${plain ? ' upc__tick--neutral' : ''}`} aria-hidden>
                <Check size={12} strokeWidth={3} />
              </span>
              <span>
                <strong>{r.title}</strong> {r.detail}
              </span>
            </li>
          ))}
        </ul>
        <Button data-autofocus block variant={plain ? 'secondary' : 'primary'} onClick={onDone}>
          Back to my plan
        </Button>
      </div>
    </div>
  )
}

/* Amber pill, like Billing's "Downgrade scheduled" tag and the "Plan cancelled" receipt: the plan is
   changing. Rows: what is kept until the date, what starts on it, the way out. */
function DowngradeScheduled({ renewsOn, ...rest }: { headingId: string; descId: string; renewsOn: string; onDone: () => void }) {
  const date = keepTogether(formatDate(renewsOn))
  const y = PLANS.yearly
  const m = PLANS.monthly
  return (
    <SwitchReceipt
      {...rest}
      badge="Downgrade scheduled"
      warn
      look="plain"
      title={
        <>
          Your plan will switch to <span className="dialog__title-accent">{m.name}</span>
        </>
      }
      rowsLabel="What changes and when"
      rows={[
        { title: `Until ${date}:`, detail: `you keep ${y.name} and your credits as they are` },
        {
          title: `From ${date}:`,
          detail: `${m.name} starts at ${formatPrice(m.price ?? 0)} per month, with ${formatCount(m.credits ?? 0)} credits each month`,
        },
        { title: 'Changed your mind?', detail: `You can keep your yearly plan from your plan page any time before ${date}` },
      ]}
    />
  )
}

/* Green pill and the full "Plan activated" finish: the yearly plan stays as it was, the same state the
   Billing page returns to. Rows come from the earlier cancelled copy: the switch is off, the renewal date
   and price, the credits. */
function DowngradeCancelled({ renewsOn, ...rest }: { headingId: string; descId: string; renewsOn: string; onDone: () => void }) {
  const date = keepTogether(formatDate(renewsOn))
  const y = PLANS.yearly
  return (
    <SwitchReceipt
      {...rest}
      badge="Downgrade cancelled"
      look="activated"
      title={
        <>
          You're staying on <span className="dialog__title-accent">{y.name}</span>
        </>
      }
      rowsLabel="What stays the same"
      rows={[
        { title: 'Downgrade to monthly:', detail: `cancelled, so your plan won't change on ${date}` },
        { title: `Renews on ${date}:`, detail: `${y.name} renews at ${formatPrice(y.price ?? 0)}` },
        { title: 'Your credits:', detail: 'stay as they are' },
      ]}
    />
  )
}

/* Turning Auto top up on with 0 credits left: the first pack is paid for now, so the customer
   sees the charge before agreeing to it. */
function AutoTopUpPayConfirm({ headingId, descId, onStay }: { headingId: string; descId: string; onStay: () => void }) {
  const { state, dispatch } = useBilling()
  const pack = TOP_UP[state.planId]
  const { paying, pay } = useAutoTopUpPayment(() => dispatch({ type: 'charge-auto-top-up', today: TODAY }))

  return (
    <div className="dialog__body success" aria-busy={paying}>
      <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
        Turn on Auto top up?
      </h2>
      <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
        You've used all your credits. Turn it on and we'll renew your plan early: we'll charge {formatPrice(pack.price)},
        add {formatCount(pack.credits)} credits and move your next billing date to{' '}
        {formatDate(earlyRenewalDate(state.planId, TODAY))}. After that, we'll do the same whenever you run out.
      </p>
      <div className="dialog__pair success__in" style={at(T.panel)}>
        <Button data-autofocus block aria-disabled={paying} onClick={pay}>
          {paying ? 'Processing payment…' : `Enable and pay ${formatPrice(pack.price)}`}
        </Button>
        <Button block variant="secondary" aria-disabled={paying} onClick={paying ? undefined : onStay}>
          Stay disabled
        </Button>
      </div>
    </div>
  )
}

/* The one step before a scheduled switch to monthly is cancelled (Version A): nothing changes until
   the customer confirms, and the dialog's X leaves the switch scheduled. It mirrors the step that
   scheduled it: that one lists what is lost, this one lists what is kept. Its head and credit sum are
   built like the Upgrade confirmation's, so the three read as a family. */
function KeepYearlyConfirm({ headingId, descId }: { headingId: string; descId: string }) {
  const { state, dispatch } = useBilling()
  const y = PLANS.yearly
  const date = formatDate(state.cycleEnd)

  // Confirming cancels the switch and hands over to the "Downgrade cancelled" dialog.
  const keep = () => dispatch({ type: 'cancel-downgrade', today: TODAY })

  return (
    <div className="dialog__body upc">
      <div className="upc__head">
        <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
          Keep your yearly plan?
        </h2>
        <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
          You're keeping your Growth plan on <strong>yearly billing</strong>, renewing on <strong>{date}</strong>
        </p>
      </div>

      <section className="perk-box perk-box--firm success__in" style={at(T.panel)} aria-label="What you keep">
        <p className="perk-box__title">What you keep on Growth yearly:</p>
        <ul className="checklist checklist--md">
          {stayPerks('yearly').map((f, i) => (
            <li key={f.title} className="success__in" style={at(T.list + i * 80)}>
              <Check className="checklist__mark" size={18} strokeWidth={2.25} aria-hidden />
              <span>
                <strong>{f.title}</strong> {f.detail}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* The same credit sum as the Upgrade confirmation, without a rolled-over line: the yearly plan
          renews with its full allowance, as in the renewal confirmation, so the total is that alone. */}
      <dl className="upc__ledger success__in" style={at(T.list)}>
        <div className="upc__line">
          <dt>{y.name}</dt>
          <dd>
            {formatAmount(y.price ?? 0)} = {formatCount(y.credits ?? 0)} Credits
          </dd>
        </div>
        <div className="upc__total">
          <dt>Total credits after renewal</dt>
          <dd>{formatCount(y.credits ?? 0)} Credits</dd>
        </div>
      </dl>

      <Button data-autofocus block className="success__in" style={at(T.list + 60)} onClick={keep}>
        Keep yearly plan
      </Button>
    </div>
  )
}

/* The one step before a yearly plan is scheduled to move to monthly: what changes and the credits
   the monthly plan starts with. It is built like the Upgrade confirmation (head, one white card,
   plain rows, actions), so the two read as a pair. */
function DowngradeConfirm({ headingId, descId, onKeep }: { headingId: string; descId: string; onKeep: () => void }) {
  const { state, dispatch } = useBilling()
  const y = PLANS.yearly
  const date = formatDate(state.cycleEnd)
  const discount = (p: typeof y) => p.badge?.replace(/^Save\s+/i, '') ?? ''
  const m = PLANS.monthly
  const losses = [
    { title: 'Smaller report discount:', detail: `${discount(y)} drops to ${discount(m)} off report unit costs` },
    {
      title: 'Higher monthly cost:',
      detail: `${formatPrice(perMonth(y) ?? 0)}/month becomes ${formatPrice(m.price ?? 0)}/month`,
    },
    {
      title: 'Smaller credit allowance:',
      detail: `${formatCount(y.credits ?? 0)} credits a year becomes ${formatCount(m.credits ?? 0)} a month`,
    },
  ]

  return (
    <div className="dialog__body upc upc--downgrade">
      <div className="upc__head">
        <h2 id={headingId} tabIndex={-1} className="dialog__title dialog__title--left success__in" style={at(T.title)}>
          Switch to monthly billing?
        </h2>
        <p id={descId} className="dialog__lede dialog__lede--left success__in" style={at(T.lede)}>
          You're switching your Growth plan from yearly to <strong>monthly billing</strong> on <strong>{date}</strong>
        </p>
      </div>

      <section className="upc__card upc__card--loss success__in" style={at(T.panel)} aria-label={`What you lose from ${date}`}>
        <div className="upc__plan">
          <h3 className="upc__name">What you'll lose from {date}</h3>
          <ul className="upc__perks">
            {losses.map((l) => (
              <li key={l.title}>
                <span className="upc__tick upc__tick--loss" aria-hidden>
                  <Minus size={12} strokeWidth={3} />
                </span>
                <span>
                  <strong>{l.title}</strong> {l.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The Upgrade confirmation's credit sum without its rolled-over line: credits do not carry over
          when a yearly plan moves to monthly, so the total is the monthly allowance alone. */}
      <dl className="upc__ledger success__in" style={at(T.list)}>
        <div className="upc__line">
          <dt>{m.name}</dt>
          <dd>
            {formatAmount(m.price ?? 0)} = {formatCount(m.credits ?? 0)} Credits
          </dd>
        </div>
        <div className="upc__total">
          <dt>Total credits after switch</dt>
          <dd>{formatCount(m.credits ?? 0)} Credits</dd>
        </div>
      </dl>

      <div className="dialog__pair success__in" style={at(T.list + 60)}>
        <Button data-autofocus block onClick={onKeep}>
          Keep yearly plan
        </Button>
        <Button block variant="secondary" onClick={() => dispatch({ type: 'schedule-downgrade', today: TODAY })}>
          Switch to monthly
        </Button>
      </div>
    </div>
  )
}
