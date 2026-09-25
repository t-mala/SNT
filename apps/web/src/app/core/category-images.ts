/**
 * Static marketing art under `apps/web/public/images/`.
 * - categories/  → home panels + category heroes
 * - procedures/  → procedure cards (+ a few clinical diagrams used by rich-text)
 */
const CATEGORY_IMAGES: Record<string, string> = {
  'chirurgia-faciala': '/images/categories/fata.jpg',
  'chirurgia-sanului': '/images/categories/sanul.jpg',
  'chirurgia-postbariatrica': '/images/categories/silueta.jpg',
  'alte-proceduri': '/images/categories/alte.jpg',
};

const PROCEDURE_FALLBACK: Record<string, string> = {
  'chirurgia-faciala': '/images/categories/fata.jpg',
  'chirurgia-sanului': '/images/categories/sanul.jpg',
  'chirurgia-postbariatrica': '/images/categories/silueta.jpg',
  'alte-proceduri': '/images/categories/alte.jpg',
};

/** Marketing card art per procedure — preferred over CMS diagrams. */
const PROCEDURE_CARD_IMAGES: Record<string, string> = {
  rinoplastia: '/images/procedures/rino.jpg',
  blefaroplastia: '/images/procedures/blefaro.jpg',
  otoplastia: '/images/procedures/oto.jpg',
  'alte-interventii-fata': '/images/procedures/serene.jpg',
  'alte-interventii-san': '/images/procedures/san-alte.jpg',
  'augmentare-mamara': '/images/procedures/san-augmentare.jpg',
  'ridicarea-sanilor': '/images/procedures/san-ridicare.jpg',
  lipoaspiratia: '/images/procedures/lipo.jpg',
  abdominoplastia: '/images/procedures/abdomino.jpg',
  labioplastia: '/images/procedures/labio.jpg',
  'marirea-penisului': '/images/procedures/intimb.jpg',
  nechirurgicale: '/images/procedures/inject.jpg',
};

export function categoryImage(slug?: string | null): string {
  if (!slug) {
    return '/images/hero.jpg';
  }
  return CATEGORY_IMAGES[slug] ?? '/images/hero.jpg';
}

export function procedureFallbackImage(categorySlug?: string | null): string {
  if (!categorySlug) {
    return '/images/hero.jpg';
  }
  return PROCEDURE_FALLBACK[categorySlug] ?? '/images/hero.jpg';
}

export function procedureCardImage(
  procedureSlug?: string | null,
  categorySlug?: string | null,
): string {
  if (procedureSlug && PROCEDURE_CARD_IMAGES[procedureSlug]) {
    return PROCEDURE_CARD_IMAGES[procedureSlug];
  }
  return procedureFallbackImage(categorySlug);
}
