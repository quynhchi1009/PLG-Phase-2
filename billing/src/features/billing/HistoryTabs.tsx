import { useState } from 'react'
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Download, FileText, ReceiptText } from 'lucide-react'
import { Tabs } from '../../components/ui/primitives'
import { SUBSCRIPTION_HISTORY, USAGE_HISTORY, formatDate } from '../../data/history'
import { formatAmount } from '../../data/plans'
import { TODAY, useBilling } from '../../state/billing'
import { useUi } from '../../state/ui'

type Tab = 'usage' | 'subscription'
const PAGE_SIZE = 5

export function HistoryTabs() {
  const [tab, setTab] = useState<Tab>('usage')
  const [page, setPage] = useState(0)
  const { toast } = useUi()
  const { state } = useBilling()

  // A lapsed account has no activity after its plan ended.
  const before = (date: string) => state.status !== 'none' || date < state.endedOn
  // A scheduled cancellation is part of the record, so it appears as its own row.
  const cancellation =
    state.status === 'cancelling'
      ? [{ id: 'cancellation', type: `Cancellation scheduled · ends ${formatDate(state.cycleEnd)}`, date: TODAY, amount: null }]
      : []
  const invoices: { id: string; type: string; date: string; amount: number | null }[] = [
    ...cancellation,
    ...state.events,
    ...SUBSCRIPTION_HISTORY.filter((r) => before(r.date)),
  ]
  const usage = [...state.generated, ...USAGE_HISTORY.filter((r) => before(r.date))]
  const rows = tab === 'subscription' ? invoices : usage
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const start = page * PAGE_SIZE
  const end = Math.min(rows.length, start + PAGE_SIZE)

  const switchTab = (next: Tab) => {
    setTab(next)
    setPage(0)
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
