import clsx from 'clsx'

interface Props {
  total: number
  breakdown: { label: string; value: number; max: number; detail: string }[]
}

function scoreGrade(total: number): { label: string; tone: string; ring: string } {
  if (total >= 75) return { label: 'Excellent',   tone: 'text-primary',  ring: 'stroke-primary' }
  if (total >= 50) return { label: 'Correct',     tone: 'text-accent',   ring: 'stroke-accent' }
  if (total >= 25) return { label: 'À renforcer', tone: 'text-amber-500', ring: 'stroke-amber-500' }
  return             { label: 'Critique',     tone: 'text-danger',   ring: 'stroke-danger' }
}

export default function ConsolidationScore({ total, breakdown }: Props) {
  const grade = scoreGrade(total)
  const circumference = 2 * Math.PI * 42
  const dashoffset = circumference * (1 - total / 100)

  return (
    <div className="bg-white rounded-xl2 shadow-card p-5">
      <div className="flex items-start gap-6 flex-wrap">
        {/* Gauge ring */}
        <div className="relative flex-shrink-0">
          <svg width="110" height="110" viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r="42" className="stroke-gray-100" strokeWidth="8" fill="none" />
            <circle
              cx="50" cy="50" r="42"
              className={clsx('transition-all duration-700', grade.ring)}
              strokeWidth="8" fill="none" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={clsx('text-3xl font-bold tabular-nums', grade.tone)}>{total}</span>
            <span className="text-[9px] text-gray-400 uppercase tracking-wider">/ 100</span>
          </div>
        </div>

        <div className="flex-1 min-w-[220px]">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">
            Score de consolidation
          </p>
          <h3 className={clsx('text-xl font-bold mb-2', grade.tone)}>{grade.label}</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-md">
            Mesure automatique du niveau d'intégration entre <strong>www.probaclac.ca</strong> et <strong>etudes.probaclac.ca</strong>.
            Construit sur 4 signaux mesurables — les aspects éditoriaux (liens internes, hreflang, canonical) sont à auditer manuellement.
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <ul className="mt-6 space-y-3">
        {breakdown.map(item => {
          const pct = item.max > 0 ? (item.value / item.max) * 100 : 0
          const tone = pct >= 75 ? 'bg-primary' : pct >= 50 ? 'bg-accent' : pct >= 25 ? 'bg-amber-400' : 'bg-danger'
          return (
            <li key={item.label} className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-1 gap-3">
                  <span className="text-xs font-semibold text-textMain truncate">{item.label}</span>
                  <span className="text-[11px] text-gray-400 tabular-nums whitespace-nowrap">
                    {item.value} / {item.max} pts
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                  <div className={clsx('h-full rounded-full transition-all duration-500', tone)} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 leading-snug">{item.detail}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
