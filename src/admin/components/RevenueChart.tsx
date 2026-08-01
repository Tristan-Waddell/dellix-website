import { useId } from 'react'
import type { FinancialsData } from '../../../shared/types.ts'

type Props = {
  data: FinancialsData['monthly_revenue']
  currency: string
  compact?: boolean
}

function compactMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(cents / 100)
}

export function RevenueChart({ data, currency, compact = false }: Props) {
  const gradientId = useId().replaceAll(':', '')
  const width = 760
  const height = compact ? 210 : 280
  const padding = { top: 18, right: 18, bottom: 36, left: compact ? 44 : 56 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const values = data.flatMap((item) => [item.gross_cents, item.net_cents])
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)
  const x = (index: number) => padding.left + (data.length <= 1 ? 0 : (index / (data.length - 1)) * plotWidth)
  const y = (value: number) => padding.top + ((max - value) / range) * plotHeight
  const zeroY = y(0)
  const grossPoints = data.map((item, index) => `${x(index)},${y(item.gross_cents)}`).join(' ')
  const netPoints = data.map((item, index) => `${x(index)},${y(item.net_cents)}`).join(' ')
  const areaPoints = `${padding.left},${zeroY} ${grossPoints} ${padding.left + plotWidth},${zeroY}`
  const ticks = Array.from({ length: 4 }, (_, index) => min + (range * index) / 3).reverse()
  const hasRevenue = values.some((value) => value !== 0)

  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center gap-4 text-[11px] text-ink-muted">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-lime-500" />Gross</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-steel-400" />Net</span>
      </div>
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gross and net revenue over the last twelve months" className="h-auto w-full">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-lime-500)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--color-lime-500)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} stroke="var(--color-steel-700)" strokeWidth="1" />
              <text x={padding.left - 8} y={y(tick) + 4} textAnchor="end" fill="var(--color-steel-400)" fontSize="10" fontFamily="var(--font-mono)">
                {compactMoney(tick, currency)}
              </text>
            </g>
          ))}

          {data.map((item, index) => (
            <text
              key={item.month}
              x={x(index)}
              y={height - 10}
              textAnchor="middle"
              fill="var(--color-steel-400)"
              fontSize="10"
              fontFamily="var(--font-mono)"
            >
              {index % 2 === 0 || index === data.length - 1
                ? new Date(`${item.month}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
                : ''}
            </text>
          ))}

          {hasRevenue && <polygon points={areaPoints} fill={`url(#${gradientId})`} />}
          <polyline points={grossPoints} fill="none" stroke="var(--color-lime-500)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={netPoints} fill="none" stroke="var(--color-steel-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 5" />

          {data.map((item, index) => (
            <circle key={item.month} cx={x(index)} cy={y(item.gross_cents)} r="3" fill="var(--color-charcoal-900)" stroke="var(--color-lime-500)" strokeWidth="2" />
          ))}
        </svg>
        {!hasRevenue && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="rounded-full border border-steel-700 bg-charcoal-900/90 px-3 py-1.5 text-xs text-ink-muted">Revenue will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
