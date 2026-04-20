import clsx from 'clsx'
import type { SciKeywords } from '@/lib/data'

const fmt = (n: number) => n.toLocaleString('fr-CA')

function positionTone(pos: number | null): string {
  if (pos === null) return 'text-gray-300'
  if (pos <= 3)     return 'text-primary'
  if (pos <= 10)    return 'text-accent'
  if (pos <= 20)    return 'text-amber-500'
  return 'text-danger'
}

function positionBg(pos: number | null): string {
  if (pos === null) return 'bg-gray-50'
  if (pos <= 3)     return 'bg-primary/5'
  if (pos <= 10)    return 'bg-accent/5'
  if (pos <= 20)    return 'bg-amber-50'
  return 'bg-danger/5'
}

function positionLabel(pos: number | null): string {
  if (pos === null) return '—'
  return pos < 10 ? pos.toFixed(1) : pos.toFixed(0)
}

function badge(pos: number | null): { text: string; tone: string } {
  if (pos === null)       return { text: 'Non classé',     tone: 'bg-gray-100 text-gray-500' }
  if (pos <= 3)           return { text: 'Top 3',          tone: 'bg-primary/10 text-primary' }
  if (pos <= 10)          return { text: 'Page 1',         tone: 'bg-accent/10 text-accent' }
  if (pos <= 20)          return { text: 'Page 2',         tone: 'bg-amber-100 text-amber-700' }
  return                         { text: 'Au-delà',        tone: 'bg-danger/10 text-danger' }
}

export default function SciKeywordPositions({ keywords }: { keywords: SciKeywords }) {
  const hasAnyData = keywords.rows.some(r => r.impressions > 0)

  return (
    <div className="bg-white rounded-xl2 shadow-card p-5">
      <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-textMain">
            Positionnement SEO — requêtes SCI
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Volume de recherche & position moyenne sur {keywords.periodDays} jours · Search Console
          </p>
        </div>
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">
          Propriété domaine probaclac.ca
        </span>
      </div>

      {!hasAnyData && (
        <p className="text-xs text-gray-400 italic py-6 text-center">
          Aucune impression détectée pour ces 3 requêtes sur les {keywords.periodDays} derniers jours.<br />
          La page n'est probablement pas encore indexée ou ne ranke pas dans le top 100.
        </p>
      )}

      {hasAnyData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {keywords.rows.map(row => {
            const b = badge(row.position)
            const tone = positionTone(row.position)
            const bg = positionBg(row.position)
            return (
              <div
                key={row.query}
                className={clsx('rounded-xl p-4 border border-gray-100', bg)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="text-xs font-semibold text-textMain leading-snug">
                    {row.query}
                  </p>
                  <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap', b.tone)}>
                    {b.text}
                  </span>
                </div>

                {/* Position en grand, volume à côté */}
                <div className="flex items-end gap-4 mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Position</p>
                    <p className={clsx('text-3xl font-bold tabular-nums leading-none', tone)}>
                      {positionLabel(row.position)}
                    </p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Volume 30j</p>
                    <p className="text-xl font-bold text-textMain tabular-nums leading-none">
                      {fmt(row.impressions)}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-0.5">impressions</p>
                  </div>
                </div>

                {/* Stats secondaires */}
                <div className="flex items-center gap-4 text-[11px] text-gray-500 border-t border-gray-100 pt-2">
                  <span>
                    <strong className="text-accent tabular-nums">{fmt(row.clicks)}</strong> clic{row.clicks !== 1 ? 's' : ''}
                  </span>
                  <span>
                    CTR <strong className="text-textMain tabular-nums">
                      {row.impressions > 0 ? `${(row.ctr * 100).toFixed(1)} %` : '—'}
                    </strong>
                  </span>
                </div>

                {/* Page qui ranke + note match si variante */}
                {row.topPage && (
                  <p className="text-[10px] text-gray-400 mt-2 truncate" title={row.topPage}>
                    → {row.topPage.replace(/^https?:\/\//, '')}
                  </p>
                )}
                {row.matchedAs && row.matchedAs !== row.query && (
                  <p className="text-[10px] text-gray-300 italic mt-1">
                    GSC : « {row.matchedAs} »
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Légende positions */}
      <div className="mt-4 flex items-center gap-4 flex-wrap text-[10px] text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-primary rounded-full" />Top 3</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-accent rounded-full" />Page 1 (4-10)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-400 rounded-full" />Page 2 (11-20)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-danger rounded-full" />Au-delà</span>
      </div>
    </div>
  )
}
