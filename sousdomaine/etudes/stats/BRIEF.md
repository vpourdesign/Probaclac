# Brief dashboard Stats — Probaclac

Ce document est le brief fonctionnel à implémenter. La stack est déjà en place (Next.js App Router, Tailwind, service account Google configuré dans `.env.local`, endpoints API `/api/ga4`, `/api/gsc`, `/api/meta`, composants `KpiCard`, `TrafficChart`, `MetaTable`, `SeoGoals`, `Nav`).

## Configuration de référence

- **GA4 Property ID** : `399949550`
- **GA4 Measurement ID** (côté site) : `G-HEREHR4J20`
- **GTM container** : `GTM-NSW3TFP5` (installé sur `etudes.probaclac.ca/sci`)
- **Search Console** : propriété **Domaine** `sc-domain:probaclac.ca` (couvre www + tous sous-domaines)
- **Service account API** : `rapportsvpd@site-vpd.iam.gserviceaccount.com`

## Event GA4 custom à exploiter

Un seul event unifié pour les 3 CTAs de `/sci` :

- **Event name** : `cta_click`
- **Paramètres** (déjà enregistrés comme dimensions custom GA4) :
  - `cta_label` → texte du bouton ("Commander en ligne" | "Acheter sur Amazon" | "Trouver une pharmacie")
  - `cta_url` → URL de destination
  - `page_location` → URL de la page (paramètre natif GA4)

Dans l'API Data v1 GA4, les accéder via :
- Dimension : `customEvent:cta_label`
- Dimension : `customEvent:cta_url`
- Dimension : `pageLocation`

---

## Layout du dashboard (4 sections)

```
┌───────────────────────────────────┬──────────────────────────┐
│ SECTION 1                         │ SECTION 2                │
│ Statistiques générales du site    │ Landing page active      │
│ (probaclac.ca + sous-domaines)    │ (etudes.probaclac.ca/sci)│
├───────────────────────────────────┴──────────────────────────┤
│ SECTION 3                                                    │
│ Objectifs SEO vs compétiteurs                                │
├──────────────────────────────────────────────────────────────┤
│ SECTION 4                                                    │
│ etudes.probaclac.ca vs www.probaclac.ca (consolidation)      │
└──────────────────────────────────────────────────────────────┘
```

---

## SECTION 1 — Statistiques générales du site

Scope : **tout le domaine** `probaclac.ca` (www + etudes + autres sous-domaines).

**Source** : GA4 Data API (toutes les pages du property, pas de filtre hostname).

### Métriques à afficher

1. **Visites mensuelles** — chart ligne sur les 12 derniers mois
   - Metric : `sessions`
   - Dimension : `yearMonth`

2. **Pages visitées** — total et évolution
   - Metric : `screenPageViews`, `activeUsers`
   - Comparaison période précédente (ex: 30 derniers jours vs 30 précédents)

3. **Top 5 des pages** — table
   - Dimensions : `pagePath`, `pageTitle`, `hostName` (pour voir www vs etudes)
   - Metrics : `screenPageViews`, `averageSessionDuration`, `engagementRate`
   - Tri desc par `screenPageViews`, limit 5

### Composants à utiliser/étendre
- `TrafficChart.tsx` → visites mensuelles
- `KpiCard.tsx` → 3 cards (sessions, pageviews, users)
- Nouveau : `TopPagesTable.tsx` (si n'existe pas)

---

## SECTION 2 — Landing page active (`etudes.probaclac.ca/sci`)

Scope : filtré sur la page `/sci` uniquement.

**Source** : GA4 Data API avec filtre `pagePath = /sci` OU `pageLocation contains etudes.probaclac.ca/sci`.

### Métriques

1. **Nombre de visites** (KPI card)
   - Metric : `sessions` filtré sur `/sci`
   - Comparaison période précédente

2. **Bounce rate** (KPI card)
   - Metric : `bounceRate` filtré sur `/sci`

3. **GTM Conversions** (3 cards — une par CTA)
   - Event name : `cta_click`
   - Grouper par dimension `customEvent:cta_label`
   - 3 cards : "Commander en ligne" / "Acheter sur Amazon" / "Trouver une pharmacie"
   - Metric : `eventCount`
   - Bonus : CTR = `eventCount / sessions` pour chaque CTA

### Requête GA4 type pour les 3 CTAs

```ts
{
  property: `properties/399949550`,
  dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
  dimensions: [{ name: 'customEvent:cta_label' }],
  metrics: [{ name: 'eventCount' }],
  dimensionFilter: {
    andGroup: {
      expressions: [
        { filter: { fieldName: 'eventName', stringFilter: { value: 'cta_click' }}},
        { filter: { fieldName: 'pagePath', stringFilter: { value: '/sci' }}}
      ]
    }
  }
}
```

### Composants
- `KpiCard.tsx` × 5 (visites, bounce, 3 CTAs)

---

## SECTION 3 — Objectifs SEO vs compétiteurs

Scope : positionnement organique sur les requêtes probiotiques au Québec/Canada.

**Sources** :
- Search Console API (`sc-domain:probaclac.ca`) pour nos positions moyennes
- Pas d'API compétiteurs directe — soit saisie manuelle dans un JSON de config, soit intégration tierce (SEMrush/Ahrefs) si dispo

### Requêtes cibles à tracker (à externaliser dans `lib/seo-goals.ts`)

Termes prioritaires à définir avec Vincent — exemples :
- "probiotique sci" / "probiotique côlon irritable"
- "probiotique québec"
- "meilleur probiotique canada"
- "probiotique ballonnements"
- "probiotique pharmacie québec"

### Métriques à afficher

1. **Position moyenne** pour chaque requête cible (Search Console API)
   - Endpoint : `searchanalytics.query` avec `dimensions: ['query']`
   - Filtre sur la liste de requêtes ciblées
   - Metric : `position` (moyenne)

2. **Top 5 recommandations SEO à exécuter** — liste actionnable
   - Source : logique interne qui détecte les opportunités :
     - Requêtes position 4-10 (quick wins → pousser en top 3)
     - Requêtes avec CTR < 2% malgré bonne position (meta title/desc à améliorer)
     - Pages orphelines à sitemap non indexées
     - Requêtes impressions > 100 sans clic (content gap)
   - Afficher la page concernée + l'action recommandée

3. **Tableau comparatif vs top 3 compétiteurs**
   - Compétiteurs à lister dans config (ex: Bio-K+, Jamieson, Probiolife — à confirmer avec Vincent)
   - Pour chaque terme cible : notre position vs leur position
   - Colonnes : Requête | Probaclac | Comp1 | Comp2 | Comp3
   - Data compétiteurs : saisie manuelle dans JSON config initialement (itération v1)

### Composants
- `SeoGoals.tsx` → à étendre pour afficher :
  - Table positionnement (queries × positions)
  - Table comparative compétiteurs
  - Liste "Top 5 actions"

---

## SECTION 4 — Consolidation etudes vs www

Scope : comparer et agréger `etudes.probaclac.ca` et `www.probaclac.ca` en une vue unifiée.

**Sources** : GA4 (pour visites/engagement) + Search Console (pour clics/impressions organiques).

### Métriques

1. **Clics & visites sur chaque sous-domaine**
   - GA4 : dimension `hostName` → split par `www.probaclac.ca` vs `etudes.probaclac.ca`
   - GSC : dimension `page` → split par hostname de la page
   - Metrics GA4 : `sessions`, `screenPageViews`, `activeUsers`
   - Metrics GSC : `clicks`, `impressions`, `ctr`, `position`

2. **Visites cross** (user passe de etudes → www ou inverse)
   - Requête GA4 cross-session : utiliser `path_exploration` ou
   - Plus simple : compter les sessions GA4 où un user a visité des pages des 2 hostnames dans la même session
   - Query type :
     ```ts
     dimensions: ['sessionId'], // custom — sinon utiliser clientId
     metrics: ['sessions'],
     // puis post-traiter : regrouper par session, détecter sessions multi-host
     ```
   - Alternative simple : compter les sessions où la `landingPagePlusQueryString` est sur un hostname et une page ultérieure est sur l'autre → via funnel exploration API ou requête à 2 passes

3. **Système de score de consolidation**
   - Score = f(trafic croisé, liens internes, signaux unifiés)
   - Proposition : score sur 100 basé sur :
     - % de sessions cross entre sous-domaines (20 pts)
     - Nombre de liens internes de www → etudes et vice-versa (20 pts)
     - Couverture d'indexation unifiée dans GSC Domain property (20 pts)
     - Signaux hreflang / canonical cohérents (20 pts)
     - Part de trafic organique unifiée (20 pts)
   - Définir les seuils dans `lib/consolidation-score.ts`

### Composants
- Nouveau : `CrossDomainView.tsx`
- Nouveau : `ConsolidationScore.tsx`

---

## Variables d'environnement requises

À garantir dans `.env.local` :

```bash
GA4_PROPERTY_ID=399949550
GSC_SITE_URL=sc-domain:probaclac.ca   # MaJ — ancienne valeur: https://www.probaclac.ca/
GOOGLE_SERVICE_ACCOUNT_KEY=<base64>   # déjà présent
```

## Priorisation d'implémentation suggérée

1. **MaJ `GSC_SITE_URL`** dans `.env.local` vers `sc-domain:probaclac.ca` (bloquant pour tout le reste GSC)
2. **Section 2 (Landing /sci)** — la plus simple, valide que le tracking CTA fonctionne bout-en-bout
3. **Section 1 (Stats générales)** — queries GA4 standards, pas de logique custom
4. **Section 4 (Cross-domain)** — moyennement complexe, requêtes multi-passes
5. **Section 3 (SEO goals)** — la plus ouverte, itérer avec Vincent sur les termes cibles et compétiteurs

## Notes importantes

- **Les dimensions custom `cta_label` et `cta_url` viennent d'être créées (2026-04-16)** — aucun backfill, les données commencent aujourd'hui. Gérer gracieusement les "No data" dans les 24-48h.
- Le fix du trigger GTM (regex incluant "Commander en ligne") a été publié le 2026-04-16 — avant ça, seuls les clics "Acheter sur Amazon" et "Trouver une pharmacie" étaient trackés (et encore — à valider).
- La propriété GSC Domain agrège www + etudes automatiquement, donc pour filtrer par sous-domaine il faut utiliser `dimensions: ['page']` et post-filtrer par hostname dans le code.
