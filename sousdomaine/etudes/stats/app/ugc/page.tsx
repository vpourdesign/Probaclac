import Nav      from '@/components/Nav'
import KpiCard  from '@/components/KpiCard'
import { fetchUGCStats, type UGCRefStats } from '@/lib/data'

export const dynamic = 'force-dynamic'

// Mapping slug → nom complet de l'influenceuse (pour affichage).
const REF_DISPLAY: Record<string, string> = {
  elisabeth: 'Elisabeth van der Wilt',
  hela:      'Hela',
  hina:      'Hina Nagar',
  kelsey:    'Kelsey',
  lina:      'Lina',
  myriam:    'Myriam Guimond',
  shika:     'Shika',
  sophia:    'Sophia Clavet',
  christina: 'Christina Ross',
  linakarda: 'Lina Karda',
  ashley:    'Ashley Laraby',
  cassie:    'Cassie Austin',
  shielle:   'Shielle',
  nicole:        'Nicole Bridges',
  carrie:        'Carrie Desormeaux',
  deanna:        'Deanna Reiter',
  alamodesophie: 'A la mode Sophie',
  kim:           'Kim',
  sherry:        'Sherry Cousins',
  nathalie:      'Nathalie / Cloud 29',
  '(none)':  'Trafic direct (sans ref)',
  '(other)': 'Autre / inconnu',
}

const PAGE_META = {
  yeast: {
    title: 'Probaclac Yeast Infection',
    url:   'https://etudes.probaclac.ca/yeast',
    color: 'pink' as const,
  },
  vaginosis: {
    title: 'Probaclac Vaginal',
    url:   'https://etudes.probaclac.ca/vaginosis',
    color: 'blue' as const,
  },
}

function fmtNum(n: number): string {
  return n.toLocaleString('fr-CA')
}

function pct(part: number, total: number): string {
  if (!total) return '—'
  return `${((part / total) * 100).toFixed(1)}%`
}

async function safe<T>(fn: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try { return { data: await fn(), error: null } }
  catch (err: any) { console.error(err); return { data: null, error: err?.message ?? 'Erreur inconnue' } }
}

export default async function UGCPage() {
  const result = await safe(() => fetchUGCStats())

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <Nav current="ugc" />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-textMain">Tracking UGC — Influenceuses</h1>
          <p className="text-sm text-gray-400">
            Pages <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">/yeast</code> et{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">/vaginosis</code> ·
            {' '}30 derniers jours · Attribution via <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">?ref=</code>
          </p>
        </div>
        <span className="text-xs bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full">
          GA4 + GTM
        </span>
      </div>

      {/* Erreur globale */}
      {result.error && (
        <div className="bg-white rounded-xl2 shadow-card p-5 border-l-4 border-danger">
          <p className="text-xs font-semibold text-danger uppercase tracking-wide mb-1">
            Données UGC indisponibles
          </p>
          <p className="text-xs text-gray-500 font-mono break-all">{result.error}</p>
        </div>
      )}

      {result.data && result.data.pages.map(page => {
        const meta = PAGE_META[page.product]
        const totals = {
          sessions:  page.totalSessions,
          users:     page.totalUsers,
          pageViews: page.totalPageViews,
          cta:       page.totalCtaClicks,
        }

        return (
          <section key={page.product} className="space-y-4">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold text-textMain">
                {meta.title}
              </h2>
              <a
                href={meta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-accent underline underline-offset-2"
              >
                {meta.url}
              </a>
            </div>

            {/* KPIs totaux de la page */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Sessions"          value={fmtNum(totals.sessions)} />
              <KpiCard label="Visiteurs uniques" value={fmtNum(totals.users)}    accent="accent" />
              <KpiCard label="Vues de page"      value={fmtNum(totals.pageViews)} />
              <KpiCard label="Clics CTA"         value={fmtNum(totals.cta)}      accent="accent" />
            </div>

            {/* Tableau par influenceuse */}
            {page.refs.length === 0 ? (
              <div className="bg-white rounded-xl2 shadow-card p-6 text-center">
                <p className="text-sm text-gray-500 mb-1">📊 Aucune donnée encore</p>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  GA4 n'a pas encore reçu de visite sur <code className="bg-gray-100 px-1 rounded font-mono text-[10px]">{page.pagePath}</code>.
                  Délai de processing : ~1-4h pour les premières données.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl2 shadow-card overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs border-b border-gray-100">
                      <th className="px-5 py-3 font-medium">Influenceuse / source</th>
                      <th className="px-5 py-3 font-medium font-mono text-[11px]">slug</th>
                      <th className="px-5 py-3 font-medium text-right">Sessions</th>
                      <th className="px-5 py-3 font-medium text-right">Visiteurs</th>
                      <th className="px-5 py-3 font-medium text-right">Vues</th>
                      <th className="px-5 py-3 font-medium text-right">Clics CTA</th>
                      <th className="px-5 py-3 font-medium text-right">Taux conv.</th>
                      <th className="px-5 py-3 font-medium text-right">% sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.refs.map((r: UGCRefStats) => {
                      const display = REF_DISPLAY[r.ref] ?? r.ref
                      const conv = r.sessions > 0 ? (r.ctaClicks / r.sessions) * 100 : 0
                      const isKnown = r.ref !== '(none)' && r.ref !== '(other)'
                      return (
                        <tr key={r.ref} className="border-b border-gray-50 hover:bg-[#F8F9FA] transition">
                          <td className="px-5 py-3">
                            <span className={isKnown ? 'font-medium text-textMain' : 'text-gray-500 italic'}>
                              {display}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-[11px] text-gray-600">
                              {r.ref}
                            </code>
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums font-bold text-textMain">
                            {fmtNum(r.sessions)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-gray-600">
                            {fmtNum(r.users)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-gray-600">
                            {fmtNum(r.pageViews)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums font-bold text-primary">
                            {fmtNum(r.ctaClicks)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-xs text-gray-500">
                            {conv > 0 ? `${conv.toFixed(1)}%` : '—'}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-xs text-gray-400">
                            {pct(r.sessions, totals.sessions)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Liens à partager — référence rapide */}
            <details className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600">
              <summary className="cursor-pointer font-semibold text-gray-700 select-none">
                📋 Liens à partager pour cette page
              </summary>
              <div className="mt-3 space-y-1 font-mono text-[11px]">
                {Object.keys(REF_DISPLAY)
                  .filter(slug => slug !== '(none)' && slug !== '(other)')
                  .map(slug => (
                    <div key={slug} className="flex items-center justify-between gap-3">
                      <span className="text-gray-500 min-w-[180px]">{REF_DISPLAY[slug]}</span>
                      <code className="text-gray-700 bg-white px-2 py-1 rounded flex-1 truncate">
                        {meta.url}?ref={slug}
                      </code>
                    </div>
                  ))}
              </div>
            </details>
          </section>
        )
      })}

      {/* Notes méthodo */}
      <section className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-900 leading-relaxed">
        <p className="font-semibold mb-2">📌 Comment ça marche</p>
        <ul className="list-disc pl-4 space-y-1 text-blue-800/90">
          <li>
            Les <strong>sessions</strong> et <strong>visiteurs</strong> par ref proviennent de la dimension GA4{' '}
            <code className="bg-white px-1 rounded font-mono">landingPagePlusQueryString</code> — chaque session
            est attribuée à la landing page d'origine (avec son <code className="bg-white px-1 rounded font-mono">?ref=</code>).
          </li>
          <li>
            Les <strong>clics CTA</strong> proviennent de l'event GTM <code className="bg-white px-1 rounded font-mono">cta_click</code>{' '}
            avec paramètre <code className="bg-white px-1 rounded font-mono">ref_slug</code> (poussé au dataLayer au clic sur "Buy on Amazon").
          </li>
          <li>
            ⚠️ Pour que <code className="bg-white px-1 rounded font-mono">ref_slug</code> apparaisse comme dimension dans GA4,
            il faut l'enregistrer dans GA4 Admin → Custom definitions (sinon les clics CTA seront groupés sous "(not set)").
          </li>
          <li>
            Délai GA4 : ~1-4h pour les premières données, 24-48h pour les stats finales.
          </li>
        </ul>
      </section>

      <footer className="text-center text-[11px] text-gray-300 py-4">
        Probaclac · Tableau de bord interne · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
