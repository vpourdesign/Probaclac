import KpiCard             from '@/components/KpiCard'
import KpiCompareCard      from '@/components/KpiCompareCard'
import CtaCard             from '@/components/CtaCard'
import TrafficChart        from '@/components/TrafficChart'
import Nav                 from '@/components/Nav'
import SciKeywordPositions from '@/components/SciKeywordPositions'
import {
  fetchGA4PageStats,
  fetchLandingKPIs,
  fetchGA4Realtime,
  fetchSciKeywordPositions,
} from '@/lib/data'

export const dynamic = 'force-dynamic'

const PAGE_PATH  = '/sci'
const PAGE_URL   = 'https://etudes.probaclac.ca/sci'
const PAGE_TITLE = 'Probaclac SCI'

// Requêtes organiques à suivre pour la landing /sci.
const SCI_KEYWORDS = [
  'probiotique sci',
  'probiotique côlon irritable',
  'probiotique intestin irritable',
]

// Ordre canonique des 3 CTAs de la page /sci (définit l'ordre des cards).
// Si GA4 retourne un label hors liste, il sera ajouté après ces 3.
const CTA_CONFIG: { label: string; icon: string; destinationUrl?: string }[] = [
  { label: 'Commander en ligne',    icon: '🛒', destinationUrl: 'https://www.probaclac.ca/' },
  { label: 'Acheter sur Amazon',    icon: '📦', destinationUrl: 'https://www.amazon.ca/' },
  { label: 'Trouver une pharmacie', icon: '📍', destinationUrl: 'https://www.probaclac.ca/trouver-un-magasin' },
]

const AUTO_EVENTS = new Set([
  'page_view', 'session_start', 'first_visit', 'user_engagement',
  'scroll', 'form_start', 'form_submit', 'file_download',
  'view_search_results', 'video_start', 'video_progress', 'video_complete',
])

function fmtDuration(s: number): string {
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function fmtNum(n: number): string {
  return n.toLocaleString('fr-CA')
}

async function safe<T>(fn: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try {
    return { data: await fn(), error: null }
  } catch (err: any) {
    console.error(err)
    return { data: null, error: err?.message ?? 'Erreur inconnue' }
  }
}

export default async function SCIPage() {
  // 4 fetches en parallèle, isolés pour qu'une erreur n'abatte pas toute la page
  const [landing, pageStats, realtime, sciKeywords] = await Promise.all([
    safe(() => fetchLandingKPIs({ pagePath: PAGE_PATH, ctaLabels: CTA_CONFIG.map(c => c.label) })),
    safe(() => fetchGA4PageStats({ pageUrl: PAGE_URL })),
    safe(() => fetchGA4Realtime({ pageTitle: PAGE_TITLE })),
    safe(() => fetchSciKeywordPositions(SCI_KEYWORDS)),
  ])

  const rtCustomEvents = realtime.data?.events.filter(e => !AUTO_EVENTS.has(e.name)) ?? []
  const customEvents   = pageStats.data?.events.filter(e => !AUTO_EVENTS.has(e.name)) ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <Nav current="sci" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-textMain">Landing SCI</h1>
          <p className="text-sm text-gray-400">
            <a
              href={PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent underline underline-offset-2"
            >
              {PAGE_URL}
            </a>
            {' · 30 derniers jours vs 30 précédents'}
          </p>
        </div>
        <span className="text-xs bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full">
          Données temps réel
        </span>
      </div>

      {/* ── En direct (Realtime API) ──────────────────────────────────── */}
      {realtime.data && !realtime.error && (
        <section className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl2 p-5 border border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <h2 className="text-xs font-semibold text-primary uppercase tracking-widest">
              En direct — 30 dernières minutes
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Sur la page</p>
              <p className="text-2xl font-bold text-textMain">{realtime.data.pageActiveUsers}</p>
              <p className="text-[10px] text-gray-400">utilisateurs actifs</p>
            </div>
            <div className="bg-white rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Vues</p>
              <p className="text-2xl font-bold text-textMain">{realtime.data.pageViews}</p>
              <p className="text-[10px] text-gray-400">de la page SCI</p>
            </div>
            <div className="bg-white rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Clics CTA</p>
              <p className="text-2xl font-bold text-primary">
                {rtCustomEvents.reduce((s, e) => s + e.count, 0)}
              </p>
              <p className="text-[10px] text-gray-400">events custom</p>
            </div>
            <div className="bg-white rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Site global</p>
              <p className="text-2xl font-bold text-textMain">{realtime.data.activeUsers}</p>
              <p className="text-[10px] text-gray-400">utilisateurs actifs</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Section 2 : Landing /sci (sessions, bounce, CTAs) ─────────── */}
      {landing.error ? (
        <div className="bg-white rounded-xl2 shadow-card p-5 border-l-4 border-danger">
          <p className="text-xs font-semibold text-danger uppercase tracking-wide mb-1">
            Landing KPIs indisponibles
          </p>
          <p className="text-xs text-gray-500 font-mono break-all">{landing.error}</p>
        </div>
      ) : landing.data && (
        <>
          {/* KPIs session-scoped avec compare période */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Trafic de la page
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCompareCard
                label="Sessions"
                value={fmtNum(landing.data.sessions.current)}
                previousValue={fmtNum(landing.data.sessions.previous)}
                trendPct={landing.data.sessions.trendPct}
              />
              <KpiCompareCard
                label="Vues de page"
                value={fmtNum(landing.data.pageViews.current)}
                previousValue={fmtNum(landing.data.pageViews.previous)}
                trendPct={landing.data.pageViews.trendPct}
                accent="accent"
              />
              <KpiCompareCard
                label="Visiteurs uniques"
                value={fmtNum(landing.data.users.current)}
                previousValue={fmtNum(landing.data.users.previous)}
                trendPct={landing.data.users.trendPct}
                accent="accent"
              />
              <KpiCompareCard
                label="Taux de rebond"
                value={`${(landing.data.bounceRate.current * 100).toFixed(0)}%`}
                previousValue={`${(landing.data.bounceRate.previous * 100).toFixed(0)}%`}
                trendPct={landing.data.bounceRate.trendPct}
                trendDirection="down-is-good"
                accent="danger"
              />
              <KpiCompareCard
                label="Engagement moy."
                value={fmtDuration(landing.data.avgEngagement.current)}
                previousValue={fmtDuration(landing.data.avgEngagement.previous)}
                trendPct={landing.data.avgEngagement.trendPct}
              />
            </div>
          </section>

          {/* Clics sur CTAs — 3 cards + unlabeled si existant */}
          <section>
            <div className="flex items-baseline justify-between mb-3 gap-4 flex-wrap">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Clics sur les boutons CTA
              </h2>
              <span className="text-[11px] text-gray-400">
                Total <strong className="text-textMain">{fmtNum(landing.data.totalCtaClicks)}</strong> clics ·
                {' '}Conversion globale <strong className="text-textMain">
                  {landing.data.sessions.current > 0
                    ? ((landing.data.totalCtaClicks / landing.data.sessions.current) * 100).toFixed(1)
                    : '0.0'}%
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {landing.data.ctas.slice(0, 3).map(cta => {
                const cfg = CTA_CONFIG.find(c => c.label === cta.label)
                return (
                  <CtaCard
                    key={cta.label}
                    label={cta.label}
                    clicks={cta.clicks}
                    clicksPrev={cta.clicksPrev}
                    trendPct={cta.trendPct}
                    ctr={cta.ctr}
                    icon={cfg?.icon}
                    destinationUrl={cfg?.destinationUrl}
                  />
                )
              })}
            </div>

            {/* CTAs supplémentaires détectés (hors config) */}
            {landing.data.ctas.length > 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {landing.data.ctas.slice(3).map(cta => (
                  <CtaCard
                    key={cta.label}
                    label={cta.label}
                    clicks={cta.clicks}
                    clicksPrev={cta.clicksPrev}
                    trendPct={cta.trendPct}
                    ctr={cta.ctr}
                    icon="✨"
                  />
                ))}
              </div>
            )}

            {/* Bannière "unlabeled clicks" — cas où cta_click a fired avant
                que la dimension custom cta_label soit enregistrée (2026-04-16). */}
            {landing.data.unlabeledClicks.current > 0 && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <span className="text-base leading-none">⚠️</span>
                <div className="flex-1 text-xs text-amber-900">
                  <p className="font-semibold mb-1">
                    {fmtNum(landing.data.unlabeledClicks.current)} clic{landing.data.unlabeledClicks.current !== 1 ? 's' : ''} sans étiquette
                  </p>
                  <p className="text-amber-800/80 leading-relaxed">
                    Ces <code className="bg-amber-100 px-1 rounded font-mono text-[11px]">cta_click</code> sont
                    antérieurs à l'enregistrement de la dimension custom <code className="bg-amber-100 px-1 rounded font-mono text-[11px]">cta_label</code>
                    {' '}(2026-04-16) — GA4 ne permet pas de rétro-remplir. Les nouveaux clics seront correctement étiquetés.
                  </p>
                </div>
              </div>
            )}

            {/* Cas "zero data" */}
            {landing.data.noCtaData && (
              <div className="mt-4 bg-white rounded-xl2 shadow-card p-6 text-center">
                <p className="text-sm text-gray-500 mb-1">📊 Aucun clic CTA enregistré sur la période</p>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  GA4 n'a pas encore reçu de déclenchement <code className="bg-gray-100 px-1 rounded font-mono text-[10px]">cta_click</code> sur {PAGE_PATH}.
                  Délai de processing : ~1-4h pour les premières données, 24-48h pour les stats finales.
                </p>
              </div>
            )}
          </section>
        </>
      )}

      {/* ── Positionnement SEO (requêtes SCI) ─────────────────────────── */}
      {sciKeywords.error ? (
        <div className="bg-white rounded-xl2 shadow-card p-5 border-l-4 border-danger">
          <p className="text-xs font-semibold text-danger uppercase tracking-wide mb-1">
            Search Console indisponible
          </p>
          <p className="text-xs text-gray-500 font-mono break-all">{sciKeywords.error}</p>
        </div>
      ) : sciKeywords.data && (
        <section>
          <SciKeywordPositions keywords={sciKeywords.data} />
        </section>
      )}

      {/* ── Secondary : time series + events list ─────────────────────── */}
      {pageStats.data && pageStats.data.pageViews > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Évolution — 30 jours
          </h2>
          <TrafficChart
            data={pageStats.data.timeSeries.map(t => ({
              date: t.date,
              sessions: t.pageViews,
              users: t.users,
            }))}
          />
        </section>
      )}

      {/* Liste exhaustive des events custom (debug / visibilité brute) */}
      {customEvents.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Tous les events custom captés sur la page
          </h2>
          <div className="bg-white rounded-xl2 shadow-card p-5 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gray-100">
                  <th className="pb-2 font-medium">Nom de l'événement</th>
                  <th className="pb-2 font-medium text-right">Déclenchements</th>
                  <th className="pb-2 font-medium text-right">Utilisateurs</th>
                </tr>
              </thead>
              <tbody>
                {customEvents.map(e => (
                  <tr key={e.name} className="border-b border-gray-50 hover:bg-[#F8F9FA] transition">
                    <td className="py-2 font-mono text-xs text-textMain">{e.name}</td>
                    <td className="py-2 text-right text-primary font-bold tabular-nums">
                      {fmtNum(e.count)}
                    </td>
                    <td className="py-2 text-right text-xs text-gray-500 tabular-nums">
                      {fmtNum(e.users)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer className="text-center text-[11px] text-gray-300 py-4">
        Probaclac · Tableau de bord interne · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
