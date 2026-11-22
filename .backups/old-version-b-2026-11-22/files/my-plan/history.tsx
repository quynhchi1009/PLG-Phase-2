import { useId, useState } from 'react'
import { ChevronDown, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, ReceiptText } from 'lucide-react'
import { Badge } from '../../components/ui/primitives'
import { PLANS, formatAmount, formatCount } from '../../data/plans'
import { SUBSCRIPTION_HISTORY, USAGE_HISTORY, addDays, formatDate } from '../../data/history'
import { useBilling, type BillingState } from '../../state/billing'
import { useUi } from '../../state/ui'
import { DateRange } from '../billing/HistoryTabs'
import { usePlanFlow } from './flow'
import { PAYMENT_GRACE_DAYS } from './view'

const PAGE_SIZE = 5

/* Pager: first, previous, next, last, with a live count. */
function usePaging(total: number) {
  const [page, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const start = current * PAGE_SIZE
  return { page: current, pages, start, end: Math.min(total, start + PAGE_SIZE), setPage }
}

function Pager({
  label,
  total,
  paging,
}: {
  label: string
  total: number
  paging: ReturnType<typeof usePaging>
}) {
  const { page, pages, start, end, setPage } = paging
  return (
    <nav className="pager" aria-label={`${label} pages`}>
      <span className="pager__count" aria-live="polite">
        {total ? `${start + 1}–${end} of ${total}` : 'No entries'}
      </span>
      <button type="button" className="icon-btn pager__btn" aria-label="First page" disabled={page === 0} onClick={() => setPage(0)}>
        <ChevronFirst size={16} aria-hidden />
      </button>
      <button type="button" className="icon-btn pager__btn" aria-label="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)}>
        <ChevronLeft size={16} aria-hidden />
      </button>
      <button type="button" className="icon-btn pager__btn" aria-label="Next page" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>
        <ChevronRight size={16} aria-hidden />
      </button>
      <button type="button" className="icon-btn pager__btn" aria-label="Last page" disabled={page >= pages - 1} onClick={() => setPage(pages - 1)}>
        <ChevronLast size={16} aria-hidden />
      </button>
    </nav>
  )
}

/* Credit history: credits used and credits added, newest first ------------------ */

type Channel = 'all' | 'API' | 'Portal'

interface CreditRow {
  id: string
  date: string
  activity: string
  detail: string
  channel: 'API' | 'Portal' | 'Billing'
  /** Negative when credits were used, positive when added. */
  credits: number
}

const addedCredits = (text: string) => {
  const m = text.match(/\(([\d,]+) credits\)/)
  return m ? Number(m[1].replace(/,/g, '')) : 0
}

function creditRows(state: BillingState): CreditRow[] {
  const before = (date: string) => state.status !== 'none' || date < state.endedOn
  const used: CreditRow[] = [...state.generated, ...USAGE_HISTORY.filter((r) => before(r.date))].map((r) => ({
    id: r.orderId,
    date: r.date,
    activity: r.report,
    detail: `${r.business} · Order ${r.orderId}`,
    channel: r.channel,
    credits: -r.credits,
  }))

  // Credits that arrived with a charge: top-ups, plan renewals and plan changes.
  const charges = [
    ...state.events.filter((e) => e.amount !== null),
    ...SUBSCRIPTION_HISTORY.filter((r) => before(r.date)),
  ]
  const added: CreditRow[] = charges.flatMap((e) => {
    const topUp = e.type.startsWith('Top-up')
    const plan = Object.values(PLANS).find((p) => e.type === p.name || e.type === `Upgrade to ${p.name}`)
    const renewal = plan && SUBSCRIPTION_HISTORY.some((r) => r.id === e.id)
    const credits = topUp ? addedCredits(e.type) : (plan?.credits ?? 0)
    if (!credits) return []
    return [
      {
        id: e.id,
        date: e.date,
        activity: topUp ? 'Top-up' : renewal ? 'Plan renewal' : e.type.startsWith('Upgrade') ? 'Plan change' : 'Plan started',
        detail: topUp ? 'Credits added once' : (plan?.name ?? e.type),
        channel: 'Billing' as const,
        credits,
      },
    ]
  })

  return [...used, ...added].sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)))
}

const signed = (n: number) => `${n > 0 ? '+' : '−'}${formatCount(Math.abs(n))}`

export function CreditHistory() {
  const { state } = useBilling()
  const { navigate } = useUi()
  const flow = usePlanFlow()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [channel, setChannel] = useState<Channel>('all')
  const headingId = useId()

  const all = creditRows(state)
  const rows = all.filter(
    (r) => (!from || r.date >= from) && (!to || r.date <= to) && (channel === 'all' || r.channel === channel),
  )
  const filtered = Boolean(from || to || channel !== 'all')
  const paging = usePaging(rows.length)
  const setRange = (f: string, t: string) => {
    setFrom(f)
    setTo(t)
    paging.setPage(0)
  }
  const clear = () => {
    setRange('', '')
    setChannel('all')
  }

  return (
    <section className="card pb-module pb-history" aria-labelledby={headingId}>
      <div className="pb-module__head">
        <h2 id={headingId} className="pb-module__title">
          Credit history
        </h2>
        <div className="pb-filters">
          <DateRange from={from} to={to} onChange={setRange} label="Date" />
          <span className="history__channel">
            <select
              className="select"
              aria-label="Channel"
              value={channel}
              onChange={(e) => {
                setChannel(e.target.value as Channel)
                paging.setPage(0)
              }}
            >
              <option value="all">All channels</option>
              <option value="API">API</option>
              <option value="Portal">Portal</option>
            </select>
            <ChevronDown className="select__chevron" size={16} aria-hidden />
          </span>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table table--head pb-table pb-table--credits">
          <caption className="visually-hidden">Credits used and added</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Activity</th>
              <th scope="col">Channel</th>
              <th scope="col" className="num">
                Credits
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="table__empty" colSpan={4}>
                  {filtered ? (
                    <>
                      No credit activity matches these filters.{' '}
                      <button type="button" className="text-btn" onClick={clear}>
                        Clear filters
                      </button>
                    </>
                  ) : state.status === 'none' ? (
                    <>
                      No credit activity yet.{' '}
                      <button type="button" className="text-btn" onClick={() => flow.openChangePlan()}>
                        Choose a plan
                      </button>{' '}
                      to start generating reports.
                    </>
                  ) : (
                    <>
                      No credit activity yet. Credits you use and add will show here.{' '}
                      <button type="button" className="text-btn" onClick={() => navigate('report')}>
                        Generate a report
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )}
            {rows.slice(paging.start, paging.end).map((r) => (
              <tr key={r.id}>
                <td className="nowrap">{formatDate(r.date)}</td>
                <td>
                  <span className="strong">{r.activity}</span>
                  <span className="table__sub">{r.detail}</span>
                </td>
                <td>{r.channel}</td>
                <td className={`num pb-credits ${r.credits > 0 ? 'is-added' : ''}`}>
                  <span className="visually-hidden">{r.credits > 0 ? 'Added ' : 'Used '}</span>
                  {signed(r.credits)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager label="Credit history" total={rows.length} paging={paging} />
    </section>
  )
}

/* Payment history: charges, each with a receipt link ---------------------------- */

interface PayRow {
  id: string
  date: string
  description: string
  amount: number
  failed: boolean
}

function paymentRows(state: BillingState): PayRow[] {
  const before = (date: string) => state.status !== 'none' || date < state.endedOn
  const plan = PLANS[state.planId]
  const paid: PayRow[] = [
    ...state.events.filter((e) => e.amount !== null),
    ...SUBSCRIPTION_HISTORY.filter((r) => before(r.date)),
  ].map((e) => ({ id: e.id, date: e.date, description: e.type, amount: e.amount ?? 0, failed: false }))

  // A failed renewal is a charge too: it stays in the list so the customer can see what went wrong.
  const failedOn = state.paymentFailedOn
    ? state.paymentFailedOn
    : state.status === 'none' && state.endReason === 'payment-failed'
      ? addDays(state.endedOn, -PAYMENT_GRACE_DAYS)
      : ''
  const failed: PayRow[] = failedOn
    ? [{ id: 'failed', date: failedOn, description: `${plan.name} renewal`, amount: plan.price ?? 0, failed: true }]
    : []

  return [...failed, ...paid].sort((a, b) => b.date.localeCompare(a.date))
}

export function PaymentHistory() {
  const { state } = useBilling()
  const { toast } = useUi()
  const flow = usePlanFlow()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const headingId = useId()

  const rows = paymentRows(state).filter((r) => (!from || r.date >= from) && (!to || r.date <= to))
  const filtered = Boolean(from || to)
  const paging = usePaging(rows.length)
  const setRange = (f: string, t: string) => {
    setFrom(f)
    setTo(t)
    paging.setPage(0)
  }

  return (
    <section className="card pb-module pb-history" aria-labelledby={headingId}>
      <div className="pb-module__head">
        <h2 id={headingId} className="pb-module__title">
          Payment history
        </h2>
        <div className="pb-filters">
          <DateRange from={from} to={to} onChange={setRange} label="Payment date" />
        </div>
      </div>

      <div className="table-wrap">
        <table className="table table--head pb-table pb-table--pay">
          <caption className="visually-hidden">Payments and receipts</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Description</th>
              <th scope="col" className="num">
                Amount
              </th>
              <th scope="col" className="center">
                Receipt
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="table__empty" colSpan={4}>
                  {filtered ? (
                    <>
                      No payments in these dates.{' '}
                      <button type="button" className="text-btn" onClick={() => setRange('', '')}>
                        Clear dates
                      </button>
                    </>
                  ) : state.status === 'none' ? (
                    <>
                      No payments yet.{' '}
                      <button type="button" className="text-btn" onClick={() => flow.openChangePlan()}>
                        Choose a plan
                      </button>
                    </>
                  ) : (
                    'No payments yet. Charges and receipts will show here.'
                  )}
                </td>
              </tr>
            )}
            {rows.slice(paging.start, paging.end).map((r) => (
              <tr key={r.id} className={r.failed ? 'table__event' : undefined}>
                <td className="nowrap">{formatDate(r.date)}</td>
                <td className="strong">{r.description}</td>
                <td className="num nowrap">
                  {formatAmount(r.amount)} {r.failed && <Badge tone="negative">Failed</Badge>}
                </td>
                <td className="center">
                  {r.failed ? (
                    <span aria-label="No receipt">—</span>
                  ) : (
                    <button
                      type="button"
                      className="text-btn pb-receipt"
                      aria-label={`Receipt for ${formatDate(r.date)}`}
                      onClick={() => toast('Receipts open from Stripe, which isn’t connected in this prototype.')}
                    >
                      <ReceiptText size={14} aria-hidden />
                      Receipt
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager label="Payment history" total={rows.length} paging={paging} />
      <p className="history__foot">
        Please <a href="mailto:support@asiaverify.com">contact support</a> for any billing questions.
      </p>
    </section>
  )
}
