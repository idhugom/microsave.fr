import rss from '@astrojs/rss';
import { articles } from '../lib/articles.ts';

export function GET(context) {
  return rss({
    title: 'Microsave — Le magazine des choix malins',
    description: 'Décryptages, comparatifs et conseils pratiques pour mieux décider au quotidien.',
    site: context.site ?? 'https://www.microsave.fr',
    items: articles.slice(0, 60).map((a) => ({
      title: a.title,
      pubDate: new Date(a.date),
      description: a.excerpt,
      link: `/${a.slug}/`,
      categories: [a.category],
    })),
    customData: `<language>fr-FR</language>`,
  });
}
