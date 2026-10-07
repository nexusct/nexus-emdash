# Dependency and security release assessment — October 7, 2026

**GO for repository review and an isolated Cloudflare staging validation. NO-GO for production promotion until the Cloudflare gates below pass.** No remote Worker was uploaded, deployed or promoted, and no production database was read or changed.

## Consolidated dependency set

PR #3 is the current release path for the overlapping dependency work in #3 and #4. Main remains unchanged until review and merge. PR #2 has separate documentation and visual-editing changes and is outside this consolidation.

| Package | Exact selected version | Compatibility evidence |
| --- | --- | --- |
| Astro | 7.3.6 | Latest published stable 7.3.x at review; includes #4's 7.3.2 fixes and later patches |
| `@astrojs/cloudflare` | 14.3.4 | Declares Astro `^7.2.0` and Wrangler `^4.125.0` peers |
| `emdash`, `@emdash-cms/cloudflare` | 1.2.0 / 1.2.0 | Current stable core/platform pair; platform depends on exactly this core |
| `@emdash-cms/plugin-forms` | 0.2.9 | Declares EmDash `>=0.11.0`, Astro `>=6.0.0-beta.0`, React 18/19, Kumo exactly 2.6.0 |
| `@emdash-cms/plugin-webhook-notifier` | 0.2.3 | Declares EmDash `>=0.15.0`; current standard sandbox descriptor API |
| React adapter / React / React DOM | 6.0.6 / 19.2.8 / 19.2.8 | Strict installation and dependency graph validation pass |
| Wrangler / TypeScript / Astro check | 4.148.0 / 5.9.3 / 0.9.10 | Build, diagnostics and packaging pass |

Direct dependencies are exact pins, with the complete graph in `package-lock.json`. Node >=22.19 is required by the selected graph; local checks used Node 22.22.3 and npm 11.17.0. The Cloudflare toolchain itself currently pulls Miniflare `5.20261006.0-alpha`; this is an upstream Wrangler dependency, not a separate application prerelease selection. It passed local packaging and Worker preview checks; remote startup remains a release gate.

Sources: [Astro 7.3.6](https://github.com/withastro/astro/releases/tag/astro%407.3.6), [Cloudflare adapter 14.3.4 metadata](https://registry.npmjs.org/@astrojs%2fcloudflare/14.3.4), [EmDash 1.2.0](https://github.com/emdash-cms/emdash/releases/tag/emdash%401.2.0), [forms metadata](https://registry.npmjs.org/@emdash-cms%2fplugin-forms/0.2.9), [webhook metadata](https://registry.npmjs.org/@emdash-cms%2fplugin-webhook-notifier/0.2.3).

## Required source changes and temporary overrides

The webhook plugin now exports a descriptor directly; its named factory import/call was replaced. EmDash 1.x exports comments from `emdash/ui/comments`; the post template import was migrated. Two seed widgets now use `props`, avoiding silently discarded widget options. See [EmDash's upgrade guide](https://docs.emdashcms.com/upgrade-to-v1/).

The environment template leaves `NODE_ENV` unset, names `wrangler.jsonc` correctly, uses Worker secret guidance and removes the obsolete `emdash auth secret` command. `.dev.vars` is ignored. `deploy` builds first so it cannot silently upload stale output. The README and agent startup command match the upgraded CLI.

Two targeted overrides are necessary:

1. Miniflare's exact Sharp 0.35.4 pin still triggered [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w). Override its Sharp to 0.35.5, which is also Astro's installed version. Remove the override when upstream uses the fixed release and the full checks still pass.
2. CodeMirror language 6.13.0 imports `@codemirror/streamparser` without declaring it, causing the admin build to fail. Pin `@codemirror/language` to 6.12.4, whose tarball does not contain that undeclared import. All its callers use compatible 6.x ranges. Remove the pin when upstream fixes package metadata and a clean admin build passes. Do not hide the missing import through externalization. [6.13.0 metadata](https://registry.npmjs.org/@codemirror%2flanguage/6.13.0), [6.12.4 metadata](https://registry.npmjs.org/@codemirror%2flanguage/6.12.4).

## Repository evidence

The repository had no test script or tests before this update. Four Node tests were added for actual plugin behavior using the installed EmDash/plugin implementations, in-memory storage and intercepted network calls. They test valid form persistence, invalid form rejection, webhook content-event delivery, and private-address rejection. They do not establish remote D1 persistence, admin authentication or real Worker Loader RPC delivery.

| Check | Result |
| --- | --- |
| `npm ci --strict-peer-deps` | PASS; no forced or legacy peer resolution |
| `npm ls --all` | PASS; platform-specific optional binaries may be absent as expected |
| `npm test` | PASS; 4 tests, 0 failures |
| `emdash seed seed/seed.json --validate` | PASS; no widget option warnings |
| `npm run typecheck` | PASS; 17 files, 0 errors, 0 warnings, 0 hints |
| `npm run build` | PASS; server, admin and sandbox assets compiled; large client-chunk advisory remains |
| `npm audit --json` | PASS; 0 vulnerabilities of every severity |
| `npm audit signatures` | PASS; 711 registry signatures and 260 attestations verified |
| `wrangler deploy --dry-run` | PASS; upload prepared, no remote deployment |
| Local built Worker preview | Homepage HTTP 200; admin HTTP 302 to setup, setup HTTP 200; webhook sandbox loaded locally |

The [machine-readable receipt](release-validation-2026-10-07.json) records command exits, timings and log hashes, bound to the tested lockfile hash. Full local logs are at `/tmp/nexus-emdash-validation-20261007/`. The committed GitHub workflow covers installation, graph, plugin, seed, diagnostics, build, audit and packaging checks. GitHub's repository Actions setting is currently disabled, so this workflow has not run remotely. Local results must not be represented as a GitHub CI run.

Additional diagnostic: `emdash doctor` exited 1 because its default standalone SQLite `data.db` does not exist in this D1 project. It was not treated as a successful D1 health check or worked around with a dummy database. Local preview uses isolated local D1/R2 resources, not the configured remote account.

## Socket and supply chain

Kumo remains locked to 2.6.0 because the current plugin/platform peers require it. [The detailed review](kumo-security-review-2026-10-07.md) checks registry integrity/signature, publication identity, upstream source maps and static behavior. Production minification and bundled Shiki WebAssembly plausibly explain Socket's obfuscation warning. Exact flagged-file attribution was unavailable, so this is not a confirmed false positive or an absence-of-malware guarantee.

No Socket ignore comment, ignore-all policy or suppression was added. Fresh Socket Project Report and Pull Request Alerts checks passed on source commit `7b2838130c848e6c7f47ecbe695cf78ad40f2945`; Socket updated its [alert comment](https://github.com/nexusct/nexus-emdash/pull/3#issuecomment-5389105939) to report all alerts resolved. This is scanner status, not proof of absence of malicious behavior. Review any later scan on the final PR head. The graph-wide npm attestation verification supplements the package-specific investigation. Several upstream auth packages emit deprecation notices; deprecation alone is not an audit vulnerability, and replacements remain an upstream maintenance concern.

## Cloudflare-only production gates

1. **Migration recovery and staging:** record the currently deployed artifact and actual D1 migration state; obtain a restorable database recovery point; rehearse the target migration manifest on an isolated database with representative content. The generated EmDash 1.2.0 manifest contains 90 migrations in total, not 90 proven pending migrations. Runtime migration mode is currently automatic. Promoting code can therefore mutate schema on the first request. [Migration and rollback guidance](https://docs.emdashcms.com/deployment/core-migrations/).
2. **Deployment and bindings:** validate the intended account, route, domain, Worker Loader entitlement and DB/MEDIA/LOADER plus adapter-generated SESSION/IMAGES/ASSETS bindings. Keep staging resources separate; the current R2 preview name points to the production-named bucket. Dry-run upload was 18,207.75 KiB uncompressed and 4,721.40 KiB gzip; remote startup limits and service permissions were not checked. [Current Workers limits](https://developers.cloudflare.com/workers/platform/limits/).
3. **Authentication and editor:** verify real administrator sign-in, unauthorized admin/API rejection, comments, search, visual editing, content rendering and R2 media access after upgrading an existing site. A local setup page is not an authentication test.
4. **Plugin workflows:** submit and retrieve a real staging form; confirm native-plugin activation/storage, then trigger a sandboxed webhook and observe actual destination delivery, retries and logs. Test with a controlled destination, not customer endpoints. Forms cleanup/digests and scheduled publishing also need cron wiring: this repository currently has no Cron Trigger or `scheduled` handler, so those optional background capabilities are unverified and must not be represented as functioning. [Cloudflare deployment wiring](https://docs.emdashcms.com/deployment/cloudflare/).
5. **Promotion decision:** review the current PR checks and fresh Socket findings, retain the tested artifact/migration manifest, and promote only after the preceding evidence exists. No merge, production promotion, account provisioning or irreversible source-system action was performed in this task.

Next release action: provision or select an isolated Cloudflare staging environment and its D1 recovery copy, then validate this PR's exact artifact there.
