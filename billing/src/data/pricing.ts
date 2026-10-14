// Report credit pricing by jurisdiction tier, from the Upgrade plan design (PRD figures).

export type TierId = 't1' | 't2' | 't3'

export interface Tier {
  id: TierId
  name: string
  countries: string[]
}

export const TIERS: Tier[] = [
  { id: 't1', name: 'Tier 1', countries: ['China', 'Japan', 'Taiwan', 'Vietnam', 'Thailand', 'India', 'New Zealand'] },
  { id: 't2', name: 'Tier 2', countries: ['Hong Kong', 'South Korea', 'Philippines', 'Singapore', 'Malaysia'] },
  { id: 't3', name: 'Tier 3', countries: ['Indonesia', 'Australia'] },
]

export function tierOf(country: string): TierId | undefined {
  return TIERS.find((t) => t.countries.includes(country))?.id
}

export interface RateRow {
  label: string
  credits: number
  note?: string
  /** Rows that apply only to Growth and Business plans. */
  growthOnly?: boolean
}

export const TIER_RATES: Record<TierId, RateRow[]> = {
  t1: [
    { label: 'KYB LITE', credits: 10 },
    { label: 'KYB BASIC', credits: 20 },
    { label: 'KYB BASIC + Direct UBO (China)', credits: 50 },
    { label: 'KYB COMPLETE (China)', credits: 125 },
    { label: 'KYB COMPLETE (Vietnam)', credits: 75 },
    { label: 'UBO (excl. Japan, Thailand & India)', credits: 100, note: 'Not published by the Japan, Thailand and India registries.' },
    { label: 'Perpetual KYB', credits: 10, growthOnly: true },
    { label: 'Legal Documents (Thailand, Japan, Hong Kong, China & Malaysia only)', credits: 25 },
    { label: 'AML & PEP Checks', credits: 1 },
  ],
  t2: [
    { label: 'KYB LITE', credits: 10 },
    { label: 'KYB BASIC', credits: 25 },
    { label: 'KYB COMPLETE (Hong Kong & Singapore)', credits: 125 },
    { label: 'UBO (excl. South Korea & Philippines)', credits: 200, note: 'Not published by the South Korea and Philippines registries.' },
    { label: 'Perpetual KYB (where KYB BASIC is available)', credits: 10, growthOnly: true },
    { label: 'Legal Doc (Hong Kong)', credits: 25 },
    { label: 'Legal Doc (Malaysia): Company & Audit Profile', credits: 50 },
    { label: 'Legal Doc (Malaysia): Corporate Registration & Particulars', credits: 100 },
    { label: 'Legal Doc (Malaysia): Shareholder & Financial Analysis', credits: 125 },
    { label: 'Legal Doc (Malaysia): Compliance Attestation & Long-Term Financials', credits: 200 },
    { label: 'AML & PEP Checks', credits: 1 },
  ],
  t3: [
    { label: 'KYB LITE', credits: 10 },
    { label: 'KYB BASIC', credits: 15 },
    { label: 'KYB BASIC + Direct UBO (Australia)', credits: 225 },
    { label: 'UBO (excl. Indonesia)', credits: 250, note: 'Not published by the Indonesia registry.' },
    { label: 'Perpetual KYB (where KYB BASIC is available)', credits: 10, growthOnly: true },
    { label: 'AML & PEP Checks', credits: 1 },
  ],
}

export interface StartingRate {
  label: string
  from: number
  info: string
  growthOnly?: boolean
}

/** "Starting from" rates shown above the tier tables, in the mockup's two columns. */
export const STARTING_RATES: [StartingRate[], StartingRate[]] = [
  [
    { label: 'KYB LITE', from: 10, info: 'Registration details and company status from the official registry.' },
    { label: 'KYB COMPLETE', from: 75, info: 'The full company profile, including risk overview and compliance checks.' },
    { label: 'Perpetual KYB', from: 10, info: 'Ongoing monitoring with alerts when registry records change.', growthOnly: true },
    { label: 'AML & PEP Checks', from: 1, info: 'Sanctions, watchlist and politically exposed person screening.' },
  ],
  [
    { label: 'KYB BASIC', from: 20, info: 'Registration details plus directors, officers and shareholders.' },
    { label: 'UBO', from: 100, info: 'Ultimate beneficial owners traced through the ownership chain.' },
    { label: 'Legal Documents', from: 25, info: 'Certified filings from the registry; price varies by document type.' },
  ],
]

export type ScopeId =
  | 'registration'
  | 'directors'
  | 'shareholders'
  | 'ubo-alerts'
  | 'legal-alerts'
  | 'risk-overview'
  | 'benchmark'
  | 'risk-assessment'
  | 'compliance'
  | 'ubo'
  | 'legal-docs'
  | 'pep'

export const SCOPES: { value: ScopeId; label: string }[] = [
  { value: 'registration', label: 'Registration information' },
  { value: 'directors', label: 'Directors & Officers' },
  { value: 'shareholders', label: 'Shareholders' },
  { value: 'ubo-alerts', label: 'Direct Ultimate Beneficial Owner Operational Alerts' },
  { value: 'legal-alerts', label: 'Legal Alerts' },
  { value: 'risk-overview', label: 'Risk Overview' },
  { value: 'benchmark', label: 'Industry Benchmark' },
  { value: 'risk-assessment', label: 'Risk Assessment' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'ubo', label: 'Ultimate Beneficial Owner' },
  { value: 'legal-docs', label: 'Legal Documents' },
  { value: 'pep', label: 'PEP & Sanctions' },
]

export const MALAYSIA_DOCS = [
  'Company & Audit Profile',
  'Corporate Registration & Particulars',
  'Shareholder & Financial Analysis',
  'Compliance Attestation & Long-Term Financials',
]

// Base report needed to cover a scope: LITE < BASIC < COMPLETE.
const BASE: Partial<Record<ScopeId, 'lite' | 'basic' | 'complete'>> = {
  registration: 'lite',
  directors: 'basic',
  shareholders: 'basic',
  'ubo-alerts': 'complete',
  'legal-alerts': 'complete',
  'risk-overview': 'complete',
  benchmark: 'complete',
  'risk-assessment': 'complete',
  compliance: 'complete',
}

const BASE_COST: Record<TierId, Record<'lite' | 'basic' | 'complete', number>> = {
  t1: { lite: 10, basic: 20, complete: 100 },
  t2: { lite: 10, basic: 25, complete: 125 },
  t3: { lite: 10, basic: 15, complete: 125 },
}
const UBO_COST: Record<TierId, number> = { t1: 100, t2: 200, t3: 250 }
const LEGAL_COST: Record<TierId, number> = { t1: 25, t2: 25, t3: 25 }

/** Estimated credits for one report in a tier, given the chosen scopes. */
export function creditsPerReport(tier: TierId, scopes: ScopeId[]) {
  const levels = scopes.map((s) => BASE[s]).filter(Boolean) as ('lite' | 'basic' | 'complete')[]
  const level = levels.includes('complete') ? 'complete' : levels.includes('basic') ? 'basic' : levels.length ? 'lite' : null
  let total = level ? BASE_COST[tier][level] : 0
  if (scopes.includes('ubo')) total += UBO_COST[tier]
  if (scopes.includes('legal-docs')) total += LEGAL_COST[tier]
  if (scopes.includes('pep')) total += 1
  return total
}
