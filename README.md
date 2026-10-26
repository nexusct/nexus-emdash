# EmDash Blog Template (Cloudflare)

A clean, minimal blog built with [EmDash](https://github.com/emdash-cms/emdash) and deployed on Cloudflare Workers with D1 and R2.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/emdash-cms/templates/tree/main/blog-cloudflare)

![Blog template homepage](https://raw.githubusercontent.com/emdash-cms/emdash/main/assets/templates/blog/latest/homepage-light-desktop.jpg)

## What's Included

- Featured post hero on the homepage
- Post archive with reading time estimates
- Category and tag archives
- Full-text search
- RSS feed
- SEO metadata and JSON-LD
- Dark/light mode
- Forms plugin and webhook notifier

## Pages

| Page | Route |
|---|---|
| Homepage | `/` |
| All posts | `/posts` |
| Single post | `/posts/:slug` |
| Category archive | `/category/:slug` |
| Tag archive | `/tag/:slug` |
| Search | `/search` |
| Static pages | `/pages/:slug` |
| 404 | fallback |

## Screenshots

| | Desktop | Mobile |
|---|---|---|
| Light | ![homepage light desktop](https://raw.githubusercontent.com/emdash-cms/emdash/main/assets/templates/blog/latest/homepage-light-desktop.jpg) | ![homepage light mobile](https://raw.githubusercontent.com/emdash-cms/emdash/main/assets/templates/blog/latest/homepage-light-mobile.jpg) |
| Dark | ![homepage dark desktop](https://raw.githubusercontent.com/emdash-cms/emdash/main/assets/templates/blog/latest/homepage-dark-desktop.jpg) | ![homepage dark mobile](https://raw.githubusercontent.com/emdash-cms/emdash/main/assets/templates/blog/latest/homepage-dark-mobile.jpg) |

## Infrastructure

- **Runtime:** Cloudflare Workers
- **Database:** D1
- **Storage:** R2
- **Framework:** Astro with `@astrojs/cloudflare`

## Local Development

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- Cloudflare account (for deployment)
- [Pre-commit](https://pre-commit.com/) (optional but recommended for security)

### Setup

```bash
# Clone the repository
git clone https://github.com/nexusct/nexus-emdash.git
cd nexus-emdash

# Install dependencies
pnpm install

# Bootstrap the database and seed demo content
pnpm bootstrap

# Start the development server
pnpm dev
```

The site will be available at `http://localhost:4321`.

The admin UI is at `http://localhost:4321/_emdash/admin`.

### Security Setup (Recommended)

This repository uses pre-commit hooks to prevent accidental commits of secrets and credentials:

```bash
# Install pre-commit (one-time setup)
pip install pre-commit

# Install the git hooks (one-time per repo)
pre-commit install

# Optional: Run manually on all files
pre-commit run --all-files
```

## Deploying

### Environment Variables

Before deploying, ensure you have configured the following in your Cloudflare Workers environment:

- **Database**: D1 database binding (configured in `wrangler.toml`)
- **Storage**: R2 bucket binding (configured in `wrangler.toml`)
- **API Keys**: Any third-party API keys should be set as Cloudflare secrets, NOT committed to git

```bash
# Example: Add a secret to Cloudflare Workers
wrangler secret put GOOGLE_MAPS_API_KEY
```

### Deploy to Cloudflare

```bash
pnpm deploy
```

Or click the deploy button above to set up the project in your Cloudflare account.

## Security

This project follows security best practices:

- ✅ Pre-commit hooks prevent accidental credential commits
- ✅ `.gitignore` blocks sensitive files
- ✅ Regular dependency updates for security patches
- ✅ No hardcoded secrets in codebase
- ✅ XSS protections enabled

**See [SECURITY.md](SECURITY.md)** for vulnerability reporting and security policies.

**See [SECURITY_NOTES.md](SECURITY_NOTES.md)** for detailed security review findings.

## Project Structure

```
.
├── src/
│   ├── components/       # Astro components (PostCard, TagList, etc.)
│   ├── layouts/          # Base layout with EmDash wiring
│   ├── pages/            # Astro pages (all server-rendered)
│   │   ├── posts/        # Blog post pages
│   │   ├── category/     # Category archive pages
│   │   ├── tag/          # Tag archive pages
│   │   ├── pages/        # Static pages from CMS
│   │   ├── search.astro  # Search page
│   │   └── index.astro   # Homepage
│   ├── styles/           # Global styles
│   └── utils/            # Utility functions
├── seed/
│   └── seed.json         # Schema + demo content
├── astro.config.mjs      # Astro configuration
├── package.json          # Dependencies
└── .pre-commit-config.yaml  # Security hooks
```

## Configuration

### EmDash Configuration

EmDash is configured in `astro.config.mjs`:

```javascript
emdash({
  database: d1({ binding: "DB", session: "auto" }),
  storage: r2({ binding: "MEDIA" }),
  plugins: [formsPlugin()],
  sandboxed: [webhookNotifierPlugin()],
  sandboxRunner: sandbox(),
  marketplace: "https://marketplace.emdashcms.com",
})
```

### Content Schema

The content schema is defined in `seed/seed.json`. This includes:
- Collections (posts, pages)
- Taxonomies (categories, tags)
- Menus
- Widgets

To regenerate TypeScript types after schema changes:

```bash
npx emdash types
```

## Troubleshooting

### Common Issues

**Dependencies fail to install**:
```bash
npm install --legacy-peer-deps
```

**Pre-commit hooks fail**:
```bash
# Update pre-commit hooks
pre-commit autoupdate

# Or skip hooks temporarily (NOT recommended for security-sensitive changes)
git commit --no-verify
```

**Build errors after dependency updates**:
```bash
# Clear caches and reinstall
rm -rf node_modules package-lock.json .astro dist
npm install
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Install pre-commit hooks (`pre-commit install`)
4. Make your changes
5. Run tests and security checks (`pre-commit run --all-files`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## See Also

- [Node.js variant](../blog) -- same template using SQLite and local file storage
- [All templates](../)
- [EmDash documentation](https://github.com/emdash-cms/emdash/tree/main/docs)
- [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
- EmDash CMS: [GitHub Issues](https://github.com/emdash-cms/emdash/issues)
- This template: [GitHub Issues](https://github.com/nexusct/nexus-emdash/issues)
- Security issues: See [SECURITY.md](SECURITY.md)

---

**Maintained by**: Nexus Communications Technology (Nexuscomm LLC)  
**Contact**: office@nexusct.com

