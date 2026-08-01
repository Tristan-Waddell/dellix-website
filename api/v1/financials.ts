import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRoute, methodNotAllowed, HttpError } from '../_lib/http.js'
import { requireAuth } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'
import type { FinancialActivity, FinancialPeriod, FinancialsData } from '../../shared/types.js'

type StripeList<T> = { data: T[]; has_more: boolean }

type StripeBalance = {
  available: Array<{ amount: number; currency: string }>
  pending: Array<{ amount: number; currency: string }>
}

type StripeBalanceTransaction = {
  id: string
  amount: number
  fee: number
  net: number
  currency: string
  created: number
  available_on: number
  description: string | null
  reporting_category: string
  status: string
  type: string
}

type StripePayout = {
  id: string
  amount: number
  currency: string
  created: number
  arrival_date: number
  description: string | null
  status: string
}

type StripeCharge = {
  id: string
  amount: number
  amount_captured: number
  amount_refunded: number
  currency: string
  customer: string | null
  paid: boolean
  status: string
}

type StripeSubscription = {
  id: string
  status: string
  items: {
    data: Array<{
      quantity: number | null
      price: {
        currency: string
        unit_amount: number | null
        unit_amount_decimal: string | null
        recurring: { interval: 'day' | 'week' | 'month' | 'year'; interval_count: number } | null
      }
    }>
  }
}

type ActiveClientRow = { id: string; name: string; stripe_customer_id: string }

const STRIPE_API = 'https://api.stripe.com/v1'
const CACHE_TTL_MS = 60_000
const cache = new Map<string, { expires: number; data: FinancialsData }>()

function stripeKey() {
  const key = process.env.STRIPE_RESTRICTED_KEY ?? process.env.STRIPE_SECRET_KEY
  if (!key) throw new HttpError(503, 'Stripe financial reporting is not configured.')
  return key
}

async function stripeGet<T>(path: string, params?: URLSearchParams): Promise<T> {
  const url = new URL(`${STRIPE_API}/${path}`)
  if (params) url.search = params.toString()

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      'Stripe-Version': '2025-06-30.basil',
    },
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => null) as { error?: { message?: string } } | null
    const message = detail?.error?.message
    throw new HttpError(502, message ? `Stripe: ${message}` : 'Stripe request failed.')
  }

  return response.json() as Promise<T>
}

async function stripeList<T>(path: string, initial: URLSearchParams, maxPages = 50) {
  const rows: T[] = []
  let startingAfter: string | null = null
  let truncated = false

  for (let page = 0; page < maxPages; page += 1) {
    const params = new URLSearchParams(initial)
    params.set('limit', '100')
    if (startingAfter) params.set('starting_after', startingAfter)
    const result = await stripeGet<StripeList<T>>(path, params)
    rows.push(...result.data)

    if (!result.has_more || result.data.length === 0) return { rows, truncated }
    startingAfter = (result.data[result.data.length - 1] as { id: string }).id
    if (page === maxPages - 1) truncated = true
  }

  return { rows, truncated }
}

function utcStartOfMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function periodStart(period: FinancialPeriod): Date | null {
  const now = new Date()
  if (period === 'month') return utcStartOfMonth(now)
  if (period === 'year') return new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
  return null
}

function chartStart() {
  const start = utcStartOfMonth()
  start.setUTCMonth(start.getUTCMonth() - 11)
  return start
}

function activityType(transaction: StripeBalanceTransaction): FinancialActivity['type'] {
  const category = transaction.reporting_category
  if (category === 'charge') return 'payment'
  if (category === 'refund' || category === 'partial_capture_reversal') return 'refund'
  if (category === 'dispute' || category === 'dispute_reversal') return 'dispute'
  if (category === 'payout' || transaction.type.startsWith('payout')) return 'payout'
  if (category === 'fee' || transaction.type.includes('fee')) return 'fee'
  return 'other'
}

function monthlyBuckets(transactions: StripeBalanceTransaction[]) {
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = chartStart()
    date.setUTCMonth(date.getUTCMonth() + index)
    return {
      month: date.toISOString().slice(0, 7),
      gross_cents: 0,
      net_cents: 0,
    }
  })
  const byMonth = new Map(months.map((month) => [month.month, month]))

  for (const transaction of transactions) {
    const bucket = byMonth.get(new Date(transaction.created * 1000).toISOString().slice(0, 7))
    if (!bucket) continue
    if (transaction.reporting_category === 'charge' && transaction.amount > 0) bucket.gross_cents += transaction.amount
    if (REPORTING_ACTIVITY.has(transaction.reporting_category)) bucket.net_cents += transaction.net
  }

  return months
}

function monthlyAmount(item: StripeSubscription['items']['data'][number]) {
  const recurring = item.price.recurring
  if (!recurring) return 0
  const unitAmount = item.price.unit_amount ?? Number(item.price.unit_amount_decimal ?? 0)
  const amount = unitAmount * (item.quantity ?? 1)
  const count = Math.max(recurring.interval_count, 1)
  if (recurring.interval === 'day') return amount * (365 / 12) / count
  if (recurring.interval === 'week') return amount * (52 / 12) / count
  if (recurring.interval === 'year') return amount / (12 * count)
  return amount / count
}

const REPORTING_ACTIVITY = new Set([
  'charge',
  'charge_failure',
  'refund',
  'refund_failure',
  'partial_capture_reversal',
  'dispute',
  'dispute_reversal',
  'fee',
])

export default withRoute(async (req: VercelRequest, res: VercelResponse) => {
  await requireAuth(req, res)
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET'])
    return
  }

  const period = typeof req.query.period === 'string' ? req.query.period : 'year'
  if (!['month', 'year', 'all'].includes(period)) throw new HttpError(400, '"period" must be month, year, or all.')
  const financialPeriod = period as FinancialPeriod
  const currency = typeof req.query.currency === 'string' ? req.query.currency.toLowerCase() : 'usd'
  if (!/^[a-z]{3}$/.test(currency)) throw new HttpError(400, '"currency" must be a three-letter currency code.')

  const cacheKey = `${financialPeriod}:${currency}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    res.status(200).json({ financials: cached.data })
    return
  }

  const warnings: string[] = []
  const start = periodStart(financialPeriod)
  const graphStart = chartStart()
  const transactionStart = start ? new Date(Math.min(start.getTime(), graphStart.getTime())) : null
  const transactionParams = new URLSearchParams({ currency })
  if (transactionStart) transactionParams.set('created[gte]', Math.floor(transactionStart.getTime() / 1000).toString())

  const [balance, transactionResult, activeClientRows] = await Promise.all([
    stripeGet<StripeBalance>('balance'),
    stripeList<StripeBalanceTransaction>('balance_transactions', transactionParams),
    sql`select id, name, stripe_customer_id from contacts where is_active_client = true and stripe_customer_id is not null`,
  ])

  if (transactionResult.truncated) warnings.push('Transaction history was truncated at 5,000 records for this view.')
  const allTransactions = transactionResult.rows.filter((transaction) => transaction.currency === currency)
  const periodTransactions = start
    ? allTransactions.filter((transaction) => transaction.created >= Math.floor(start.getTime() / 1000))
    : allTransactions

  let grossCents = 0
  let feesCents = 0
  let refundsCents = 0
  let disputesCents = 0
  let netCents = 0

  for (const transaction of periodTransactions) {
    const category = transaction.reporting_category
    if (category === 'charge' && transaction.amount > 0) grossCents += transaction.amount
    if (category === 'refund') refundsCents += Math.abs(Math.min(transaction.amount, 0))
    if (category === 'dispute') disputesCents += Math.abs(Math.min(transaction.amount, 0))
    if (category === 'fee') feesCents += Math.max(Math.abs(transaction.amount), transaction.fee)
    else if (REPORTING_ACTIVITY.has(category)) feesCents += transaction.fee
    if (REPORTING_ACTIVITY.has(category)) netCents += transaction.net
  }

  const payoutParams = new URLSearchParams({})
  if (start) payoutParams.set('created[gte]', Math.floor(start.getTime() / 1000).toString())
  let payouts: StripePayout[] = []
  try {
    const result = await stripeList<StripePayout>('payouts', payoutParams, 20)
    payouts = result.rows.filter((payout) => payout.currency === currency)
    if (result.truncated) warnings.push('Payout history was truncated for this view.')
  } catch {
    warnings.push('The Stripe key cannot read payouts; payout totals are estimated from balance activity.')
  }

  const payoutFallback = periodTransactions
    .filter((transaction) => activityType(transaction) === 'payout')
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
  const payoutsCents = payouts.length
    ? payouts.filter((payout) => payout.status === 'paid').reduce((sum, payout) => sum + payout.amount, 0)
    : payoutFallback

  let mrrCents: number | null = null
  try {
    const subscriptions = await stripeList<StripeSubscription>('subscriptions', new URLSearchParams({ status: 'all' }), 20)
    mrrCents = Math.round(subscriptions.rows
      .filter((subscription) => subscription.status === 'active' || subscription.status === 'trialing')
      .flatMap((subscription) => subscription.items.data)
      .filter((item) => item.price.currency === currency)
      .reduce((sum, item) => sum + monthlyAmount(item), 0))
    if (subscriptions.truncated) warnings.push('Subscription history was truncated while calculating MRR.')
  } catch {
    warnings.push('The Stripe key cannot read subscriptions, so MRR is unavailable.')
  }

  const clients = activeClientRows as ActiveClientRow[]
  const clientTotals = new Map(clients.map((client) => [client.stripe_customer_id, {
    contact_id: client.id,
    name: client.name,
    stripe_customer_id: client.stripe_customer_id,
    gross_cents: 0,
    refunded_cents: 0,
    net_cents: 0,
  }]))

  if (clientTotals.size > 0) {
    try {
      const chargeParams = new URLSearchParams({})
      if (start) chargeParams.set('created[gte]', Math.floor(start.getTime() / 1000).toString())
      const charges = await stripeList<StripeCharge>('charges', chargeParams)
      for (const charge of charges.rows) {
        if (!charge.paid || charge.currency !== currency || !charge.customer) continue
        const total = clientTotals.get(charge.customer)
        if (!total) continue
        total.gross_cents += charge.amount_captured || charge.amount
        total.refunded_cents += charge.amount_refunded
        total.net_cents = total.gross_cents - total.refunded_cents
      }
      if (charges.truncated) warnings.push('Charge history was truncated while calculating client revenue.')
    } catch {
      warnings.push('The Stripe key cannot read charges, so revenue by active client is unavailable.')
    }
  }

  const recentActivity: FinancialActivity[] = periodTransactions.slice(0, 12).map((transaction) => ({
    id: transaction.id,
    type: activityType(transaction),
    description: transaction.description ?? transaction.reporting_category.replaceAll('_', ' '),
    amount_cents: transaction.amount,
    fee_cents: transaction.fee,
    net_cents: transaction.net,
    currency: transaction.currency,
    status: transaction.status,
    created_at: new Date(transaction.created * 1000).toISOString(),
  }))

  const financials: FinancialsData = {
    period: financialPeriod,
    period_start: start?.toISOString() ?? null,
    currency,
    updated_at: new Date().toISOString(),
    metrics: {
      gross_cents: grossCents,
      fees_cents: feesCents,
      refunds_cents: refundsCents,
      disputes_cents: disputesCents,
      net_cents: netCents,
      payouts_cents: payoutsCents,
      available_cents: balance.available.filter((item) => item.currency === currency).reduce((sum, item) => sum + item.amount, 0),
      pending_cents: balance.pending.filter((item) => item.currency === currency).reduce((sum, item) => sum + item.amount, 0),
      mrr_cents: mrrCents,
    },
    monthly_revenue: monthlyBuckets(allTransactions),
    recent_activity: recentActivity,
    client_revenue: [...clientTotals.values()].sort((a, b) => b.net_cents - a.net_cents),
    warnings,
  }

  cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, data: financials })
  res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
  res.status(200).json({ financials })
})
