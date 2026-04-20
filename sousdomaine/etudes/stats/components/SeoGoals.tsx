import clsx from 'clsx'
import { INTENT_TONE, type QueryIntent } from '@/lib/seo-goals'
import type {
  SeoGoals as SeoGoalsData,
  SeoAction,
  SeoActionKind,
  SeoTargetRow,
  SeoCompetitorRow,
} from '@/lib/data'
import TargetsTable from './TargetsTable'
import ContentIdeas from './ContentIdeas'

interface Keyword {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface Props {
  /** Top keywords (legacy view — rétro-compatibilité avec app/sci). */
  keywords?: Keyword[]
  /** Nouveaux objectifs SEO + actions + compétiteurs (Section 3). */
  goals?: SeoGoalsData
}

// ── Formatage & palettes ───────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('fr-CA')

function positionTone(pos: number | null): string {
  if (pos === null)      return 'text-gray-300'
  if (pos <= 3)          return 'text-primary'
  if (pos <= 10)         return 'text-accent'
  if (pos <= 20)         return 'text-amber-500'
  return 'text-danger'
}

function positionLabel(pos: number | null): string {
  if (pos === null) return '—'
  return pos < 10 ? pos.toFixed(1) : pos.toFixed(0)
}

const ACTION_META: Record<SeoActionKind, { label: string; icon: string; tone: string }> = {
  'quick-win':    { label: 'Quick win',    icon: '🎯', tone: 'bg-primary/10 text-primary border-primary/20' },
  'ctr-low':      { label: 'CTR bas',      icon: '📝', tone: 'bg-accent/10 text-accent border-accent/20' },
  'content-gap':  { label: 'Content gap',  icon: '🕳️', tone: 'bg-danger/10 text-danger border-danger/20' },
  'close-podium': { label: 'Page 2',       icon: '⬆️', tone: 'bg-amber-100 text-amber-700 border-amber-200' },
}

// ── Liste top 5 actions ────────────────────────────────────────────────
function ActionsList({ actions, totalQueries }: { actions: SeoAction[]; totalQueries: number }) {
  return (
    <div className="bg-white rounded-xl2 shadow-card p-5">
      <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-textMain">Top 5 actions SEO recommandées</h3>
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">
          Analysé sur {fmt(totalQueries)} requêtes
        </span>
      </div>

      {actions.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-6 text-center">
          Aucune opportunité détectée (volume insuffisant ou positions déjà optimales).<br />
          Réexécuter quand le volume GSC dépasse ~20 impressions/requête.
        </p>
      ) : (
        <ol className="space-y-3">
          {actions.map((a, i) => {
            const meta = ACTION_META[a.kind]
            return (
              <li key={`${a.kind}-${a.query}`} className={clsx('rounded-xl border p-3', meta.tone)}>
                <div className="flex items-start gap-3">
                  <span className="text-base flex-shrink-0 leading-none mt-0.5">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold tabular-nums opacity-60">#{i + 1}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide">{meta.label}</span>
                        <span className="text-xs font-bold text-textMain truncate">« {a.query} »</span>
                      </div>
                      <span className="text-[10px] tabular-nums opacity-70 whitespace-nowrap">
                        pos. {a.position.toFixed(1)} · {fmt(a.impressions)} impr.
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed mt-1">{a.rationale}</p>
                    {a.page && (
                      <p className="text-[10px] text-gray-400 mt-1 truncate">
                        → {a.page.replace(/^https?:\/\//, '')}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

// ── Tableau compétiteurs ───────────────────────────────────────────────
function CompetitorsTable({ rows, targets }: { rows: SeoCompetitorRow[]; targets: SeoTargetRow[] }) {
  const intentByQuery = new Map(targets.map(t => [t.query, t.intent] as const))

  return (
    <div className="bg-white rounded-xl2 shadow-card p-5">
      <div className="flex items-baseline justify-between mb-1 gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-textMain">Comparatif compétiteurs</h3>
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">Positions manuelles · MàJ 2026-04-16</span>
      </div>
      <p className="text-[11px] text-gray-400 mb-4">
        Plus la position est basse, mieux c'est. <strong>Vert</strong> = nous devançons le compétiteur, <strong>rouge</strong> = nous sommes derrière.
      </p>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100 text-left">
              <th className="pb-2 font-medium sticky left-0 bg-white">Requête</th>
              <th className="pb-2 font-medium text-right">Probaclac</th>
              {rows.map(r => (
                <th key={r.domain} className="pb-2 font-medium text-right min-w-[100px]">
                  <div>{r.name}</div>
                  <div className="text-[9px] text-gray-300 font-normal">{r.domain}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {targets.map(t => {
              const ours = t.position
              return (
                <tr key={t.query} className="border-b border-gray-50 hover:bg-[#F8F9FA] transition">
                  <td className="py-2 pr-3 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-semibold', INTENT_TONE[intentByQuery.get(t.query) ?? 'commercial' as QueryIntent])}>
                        {t.priority === 1 ? '●' : t.priority === 2 ? '◐' : '○'}
                      </span>
                      <span className="font-medium text-textMain truncate max-w-[180px]">{t.query}</span>
                    </div>
                  </td>
                  <td className={clsx('py-2 text-right tabular-nums font-bold', positionTone(ours))}>
                    {positionLabel(ours)}
                  </td>
                  {rows.map(comp => {
                    const cell = comp.cells.find(c => c.query === t.query)
                    const theirs = cell?.theirs ?? null
                    const bg =
                      cell?.outcome === 'better' ? 'bg-primary/5 text-primary' :
                      cell?.outcome === 'worse'  ? 'bg-danger/5 text-danger'   :
                      cell?.outcome === 'tie'    ? 'bg-gray-50 text-gray-500'  :
                                                   'text-gray-300'
                    return (
                      <td key={comp.domain} className={clsx('py-2 text-right tabular-nums font-semibold', bg)}>
                        {positionLabel(theirs)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            {/* Résumé */}
            <tr className="text-[10px] text-gray-500">
              <td className="pt-3 font-semibold uppercase tracking-wide sticky left-0 bg-white">Bilan</td>
              <td className="pt-3 text-right text-gray-300">—</td>
              {rows.map(r => {
                const delta = r.avgDelta
                const deltaTone = delta === null ? 'text-gray-300' : delta > 0 ? 'text-primary' : delta < 0 ? 'text-danger' : 'text-gray-500'
                return (
                  <td key={r.domain} className="pt-3 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[10px]">
                        <span className="text-primary font-bold">{r.wins}W</span>
                        <span className="text-gray-300 mx-0.5">·</span>
                        <span className="text-danger font-bold">{r.losses}L</span>
                      </span>
                      <span className={clsx('tabular-nums font-semibold', deltaTone)}>
                        {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} pos.`}
                      </span>
                    </div>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Ancien top mots-clés (utilisé dans app/sci) ────────────────────────
function LegacyKeywordsTable({ keywords }: { keywords: Keyword[] }) {
  return (
    <div className="bg-white rounded-xl2 shadow-card p-5 overflow-x-auto">
      <h2 className="text-sm font-semibold text-textMain mb-4">Top mots-clés — Search Console</h2>
      <table className="w-full text-xs text-left">
        <thead>
          <tr className="text-gray-400 border-b border-gray-100">
            <th className="pb-2 font-medium">Requête</th>
            <th className="pb-2 font-medium text-right">Clics</th>
            <th className="pb-2 font-medium text-right">Impressions</th>
            <th className="pb-2 font-medium text-right">CTR</th>
            <th className="pb-2 font-medium text-right">Position</th>
          </tr>
        </thead>
        <tbody>
          {keywords.map(k => (
            <tr key={k.query} className="border-b border-gray-50 hover:bg-[#F8F9FA] transition">
              <td className="py-1.5 pr-4 font-medium text-textMain">{k.query}</td>
              <td className="py-1.5 text-right text-accent font-semibold">{k.clicks}</td>
              <td className="py-1.5 text-right">{k.impressions.toLocaleString('fr-CA')}</td>
              <td className="py-1.5 text-right">{(k.ctr * 100).toFixed(1)} %</td>
              <td className="py-1.5 text-right">{k.position.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Export principal ───────────────────────────────────────────────────
export default function SeoGoals({ keywords, goals }: Props) {
  // Mode objectifs SEO (Section 3 du dashboard global).
  if (goals) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <TargetsTable rows={goals.targets} competitors={goals.competitors} />
          </div>
          <div className="lg:col-span-1">
            <ActionsList actions={goals.actions} totalQueries={goals.totalQueries} />
          </div>
        </div>
        <CompetitorsTable rows={goals.competitors} targets={goals.targets} />
        <ContentIdeas goals={goals} />
      </div>
    )
  }

  // Fallback legacy : top mots-clés (utilisé dans app/sci).
  return <LegacyKeywordsTable keywords={keywords ?? []} />
}
