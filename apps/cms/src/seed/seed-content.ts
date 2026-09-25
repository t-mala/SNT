import type { Core } from '@strapi/strapi';
import fs from 'node:fs';
import path from 'node:path';

type SeedCategory = {
  name: string;
  slug: string;
  shortDescription?: string;
  order?: number;
};

type SeedProcedure = {
  title: string;
  slug: string;
  summary?: string;
  body: string;
  categorySlug: string;
};

type SeedFaqItem = {
  question: string;
  answer: string;
  topic?: string;
  order?: number;
};

type SeedData = {
  siteSetting: Record<string, string>;
  homePage: Record<string, string>;
  aboutPage: Record<string, string>;
  contactPage: Record<string, string>;
  faqPage: Record<string, string>;
  categories: SeedCategory[];
  procedures: SeedProcedure[];
  faqItems: SeedFaqItem[];
  galleryAlbums: Array<{ title: string; slug: string; description?: string }>;
};

function loadSeedData(): SeedData {
  const filePath = path.join(process.cwd(), 'data', 'seed-content.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as SeedData;
}

async function upsertSingle(
  strapi: Core.Strapi,
  uid: any,
  data: Record<string, unknown>,
) {
  const existing = await strapi.documents(uid).findFirst({});
  if (existing) {
    await strapi.documents(uid).update({
      documentId: existing.documentId,
      data,
      status: 'published',
    });
    return;
  }

  await strapi.documents(uid).create({
    data,
    status: 'published',
  });
}

async function upsertBySlug(
  strapi: Core.Strapi,
  uid: any,
  slug: string,
  data: Record<string, unknown>,
) {
  const existing = await strapi.documents(uid).findMany({
    filters: { slug },
    limit: 1,
  });

  if (existing?.[0]) {
    await strapi.documents(uid).update({
      documentId: existing[0].documentId,
      data,
      status: 'published',
    });
    return existing[0].documentId as string;
  }

  const created = await strapi.documents(uid).create({
    data,
    status: 'published',
  });
  return created.documentId as string;
}

export async function seedContent(strapi: Core.Strapi, { force = false } = {}) {
  const shouldForce = force || process.env.SEED_FORCE === 'true';
  const existingSettings = await strapi.documents('api::site-setting.site-setting').findFirst({});
  if (existingSettings && !shouldForce) {
    strapi.log.info('Seed skipped (Site Setting already exists). Set SEED_FORCE=true to re-seed.');
    return;
  }

  const seed = loadSeedData();
  strapi.log.info('Seeding content from data/seed-content.json…');

  await upsertSingle(strapi, 'api::site-setting.site-setting', seed.siteSetting);
  await upsertSingle(strapi, 'api::home-page.home-page', seed.homePage);
  await upsertSingle(strapi, 'api::about-page.about-page', seed.aboutPage);
  await upsertSingle(strapi, 'api::contact-page.contact-page', seed.contactPage);
  await upsertSingle(strapi, 'api::faq-page.faq-page', seed.faqPage);

  const categoryIds = new Map<string, string>();
  for (const category of seed.categories) {
    const documentId = await upsertBySlug(strapi, 'api::procedure-category.procedure-category', category.slug, {
      name: category.name,
      slug: category.slug,
      shortDescription: category.shortDescription,
      order: category.order ?? 0,
    });
    categoryIds.set(category.slug, documentId);
  }

  for (const procedure of seed.procedures) {
    const categoryId = categoryIds.get(procedure.categorySlug);
    await upsertBySlug(strapi, 'api::procedure.procedure', procedure.slug, {
      title: procedure.title,
      slug: procedure.slug,
      summary: procedure.summary,
      body: procedure.body,
      ...(categoryId
        ? {
            category: {
              connect: [categoryId],
            },
          }
        : {}),
    });
  }

  for (const album of seed.galleryAlbums) {
    await upsertBySlug(strapi, 'api::gallery-album.gallery-album', album.slug, {
      title: album.title,
      slug: album.slug,
      description: album.description,
      ...('order' in album ? { order: (album as { order?: number }).order ?? 0 } : {}),
    });
  }

  await syncFaqFromSeed(strapi, { force: true });
  strapi.log.info('Seed completed and published.');
}

/** Replace or create FAQ items from seed-content.json. */
export async function syncFaqFromSeed(
  strapi: Core.Strapi,
  { force = false } = {},
) {
  const shouldForce = force || process.env.SEED_FAQ === 'true' || process.env.SEED_FORCE === 'true';
  const seed = loadSeedData();

  await upsertSingle(strapi, 'api::faq-page.faq-page', seed.faqPage);

  const existingFaq = await strapi.documents('api::faq-item.faq-item').findMany({
    limit: 200,
  });

  if (!shouldForce && existingFaq?.length) {
    return;
  }

  if (existingFaq?.length) {
    for (const item of existingFaq) {
      await strapi.documents('api::faq-item.faq-item').delete({
        documentId: item.documentId,
      });
    }
  }

  for (const item of seed.faqItems) {
    await strapi.documents('api::faq-item.faq-item').create({
      data: {
        question: item.question,
        answer: item.answer,
        topic: item.topic,
        order: item.order ?? 0,
      },
      status: 'published',
    });
  }

  strapi.log.info(`Synced ${seed.faqItems.length} FAQ items.`);
}
