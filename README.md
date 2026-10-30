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
| `npm run web:snapshot` | Dump CMS JSON + media into `apps/web/public` (Strapi must be running) |
| `npm run web:pack` | Snapshot + production build — deployable site **without** Strapi |
| `npm run cms:build` | Production Strapi build |

### Deploy the site only (no Strapi)

Edit content locally in Strapi, then pack a self-contained static site:

```bash
npm run cms          # terminal A — keep running
npm run web:pack     # terminal B — writes public/content + public/uploads, then builds
```

Upload `apps/web/dist/web/browser/` to any static host. The packed build reads CMS data from `/content/*.json` and images from `/uploads/`.

For SPA routing, configure the host so unknown paths fall back to `index.html` (e.g. Netlify `_redirects`: `/* /index.html 200`).

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
| Procedure Category + Procedure | Rinoplastie, Injectabile, Sânul |
| Gallery Album + Gallery Image | Before / after |
| FAQ Item | Q&A |

### Site focus

Public nav / home show three areas:

1. **Rinoplastie** — primară + secundară (revizie)
2. **Sânul** — augmentare, ridicare
3. **Injectabile**

Gallery albums: rinoplastie primară / secundară, injectabile, augmentare mamară. Empty albums stay hidden until photos exist under `apps/cms/data/gallery/`.

**Ghidul pacientului** (rinoplastie) lives on `/rinoplastie` — copy in `apps/web/src/app/core/patient-guide.ts`. Drop signed PDFs into `apps/web/public/docs/rinoplastie/` and list them in that file.

After changing seed taxonomy, re-seed CMS: `cd apps/cms && SEED_FORCE=true npm run develop`.  
FAQ-only sync: `cd apps/cms && SEED_FAQ=true npm run develop`.

## Notes

- Angular reads `http://localhost:1337/api` (`apps/web/src/environments/environment.ts`).
- Marketing card images are mapped in `apps/web/src/app/core/category-images.ts`.
- Focus slugs live in `apps/web/src/app/core/site-focus.ts`.
- No Java backend in v1.
