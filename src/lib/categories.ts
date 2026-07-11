export type Category = { label: string; slug: string; color: string; blurb: string };

// Une seule couleur d'accent secondaire : le rose du logo (var(--pink)).
export const CATEGORIES: Category[] = [
  { label: 'Assurance & Finance', slug: 'assurance-finance', color: 'var(--pink)', blurb: 'Contrats, garanties, résiliation et bons calculs pour protéger votre budget.' },
  { label: 'Bricolage & Outils', slug: 'bricolage-outils', color: 'var(--pink)', blurb: 'Outillage, techniques et gestes précis pour réussir tous vos travaux.' },
  { label: 'Auto & Mobilité', slug: 'auto-mobilite', color: 'var(--pink)', blurb: 'Entretien, accessoires et conseils pour rouler serein.' },
  { label: 'Maison & Literie', slug: 'maison-literie', color: 'var(--pink)', blurb: 'Confort, sommeil et aménagement d’un intérieur qui vous ressemble.' },
  { label: 'Mode & Accessoires', slug: 'mode-accessoires', color: 'var(--pink)', blurb: 'Style, matières et pièces qui font la différence.' },
  { label: 'Voyage & Évasion', slug: 'voyage-evasion', color: 'var(--pink)', blurb: 'Destinations, budgets et expériences à vivre au moins une fois.' },
  { label: 'Santé & Bien-être', slug: 'sante-bien-etre', color: 'var(--pink)', blurb: 'Comprendre son corps et prendre soin de soi, sans idées reçues.' },
  { label: 'Éducation & Famille', slug: 'education-famille', color: 'var(--pink)', blurb: 'Apprentissage, accompagnement et vie de famille au quotidien.' },
  { label: 'Cuisine & Gastronomie', slug: 'cuisine-gastronomie', color: 'var(--pink)', blurb: 'Produits, adresses et savoir-faire pour bien manger.' },
  { label: 'Jardin & Extérieur', slug: 'jardin-exterieur', color: 'var(--pink)', blurb: 'Cultiver, aménager et profiter de son espace extérieur.' },
  { label: 'High-Tech & Objets connectés', slug: 'high-tech', color: 'var(--pink)', blurb: 'Gadgets malins et technologies qui simplifient la vie.' },
  { label: 'Sport & Loisirs', slug: 'sport-loisirs', color: 'var(--pink)', blurb: 'Équipement et inspiration pour bouger et se divertir.' },
  { label: 'Droit & Démarches', slug: 'droit-demarches', color: 'var(--pink)', blurb: 'Vos droits et les démarches expliqués simplement.' },
  { label: 'Autres', slug: 'autres', color: 'var(--pink)', blurb: 'Le meilleur du reste, à découvrir sans catégorie.' },
];

const BY_LABEL = new Map(CATEGORIES.map((c) => [c.label, c]));
const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function catByLabel(label: string): Category {
  return BY_LABEL.get(label) ?? CATEGORIES[CATEGORIES.length - 1];
}
export function catBySlug(slug: string): Category | undefined {
  return BY_SLUG.get(slug);
}
