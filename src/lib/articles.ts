import raw from '../data/articles.json';
import { catByLabel, type Category } from './categories';

export type Faq = { question: string; answer: string };
export type Article = {
  id: number;
  slug: string;
  title: string;
  meta_title: string;
  meta_description: string;
  excerpt: string;
  category: string;
  tags: string[];
  date: string;
  reading_time_min: number;
  key_takeaways: string[];
  body_html: string;
  faq: Faq[];
  image: string | null;
  image_alt: string;
};

export const articles: Article[] = (raw as Article[])
  .slice()
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

export const bySlug = new Map(articles.map((a) => [a.slug, a]));

export function categoryOf(a: Article): Category {
  return catByLabel(a.category);
}

export function inCategory(label: string): Article[] {
  return articles.filter((a) => a.category === label);
}

export function related(a: Article, n = 3): Article[] {
  const tags = new Set(a.tags.map((t) => t.toLowerCase()));
  const scored = articles
    .filter((x) => x.slug !== a.slug)
    .map((x) => {
      let s = x.category === a.category ? 2 : 0;
      for (const t of x.tags) if (tags.has(t.toLowerCase())) s += 1;
      return { x, s };
    })
    .sort((p, q) => q.s - p.s || (p.x.date < q.x.date ? 1 : -1));
  return scored.slice(0, n).map((p) => p.x);
}

export function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}
