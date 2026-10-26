import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";

test("oversized constrained collections stop before accumulating per-item validation errors", () => {
	// EmDash and its auth/plugin schemas share the patched Zod 4 dependency.
	// GHSA-mrhx-c7xc-m3w5 previously allowed an issue for every rejected item.
	const result = z.array(z.string()).max(2).safeParse(Array(10_000).fill(0));
	assert.equal(result.success, false);
	assert.equal(result.error.issues.length, 1);
	assert.equal(result.error.issues[0].code, "too_big");
	assert.equal(result.error.issues[0].maximum, 2);
});
