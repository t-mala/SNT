# CMS seed & import data

| Path | Role |
|---|---|
| `seed-content.json` | Site settings, pages, categories, FAQ — loaded by `src/seed/seed-content.ts` |
| `wp-import/` | Scraped procedure HTML + local images — loaded by `src/seed/seed-procedures.ts` |
| `gallery/` | Before/after albums + `captions.json` — loaded by `src/seed/seed-gallery.ts` |
| `archive/` | Unused reference dumps (kept for archaeology, not loaded at boot) |

Seeds run on Strapi bootstrap. Force with env flags documented in the root README.
