import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../../components/Icon.tsx'
import { RevenueChart } from '../components/RevenueChart.tsx'
import { financials, ApiError } from '../api.ts'
import type { FinancialActivity, FinancialPeriod, FinancialsData } from '../../../shared/types.ts'

const periodLabels: Record<FinancialPeriod, string> = {
  month: 'This month',
  year: 'Year to date',
  all: 'All time',
}

function formatMoney(cents: number, currency: string, sign = false) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
    signDisplay: sign ? 'exceptZero' : 'auto',
  }).format(cents / 100)
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function FinancialsPage() {
  const [period, setPeriod] = useState<FinancialPeriod>('year')
  const [data, setData] = useState<FinancialsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    financials.get(period)
      .then((response) => setData(response.financials))
      .catch((loadError) => setError(loadError instanceof ApiError ? loadError.message : 'Could not load Stripe financials.'))
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-lime-500">Stripe reporting</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Financials</h1>
          <p className="mt-1 text-sm text-ink-muted">Revenue, proceeds, balances, and payouts in one place.</p>
        </div>
        <div className="grid grid-cols-3 rounded-xl border border-steel-700 bg-steel-900 p-1" aria-label="Financial period">
          {(Object.keys(periodLabels) as FinancialPeriod[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                period === value ? 'bg-lime-500 text-charcoal-950' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {periodLabels[value]}
            </button>
          ))}
        </div>
      </header>

      {error && !data ? (
        <div className="rounded-[var(--radius-card)] border border-red-500/30 bg-red-500/10 px-5 py-8 text-center">
          <Icon name="chart" className="mx-auto text-2xl text-red-400" />
          <p className="mt-3 font-medium text-ink">Financials unavailable</p>
          <p className="mt-1 text-sm text-red-300">{error}</p>
        </div>
      ) : data ? (
        <FinancialContent data={data} loading={loading} />
      ) : (
        <FinancialSkeleton />
      )}
    </div>
  )
}

function FinancialContent({ data, loading }: { data: FinancialsData; loading: boolean }) {
  const metricCards: Array<{ label: string; value: string; note: string; icon: IconName; accent?: boolean }> = [
    {
      label: 'Gross collected',
      value: formatMoney(data.metrics.gross_cents, data.currency),
      note: periodLabels[data.period],
      icon: 'dollar',
      accent: true,
    },
    {
      label: 'Net proceeds',
      value: formatMoney(data.metrics.net_cents, data.currency),
      note: 'After fees and reversals',
      icon: 'chart',
    },
    {
      label: 'Available',
      value: formatMoney(data.metrics.available_cents, data.currency),
      note: 'Current Stripe balance',
      icon: 'wallet',
    },
    {
      label: 'Pending',
      value: formatMoney(data.metrics.pending_cents, data.currency),
      note: 'Not available yet',
      icon: 'clock',
    },
    {
      label: 'Stripe fees',
      value: formatMoney(data.metrics.fees_cents, data.currency),
      note: periodLabels[data.period],
      icon: 'dollar',
    },
    {
      label: 'Refunds',
      value: formatMoney(data.metrics.refunds_cents, data.currency),
      note: periodLabels[data.period],
      icon: 'refund',
    },
    {
      label: 'Paid out',
      value: formatMoney(data.metrics.payouts_cents, data.currency),
      note: 'Transferred to your bank',
      icon: 'arrow-up-right',
    },
    {
      label: 'MRR',
      value: data.metrics.mrr_cents === null ? '—' : formatMoney(data.metrics.mrr_cents, data.currency),
      note: 'Active subscriptions',
      icon: 'calendar',
    },
  ]

  return (
    <div className={`flex min-w-0 flex-col gap-5 transition-opacity ${loading ? 'opacity-55' : 'opacity-100'}`}>
      {data.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
          {data.warnings.join(' ')}
        </div>
      )}

      <section aria-label="Financial summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <article
            key={metric.label}
            className={`min-w-0 rounded-[var(--radius-card)] border p-4 sm:p-5 ${
              metric.accent ? 'border-lime-500/20 bg-lime-500/[0.06]' : 'border-steel-700 bg-steel-900/75'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-medium text-ink-muted">{metric.label}</p>
              <Icon name={metric.icon} className={metric.accent ? 'shrink-0 text-lime-500' : 'shrink-0 text-steel-400'} />
            </div>
            <p className="mt-3 truncate text-xl font-semibold tracking-tight text-ink sm:text-2xl">{metric.value}</p>
            <p className="mt-1 truncate text-[11px] text-ink-muted">{metric.note}</p>
          </article>
        ))}
      </section>

      <section className="min-w-0 rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/75 p-4 sm:p-5">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold tracking-tight text-ink">Revenue trend</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Rolling 12 months · gross and net</p>
          </div>
          <p className="font-mono text-[10px] uppercase text-steel-400">{data.currency}</p>
        </div>
        <RevenueChart data={data.monthly_revenue} currency={data.currency} />
      </section>

      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-2">
        <RecentFinancialActivity data={data} />
        <ClientRevenue data={data} />
      </div>

      <p className="text-right font-mono text-[10px] text-steel-500">
        Updated {new Date(data.updated_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </p>
    </div>
  )
}

function RecentFinancialActivity({ data }: { data: FinancialsData }) {
  const icons: Record<FinancialActivity['type'], IconName> = {
    payment: 'dollar',
    refund: 'refund',
    dispute: 'close',
    payout: 'arrow-up-right',
    fee: 'wallet',
    other: 'clock',
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/75">
      <div className="border-b border-steel-700 px-4 py-4 sm:px-5">
        <h2 className="font-semibold tracking-tight text-ink">Recent activity</h2>
        <p className="mt-0.5 text-xs text-ink-muted">Latest Stripe balance movements</p>
      </div>
      {data.recent_activity.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-ink-muted">No activity in this period.</p>
      ) : (
        <ul className="divide-y divide-steel-700/70">
          {data.recent_activity.map((activity) => (
            <li key={activity.id} className="flex min-w-0 items-center gap-3 px-4 py-3.5 sm:px-5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-steel-800 text-steel-400">
                <Icon name={icons[activity.type]} className="text-sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium capitalize text-ink">{activity.description}</span>
                <span className="mt-0.5 block text-[11px] capitalize text-ink-muted">{activity.type} · {formatTime(activity.created_at)}</span>
              </span>
              <span className={`shrink-0 font-mono text-xs ${activity.net_cents >= 0 ? 'text-lime-500' : 'text-red-400'}`}>
                {formatMoney(activity.net_cents, activity.currency, true)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ClientRevenue({ data }: { data: FinancialsData }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/75">
      <div className="flex items-start justify-between gap-3 border-b border-steel-700 px-4 py-4 sm:px-5">
        <div>
          <h2 className="font-semibold tracking-tight text-ink">Revenue by active client</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Matched using Stripe customer IDs</p>
        </div>
        <Link to="/contacts?active=true" className="shrink-0 text-xs font-medium text-lime-500 hover:text-lime-400">Manage</Link>
      </div>
      {data.client_revenue.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm font-medium text-ink">No linked client revenue yet</p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-ink-muted">Add each client&rsquo;s <code>cus_…</code> ID to their contact record to attribute Stripe charges.</p>
        </div>
      ) : (
        <ul className="divide-y divide-steel-700/70">
          {data.client_revenue.map((client) => (
            <li key={client.contact_id}>
              <Link to={`/contacts/${client.contact_id}`} className="flex min-w-0 items-center justify-between gap-3 px-4 py-3.5 hover:bg-steel-800/35 sm:px-5">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{client.name}</span>
                  <span className="mt-0.5 block truncate font-mono text-[10px] text-ink-muted">{client.stripe_customer_id}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-xs text-lime-500">{formatMoney(client.net_cents, data.currency)}</span>
                  {client.refunded_cents > 0 && <span className="mt-0.5 block text-[10px] text-ink-muted">{formatMoney(client.refunded_cents, data.currency)} refunded</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function FinancialSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => <div key={index} className="h-28 rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/75" />)}
      </div>
      <div className="mt-5 h-80 rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/75" />
    </div>
  )
}
