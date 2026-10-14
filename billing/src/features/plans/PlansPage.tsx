import { useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, Check, ChevronDown, CircleCheck, Lock, Minus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { MultiSelect, type Option } from '../../components/ui/MultiSelect'
import { Badge, Checklist, InfoTip } from '../../components/ui/primitives'
import {
  PLANS,
  RECOMMEND_BLURB,
  formatCount,
  formatPrice,
  perCredit,
  isUpgrade,
  perMonth,
  type Plan,
  type PlanId,
} from '../../data/plans'
import {
  MALAYSIA_DOCS,
  SCOPES,
  STARTING_RATES,
  TIERS,
  TIER_RATES,
  creditsPerReport,
  tierOf,
  type ScopeId,
  type StartingRate,
  type TierId,
} from '../../data/pricing'
import { canSelectPlan, useBilling, type PaidPlanId } from '../../state/billing'
import { useUi } from '../../state/ui'
import { UpgradeConfirm } from '../upgrade/UpgradeConfirm'

type Billing = 'monthly' | 'yearly'

export function PlansPage() {
  const { state } = useBilling()
  const [pending, setPending] = useState<PaidPlanId | null>(null)
  const [recommended, setRecommended] = useState<PlanId | null>(null)
  const [billing, setBilling] = useState<Billing>(state.planId === 'yearly' ? 'yearly' : 'monthly')
  const plansRef = useRef<HTMLElement>(null)
  // Active subscribers only see their plan and the plans above it (no downgrades).
  const lineup = state.status === 'active' && state.planId !== 'flex' ? state.planId : 'all'

  const showPlan = (id: PlanId) => {
    if (id === 'monthly' || id === 'yearly') setBilling(id)
    setRecommended(id)
    plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="page page--plans">
      <h1 className="visually-hidden">Upgrade</h1>

      <Estimator onChoose={setPending} onShow={showPlan} onReset={() => setRecommended(null)} />

      <section className="choose" ref={plansRef} aria-labelledby="choose-title">
        <h2 id="choose-title" className="choose__title">
          Choose your plan
        </h2>
        {lineup === 'monthly' ? (
          // Growth monthly can only move up: to yearly or Business.
          <div className="plans">
            <PlanCard plan={PLANS.monthly} recommended={recommended === 'monthly'} onChoose={setPending} />
            <div className="plans__featured">
              <PlanCard plan={PLANS.yearly} featured recommended={recommended === 'yearly'} onChoose={setPending} />
            </div>
            <PlanCard plan={PLANS.business} recommended={recommended === 'business'} onChoose={setPending} />
          </div>
        ) : lineup === 'yearly' ? (
          // Growth yearly can only move up to Business.
          <div className="plans plans--two">
            <PlanCard plan={PLANS.yearly} recommended={recommended === 'yearly'} onChoose={setPending} />
            <PlanCard plan={PLANS.business} recommended={recommended === 'business'} onChoose={setPending} />
          </div>
        ) : (
        <div className="plans">
          <PlanCard plan={PLANS.flex} recommended={recommended === 'flex'} onChoose={setPending} />
          <div className="plans__featured">
            <div className="billing-toggle" role="group" aria-label="Growth billing period">
              {(['monthly', 'yearly'] as Billing[]).map((b) => (
                <button key={b} type="button" aria-pressed={billing === b} onClick={() => setBilling(b)}>
                  Billed {b}
                </button>
              ))}
            </div>
            <PlanCard
              plan={PLANS[billing]}
              title="Growth"
              featured
              recommended={recommended === billing}
              onChoose={setPending}
            />
          </div>
          <PlanCard plan={PLANS.business} recommended={recommended === 'business'} onChoose={setPending} />
        </div>
        )}
      </section>

      <section className="card section-card" aria-labelledby="compare-title">
        <p className="eyebrow">Plans &amp; pricing</p>
        <Compare />
        <CreditRates />
      </section>
      <Faq />

      <section className="card help" aria-labelledby="help-title">
        <h2 id="help-title" className="help__title">
          Need help?
        </h2>
        <p>If you have more questions, contact our support team.</p>
        <a className="btn btn--primary btn--md" href="mailto:support@asiaverify.com">
          Contact support
        </a>
      </section>

      <UpgradeConfirm planId={pending} onClose={() => setPending(null)} />
    </div>
  )
}

/* Estimator ---------------------------------------------------------------- */

const UNSURE = 'unsure'
const ALL = 'all'

const JURISDICTION_OPTIONS: Option[] = [
  { value: UNSURE, label: 'Not sure' },
  { value: ALL, label: 'All' },
  ...TIERS.flatMap((t) => t.countries.map((c) => ({ value: c, label: c, group: t.name }))),
]

const SCOPE_OPTIONS: Option[] = [
  { value: ALL, label: 'All' },
  ...SCOPES.flatMap((s) => {
    const opt: Option = { value: s.value, label: s.label }
    if (s.value !== 'legal-docs') return [opt]
    return [opt, ...MALAYSIA_DOCS.map((d, i) => ({ value: `my-doc-${i}`, label: d, nested: true }))]
  }),
]

const MAX_REPORTS = 1000

function Estimator({
  onChoose,
  onShow,
  onReset,
}: {
  onChoose: (id: PaidPlanId) => void
  onShow: (id: PlanId) => void
  onReset: () => void
}) {
  const { state } = useBilling()
  const [jurisdictions, setJurisdictions] = useState<string[]>([])
  const [scopes, setScopes] = useState<string[]>([])
  const [reports, setReports] = useState(595)
  const [touchedReports, setTouchedReports] = useState(false)
  const sliderId = useId()

  const estimate = useMemo(() => {
    if (!jurisdictions.length || !scopes.length) return null
    const countries = jurisdictions.includes(UNSURE)
      ? TIERS.flatMap((t) => t.countries)
      : jurisdictions
    const scopeIds = scopes.filter((s) => !s.startsWith('my-doc')) as ScopeId[]
    const perReport =
      countries.reduce((sum, c) => sum + creditsPerReport(tierOf(c) ?? 't1', scopeIds), 0) / countries.length
    const credits = Math.round(perReport * reports)
    const plan: PlanId =
      credits <= (PLANS.flex.credits ?? 0) ? 'flex' : credits <= (PLANS.yearly.credits ?? 0) ? 'yearly' : 'business'
    return { credits, perReport, plan }
  }, [jurisdictions, scopes, reports])

  const steps = [
    { label: 'Select your jurisdiction(s)', done: jurisdictions.length > 0 },
    { label: 'Select your information scope(s)', done: scopes.length > 0 },
    { label: 'Set your reports per year', done: touchedReports },
  ]
  const ready = estimate && touchedReports
  // An active subscriber already on this plan or a higher one doesn't need to buy anything.
  const covered = !!estimate && state.status === 'active' && !isUpgrade(state.planId, estimate.plan)
  const plan = ready ? PLANS[covered ? state.planId : estimate.plan] : null
  const locked = !canSelectPlan(state)

  const reset = () => onReset()

  return (
    <section className="card estimator" aria-labelledby="estimator-title">
      <div className="estimator__form">
        <p className="eyebrow">Plan estimator</p>
        <h2 id="estimator-title" className="estimator__title">
          Estimate Your Plan
        </h2>
        <p className="estimator__lede">
          Not sure which plan to pick? Use our calculator to get a rough estimate of which subscription is best for you.
        </p>
        <p className="estimator__fine">
          Estimated plan and pricing. Final cost may vary based on usage, jurisdictions and selected features.
        </p>

        <MultiSelect
          label="Jurisdiction"
          placeholder="Select the jurisdiction(s)"
          options={JURISDICTION_OPTIONS}
          value={jurisdictions}
          allValue={ALL}
          unsureValue={UNSURE}
          onChange={(v) => {
            setJurisdictions(v)
            reset()
          }}
        />
        <MultiSelect
          label="Information scope"
          placeholder="Select the information scope(s) you need"
          options={SCOPE_OPTIONS}
          value={scopes}
          allValue={ALL}
          nestedNote="For Malaysia, price varies by document type"
          onChange={(v) => {
            setScopes(v)
            reset()
          }}
        />

        <div className="field">
          <div className="field__row">
            <label className="field__label" htmlFor={sliderId}>
              Reports per year
            </label>
            <output htmlFor={sliderId} className="range__value">
              {formatCount(reports)}
            </output>
          </div>
          <input
            id={sliderId}
            type="range"
            className="range"
            min={0}
            max={MAX_REPORTS}
            step={5}
            value={reports}
            style={{ '--pct': `${(reports / MAX_REPORTS) * 100}%` } as React.CSSProperties}
            onChange={(e) => {
              setReports(Number(e.target.value))
              setTouchedReports(true)
              reset()
            }}
          />
        </div>
      </div>

      <aside className={`recommend ${ready ? 'is-ready' : ''}`} aria-live="polite">
        {ready && plan && estimate ? (
          <>
            <p className="eyebrow">{covered ? 'Your plan fits' : 'Recommended for you'}</p>
            <p className="recommend__plan">{plan.tier}</p>
            <div className="recommend__figures">
              {plan.price !== null ? (
                <p className="plan__amount">
                  {formatPrice(plan.cycle === 'year' ? (perMonth(plan) ?? 0) : plan.price)}
                  <span>{plan.cycle ? 'per month' : 'one-time'}</span>
                </p>
              ) : (
                <p className="plan__amount plan__amount--custom">Custom pricing</p>
              )}
              {plan.credits && (
                <p className="plan__credits">
                  {formatCount(plan.credits)}
                  <span>credits</span>
                </p>
              )}
            </div>
            <p className="recommend__blurb">
              {covered ? 'Your current plan already covers this usage. Top up anytime if you need more credits.' : RECOMMEND_BLURB[estimate.plan]}
            </p>
            <div className="recommend__actions">
              {covered ? (
                <Button block variant="secondary" className="btn--current" aria-disabled>
                  <Check size={16} aria-hidden /> Your current plan
                </Button>
              ) : estimate.plan === 'business' ? (
                <Button block variant="secondary" onClick={() => onShow('business')}>
                  Talk to sales
                </Button>
              ) : (
                <Button
                  block
                  variant={locked ? 'quiet' : 'primary'}
                  aria-disabled={locked || undefined}
                  className={locked ? 'btn--locked' : undefined}
                  onClick={() => !locked && onChoose(estimate.plan as PaidPlanId)}
                >
                  {locked ? 'Available when plan ends or credits run out' : 'Select plan'}
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">Get your recommended plan</p>
            <ol className="recommend__steps">
              {steps.map((s, i) => (
                <li key={s.label} className={s.done ? 'is-done' : undefined}>
                  <span className="recommend__num" aria-hidden>
                    {s.done ? <Check size={14} strokeWidth={3} /> : i + 1}
                  </span>
                  {s.label}
                  {s.done && <span className="visually-hidden"> (done)</span>}
                </li>
              ))}
            </ol>
          </>
        )}
      </aside>
    </section>
  )
}

/* Plan cards ---------------------------------------------------------------- */

function useCta(plan: Plan) {
  const { state } = useBilling()
  if (plan.id === 'business') return { kind: 'sales' as const, label: 'Talk to sales' }
  if (state.status === 'active' && state.planId === plan.id)
    return { kind: 'current' as const, label: 'Your current plan' }
  if (state.status === 'active' && !isUpgrade(state.planId, plan.id))
    return { kind: 'current' as const, label: 'Included in your plan' }
  if (!canSelectPlan(state)) return { kind: 'locked' as const, label: 'Available when plan ends or credits run out' }
  return { kind: 'select' as const, label: 'Select plan' }
}

function PlanCard({
  plan,
  title,
  featured,
  recommended,
  onChoose,
}: {
  plan: Plan
  title?: string
  featured?: boolean
  recommended: boolean
  onChoose: (id: PaidPlanId) => void
}) {
  const cta = useCta(plan)
  const { toast } = useUi()
  const headingId = useId()
  const monthly = perMonth(plan)
  const unit = perCredit(plan)

  return (
    <section
      className={`plan ${featured ? 'plan--featured plan--navy' : ''} ${recommended ? 'plan--recommended' : ''}`}
      aria-labelledby={headingId}
    >
      <div className="plan__badges">
        {recommended && (
          <Badge tone="positive">
            <CircleCheck size={12} aria-hidden /> Recommended
          </Badge>
        )}
        {plan.badge && <Badge tone={featured ? 'warning' : 'accent'}>{plan.badge}</Badge>}
      </div>
      <h3 id={headingId} className="plan__name">
        {title ?? plan.name}
      </h3>
      <p className="plan__summary">{plan.summary}</p>

      <div className="plan__figures">
        {plan.price === null ? (
          <>
            <p className="plan__unit plan__unit--lead">From $0.14 per credit</p>
          </>
        ) : (
          <>
            <p className="plan__amount">
              {formatPrice(monthly ?? plan.price)}
              <span>{plan.cycle ? 'per month' : 'one-time'}</span>
            </p>
            <p className="plan__credits">
              {formatCount(plan.credits ?? 0)}
              <span>{plan.cycle ? `credits/${plan.cycle}` : 'credits'}</span>
            </p>
            <p className="plan__unit">
              {formatPrice(unit ?? 0)} per credit
              {plan.cycle === 'year' && ` · billed ${formatPrice(plan.price)} yearly`}
            </p>
          </>
        )}
      </div>

      <Checklist items={plan.features} size="sm" />

      <div className="plan__cta">
        <Button
          block
          variant={cta.kind === 'select' && featured ? 'primary' : cta.kind === 'locked' ? 'quiet' : 'secondary'}
          aria-disabled={cta.kind === 'current' || cta.kind === 'locked' || undefined}
          className={cta.kind === 'current' ? 'btn--current' : cta.kind === 'locked' ? 'btn--locked' : undefined}
          icon={
            cta.kind === 'current' ? (
              <Check size={16} aria-hidden />
            ) : cta.kind === 'locked' ? (
              <Lock size={14} aria-hidden />
            ) : undefined
          }
          onClick={() => {
            if (cta.kind === 'sales') toast('Talk to sales isn’t connected in this prototype.')
            else if (cta.kind === 'locked')
              toast('You can choose a new plan when your current plan ends or your credits run out.')
            else if (cta.kind === 'select') onChoose(plan.id as PaidPlanId)
          }}
        >
          {cta.label}
        </Button>
      </div>
    </section>
  )
}

/* Compare plans and features ------------------------------------------------ */

type Cell = string | boolean
const COLUMNS: { id: PlanId; name: string; price: string; credits: string; popular?: boolean }[] = [
  { id: 'flex', name: 'Flex', price: '$249 one-time', credits: '623 credits' },
  { id: 'monthly', name: 'Growth Monthly', price: '$99 per month', credits: '267 credits' },
  { id: 'yearly', name: 'Growth Yearly', price: '$83.25 per month', credits: '3,047 credits', popular: true },
  { id: 'business', name: 'Business', price: 'Save up to 64%', credits: 'Volume-based credits' },
]

const ROWS: { label: string; info?: string; values: [Cell, Cell, Cell, Cell] }[] = [
  { label: 'All services access (KYB, AML, UBO etc.) via Portal & API', values: [true, true, true, true] },
  { label: 'Real-time data access', values: [true, true, true, true] },
  { label: 'Discounted reports', values: [false, 'Save 8%', 'Save 22%', 'Save up to 64%'] },
  { label: 'Top-up', values: ['One-time top-up', 'Unlimited top-ups', 'Unlimited top-ups', 'Volume-based'] },
  { label: 'Flexible commitment', values: [false, 'Cancel anytime', 'Cancel anytime', 'Contract terms'] },
  { label: 'Support type', values: ['Standard', 'Standard', 'Standard', 'Dedicated team'] },
  { label: 'User management & custom roles', values: [false, false, false, true] },
  { label: 'Service-level agreements (SLA)', values: [false, false, false, true] },
  {
    label: 'Access to premium features',
    info: 'Director Interest, Perpetual KYB and more.',
    values: [false, true, true, true],
  },
  { label: 'Custom integrations and webhooks', values: [false, false, false, true] },
  { label: 'Training & onboarding services', values: [false, false, false, true] },
]

function CellValue({ value }: { value: Cell }) {
  if (value === true)
    return (
      <span className="yes">
        <Check size={18} strokeWidth={2.5} aria-hidden />
        <span className="visually-hidden">Included</span>
      </span>
    )
  if (value === false)
    return (
      <span className="no">
        <Minus size={16} aria-hidden />
        <span className="visually-hidden">Not included</span>
      </span>
    )
  return <>{value}</>
}

function Compare() {
  const { state } = useBilling()
  const current = state.status === 'active' ? state.planId : null
  return (
    <>
      <h2 id="compare-title" className="section-card__title">
        Compare plans and features
      </h2>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Plan comparison">
        <table className="table table--compare">
          <caption className="visually-hidden">Features included in each plan</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">Feature</span>
              </th>
              {COLUMNS.map((c) => (
                <th key={c.id} scope="col" className={c.popular ? 'is-featured' : undefined}>
                  <span className="compare__name">{c.name}</span>
                  <span className="compare__price">{c.price}</span>
                  <span className="compare__credits">{c.credits}</span>
                  {c.popular && <Badge tone="accent">Most popular</Badge>}
                  {current === c.id && <span className="table__current">Your plan</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <th scope="row">
                  {row.label}
                  {row.info && <InfoTip label={`About ${row.label.toLowerCase()}`}>{row.info}</InfoTip>}
                </th>
                {row.values.map((v, i) => (
                  <td key={COLUMNS[i].id} className={COLUMNS[i].popular ? 'is-featured' : undefined}>
                    <CellValue value={v} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* Report credit rates ------------------------------------------------------- */

function CreditRates() {
  const [open, setOpen] = useState(false)
  const [tier, setTier] = useState<TierId>('t1')
  const panelId = useId()
  const rateRow = (r: StartingRate) => (
    <li key={r.label} className="rates__row">
      <span className="rates__label">
        {r.label}
        <InfoTip label={`About ${r.label}`}>{r.info}</InfoTip>
      </span>
      <span className="rates__from">
        Starting from {formatCount(r.from)} {r.from === 1 ? 'credit' : 'credits'}
      </span>
      {r.growthOnly && (
        <div className="notice notice--warning rates__note" role="note">
          <span className="notice__icon" aria-hidden>
            <AlertTriangle size={16} />
          </span>
          <div className="notice__body">
            <p className="notice__title">This feature is only available for Growth and Business users.</p>
            <p className="notice__text">
              Monitoring uses credits each time a monitored company's records change. If you don't have enough credits,
              monitoring stops until you top up.
            </p>
          </div>
        </div>
      )}
    </li>
  )

  return (
    <div className="rates-block" role="group" aria-labelledby="rates-title">
      <h2 id="rates-title" className="section-card__title section-card__title--sub">
        Report credit rates
      </h2>
      <div className="rates">
        <ul className="rates__col">{STARTING_RATES[0].map(rateRow)}</ul>
        <ul className="rates__col">{STARTING_RATES[1].map(rateRow)}</ul>
      </div>

      <button
        type="button"
        className="disclosure"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        Full pricing by jurisdiction &amp; report type
        <ChevronDown size={16} aria-hidden className={open ? 'is-open' : undefined} />
      </button>

      {open && (
        <div id={panelId} className="tiers">
          <div className="tiers__head">
            <p className="eyebrow eyebrow--muted">Jurisdiction tier: select to see its rates</p>
            <span className="tiers__count">
              {TIERS.find((t) => t.id === tier)?.name} · {TIER_RATES[tier].length} report types
            </span>
          </div>
          <div className="tiers__pick" role="radiogroup" aria-label="Jurisdiction tier">
            {TIERS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={tier === t.id}
                className="tier"
                onClick={() => setTier(t.id)}
              >
                <span className="tier__name">
                  {t.name}
                  {tier === t.id && <Badge tone="positive">Selected</Badge>}
                </span>
                <span className="tier__countries">{t.countries.join(', ')}</span>
              </button>
            ))}
          </div>
          <div className="table-wrap" role="region" aria-label={`${TIERS.find((t) => t.id === tier)?.name} credit rates`} tabIndex={0}>
            <table className="table table--head table--rates">
              <caption className="visually-hidden">Credit value per report type</caption>
              <thead>
                <tr>
                  <th scope="col">Report type</th>
                  <th scope="col" className="num">
                    Credit value
                  </th>
                </tr>
              </thead>
              <tbody>
                {TIER_RATES[tier].map((r) => (
                  <tr key={r.label}>
                    <td>
                      {r.label}
                      {r.growthOnly && <InfoTip label={`About ${r.label}`}>Available for Growth and Business plans only.</InfoTip>}
                      {r.note && <InfoTip label={`About ${r.label}`}>{r.note}</InfoTip>}
                    </td>
                    <td className="num">{r.credits.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* FAQ ------------------------------------------------------------------------ */

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: 'Where does AsiaVerify collect company information from?',
    a: 'AsiaVerify sources verified company data directly from official government registries and trusted data providers across Asia to ensure accuracy, reliability, and compliance.',
  },
  {
    q: 'How do the subscription plans work?',
    a: 'Flex is a one-time purchase of 623 credits that never expire. Growth is a subscription, billed monthly or yearly, that refreshes your credits at the start of each billing cycle. Business is priced with our sales team based on your volume.',
  },
  {
    q: 'What happens if I run out of credits mid-report?',
    a: 'You can top up anytime if you run out of credits before your billing cycle ends. Flex includes one top-up of 623 credits; Growth includes unlimited top-ups.',
  },
  {
    q: 'Can I switch between monthly and yearly billing?',
    a: 'Yes. Growth plans can be upgraded, downgraded or cancelled anytime from Billing & Subscription.',
  },
  {
    q: 'Do unused credits roll over?',
    a: 'Growth credits expire at the end of each billing period. Flex credits never expire.',
  },
  {
    q: 'Can multiple team members use the same account?',
    a: 'User management and custom roles are part of the Business plan. Talk to sales to set up access for your team.',
  },
]

function Faq() {
  const [open, setOpen] = useState(0)
  const baseId = useId()
  return (
    <section className="card section-card" aria-labelledby="faq-title">
      <p className="eyebrow">Support</p>
      <h2 id="faq-title" className="section-card__title">
        Frequently Asked Questions
      </h2>
      <p className="section-card__lede">Find answers to common questions about our pricing plans and credit system.</p>
      <div className="faq">
        {FAQS.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q} className={`faq__item ${isOpen ? 'is-open' : ''}`}>
              <h3>
                <button
                  type="button"
                  className="faq__q"
                  aria-expanded={isOpen}
                  aria-controls={`${baseId}-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  {f.q}
                  <ChevronDown size={16} aria-hidden />
                </button>
              </h3>
              {isOpen && (
                <div id={`${baseId}-${i}`} className="faq__a">
                  <p>{f.a}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
