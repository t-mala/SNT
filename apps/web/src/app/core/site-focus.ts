import { Procedure, ProcedureCategory, WithStrapiMeta } from './models/content.models';

/**
 * Public site focuses on these categories (and their procedures).
 * Extra CMS entries stay editable but are hidden from nav / home until added here.
 */
export const FOCUS_CATEGORY_SLUGS = [
  'rinoplastie',
  'chirurgia-sanului',
  'injectabile',
] as const;

export const FOCUS_GALLERY_ALBUM_SLUGS = [
  'rinoplastie-primara',
  'rinoplastie-secundara',
  'injectabile',
  'augmentare-mamara',
] as const;

export type FocusCategorySlug = (typeof FOCUS_CATEGORY_SLUGS)[number];

export function isFocusCategory(slug?: string | null): boolean {
  return !!slug && (FOCUS_CATEGORY_SLUGS as readonly string[]).includes(slug);
}

export function isFocusGalleryAlbum(slug?: string | null): boolean {
  return !!slug && (FOCUS_GALLERY_ALBUM_SLUGS as readonly string[]).includes(slug);
}

const SANUL_PROCEDURE_SLUGS = new Set([
  'augmentare-mamara',
  'ridicarea-sanilor',
  'alte-interventii-san',
]);

function findProcedure(
  categories: WithStrapiMeta<ProcedureCategory>[],
  slug: string,
): WithStrapiMeta<Procedure> | undefined {
  for (const category of categories) {
    const match = (category.procedures || []).find((p) => p.slug === slug);
    if (match) {
      return match;
    }
  }
  return undefined;
}

function syntheticCategory(
  slug: FocusCategorySlug,
  name: string,
  shortDescription: string,
  order: number,
  procedures: WithStrapiMeta<Procedure>[],
  base?: WithStrapiMeta<ProcedureCategory>,
): WithStrapiMeta<ProcedureCategory> {
  return {
    id: base?.id ?? order,
    documentId: base?.documentId ?? `focus-${slug}`,
    name,
    slug,
    shortDescription,
    order,
    body: base?.body ?? null,
    coverImage: base?.coverImage ?? null,
    procedures,
    createdAt: base?.createdAt,
    updatedAt: base?.updatedAt,
    publishedAt: base?.publishedAt ?? null,
  };
}

/**
 * Prefer the new taxonomy when present; otherwise map legacy CMS categories
 * (Față / Alte / Sânul) onto Rinoplastie / Injectabile / Sânul.
 */
export function resolveFocusCategories(
  categories: WithStrapiMeta<ProcedureCategory>[],
): WithStrapiMeta<ProcedureCategory>[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const hasNew = FOCUS_CATEGORY_SLUGS.every((slug) => bySlug.has(slug));

  if (hasNew) {
    return FOCUS_CATEGORY_SLUGS.map((slug) => bySlug.get(slug)!).map((category) => {
      const procedures = [...(category.procedures || [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title, 'ro'),
      );
      if (category.slug === 'chirurgia-sanului') {
        return {
          ...category,
          procedures: procedures.filter((p) => SANUL_PROCEDURE_SLUGS.has(p.slug)),
        };
      }
      if (category.slug === 'rinoplastie') {
        // Primary before secondary even if CMS order is unset
        const rank = (slug?: string | null) =>
          slug === 'rinoplastie-primara' || slug === 'rinoplastia' ? 0 : slug === 'rinoplastie-secundara' ? 1 : 2;
        return {
          ...category,
          procedures: procedures.sort((a, b) => rank(a.slug) - rank(b.slug)),
        };
      }
      return { ...category, procedures };
    });
  }

  const rinoLegacy = findProcedure(categories, 'rinoplastia');
  const injectLegacy = findProcedure(categories, 'nechirurgicale');
  const sanul = bySlug.get('chirurgia-sanului');

  const primary: WithStrapiMeta<Procedure> | undefined = rinoLegacy
    ? {
        ...rinoLegacy,
        title: 'Rinoplastie primară',
        slug: 'rinoplastie-primara',
        summary:
          rinoLegacy.summary ||
          'Prima intervenție de remodelare a nasului — proporții, profil și respirație.',
      }
    : undefined;

  const secondaryBody =
    '<p>Din punct de vedere tehnic este semnificativ mai dificila decat rinoplastia facuta pe un nas fara interventii prealabile (rinoplastia primara) deoarece majoritatea reperelor anatomice sunt modificate, tesuturile normale sunt inlocuite de tesuturi fibroase, cu caracter cicatricial si, cel mai probabil, materialul local ce ar fi putut fi utilizat pentru reconstructie e deja alterat. Excesul de zel chirurgical din ultimii ani lasa in urma cel mai frecvent nasuri fara suport scheletic si cu modificari importante ale aspectului exterior. Interventiile de reconstructie sunt prinurmare elaborate si necesita deseori grefe cartilaginoase de la distanta pentru refacerea unui suport viabil al piramidei nazale.</p>' +
    '<p>Daca rezultatul unei rinoplastii anterioare nu va satisface comunicati-i medicului Dvs. Este cel care cunoaste intim modificarile produse si deci cel mai in masura sa le corecteze.</p>';

  const secondary: WithStrapiMeta<Procedure> | undefined = rinoLegacy
    ? {
        ...rinoLegacy,
        id: (rinoLegacy.id ?? 0) + 9000,
        documentId: `${rinoLegacy.documentId}-secundara`,
        title: 'Rinoplastie secundară',
        slug: 'rinoplastie-secundara',
        summary:
          'E un termen generic ce reuneste toate interventiile realizate pe un nas care a fost deja operat.',
        body: secondaryBody,
      }
    : undefined;

  const inject: WithStrapiMeta<Procedure> | undefined = injectLegacy
    ? {
        ...injectLegacy,
        title: 'Injectabile',
        slug: 'injectabile',
      }
    : undefined;

  const result: WithStrapiMeta<ProcedureCategory>[] = [];

  result.push(
    syntheticCategory(
      'rinoplastie',
      'Rinoplastie',
      'Remodelarea nasului — intervenție primară sau secundară (revizie), adaptată chipului dumneavoastră.',
      1,
      [primary, secondary].filter(Boolean) as WithStrapiMeta<Procedure>[],
      bySlug.get('chirurgia-faciala'),
    ),
  );

  if (sanul) {
    result.push({
      ...sanul,
      shortDescription: sanul.shortDescription || 'Augmentare, ridicare și remodelare mamară.',
      order: 2,
      procedures: (sanul.procedures || []).filter((p) => SANUL_PROCEDURE_SLUGS.has(p.slug)),
    });
  }

  result.push(
    syntheticCategory(
      'injectabile',
      'Injectabile',
      'Tratamente nechirurgicale: toxină botulinică, acid hialuronic și fillere faciale.',
      3,
      inject ? [inject] : [],
      bySlug.get('alte-proceduri'),
    ),
  );

  return result;
}
