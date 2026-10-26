# Dependency release refresh — October 24, 2026

**GO for repository review and continued private staging validation. NO-GO for
production release.** Cloudflare authentication, isolated provisioning, private
upload, startup and basic remote HTTP checks now have evidence. Real owner
authentication, representative data upgrade/recovery and plugin workflows remain
release gates. PR #3 remains the single release path; overlapping PR #4 is closed.

## Updated compatible set

| Component | Exact version | Selection evidence |
| --- | --- | --- |
| Astro | 7.3.8 | Latest stable 7.3.x in the npm registry on October 24 |
| Cloudflare adapter | 14.3.4 | Astro `^7.2.0` and Wrangler `^4.125.0` peers; adapter 14.4.2 requires Astro `^7.4.0` |
| EmDash / EmDash Cloudflare | 1.3.1 / 1.3.1 | Current stable matched core/platform pair |
| Forms / webhook notifier | 0.2.11 / 0.2.3 | EmDash peers `>=0.11.0` / `>=0.15.0`; actual plugin behavior tests pass |
| React adapter / React / React DOM | 6.0.6 / 19.2.8 / 19.2.8 | Preserved compatible major set; strict installation passes |
| Wrangler / workers types | 4.152.0 / 5.20261024.1 | Current Wrangler/types peer pair; private upload succeeds |
| TypeScript / Astro check | 5.9.3 / 0.9.10 | Diagnostics pass |

Sources: [Astro metadata](https://registry.npmjs.org/astro/7.3.8),
[adapter metadata](https://registry.npmjs.org/@astrojs%2fcloudflare/14.3.4),
[EmDash metadata](https://registry.npmjs.org/emdash/1.3.1),
[platform metadata](https://registry.npmjs.org/@emdash-cms%2fcloudflare/1.3.1),
[forms metadata](https://registry.npmjs.org/@emdash-cms%2fplugin-forms/0.2.11).

## Security refresh and compatibility

A fresh audit of the October 7 lockfile reported 17 affected packages: one
critical, nine high and seven moderate. That historical zero-vulnerability result
must not be used as current release evidence. The regenerated graph reports zero
vulnerabilities at all severities.

The new graph contains DOMPurify 3.4.17, body-parser 2.4.0, fast-uri 3.1.9,
ip-address 10.7.4 and sanitize-html 2.18.1. Zod is overridden to 4.6.7 because
EmDash 1.3.1, its auth package and plugin types still pin affected 4.5.4. This
stays within major version 4; strict install, seed validation, diagnostics and
the actual plugin tests pass. A regression test verifies that a constrained
10,000-item invalid array produces one bound rejection rather than accumulating
per-item issues. Undici overrides preserve each caller's major: 7.30.1 for 7.x
and 8.12.3 for 8.x. Remove these overrides only after upstream pins are fixed and
the same checks pass. npm's suggested core/adapter downgrades were not applied.

Primary advisories: [DOMPurify template bypass](https://github.com/advisories/GHSA-cg2g-xh64-v4q7),
[Zod collection validation](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5),
[Undici content encodings](https://github.com/advisories/GHSA-xjj6-f33q-929c).

The prior Sharp 0.35.5 and CodeMirror language 6.12.4 overrides remain. Wrangler
and the adapter currently select different upstream Miniflare 5 prereleases;
both receive the patched dependency overrides. No scanner suppression was added.
Kumo remains exactly 2.6.0, with the same SHA-512 tarball integrity as the
[investigated package](kumo-security-review-2026-10-07.md). That review's limits
still apply: exact Socket flagged-file attribution was unavailable, so the
package was not declared a confirmed false positive or guaranteed malware-free.

## Repository checks

Local validation used Node 24.22.1 and npm 12.2.0. The project still requires
Node >=22.19. The [machine-readable receipt](release-validation-2026-10-24.json)
binds the checks to the final lockfile hash and records available log hashes.
Full local logs are under `/tmp/nexus-emdash-validation-20261024/`.

| Check | Observed result |
| --- | --- |
| Clean `npm ci --strict-peer-deps --no-audit` | PASS; no forced or legacy peer resolution |
| Dependency graph | PASS |
| Repository tests | PASS; six tests, including actual forms/webhook behavior, storage isolation and Zod regression |
| Seed schema | PASS |
| Astro typecheck | PASS; 17 files, zero errors/warnings/hints |
| Production and staging builds | PASS; existing client chunk-size advisory remains |
| Production and staging dry-runs | PASS |
| npm audit | PASS; zero vulnerabilities at every severity |
| Registry verification | PASS; 737 package signatures and 292 attestations verified |

The default artifact is rebuilt for production at the end. GitHub Actions was
verified disabled on October 24; local checks are not GitHub CI. Automated
Socket/Kilo results from October 7 apply to their recorded head, not automatically
to this refreshed commit. Inspect the new head's checks before merging.

## Cloudflare evidence

Wrangler confirmed `jmazza@nexusct.com`, account
`d63153d02b780bdffffbcfb60808d602`, and encrypted credentials whose key is held in
macOS Keychain. Authentication used the runbook's scoped grant. Missing broader
default OAuth scopes did not prevent the operations below; no token was copied
into source, browser scripts or recorded commands.

Read-only inventory found no production Worker named `nexus-emdash` (API 10007).
The configured production D1 UUID exists but had zero tables and no queries in
the reported 24-hour window. The production media bucket exists. A recovery
bookmark was obtained privately; no production restore or content export was
performed. This inventory does not establish ownership of any differently named
deployment. Production storage was not mutated.

Created isolated resources in the verified account:

| Resource | Name / identifier |
| --- | --- |
| Worker | `nexus-emdash-staging` |
| D1 | `nexus-emdash-staging-db` / `4492e8b9-59ed-49fc-924a-784c713e944b` |
| R2 | `nexus-emdash-staging-media` |
| SESSION KV | `nexus-emdash-staging-session` / `1f98f368e7c049b18a1060873d3cd2ad` |
| Private uploaded version | `2d282d0a-dc39-4334-80c7-290d3b507f6d` |

Cloudflare accepted DB, MEDIA, SESSION, LOADER, IMAGES and ASSETS. The final
upload reported 98 ms startup, 18,958.03 KiB uncompressed / 5,010.12 KiB gzip.
No public target was deployed: `workers_dev=false`, `preview_urls=false`, routes
empty. The explicit `enable_ctx_exports` flag follows
[Cloudflare's loopback export requirements](https://developers.cloudflare.com/workers/runtime-apis/context/#exports).

A temporary authenticated remote service proxy, bound only to this deployed
staging Worker, established home HTTP 200, admin HTTP 302 to setup, setup HTTP
200, and unauthenticated content API HTTP 401. Matching deployed Worker tail
events identify this version and have no exceptions. The staging D1 now has 85
tables and records 90 migrations, matching the generated manifest count. This
was an empty installation; no representative populated upgrade was proved.

Direct `wrangler dev --remote` still warns that PluginBridge is unavailable even
though the built entrypoint exports it; the explicit compatibility flag did not
remove that development-preview warning. It did not appear in the captured
deployed Worker requests. This difference does not establish actual sandbox
webhook delivery. The deployed homepage also reports that `cache.set()` has no
configured cache provider; caching performance is not claimed. The temporary
proxy and tail were stopped. No public setup page or test owner was created.

## Production gates still open

1. Configure a controlled staging hostname and Access policy; establish actual
   owner/admin sign-in, authorized editing and unauthorized request rejection.
2. Rehearse a populated upgrade and recovery if an existing site is to be
   migrated. Confirm its actual Worker, database and content lineage first.
3. Verify R2 upload/read, real native forms persistence/readback and sandbox
   webhook delivery/retries to a controlled endpoint, including the loopback
   behavior that the development preview could not prove.
4. Review fresh checks on the final PR head and make the promotion decision.
   Optional cleanup/digests/scheduled publishing still lack cron wiring.

No merge or production deployment was performed. Follow the
[updated staging runbook](cloudflare-staging-2026-10-07.md) for the next gate.
