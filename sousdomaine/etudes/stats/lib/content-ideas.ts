/**
 * Content idea generator — produit des idées de blog & guides interactifs
 * à partir des actions SEO détectées + des requêtes cibles, pour grimper
 * en positionnement sur les requêtes Probaclac.
 *
 * Entièrement déterministe selon un seed (PRNG mulberry32), donc le bouton
 * "Refresh" change juste le seed → nouvelles idées sans appel serveur.
 */

import type { SeoGoals, SeoAction, SeoActionKind, SeoTargetRow } from './data'

export type IdeaKind = 'blog' | 'guide'

export interface IdeaKeywords {
  primary:     string       // requête principale (H1, title, URL)
  secondaries: string[]     // autres requêtes cibles connexes (H2, intro, conclusion)
  longtail:    string[]     // variations longue-traîne naturelles dans le corps
  lsi:         string[]     // termes d'autorité topique (microbiote, souche, etc.)
}

export interface ContentIdea {
  kind:            IdeaKind
  title:           string
  targetQuery:     string
  targetPosition:  number | null
  targetImpr:      number
  angle:           string
  format:          string           // ex: "Article long 1500-2000 mots"
  summary:         string           // brief stratégique copy-pasteable
  keywords:        IdeaKeywords     // mots-clés à intégrer dans l'article/guide
  actionKind:      SeoActionKind | null
  rationale:       string           // pourquoi cette idée maintenant
}

// ── PRNG déterministe ───────────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleSeeded<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

// ── Angles blog par type d'action ───────────────────────────────────────
// Ton : cliniquement approuvé, scientifique accessible, lifestyle propre,
// grand public. Pas de clickbait, pas de superlatifs.
const BLOG_ANGLES: Record<SeoActionKind | 'default', string[]> = {
  'quick-win': [
    'Le guide pratique',
    'Ce que montrent les études cliniques',
    'Comprendre le mécanisme d\'action',
    'Combien de temps avant les premiers effets',
    'Protocole validé : les repères utiles',
    'Suivre sa progression en 6 semaines',
  ],
  'ctr-low': [
    'Guide à jour — repères scientifiques',
    'Réponses d\'un gastroentérologue',
    'Protocole recommandé et sources cliniques',
    'Par où commencer : les étapes clés',
    'Parcours documentés : 3 cas typiques',
    'Revue des données récentes',
  ],
  'content-gap': [
    'Dossier : causes, symptômes, recommandations',
    'Comprendre en 5 minutes',
    'Les repères essentiels pour choisir',
    'FAQ fondée sur les guides cliniques',
    'Décryptage sourcé — études et mécanismes',
    'Vue d\'ensemble pour le grand public',
  ],
  'close-podium': [
    'Mythes et réalités — le point scientifique',
    'Ce que dit la recherche récente',
    'Analyse comparative sourcée',
    'Cas cliniques documentés',
    'La réponse du microbiote — ce qu\'on sait',
  ],
  'default': [
    'Guide essentiel',
    'Ce que disent les études',
    'Recommandations pratiques',
    'Revue de la littérature accessible',
  ],
}

// ── Formats interactifs pour les guides ─────────────────────────────────
const GUIDE_FORMATS: { label: string; desc: string; bestFor: string[] }[] = [
  {
    label: 'Quiz interactif',
    desc: '6 à 10 questions orientant vers une recommandation produit.',
    bestFor: ['Sélection de formule', 'Diagnostic symptômes', 'Marque vs besoin'],
  },
  {
    label: 'Calculateur personnalisé',
    desc: 'Input utilisateur → sortie chiffrée (durée de cure, dosage, timeline).',
    bestFor: ['Durée avant résultats', 'Dosage selon profil', 'ROI d\'une cure'],
  },
  {
    label: 'Questionnaire diagnostic',
    desc: 'Arbre de décision qui distingue condition A vs B et guide vers la bonne page.',
    bestFor: ['SCI vs autre trouble', 'Ballonnements causes', 'Antibiotiques quand'],
  },
  {
    label: 'Sélecteur de formule',
    desc: '4 étapes visuelles (âge, symptômes, contexte, objectif) → formule Probaclac idéale.',
    bestFor: ['Famille Probaclac', 'Gamme recommandée', 'Quelle concentration'],
  },
  {
    label: 'Timeline interactive',
    desc: 'Curseur 0-90 jours montrant ce qui se passe dans l\'intestin jour par jour.',
    bestFor: ['Mécanisme d\'action', 'Cure antibiotiques', 'Installation flore'],
  },
  {
    label: 'Comparateur visuel',
    desc: 'Tableau interactif filtrable : souches × symptômes × marques.',
    bestFor: ['Probaclac vs concurrents', 'Quelle souche pour quoi', 'Benchmark'],
  },
  {
    label: 'Journal digestif',
    desc: 'Outil gratuit pour logger symptômes/alimentation → rapport PDF.',
    bestFor: ['Engagement long', 'Lead magnet', 'Données propriétaires'],
  },
  {
    label: 'Flowchart "par où commencer"',
    desc: 'Schéma cliquable : « je ressens X » → chemin recommandé en 3 clics.',
    bestFor: ['Trouble digestif', 'Diarrhée antibiotiques', 'Premiers pas'],
  },
  {
    label: 'Infographie animée',
    desc: 'Scroll-storytelling : mécanisme d\'action souche par souche.',
    bestFor: ['7 souches expliquées', 'Microbiote 101', 'Différenciation produit'],
  },
  {
    label: 'Assistant conversationnel',
    desc: 'Mini-chatbot scripté qui répond aux 15 questions les plus fréquentes.',
    bestFor: ['FAQ interactive', 'Support pré-achat', 'Longue traîne SEO'],
  },
]

// ── Classification topique + pools LSI ──────────────────────────────────
type Topic = 'digestive' | 'travel' | 'feminine' | 'local' | 'brand' | 'generic'

function classifyTopic(query: string): Topic {
  const q = query.toLowerCase()
  if (q.includes('probaclac')) return 'brand'
  if (q.match(/sci|côlon|colon|intestin|digestion|ballonnement|transit|crohn|dysbiose/)) return 'digestive'
  if (q.match(/tourist|voyageur|voyage|diarrh/)) return 'travel'
  if (q.match(/vaginal|vaginose|yeast|levure|candida/)) return 'feminine'
  if (q.match(/pharmacie|québec|quebec|canada|canadien/)) return 'local'
  return 'generic'
}

const LSI_POOLS: Record<Topic, string[]> = {
  digestive: [
    'microbiote intestinal', 'flore digestive', 'Lactobacillus', 'Bifidobacterium',
    'dysbiose', 'transit intestinal', 'syndrome de l\'intestin irritable',
    'santé gastro-intestinale', 'barrière intestinale', 'fermentation colique',
  ],
  travel: [
    'diarrhée du voyageur', 'tourista', 'gastro-entérite', 'prévention voyage',
    'adaptation digestive', 'flore intestinale', 'Escherichia coli',
  ],
  feminine: [
    'flore vaginale', 'vaginose bactérienne', 'Lactobacillus crispatus',
    'candida albicans', 'équilibre vaginal', 'pH vaginal', 'récurrence infectieuse',
  ],
  local: [
    'pharmacie québécoise', 'fabriqué au Québec', 'grade pharmaceutique',
    'NPN Santé Canada', 'conseil pharmacien', 'disponibilité locale',
  ],
  brand: [
    'Probaclac', 'Laboratoires Nicar', '7 souches', '6,5 milliards UFC',
    'grade pharmaceutique', 'stable à température pièce',
  ],
  generic: [
    'probiotique multi-souches', 'UFC', 'capsule végétale', 'souche bactérienne',
    'microbiote', 'santé intestinale', 'flore bactérienne',
  ],
}

// Termes d'autorité toujours pertinents pour Probaclac
const BRAND_ANCHOR_TERMS = [
  'Probaclac', 'grade pharmaceutique', '7 souches', '6,5 milliards UFC',
]

// ── Génération longue-traîne à partir d'une requête ─────────────────────
function generateLongtail(query: string, rng: () => number): string[] {
  const q = query.toLowerCase().trim()
  const patterns: string[] = [
    `meilleur ${q}`,
    `comment choisir son ${q}`,
    `combien de temps pour ${q}`,
    `${q} avis`,
    `${q} efficacité`,
    `${q} posologie`,
    `${q} études cliniques`,
    `soulager ${q}`,
    `${q} sans ordonnance`,
    `${q} naturellement`,
    `${q} recommandé`,
    `${q} québec`,
  ]
  // On en pioche 4-5 aléatoires selon le seed
  return shuffleSeeded(patterns, rng).slice(0, 5)
}

// ── Génération des mots-clés complets pour une idée ─────────────────────
function genKeywords(query: string, goals: SeoGoals, rng: () => number): IdeaKeywords {
  const topic = classifyTopic(query)
  const qLower = query.toLowerCase()

  // Secondaires = autres requêtes cibles dans le même topic OU partageant un mot
  const secondaries = goals.targets
    .filter(t => t.query.toLowerCase() !== qLower)
    .filter(t => {
      const tTopic = classifyTopic(t.query)
      if (tTopic === topic) return true
      // sinon : partage d'un mot significatif (>3 lettres)
      const qWords = qLower.split(/\s+/).filter(w => w.length > 3)
      const tWords = t.query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      return qWords.some(w => tWords.includes(w))
    })
    .slice(0, 4)
    .map(t => t.query)

  // LSI = pool du topic + 2 termes brand anchor
  const lsiPool = [...LSI_POOLS[topic], ...BRAND_ANCHOR_TERMS]
  const lsi = shuffleSeeded([...new Set(lsiPool)], rng).slice(0, 7)

  // Longue-traîne
  const longtail = generateLongtail(query, rng)

  return {
    primary: query,
    secondaries,
    longtail,
    lsi,
  }
}

// ── Formats blog suggérés ───────────────────────────────────────────────
const BLOG_FORMATS = [
  'Article long-form 1500-2000 mots',
  'Article pilier 2500+ mots avec TDM',
  'Article court 800-1000 mots orienté quick-answer',
  'Dossier multi-pages avec hub + 4 sous-articles',
  'Article listicle structuré (5-7 points)',
  'Étude de cas / témoignage narratif 1200 mots',
]

// ── Générateurs de summary ──────────────────────────────────────────────
function genBlogSummary(
  query: string,
  angle: string,
  format: string,
  position: number | null,
  impr: number,
  actionKind: SeoActionKind | null,
  rng: () => number,
): string {
  const intros: Record<string, string> = {
    'quick-win':    `Position ${position?.toFixed(1) ?? '—'} sur ~${impr} impressions mensuelles — à 1-2 rangs du top 3. L'angle `,
    'ctr-low':      `Bon positionnement (pos. ${position?.toFixed(1)}) mais CTR en-dessous de la moyenne — le titre ou l'extrait ne reflète pas l'intention. L'angle `,
    'content-gap':  `${impr} impressions mensuelles, 0 clic — Google nous juge pertinent mais la page actuelle ne répond pas à la requête. L'angle `,
    'close-podium': `Seconde page (pos. ${position?.toFixed(1)}) — pour progresser : autorité thématique + profondeur sourcée. L'angle `,
  }
  const intro = actionKind && intros[actionKind] ? intros[actionKind] : 'Angle éditorial '

  const structures = [
    `H1 incluant la requête en tête, 4-6 H2 par question fréquente (People Also Ask), un encart "ce que disent les études" citant 2-3 références (PubMed / revues systématiques / guides cliniques INSPQ), section FAQ indexable en bas`,
    `Structure pyramidale : résumé clinique 150 mots, contexte physiopathologique accessible, données d'efficacité (taille d'échantillon, durée, méthodologie), recommandations pratiques, avertissements (quand consulter)`,
    `Format Q/R : 8-10 questions fréquentes avec réponses autonomes de 80-120 mots chacune, adaptées au Featured Snippet. Chaque réponse cite une source`,
    `Approche sourcée : bloc intro + tableau des souches et effets démontrés + courte revue des essais cliniques (n=, durée, population), conclusion nuancée`,
  ]

  const tonality = [
    `Ton : factuel, mesuré, utilise des formulations prudentes ("peut contribuer à", "associé à", "les études suggèrent")`,
    `Registre grand public mais rigoureux — éviter le jargon non-défini ; quand un terme médical est utilisé, le définir en incise`,
    `Pas de superlatifs ni de promesses absolues. Mentionner les limites des études et les contextes où consulter un professionnel`,
    `Voix : expert pédagogue. On informe, on ne vend pas. Le produit apparaît uniquement en recommandation pratique sourcée`,
  ]

  const linkings = [
    `Maillage sortant vers /sci et la page-produit Probaclac Adultes (ancre descriptive, pas "cliquez ici")`,
    `Liens internes vers 2 articles adjacents du cluster microbiote + page "études cliniques"`,
    `Ancres contextuelles vers la gamme Probaclac (Adultes, 50+, Extra-fort) selon le besoin évoqué`,
    `Liens vers une page pilier microbiote + cluster de 3-4 sous-articles pour signal topic authority`,
  ]

  const cta = [
    `CTA fin d'article : "Découvrir la formule Probaclac — 7 souches, 6,5 G UFC" vers la page produit`,
    `CTA double : téléchargement d'un PDF résumé (lead magnet discret) + lien vers la gamme`,
    `CTA contextuel : "Trouver la formule adaptée à votre profil" vers l'outil interactif`,
    `CTA soft : "Consulter les études cliniques qui appuient Probaclac" vers /etudes`,
  ]

  return `${intro}« ${angle} » correspond à l'intention utilisateur sur cette requête. Format suggéré : ${format}. ${pick(structures, rng)}. ${pick(tonality, rng)}. ${pick(linkings, rng)}. ${pick(cta, rng)}. Méta-title <60c avec la requête exacte au début + un bénéfice mesuré, méta-description 150-160c factuelle (pas de "découvrez").`
}

function genGuideSummary(
  query: string,
  fmt: { label: string; desc: string; bestFor: string[] },
  position: number | null,
  impr: number,
  rng: () => number,
): string {
  const tone = [
    `Ton : pédagogue, factuel. Chaque question est formulée clairement ; chaque recommandation cite son fondement (étude, guide clinique, méta-analyse)`,
    `Registre grand public. Pas de diagnostic implicite — le guide oriente, il ne se substitue pas à un avis professionnel (mention claire)`,
    `Clinique mais non-anxiogène : expliquer le mécanisme avec des visuels sobres, sans dramatisation`,
    `Accessible : chaque résultat doit être compréhensible par quelqu'un sans formation médicale`,
  ]
  const seoLevers = [
    `Chaque étape/résultat = une URL indexable (/outils/<slug>/etape-X) → longue-traîne automatique`,
    `JSON-LD FAQPage + HowTo sur la page d'accueil du guide pour rich snippet`,
    `Balisage schema.org approprié + indexabilité des pages résultat`,
    `Logs anonymisés des parcours utilisateurs → data propriétaire pour identifier les content gaps futurs`,
  ]
  const conversion = [
    `Sortie du parcours = recommandation Probaclac contextualisée (souches, dosage, durée) avec CTA sobre vers la page produit`,
    `Option de recevoir le résumé par courriel (consentement explicite) + séquence nurturing 7 jours basée sur le résultat`,
    `Bouton "Sauvegarder mon résultat" pour revenir plus tard — pas d'obligation de créer un compte`,
    `Avertissement clair en sortie : "Ces recommandations ne remplacent pas un avis médical personnalisé"`,
  ]
  const embed = [
    `Placement : milieu d'article pilier + page-produit + entry dans le menu "Outils"`,
    `Page dédiée /outils/<slug> + widget intégrable sur les 5 articles top-performers`,
    `Mobile-first prioritaire — 70 % du trafic Probaclac est mobile`,
    `Intégration dans le footer comme outil permanent de la marque`,
  ]

  return `${fmt.desc} Cible SEO « ${query} » (${impr} impr./mois, pos. ${position?.toFixed(1) ?? '—'}). ${pick(tone, rng)}. ${pick(seoLevers, rng)}. ${pick(conversion, rng)}. ${pick(embed, rng)}. Tech stack suggéré : Next.js component + Framer Motion pour transitions fluides + persistance sessionStorage. Livrable v1 en 2-3 semaines. Le guide doit inclure un disclaimer médical visible et des sources cliquables pour chaque affirmation.`
}

// ── Fonction principale ─────────────────────────────────────────────────
export function generateContentIdeas(
  goals: SeoGoals,
  seed: number,
  count: number = 5,
): { blogs: ContentIdea[]; guides: ContentIdea[] } {
  const rng = mulberry32(seed)

  // Pool de requêtes candidates : actions détectées + requêtes cibles non-classées
  // Les actions sont prioritaires car elles ont un signal concret.
  type PoolItem = {
    query: string
    position: number | null
    impr: number
    kind: SeoActionKind | null
    rationale: string
  }
  const actionQueries: PoolItem[] = goals.actions.map(a => ({
    query: a.query,
    position: a.position,
    impr: a.impressions,
    kind: a.kind,
    rationale: a.rationale,
  }))

  const targetQueries: PoolItem[] = goals.targets
    .filter(t => t.impressions > 0 || t.priority === 1)
    .map(t => ({
      query: t.query,
      position: t.position,
      impr: t.impressions,
      kind: null,
      rationale: `Requête cible priorité ${t.priority} (${t.intent})`,
    }))

  // Fusionner, dédupliquer par requête
  const seen = new Set<string>()
  const pool: PoolItem[] = []
  for (const item of [...actionQueries, ...targetQueries]) {
    const key = item.query.toLowerCase().trim()
    if (!seen.has(key)) {
      seen.add(key)
      pool.push(item)
    }
  }

  const shuffled = shuffleSeeded(pool, rng)

  // ── Idées blog ────────────────────────────────────────────────────────
  const blogs: ContentIdea[] = []
  for (let i = 0; i < count && i < shuffled.length; i++) {
    const item = shuffled[i]
    const angles = BLOG_ANGLES[item.kind ?? 'default']
    const angle = pick(angles, rng)
    const format = pick(BLOG_FORMATS, rng)
    const title = buildBlogTitle(item.query, angle, rng)
    blogs.push({
      kind: 'blog',
      title,
      targetQuery: item.query,
      targetPosition: item.position,
      targetImpr: item.impr,
      angle,
      format,
      summary: genBlogSummary(item.query, angle, format, item.position, item.impr, item.kind, rng),
      keywords: genKeywords(item.query, goals, rng),
      actionKind: item.kind,
      rationale: item.rationale,
    })
  }

  // ── Idées guides (pool différent — on re-shuffle pour variété) ───────
  const shuffledGuides = shuffleSeeded(pool, rng)
  const shuffledFormats = shuffleSeeded(GUIDE_FORMATS, rng)
  const guides: ContentIdea[] = []
  for (let i = 0; i < count && i < shuffledGuides.length; i++) {
    const item = shuffledGuides[i]
    const fmt = shuffledFormats[i % shuffledFormats.length]
    const title = buildGuideTitle(item.query, fmt.label, rng)
    guides.push({
      kind: 'guide',
      title,
      targetQuery: item.query,
      targetPosition: item.position,
      targetImpr: item.impr,
      angle: fmt.label,
      format: fmt.label,
      summary: genGuideSummary(item.query, fmt, item.position, item.impr, rng),
      keywords: genKeywords(item.query, goals, rng),
      actionKind: item.kind,
      rationale: item.rationale,
    })
  }

  return { blogs, guides }
}

// ── Builders de titres ──────────────────────────────────────────────────
function buildBlogTitle(query: string, angle: string, rng: () => number): string {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const patterns = [
    () => `${cap(query)} — ${angle}`,
    () => `${angle} : ${cap(query)}`,
    () => `${cap(query)} : ${angle.toLowerCase()}`,
    () => `${angle} sur ${query}`,
  ]
  return pick(patterns, rng)()
}

function buildGuideTitle(query: string, fmtLabel: string, rng: () => number): string {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const patterns = [
    () => `${fmtLabel} : ${cap(query)}`,
    () => `${fmtLabel} — « ${query} »`,
    () => `${cap(query)} — ${fmtLabel.toLowerCase()}`,
  ]
  return pick(patterns, rng)()
}
