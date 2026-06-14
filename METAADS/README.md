# METAADS — pubs vidéo Probaclac (look éditorial B&W + transitions)

Pubs 1:1 (1080×1080, 10 s) dans le système visuel du site : Helvetica Bold,
reveals mot-par-mot, rideaux, fin bleu « Fabriqué au Québec ».

| Ad | Source | Build |
|---|---|---|
| `ad-adultes-1x1.html` | pots PNG | `node ad-record.mjs http://localhost:3050/METAADS/ad-adultes-1x1.html ad-adultes-1x1` |
| `ad-sci-1x1.html` | `sci.mp4` (split haut cyan / bas vidéo) | `node build-sci.mjs` |

Sorties dans `out/`. Servir d'abord le projet : `PORT=3050 node serve.mjs` (racine).
`ad-record.mjs` = recorder générique (GSAP `window.AD_TL`, vidéo `#vid` optionnelle).
`build-sci.mjs` = capture overlay transparent + composite `sci.mp4` via ffmpeg.
