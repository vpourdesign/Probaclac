import clsx from 'clsx'

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: number   // positive = good, negative = bad
  accent?: 'primary' | 'accent' | 'danger'
}

export default function KpiCard({ label, value, sub, trend, accent = 'primary' }: KpiCardProps) {
  const colorMap = { primary: 'text-primary', accent: 'text-accent', danger: 'text-danger' }
  return (
    <div className="bg-white rounded-xl2 shadow-card p-5 flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      <span className={clsx('text-2xl font-bold', colorMap[accent])}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
      {trend !== undefined && (
        <span className={clsx('text-xs font-medium mt-1', trend >= 0 ? 'text-primary' : 'text-danger')}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </span>
      )}
    </div>
  )
}
