import type { Core } from '@strapi/strapi';
import fs from 'node:fs';
import path from 'node:path';

const ALBUMS: Array<{ slug: string; folder: string; title: string }> = [
  {
    slug: 'augmentare-mamara',
    folder: 'augmentare-mamara',
    title: 'Augmentare mamară',
  },
  {
    slug: 'rinoplastie',
    folder: 'rinoplastie',
    title: 'Rinoplastie',
  },
];

type GalleryOrder = {
  albums: string[];
  images: Record<string, string[]>;
};

function galleryRoot(): string {
  return path.join(process.cwd(), 'data', 'gallery');
}

function loadCaptions(): Record<string, string> {
  const filePath = path.join(galleryRoot(), 'captions.json');
  if (!fs.existsSync(filePath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, string>;
}

function loadOrder(): GalleryOrder {
  const filePath = path.join(galleryRoot(), 'order.json');
  if (!fs.existsSync(filePath)) {
    return { albums: ALBUMS.map((a) => a.slug), images: {} };
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as GalleryOrder;
}

function captionFor(fileName: string, captions: Record<string, string>): string {
  return captions[fileName] || captions[fileName.toLowerCase()] || '';
}

function filesForAlbum(slug: string, dir: string, order: GalleryOrder): string[] {
  const preferred = order.images[slug] || [];
  const onDisk = fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  const diskSet = new Set(onDisk);
  const ordered = preferred.filter((f) => diskSet.has(f));
  const rest = onDisk
    .filter((f) => !ordered.includes(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return [...ordered, ...rest];
}

async function uploadLocalImage(strapi: Core.Strapi, filePath: string) {
  const stats = fs.statSync(filePath);
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  const mime =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

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
  if (!file?.id) {
    throw new Error(`Upload failed for ${fileName}`);
  }
  return file;
}

async function ensureAlbum(
  strapi: Core.Strapi,
  slug: string,
  title: string,
  albumOrder: number,
) {
  const existing = await strapi.documents('api::gallery-album.gallery-album').findMany({
    filters: { slug },
    limit: 1,
  });

  if (existing?.[0]) {
    if ((existing[0] as { order?: number }).order !== albumOrder) {
      await strapi.documents('api::gallery-album.gallery-album').update({
        documentId: existing[0].documentId,
        data: { order: albumOrder },
        status: 'published',
      });
    }
    return existing[0].documentId as string;
  }

  if (slug === 'augmentare-mamara') {
    const legacy = await strapi.documents('api::gallery-album.gallery-album').findMany({
      filters: { slug: 'augmentare-mamara-4' },
      limit: 1,
    });
    if (legacy?.[0]) {
      await strapi.documents('api::gallery-album.gallery-album').update({
        documentId: legacy[0].documentId,
        data: {
          slug,
          title,
          description: `Galerie foto ${title.toLowerCase()}`,
          order: albumOrder,
        },
        status: 'published',
      });
      return legacy[0].documentId as string;
    }
  }

  const created = await strapi.documents('api::gallery-album.gallery-album').create({
    data: {
      title,
      slug,
      description: `Galerie foto ${title.toLowerCase()}`,
      order: albumOrder,
    },
    status: 'published',
  });
  return created.documentId as string;
}

/** Apply captions from data/gallery/captions.json onto existing gallery images. */
export async function syncGalleryCaptions(strapi: Core.Strapi) {
  const captions = loadCaptions();
  if (!Object.keys(captions).length) {
    return;
  }

  const items = await strapi.documents('api::gallery-image.gallery-image').findMany({
    populate: { image: true },
    limit: 200,
  });

  let updated = 0;
  for (const item of items) {
    const fileName = (item as { image?: { name?: string } }).image?.name;
    if (!fileName) {
      continue;
    }
    const next = captionFor(fileName, captions);
    if (!next || item.caption === next) {
      continue;
    }
    await strapi.documents('api::gallery-image.gallery-image').update({
      documentId: item.documentId,
      data: { caption: next },
      status: 'published',
    });
    updated += 1;
  }

  if (updated) {
    strapi.log.info(`Updated captions on ${updated} gallery images.`);
  }
}

/** Match image/album order to the original WordPress gallery. */
export async function syncGalleryOrder(strapi: Core.Strapi) {
  const order = loadOrder();
  let updated = 0;

  for (let i = 0; i < order.albums.length; i++) {
    const slug = order.albums[i];
    const albums = await strapi.documents('api::gallery-album.gallery-album').findMany({
      filters: { slug },
      limit: 1,
    });
    const album = albums?.[0];
    if (!album) {
      continue;
    }
    const albumOrder = i + 1;
    if ((album as { order?: number }).order !== albumOrder) {
      await strapi.documents('api::gallery-album.gallery-album').update({
        documentId: album.documentId,
        data: { order: albumOrder },
        status: 'published',
      });
      updated += 1;
    }

    const preferred = order.images[slug] || [];
    if (!preferred.length) {
      continue;
    }

    const rank = new Map(preferred.map((name, idx) => [name, idx + 1]));
    const images = await strapi.documents('api::gallery-image.gallery-image').findMany({
      filters: { album: { documentId: album.documentId } },
      populate: { image: true },
      limit: 200,
    });

    for (const item of images) {
      const fileName = (item as { image?: { name?: string } }).image?.name;
      if (!fileName || !rank.has(fileName)) {
        continue;
      }
      const nextOrder = rank.get(fileName)!;
      if (item.order === nextOrder) {
        continue;
      }
      await strapi.documents('api::gallery-image.gallery-image').update({
        documentId: item.documentId,
        data: { order: nextOrder },
        status: 'published',
      });
      updated += 1;
    }
  }

  if (updated) {
    strapi.log.info(`Updated gallery order on ${updated} records.`);
  }
}

/**
 * Import before/after photos from data/gallery into Strapi albums.
 * Idempotent: skips albums that already have images unless force=true.
 */
export async function seedGalleryFromDisk(
  strapi: Core.Strapi,
  { force = false } = {},
) {
  const shouldForce = force || process.env.SEED_GALLERY === 'true';
  const root = galleryRoot();
  const captions = loadCaptions();
  const order = loadOrder();

  if (!fs.existsSync(root)) {
    strapi.log.warn(`Gallery folder missing: ${root}`);
    return;
  }

  for (let albumIndex = 0; albumIndex < ALBUMS.length; albumIndex++) {
    const album = ALBUMS[albumIndex];
    const dir = path.join(root, album.folder);
    if (!fs.existsSync(dir)) {
      strapi.log.warn(`Skip album ${album.slug}: folder not found`);
      continue;
    }

    const albumOrder = (order.albums.indexOf(album.slug) + 1) || albumIndex + 1;
    const albumId = await ensureAlbum(strapi, album.slug, album.title, albumOrder);
    const existingImages = await strapi.documents('api::gallery-image.gallery-image').findMany({
      filters: { album: { documentId: albumId } },
      limit: 1,
    });

    if (existingImages?.length && !shouldForce) {
      strapi.log.info(`Gallery album "${album.slug}" already has images — skip`);
      continue;
    }

    if (existingImages?.length && shouldForce) {
      const all = await strapi.documents('api::gallery-image.gallery-image').findMany({
        filters: { album: { documentId: albumId } },
        limit: 200,
      });
      for (const img of all) {
        await strapi.documents('api::gallery-image.gallery-image').delete({
          documentId: img.documentId,
        });
      }
    }

    const files = filesForAlbum(album.slug, dir, order);
    strapi.log.info(`Importing ${files.length} images into album "${album.slug}"…`);

    for (let i = 0; i < files.length; i++) {
      const filePath = path.join(dir, files[i]);
      const uploaded = await uploadLocalImage(strapi, filePath);
      await strapi.documents('api::gallery-image.gallery-image').create({
        data: {
          caption: captionFor(files[i], captions),
          order: i + 1,
          image: uploaded.id,
          album: {
            connect: [albumId],
          },
        },
        status: 'published',
      } as any);
    }
  }

  await syncGalleryCaptions(strapi);
  await syncGalleryOrder(strapi);
  strapi.log.info('Gallery import completed.');
}
