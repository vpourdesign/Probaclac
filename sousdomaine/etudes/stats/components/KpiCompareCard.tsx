import clsx from 'clsx'

interface KpiCompareCardProps {
  label: string
  value: string | number
  previousValue?: string | number
  trendPct: number | null
  /** Détermine la couleur du trend. Par défaut, "up" = bon (vert). */
  trendDirection?: 'up-is-good' | 'down-is-good'
  accent?: 'primary' | 'accent' | 'danger' | 'neutral'
  sub?: string
}

function formatTrend(pct: number | null, dir: 'up-is-good' | 'down-is-good') {
  // null = pas de comparaison disponible → on n'affiche pas de badge (retour null)
  if (pct === null) return null
  if (Math.abs(pct) < 0.1) return { text: '0%', tone: 'neutral' as const }
  const positive = pct > 0
  const good = dir === 'up-is-good' ? positive : !positive
  const abs = Math.abs(pct)
  const text = `${positive ? '+' : '−'}${abs >= 100 ? abs.toFixed(0) : abs.toFixed(1)}%`
  return { text, tone: good ? 'good' : 'bad' as const }
}

export default function KpiCompareCard({
  label,
  value,
  previousValue,
  trendPct,
  trendDirection = 'up-is-good',
  accent = 'primary',
  sub,
}: KpiCompareCardProps) {
  const accentMap = {
    primary: 'text-primary',
    accent:  'text-accent',
    danger:  'text-danger',
    neutral: 'text-textMain',
  }
  const trend = formatTrend(trendPct, trendDirection)
  const trendClass = trend ? {
    good:    'bg-primary/10 text-primary',
    bad:     'bg-danger/10 text-danger',
    neutral: 'bg-gray-100 text-gray-500',
  }[trend.tone] : ''

  return (
    <div className="bg-white rounded-xl2 shadow-card p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
        {trend && (
          <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap', trendClass)}>
            {trend.text}
          </span>
        )}
      </div>
      <span className={clsx('text-2xl font-bold tabular-nums', accentMap[accent])}>{value}</span>
      {(sub || previousValue !== undefined) && (
        <span className="text-[11px] text-gray-400">
          {sub}
          {sub && previousValue !== undefined && ' · '}
          {previousValue !== undefined && <>prev. {previousValue}</>}
        </span>
      )}
    </div>
  )
}
