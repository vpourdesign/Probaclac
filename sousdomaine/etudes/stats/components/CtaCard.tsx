import clsx from 'clsx'

interface CtaCardProps {
  label: string
  clicks: number
  clicksPrev?: number
  trendPct: number | null
  /** Taux de clic : eventCount / sessions de la page. */
  ctr: number
  /** URL de destination optionnelle (pour petit lien en footer de card). */
  destinationUrl?: string
  /** Icône emoji ou ReactNode pour différencier visuellement les CTAs. */
  icon?: React.ReactNode
}

function formatTrend(pct: number | null): { text: string; positive: boolean | null } {
  if (pct === null) return { text: '—', positive: null }
  if (pct === 0)    return { text: '0%', positive: null }
  const abs = Math.abs(pct)
  const text = abs >= 100 ? `${pct > 0 ? '+' : '−'}${abs.toFixed(0)}%` : `${pct > 0 ? '+' : '−'}${abs.toFixed(1)}%`
  return { text, positive: pct > 0 }
}

export default function CtaCard({ label, clicks, clicksPrev, trendPct, ctr, destinationUrl, icon }: CtaCardProps) {
  const trend = formatTrend(trendPct)

  return (
    <div className="group relative bg-white rounded-xl2 shadow-card p-5 flex flex-col gap-2 overflow-hidden transition hover:shadow-lg">
      {/* Subtle accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-accent opacity-60 group-hover:opacity-100 transition" />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-base shrink-0">{icon}</span>}
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">{label}</span>
        </div>
        {trend.positive !== null && (
          <span
            className={clsx(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0',
              trend.positive ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger',
            )}
          >
            {trend.text}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-textMain tabular-nums">
          {clicks.toLocaleString('fr-CA')}
        </span>
        <span className="text-xs text-gray-400">{clicks === 1 ? 'clic' : 'clics'}</span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-400">
        <span>CTR {(ctr * 100).toFixed(1)}%</span>
        {clicksPrev !== undefined && (
          <span className="text-gray-300">
            prev. {clicksPrev.toLocaleString('fr-CA')}
          </span>
        )}
      </div>

      {destinationUrl && (
        <a
          href={destinationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-gray-400 hover:text-accent truncate mt-1 underline underline-offset-2"
          title={destinationUrl}
        >
          {destinationUrl}
        </a>
      )}
    </div>
  )
}
