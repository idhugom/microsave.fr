// Local authoring tool — merges post metadata + AI-generated content + images
// into a self-contained src/data/articles.json, and optimizes images to webp.
// Not part of `npm run build` (Cloudflare only reads the committed JSON).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCRATCH = process.env.SCRATCH || '/tmp/claude-0/-home-user-microsave-fr/d7cae813-a5e0-5fe2-a267-e23f4dee2b4d/scratchpad';
const GEN_DIR = process.env.GEN_DIR || path.join(SCRATCH, 'data/generated');
const RAW_IMG = process.env.RAW_IMG || path.join(SCRATCH, 'raw_images');
const GEN_IMG = process.env.GEN_IMG || path.join(SCRATCH, 'gen_images');
const OUT_IMG = path.join(ROOT, 'public/img/posts');

const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/posts_meta.json'), 'utf8'));
let refText = {};
try { refText = JSON.parse(fs.readFileSync(path.join(SCRATCH, 'data/posts_content.json'), 'utf8')); } catch {}

fs.mkdirSync(OUT_IMG, { recursive: true });

const LABELS = { 'callout-info': 'Info', 'callout-tip': 'Astuce', 'callout-warning': 'À noter' };

function sanitize(html) {
  if (!html) return '';
  let h = String(html);
  // strip dangerous elements (defense-in-depth even though content is model-generated)
  h = h.replace(/<(script|style|iframe|object|embed|form|link|meta|base)\b[\s\S]*?<\/\1>/gi, '');
  h = h.replace(/<(script|style|iframe|object|embed|form|link|meta|base)\b[^>]*\/?>/gi, '');
  // strip inline event handlers and javascript: URLs
  h = h.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  h = h.replace(/\s(href|src)\s*=\s*("|')?\s*javascript:[^"'>\s]*("|')?/gi, ' $1="#"');
  // page supplies its own H1
  h = h.replace(/<h1[\s\S]*?<\/h1>/gi, '');
  // callouts: inject the data-label badge (handle single OR double quotes, any variant)
  h = h.replace(/<aside\s+class=(["'])callout\s+([a-z0-9-]+)\1/gi, (m, q, cls) => {
    const label = LABELS[cls] || 'À retenir';
    return `<aside class="callout ${cls}" data-label="${label}"`;
  });
  // ensure every table carries ms-table, then wrap each in a horizontal-scroll container
  h = h.replace(/<table\b([^>]*)>/gi, (m, attrs) => {
    if (/class\s*=/i.test(attrs)) {
      if (/ms-table/.test(attrs)) return m;
      return `<table${attrs.replace(/class\s*=\s*(["'])(.*?)\1/i, 'class="$2 ms-table"')}>`;
    }
    return `<table class="ms-table"${attrs}>`;
  });
  h = h.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (t) => `<div class="table-scroll">${t}</div>`);
  return h.trim();
}

function findRawImage(slug) {
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp', '.gif']) {
    const p = path.join(RAW_IMG, slug + ext);
    if (fs.existsSync(p) && fs.statSync(p).size > 1000) return p;
  }
  const g = path.join(GEN_IMG, slug + '.png');
  if (fs.existsSync(g) && fs.statSync(g).size > 1000) return g;
  const gw = path.join(GEN_IMG, slug + '.webp');
  if (fs.existsSync(gw) && fs.statSync(gw).size > 1000) return gw;
  return null;
}

async function optimize(src, slug) {
  const full = path.join(OUT_IMG, slug + '.webp');
  const card = path.join(OUT_IMG, slug + '-card.webp');
  try {
    if (!fs.existsSync(full)) {
      await sharp(src).resize({ width: 1536, height: 1024, fit: 'cover', position: 'attention', withoutEnlargement: true })
        .webp({ quality: 80 }).toFile(full);
    }
    if (!fs.existsSync(card)) {
      await sharp(src).resize({ width: 780, height: 520, fit: 'cover', position: 'attention', withoutEnlargement: true })
        .webp({ quality: 74 }).toFile(card);
    }
    return `/img/posts/${slug}.webp`;
  } catch (e) {
    console.error('img fail', slug, e.message);
    return null;
  }
}

const decodeEntities = (s) => String(s || '')
  .replace(/&amp;/gi, '&') // un-nest double-encoded entities first
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&rsquo;/gi, '’').replace(/&lsquo;/gi, '‘')
  .replace(/&ldquo;/gi, '“').replace(/&rdquo;/gi, '”')
  .replace(/&hellip;/gi, '…').replace(/&mdash;/gi, '—').replace(/&ndash;/gi, '–')
  .replace(/&laquo;/gi, '«').replace(/&raquo;/gi, '»').replace(/&nbsp;/gi, ' ')
  .replace(/&eacute;/gi, 'é').replace(/&egrave;/gi, 'è').replace(/&agrave;/gi, 'à')
  .replace(/&ccedil;/gi, 'ç').replace(/&ecirc;/gi, 'ê').replace(/&quot;/gi, '"')
  .replace(/&apos;/gi, '’');
const decode = (s) => {
  let out = String(s || '').replace(/<[^>]+>/g, ' ');
  out = decodeEntities(out);
  if (/&(amp|rsquo|#\d+);/i.test(out)) out = decodeEntities(out); // second pass for deep nesting
  return out.replace(/\s+/g, ' ').trim();
};

let ok = 0, stub = 0, imgs = 0;
const out = [];
const limit = 8;
let queue = [];

async function flush() { await Promise.all(queue); queue = []; }

for (const p of meta) {
  const genPath = path.join(GEN_DIR, `post-${p.id}.json`);
  let a = null;
  if (fs.existsSync(genPath)) {
    try { a = JSON.parse(fs.readFileSync(genPath, 'utf8')); } catch {}
  }
  const title = decode(p.title);
  const raw = findRawImage(p.slug);
  let image = null;
  if (raw) {
    queue.push(optimize(raw, p.slug).then((r) => { if (r) { image = r; imgs++; } }));
    image = `/img/posts/${p.slug}.webp`;
    if (queue.length >= limit) await flush();
  }
  if (a && a.body_html) {
    ok++;
    out.push({
      id: p.id, slug: p.slug, title,
      meta_title: a.meta_title || title,
      meta_description: a.meta_description || '',
      excerpt: a.excerpt || decode(p.excerpt).slice(0, 200),
      category: a.category || 'Autres',
      tags: Array.isArray(a.tags) ? a.tags : [],
      date: p.date, reading_time_min: a.reading_time_min || 6,
      key_takeaways: Array.isArray(a.key_takeaways) ? a.key_takeaways : [],
      body_html: sanitize(a.body_html),
      faq: Array.isArray(a.faq) ? a.faq : [],
      image, image_alt: title,
    });
  } else {
    stub++;
    const ref = (refText[String(p.id)]?.text || decode(p.excerpt) || '').slice(0, 3200);
    out.push({
      id: p.id, slug: p.slug, title,
      meta_title: title, meta_description: decode(p.excerpt).slice(0, 155),
      excerpt: decode(p.excerpt).slice(0, 200) || ref.slice(0, 160),
      category: 'Autres', tags: [], date: p.date, reading_time_min: 5,
      key_takeaways: [], body_html: ref ? `<p>${ref}</p>` : '<p>Contenu en cours de mise à jour.</p>',
      faq: [], image, image_alt: title,
    });
  }
}
await flush();

// Null out any image path whose optimized file did not actually land (no dangling 404s)
for (const a of out) {
  if (a.image) {
    const abs = path.join(ROOT, 'public', a.image.replace(/^\//, ''));
    if (!fs.existsSync(abs)) a.image = null;
  }
}

fs.writeFileSync(path.join(ROOT, 'src/data/articles.json'), JSON.stringify(out));
console.log(`articles.json written: ${out.length} (ai=${ok}, stub=${stub}), images optimized=${imgs}`);
