# Dr. Sorin Tătulescu — site rebuild

Open-source stack: **Angular** (public site) + **Strapi** (CMS admin).

## Structure

```text
apps/
  web/   Angular public website (port 4200)
  cms/   Strapi CMS + content API (port 1337)
```

## Prerequisites

- Node.js 20–24 recommended (26 may work; Strapi prefers ≤25 for `better-sqlite3`)
- npm

## First-time CMS setup

```bash
cd apps/cms
npm run develop
```

1. Open http://localhost:1337/admin
2. Create the first admin user (the doctor’s login)
3. Content types are already defined
4. On first boot (or with `SEED_FORCE=true`), sample content is loaded from the old website into Strapi and published
5. Public read permissions are applied automatically on bootstrap

To re-run the seed (overwrites singles / upserts by slug):

```bash
cd apps/cms
SEED_FORCE=true npm run develop
```

## Run the public site

```bash
cd apps/web
npm start
```

Open http://localhost:4200

The Angular app reads from `http://localhost:1337/api` (see `src/environments/environment.ts`).

## Contact (v1)

- WhatsApp: built from `site-setting.whatsappNumber`
- Email: `mailto:` from `site-setting.email`

No Java backend in v1.

## Content the doctor edits

| In Strapi | Purpose |
|---|---|
| Site Setting | Phone, email, WhatsApp, social, logo |
| Home / About / Contact / FAQ Page | Single pages |
| Procedure Category + Procedure | Fața, Sânul, Silueta, Alte + articles |
| Gallery Album + Gallery Image | Before/after albums |
| FAQ Item | Questions & answers |

## Hosting / domain

Later — develop locally first, then point `drtatulescu.com` when ready.
