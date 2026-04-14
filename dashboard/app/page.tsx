import KpiCard      from '@/components/KpiCard'
import TrafficChart from '@/components/TrafficChart'
import SeoGoals     from '@/components/SeoGoals'
import MetaTable    from '@/components/MetaTable'

async function getData<T>(path: string): Promise<T> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Fetch failed: ${path}`)
  return res.json()
}

export default async function DashboardPage() {
  const [traffic, conversions, keywords, meta] = await Promise.all([
    getData<any>('/api/ga4/traffic'),
    getData<any>('/api/ga4/conversions'),
    getData<any>('/api/gsc/keywords'),
    getData<any>('/api/meta/campaigns'),
  ])

  const fmtDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textMain">Tableau de bord</h1>
          <p className="text-sm text-gray-400">probaclac.ca — données des 30 derniers jours</p>
        </div>
        <span className="text-xs bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full">
          Données simulées
        </span>
      </div>

      {/* ── GA4 KPIs ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Google Analytics 4
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard label="Sessions"         value={traffic.sessions.toLocaleString('fr-CA')} trend={8} />
          <KpiCard label="Utilisateurs"     value={traffic.users.toLocaleString('fr-CA')}    trend={5} />
          <KpiCard label="Nouveaux util."   value={traffic.newUsers.toLocaleString('fr-CA')} accent="accent" />
          <KpiCard label="Durée moy."       value={fmtDuration(traffic.avgSessionDuration)}  accent="accent" />
          <KpiCard label="Taux de rebond"   value={`${(traffic.bounceRate * 100).toFixed(0)} %`} trend={-3} accent="danger" />
        </div>
      </section>

      {/* Traffic chart */}
      <TrafficChart data={traffic.timeSeries} />

      {/* Channels + Conversions KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channels */}
        <div className="bg-white rounded-xl2 shadow-card p-5">
          <h2 className="text-sm font-semibold text-textMain mb-4">Canaux d'acquisition</h2>
          <ul className="space-y-2">
            {traffic.channels.map((c: any) => {
              const total = traffic.sessions
              const pct = ((c.sessions / total) * 100).toFixed(0)
              return (
                <li key={c.channel} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-36 truncate">{c.channel}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-textMain w-12 text-right">
                    {c.sessions.toLocaleString('fr-CA')}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Conversion goals */}
        <div className="bg-white rounded-xl2 shadow-card p-5">
          <h2 className="text-sm font-semibold text-textMain mb-1">Conversions GA4</h2>
          <p className="text-xs text-gray-400 mb-4">
            {conversions.totalConversions} conversions · taux {(conversions.conversionRate * 100).toFixed(1)} %
          </p>
          <ul className="space-y-3">
            {conversions.goals.map((g: any) => (
              <li key={g.name} className="flex items-center justify-between">
                <span className="text-xs text-textMain">{g.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary">{g.conversions}</span>
                  {g.value > 0 && (
                    <span className="text-xs text-gray-400">{g.value.toLocaleString('fr-CA')} $</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {/* Weekly sparkline numbers */}
          <div className="mt-4 flex items-end gap-1 h-12">
            {conversions.weekly.map((w: any) => {
              const max = Math.max(...conversions.weekly.map((x: any) => x.conversions))
              const h = Math.round((w.conversions / max) * 100)
              return (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full bg-primary/20 rounded-sm"
                    style={{ height: `${h}%` }}
                    title={`${w.week}: ${w.conversions}`}
                  />
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-gray-300 mt-1 text-center">Conversions hebdomadaires</p>
        </div>
      </div>

      {/* ── Search Console ───────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Google Search Console
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Clics"        value={keywords.totalClicks.toLocaleString('fr-CA')}        trend={12} />
          <KpiCard label="Impressions"  value={keywords.totalImpressions.toLocaleString('fr-CA')}   accent="accent" />
          <KpiCard label="CTR moyen"    value={`${(keywords.avgCtr * 100).toFixed(1)} %`}            trend={2}  accent="accent" />
          <KpiCard label="Pos. moyenne" value={keywords.avgPosition.toFixed(1)}                      trend={-5} accent="danger" />
        </div>
        <SeoGoals keywords={keywords.keywords} />
      </section>

      {/* ── Meta Ads ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Meta Ads
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Dépenses totales" value={`${meta.totalSpend.toFixed(2)} $`}                   accent="danger" />
          <KpiCard label="Impressions"      value={meta.totalImpressions.toLocaleString('fr-CA')}       accent="accent" />
          <KpiCard label="Conversions"      value={meta.totalConversions}                               trend={15} />
          <KpiCard label="ROAS"             value={`${meta.roas.toFixed(1)}×`}                         trend={meta.roas >= 2 ? 10 : -5} accent={meta.roas >= 2 ? 'primary' : 'danger'} />
        </div>
        <MetaTable campaigns={meta.campaigns} />
      </section>

      <footer className="text-center text-[11px] text-gray-300 py-4">
        Probaclac · Tableau de bord interne · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
