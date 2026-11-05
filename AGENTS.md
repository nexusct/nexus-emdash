This is an EmDash site -- a CMS built on Astro with a full admin UI.

## Commands

```bash
npm ci --strict-peer-deps   # Install from package-lock.json (Node >=22.19)
npm run dev -- --host 0.0.0.0 --port 4321
npx emdash types      # Regenerate TypeScript types from schema
npx emdash seed seed/seed.json --validate  # Validate seed file
npm test
npm run typecheck
npm run build
```

The site is at `http://localhost:4321`. The admin UI is at `http://localhost:4321/_emdash/admin`.

Local D1 and R2 are provided by the Cloudflare adapter, so local development does not need a Cloudflare login. On a fresh database, `/_emdash/admin` redirects to setup. `http://localhost:4321/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin` signs in a local dev admin.

## Key Files

| File                     | Purpose                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `astro.config.mjs`       | Astro config with `emdash()` integration, database, and storage                  |
| `src/live.config.ts`     | EmDash loader registration (boilerplate -- don't modify)                         |
| `seed/seed.json`         | Schema definition + demo content (collections, fields, taxonomies, menus, widgets) |
| `emdash-env.d.ts`      | Generated types for collections (auto-regenerated on dev server start)             |
| `src/layouts/Base.astro` | Base layout with EmDash wiring (menus, search, page contributions)               |
| `src/pages/`             | Astro pages -- all server-rendered                                                 |

## Skills

Agent skills are in `.agents/skills/`. Load them when working on specific tasks:

- **building-emdash-site** -- Querying content, rendering Portable Text, schema design, seed files, site features (menus, widgets, search, SEO, comments, bylines). Start here.
- **creating-plugins** -- Building EmDash plugins with hooks, storage, admin UI, API routes, and Portable Text block types.
- **emdash-cli** -- CLI commands for content management, seeding, type generation, and visual editing flow.

## Rules

- All content pages must be server-rendered (`output: "server"`). No `getStaticPaths()` for CMS content.
- Image fields are objects (`{ src, alt }`), not strings. Use `<Image image={...} />` from `"emdash/ui"`.
- `entry.id` is the slug (for URLs). `entry.data.id` is the database ULID (for API calls like `getEntryTerms`).
- Always call `Astro.cache.set(cacheHint)` on pages that query content.
- Taxonomy names in queries must match the seed's `"name"` field exactly (e.g., `"category"` not `"categories"`).
