/**
 * Static marketing art under `apps/web/public/images/`.
 * - categories/  → home panels + category heroes
 * - procedures/  → procedure cards (+ a few clinical diagrams used by rich-text)
 */
const CATEGORY_IMAGES: Record<string, string> = {
  rinoplastie: '/images/categories/fata.jpg',
  injectabile: '/images/categories/injectabile.jpg',
  'chirurgia-sanului': '/images/categories/sanul.jpg',
  // legacy slugs
  'chirurgia-faciala': '/images/categories/fata.jpg',
  'alte-proceduri': '/images/categories/injectabile.jpg',
  'chirurgia-postbariatrica': '/images/categories/silueta.jpg',
};

const PROCEDURE_FALLBACK: Record<string, string> = {
  rinoplastie: '/images/categories/fata.jpg',
  injectabile: '/images/categories/injectabile.jpg',
  'chirurgia-sanului': '/images/categories/sanul.jpg',
  'chirurgia-faciala': '/images/categories/fata.jpg',
  'alte-proceduri': '/images/categories/injectabile.jpg',
  'chirurgia-postbariatrica': '/images/categories/silueta.jpg',
};

/** Marketing card art per procedure — preferred over CMS diagrams. */
const PROCEDURE_CARD_IMAGES: Record<string, string> = {
  'rinoplastie-primara': '/images/procedures/rino-primara.jpg',
  'rinoplastie-secundara': '/images/procedures/rino-secundara.jpg',
  rinoplastia: '/images/procedures/rino-primara.jpg',
  injectabile: '/images/procedures/inject.jpg',
  nechirurgicale: '/images/procedures/inject.jpg',
  'augmentare-mamara': '/images/procedures/san-augmentare.jpg',
  'ridicarea-sanilor': '/images/procedures/san-ridicare.jpg',
  'alte-interventii-san': '/images/procedures/san-alte.jpg',
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
