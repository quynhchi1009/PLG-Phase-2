import { useId, type CSSProperties } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Badge } from '../../components/ui/primitives'
import { PLANS, formatCount } from '../../data/plans'
import { useBilling, type PaidPlanId } from '../../state/billing'
import { useUi } from '../../state/ui'
import { flagUpdated, useCountUp } from './useCountUp'

/* Choreography (ms after the dialog opens). Each step lands before the next
   starts, so the change reads in order: what happened, what moved, the total. */
const T = {
  head: 80,
  title: 160,
  lede: 240,
  panel: 320,
  swap: 460,
  count: 620,
  list: 900,
}
const COUNT_MS = 750

const at = (ms: number) => ({ '--at': `${ms}ms` }) as CSSProperties

/** Confirms what a (simulated) Stripe checkout just did, on the Billing page. */
export function SuccessDialog() {
  const { state, dispatch } = useBilling()
  const { route } = useUi()
  const headingId = useId()
  const descId = useId()
  const s = state.success
  const open = !!s && route === 'billing'

  const close = () => {
    const changed = s?.kind === 'upgraded' ? ['.plan-card', '.settings'] : ['.settings']
    dispatch({ type: 'dismiss-success' })
    flagUpdated(changed)
  }

  return (
    <Dialog open={open} onClose={close} labelledBy={headingId} describedBy={descId} size="md" stepKey={s?.kind}>
      {open && s?.kind === 'upgraded' && (
        <div className="dialog__body dialog__body--center success">
          <span className="success__in success__in--pop" style={at(T.head)}>
            <Badge tone="positive">Plan activated</Badge>
          </span>
          <h2 id={headingId} tabIndex={-1} className="dialog__title success__in" style={at(T.title)}>
            You successfully upgraded to <span className="dialog__title-accent">{PLANS[s.planId].name}</span>
          </h2>
          <p id={descId} className="dialog__lede success__in" style={at(T.lede)}>
            Your credits are ready to use. Here's what changed:
          </p>

          <ChangePanel
            from={s.fromPlanId}
            to={s.planId}
            before={s.carried}
            after={s.carried + s.added}
            segments={[
              ...(s.carried ? [{ label: 'Carried over', value: s.carried }] : []),
              { label: `From ${PLANS[s.planId].name}`, value: s.added },
            ]}
          />

          <section className="perk-box success__in" style={at(T.list - 80)} aria-label="What your plan includes">
            <p className="perk-box__title">Your plan includes</p>
            <ul className="checklist checklist--sm success__list">
              {PLANS[s.planId].features.map((f, i) => (
                <li key={f.title} className="success__in" style={at(T.list + i * 50)}>
                  <Check className="checklist__mark" size={16} strokeWidth={2.25} aria-hidden />
                  <span>
                    <strong>{f.title}</strong>
                    {f.detail && <span className="checklist__detail">{f.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <Button data-autofocus block onClick={close}>
            Go to my plan
          </Button>
        </div>
      )}

      {open && s?.kind === 'topped-up' && (
        <div className="dialog__body dialog__body--center success">
          <span className="result-mark success__mark" aria-hidden>
            <Check size={20} strokeWidth={3} />
          </span>
          <h2
            id={headingId}
            tabIndex={-1}
            className="dialog__title dialog__title--positive success__in"
            style={at(T.title)}
          >
            {formatCount(s.credits)} credits added!
          </h2>
          <p id={descId} className="dialog__lede success__in" style={at(T.lede)}>
            You've topped up your credits.{' '}
            {state.planId === 'flex'
              ? 'This was your one-time Flex top-up; upgrade to Growth for unlimited top-ups.'
              : 'Top-up credits expire at the end of your current billing cycle.'}
          </p>

          <ChangePanel
            before={s.before}
            after={s.before + s.credits}
            segments={[
              ...(s.before ? [{ label: 'Previous balance', value: s.before }] : []),
              { label: 'Top-up', value: s.credits },
            ]}
          />

          <Button data-autofocus block onClick={close}>
            Got it
          </Button>
        </div>
      )}
    </Dialog>
  )
}

interface ChangePanelProps {
  from?: PaidPlanId | null
  to?: PaidPlanId
  before: number
  after: number
  /** Meter segments in order: what was already there, then what was added. */
  segments: { label: string; value: number }[]
}

/** A before → after ledger: the plan swap (if any), then the balance counting into its new total. */
function ChangePanel({ from, to, before, after, segments }: ChangePanelProps) {
  const shown = useCountUp(before, after, {
    delay: T.count,
    duration: COUNT_MS,
  })
  const landed = shown === after
  const added = after - before
  const kept = segments.length > 1 ? segments[0].value : 0

  return (
    <div className="change success__in" style={at(T.panel)}>
      {from && to && (
        <div className="change__row">
          <span className="change__label">Plan</span>
          <span className="change__values">
            <span className="change__from change__from--strike" style={at(T.swap)}>
              {PLANS[from].name}
            </span>
            <ArrowRight className="change__arrow" size={16} aria-label="to" style={at(T.swap + 120)} />
            <span className="change__to" style={at(T.swap + 220)}>
              {PLANS[to].name}
            </span>
          </span>
        </div>
      )}

      <div className="change__row">
        <span className="change__label">Credit balance</span>
        <span className="change__values">
          <span className="change__from">{formatCount(before)}</span>
          <ArrowRight className="change__arrow" size={16} aria-label="to" style={at(T.count - 120)} />
          <strong className="change__total">
            <span aria-hidden>{formatCount(shown)}</span>
            <span className="visually-hidden">{formatCount(after)} credits</span>
          </strong>
          <span className={`change__delta${landed ? ' is-in' : ''}`} aria-hidden={!landed}>
            +{formatCount(added)}
          </span>
        </span>
      </div>

      <div
        className="change__meter"
        aria-hidden
        style={{ '--count-ms': `${COUNT_MS}ms`, ...at(T.count) } as CSSProperties}
      >
        {kept > 0 && <span className="change__seg change__seg--kept" style={{ flexGrow: kept }} />}
        <span className="change__seg change__seg--added" style={{ flexGrow: after - kept }} />
      </div>

      {/* A single segment needs no key; the +delta already names it. */}
      {segments.length > 1 && (
        <ul className="change__legend">
          {segments.map((seg, i) => (
            <li key={seg.label}>
              <span
                className={`change__swatch change__swatch--${i === 0 && segments.length > 1 ? 'kept' : 'added'}`}
                aria-hidden
              />
              {seg.label} <strong>{formatCount(seg.value)}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
