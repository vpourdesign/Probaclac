'use client'

import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { generateContentIdeas, type ContentIdea } from '@/lib/content-ideas'
import type { SeoGoals } from '@/lib/data'

interface Props {
  goals: SeoGoals
}

// Seed initial déterministe — évite les hydration mismatches.
// Sera randomisé côté client après mount.
const INITIAL_SEED = 42

const ACTION_LABEL: Record<string, string> = {
  'quick-win':    'Quick win',
  'ctr-low':      'CTR bas',
  'content-gap':  'Content gap',
  'close-podium': 'Page 2',
}

const ACTION_TONE: Record<string, string> = {
  'quick-win':    'bg-primary/10 text-primary',
  'ctr-low':      'bg-accent/10 text-accent',
  'content-gap':  'bg-danger/10 text-danger',
  'close-podium': 'bg-amber-100 text-amber-700',
}

function positionTone(pos: number | null): string {
  if (pos === null) return 'text-gray-300'
  if (pos <= 3)     return 'text-primary'
  if (pos <= 10)    return 'text-accent'
  if (pos <= 20)    return 'text-amber-500'
  return 'text-danger'
}

function fmt(n: number): string {
  return n.toLocaleString('fr-CA')
}

// ── Carte d'idée ────────────────────────────────────────────────────────
function IdeaCard({ idea, index }: { idea: ContentIdea; index: number }) {
  const [copied, setCopied] = useState(false)

  const fullBrief = useMemo(() => {
    const posText = idea.targetPosition !== null ? `pos. ${idea.targetPosition.toFixed(1)}` : 'non classé'
    const k = idea.keywords
    const lines = [
      `📝 ${idea.kind === 'blog' ? 'Idée de blog' : 'Idée de guide interactif'}`,
      ``,
      `TITRE : ${idea.title}`,
      `CIBLE SEO : « ${idea.targetQuery} » (${posText} · ${fmt(idea.targetImpr)} impr./mois)`,
      `FORMAT : ${idea.format}`,
      `ANGLE : ${idea.angle}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🔑 MOTS-CLÉS À INTÉGRER (par priorité)`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `  PRINCIPAL  →  à placer dans H1, title, slug URL, 1er §, méta`,
      `  ★ « ${k.primary} »`,
      ``,
      ...(k.secondaries.length > 0 ? [
        `  SECONDAIRES  →  à distribuer dans H2, intro, conclusion`,
        ...k.secondaries.map(s => `  • ${s}`),
        ``,
      ] : []),
      `  LONGUE-TRAÎNE  →  à insérer naturellement dans le corps`,
      ...k.longtail.map(l => `  • ${l}`),
      ``,
      `  LSI / AUTORITÉ TOPIQUE  →  à saupoudrer pour signal de pertinence`,
      ...k.lsi.map(l => `  • ${l}`),
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `CONTEXTE / RATIONNEL :`,
      idea.rationale,
      ``,
      `BRIEF STRATÉGIQUE :`,
      idea.summary,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Registre : cliniquement approuvé, scientifique accessible, grand public.`,
      `Sources à citer systématiquement : PubMed, Cochrane, INSPQ, guides cliniques.`,
      `Pas de promesses absolues — toujours formuler avec prudence`,
      `(« peut », « est associé à », « les études suggèrent »).`,
      `Disclaimer médical visible : ces informations ne remplacent pas`,
      `un avis professionnel personnalisé.`,
    ]
    return lines.join('\n')
  }, [idea])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullBrief)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API unavailable — fallback
      const ta = document.createElement('textarea')
      ta.value = fullBrief
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <article className="bg-white rounded-xl2 shadow-card p-5 flex flex-col gap-3 h-full">
      {/* Header : index + badge action */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tabular-nums text-gray-300">#{index + 1}</span>
          {idea.actionKind && (
            <span className={clsx('text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded', ACTION_TONE[idea.actionKind])}>
              {ACTION_LABEL[idea.actionKind]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 tabular-nums">
          <span className={clsx('font-bold', positionTone(idea.targetPosition))}>
            {idea.targetPosition === null ? '—' : idea.targetPosition.toFixed(1)}
          </span>
          <span>·</span>
          <span>{fmt(idea.targetImpr)} impr.</span>
        </div>
      </div>

      {/* Titre */}
      <h4 className="font-semibold text-textMain text-[14px] leading-snug">
        {idea.title}
      </h4>

      {/* Format + angle */}
      <div className="text-[11px] text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 leading-relaxed">
        <span className="font-semibold text-textMain">{idea.format}</span>
        <span className="text-gray-300 mx-1.5">·</span>
        <span>{idea.angle}</span>
      </div>

      {/* Mots-clés à intégrer */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-2">
          Mots-clés à intégrer
        </p>

        {/* Principal — chip prominent */}
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-semibold px-2 py-1 rounded-md">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"/></svg>
            « {idea.keywords.primary} »
          </span>
        </div>

        {/* Secondaires + LSI — chips secondaires */}
        {(idea.keywords.secondaries.length > 0 || idea.keywords.lsi.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {idea.keywords.secondaries.slice(0, 3).map((kw, i) => (
              <span key={`s-${i}`} className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">
                {kw}
              </span>
            ))}
            {idea.keywords.lsi.slice(0, 4).map((kw, i) => (
              <span key={`l-${i}`} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-5 flex-1 border-t border-gray-100 pt-3">
        {idea.summary}
      </p>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={clsx(
          'w-full inline-flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border transition',
          copied
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-textMain border-gray-200 hover:border-primary hover:text-primary'
        )}
      >
        {copied ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>
            Copié — colle dans Claude
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
            Copier le brief
          </>
        )}
      </button>
    </article>
  )
}

// ── Export principal ────────────────────────────────────────────────────
export default function ContentIdeas({ goals }: Props) {
  const [seed, setSeed] = useState(INITIAL_SEED)
  const [spinning, setSpinning] = useState(false)

  // Après mount, on randomise une première fois pour que l'user voie
  // des idées différentes à chaque rechargement de la page.
  useEffect(() => {
    setSeed(Math.floor(Math.random() * 1_000_000))
  }, [])

  const { blogs, guides } = useMemo(
    () => generateContentIdeas(goals, seed, 5),
    [goals, seed]
  )

  const refresh = () => {
    setSpinning(true)
    setSeed(Math.floor(Math.random() * 1_000_000))
    setTimeout(() => setSpinning(false), 450)
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 via-white to-accent/5 rounded-xl2 border border-gray-100 p-6 md:p-8">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <div>
          <h3 className="text-base font-semibold text-textMain mb-1">
            Idées de contenu — pour grimper sur les requêtes cibles
          </h3>
          <p className="text-xs text-gray-500 max-w-[60ch] leading-relaxed">
            Générées à partir des actions SEO détectées + requêtes cibles.
            Ton cliniquement validé, scientifique accessible, grand public.
            Clique <strong className="text-textMain">Copier le brief</strong> d'une idée
            pour coller le résumé stratégique dans Claude et développer.
          </p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 bg-textMain text-white rounded-full px-4 py-2 text-xs font-semibold hover:bg-textMain/90 transition active:scale-95"
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={clsx('transition-transform duration-500', spinning && 'rotate-[360deg]')}
          >
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/><path d="M20.49 15a9 9 0 01-14.85 3.36L1 14"/>
          </svg>
          Refresh les idées
        </button>
      </div>

      <p className="text-[10px] text-gray-400 mb-6 flex items-center gap-1.5">
        <span>Seed actuelle :</span>
        <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[10px] text-gray-500">{seed}</code>
        <span className="text-gray-300">·</span>
        <span>Analysé sur {fmt(goals.totalQueries)} requêtes GSC</span>
      </p>

      {/* 5 idées de blog */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-primary rounded-full" />
          <h4 className="text-sm font-semibold text-textMain">Blog · 5 idées</h4>
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Contenu éditorial</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {blogs.map((idea, i) => (
            <IdeaCard key={`blog-${seed}-${i}`} idea={idea} index={i} />
          ))}
        </div>
      </div>

      {/* 5 idées de guide interactif */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-accent rounded-full" />
          <h4 className="text-sm font-semibold text-textMain">Guides interactifs · 5 idées</h4>
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Outils sur le site</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {guides.map((idea, i) => (
            <IdeaCard key={`guide-${seed}-${i}`} idea={idea} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
