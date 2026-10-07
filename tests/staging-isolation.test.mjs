import assert from "node:assert/strict";
import { test } from "node:test";
import { unstable_readConfig } from "wrangler";

test("staging resolves to isolated storage with public entrypoints disabled", () => {
	const production = unstable_readConfig({ config: "wrangler.jsonc" }, { hideWarnings: true });
	const staging = unstable_readConfig({ config: "wrangler.jsonc", env: "staging" }, { hideWarnings: true });
	assert.equal(staging.name, "nexus-emdash-staging");
	assert.notEqual(staging.name, production.name);
	assert.equal(staging.workers_dev, false);
	assert.equal(staging.preview_urls, false);
	assert.deepEqual(staging.routes, []);
	assert.equal(staging.d1_databases.length, 1);
	assert.equal(staging.d1_databases[0].binding, "DB");
	assert.equal(staging.d1_databases[0].database_name, "nexus-emdash-staging-db");
	assert.notEqual(staging.d1_databases[0].database_id, production.d1_databases[0].database_id);
	assert.notEqual(staging.d1_databases[0].preview_database_id, production.d1_databases[0].database_id);
	assert.equal(staging.r2_buckets.length, 1);
	assert.equal(staging.r2_buckets[0].binding, "MEDIA");
	assert.equal(staging.r2_buckets[0].bucket_name, "nexus-emdash-staging-media");
	assert.equal(staging.r2_buckets[0].preview_bucket_name, "nexus-emdash-staging-media");
	assert.notEqual(staging.r2_buckets[0].bucket_name, production.r2_buckets[0].bucket_name);
	assert.deepEqual(staging.kv_namespaces.map(({ binding }) => binding), ["SESSION"]);
	for (const { id, preview_id } of staging.kv_namespaces) {
		for (const prod of production.kv_namespaces) {
			if (id) assert.notEqual(id, prod.id);
			if (preview_id) assert.notEqual(preview_id, prod.id);
		}
	}
	assert.deepEqual(staging.worker_loaders.map(({ binding }) => binding), ["LOADER"]);
});
