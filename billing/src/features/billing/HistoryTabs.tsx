import { useEffect, useId, useRef, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ReceiptText,
  X,
} from 'lucide-react'
import { Tabs } from '../../components/ui/primitives'
import { SUBSCRIPTION_HISTORY, USAGE_HISTORY, formatDate, type UsageRow } from '../../data/history'
import { formatAmount } from '../../data/plans'
import { TODAY, useBilling } from '../../state/billing'
import { useUi } from '../../state/ui'

type Tab = 'usage' | 'subscription'
type Channel = 'all' | UsageRow['channel']
const PAGE_SIZE = 5

export function HistoryTabs() {
  const [tab, setTab] = useState<Tab>('usage')
  const [page, setPage] = useState(0)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [channel, setChannel] = useState<Channel>('all')
  const { toast } = useUi()
  const { state } = useBilling()

  // A lapsed account has no activity after its plan ended.
  const before = (date: string) => state.status !== 'none' || date < state.endedOn
  // A scheduled cancellation is part of the record, so it appears as its own row.
  const cancellation =
    state.status === 'cancelling'
      ? [{ id: 'cancellation', type: `Cancellation scheduled · ends ${formatDate(state.cycleEnd)}`, date: TODAY, amount: null }]
      : []
  // An auto-cancellation after a failed renewal is recorded on the day the plan ended.
  const autoCancel =
    state.status === 'none' && state.endReason === 'payment-failed'
      ? [{ id: 'auto-cancel', type: 'Payment failed · subscription cancelled', date: state.endedOn, amount: null }]
      : []
  const invoices: { id: string; type: string; date: string; amount: number | null }[] = [
    ...cancellation,
    ...autoCancel,
    ...state.events,
    ...SUBSCRIPTION_HISTORY.filter((r) => before(r.date)),
  ]
  const allUsage = [...state.generated, ...USAGE_HISTORY.filter((r) => before(r.date))]
  const usage = allUsage.filter(
    (r) => (!from || r.date >= from) && (!to || r.date <= to) && (channel === 'all' || r.channel === channel),
  )
  const filtered = Boolean(from || to || channel !== 'all')
  const rows = tab === 'subscription' ? invoices : usage
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const start = page * PAGE_SIZE
  const end = Math.min(rows.length, start + PAGE_SIZE)

  const switchTab = (next: Tab) => {
    setTab(next)
    setPage(0)
  }

  const setRange = (nextFrom: string, nextTo: string) => {
    setFrom(nextFrom)
    setTo(nextTo)
    setPage(0)
  }

  const clearFilters = () => {
    setRange('', '')
    setChannel('all')
  }

  const download = (kind: 'invoice' | 'receipt', id: string) =>
    toast(`Downloading ${kind} ${id} isn't connected in this prototype.`)

  return (
    <section className="card history" aria-label="Billing history">
      <Tabs<Tab>
        label="Billing history"
        idPrefix="history"
        value={tab}
        onChange={switchTab}
        tabs={[
          { id: 'usage', label: 'Usage history', icon: <FileText size={16} aria-hidden /> },
          { id: 'subscription', label: 'Subscription history', icon: <ReceiptText size={16} aria-hidden /> },
        ]}
      />
      <div
        role="tabpanel"
        id={`history-panel-${tab}`}
        aria-labelledby={`history-tab-${tab}`}
        className="history__panel"
        tabIndex={0}
      >
        {tab === 'usage' && (
          <div className="history__filters">
            <DateRange from={from} to={to} onChange={setRange} />
            <span className="history__channel">
              <select
                className="select"
                aria-label="Channel"
                value={channel}
                onChange={(e) => {
                  setChannel(e.target.value as Channel)
                  setPage(0)
                }}
              >
                <option value="all">All channels</option>
                <option value="API">API</option>
                <option value="Portal">Portal</option>
              </select>
              <ChevronDown className="select__chevron" size={16} aria-hidden />
            </span>
          </div>
        )}

        <div className="table-wrap">
          {tab === 'subscription' ? (
            <table className="table table--head">
              <caption className="visually-hidden">Subscription payments</caption>
              <thead>
                <tr>
                  <th scope="col">Subscription type</th>
                  <th scope="col">Billing date</th>
                  <th scope="col" className="num">
                    Amount paid
                  </th>
                  <th scope="col" className="center">
                    Invoice
                  </th>
                  <th scope="col" className="center">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(start, end).map((row) =>
                  row.amount === null ? (
                    <tr key={row.id} className="table__event">
                      <td className="strong">{row.type}</td>
                      <td className="nowrap">{formatDate(row.date)}</td>
                      <td className="num" aria-label="No charge">
                        —
                      </td>
                      <td className="center" colSpan={2}>
                        <span className="visually-hidden">No documents</span>
                      </td>
                    </tr>
                  ) : (
                  <tr key={row.id}>
                    <td>{row.type}</td>
                    <td className="nowrap">{formatDate(row.date)}</td>
                    <td className="num">{formatAmount(row.amount)}</td>
                    <td className="center">
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Download invoice for ${formatDate(row.date)}`}
                        onClick={() => download('invoice', row.id)}
                      >
                        <Download size={16} aria-hidden />
                      </button>
                    </td>
                    <td className="center">
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Download receipt for ${formatDate(row.date)}`}
                        onClick={() => download('receipt', row.id)}
                      >
                        <Download size={16} aria-hidden />
                      </button>
                    </td>
                  </tr>
                  ),
                )}
              </tbody>
            </table>
          ) : (
            <table className="table table--head">
              <caption className="visually-hidden">Report credit usage</caption>
              <thead>
                <tr>
                  <th scope="col">Report type</th>
                  <th scope="col">Business name</th>
                  <th scope="col">Order ID</th>
                  <th scope="col">Channel</th>
                  <th scope="col" className="num">
                    Credits used
                  </th>
                  <th scope="col">Date generated</th>
                </tr>
              </thead>
              <tbody>
                {usage.length === 0 && (
                  <tr>
                    <td className="table__empty" colSpan={6}>
                      {filtered ? (
                        <>
                          No reports match these filters.{' '}
                          <button type="button" className="text-btn" onClick={clearFilters}>
                            Clear filters
                          </button>
                        </>
                      ) : (
                        'No reports generated yet.'
                      )}
                    </td>
                  </tr>
                )}
                {usage.slice(start, end).map((row) => (
                  <tr key={row.orderId}>
                    <td className="nowrap">{row.report}</td>
                    <td className="strong">{row.business}</td>
                    <td className="mono">{row.orderId}</td>
                    <td>{row.channel}</td>
                    <td className="num">{row.credits}</td>
                    <td className="nowrap">{formatDate(row.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <nav className="pager" aria-label={`${tab === 'usage' ? 'Usage' : 'Subscription'} history pages`}>
          <span className="pager__count" aria-live="polite">
            {rows.length ? `${start + 1}–${end} of ${rows.length}` : 'No entries'}
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

        <p className="history__foot">
          Please <a href="mailto:support@asiaverify.com">contact support</a> for any billing questions.
        </p>
      </div>
    </section>
  )
}

/* Date range filter ---------------------------------------------------------- */

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  )

function DateRange({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const summary =
    from && to ? `${shortDate(from)} – ${shortDate(to)}` : from ? `From ${shortDate(from)}` : to ? `Until ${shortDate(to)}` : ''

  return (
    <div className="date-range" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`select ${open ? 'is-open' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={summary ? `Date generated: ${summary}` : 'Filter by date generated'}
        onClick={() => setOpen((o) => !o)}
      >
        <CalendarDays className="select__chevron" size={16} aria-hidden />
        {summary ? (
          <span className="select__value">{summary}</span>
        ) : (
          <span className="select__placeholder">Date from - Date to</span>
        )}
      </button>
      {summary && (
        <button type="button" className="icon-btn date-range__clear" aria-label="Clear dates" onClick={() => onChange('', '')}>
          <X size={14} aria-hidden />
        </button>
      )}
      {open && (
        <div id={panelId} className="select__menu date-range__panel" role="group" aria-label="Date generated">
          <label className="date-range__field">
            <span>Date from</span>
            <input
              type="date"
              className="input input--sm"
              value={from}
              max={to || undefined}
              onChange={(e) => onChange(e.target.value, to)}
            />
          </label>
          <label className="date-range__field">
            <span>Date to</span>
            <input
              type="date"
              className="input input--sm"
              value={to}
              min={from || undefined}
              onChange={(e) => onChange(from, e.target.value)}
            />
          </label>
        </div>
      )}
    </div>
  )
}
