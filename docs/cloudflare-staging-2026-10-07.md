# Isolated Cloudflare staging — October 7, 2026

**October 24 update: authenticated and deployed privately.** Wrangler identifies
`jmazza@nexusct.com` and account `d63153d02b780bdffffbcfb60808d602`. The isolated
staging D1, R2 and SESSION resources exist, and the staging Worker has no public
route, workers.dev entrypoint or preview URL. A private service proxy verified
the deployed homepage, setup page and unauthenticated API rejection. See the
[current release assessment](dependency-release-2026-10-24.md) for exact versions,
remote identifiers, checks and remaining release gates. No production Worker or
production storage was changed.

The `staging` environment in `wrangler.jsonc` selects `nexus-emdash-staging`,
`nexus-emdash-staging-db`, and `nexus-emdash-staging-media`. It explicitly declares
DB, MEDIA, SESSION and LOADER bindings. Astro adds IMAGES and ASSETS. Staging has
no production route; `workers_dev` and `preview_urls` are disabled until access
controls are ready. An unclaimed EmDash setup page must not be exposed publicly.
An automated test checks the resolved Wrangler configuration, including isolation
from the production D1 UUID and R2 name.

`npm run build:staging` and `npx wrangler deploy --env staging --dry-run` both pass.
The generated artifact selects the staging Worker and storage names. This proves
configuration and packaging, not resource existence, entitlement or migration
success. No new dependency was added.

## 1. Authenticate and inventory the intended account

Run from the repository root:

```bash
npx wrangler login --use-keyring --scopes account:read user:read workers:write workers_kv:write workers_scripts:write workers_tail:read d1:write
npx wrangler whoami
npx wrangler deployments list --name nexus-emdash --json
npx wrangler d1 info nexus-emdash-db
npx wrangler d1 time-travel info nexus-emdash-db --json
```

If the browser callback times out, finish signing in at
`https://dash.cloudflare.com/login` before starting a fresh device attempt:

```bash
npx wrangler login --use-keyring --device --browser=true --scopes account:read user:read workers:write workers_kv:write workers_scripts:write workers_tail:read d1:write
```

This opens the complete verification URL in the default browser with the fresh
code already supplied. Finish account sign-in in that browser before starting
the five-minute request; an in-app browser and Safari can have different login
sessions. Review the displayed account and permissions, then authorize Wrangler.
If automatic opening is unavailable, use `--browser=false`, open the printed
verification URL and enter the **fresh** terminal code in its code field.
The code expires after five minutes; a signed-in dashboard alone does not
authenticate Wrangler. Do not reuse an expired code. Confirm the terminal reports
successful authorization and `wrangler whoami` identifies the intended account
before inventorying resources. `--use-keyring` keeps the credential in the OS
keychain, outside the checkout.

Confirm the intended Nexus account and production D1 UUID
`2bc4951e-66c9-4d48-b4fa-ee7681750451`. Record the deployed version and a currently
restorable recovery bookmark privately. A Time Travel bookmark is a recovery
point, not an isolated clone; verify its retention window before promotion. Do
not restore the production database during staging validation. If multiple
accounts are available, select the intended account explicitly via
`CLOUDFLARE_ACCOUNT_ID`; do not accept an arbitrary first account.

## 2. Select or provision isolated resources

Inventory existing staging resources before creating anything. If the named
resources already exist, verify their ownership and D1 UUID, then update only
`env.staging`. If they are absent, create them in the verified account:

```bash
npx wrangler d1 create nexus-emdash-staging-db --env staging --binding DB --update-config
npx wrangler r2 bucket create nexus-emdash-staging-media --env staging --binding MEDIA --update-config
npm test
```

Keep the staging D1 UUID distinct from production. No UUID is invented in the
committed template. Wrangler supports provisioning bindings without IDs; the
staging SESSION namespace can be provisioned for the separate staging Worker.
If a namespace is selected manually, verify that it is not used by production.
Verify Worker Loader and Images availability and account limits before upload.

## 3. Prepare a representative upgrade rehearsal

A fresh empty D1 database only tests installation. A populated staging copy is
needed to establish upgrade behavior for existing content, forms, widgets,
users and media. Keep any authorized production export encrypted or in a
private directory outside the checkout; never commit it or print its contents.
Import only into the verified staging database. Never point the staging Worker
at production D1 or R2.

After building the target artifact, inspect migrations before issuing the first
request. The manifest contains 90 migrations total; the actual pending set comes
from the selected database. The installed migration CLI uses these options:

```bash
npm run build:staging
npx emdash migrate --status --manifest .emdash/migrations.json --wrangler-config wrangler.jsonc --wrangler-env staging --json
```

This CLI requires `CLOUDFLARE_ACCOUNT_ID` and a securely supplied
`CLOUDFLARE_API_TOKEN`; Wrangler OAuth sign-in alone does not populate those
variables. Do not put the token in source or a recorded command. Use an explicit
staging target and retain the reported target fingerprint. Investigate unknown
applied migrations before proceeding. The current runtime uses automatic
migrations, so its first staging request can change the staging schema. Retain
the pre-migration staging copy and verify recovery on that isolated copy before
production promotion.

## 4. Deploy privately and validate live behavior

```bash
npm run build:staging
npx wrangler deploy --env staging --dry-run
npm run deploy:staging
```

Deployment remains private with the committed settings. Configure a controlled
staging hostname and Cloudflare Access policy before opening an entrypoint or
initial setup. Keep it separate from the production domain. Confirm account,
Worker name, DB UUID and bucket names in the final upload summary.

On the protected staging URL, verify real administrator sign-in and unauthorized
request rejection, migrated content/search/comments/widgets, R2 upload/read,
native forms activation/submission/readback, and sandbox webhook delivery to a
controlled endpoint with logs. Capture remote startup and Worker Loader errors.
Local intercepted HTTP tests do not establish these results. Optional forms
cleanup/digests and scheduled publishing still require Cron Trigger/handler
wiring; the repository does not currently provide it.

## 5. Decide promotion from the recorded evidence

Preserve the source commit, lockfile hash, built migration manifest, remote
resource/version IDs and observed results. Rebuild with `npm run build` for the
production environment; a staging build is not a production artifact. Recheck
the final PR scan and review state. Repository Actions remains disabled, so
local receipts are separate from GitHub CI. Production remains **NO-GO** until
recovery, populated upgrade rehearsal, binding/startup and authenticated/plugin
workflow gates pass.

### Recorded staging resources and diagnostics

The verified staging D1 ID is `4492e8b9-59ed-49fc-924a-784c713e944b`; the SESSION
namespace ID is `1f98f368e7c049b18a1060873d3cd2ad`. Both are committed only under
`env.staging`. The R2 bucket is `nexus-emdash-staging-media`. Reuse these resources
rather than creating duplicate databases or namespaces. The migration ledger
records 90 migrations after the first private requests; the database started
empty, so this establishes fresh installation rather than a populated upgrade.

`wrangler dev --remote` requires a staging build containing the SESSION ID and
`--upstream-protocol=https`. It reported a missing `PluginBridge` loopback even
though the built entrypoint exports the class. Enabling `enable_ctx_exports`
explicitly did not remove this development-preview warning. A separate
authenticated remote proxy bound only to the deployed staging Worker returned
HTTP 200/302/200/401 for home/admin/setup/content API, with no exceptions in the
matching deployed Worker tail. This does not prove sandbox webhook delivery.
The temporary proxy and tail were stopped after testing. Keep public entrypoints
disabled until a controlled hostname and Access policy are configured.

Sources: [Astro environment selection](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#changed-deploy-to-cloudflare-environment),
[Wrangler environment binding rules](https://developers.cloudflare.com/workers/wrangler/environments/),
[D1 recovery bookmarks](https://developers.cloudflare.com/d1/reference/time-travel/),
[EmDash migrations](https://docs.emdashcms.com/deployment/core-migrations/).
