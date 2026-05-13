/**
 * Data fetchers — called both from Server Components (page.tsx)
 * and from API route handlers (app/api/.../route.ts).
 *
 * All fetchers accept an optional { pageUrl } filter. When set,
 * results are scoped to that specific page (used for /sci dashboard).
 */

import { getGA4Client, getGA4Property, getGSCClient, getGSCSiteUrl, formatGA4Date, num } from './google'
import { TARGET_QUERIES, COMPETITORS, type QueryIntent } from './seo-goals'

// ── Types ──────────────────────────────────────────────────────────────
export interface FetchOptions {
  /** Filter results to a specific page URL (e.g. https://etudes.probaclac.ca/sci). */
  pageUrl?: string
}

export interface GA4Traffic {
  sessions: number
  users: number
  newUsers: number
  avgSessionDuration: number
  bounceRate: number
  timeSeries: { date: string; sessions: number; users: number }[]
  channels: { channel: string; sessions: number }[]
}

export interface GA4Conversions {
  totalConversions: number
  conversionRate: number
  goals: { name: string; conversions: number; value: number }[]
  weekly: { week: string; conversions: number }[]
}

export interface GSCKeywords {
  totalClicks: number
  totalImpressions: number
  avgCtr: number
  avgPosition: number
  keywords: { query: string; clicks: number; impressions: number; ctr: number; position: number }[]
}

export interface MetaCampaigns {
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  avgCpc: number
  avgCpm: number
  roas: number
  campaigns: {
    id: string
    name: string
    status: string
    spend: number
    impressions: number
    clicks: number
    conversions: number
    cpc: number
    roas: number
  }[]
}

// ── Helpers : construction des filtres ──────────────────────────────────
/** Build a GA4 dimensionFilter that keeps only events on a given page. */
function ga4PageFilter(pageUrl?: string) {
  if (!pageUrl) return undefined
  return {
    filter: {
      fieldName: 'pageLocation',
      stringFilter: {
        matchType: 'BEGINS_WITH' as const,
        value: pageUrl,
      },
    },
  }
}

/** Build a GSC dimensionFilterGroups that keeps only data for a given page. */
function gscPageFilter(pageUrl?: string) {
  if (!pageUrl) return undefined
  return [{
    filters: [{
      dimension: 'page',
      operator: 'equals',
      expression: pageUrl,
    }],
  }]
}

// ── GA4 : Trafic ────────────────────────────────────────────────────────
export async function fetchGA4Traffic(opts: FetchOptions = {}): Promise<GA4Traffic> {
  const client = getGA4Client()
  const property = getGA4Property()
  const dateRange = { startDate: '30daysAgo', endDate: 'today' }
  const dimensionFilter = ga4PageFilter(opts.pageUrl)

  const [[summaryRes], [tsRes], [chRes]] = await Promise.all([
    client.runReport({
      property,
      dateRanges: [dateRange],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      ...(dimensionFilter && { dimensionFilter }),
    }),
    client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      ...(dimensionFilter && { dimensionFilter }),
    }),
    client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 8,
      ...(dimensionFilter && { dimensionFilter }),
    }),
  ])

  const m = summaryRes.rows?.[0]?.metricValues ?? []

  return {
    sessions: num(m[0]?.value),
    users: num(m[1]?.value),
    newUsers: num(m[2]?.value),
    avgSessionDuration: Math.round(num(m[3]?.value)),
    bounceRate: num(m[4]?.value),
    timeSeries: (tsRes.rows ?? []).map(r => ({
      date: formatGA4Date(r.dimensionValues?.[0]?.value ?? ''),
      sessions: num(r.metricValues?.[0]?.value),
      users: num(r.metricValues?.[1]?.value),
    })),
    channels: (chRes.rows ?? []).map(r => ({
      channel: r.dimensionValues?.[0]?.value ?? '(not set)',
      sessions: num(r.metricValues?.[0]?.value),
    })),
  }
}

// ── GA4 : Conversions ───────────────────────────────────────────────────
const EVENT_LABEL: Record<string, string> = {
  purchase:       'Achat',
  begin_checkout: 'Début de commande',
  add_to_cart:    'Ajout au panier',
  generate_lead:  'Lead généré',
  form_submit:    'Formulaire soumis',
  sign_up:        'Inscription',
  contact:        'Contact',
  file_download:  'Téléchargement',
  click:          'Clic sortant',
}
const labelFor = (e: string) => EVENT_LABEL[e] ?? e.replace(/_/g, ' ')

export async function fetchGA4Conversions(opts: FetchOptions = {}): Promise<GA4Conversions> {
  const client = getGA4Client()
  const property = getGA4Property()
  const dimensionFilter = ga4PageFilter(opts.pageUrl)

  const [[sumRes], [goalsRes], [wkRes]] = await Promise.all([
    client.runReport({
      property,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [{ name: 'conversions' }, { name: 'sessions' }],
      ...(dimensionFilter && { dimensionFilter }),
    }),
    client.runReport({
      property,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'conversions' }, { name: 'totalRevenue' }],
      orderBys: [{ metric: { metricName: 'conversions' }, desc: true }],
      limit: 20,
      ...(dimensionFilter && { dimensionFilter }),
    }),
    client.runReport({
      property,
      dateRanges: [{ startDate: '56daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'week' }],
      metrics: [{ name: 'conversions' }],
      orderBys: [{ dimension: { dimensionName: 'week' } }],
      ...(dimensionFilter && { dimensionFilter }),
    }),
  ])

  const totalConversions = num(sumRes.rows?.[0]?.metricValues?.[0]?.value)
  const totalSessions    = num(sumRes.rows?.[0]?.metricValues?.[1]?.value)

  return {
    totalConversions,
    conversionRate: totalSessions > 0 ? totalConversions / totalSessions : 0,
    goals: (goalsRes.rows ?? [])
      .map(r => ({
        name: labelFor(r.dimensionValues?.[0]?.value ?? ''),
        conversions: num(r.metricValues?.[0]?.value),
        value: num(r.metricValues?.[1]?.value),
      }))
      .filter(g => g.conversions > 0)
      .slice(0, 6),
    weekly: (wkRes.rows ?? []).map((r, i) => ({
      week: `S${i + 1}`,
      conversions: num(r.metricValues?.[0]?.value),
    })),
  }
}

// ── Search Console : mots-clés ──────────────────────────────────────────
export async function fetchGSCKeywords(opts: FetchOptions = {}): Promise<GSCKeywords> {
  const webmasters = getGSCClient()
  const siteUrl = getGSCSiteUrl()
  const dimensionFilterGroups = gscPageFilter(opts.pageUrl)

  // GSC has a ~2-day data lag
  const end = new Date()
  end.setDate(end.getDate() - 2)
  const start = new Date(end)
  start.setDate(end.getDate() - 30)
  const toISO = (d: Date) => d.toISOString().slice(0, 10)

  const [summaryRes, keywordsRes] = await Promise.all([
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: toISO(start),
        endDate: toISO(end),
        rowLimit: 1,
        ...(dimensionFilterGroups && { dimensionFilterGroups }),
      },
    }),
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: toISO(start),
        endDate: toISO(end),
        dimensions: ['query'],
        rowLimit: 25,
        ...(dimensionFilterGroups && { dimensionFilterGroups }),
      },
    }),
  ])

  const s = summaryRes.data.rows?.[0] ?? {}

  return {
    totalClicks: s.clicks ?? 0,
    totalImpressions: s.impressions ?? 0,
    avgCtr: s.ctr ?? 0,
    avgPosition: s.position ?? 0,
    keywords: (keywordsRes.data.rows ?? []).map(r => ({
      query: r.keys?.[0] ?? '',
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    })),
  }
}

// ── GA4 : Stats d'une page spécifique (vues + events) ───────────────────
export interface GA4PageStats {
  pageViews: number
  users: number
  newUsers: number
  avgEngagementTime: number
  timeSeries: { date: string; pageViews: number; users: number }[]
  events: { name: string; count: number; users: number }[]
}

export async function fetchGA4PageStats(opts: FetchOptions = {}): Promise<GA4PageStats> {
  const client = getGA4Client()
  const property = getGA4Property()
  const dateRange = { startDate: '30daysAgo', endDate: 'today' }
  const dimensionFilter = ga4PageFilter(opts.pageUrl)

  const [[summaryRes], [tsRes], [eventsRes]] = await Promise.all([
    // Summary KPIs
    client.runReport({
      property,
      dateRanges: [dateRange],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'userEngagementDuration' },
      ],
      ...(dimensionFilter && { dimensionFilter }),
    }),
    // Daily time series
    client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      ...(dimensionFilter && { dimensionFilter }),
    }),
    // All events fired on this page (catches button clicks automatically)
    client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 50,
      ...(dimensionFilter && { dimensionFilter }),
    }),
  ])

  const m = summaryRes.rows?.[0]?.metricValues ?? []
  const pageViews          = num(m[0]?.value)
  const users              = num(m[1]?.value)
  const newUsers           = num(m[2]?.value)
  const engagementDuration = num(m[3]?.value)

  return {
    pageViews,
    users,
    newUsers,
    avgEngagementTime: users > 0 ? Math.round(engagementDuration / users) : 0,
    timeSeries: (tsRes.rows ?? []).map(r => ({
      date: formatGA4Date(r.dimensionValues?.[0]?.value ?? ''),
      pageViews: num(r.metricValues?.[0]?.value),
      users: num(r.metricValues?.[1]?.value),
    })),
    events: (eventsRes.rows ?? []).map(r => ({
      name: r.dimensionValues?.[0]?.value ?? '',
      count: num(r.metricValues?.[0]?.value),
      users: num(r.metricValues?.[1]?.value),
    })),
  }
}

// ── GA4 : Stats générales du site (tous les sous-domaines) ─────────────
// Utilisé par la Section 1 du brief.
export interface SiteKPI {
  current:   number
  previous:  number
  trendPct:  number | null
}

export interface TopPage {
  path:       string
  title:      string
  hostName:   string
  pageViews:  number
  avgSessionDuration: number  // secs
  engagementRate: number       // 0..1
}

export interface SiteStats {
  sessions:    SiteKPI
  pageViews:   SiteKPI
  activeUsers: SiteKPI
  /** Timeseries mensuelle sur 12 mois — pour le graph "Visites mensuelles". */
  monthly:     { month: string; sessions: number; users: number }[]
  topPages:    TopPage[]
}

// Helpers pour parser le pivot dateRange implicite
function parsePeriodRows<T>(rows: any[], extract: (metricValues: any[]) => T): Record<'current' | 'previous', T | null> {
  const out: Record<'current' | 'previous', T | null> = { current: null, previous: null }
  for (const row of rows ?? []) {
    // quand il y a plusieurs dateRanges et AUCUNE autre dimension déclarée,
    // la GA4 API met la dateRange en dimensionValues[0]
    const period = row.dimensionValues?.[0]?.value as 'current' | 'previous' | undefined
    if (period === 'current' || period === 'previous') {
      out[period] = extract(row.metricValues ?? [])
    }
  }
  return out
}

export async function fetchGA4SiteStats(): Promise<SiteStats> {
  const client = getGA4Client()
  const property = getGA4Property()

  const comparePeriods = [
    { startDate: '30daysAgo', endDate: 'today',      name: 'current'  },
    { startDate: '60daysAgo', endDate: '31daysAgo',  name: 'previous' },
  ]

  const [[summaryRes], [monthlyRes], [topPagesRes]] = await Promise.all([
    // Summary KPIs — 30j vs 30 précédents, scope site entier
    client.runReport({
      property,
      dateRanges: comparePeriods,
      metrics: [
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
      ],
    }),
    // Visites mensuelles sur 12 mois glissants (metric: sessions, dim: yearMonth)
    client.runReport({
      property,
      dateRanges: [{ startDate: '365daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'yearMonth' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'yearMonth' } }],
    }),
    // Top pages (all hostnames, all subdomains) — tri par pageViews
    client.runReport({
      property,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [
        { name: 'pagePath' },
        { name: 'pageTitle' },
        { name: 'hostName' },
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'engagementRate' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10, // on prendra les 5 premières côté UI, mais garde quelques en réserve
    }),
  ])

  // Parser summary : dimensionValues[0] = dateRange auto-pivot
  const periods = parsePeriodRows(summaryRes.rows ?? [], m => ({
    sessions:   num(m[0]?.value),
    pageViews:  num(m[1]?.value),
    users:      num(m[2]?.value),
  }))
  const cur = periods.current  ?? { sessions: 0, pageViews: 0, users: 0 }
  const prv = periods.previous ?? { sessions: 0, pageViews: 0, users: 0 }

  return {
    sessions:    { current: cur.sessions,   previous: prv.sessions,   trendPct: trend(cur.sessions, prv.sessions) },
    pageViews:   { current: cur.pageViews,  previous: prv.pageViews,  trendPct: trend(cur.pageViews, prv.pageViews) },
    activeUsers: { current: cur.users,      previous: prv.users,      trendPct: trend(cur.users, prv.users) },
    monthly: (monthlyRes.rows ?? []).map(r => ({
      month:    r.dimensionValues?.[0]?.value ?? '',  // format "YYYYMM"
      sessions: num(r.metricValues?.[0]?.value),
      users:    num(r.metricValues?.[1]?.value),
    })),
    topPages: (topPagesRes.rows ?? []).map(r => ({
      path:               r.dimensionValues?.[0]?.value ?? '',
      title:              r.dimensionValues?.[1]?.value ?? '(sans titre)',
      hostName:           r.dimensionValues?.[2]?.value ?? '',
      pageViews:          num(r.metricValues?.[0]?.value),
      avgSessionDuration: Math.round(num(r.metricValues?.[1]?.value)),
      engagementRate:     num(r.metricValues?.[2]?.value),
    })),
  }
}

// ── GA4 : Landing KPIs (sessions, bounce, CTA breakdown avec compare) ──
// Utilisé par la Section 2 — Landing /sci du brief.
// Compare 30j vs 30j précédents pour chaque KPI.
export interface LandingCTA {
  label: string
  clicks: number
  clicksPrev: number
  trendPct: number | null  // null = pas de base de comparaison
  ctr: number              // clicks / sessions (période courante)
}

export interface LandingKPIs {
  sessions:       { current: number; previous: number; trendPct: number | null }
  pageViews:      { current: number; previous: number; trendPct: number | null }
  users:          { current: number; previous: number; trendPct: number | null }
  bounceRate:     { current: number; previous: number; trendPct: number | null }
  avgEngagement:  { current: number; previous: number; trendPct: number | null } // secs
  ctas:           LandingCTA[]   // dans l'ordre canonique défini ci-dessous
  /** cta_click firings sans cta_label (dimension créée 2026-04-16 — backfill impossible). */
  unlabeledClicks: { current: number; previous: number }
  totalCtaClicks: number
  /** true si aucune impression de cta_click trouvée sur la période courante */
  noCtaData:      boolean
}

export interface LandingOptions {
  /** Path à filtrer (ex: "/sci"). */
  pagePath: string
  /** Labels des CTAs attendus (ordre des cards). */
  ctaLabels: string[]
}

/** Calcule un pourcentage d'évolution safe (null si pas de base). */
function trend(cur: number, prev: number): number | null {
  if (prev === 0) return cur > 0 ? null : 0    // infinity or no-change
  return ((cur - prev) / prev) * 100
}

export async function fetchLandingKPIs(opts: LandingOptions): Promise<LandingKPIs> {
  const client = getGA4Client()
  const property = getGA4Property()

  // Filtres réutilisables
  const pagePathFilter = {
    filter: {
      fieldName: 'pagePath',
      stringFilter: { matchType: 'EXACT' as const, value: opts.pagePath },
    },
  }
  const ctaAndPageFilter = {
    andGroup: {
      expressions: [
        { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT' as const, value: 'cta_click' } } },
        { filter: { fieldName: 'pagePath',  stringFilter: { matchType: 'EXACT' as const, value: opts.pagePath } } },
      ],
    },
  }

  // Deux périodes : "current" = 30 derniers jours, "previous" = 30 jours avant.
  const dateRanges = [
    { startDate: '30daysAgo',  endDate: 'today',       name: 'current'  },
    { startDate: '60daysAgo',  endDate: '31daysAgo',   name: 'previous' },
  ]

  // Note: la GA4 Data API auto-ajoute "dateRange" en dernière dimension quand
  // on passe plusieurs dateRanges — ne PAS la lister dans `dimensions`.

  const [[summaryRes], [ctaRes]] = await Promise.all([
    // KPIs session-scoped sur la page /sci (avec compare)
    client.runReport({
      property,
      dateRanges,
      metrics: [
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'bounceRate' },
        { name: 'userEngagementDuration' },
      ],
      dimensionFilter: pagePathFilter,
    }),
    // CTA clicks par label (event-scoped, avec compare)
    client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'customEvent:cta_label' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: ctaAndPageFilter,
    }),
  ])

  // Summary : dateRange auto-pivot → dimensionValues[0] est "current" ou "previous"
  const summary = { current: {} as any, previous: {} as any }
  for (const row of summaryRes.rows ?? []) {
    const period = row.dimensionValues?.[0]?.value as 'current' | 'previous'
    if (period !== 'current' && period !== 'previous') continue
    summary[period] = {
      sessions:   num(row.metricValues?.[0]?.value),
      pageViews:  num(row.metricValues?.[1]?.value),
      users:      num(row.metricValues?.[2]?.value),
      bounceRate: num(row.metricValues?.[3]?.value),
      engagement: num(row.metricValues?.[4]?.value),
    }
  }

  // CTA : dimensionValues[0] = cta_label, dimensionValues[1] = dateRange
  // Note : "(not set)" = événement fired avant l'enregistrement de la dimension custom
  // (ou paramètre non envoyé) — on l'agrège séparément comme "non-étiqueté".
  const ctaMap = new Map<string, { current: number; previous: number }>()
  let unlabeledCurrent = 0, unlabeledPrevious = 0
  for (const row of ctaRes.rows ?? []) {
    const label  = row.dimensionValues?.[0]?.value ?? ''
    const period = row.dimensionValues?.[1]?.value as 'current' | 'previous'
    if (period !== 'current' && period !== 'previous') continue
    const count  = num(row.metricValues?.[0]?.value)

    if (!label || label === '(not set)') {
      if (period === 'current') unlabeledCurrent += count
      else unlabeledPrevious += count
      continue
    }

    const prev = ctaMap.get(label) ?? { current: 0, previous: 0 }
    prev[period] = count
    ctaMap.set(label, prev)
  }

  const currentSessions = summary.current.sessions ?? 0
  const prevSessions    = summary.previous.sessions ?? 0

  // Construire les cards dans l'ordre demandé (complète avec 0 si label manquant)
  const ctas: LandingCTA[] = opts.ctaLabels.map(label => {
    const data = ctaMap.get(label) ?? { current: 0, previous: 0 }
    return {
      label,
      clicks: data.current,
      clicksPrev: data.previous,
      trendPct: trend(data.current, data.previous),
      ctr: currentSessions > 0 ? data.current / currentSessions : 0,
    }
  })

  // Ajouter tout label détecté non listé (ex: nouveau CTA ajouté côté site)
  for (const [label, data] of ctaMap) {
    if (!opts.ctaLabels.includes(label)) {
      ctas.push({
        label,
        clicks: data.current,
        clicksPrev: data.previous,
        trendPct: trend(data.current, data.previous),
        ctr: currentSessions > 0 ? data.current / currentSessions : 0,
      })
    }
  }

  const totalCtaClicks = ctas.reduce((s, c) => s + c.clicks, 0) + unlabeledCurrent

  return {
    sessions:      { current: currentSessions,              previous: prevSessions,              trendPct: trend(currentSessions, prevSessions) },
    pageViews:     { current: summary.current.pageViews ?? 0, previous: summary.previous.pageViews ?? 0, trendPct: trend(summary.current.pageViews ?? 0, summary.previous.pageViews ?? 0) },
    users:         { current: summary.current.users ?? 0,     previous: summary.previous.users ?? 0,     trendPct: trend(summary.current.users ?? 0, summary.previous.users ?? 0) },
    bounceRate:    { current: summary.current.bounceRate ?? 0, previous: summary.previous.bounceRate ?? 0, trendPct: trend(summary.current.bounceRate ?? 0, summary.previous.bounceRate ?? 0) },
    avgEngagement: {
      current:  summary.current.users  > 0 ? Math.round((summary.current.engagement  ?? 0) / summary.current.users)  : 0,
      previous: summary.previous.users > 0 ? Math.round((summary.previous.engagement ?? 0) / summary.previous.users) : 0,
      trendPct: trend(
        summary.current.users  > 0 ? (summary.current.engagement  ?? 0) / summary.current.users  : 0,
        summary.previous.users > 0 ? (summary.previous.engagement ?? 0) / summary.previous.users : 0,
      ),
    },
    ctas,
    unlabeledClicks: { current: unlabeledCurrent, previous: unlabeledPrevious },
    totalCtaClicks,
    noCtaData: totalCtaClicks === 0,
  }
}

// ── Section 4 : Cross-domain consolidation ─────────────────────────────
// Compare www.probaclac.ca et etudes.probaclac.ca (+ autres sous-domaines).
// Détecte les sessions multi-hosts et calcule un score de consolidation /100.
export interface HostGA4 {
  host:        string
  sessions:    number
  pageViews:   number
  activeUsers: number
}

export interface HostGSC {
  host:        string
  clicks:      number
  impressions: number
  ctr:         number    // moyenne pondérée par impressions
  position:    number    // moyenne pondérée par impressions
}

export interface CrossStats {
  ga4:            HostGA4[]         // split GA4 par hostname
  gsc:            HostGSC[]         // split GSC par hostname (extrait de la dim `page`)
  totalSessions:  number            // sessions uniques GA4 tous hosts
  totalUsers:     number
  crossSessions:  number            // sessions ayant touché 2+ hosts
  crossPct:       number            // cross / total
  score: {
    total:     number              // 0-100
    breakdown: { label: string; value: number; max: number; detail: string }[]
  }
}

export async function fetchCrossDomainStats(): Promise<CrossStats> {
  const ga = getGA4Client()
  const webmasters = getGSCClient()
  const property = getGA4Property()
  const siteUrl  = getGSCSiteUrl()

  // GSC a ~2 jours de délai
  const end = new Date(); end.setDate(end.getDate() - 2)
  const start = new Date(end); start.setDate(end.getDate() - 30)
  const toISO = (d: Date) => d.toISOString().slice(0, 10)

  const [[hostRes], [totalRes], gscRes] = await Promise.all([
    // GA4 : split par hostname
    ga.runReport({
      property,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'hostName' }],
      metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    }),
    // GA4 : total unique sessions/users (pour calcul cross)
    ga.runReport({
      property,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    }),
    // GSC : pages avec URL → on extrait le hostname côté Node
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: toISO(start),
        endDate:   toISO(end),
        dimensions: ['page'],
        rowLimit: 1000,
      },
    }),
  ])

  // Parse GA4 par host
  const ga4Hosts: HostGA4[] = (hostRes.rows ?? []).map(r => ({
    host:        r.dimensionValues?.[0]?.value ?? '(not set)',
    sessions:    num(r.metricValues?.[0]?.value),
    pageViews:   num(r.metricValues?.[1]?.value),
    activeUsers: num(r.metricValues?.[2]?.value),
  }))
  const totalSessions = num(totalRes.rows?.[0]?.metricValues?.[0]?.value)
  const totalUsers    = num(totalRes.rows?.[0]?.metricValues?.[1]?.value)

  // Cross sessions : une session qui touche N hosts est comptée N fois dans la query per-host.
  // donc: sum(per-host sessions) - total_unique_sessions = nb de "session*host" supplémentaires,
  // qui est une borne sup du nombre de sessions cross (si une session touche 3 hosts, elle compte 2 fois).
  const sumPerHost = ga4Hosts.reduce((s, h) => s + h.sessions, 0)
  const crossSessions = Math.max(0, sumPerHost - totalSessions)
  const crossPct = totalSessions > 0 ? crossSessions / totalSessions : 0

  // Parse GSC par host (extrait du hostname du chemin `page`)
  const gscByHost = new Map<string, { clicks: number; impressions: number; wCtr: number; wPos: number; wSum: number }>()
  for (const row of gscRes.data.rows ?? []) {
    const url = row.keys?.[0] ?? ''
    let host = ''
    try { host = new URL(url).hostname } catch { continue }
    const clicks = row.clicks ?? 0
    const impr   = row.impressions ?? 0
    const ctr    = row.ctr ?? 0
    const pos    = row.position ?? 0
    const agg = gscByHost.get(host) ?? { clicks: 0, impressions: 0, wCtr: 0, wPos: 0, wSum: 0 }
    agg.clicks += clicks
    agg.impressions += impr
    // Moyennes pondérées par impressions
    agg.wCtr += ctr * impr
    agg.wPos += pos * impr
    agg.wSum += impr
    gscByHost.set(host, agg)
  }
  const gscHosts: HostGSC[] = [...gscByHost.entries()]
    .map(([host, agg]) => ({
      host,
      clicks:      agg.clicks,
      impressions: agg.impressions,
      ctr:         agg.wSum > 0 ? agg.wCtr / agg.wSum : 0,
      position:    agg.wSum > 0 ? agg.wPos / agg.wSum : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)

  // ─── Score de consolidation (auto-calculable, sur 100) ───────────────
  // Rubrique pondérée sur ce qu'on peut mesurer objectivement :
  //   30 pts — trafic cross (% sessions multi-host, plafond à 10%)
  //   25 pts — volume GA4 du sous-domaine secondaire (etudes) vs total, plafond 25%
  //   25 pts — volume GSC du sous-domaine secondaire vs total, plafond 10%
  //   20 pts — présence GSC du sous-domaine secondaire (binaire : impressions > 0)
  const etudesHost = 'etudes.probaclac.ca'
  const etudesGa4  = ga4Hosts.find(h => h.host === etudesHost)
  const etudesGsc  = gscHosts.find(h => h.host === etudesHost)
  const totalGscClicks = gscHosts.reduce((s, h) => s + h.clicks, 0)
  const totalGscImpr   = gscHosts.reduce((s, h) => s + h.impressions, 0)

  const crossScore       = Math.round(Math.min(1, crossPct / 0.10) * 30)
  const etudesGa4Ratio   = totalSessions > 0 && etudesGa4 ? etudesGa4.sessions / totalSessions : 0
  const etudesGa4Score   = Math.round(Math.min(1, etudesGa4Ratio / 0.25) * 25)
  const etudesGscRatio   = totalGscClicks > 0 && etudesGsc ? etudesGsc.clicks / totalGscClicks : 0
  const etudesGscScore   = Math.round(Math.min(1, etudesGscRatio / 0.10) * 25)
  const etudesIndexed    = (etudesGsc?.impressions ?? 0) > 0 ? 20 : 0

  const total = crossScore + etudesGa4Score + etudesGscScore + etudesIndexed

  return {
    ga4: ga4Hosts,
    gsc: gscHosts,
    totalSessions,
    totalUsers,
    crossSessions,
    crossPct,
    score: {
      total,
      breakdown: [
        {
          label: 'Trafic cross-domaine',
          value: crossScore, max: 30,
          detail: `${crossSessions} session${crossSessions !== 1 ? 's' : ''} multi-hosts (${(crossPct * 100).toFixed(1)} %) — cible 10%`,
        },
        {
          label: 'Part GA4 du sous-domaine',
          value: etudesGa4Score, max: 25,
          detail: `${etudesGa4?.sessions ?? 0} sessions sur etudes (${(etudesGa4Ratio * 100).toFixed(1)} % du trafic) — cible 25%`,
        },
        {
          label: 'Part GSC du sous-domaine',
          value: etudesGscScore, max: 25,
          detail: `${etudesGsc?.clicks ?? 0} clics organiques sur etudes (${(etudesGscRatio * 100).toFixed(1)} % du total) — cible 10%`,
        },
        {
          label: 'Indexation GSC',
          value: etudesIndexed, max: 20,
          detail: etudesIndexed > 0
            ? `${etudesGsc?.impressions ?? 0} impressions → indexé`
            : 'Aucune impression — pas encore indexé',
        },
      ],
    },
  }
}

// ── GA4 Realtime : ce qui se passe MAINTENANT (30 dernières min) ───────
// Utile quand les standard reports ont un délai de 24-48h.
export interface GA4Realtime {
  activeUsers: number          // utilisateurs actifs sur tout le site, last 30 min
  pageActiveUsers: number      // utilisateurs actifs sur la page filtrée (si pageTitle fourni)
  pageViews: number            // vues de la page filtrée (last 30 min)
  events: { name: string; count: number }[]
  topPages: { title: string; views: number; users: number }[]
}

export interface RealtimeOptions {
  /** Filter to a specific page by its title (realtime API n'accepte pas pageLocation). */
  pageTitle?: string
}

export async function fetchGA4Realtime(opts: RealtimeOptions = {}): Promise<GA4Realtime> {
  const client = getGA4Client()
  const property = getGA4Property()

  // Note: realtime API has a restricted dimension set. We use unifiedScreenName (page title).
  const titleFilter = opts.pageTitle
    ? {
        filter: {
          fieldName: 'unifiedScreenName',
          stringFilter: { matchType: 'CONTAINS' as const, value: opts.pageTitle },
        },
      }
    : undefined

  const [[totalRes], [pageRes], [eventsRes], [topPagesRes]] = await Promise.all([
    // Active users globaux
    client.runRealtimeReport({
      property,
      metrics: [{ name: 'activeUsers' }],
    }),
    // Active users + vues sur la page filtrée
    client.runRealtimeReport({
      property,
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
      ...(titleFilter && { dimensionFilter: titleFilter }),
    }),
    // Events globaux (la Realtime API ne supporte pas de combiner eventName+eventCount
    // avec un filtre sur unifiedScreenName — INVALID_ARGUMENT).
    // Comme les events custom (cta_click) ne sont déclenchés que sur /sci, c'est OK.
    client.runRealtimeReport({
      property,
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 20,
    }),
    // Top pages globales
    client.runRealtimeReport({
      property,
      dimensions: [{ name: 'unifiedScreenName' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    }),
  ])

  return {
    activeUsers: num(totalRes.rows?.[0]?.metricValues?.[0]?.value),
    pageActiveUsers: num(pageRes.rows?.[0]?.metricValues?.[0]?.value),
    pageViews: num(pageRes.rows?.[0]?.metricValues?.[1]?.value),
    events: (eventsRes.rows ?? []).map(r => ({
      name: r.dimensionValues?.[0]?.value ?? '',
      count: num(r.metricValues?.[0]?.value),
    })),
    topPages: (topPagesRes.rows ?? []).map(r => ({
      title: r.dimensionValues?.[0]?.value ?? '',
      views: num(r.metricValues?.[0]?.value),
      users: num(r.metricValues?.[1]?.value),
    })),
  }
}

// ── GA4 : Ecommerce Shopify (add_to_cart, begin_checkout, purchase) ─────
// Section "Ecommerce Shopify" du dashboard.
// Les events sont poussés par le drawer maison (probaclac-cart-drawer) → dataLayer → GTM → GA4.
export interface EcomKPI {
  current:  number
  previous: number
  trendPct: number | null
}

export interface GA4Ecommerce {
  addToCart:     EcomKPI
  beginCheckout: EcomKPI
  purchase:      EcomKPI
  /** Taux Cart → Checkout : begin_checkout / add_to_cart (période courante). */
  cartToCheckoutRate: {
    current:  number   // 0..1 (ou >1 si plus de checkout que de add_to_cart — possible si users arrivent au panier par un autre chemin)
    previous: number
    trendPct: number | null
  }
  /** Timeseries jour par jour, 30 derniers jours. */
  timeSeries: {
    date:          string     // YYYY-MM-DD
    add_to_cart:   number
    begin_checkout:number
    purchase:      number
  }[]
}

export async function fetchGA4Ecommerce(): Promise<GA4Ecommerce> {
  const client = getGA4Client()
  const property = getGA4Property()

  const eventFilter = {
    filter: {
      fieldName: 'eventName',
      inListFilter: {
        values: ['add_to_cart', 'begin_checkout', 'purchase'],
      },
    },
  }

  const comparePeriods = [
    { startDate: '30daysAgo', endDate: 'today',     name: 'current'  },
    { startDate: '60daysAgo', endDate: '31daysAgo', name: 'previous' },
  ]

  const [[summaryRes], [tsRes]] = await Promise.all([
    // Totaux 30j vs 30j précédents, split par eventName
    client.runReport({
      property,
      dateRanges: comparePeriods,
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: eventFilter,
    }),
    // Timeseries journalière (période courante uniquement)
    client.runReport({
      property,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }, { name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      dimensionFilter: eventFilter,
    }),
  ])

  // Parse summary : dimensionValues[0] = eventName, dimensionValues[1] = dateRange (auto-pivot)
  const totals: Record<string, { current: number; previous: number }> = {
    add_to_cart:    { current: 0, previous: 0 },
    begin_checkout: { current: 0, previous: 0 },
    purchase:       { current: 0, previous: 0 },
  }
  for (const row of summaryRes.rows ?? []) {
    const evt    = row.dimensionValues?.[0]?.value ?? ''
    const period = row.dimensionValues?.[1]?.value as 'current' | 'previous' | undefined
    if (!totals[evt] || (period !== 'current' && period !== 'previous')) continue
    totals[evt][period] = num(row.metricValues?.[0]?.value)
  }

  // Parse timeseries : dimensionValues[0] = date (YYYYMMDD), dimensionValues[1] = eventName
  const tsMap = new Map<string, { add_to_cart: number; begin_checkout: number; purchase: number }>()
  for (const row of tsRes.rows ?? []) {
    const rawDate = row.dimensionValues?.[0]?.value ?? ''
    const evt     = row.dimensionValues?.[1]?.value ?? ''
    const count   = num(row.metricValues?.[0]?.value)
    const date    = formatGA4Date(rawDate)
    const entry = tsMap.get(date) ?? { add_to_cart: 0, begin_checkout: 0, purchase: 0 }
    if (evt === 'add_to_cart' || evt === 'begin_checkout' || evt === 'purchase') {
      entry[evt] += count
    }
    tsMap.set(date, entry)
  }
  const timeSeries = [...tsMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))

  // Taux cart → checkout
  const curRate = totals.add_to_cart.current  > 0
    ? totals.begin_checkout.current  / totals.add_to_cart.current
    : 0
  const prvRate = totals.add_to_cart.previous > 0
    ? totals.begin_checkout.previous / totals.add_to_cart.previous
    : 0

  return {
    addToCart: {
      current:  totals.add_to_cart.current,
      previous: totals.add_to_cart.previous,
      trendPct: trend(totals.add_to_cart.current, totals.add_to_cart.previous),
    },
    beginCheckout: {
      current:  totals.begin_checkout.current,
      previous: totals.begin_checkout.previous,
      trendPct: trend(totals.begin_checkout.current, totals.begin_checkout.previous),
    },
    purchase: {
      current:  totals.purchase.current,
      previous: totals.purchase.previous,
      trendPct: trend(totals.purchase.current, totals.purchase.previous),
    },
    cartToCheckoutRate: {
      current:  curRate,
      previous: prvRate,
      trendPct: trend(curRate, prvRate),
    },
    timeSeries,
  }
}

// ── Meta Ads : mock (token pas encore configuré) ────────────────────────
export async function fetchMetaCampaigns(_opts: FetchOptions = {}): Promise<MetaCampaigns> {
  return {
    totalSpend: 1_840.50,
    totalImpressions: 148_000,
    totalClicks: 3_720,
    totalConversions: 94,
    avgCpc: 0.49,
    avgCpm: 12.44,
    roas: 2.8,
    campaigns: [
      { id: 'c1', name: 'Prospection — Mères 25-45', status: 'ACTIVE', spend: 840.00, impressions: 68_000, clicks: 1_820, conversions: 48, cpc: 0.46, roas: 3.1 },
      { id: 'c2', name: 'Retargeting site — 30j',    status: 'ACTIVE', spend: 620.50, impressions: 42_000, clicks: 1_100, conversions: 36, cpc: 0.56, roas: 2.9 },
      { id: 'c3', name: 'Notoriété produit Bébé',    status: 'PAUSED', spend: 380.00, impressions: 38_000, clicks:   800, conversions: 10, cpc: 0.48, roas: 1.8 },
    ],
  }
}

// ── SEO Goals : positions cibles + actions détectées + compétiteurs ─────
export type SeoActionKind = 'quick-win' | 'ctr-low' | 'content-gap' | 'close-podium'

export interface SeoAction {
  kind:        SeoActionKind
  query:       string
  page:        string | null
  clicks:      number
  impressions: number
  ctr:         number
  position:    number
  /** Texte court qui décrit l'action à faire. */
  rationale:   string
  /** Pour trier les actions par impact estimé. */
  impact:      number
}

export interface SeoTargetRow {
  query:        string
  intent:       QueryIntent
  priority:     1 | 2 | 3
  position:     number | null   // null = pas de données GSC
  clicks:       number
  impressions:  number
  ctr:          number
  topPage:      string | null
}

export interface SeoCompetitorCell {
  query:    string
  ours:     number | null
  theirs:   number | null
  /** "better" si nous sommes mieux (position plus basse), "worse" sinon. */
  outcome:  'better' | 'worse' | 'tie' | 'missing'
}

export interface SeoCompetitorRow {
  name:      string
  domain:    string
  cells:     SeoCompetitorCell[]
  avgDelta:  number | null   // moyenne (theirs - ours) sur les requêtes où on a les 2 positions (<0 = on gagne)
  wins:      number
  losses:    number
}

export interface SeoGoals {
  periodDays:  number
  targets:     SeoTargetRow[]
  actions:     SeoAction[]            // top 5 actions
  competitors: SeoCompetitorRow[]
  /** Nombre total de requêtes remontées par GSC dans la période. */
  totalQueries: number
}

/** Normalisation pour matcher "probiotique côlon irritable" ~= "probiotique colon irritable". */
function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function fetchSeoGoals(): Promise<SeoGoals> {
  const webmasters = getGSCClient()
  const siteUrl = getGSCSiteUrl()

  // GSC : 2 jours de lag, on prend 30 jours de données.
  const end = new Date()
  end.setDate(end.getDate() - 2)
  const start = new Date(end)
  start.setDate(end.getDate() - 30)
  const toISO = (d: Date) => d.toISOString().slice(0, 10)
  const periodDays = Math.round((end.getTime() - start.getTime()) / 86400000)

  // Deux requêtes : toutes les requêtes (pour détection auto d'actions) +
  // query × page (pour associer la meilleure page à chaque requête cible).
  const [queriesRes, queryPagesRes] = await Promise.all([
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: toISO(start),
        endDate: toISO(end),
        dimensions: ['query'],
        rowLimit: 500,
      },
    }),
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: toISO(start),
        endDate: toISO(end),
        dimensions: ['query', 'page'],
        rowLimit: 1000,
      },
    }),
  ])

  const queryRows = queriesRes.data.rows ?? []
  const totalQueries = queryRows.length

  // Index par requête normalisée pour matching tolérant aux accents.
  const byQuery = new Map<string, { query: string; clicks: number; impressions: number; ctr: number; position: number }>()
  for (const r of queryRows) {
    const q = r.keys?.[0] ?? ''
    byQuery.set(normalizeQuery(q), {
      query:       q,
      clicks:      r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr:         r.ctr ?? 0,
      position:    r.position ?? 0,
    })
  }

  // Meilleure page par requête (celle avec le plus de clics, fallback impressions).
  const topPageByQuery = new Map<string, string>()
  for (const r of queryPagesRes.data.rows ?? []) {
    const q = normalizeQuery(r.keys?.[0] ?? '')
    const page = r.keys?.[1] ?? ''
    const existing = topPageByQuery.get(q)
    if (!existing) {
      topPageByQuery.set(q, page)
    }
    // Les rows sont triées par clicks desc par défaut → la première est la meilleure.
  }

  // ─── Positions sur les requêtes cibles ─────────────────────────────────
  const targets: SeoTargetRow[] = TARGET_QUERIES.map(t => {
    const hit = byQuery.get(normalizeQuery(t.query))
    return {
      query:       t.query,
      intent:      t.intent,
      priority:    t.priority,
      position:    hit ? hit.position : null,
      clicks:      hit?.clicks ?? 0,
      impressions: hit?.impressions ?? 0,
      ctr:         hit?.ctr ?? 0,
      topPage:     topPageByQuery.get(normalizeQuery(t.query)) ?? null,
    }
  })

  // ─── Détection automatique des actions SEO ─────────────────────────────
  const candidates: SeoAction[] = []
  for (const r of queryRows) {
    const query = r.keys?.[0] ?? ''
    const clicks = r.clicks ?? 0
    const impr   = r.impressions ?? 0
    const ctr    = r.ctr ?? 0
    const pos    = r.position ?? 0
    const page   = topPageByQuery.get(normalizeQuery(query)) ?? null

    // Exclure les requêtes trop rares pour éviter le bruit.
    if (impr < 20) continue

    // 1) Quick win : pos 4-10 avec volume → pousser vers le top 3.
    if (pos >= 3.5 && pos <= 10.5 && impr >= 50) {
      candidates.push({
        kind: 'quick-win',
        query, page, clicks, impressions: impr, ctr, position: pos,
        rationale: `Position ${pos.toFixed(1)} sur ${impr.toLocaleString('fr-CA')} impressions — pousser en top 3 (snippets, FAQ, liens internes).`,
        impact: impr * (0.3 - ctr) * 10, // gain potentiel de clics si CTR monte à ~30%
      })
    }
    // 2) CTR bas malgré bonne position → réécrire title/meta.
    else if (pos <= 10.5 && ctr < 0.02 && impr >= 100) {
      candidates.push({
        kind: 'ctr-low',
        query, page, clicks, impressions: impr, ctr, position: pos,
        rationale: `CTR ${(ctr * 100).toFixed(2)} % en pos. ${pos.toFixed(1)} — réécrire meta title/description, tester des power words.`,
        impact: impr * 0.05 * 10, // ~5 pp de gain CTR visé
      })
    }
    // 3) Content gap : beaucoup d'impressions, zéro clic → page manquante / désaccordée.
    else if (clicks === 0 && impr >= 100) {
      candidates.push({
        kind: 'content-gap',
        query, page, clicks, impressions: impr, ctr, position: pos,
        rationale: `${impr.toLocaleString('fr-CA')} impressions, 0 clic (pos. ${pos.toFixed(1)}) — créer page dédiée ou optimiser l'existante.`,
        impact: impr * 0.1 * 8,
      })
    }
    // 4) Presque sur le podium : pos 11-20 avec volume → on est sur la 2e page.
    else if (pos > 10.5 && pos <= 20.5 && impr >= 100) {
      candidates.push({
        kind: 'close-podium',
        query, page, clicks, impressions: impr, ctr, position: pos,
        rationale: `Pos. ${pos.toFixed(1)} (page 2) sur ${impr.toLocaleString('fr-CA')} impressions — renforcer autorité / maillage interne.`,
        impact: impr * 0.15 * 5,
      })
    }
  }

  // Top 5 actions par impact estimé décroissant.
  const actions = candidates
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5)

  // ─── Comparatif compétiteurs ───────────────────────────────────────────
  const competitors: SeoCompetitorRow[] = COMPETITORS.map(c => {
    let deltaSum = 0
    let deltaCount = 0
    let wins = 0
    let losses = 0
    const cells: SeoCompetitorCell[] = TARGET_QUERIES.map(t => {
      const ours   = byQuery.get(normalizeQuery(t.query))?.position ?? null
      const theirs = c.positions[t.query] ?? null
      let outcome: SeoCompetitorCell['outcome'] = 'missing'
      if (ours !== null && theirs !== null) {
        deltaSum   += (theirs - ours)
        deltaCount += 1
        if      (ours < theirs) { outcome = 'better';  wins   += 1 }
        else if (ours > theirs) { outcome = 'worse';   losses += 1 }
        else                    { outcome = 'tie' }
      }
      return { query: t.query, ours, theirs, outcome }
    })
    return {
      name:     c.name,
      domain:   c.domain,
      cells,
      avgDelta: deltaCount > 0 ? deltaSum / deltaCount : null,
      wins,
      losses,
    }
  })

  return {
    periodDays,
    targets,
    actions,
    competitors,
    totalQueries,
  }
}

// ── SCI landing : positionnement sur requêtes SCI spécifiques ───────────
export interface SciKeywordRow {
  query:        string         // la requête telle que saisie en config
  matchedAs:    string | null  // la requête réelle trouvée dans GSC (peut varier pour accents)
  impressions:  number         // volume de recherche GSC 30j
  clicks:       number
  ctr:          number
  position:     number | null  // null si la requête n'a remonté aucune impression
  topPage:      string | null  // meilleure page qui ranke sur cette requête
}

export interface SciKeywords {
  periodDays: number
  rows:       SciKeywordRow[]
}

/**
 * Fetch GSC metrics for a specific list of SCI-related queries.
 * Utilise un filtre query+CONTAINS pour être tolérant aux variations
 * (avec/sans accent, singulier/pluriel proches).
 */
export async function fetchSciKeywordPositions(queries: string[]): Promise<SciKeywords> {
  const webmasters = getGSCClient()
  const siteUrl = getGSCSiteUrl()

  // Lag GSC de 2 jours, fenêtre 30 jours.
  const end = new Date()
  end.setDate(end.getDate() - 2)
  const start = new Date(end)
  start.setDate(end.getDate() - 30)
  const toISO = (d: Date) => d.toISOString().slice(0, 10)
  const periodDays = Math.round((end.getTime() - start.getTime()) / 86400000)

  // On récupère un large set de queries, puis on matche localement
  // (évite N requêtes API et gère les variantes d'accents).
  const [queryRes, queryPagesRes] = await Promise.all([
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: toISO(start),
        endDate: toISO(end),
        dimensions: ['query'],
        rowLimit: 500,
      },
    }),
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: toISO(start),
        endDate: toISO(end),
        dimensions: ['query', 'page'],
        rowLimit: 1000,
      },
    }),
  ])

  // Index GSC par query normalisée
  const byQuery = new Map<string, { query: string; clicks: number; impressions: number; ctr: number; position: number }>()
  for (const r of queryRes.data.rows ?? []) {
    const q = r.keys?.[0] ?? ''
    byQuery.set(normalizeQuery(q), {
      query:       q,
      clicks:      r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr:         r.ctr ?? 0,
      position:    r.position ?? 0,
    })
  }

  // Meilleure page par requête (la 1ère row query+page rencontrée est la + cliquée)
  const topPageByQuery = new Map<string, string>()
  for (const r of queryPagesRes.data.rows ?? []) {
    const q = normalizeQuery(r.keys?.[0] ?? '')
    const page = r.keys?.[1] ?? ''
    if (!topPageByQuery.has(q)) topPageByQuery.set(q, page)
  }

  const rows: SciKeywordRow[] = queries.map(q => {
    const hit = byQuery.get(normalizeQuery(q))
    return {
      query:       q,
      matchedAs:   hit?.query ?? null,
      impressions: hit?.impressions ?? 0,
      clicks:      hit?.clicks ?? 0,
      ctr:         hit?.ctr ?? 0,
      position:    hit ? hit.position : null,
      topPage:     topPageByQuery.get(normalizeQuery(q)) ?? null,
    }
  })

  return { periodDays, rows }
}

// ── Section UGC : tracking influenceuses sur /yeast et /vaginosis ──────
//
// Stratégie : on lit `landingPagePlusQueryString` GA4 — c'est la page
// d'atterrissage de la session AVEC ses query params. Chaque session est
// donc attribuée à UNE landing page (et donc à UN ref) ; on parse
// `?ref=<slug>` de chaque ligne. Pas besoin de custom dimension.
//
// Pour les clics CTA par influenceuse, on lit la dimension
// `customEvent:ref_slug` envoyée par le dataLayer GTM (event cta_click).

export interface UGCRefStats {
  ref:         string         // slug d'influenceuse (ou '(none)' / '(other)')
  sessions:    number
  users:       number
  pageViews:   number
  ctaClicks:   number
}

export interface UGCPageStats {
  product:        'yeast' | 'vaginosis'
  pagePath:       string
  totalSessions:  number
  totalUsers:     number
  totalPageViews: number
  totalCtaClicks: number
  refs:           UGCRefStats[]   // trié desc par sessions
}

export interface UGCStats {
  pages: UGCPageStats[]
  /** Période courante (30 derniers jours). */
  periodDays: number
}

/** Liste blanche des slugs valides (pour ranger les inconnus dans "(other)"). */
const UGC_KNOWN_REFS = new Set([
  'elisabeth', 'hela', 'hina', 'kelsey', 'lina', 'myriam', 'shika', 'sophia',
  'christina', 'linakarda', 'ashley',
])

const UGC_PAGES: { product: 'yeast' | 'vaginosis'; pagePath: string }[] = [
  { product: 'yeast',     pagePath: '/yeast' },
  { product: 'vaginosis', pagePath: '/vaginosis' },
]

/** Extrait le slug ?ref=... d'une URL (ou '(none)' s'il n'y en a pas). */
function parseRefFromUrl(url: string): string {
  if (!url) return '(none)'
  const q = url.indexOf('?')
  if (q < 0) return '(none)'
  const params = new URLSearchParams(url.slice(q + 1))
  // Mêmes paramètres acceptés que côté client (ref / creator / influencer / utm_source).
  for (const key of ['ref', 'creator', 'influencer', 'utm_source']) {
    const raw = params.get(key)
    if (raw) {
      const slug = raw.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '')
      if (slug) return UGC_KNOWN_REFS.has(slug) ? slug : '(other)'
    }
  }
  return '(none)'
}

export async function fetchUGCStats(): Promise<UGCStats> {
  const client   = getGA4Client()
  const property = getGA4Property()

  // Filter : pagePath dans /yeast ou /vaginosis (sessions GA4 scoped via landingPage)
  const pagePathInList = {
    filter: {
      fieldName: 'landingPage',
      inListFilter: { values: UGC_PAGES.map(p => p.pagePath) },
    },
  }

  // 1. Sessions / users / pageviews par landing-page (avec query string).
  // 2. cta_click par (pagePath, ref_slug) — nécessite la dim custom `ref_slug`
  //    enregistrée dans GA4 Admin. Si elle n'existe pas, l'appel échoue ;
  //    on isole donc cet appel pour ne pas casser tout le rapport.
  const landingPromise = client.runReport({
    property,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [
      { name: 'landingPage' },                  // path seul
      { name: 'landingPagePlusQueryString' },   // path + ?ref=...
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'screenPageViews' },
    ],
    dimensionFilter: pagePathInList,
    limit: 500,
  })

  const ctaPromise = client.runReport({
    property,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [
      { name: 'pagePath' },
      { name: 'customEvent:ref_slug' },
    ],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT' as const, value: 'cta_click' } } },
          { filter: { fieldName: 'pagePath',  inListFilter: { values: UGC_PAGES.map(p => p.pagePath) } } },
        ],
      },
    },
    limit: 200,
  }).catch((err: any) => {
    console.warn('[UGC] cta_click par ref_slug indisponible (custom dim non enregistrée ?) :', err?.message ?? err)
    return null
  })

  const [[landingRes], ctaResult] = await Promise.all([landingPromise, ctaPromise])
  const ctaRes = Array.isArray(ctaResult) ? ctaResult[0] : null

  // Index : page → ref → stats
  type Acc = Map<string, UGCRefStats>
  const byPage = new Map<string, Acc>()
  for (const p of UGC_PAGES) byPage.set(p.pagePath, new Map())

  // Sessions / users / pageviews
  for (const row of landingRes.rows ?? []) {
    const path = row.dimensionValues?.[0]?.value ?? ''
    const fullUrl = row.dimensionValues?.[1]?.value ?? ''
    if (!byPage.has(path)) continue
    const ref = parseRefFromUrl(fullUrl)
    const acc = byPage.get(path)!
    const cur = acc.get(ref) ?? { ref, sessions: 0, users: 0, pageViews: 0, ctaClicks: 0 }
    cur.sessions  += num(row.metricValues?.[0]?.value)
    cur.users     += num(row.metricValues?.[1]?.value)
    cur.pageViews += num(row.metricValues?.[2]?.value)
    acc.set(ref, cur)
  }

  // cta_click par ref_slug (event-scoped — peut concerner des sessions
  // dont la landing était sans ref ; on prend le ref_slug du dataLayer).
  for (const row of ctaRes?.rows ?? []) {
    const path = row.dimensionValues?.[0]?.value ?? ''
    const rawRef = row.dimensionValues?.[1]?.value ?? ''
    if (!byPage.has(path)) continue
    let ref = rawRef.toLowerCase().trim()
    // Normalise les valeurs spéciales et enlève les caractères non alphanumeric.
    if (!ref || ref === '(not set)') {
      ref = '(none)'
    } else {
      const cleaned = ref.replace(/[^a-z0-9_-]/g, '')
      ref = cleaned && UGC_KNOWN_REFS.has(cleaned) ? cleaned : '(other)'
    }
    const count = num(row.metricValues?.[0]?.value)
    const acc = byPage.get(path)!
    const cur = acc.get(ref) ?? { ref, sessions: 0, users: 0, pageViews: 0, ctaClicks: 0 }
    cur.ctaClicks += count
    acc.set(ref, cur)
  }

  const pages: UGCPageStats[] = UGC_PAGES.map(p => {
    const acc = byPage.get(p.pagePath)!
    const refs = Array.from(acc.values()).sort((a, b) => b.sessions - a.sessions || b.ctaClicks - a.ctaClicks)
    return {
      product:        p.product,
      pagePath:       p.pagePath,
      totalSessions:  refs.reduce((s, r) => s + r.sessions, 0),
      totalUsers:     refs.reduce((s, r) => s + r.users, 0),
      totalPageViews: refs.reduce((s, r) => s + r.pageViews, 0),
      totalCtaClicks: refs.reduce((s, r) => s + r.ctaClicks, 0),
      refs,
    }
  })

  return { pages, periodDays: 30 }
}
