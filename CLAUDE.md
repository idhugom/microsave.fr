# CLAUDE.md — Guide de travail pour Claude sur microsave.fr

Ce fichier est la **notice d'exploitation** de toute session Claude sur ce dépôt.
Il ne modifie pas le site : il **complète l'existant** en fixant les règles de
travail, la ligne éditoriale et la procédure de publication. Lis-le en entier
avant toute intervention.

---

## ⚠️ Règles d'intervention (impératives)

### Règle n°1 — TOUJOURS travailler sur `main` (très important)
Toute session — développement, rédaction, amélioration, correction, etc. — se
fait **directement sur la branche `main`** de GitHub. **Ne JAMAIS créer de
branche** ni travailler sur une branche secondaire, et ne jamais ouvrir de pull
request : on commite et on pousse sur `main`.
`main` est aussi la branche de build de Cloudflare Pages — chaque push déclenche
un déploiement. Vérifie donc que `npm run build` passe avant de pousser.

### Règle n°2 — Toujours en qualité optimale
Se placer systématiquement dans le **réglage le plus intelligent / le plus
performant** du modèle pour chaque intervention (rédaction, code, révision).
**Seule exception :** la génération d'image OpenAI reste en `quality: "medium"`
(voir §6) — c'est le seul réglage volontairement non maximal, pour le coût.

### Règle n°3 — Clés API / tokens (jamais en dur)
Les clés et tokens nécessaires (`OPENAI_API_KEY`, `OPENAI_TEXT_MODEL`,
`OPENAI_IMAGE_MODEL`, clés Cloudflare, etc.) sont **fournis par l'environnement
cloud de Claude Code** via les variables d'environnement (`process.env.*`).
- Récupère-les depuis l'environnement, **ne les redemande pas**.
- **N'écris JAMAIS** une clé en dur dans le code, un fichier de config ou un
  commit. `.env` est déjà dans `.gitignore` — garde-le ainsi.
- Si une variable manque, signale-le ; ne l'invente pas et ne la remplace pas
  par une valeur codée en dur.

---

## Le site en bref (§1)

**microsave.fr — « Le magazine des choix malins ».**
Magazine généraliste français d'**infos pratiques et de conseils malins** : on
aide le lecteur à faire le bon choix et le bon geste au quotidien, sur des
sujets très variés (assurance, bricolage, auto, maison, cuisine, voyage, santé,
jardin, high-tech, droit & démarches…).

- **Stack :** Astro 5 en **sortie 100 % statique** (`dist/`), déployé sur
  **Cloudflare Pages** (build `npm run build`, sortie `dist`, branche `main`).
  Zéro JS superflu, View Transitions, polices auto-hébergées (Fraunces +
  Instrument Sans).
- **Origine :** migration depuis WordPress, **slugs 100 % conservés** (ne jamais
  casser une URL existante). ~540 articles déjà en ligne.
- **Source de vérité du contenu :** [`src/data/articles.json`](src/data/articles.json).
  **Le build ne lit QUE ce fichier** (aucun appel réseau) — pour publier ou
  modifier un article, on édite ce JSON. `src/data/posts_meta.json` conserve les
  métadonnées importées de WordPress.
- **Design system :** [`src/styles/global.css`](src/styles/global.css) — palette
  issue du logo, un seul accent secondaire (le **rose**, `var(--pink)`).
- **Catégories :** liste fermée de 14 rubriques dans
  [`src/lib/categories.ts`](src/lib/categories.ts). Le champ `category` d'un
  article doit reprendre **exactement le `label`** (ex. `"Cuisine & Gastronomie"`,
  pas le slug). En cas de doute : `"Autres"`.

### Repères techniques utiles
- `npm run build` → génère `dist/` (à lancer avant chaque push).
- `npm run dev` / `npm run preview` → prévisualisation locale.
- `scripts/prepare-content.mjs` (`npm run content`) : outil d'auteur **local**
  qui fusionne méta + contenu + images vers `articles.json` et optimise les
  images en WebP. Il n'est **pas** exécuté au build Cloudflare. Sa fonction
  `sanitize()` documente le HTML attendu (voir §4) et son `optimize()` les tailles
  d'images (voir §6).
- URLs en `trailingSlash: 'always'` → une page d'article vit sur `/<slug>/`.
- Type `Article` (à respecter à la lettre) dans
  [`src/lib/articles.ts`](src/lib/articles.ts) :
  `id, slug, title, meta_title, meta_description, excerpt, category, tags[],
  date, reading_time_min, key_takeaways[], body_html, faq[], image, image_alt`.

---

## 0. Règles d'or éditoriales (prioritaires)

1. **La rédaction est faite par Claude, pas par l'API.** Le corps de l'article
   est écrit **par toi, Claude**, directement en session, en qualité maximale
   (§ Règle n°2) — plus par un pipeline API texte. `OPENAI_TEXT_MODEL` est
   hérité de l'ancien flux et **n'est plus utilisé pour rédiger**. **Seules les
   images passent encore par OpenAI** (§6).
2. **Anti-cannibalisation.** Si le sujet est libre, **vérifie d'abord l'existant**
   avant d'écrire : chaque nouvel article porte sur un sujet **distinct** de ce
   qui est déjà publié, pour éviter la cannibalisation SEO (§3).
3. **Qualité avant tout.** Chaque article doit apporter la **meilleure info** sur
   son sujet : des détails en plus et, **selon la pertinence**, des éléments
   riches (tableau, comparaison, astuces, FAQ, citation, chiffres…). Ce sont des
   exemples : inutile de tout mettre à chaque fois (§4).
4. **Photo OpenAI obligatoire.** **Jamais** publier un article sans visuel.
   Toujours une **vraie photo à la une générée par OpenAI**, « photo généraliste
   sur le thème, ultra réaliste », **avant** publication (§6).
5. **Liens internes.** Ajoute **1 à 4 liens internes par article** vers d'autres
   pages **existantes** du site (§5).

---

## 2. Identité & ton

- **Public :** lecteur français, grand public, qui cherche une réponse claire et
  actionnable à une question concrète. Vouvoiement.
- **Positionnement :** le « choix malin » — pratique, honnête, sans esbroufe. On
  explique, on compare, on donne le bon geste et les pièges à éviter.
- **Voix :** experte mais accessible, chaleureuse, directe. Phrases nettes,
  vocabulaire simple, zéro remplissage ni superlatifs creux. On préfère un
  chiffre précis, un exemple concret ou un tableau à une généralité.
- **Honnêteté :** pas de fausse expertise médicale/juridique/financière.
  Sur les sujets sensibles (santé, droit, sécurité, argent), rester factuel,
  nuancer, et renvoyer aux autorités/pros compétents via un callout `warning`
  (voir les 112/18/17 dans les articles existants comme modèle).
- **Français soigné :** typographie française (apostrophes `’`, guillemets
  `«  »`, tirets cadratins `—`, espaces insécables), orthographe impeccable.
- **Neutralité commerciale :** conseils, pas de placement produit déguisé ; on
  informe pour aider à choisir, on ne vend pas.

---

## 3. Avant d'écrire — anti-cannibalisation

Avant tout **nouveau sujet libre**, contrôle l'existant pour ne pas doublonner :

1. Ouvre / interroge [`src/data/articles.json`](src/data/articles.json) et
   compare **titres, slugs, tags et angle** avec ton sujet envisagé. Exemple de
   contrôle rapide :
   ```bash
   node -e 'const a=require("./src/data/articles.json");
     const q="lessive"; // ← ton mot-clé
     console.log(a.filter(x=>(x.title+" "+x.slug+" "+x.tags.join(" ")).toLowerCase().includes(q))
       .map(x=>x.slug));'
   ```
2. **Un slug existe déjà ?** On **améliore** l'article existant (on ne crée pas de
   doublon) — les slugs sont figés (SEO WordPress conservé).
3. **Sujet proche mais angle différent ?** Choisis un **angle nettement distinct**
   (intention de recherche différente), sinon change de sujet.
4. **Rien de proche ?** Feu vert : le sujet est neuf pour le site.
5. Chaque article doit viser une **intention de recherche unique** ; deux articles
   ne doivent pas se disputer le même mot-clé principal.

---

## 4. Qualité rédactionnelle

**Structure d'un article** (rappel : le `body_html` **n'inclut PAS de `<h1>`** —
la page fournit son propre H1 depuis `title`) :

- **Chapô / intro** : 1–2 `<p>` qui posent le problème et la promesse.
- **Sections en `<h2>`** (avec `<h3>`/`<h4>` au besoin) : les `<h2>` alimentent
  automatiquement le sommaire (TOC) de la page. Titres explicites et scannables.
- **`key_takeaways`** : 3 à 6 puces « À retenir » (affichées en encadré).
- **Éléments riches, selon pertinence** (pas d'obligation de tout mettre) :
  - **Tableau** — HTML final attendu (déjà « sanitisé ») :
    ```html
    <div class="table-scroll"><table class="ms-table">
      <thead><tr><th>…</th></tr></thead>
      <tbody><tr><td>…</td></tr></tbody>
    </table></div>
    ```
  - **Callouts** — trois variantes, avec l'attribut `data-label` **déjà** posé :
    ```html
    <aside class="callout callout-info"    data-label="Info"><p>…</p></aside>
    <aside class="callout callout-tip"     data-label="Astuce"><p>…</p></aside>
    <aside class="callout callout-warning" data-label="À noter"><p>…</p></aside>
    ```
  - **Comparaison 2 colonnes** : `<div class="compare"><div class="compare-col">
    <h4>…</h4>…</div><div class="compare-col">…</div></div>`.
  - **Citation** : `<blockquote>…</blockquote>`. **Listes** `<ul>`/`<ol>`,
    `<strong>` pour les points clés, chiffres et exemples concrets.
- **FAQ** : 3 à 6 entrées `{ question, answer }` dans le champ `faq` (génère un
  balisage `FAQPage` schema.org — utile SEO). Réponses complètes et autonomes.
- **Métadonnées SEO :**
  - `meta_title` : accrocheur, ~50–60 caractères, contient le mot-clé.
  - `meta_description` : ~150–160 caractères, incitative et factuelle.
  - `excerpt` : ~1–2 phrases (sert de chapô/dek et d'aperçu carte).
  - `tags` : 3 à 6 tags cohérents (minuscules, français) — ils pilotent les
    articles liés (`related()`), donc réutilise les tags existants quand ils
    collent.
  - `reading_time_min` : estimation réaliste (≈ 200 mots/min).
  - `date` : ISO (`YYYY-MM-DDTHH:MM:SS`).
- **HTML autorisé** (cf. `sanitize()` de `prepare-content.mjs`) : pas de
  `<script>/<style>/<iframe>/<form>`, pas de gestionnaires `on*`, pas de
  `javascript:`, pas de `<h1>`. Reste sur `p, h2-h4, ul/ol/li, strong, em, a,
  blockquote, table, aside.callout, div.compare, figure, code, pre, hr, dl`.

**Qualité = fond d'abord.** Vérifie les faits, donne des ordres de grandeur
justes, cite des chiffres crédibles, et n'invente pas de données. Mieux vaut
court et exact que long et flou.

---

## 5. Liens internes (1 à 4 par article)

- Ajoute **1 à 4 liens internes** dans le `body_html`, vers des **pages
  existantes** du site, insérés naturellement dans le texte (ancre descriptive,
  jamais « cliquez ici »).
- **Format d'URL :** toujours `/<slug>/` (slash final obligatoire), ex.
  `<a href="/comment-reussir-sa-lessive/">réussir sa lessive</a>`.
- **Cible pertinente :** privilégie des articles de la **même rubrique** ou au
  **sujet complémentaire** (les articles liés du site se basent sur
  catégorie + tags — cf. `related()`), afin de renforcer les cocons thématiques.
- **Aucun lien mort :** vérifie que chaque slug ciblé **existe** dans
  `articles.json` avant de publier :
  ```bash
  node -e 'const a=require("./src/data/articles.json");const s=new Set(a.map(x=>x.slug));
    ["slug-cible-1","slug-cible-2"].forEach(x=>console.log(x, s.has(x)?"OK":"❌ INEXISTANT"));'
  ```
- Ne mets pas de lien interne dans les `key_takeaways`, la FAQ ou les métas —
  uniquement dans le corps.

---

## 6. Photo — toujours une vraie photo OpenAI avant publication

**Règle absolue :** jamais publier un article sans visuel. Toujours **une seule**
photo de couverture (hero) générée par OpenAI, **« ultra réaliste »**, avant
publication. **Pas de galerie ni d'image dans le corps.**

**Modèle & paramètres** (via `OPENAI_API_KEY` de l'environnement — voir Règle n°3) :
```json
{ "model": "gpt-image-2", "size": "1536x1024", "quality": "medium" }
```
- Le modèle est lu depuis `process.env.OPENAI_IMAGE_MODEL` si défini ;
  `gpt-image-2` est la valeur de référence par défaut.
- **`quality: "medium"`** — seul réglage OpenAI non maximal (Règle n°2).
- **Prompt :** photo généraliste, cohérente avec le thème de l'article,
  **ultra réaliste**, sans texte ni watermark incrustés.

**Intégration de l'image** (mêmes tailles que `optimize()` de
`prepare-content.mjs`) :
1. Génère le hero OpenAI en `1536×1024`, enregistre le PNG source.
2. Optimise avec `sharp` en **deux** WebP dans `public/img/posts/` :
   - `public/img/posts/<slug>.webp` — `1536×1024`, `quality 80` (hero).
   - `public/img/posts/<slug>-card.webp` — `780×520`, `quality 74` (vignette).
3. Renseigne dans l'article : `"image": "/img/posts/<slug>.webp"` et un
   `"image_alt"` descriptif (par défaut = le titre).
4. Le build **annule** un `image` dont le fichier WebP est absent (pas de 404) :
   assure-toi que les deux fichiers existent et sont commités.

---

## Procédure de publication (récap, sur `main`)

1. **Sujet** → contrôle anti-cannibalisation (§3).
2. **Rédaction** par Claude, qualité max (§0, §2, §4), HTML final « sanitisé ».
3. **Liens internes** 1–4 vers des slugs existants (§5).
4. **Image** hero OpenAI + 2 WebP dans `public/img/posts/` (§6).
5. **Ajout** de l'objet `Article` complet dans `src/data/articles.json`
   (slug unique, `category` = label exact, champs du type respectés).
6. `npm run build` → doit passer sans erreur.
7. **Commit** clair + **push sur `main`** (jamais de branche, jamais de PR).

> Ne casse jamais un slug ou une URL existante, ne modifie pas le logo original
> (`public/logo-microsave.svg`), et respecte le design system rose/logo.
