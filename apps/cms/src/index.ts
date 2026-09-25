import type { Core } from '@strapi/strapi';
import { seedContent, syncFaqFromSeed } from './seed/seed-content';
import { seedGalleryFromDisk, syncGalleryCaptions, syncGalleryOrder } from './seed/seed-gallery';
import { seedProceduresFromWp, syncProcedureBodiesFromWp } from './seed/seed-procedures';

const PUBLIC_ACTIONS = [
  'api::site-setting.site-setting.find',
  'api::home-page.home-page.find',
  'api::about-page.about-page.find',
  'api::contact-page.contact-page.find',
  'api::faq-page.faq-page.find',
  'api::procedure-category.procedure-category.find',
  'api::procedure-category.procedure-category.findOne',
  'api::procedure.procedure.find',
  'api::procedure.procedure.findOne',
  'api::gallery-album.gallery-album.find',
  'api::gallery-album.gallery-album.findOne',
  'api::gallery-image.gallery-image.find',
  'api::gallery-image.gallery-image.findOne',
  'api::faq-item.faq-item.find',
  'api::faq-item.faq-item.findOne',
] as const;

async function setPublicPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  if (!publicRole) {
    strapi.log.warn('Public role not found; skip permission bootstrap');
    return;
  }

  for (const action of PUBLIC_ACTIONS) {
    const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
      where: {
        action,
        role: publicRole.id,
      },
    });

    if (!existing) {
      await strapi.db.query('plugin::users-permissions.permission').create({
        data: {
          action,
          role: publicRole.id,
        },
      });
    }
  }

  strapi.log.info('Public read permissions ensured for content APIs');
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await setPublicPermissions(strapi);
    await seedContent(strapi);
    await syncFaqFromSeed(strapi);
    await seedGalleryFromDisk(strapi);
    await syncGalleryCaptions(strapi);
    await syncGalleryOrder(strapi);
    await seedProceduresFromWp(strapi);
    await syncProcedureBodiesFromWp(strapi);
  },
};
