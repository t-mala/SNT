# Dr. Sorin Tătulescu — site + CMS

Angular public site + Strapi CMS.

```text
SNT/
├── apps/
│   ├── web/          # Angular (http://localhost:4200)
│   │   └── public/images/
│   │       ├── categories/   # Față, Sân, Siluetă, Alte
│   │       ├── procedures/   # Marketing cards + clinical diagrams
│   │       ├── hero.jpg
│   │       └── logo-on-*.png
│   └── cms/          # Strapi (http://localhost:1337)
│       ├── data/     # Seeds & WP import (see data/README.md)
│       └── src/seed/
├── package.json      # Root scripts
└── README.md
```

## Prerequisites

- Node.js **20–24** (Strapi is happiest here)
- npm

## Quick start

```bash
# install (first time)
npm --prefix apps/cms install
npm --prefix apps/web install

# terminal A — CMS
npm run cms

# terminal B — site
npm run web
```

- Site: http://localhost:4200  
- Admin: http://localhost:1337/admin  

On first CMS boot, create the admin user. Content types + public read permissions are applied automatically; sample content seeds from `apps/cms/data/`.

## Useful scripts

| Command | What |
|---|---|
| `npm run web` | Angular dev server |
| `npm run cms` | Strapi develop |
| `npm run web:build` | Production Angular build |
| `npm run cms:build` | Production Strapi build |

### Re-seed / force import

```bash
cd apps/cms
SEED_FORCE=true npm run develop          # overwrite singles / upsert by slug
SEED_PROCEDURES=true npm run develop     # re-import WP procedures
SEED_GALLERY=true npm run develop        # gallery import
SEED_FAQ=true npm run develop            # FAQ sync
```

## What the doctor edits in Strapi

| Content type | Purpose |
|---|---|
| Site Setting | Phone, email, WhatsApp, logo |
| Home / About / Contact / FAQ Page | Single pages |
| Procedure Category + Procedure | Față, Sân, Siluetă, Alte |
| Gallery Album + Gallery Image | Before / after |
| FAQ Item | Q&A |

## Notes

- Angular reads `http://localhost:1337/api` (`apps/web/src/environments/environment.ts`).
- Marketing card images are mapped in `apps/web/src/app/core/category-images.ts`.
- No Java backend in v1.
