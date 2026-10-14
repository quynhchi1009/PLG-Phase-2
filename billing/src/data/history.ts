// Synthetic account history for the prototype. Business names are fictional.

export interface InvoiceRow {
  id: string
  type: string
  date: string // ISO date
  amount: number
}

export interface UsageRow {
  orderId: string
  date: string // ISO date
  report: string
  business: string
  channel: 'API' | 'Portal'
  credits: number
}

export const SUBSCRIPTION_HISTORY: InvoiceRow[] = [
  { id: 'INV-2026-0928', type: 'Growth (billed monthly)', date: '2026-09-28', amount: 99 },
  { id: 'INV-2026-0828', type: 'Growth (billed monthly)', date: '2026-08-28', amount: 99 },
  { id: 'INV-2026-0814', type: 'Top-up (100 credits)', date: '2026-08-14', amount: 39 },
  { id: 'INV-2026-0728', type: 'Growth (billed monthly)', date: '2026-07-28', amount: 99 },
  { id: 'INV-2026-0628', type: 'Growth (billed monthly)', date: '2026-06-28', amount: 99 },
  { id: 'INV-2026-0528', type: 'Growth (billed monthly)', date: '2026-05-28', amount: 99 },
]

export const USAGE_HISTORY: UsageRow[] = [
  { orderId: '0000000112', date: '2026-10-13', report: 'KYB COMPLETE', business: 'GreenThumb Landscaping', channel: 'API', credits: 12 },
  { orderId: '0000000111', date: '2026-10-09', report: 'KYB BASIC', business: 'Urban Garden Experts', channel: 'API', credits: 4 },
  { orderId: '0000000110', date: '2026-10-06', report: 'KYB LITE', business: 'Sunshine Fields', channel: 'Portal', credits: 2 },
  { orderId: '0000000109', date: '2026-10-02', report: 'KYB COMPLETE', business: 'Sunshine Fields', channel: 'Portal', credits: 12 },
  { orderId: '0000000108', date: '2026-09-30', report: 'UBO REPORT', business: 'Harbourline Trading', channel: 'Portal', credits: 6 },
  { orderId: '0000000107', date: '2026-09-22', report: 'KYB BASIC', business: 'Lotus Bay Logistics', channel: 'API', credits: 4 },
  { orderId: '0000000106', date: '2026-09-03', report: 'KYB COMPLETE', business: 'Mekong Agritech', channel: 'Portal', credits: 12 },
  { orderId: '0000000105', date: '2026-08-21', report: 'KYB LITE', business: 'Northbridge Components', channel: 'API', credits: 2 },
]

const DAY = 86_400_000

export function addDays(iso: string, days: number) {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10)
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`))
}
