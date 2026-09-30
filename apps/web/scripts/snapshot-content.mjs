#!/usr/bin/env node
/**
 * Snapshot Strapi API responses + media into apps/web/public
 * so the site can be deployed without a live CMS.
 *
 * Requires Strapi running (default http://localhost:1337).
 *
 * Usage:
 *   node scripts/snapshot-content.mjs
 *   STRAPI_URL=http://127.0.0.1:1337 node scripts/snapshot-content.mjs
 */
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');
const repoRoot = join(webRoot, '../..');
const contentDir = join(webRoot, 'public/content');
const uploadsDest = join(webRoot, 'public/uploads');
const uploadsSrc = join(repoRoot, 'apps/cms/public/uploads');

const STRAPI_URL = (process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
const API = `${STRAPI_URL}/api`;
const PAGE_SIZE = 100;

async function fetchJson(path, query = {}) {
  const url = new URL(`${API}/${path}`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('pagination[pageSize]', String(PAGE_SIZE));

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${url}`);
  }
  return res.json();
}

async function fetchAllPages(path, query = {}) {
  const first = await fetchJson(path, { ...query, 'pagination[page]': '1' });
  const pageCount = first?.meta?.pagination?.pageCount ?? 1;
  const data = [...(first.data ?? [])];

  for (let page = 2; page <= pageCount; page++) {
    const next = await fetchJson(path, {
      ...query,
      'pagination[page]': String(page),
    });
    data.push(...(next.data ?? []));
  }

  return { data, meta: first.meta };
}

function writeJson(name, payload) {
  const file = join(contentDir, name);
  writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
  const count = Array.isArray(payload?.data) ? payload.data.length : payload?.data ? 1 : 0;
  console.log(`  ✓ ${name}${count ? ` (${count})` : ''}`);
}

async function main() {
  console.log(`Snapshot from ${STRAPI_URL}`);

  try {
    const health = await fetch(`${STRAPI_URL}/_health`).catch(() => null);
    if (!health && !(await fetch(`${API}/site-setting`).then((r) => r.ok).catch(() => false))) {
      throw new Error('Strapi is not reachable. Start it with: npm run cms');
    }
  } catch (err) {
    throw new Error(`Strapi is not reachable at ${STRAPI_URL}. Start it with: npm run cms\n${err.message}`);
  }

  rmSync(contentDir, { recursive: true, force: true });
  mkdirSync(contentDir, { recursive: true });

  writeJson(
    'site-setting.json',
    await fetchJson('site-setting', { populate: 'logo' }),
  );
  writeJson(
    'home-page.json',
    await fetchJson('home-page', { populate: 'heroImage' }),
  );
  writeJson(
    'about-page.json',
    await fetchJson('about-page', { populate: 'photo' }),
  );
  writeJson('contact-page.json', await fetchJson('contact-page'));
  writeJson('faq-page.json', await fetchJson('faq-page'));
  writeJson(
    'faq-items.json',
    await fetchAllPages('faq-items', { 'sort[0]': 'order:asc' }),
  );
  writeJson(
    'procedure-categories.json',
    await fetchAllPages('procedure-categories', {
      'populate[coverImage]': 'true',
      'populate[procedures][populate]': 'coverImage',
      'populate[procedures][sort][0]': 'order:asc',
      'sort[0]': 'order:asc',
    }),
  );
  writeJson(
    'procedures.json',
    await fetchAllPages('procedures', {
      'populate[coverImage]': 'true',
      'populate[galleryImages]': 'true',
      'populate[category]': 'true',
      'sort[0]': 'order:asc',
    }),
  );
  writeJson(
    'gallery-albums.json',
    await fetchAllPages('gallery-albums', {
      'populate[images][populate]': 'image',
      'populate[images][sort][0]': 'order:asc',
      'sort[0]': 'order:asc',
    }),
  );

  rmSync(uploadsDest, { recursive: true, force: true });
  mkdirSync(dirname(uploadsDest), { recursive: true });
  cpSync(uploadsSrc, uploadsDest, { recursive: true });
  console.log(`  ✓ uploads/ ← ${uploadsSrc}`);

  console.log('\nDone. Production build will serve this content without Strapi.');
}

main().catch((err) => {
  console.error(`\nSnapshot failed: ${err.message}`);
  process.exit(1);
});
