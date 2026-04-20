/**
 * Configuration SEO — requêtes cibles et compétiteurs.
 *
 * ⚠️  À réviser avec Vincent. Les positions compétiteurs sont saisies
 * manuellement (pas d'API Ahrefs/SEMrush dispo). Actualiser trimestriellement
 * ou quand on sent que le marché a bougé.
 */

export type QueryIntent = 'brand' | 'commercial' | 'transactional' | 'informational'

export interface TargetQuery {
  query:    string
  intent:   QueryIntent
  /** 1 = pilier / doit ranker dans le top 3, 3 = nice-to-have */
  priority: 1 | 2 | 3
}

export interface Competitor {
  name:   string
  domain: string
  /** Positions manuelles pour les TARGET_QUERIES. null = non classé dans le top 100. */
  positions: Record<string, number | null>
}

// ── Requêtes cibles ─────────────────────────────────────────────────────
// Ordre lexical par priorité (1 en premier). Alignés sur le positionnement
// "probiotique côlon irritable / SCI" + l'acquisition locale Québec.
export const TARGET_QUERIES: TargetQuery[] = [
  { query: 'probaclac',                    intent: 'brand',         priority: 1 },
  { query: 'probiotique',                  intent: 'commercial',    priority: 1 },
  { query: 'probiotique sci',              intent: 'commercial',    priority: 1 },
  { query: 'probiotique côlon irritable',  intent: 'commercial',    priority: 1 },
  { query: 'probiotique ballonnements',    intent: 'commercial',    priority: 2 },
  { query: 'meilleur probiotique canada',  intent: 'commercial',    priority: 2 },
  { query: 'probiotique digestion',        intent: 'commercial',    priority: 2 },
  { query: 'probiotique pharmacie québec', intent: 'transactional', priority: 3 },
  { query: 'probiotique naturel',          intent: 'informational', priority: 3 },
]

// ── Compétiteurs ────────────────────────────────────────────────────────
// Positions mesurées manuellement — MàJ trimestrielle. null = pas dans top 100.
// Dernière MAJ : 2026-04-16 (à remplacer par des relevés réels).
export const COMPETITORS: Competitor[] = [
  {
    name:   'Bio-K+',
    domain: 'biokplus.com',
    positions: {
      'probaclac':                    null,
      'probiotique':                  7,
      'probiotique sci':              12,
      'probiotique côlon irritable':  8,
      'probiotique ballonnements':    6,
      'meilleur probiotique canada':  4,
      'probiotique digestion':        5,
      'probiotique pharmacie québec': 9,
      'probiotique naturel':          11,
    },
  },
  {
    name:   'Jamieson',
    domain: 'jamiesonvitamins.com',
    positions: {
      'probaclac':                    null,
      'probiotique':                  5,
      'probiotique sci':              null,
      'probiotique côlon irritable':  14,
      'probiotique ballonnements':    10,
      'meilleur probiotique canada':  2,
      'probiotique digestion':        8,
      'probiotique pharmacie québec': 13,
      'probiotique naturel':          6,
    },
  },
  {
    name:   'Webber Naturals',
    domain: 'webbernaturals.com',
    positions: {
      'probaclac':                    null,
      'probiotique':                  9,
      'probiotique sci':              18,
      'probiotique côlon irritable':  11,
      'probiotique ballonnements':    9,
      'meilleur probiotique canada':  6,
      'probiotique digestion':        10,
      'probiotique pharmacie québec': 15,
      'probiotique naturel':          9,
    },
  },
]

export const INTENT_LABEL: Record<QueryIntent, string> = {
  brand:          'Marque',
  commercial:     'Commercial',
  transactional:  'Transactionnel',
  informational:  'Informationnel',
}

export const INTENT_TONE: Record<QueryIntent, string> = {
  brand:          'bg-primary/10 text-primary',
  commercial:     'bg-accent/10 text-accent',
  transactional:  'bg-purple-500/10 text-purple-600',
  informational:  'bg-gray-100 text-gray-500',
}
