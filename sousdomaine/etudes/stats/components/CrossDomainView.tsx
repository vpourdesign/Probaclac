import clsx from 'clsx'

interface HostGA4 { host: string; sessions: number; pageViews: number; activeUsers: number }
interface HostGSC { host: string; clicks: number; impressions: number; ctr: number; position: number }

interface Props {
  ga4: HostGA4[]
  gsc: HostGSC[]
  totalSessions:  number
  crossSessions:  number
  crossPct:       number
}

function hostColor(host: string): string {
  if (host.startsWith('etudes.')) return 'bg-accent'
  if (host.startsWith('www.'))    return 'bg-primary'
  if (host.startsWith('blog.'))   return 'bg-purple-500'
  return 'bg-gray-400'
}

function hostBadge(host: string): string {
  if (host.startsWith('etudes.')) return 'bg-accent/10 text-accent'
  if (host.startsWith('www.'))    return 'bg-primary/10 text-primary'
  if (host.startsWith('blog.'))   return 'bg-purple-500/10 text-purple-600'
  return 'bg-gray-100 text-gray-600'
}

const fmt = (n: number) => n.toLocaleString('fr-CA')

export default function CrossDomainView({ ga4, gsc, totalSessions, crossSessions, crossPct }: Props) {
  const totalPerHost = ga4.reduce((s, h) => s + h.sessions, 0) || 1
  const totalGscClicks = gsc.reduce((s, h) => s + h.clicks, 0) || 1

  return (
    <div className="space-y-5">
      {/* Cross-sessions banner */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl2 p-5 border border-primary/10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-card flex items-center justify-center text-lg">
              🔀
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                Sessions cross-domaine
              </p>
              <p className="text-2xl font-bold text-textMain tabular-nums">
                {fmt(crossSessions)}
                <span className="text-sm font-medium text-gray-400 ml-2">
                  / {fmt(totalSessions)} ({(crossPct * 100).toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
            Nombre de sessions ayant touché <strong>www</strong> ET <strong>etudes</strong> (ou d'autres sous-domaines) — indicateur de pontage entre les propriétés.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* GA4 split */}
        <div className="bg-white rounded-xl2 shadow-card p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-sm font-semibold text-textMain">Trafic GA4</h3>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">par sous-domaine</span>
          </div>

          {/* Stacked bar */}
          <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-100 mb-4">
            {ga4.map(h => {
              const pct = (h.sessions / totalPerHost) * 100
              return pct > 0 ? (
                <div
                  key={h.host}
                  className={clsx('h-full transition', hostColor(h.host))}
                  style={{ width: `${pct}%` }}
                  title={`${h.host}: ${fmt(h.sessions)} (${pct.toFixed(1)}%)`}
                />
              ) : null
            })}
          </div>

          <ul className="space-y-2.5">
            {ga4.map(h => {
              const pct = (h.sessions / totalPerHost) * 100
              return (
                <li key={h.host} className="flex items-center gap-3 text-xs">
                  <span className={clsx('w-2 h-2 rounded-full', hostColor(h.host))} />
                  <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-semibold truncate max-w-[160px]', hostBadge(h.host))}>
                    {h.host}
                  </span>
                  <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
                    <span className="text-gray-500 tabular-nums whitespace-nowrap">
                      {fmt(h.sessions)} sessions
                    </span>
                    <span className="text-gray-400 tabular-nums whitespace-nowrap">
                      {fmt(h.pageViews)} vues
                    </span>
                    <span className="font-bold text-textMain tabular-nums w-10 text-right">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* GSC split */}
        <div className="bg-white rounded-xl2 shadow-card p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-sm font-semibold text-textMain">Organique GSC</h3>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">par sous-domaine</span>
          </div>

          {gsc.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-6 text-center">
              Aucune donnée GSC pour les 30 derniers jours.<br />
              La propriété domaine peut nécessiter 3-7 jours pour agréger.
            </p>
          ) : (
            <>
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-100 mb-4">
                {gsc.map(h => {
                  const pct = (h.clicks / totalGscClicks) * 100
                  return pct > 0 ? (
                    <div
                      key={h.host}
                      className={clsx('h-full', hostColor(h.host))}
                      style={{ width: `${pct}%` }}
                      title={`${h.host}: ${fmt(h.clicks)} clics (${pct.toFixed(1)}%)`}
                    />
                  ) : null
                })}
              </div>

              <ul className="space-y-2.5">
                {gsc.map(h => {
                  const pct = totalGscClicks > 0 ? (h.clicks / totalGscClicks) * 100 : 0
                  return (
                    <li key={h.host} className="flex items-center gap-3 text-xs">
                      <span className={clsx('w-2 h-2 rounded-full', hostColor(h.host))} />
                      <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-semibold truncate max-w-[160px]', hostBadge(h.host))}>
                        {h.host}
                      </span>
                      <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
                        <span className="text-gray-500 tabular-nums whitespace-nowrap">
                          {fmt(h.clicks)} clics
                        </span>
                        <span className="text-gray-400 tabular-nums whitespace-nowrap">
                          {fmt(h.impressions)} imp.
                        </span>
                        <span className="font-bold text-textMain tabular-nums w-10 text-right">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
