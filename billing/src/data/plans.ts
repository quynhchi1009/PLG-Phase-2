// Plan catalogue. Prices and credit counts follow the PLG Phase 2 PRD.

export type PlanId = 'flex' | 'monthly' | 'yearly' | 'business'

export interface PlanFeature {
  title: string
  detail?: string
}

export interface Plan {
  id: PlanId
  /** Product tier the customer sees on their billing page. */
  tier: string
  name: string
  summary: string
  /** Amount charged per billing cycle in USD; null for sales-led pricing. */
  price: number | null
  /** Credits granted per billing cycle (or once, for Flex). */
  credits: number | null
  /** null for one-time (Flex) and sales-led (Business) plans. */
  cycle: 'month' | 'year' | null
  badge?: string
  features: PlanFeature[]
}

const VERIFICATION: PlanFeature = {
  title: 'Full verification suite:',
  detail: 'KYB, AML & UBO checks, with real-time monitoring across Asia',
}

export const PLANS: Record<PlanId, Plan> = {
  flex: {
    id: 'flex',
    tier: 'Flex',
    name: 'Flex',
    summary: 'For low-commitment users trying AsiaVerify for the first time, with a one-time credit top-up',
    price: 249,
    credits: 623,
    cycle: null,
    features: [
      VERIFICATION,
      {
        title: 'No commitment:',
        detail: 'one-time payment, no recurring fees, credits & Portal access never expire',
      },
      { title: 'One-time top-up:', detail: 'add 623 more credits for $249, or upgrade to Growth' },
      { title: 'API access:', detail: 'included until your credits run out' },
    ],
  },
  monthly: {
    id: 'monthly',
    tier: 'Growth',
    name: 'Growth (billed monthly)',
    summary: 'For organisations running frequent KYB, AML & UBO checks for ongoing compliance',
    price: 99,
    credits: 267,
    cycle: 'month',
    badge: 'Save 8%',
    features: [
      VERIFICATION,
      { title: 'Full flexibility:', detail: 'unlimited top-ups, upgrade, or cancel anytime' },
      { title: 'API access:', detail: "unlimited use for as long as you're subscribed" },
      {
        title: 'Recurring billing:',
        detail: 'auto-renews monthly; unused credits expire at the end of each billing period',
      },
    ],
  },
  yearly: {
    id: 'yearly',
    tier: 'Growth',
    name: 'Growth (billed yearly)',
    summary: 'For organisations running frequent KYB, AML & UBO checks for ongoing compliance',
    price: 999,
    credits: 3047,
    cycle: 'year',
    badge: 'Save 22%',
    features: [
      VERIFICATION,
      { title: 'Full flexibility:', detail: 'unlimited top-ups, upgrade, or cancel anytime' },
      { title: 'API access:', detail: "unlimited use for as long as you're subscribed" },
      {
        title: 'Recurring billing:',
        detail: 'auto-renews yearly; unused credits expire at the end of each billing period',
      },
    ],
  },
  business: {
    id: 'business',
    tier: 'Business',
    name: 'Business',
    summary: 'Full platform access with API/bulk data and dedicated enterprise support',
    price: null,
    credits: null,
    cycle: null,
    badge: 'Save up to 64%',
    features: [
      VERIFICATION,
      { title: 'User management & custom roles:', detail: 'streamline team access and workflow' },
      {
        title: 'API access, premium features and custom integrations:',
        detail: 'connect your systems and explore our premium features and bespoke endpoints',
      },
      { title: 'Dedicated support & service:', detail: 'personalised assistance for your team' },
    ],
  },
}

/** Plans only move up while active: there is no downgrade flow. */
export const PLAN_RANK: Record<PlanId, number> = { flex: 0, monthly: 1, yearly: 2, business: 3 }

export function isUpgrade(from: PlanId, to: PlanId) {
  return PLAN_RANK[to] > PLAN_RANK[from]
}

/** Credit packs bought on top of a plan. Flex allows one; Growth allows unlimited. */
export const TOP_UP: Record<'flex' | 'monthly' | 'yearly', { credits: number; price: number; once: boolean }> = {
  flex: { credits: 623, price: 249, once: true },
  monthly: { credits: 267, price: 99, once: false },
  yearly: { credits: 267, price: 99, once: false },
}

/** What a customer gains by moving to a plan, shown in upgrade dialogs. */
export const UPGRADE_PERKS: Record<'monthly' | 'yearly', PlanFeature[]> = {
  monthly: [
    { title: 'Better value:', detail: 'save up to 8% per report' },
    { title: 'Full flexibility:', detail: 'unlimited top-ups, upgrade or cancel anytime' },
    { title: 'Unlimited API access:', detail: "unlimited use for as long as you're subscribed" },
    { title: 'Recurring billing:', detail: 'auto-renews monthly' },
  ],
  yearly: [
    { title: 'Better value:', detail: 'save up to 22% per report' },
    { title: 'Full flexibility:', detail: 'unlimited top-ups, upgrade or cancel anytime' },
    { title: 'Unlimited API access:', detail: "unlimited use for as long as you're subscribed" },
    { title: 'Recurring billing:', detail: 'auto-renews yearly' },
  ],
}

/** Monthly-equivalent price, used to compare the two Growth plans. */
export function perMonth(plan: Plan) {
  if (plan.price === null || plan.cycle === null) return null
  return plan.cycle === 'year' ? plan.price / 12 : plan.price
}

export const RECOMMEND_BLURB: Record<PlanId, string> = {
  flex: 'A one-time purchase to try the core features. Fixed credits with a one-time manual top-up.',
  monthly: 'A monthly subscription with credits that refresh every billing cycle. Cancel anytime.',
  yearly: 'Your best value per credit, with credits refreshed every year and unlimited top-ups.',
  business: 'Volume pricing, API and bulk data, and a dedicated team for your usage.',
}

export function perCredit(plan: Plan) {
  if (plan.price === null || !plan.credits) return null
  return plan.price / plan.credits
}

/** What an active Growth plan includes, shown on the subscription card. */
export function planBreakdown(plan: Plan): string[] {
  if (plan.cycle === null)
    return [
      'One-time purchase: credits and Portal access never expire.',
      'Access to all features available in the Portal',
      'Add 623 more credits for $249 once, or upgrade to Growth anytime.',
      'Sales and client support',
    ]
  const cadence = plan.cycle === 'year' ? 'Yearly' : 'Monthly'
  return [
    `${cadence} access: credits refresh automatically at the start of each billing cycle.`,
    'Access to all features available in the Portal',
    'Top up anytime if you run out of credits before the billing cycle ends.',
    'Sales and client support',
  ]
}

/** What a cancelling customer keeps by choosing a plan again. */
export const RESUBSCRIBE_GAINS: PlanFeature[] = [
  {
    title: '340M+ corporate records',
    detail: 'Access shareholder and UBO data from official Asian registries',
  },
  {
    title: 'Full Portal features',
    detail: 'Generate KYB and UBO reports, plus exclusive compliance add-ons',
  },
]

/** Perks lost on cancelling, shown in the first cancel dialog. */
export const CANCEL_PERKS: PlanFeature[] = [
  {
    title: 'Real-time data across 340M+ Asian corporate records',
    detail: 'for instant monitoring and risk insights',
  },
  { title: 'Uninterrupted access', detail: 'to generate reports' },
  {
    title: 'Simplified compliance and faster decision-making',
    detail: 'with reports and insights in one platform',
  },
]

/** Days a lapsed account keeps its report history. */
export const REPORT_RETENTION_DAYS = 90

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatCount(n: number) {
  return new Intl.NumberFormat('en-US').format(n)
}
