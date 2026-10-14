import { useId, useState } from 'react'
import { Check, Coins } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge, Tabs } from '../../components/ui/primitives'
import { formatCount } from '../../data/plans'
import { TODAY, useBilling } from '../../state/billing'
import { useUi } from '../../state/ui'
import { UpgradePrompt } from '../upgrade/UpgradePrompt'

// A sample entity for the prototype. Fictional company and registration number.
const ENTITY = {
  name: 'Shenzhen Lianhe Digital Systems Co., Ltd',
  local: '深圳联合数码系统有限公司',
  regNo: '91440300MA5F0EXAMPLE',
  jurisdiction: 'China',
}

const REPORTS = [
  { id: 'lite', name: 'KYB LITE', detail: 'Business registration details and company status', credits: 10 },
  { id: 'basic', name: 'KYB BASIC', detail: 'Lite report plus directors, officers and shareholders', credits: 20 },
  { id: 'basic-ubo', name: 'KYB BASIC + Direct UBO', detail: 'Basic report plus direct ultimate beneficial owners', credits: 50 },
  { id: 'complete', name: 'KYB COMPLETE', detail: 'Full profile with risk overview, compliance and financials', credits: 125 },
]

type Tab = 'products' | 'kyb' | 'ubo' | 'legal'

export function ReportPage() {
  const { state, dispatch } = useBilling()
  const { toast } = useUi()
  const [tab, setTab] = useState<Tab>('kyb')
  const [report, setReport] = useState('basic')
  const [aml, setAml] = useState(false)
  const [prompt, setPrompt] = useState(false)
  const groupId = useId()

  const chosen = REPORTS.find((r) => r.id === report)!
  const total = chosen.credits + (aml ? 1 : 0)
  const enough = state.creditsRemaining >= total
  const inactive = state.status === 'none'

  const generate = () => {
    if (inactive) return toast('Choose a plan to generate new reports.')
    if (!enough) return setPrompt(true)
    dispatch({ type: 'generate', report: chosen.name, business: ENTITY.name, credits: total, today: TODAY })
    toast(`${chosen.name} report requested for ${ENTITY.name}. ${total} credits used.`)
  }

  return (
    <div className="page page--report">
      <Tabs<Tab>
        label="Report products"
        idPrefix="products"
        value={tab}
        onChange={(t) => (t === 'kyb' ? setTab(t) : toast('Only KYB reports are part of this billing prototype.'))}
        tabs={[
          { id: 'products', label: 'Our Products' },
          { id: 'kyb', label: 'Know Your Business (KYB)' },
          { id: 'ubo', label: 'Ultimate Beneficial Owner (UBO)' },
          { id: 'legal', label: 'Legal Documents' },
        ]}
      />

      <header className="entity" role="tabpanel" id="products-panel-kyb" aria-labelledby="products-tab-kyb">
        <h1 className="entity__name">
          {ENTITY.name} <span className="entity__local">| {ENTITY.local}</span>
        </h1>
        <p className="entity__meta">
          Business registration no. {ENTITY.regNo}
          <Badge tone="neutral">{ENTITY.jurisdiction}</Badge>
        </p>
      </header>

      <div className="report-grid">
        <section className="card report-options" aria-labelledby={`${groupId}-title`}>
          <h2 id={`${groupId}-title`} className="report-options__title">
            Know Your Business (KYB) reports
          </h2>
          <div role="radiogroup" aria-labelledby={`${groupId}-title`} className="report-list">
            {REPORTS.map((r) => (
              <label key={r.id} className={`report-option ${report === r.id ? 'is-selected' : ''}`}>
                <input type="radio" name={groupId} value={r.id} checked={report === r.id} onChange={() => setReport(r.id)} />
                <span className="report-option__radio" aria-hidden />
                <span className="report-option__text">
                  <strong>{r.name}</strong>
                  <span>{r.detail}</span>
                </span>
                <span className="report-option__credits">{r.credits} credits</span>
              </label>
            ))}
          </div>

          <h3 className="report-options__sub">Report add-ons</h3>
          <p className="report-options__hint">Choose add-ons for your selected report.</p>
          <label className="check report-addon">
            <input type="checkbox" checked={aml} onChange={(e) => setAml(e.target.checked)} />
            <span className="check__box" aria-hidden>
              <Check size={12} strokeWidth={3.5} />
            </span>
            <span>
              <strong>AML report</strong>
              <span className="report-addon__detail">Sanctions and watchlist screening for {ENTITY.name} · 1 credit</span>
            </span>
          </label>
        </section>

        <aside className="card report-summary" aria-label="Report summary">
          <h2 className="report-summary__title">Your report</h2>
          <dl className="facts">
            <div>
              <dt>{chosen.name}</dt>
              <dd>{chosen.credits} credits</dd>
            </div>
            {aml && (
              <div>
                <dt>AML report</dt>
                <dd>1 credit</dd>
              </div>
            )}
            <div className="facts__total">
              <dt>Total</dt>
              <dd>{total} credits</dd>
            </div>
          </dl>
          <p className={`report-summary__balance ${enough ? '' : 'is-short'}`}>
            <Coins size={16} aria-hidden />
            {formatCount(state.creditsRemaining)} credits available
            {!enough && !inactive && <span> · {formatCount(total - state.creditsRemaining)} short</span>}
          </p>
          <Button block onClick={generate}>
            Generate report
          </Button>
        </aside>
      </div>

      <UpgradePrompt open={prompt} onClose={() => setPrompt(false)} reason="insufficient" />
    </div>
  )
}
