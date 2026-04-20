# Design System: Probaclac SCI — Viral Scientific Landing

## 1. Visual Theme & Atmosphere

A high-contrast, editorially dense interface that oscillates between deep pharmaceutical darkness and clinical light. The atmosphere is a research lab after hours — precision instruments glowing teal against matte navy surfaces, data visualizations humming with quiet authority. This is not a supplement page; it is a scientific dossier dressed in runway-grade typography.

- **Density:** 7/10 — Cockpit-adjacent. Packed with data viz, clinical tables, and charts. No decorative whitespace — every pixel earns its place.
- **Variance:** 8/10 — Aggressive diagonal section breaks (~15deg), asymmetric hero split, offset grids. Nothing centered unless it's a pull-quote.
- **Motion:** 7/10 — Parallax-driven scroll choreography, floating product hero, staggered card reveals with spring physics, animated progress bars, counter animations. Ticker band in perpetual motion.

The dominant rhythm: **DARK section → diagonal SVG cut → LIGHT section → diagonal SVG cut → TEAL accent band → repeat**. Each transition is a physical diagonal slice at ~15% angle, never a flat horizontal line.

## 2. Color Palette & Roles

### Dark Context (Primary — 60% of page)
- **Abyss Navy** (#0a1628) — Primary dark background. Deep, matte, no blue cast bleed
- **Lab Surface** (#111d30) — Elevated cards on dark. Subtle lift from abyss
- **Slate Border** (#1c2d45) — Card borders, divider lines on dark. 1px structural
- **Dim Mist** (#3a4a62) — Tertiary text, metadata, timestamps on dark

### Light Context (Alternating — 25% of page)
- **Cryo White** (#f7f9fc) — Light section background. Cool-tinted, not warm
- **Pure Surface** (#ffffff) — Cards, spec tables on light
- **Frost Border** (#dce3ed) — Card borders, structural lines on light
- **Graphite Text** (#121d2e) — Primary headings on light
- **Slate Body** (#4a5568) — Body text, descriptions on light

### Accent — Single Teal (Brand)
- **Teal Vivid** (#3db5c8) — THE accent. CTAs, data highlights, chart fills, active states, badges, progress bars. Saturation 68%.
- **Teal Bright** (#5ccfdf) — Hover states, glow effects, gradient endpoints
- **Teal Deep** (#1a6b7a) — Pressed states, gradient dark end, text on light backgrounds
- **Teal Whisper** (rgba(61,181,200,0.08)) — Subtle background tints on dark cards

### Data Viz Secondary
- **Amber Signal** (#e8a838) — IBS-C data, B. longum comparator, secondary chart series. Never used for CTAs or UI chrome — data only.
- **Neutral Chart** (#3a4a62) — Placebo bars, inactive chart elements

### Functional
- **Pharmacie CTA** = Teal Vivid (#3db5c8) — Primary purchase action
- **Amazon CTA** = Amber Signal (#e8a838) — Secondary purchase action, differentiated by color

### Banned Colors
- Pure black (#000000) — use Abyss Navy
- Purple, violet, magenta in any context
- Tailwind defaults (indigo-500, blue-600)
- Warm grays — this palette is cool-shifted exclusively

## 3. Typography Rules

- **Display:** `Instrument Serif` (Google Fonts) — Headlines only. Weight 400, italic for emphasis. Track -0.03em, line-height 1.05. The italic swashes on "Une seule mission" and "de votre intestin" are the typographic signature. Never bold — hierarchy through size and color, not weight.
- **Body:** `DM Sans` (Google Fonts) — All body text, descriptions, UI labels. Weights 400/500/600/700. Line-height 1.7, max-width 65ch. Clean, pharmaceutical legibility.
- **Mono:** `JetBrains Mono` (Google Fonts) — Clinical data, stat numbers, NPN codes, chart labels, table headers, study tags. Weights 400/600/700. Communicates "this is verified data" through typeface alone.
- **Scale (fluid):** All sizes via `clamp()`. Hero title: clamp(2.8rem, 5.5vw, 5rem). Section titles: clamp(2rem, 4vw, 3.4rem). Body: clamp(0.9rem, 1.05vw, 1.02rem).

### Banned Fonts
- Inter, Roboto, Arial, system-ui as display
- Times New Roman, Georgia, Garamond, Palatino
- Space Grotesk (overused AI default)

## 4. Component Stylings

### Buttons
- **Primary (Pharmacie):** Pill shape (50px radius). Teal Vivid fill, Abyss Navy text. Box-shadow: 0 0 0 1px teal/30%, 0 4px 20px teal-glow/30%. Hover: Teal Bright fill, shadow intensifies, translateY(-1px). Active: translateY(0). No outer neon glow.
- **Amazon:** Pill shape. Amber Signal fill, Abyss Navy text. Same shadow pattern in amber. Differentiated from primary by color alone.
- **Ghost:** Pill shape. Transparent fill, 1px Slate Border, white-soft text. Hover: teal border tint, teal text, subtle teal background wash.

### Cards (Dark Context)
- Background: Lab Surface (#111d30). Border: 1px Slate Border. Radius: 16px.
- Hover: border shifts to Teal Vivid, translateY(-3px), no shadow explosion.
- Study cards get a mono tag badge: Teal Whisper background, Teal Vivid text, 4px radius, uppercase 0.58rem.

### Cards (Light Context)
- Background: Pure Surface. Border: 1px Frost Border. Radius: 16px.
- Subtle box-shadow: 0 2px 8px slate/6%. Hover: teal border, translateY(-3px), shadow deepens.
- Top-border reveal on hover: 3px gradient line (Teal Vivid → Teal Bright) fades in.

### Charts (SVG Data Viz)
- Dark background cards with Slate Border. Chart grid lines: Slate Border color, dashed.
- Bar fills: Teal Vivid (HA-196), Amber Signal (B. longum/IBS-C), Neutral Chart (Placebo).
- Line charts: 3.5px stroke, round caps, dot markers at 5px radius.
- Significance markers: * and ** in accent colors above bars.
- Legend: dot + label inline, border-top separator, muted text.

### Synthesis Table
- CSS Grid 4-column. Header row: Teal Deep background, Teal Vivid text, mono 0.62rem uppercase.
- Cells: 0.8rem, alternating subtle backgrounds. Topic column bold white-soft. Observation column mono teal. Sub-group column mono amber.
- Rounded overflow hidden on container, Slate Border.

### Progress Bars (Antimicrobial)
- Container: 4px height, Slate Border background, 2px radius.
- Fill: Teal Vivid or Amber Signal, animated scaleX from 0 with spring easing.
- Housed in mini-cards with mono pathogen name above.

### Ticker Band
- Full-width, Teal Vivid background. Text: Abyss Navy.
- Numbers: JetBrains Mono 700, clamp(1.4rem, 2.2vw, 2rem).
- Labels: DM Sans, uppercase, 0.06em tracking, 70% opacity.
- Infinite CSS translateX scroll animation, duplicated content for seamless loop.

## 5. Layout Principles

- **Section rhythm:** DARK → diagonal → LIGHT → diagonal → TEAL → diagonal → DARK. Relentless alternation.
- **Diagonal separators:** SVG elements between every section. ViewBox 0 0 1440 80, preserveAspectRatio="none". Two polygons per separator creating the angled cut. Height: clamp(60px, 8vw, 120px). Negative margins to eliminate gaps.
- **Hero:** 2-column grid (text | product image). NOT centered. Left-aligned text, right-side floating product. Asymmetric.
- **Science section:** Dense. study-overview (3-col grid) → protocol (3-col grid) → findings (2x2 grid) → charts (2-col grid) → synthesis table (4-col CSS grid) → antimicrobial infographic (3x2 grid). Stacked vertically with consistent 2.5rem–4rem gaps.
- **Max-width:** 1200px centered container. Section padding: clamp(3rem, 6vh, 5rem) top, clamp(5rem, 10vh, 8rem) bottom.
- **Mobile collapse:** Everything single-column below 900px. Charts stack. Table reflows. Diagonal height reduces.

## 6. Motion & Interaction

- **Scroll engine:** Lenis smooth scroll (CDN) + GSAP ScrollTrigger. Lenis provides the buttery inertia. GSAP handles all scroll-triggered animations.
- **Hero entrance:** GSAP timeline — badge(opacity+y) → title(opacity+y) → subtitle → CTAs → product(scale+rotation, elastic.out). Product floats infinitely (translateY +-14px, rotate +-1deg, 5s ease-in-out).
- **Reveal system:** IntersectionObserver-based. `.reveal` (translateY 30px), `.reveal-left` (translateX -40px), `.reveal-right` (translateX 40px), `.reveal-scale` (scale 0.92). All with 0.8s cubic-bezier(0.16, 1, 0.3, 1). Staggered via transition-delay on siblings.
- **Parallax:** Hero product drifts up on scroll (scrub). Product section image counter-rotates. Diagonal separators get subtle y-shift.
- **Counters:** Number elements with data-count animate from 0 to target via GSAP tween, power2.out, 1.5s.
- **Chart bars:** scaleX(0→1) on scroll enter, staggered 0.08s per bar, power3.out.
- **Stagger patterns:** Study cards 0.12s, finding cards 0.10s, pathogen items 0.06s, spec rows 0.05s, market cards 0.12s, synthesis cells 0.03s.
- **Spring easing:** cubic-bezier(0.16, 1, 0.3, 1) for reveals. elastic.out(1, 0.55) for hero product.
- **Ticker:** Pure CSS animation, 25s linear infinite. No JS overhead.

## 7. Anti-Patterns (Banned)

- No emojis in the design (symptom icons use styled div containers, not emoji characters)
- No Inter, Roboto, or system-ui as display font
- No pure black (#000000) — Abyss Navy minimum
- No neon outer glow shadows on buttons
- No purple/violet anywhere in the palette
- No 3-column equal card layouts without differentiation (study cards differentiate via content hierarchy)
- No generic placeholder names or invented statistics — all data comes from the actual clinical study
- No "Scroll to explore", scroll arrows, or bouncing chevrons
- No overlapping elements — every element occupies clean spatial zones
- No centered hero sections — hero is split asymmetric
- No flat single-stop box-shadows — layer and tint to background hue
- No `transition-all` — explicit properties only
- No animating layout properties (top, left, width, height) — transform and opacity exclusively
- No warm grays — cool-shifted Slate/Zinc tones only
- No AI copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen")
- No broken image links — product images served locally from `../etudes/produits/sci.jpg`
