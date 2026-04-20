'use client'

import { useEffect } from 'react'
import clsx from 'clsx'
import type { SeoCompetitorRow, SeoTargetRow } from '@/lib/data'
import { INTENT_LABEL, INTENT_TONE } from '@/lib/seo-goals'

interface Props {
  target:      SeoTargetRow
  competitors: SeoCompetitorRow[]
  onClose:     () => void
}

function positionTone(pos: number | null): string {
  if (pos === null) return 'text-gray-300'
  if (pos <= 3)     return 'text-primary'
  if (pos <= 10)    return 'text-accent'
  if (pos <= 20)    return 'text-amber-500'
  return 'text-danger'
}

function positionLabel(pos: number | null): string {
  if (pos === null) return '—'
  return pos < 10 ? pos.toFixed(1) : pos.toFixed(0)
}

const fmt = (n: number) => n.toLocaleString('fr-CA')

export default function TargetQueryModal({ target, competitors, onClose }: Props) {
  // Escape key ferme le modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Empêche le scroll arrière-plan
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const ours = target.position

  // Construit la liste "marques qui nous devancent" à partir des positions manuelles.
  // Un compétiteur "nous devance" quand sa position est plus basse que la nôtre.
  // Si nous ne sommes pas classés (ours === null), tout compétiteur classé nous devance.
  const ahead = competitors
    .map(c => {
      const cell = c.cells.find(x => x.query === target.query)
      return { name: c.name, domain: c.domain, position: cell?.theirs ?? null }
    })
    .filter(c => {
      if (c.position === null) return false
      if (ours === null)       return true      // on n'est pas classé, tout le monde devant
      return c.position < ours                  // position plus basse = meilleur classement
    })
    .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))

  const behind = competitors
    .map(c => {
      const cell = c.cells.find(x => x.query === target.query)
      return { name: c.name, domain: c.domain, position: cell?.theirs ?? null }
    })
    .filter(c => {
      if (c.position === null) return false
      if (ours === null)       return false
      return c.position > ours
    })
    .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))

  const unranked = competitors
    .map(c => {
      const cell = c.cells.find(x => x.query === target.query)
      return { name: c.name, domain: c.domain, position: cell?.theirs ?? null }
    })
    .filter(c => c.position === null)

  // URL Google QC en français pour vérif manuelle
  const serpUrl = `https://www.google.com/search?q=${encodeURIComponent(target.query)}&gl=ca&hl=fr&pws=0`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl2 shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-semibold', INTENT_TONE[target.intent])}>
                {INTENT_LABEL[target.intent]}
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                Priorité {target.priority}
              </span>
            </div>
            <h3 className="text-lg font-bold text-textMain leading-tight">
              « {target.query} »
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-textMain transition"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Notre position + volume */}
        <div className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 border-b border-gray-100">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-1">
                Notre position
              </p>
              <p className={clsx('text-4xl font-bold tabular-nums leading-none', positionTone(ours))}>
                {positionLabel(ours)}
              </p>
              {ours !== null && (
                <p className="text-[10px] text-gray-400 mt-1">
                  {ours <= 3 ? 'Top 3' : ours <= 10 ? 'Page 1' : ours <= 20 ? 'Page 2' : 'Au-delà de la page 2'}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-1">Volume 30j</p>
              <p className="text-2xl font-bold text-textMain tabular-nums leading-none">
                {fmt(target.impressions)}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">impressions</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-1">Clics</p>
              <p className="text-2xl font-bold text-accent tabular-nums leading-none">
                {fmt(target.clicks)}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                CTR {target.impressions > 0 ? `${(target.ctr * 100).toFixed(1)} %` : '—'}
              </p>
            </div>
          </div>
          {target.topPage && (
            <p className="text-[10px] text-gray-500 mt-3 truncate" title={target.topPage}>
              Page qui ranke : <span className="text-gray-700 font-medium">{target.topPage.replace(/^https?:\/\//, '')}</span>
            </p>
          )}
        </div>

        {/* Qui nous devance */}
        <div className="p-5 border-b border-gray-100">
          <h4 className="text-xs font-semibold text-danger uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-danger" />
            Marques devant nous ({ahead.length})
          </h4>

          {ahead.length === 0 ? (
            <p className="text-xs text-gray-400 italic">
              {ours === null
                ? 'Aucun compétiteur de la liste n\'a de position mesurée pour cette requête.'
                : 'Aucun compétiteur de la liste ne nous devance — 🎉 nous sommes devant eux tous.'}
            </p>
          ) : (
            <ol className="space-y-2">
              {ahead.map((c, i) => (
                <li key={c.domain} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-danger/5 border border-danger/10">
                  <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[11px] font-bold text-danger tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-textMain truncate">{c.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{c.domain}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={clsx('text-lg font-bold tabular-nums leading-none', positionTone(c.position))}>
                      {positionLabel(c.position)}
                    </p>
                    {ours !== null && c.position !== null && (
                      <p className="text-[10px] text-danger mt-0.5">
                        +{(ours - c.position).toFixed(1)} pos.
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Marques derrière nous */}
        {behind.length > 0 && (
          <div className="p-5 border-b border-gray-100">
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Marques derrière nous ({behind.length})
            </h4>
            <ul className="space-y-1.5">
              {behind.map(c => (
                <li key={c.domain} className="flex items-center gap-3 text-xs">
                  <div className="flex-1 min-w-0 truncate">
                    <span className="text-textMain font-medium">{c.name}</span>
                    <span className="text-gray-300 ml-2">{c.domain}</span>
                  </div>
                  <span className={clsx('tabular-nums font-semibold', positionTone(c.position))}>
                    {positionLabel(c.position)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Non classés dans notre suivi */}
        {unranked.length > 0 && (
          <div className="p-5 border-b border-gray-100">
            <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Compétiteurs sans position mesurée pour cette requête
            </h4>
            <p className="text-[11px] text-gray-400">
              {unranked.map(c => c.name).join(' · ')}
            </p>
          </div>
        )}

        {/* CTA : vérifier la SERP */}
        <div className="p-5 flex flex-col gap-2">
          <a
            href={serpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-textMain text-white rounded-xl py-3 text-sm font-semibold hover:bg-textMain/90 transition"
          >
            🔍 Vérifier la SERP Google QC en live
            <span className="text-xs opacity-60">↗</span>
          </a>
          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            Positions compétiteurs saisies manuellement — à recroiser avec la SERP en nav privée.
            <br />Les positions Probaclac sont mesurées par Search Console (30 derniers jours).
          </p>
        </div>
      </div>
    </div>
  )
}
