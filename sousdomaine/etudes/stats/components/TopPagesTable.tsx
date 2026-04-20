import clsx from 'clsx'

interface TopPage {
  path: string
  title: string
  hostName: string
  pageViews: number
  avgSessionDuration: number
  engagementRate: number
}

function fmtDuration(s: number): string {
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function hostTone(host: string): string {
  // Couleur du badge hostname — etudes = accent, www = primary, autre = neutre
  if (host.startsWith('etudes.')) return 'bg-accent/10 text-accent'
  if (host.startsWith('www.'))    return 'bg-primary/10 text-primary'
  return 'bg-gray-100 text-gray-600'
}

export default function TopPagesTable({ pages }: { pages: TopPage[] }) {
  const totalViews = pages.reduce((s, p) => s + p.pageViews, 0) || 1

  return (
    <div className="bg-white rounded-xl2 shadow-card p-5 overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-gray-400 text-xs border-b border-gray-100">
            <th className="pb-2 font-medium">Page</th>
            <th className="pb-2 font-medium text-right whitespace-nowrap">Vues</th>
            <th className="pb-2 font-medium text-right whitespace-nowrap">Durée moy.</th>
            <th className="pb-2 font-medium text-right whitespace-nowrap">Engagement</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p, i) => {
            const sharePct = (p.pageViews / totalViews) * 100
            return (
              <tr key={`${p.hostName}${p.path}`} className="border-b border-gray-50 hover:bg-[#F8F9FA] transition group">
                <td className="py-2.5 pr-4 max-w-xl">
                  <div className="flex items-start gap-2.5">
                    <span className="text-[11px] font-bold text-gray-300 tabular-nums min-w-[18px] pt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[13px] font-semibold text-textMain truncate">{p.title}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 truncate">
                        <span className={clsx('px-1.5 py-0.5 rounded font-semibold', hostTone(p.hostName))}>
                          {p.hostName.replace(/^www\./, '')}
                        </span>
                        <span className="font-mono truncate">{p.path === '/' ? '/' : p.path}</span>
                      </div>
                      {/* Share bar */}
                      <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden max-w-[240px]">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                          style={{ width: `${Math.min(100, sharePct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 text-right align-top">
                  <span className="text-[15px] font-bold text-primary tabular-nums">
                    {p.pageViews.toLocaleString('fr-CA')}
                  </span>
                  <div className="text-[10px] text-gray-400">{sharePct.toFixed(1)}%</div>
                </td>
                <td className="py-2.5 text-right align-top tabular-nums text-[13px] text-gray-600">
                  {fmtDuration(p.avgSessionDuration)}
                </td>
                <td className="py-2.5 text-right align-top">
                  <span
                    className={clsx(
                      'text-[12px] font-semibold px-2 py-0.5 rounded-full tabular-nums',
                      p.engagementRate >= 0.6 ? 'bg-primary/10 text-primary'
                      : p.engagementRate >= 0.4 ? 'bg-accent/10 text-accent'
                      : 'bg-gray-100 text-gray-500',
                    )}
                  >
                    {(p.engagementRate * 100).toFixed(0)}%
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
