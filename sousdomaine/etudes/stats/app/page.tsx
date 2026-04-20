import KpiCompareCard     from '@/components/KpiCompareCard'
import MonthlyChart       from '@/components/MonthlyChart'
import TopPagesTable      from '@/components/TopPagesTable'
import TrafficChart       from '@/components/TrafficChart'
import EcommerceChart     from '@/components/EcommerceChart'
import SeoGoals           from '@/components/SeoGoals'
import MetaTable          from '@/components/MetaTable'
import Nav                from '@/components/Nav'
import CrossDomainView    from '@/components/CrossDomainView'
import ConsolidationScore from '@/components/ConsolidationScore'
import {
  fetchGA4SiteStats,
  fetchGA4Traffic,
  fetchGA4Conversions,
  fetchGA4Ecommerce,
  fetchGSCKeywords,
  fetchMetaCampaigns,
  fetchCrossDomainStats,
  fetchSeoGoals,
} from '@/lib/data'

export const dynamic = 'force-dynamic'

// Wrap each fetcher so one failure doesn't break the whole page.
async function safe<T>(fn: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try {
    return { data: await fn(), error: null }
  } catch (err: any) {
    console.error(err)
    return { data: null, error: err?.message ?? 'Erreur inconnue' }
  }
}

function ErrorCard({ source, message }: { source: string; message: string }) {
  return (
    <div className="bg-white rounded-xl2 shadow-card p-5 border-l-4 border-danger">
      <p className="text-xs font-semibold text-danger uppercase tracking-wide mb-1">
        {source} indisponible
      </p>
      <p className="text-xs text-gray-500 font-mono break-all">{message}</p>
    </div>
  )
}

function SectionHeader({ num, title, sub, tone = 'primary' }: {
  num: string | number
  title: string
  sub?: string
  tone?: 'primary' | 'accent' | 'danger'
}) {
  const toneMap = {
    primary: 'bg-primary/10 text-primary',
    accent:  'bg-accent/10 text-accent',
    danger:  'bg-danger/10 text-danger',
  }
  return (
    <div className="flex items-center gap-3">
      <span className={`w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center ${toneMap[tone]}`}>
        {num}
      </span>
      <div>
        <h2 className="text-sm font-semibold text-textMain">{title}</h2>
        {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

const fmtNum = (n: number) => n.toLocaleString('fr-CA')

export default async function DashboardPage() {
  const [site, traffic, conversions, ecom, keywords, meta, cross, seoGoals] = await Promise.all([
    safe(fetchGA4SiteStats),
    safe(() => fetchGA4Traffic()),
    safe(() => fetchGA4Conversions()),
    safe(fetchGA4Ecommerce),
    safe(() => fetchGSCKeywords()),
    safe(() => fetchMetaCampaigns()),
    safe(fetchCrossDomainStats),
    safe(fetchSeoGoals),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      <Nav current="global" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-textMain">Tableau de bord — probaclac.ca</h1>
          <p className="text-sm text-gray-400">
            Tous les sous-domaines · 30 derniers jours vs 30 précédents
          </p>
        </div>
        <span className="text-xs bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full">
          Données temps réel
        </span>
      </div>

      {/* ── SECTION 1 · Statistiques générales du site ────────────────── */}
      <section className="space-y-5">
        <SectionHeader num={1} title="Statistiques générales" sub="probaclac.ca + tous les sous-domaines" />

        {site.error ? (
          <ErrorCard source="GA4 Site Stats" message={site.error} />
        ) : site.data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCompareCard
                label="Sessions"
                value={fmtNum(site.data.sessions.current)}
                previousValue={fmtNum(site.data.sessions.previous)}
                trendPct={site.data.sessions.trendPct}
              />
              <KpiCompareCard
                label="Vues de page"
                value={fmtNum(site.data.pageViews.current)}
                previousValue={fmtNum(site.data.pageViews.previous)}
                trendPct={site.data.pageViews.trendPct}
                accent="accent"
              />
              <KpiCompareCard
                label="Utilisateurs actifs"
                value={fmtNum(site.data.activeUsers.current)}
                previousValue={fmtNum(site.data.activeUsers.previous)}
                trendPct={site.data.activeUsers.trendPct}
                accent="accent"
              />
            </div>

            <MonthlyChart data={site.data.monthly} />

            <div>
              <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Top 5 pages — 30 jours
                </h3>
                <span className="text-[11px] text-gray-400">
                  Tri par vues de page · badge = sous-domaine
                </span>
              </div>
              <TopPagesTable pages={site.data.topPages.slice(0, 5)} />
            </div>
          </>
        )}
      </section>

      {/* ── SECTION 2 · Ecommerce Shopify ─────────────────────────────── */}
      <section className="space-y-5">
        <SectionHeader
          num={2}
          title="Ecommerce Shopify"
          sub="Add to cart · Begin checkout — drawer Shopify sur probaclac.ca · 30j vs 30j précédents"
        />

        {ecom.error ? (
          <ErrorCard source="GA4 Ecommerce" message={ecom.error} />
        ) : ecom.data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCompareCard
                label="Ajouts au panier"
                value={fmtNum(ecom.data.addToCart.current)}
                previousValue={fmtNum(ecom.data.addToCart.previous)}
                trendPct={ecom.data.addToCart.trendPct}
              />
              <KpiCompareCard
                label="Passer à la caisse"
                value={fmtNum(ecom.data.beginCheckout.current)}
                previousValue={fmtNum(ecom.data.beginCheckout.previous)}
                trendPct={ecom.data.beginCheckout.trendPct}
                accent="accent"
              />
              <KpiCompareCard
                label="Taux Cart → Checkout"
                value={`${(ecom.data.cartToCheckoutRate.current * 100).toFixed(1)} %`}
                previousValue={`${(ecom.data.cartToCheckoutRate.previous * 100).toFixed(1)} %`}
                trendPct={ecom.data.cartToCheckoutRate.trendPct}
                accent="accent"
                sub="begin_checkout / add_to_cart"
              />
            </div>

            {ecom.data.addToCart.current === 0 && ecom.data.beginCheckout.current === 0 ? (
              <div className="bg-white rounded-xl2 shadow-card p-5 border-l-4 border-accent">
                <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">
                  En attente des premières données
                </p>
                <p className="text-xs text-gray-500">
                  Les events <code className="bg-gray-100 px-1 rounded">add_to_cart</code> et{' '}
                  <code className="bg-gray-100 px-1 rounded">begin_checkout</code> viennent
                  d'être branchés (GTM publié). Comptez quelques clics clients avant que la
                  courbe devienne significative.
                </p>
              </div>
            ) : (
              <EcommerceChart data={ecom.data.timeSeries} />
            )}

            {ecom.data.purchase.current === 0 && (
              <p className="text-[11px] text-gray-400 italic">
                Pas de tracking <code className="bg-gray-100 px-1 rounded">purchase</code> —
                la conversion finale a lieu sur checkout.shopify.com. À brancher plus tard via
                les Additional scripts de Shopify Checkout ou l'intégration native Shopify → GA4.
              </p>
            )}
          </>
        )}
      </section>

      {/* ── SECTION 3 · Objectifs SEO & compétiteurs ─────────────────── */}
      <section className="space-y-5">
        <SectionHeader
          num={3}
          title="Objectifs SEO & compétiteurs"
          sub="Positions sur les requêtes cibles · actions détectées · benchmark concurrentiel"
          tone="accent"
        />

        {seoGoals.error ? (
          <ErrorCard source="SEO Goals" message={seoGoals.error} />
        ) : seoGoals.data && (
          <SeoGoals goals={seoGoals.data} />
        )}
      </section>

      {/* ── SECTION 4 · Cross-domain consolidation ───────────────────── */}
      <section className="space-y-5">
        <SectionHeader
          num={4}
          title="Consolidation etudes ↔ www"
          sub="Pontage entre sous-domaines + score automatique"
        />

        {cross.error ? (
          <ErrorCard source="Cross-domain" message={cross.error} />
        ) : cross.data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <CrossDomainView
                ga4={cross.data.ga4}
                gsc={cross.data.gsc}
                totalSessions={cross.data.totalSessions}
                crossSessions={cross.data.crossSessions}
                crossPct={cross.data.crossPct}
              />
            </div>
            <div className="lg:col-span-1">
              <ConsolidationScore
                total={cross.data.score.total}
                breakdown={cross.data.score.breakdown}
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Trafic détaillé GA4 (vue "30 jours jour par jour") ────────── */}
      <section className="space-y-5">
        <SectionHeader num="✱" title="Google Analytics 4 — détail 30j" sub="Canaux d'acquisition & conversions" tone="accent" />

        {traffic.error ? (
          <ErrorCard source="GA4 Traffic" message={traffic.error} />
        ) : traffic.data && (
          <TrafficChart data={traffic.data.timeSeries} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {traffic.data && (
            <div className="bg-white rounded-xl2 shadow-card p-5">
              <h3 className="text-sm font-semibold text-textMain mb-4">Canaux d'acquisition</h3>
              <ul className="space-y-2">
                {traffic.data.channels.map(c => {
                  const total = traffic.data!.sessions || 1
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
          )}

          {conversions.error ? (
            <ErrorCard source="GA4 Conversions" message={conversions.error} />
          ) : conversions.data && (
            <div className="bg-white rounded-xl2 shadow-card p-5">
              <h3 className="text-sm font-semibold text-textMain mb-1">Conversions GA4</h3>
              <p className="text-xs text-gray-400 mb-4">
                {conversions.data.totalConversions} conversions · taux {(conversions.data.conversionRate * 100).toFixed(1)} %
              </p>

              {conversions.data.goals.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-4">
                  Aucun événement marqué comme conversion dans GA4.<br/>
                  Admin → Événements → activer « Marquer comme événement clé ».
                </p>
              ) : (
                <ul className="space-y-3">
                  {conversions.data.goals.map(g => (
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
              )}

              {conversions.data.weekly.length > 0 && (() => {
                const max = Math.max(1, ...conversions.data!.weekly.map(w => w.conversions))
                return (
                  <>
                    <div className="mt-4 flex items-end gap-1 h-12">
                      {conversions.data!.weekly.map(w => {
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
                  </>
                )
              })()}
            </div>
          )}
        </div>
      </section>

      {/* ── Search Console ───────────────────────────────────────────── */}
      <section className="space-y-5">
        <SectionHeader num="⚲" title="Search Console" sub="Propriété domaine · tous sous-domaines" tone="accent" />

        {keywords.error ? (
          <ErrorCard source="Search Console" message={keywords.error} />
        ) : keywords.data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCompareCard
                label="Clics"
                value={keywords.data.totalClicks.toLocaleString('fr-CA')}
                trendPct={null}
              />
              <KpiCompareCard
                label="Impressions"
                value={keywords.data.totalImpressions.toLocaleString('fr-CA')}
                trendPct={null}
                accent="accent"
              />
              <KpiCompareCard
                label="CTR moyen"
                value={`${(keywords.data.avgCtr * 100).toFixed(1)} %`}
                trendPct={null}
                accent="accent"
              />
              <KpiCompareCard
                label="Pos. moyenne"
                value={keywords.data.avgPosition.toFixed(1)}
                trendPct={null}
                accent="danger"
              />
            </div>
            <SeoGoals keywords={keywords.data.keywords} />
          </>
        )}
      </section>

      {/* ── Meta Ads ─────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <SectionHeader
          num="𝓶"
          title="Meta Ads (données simulées)"
          sub="Token à configurer pour activer le flux réel"
          tone="danger"
        />

        {meta.error ? (
          <ErrorCard source="Meta Ads" message={meta.error} />
        ) : meta.data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCompareCard label="Dépenses totales"
                value={`${meta.data.totalSpend.toFixed(2)} $`} trendPct={null} accent="danger" />
              <KpiCompareCard label="Impressions"
                value={meta.data.totalImpressions.toLocaleString('fr-CA')} trendPct={null} accent="accent" />
              <KpiCompareCard label="Conversions"
                value={meta.data.totalConversions} trendPct={null} />
              <KpiCompareCard label="ROAS"
                value={`${meta.data.roas.toFixed(1)}×`} trendPct={null}
                accent={meta.data.roas >= 2 ? 'primary' : 'danger'} />
            </div>
            <MetaTable campaigns={meta.data.campaigns} />
          </>
        )}
      </section>

      <footer className="text-center text-[11px] text-gray-300 py-4">
        Probaclac · Tableau de bord interne · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
