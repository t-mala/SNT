import type { Core } from '@strapi/strapi';
import fs from 'node:fs';
import path from 'node:path';

type ImportCategory = {
  slug: string;
  name: string;
  shortDescription?: string;
  body?: string;
  images?: string[];
};

type ImportProcedure = {
  slug: string;
  title: string;
  categorySlug: string;
  summary?: string;
  body: string;
  contentImages?: string[];
  galleryImages?: string[];
  order?: number;
};

type ImportPayload = {
  categories: ImportCategory[];
  procedures: ImportProcedure[];
};

function importRoot(): string {
  return path.join(process.cwd(), 'data', 'wp-import');
}

function loadImport(): ImportPayload | null {
  const filePath = path.join(importRoot(), 'content.json');
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ImportPayload;
}

/** Fix WP leftovers: captions as h1, images nested in headings, etc. */
export function sanitizeImportedHtml(html: string): string {
  if (!html) {
    return html;
  }
  let out = html;
  out = out.replace(/<div>\s*Pages:\s*[\s\S]*?<\/div>/gi, '');
  out = out.replace(/<div[^>]*>\s*<\/div>/gi, '');
  out = out.replace(/Pages:\s*/gi, '');
  out = out.replace(
    /<a[^>]+href=["']https?:\/\/(?:www\.)?drtatulescu\.com[^"']*["'][^>]*>\s*\d+\s*<\/a>/gi,
    '',
  );

  const map: Array<[RegExp, string]> = [
    [/https?:\/\/(?:www\.)?drtatulescu\.com\/contact\/?/gi, '/contact'],
    [/https?:\/\/(?:www\.)?drtatulescu\.com\/faq\/?/gi, '/faq'],
    [/https?:\/\/(?:www\.)?drtatulescu\.com\/galerie\/?/gi, '/galerie'],
    [/https?:\/\/(?:www\.)?drtatulescu\.com\/chirurgul\/?/gi, '/chirurgul'],
    [
      /https?:\/\/(?:www\.)?drtatulescu\.com\/chirurgia-faciala\/rinoplastia(?:\/\d+)?\/?/gi,
      '/chirurgia-faciala/rinoplastia',
    ],
    [
      /https?:\/\/(?:www\.)?drtatulescu\.com\/chirurgia-faciala\/blefaroplastia(?:\/\d+)?\/?/gi,
      '/chirurgia-faciala/blefaroplastia',
    ],
    [
      /https?:\/\/(?:www\.)?drtatulescu\.com\/chirurgia-faciala\/otoplastia(?:\/\d+)?\/?/gi,
      '/chirurgia-faciala/otoplastia',
    ],
    [
      /https?:\/\/(?:www\.)?drtatulescu\.com\/chirurgia-faciala\/alte-interventii\/?/gi,
      '/chirurgia-faciala/alte-interventii-fata',
    ],
    [
      /https?:\/\/(?:www\.)?drtatulescu\.com\/chirurgia-sanului\/augmentare-mamara(?:\/\d+)?\/?/gi,
      '/chirurgia-sanului/augmentare-mamara',
    ],
    [
      /https?:\/\/(?:www\.)?drtatulescu\.com\/chirurgia-sanului\/ridicarea-sanilor(?:\/\d+)?\/?/gi,
      '/chirurgia-sanului/ridicarea-sanilor',
    ],
    [
      /https?:\/\/(?:www\.)?drtatulescu\.com\/chirurgia-sanului\/alte-interventii\/?/gi,
      '/chirurgia-sanului/alte-interventii-san',
    ],
    [/https?:\/\/(?:www\.)?drtatulescu\.com\/?/gi, '/'],
  ];
  for (const [pat, repl] of map) {
    out = out.replace(pat, repl);
  }

  // Demote WP red "section title" h1s to h2
  out = out.replace(/<h1(\b[^>]*)>/gi, '<h2$1>');
  out = out.replace(/<\/h1>/gi, '</h2>');

  // <h2><p><img/></p>Caption</h2>  →  figure + optional h2 caption after
  out = out.replace(
    /<h2[^>]*>\s*(?:<p>\s*)?(<img\b[^>]*>)\s*(?:<\/p>\s*)?([^<]*?)\s*<\/h2>/gi,
    (_full, img: string, rest: string) => {
      const caption = (rest || '').trim();
      const figure = `<figure class="proc-figure">${img}</figure>`;
      if (!caption) {
        return figure;
      }
      return `${figure}<h2>${caption}</h2>`;
    },
  );

  // <h2>Title</h2>\n<figure> already ok; also <h2>Title</h2><p><img></p>
  out = out.replace(
    /(<h2[^>]*>[\s\S]*?<\/h2>)\s*<p>\s*(<img\b[^>]*>)\s*<\/p>/gi,
    '$1<figure class="proc-figure">$2</figure>',
  );

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Strip leftover WP "Pages: 1 2 3" nav and old-site links from published HTML.
 */
export async function syncProcedureBodiesFromWp(strapi: Core.Strapi) {
  let updated = 0;

  const categories = await strapi.documents('api::procedure-category.procedure-category').findMany({
    limit: 50,
  });
  for (const row of categories) {
    const current = (row as { body?: string }).body || '';
    if (!current) continue;
    const nextBody = sanitizeImportedHtml(current);
    if (nextBody === current) continue;
    await strapi.documents('api::procedure-category.procedure-category').update({
      documentId: row.documentId,
      data: { body: nextBody },
      status: 'published',
    } as any);
    updated += 1;
  }

  const procedures = await strapi.documents('api::procedure.procedure').findMany({
    limit: 100,
  });
  for (const row of procedures) {
    const current = (row as { body?: string }).body || '';
    if (!current) continue;
    const nextBody = sanitizeImportedHtml(current);
    if (nextBody === current) continue;
    await strapi.documents('api::procedure.procedure').update({
      documentId: row.documentId,
      data: { body: nextBody },
      status: 'published',
    } as any);
    updated += 1;
  }

  if (updated) {
    strapi.log.info(`Cleaned WP pagination/old links on ${updated} content entries.`);
  }
}

async function uploadLocalImage(strapi: Core.Strapi, filePath: string) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const stats = fs.statSync(filePath);
  if (stats.size < 400) {
    return null;
  }
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  const mime =
    ext === '.png'
      ? 'image/png'
      : ext === '.webp'
        ? 'image/webp'
        : ext === '.gif'
          ? 'image/gif'
          : 'image/jpeg';

  const uploaded = await strapi.plugin('upload').service('upload').upload({
    data: {
      fileInfo: {
        name: fileName,
        alternativeText: fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      },
    },
    files: {
      filepath: filePath,
      path: filePath,
      name: fileName,
      originalFilename: fileName,
      mimetype: mime,
      type: mime,
      size: stats.size,
    },
  });

  const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
  return file?.id ? file : null;
}

function rewriteLocalMarkers(
  html: string,
  urlMap: Map<string, string>,
): string {
  let out = html;
  for (const [marker, url] of urlMap) {
    out = out.split(`LOCAL:${marker}`).join(url);
  }
  return out;
}

async function ensureCategory(
  strapi: Core.Strapi,
  cat: ImportCategory,
  coverId?: number,
  body?: string,
) {
  const existing = await strapi.documents('api::procedure-category.procedure-category').findMany({
    filters: { slug: cat.slug },
    limit: 1,
  });

  const data: Record<string, unknown> = {
    name: cat.name,
    slug: cat.slug,
    shortDescription: cat.shortDescription || '',
    body: body || cat.body || '',
  };
  if (coverId) {
    data.coverImage = coverId;
  }

  if (existing?.[0]) {
    await strapi.documents('api::procedure-category.procedure-category').update({
      documentId: existing[0].documentId,
      data,
      status: 'published',
    } as any);
    return existing[0].documentId as string;
  }

  const created = await strapi.documents('api::procedure-category.procedure-category').create({
    data,
    status: 'published',
  } as any);
  return created.documentId as string;
}

async function upsertProcedure(
  strapi: Core.Strapi,
  proc: ImportProcedure,
  categoryId: string,
  coverId: number | null,
  galleryIds: number[],
  body: string,
) {
  const existing = await strapi.documents('api::procedure.procedure').findMany({
    filters: { slug: proc.slug },
    limit: 1,
  });

  const data: Record<string, unknown> = {
    title: proc.title,
    slug: proc.slug,
    summary: proc.summary || '',
    body,
    order: proc.order ?? 0,
    category: { connect: [categoryId] },
  };
  if (coverId) {
    data.coverImage = coverId;
  }
  if (galleryIds.length) {
    data.galleryImages = galleryIds;
  }

  if (existing?.[0]) {
    await strapi.documents('api::procedure.procedure').update({
      documentId: existing[0].documentId,
      data,
      status: 'published',
    } as any);
    return;
  }

  await strapi.documents('api::procedure.procedure').create({
    data,
    status: 'published',
  } as any);
}

/**
 * Import scraped WordPress procedure/category content + images.
 * Runs when SEED_PROCEDURES=true.
 */
export async function seedProceduresFromWp(strapi: Core.Strapi) {
  if (process.env.SEED_PROCEDURES !== 'true') {
    return;
  }

  const payload = loadImport();
  if (!payload) {
    strapi.log.warn('WP import payload missing at data/wp-import/content.json');
    return;
  }

  const imagesRoot = path.join(importRoot(), 'images');
  const categoryIds = new Map<string, string>();

  strapi.log.info('Importing WP procedure content…');

  for (const cat of payload.categories) {
    const urlMap = new Map<string, string>();
    let coverId: number | undefined;
    for (const fileName of cat.images || []) {
      const filePath = path.join(imagesRoot, cat.slug, fileName);
      const uploaded = await uploadLocalImage(strapi, filePath);
      if (!uploaded) {
        continue;
      }
      urlMap.set(`${cat.slug}/${fileName}`, uploaded.url);
      if (!coverId) {
        coverId = uploaded.id;
      }
    }
    const body = rewriteLocalMarkers(sanitizeImportedHtml(cat.body || ''), urlMap);
    const id = await ensureCategory(strapi, cat, coverId, body);
    categoryIds.set(cat.slug, id);
    strapi.log.info(`Category updated: ${cat.slug}`);
  }

  // Ensure category ids even if not in import (silueta etc.)
  for (const proc of payload.procedures) {
    if (categoryIds.has(proc.categorySlug)) {
      continue;
    }
    const existing = await strapi.documents('api::procedure-category.procedure-category').findMany({
      filters: { slug: proc.categorySlug },
      limit: 1,
    });
    if (existing?.[0]) {
      categoryIds.set(proc.categorySlug, existing[0].documentId);
    }
  }

  const orderBySlug: Record<string, number> = {
    rinoplastia: 1,
    blefaroplastia: 2,
    otoplastia: 3,
    'alte-interventii-fata': 4,
    'augmentare-mamara': 1,
    'ridicarea-sanilor': 2,
    'alte-interventii-san': 3,
  };

  for (const proc of payload.procedures) {
    const categoryId = categoryIds.get(proc.categorySlug);
    if (!categoryId) {
      strapi.log.warn(`Skip ${proc.slug}: category ${proc.categorySlug} missing`);
      continue;
    }

    const urlMap = new Map<string, string>();
    const contentIds: number[] = [];
    for (const fileName of proc.contentImages || []) {
      const filePath = path.join(imagesRoot, proc.slug, fileName);
      const uploaded = await uploadLocalImage(strapi, filePath);
      if (!uploaded) {
        continue;
      }
      urlMap.set(`${proc.slug}/${fileName}`, uploaded.url);
      contentIds.push(uploaded.id);
    }

    const galleryIds: number[] = [];
    for (const rel of proc.galleryImages || []) {
      const filePath = path.join(imagesRoot, proc.slug, rel);
      const uploaded = await uploadLocalImage(strapi, filePath);
      if (!uploaded) {
        continue;
      }
      galleryIds.push(uploaded.id);
    }

    const body = rewriteLocalMarkers(sanitizeImportedHtml(proc.body || ''), urlMap);
    // Prefer real photo as cover (gallery), not instructional diagrams from the article
    const coverId = galleryIds[0] || contentIds[0] || null;
    await upsertProcedure(
      strapi,
      { ...proc, order: orderBySlug[proc.slug] ?? 0 },
      categoryId,
      coverId,
      galleryIds,
      body,
    );
    strapi.log.info(
      `Procedure updated: ${proc.slug} (content imgs ${contentIds.length}, gallery ${galleryIds.length})`,
    );
  }

  // Merge extra rinoplastie gallery photos into the public Galerie album
  await mergeRinoGalleryAlbum(strapi, imagesRoot);

  strapi.log.info('WP procedure import completed.');
}

async function mergeRinoGalleryAlbum(strapi: Core.Strapi, imagesRoot: string) {
  const albumRows = await strapi.documents('api::gallery-album.gallery-album').findMany({
    filters: { slug: 'rinoplastie' },
    limit: 1,
  });
  const album = albumRows?.[0];
  if (!album) {
    return;
  }

  const existing = await strapi.documents('api::gallery-image.gallery-image').findMany({
    filters: { album: { documentId: album.documentId } },
    populate: { image: true },
    limit: 300,
  });
  const existingNames = new Set(
    existing.map((item) => (item as { image?: { name?: string } }).image?.name).filter(Boolean),
  );

  const galleryDir = path.join(imagesRoot, 'rinoplastia', 'gallery');
  if (!fs.existsSync(galleryDir)) {
    return;
  }

  const captionsPath = path.join(process.cwd(), 'data', 'gallery', 'captions.json');
  const captions: Record<string, string> = fs.existsSync(captionsPath)
    ? JSON.parse(fs.readFileSync(captionsPath, 'utf8'))
    : {};

  const orderPath = path.join(process.cwd(), 'data', 'gallery', 'order.json');
  const preferred: string[] = fs.existsSync(orderPath)
    ? (JSON.parse(fs.readFileSync(orderPath, 'utf8')).images?.rinoplastie || [])
    : [];

  const files = fs
    .readdirSync(galleryDir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

  // Prefer original WP order, then leftovers
  const ordered = [
    ...preferred.filter((f) => files.includes(f)),
    ...files.filter((f) => !preferred.includes(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  ];

  let added = 0;
  let order = existing.length;
  for (const fileName of ordered) {
    if (existingNames.has(fileName)) {
      continue;
    }
    const uploaded = await uploadLocalImage(strapi, path.join(galleryDir, fileName));
    if (!uploaded) {
      continue;
    }
    order += 1;
    await strapi.documents('api::gallery-image.gallery-image').create({
      data: {
        caption: captions[fileName] || '',
        order,
        image: uploaded.id,
        album: { connect: [album.documentId] },
      },
      status: 'published',
    } as any);
    added += 1;
  }

  if (added) {
    strapi.log.info(`Added ${added} photos to galerie/rinoplastie album.`);
  }
}
