# Microsave.fr

Le magazine des choix malins — moteur éditorial statique, ultra-performant, construit avec **Astro** et déployé sur **Cloudflare Pages**.

Migration depuis WordPress : slugs 100 % conservés, contenus entièrement réécrits par IA (`gpt-5.6-terra`, Responses API), images optimisées en WebP.

## Stack
- **Astro 5** — sortie statique (`dist/`), zéro JS superflu, View Transitions.
- **Cloudflare Pages** — build `npm run build`, sortie `dist`, branche `main`.
- Polices auto-hébergées (Fraunces + Instrument Sans via Fontsource).

## Structure
```
src/
  data/articles.json      # contenu généré (source de vérité du build)
  data/posts_meta.json     # métadonnées importées de WordPress
  lib/                     # helpers (articles, catégories)
  layouts/ components/ pages/
  styles/global.css        # design system (palette issue du logo)
public/
  logo-microsave.svg       # logo original (média d'origine, non modifié)
  img/posts/               # images à la une optimisées (.webp + -card.webp)
scripts/
  prepare-content.mjs      # outil d'auteur : fusionne méta + IA + images -> articles.json
```

## Commandes
```bash
npm install
npm run content   # régénère src/data/articles.json + optimise les images (local)
npm run build     # génère dist/
npm run preview
```

`npm run build` ne lit que `src/data/articles.json` (aucun appel réseau) — idéal pour un build Cloudflare reproductible.
