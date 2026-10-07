import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
import webhookDescriptor from "@emdash-cms/plugin-webhook-notifier";
import webhook from "@emdash-cms/plugin-webhook-notifier/sandbox";

let vite;
let forms;
before(async () => {
	vite = await createServer({
		configFile: false,
		cacheDir: "node_modules/.vite-test",
		server: { middlewareMode: true },
		ssr: { noExternal: ["@emdash-cms/plugin-forms"] },
	});
	forms = await vite.ssrLoadModule("@emdash-cms/plugin-forms");
});
after(async () => { await vite?.close(); });

function storage() {
	const records = new Map();
	return {
		records,
		get: async (id) => records.get(id),
		put: async (id, data) => { records.set(id, data); },
		count: async () => records.size,
	};
}

function formContext(data) {
	const formStorage = storage();
	formStorage.records.set("contact", {
		name: "Contact", slug: "contact", status: "active", submissionCount: 0,
		pages: [{ fields: [{ id: "email", name: "email", label: "Email", type: "email", required: true }] }],
		settings: { spamProtection: "none", notifyEmails: [], confirmationMessage: "Received" },
	});
	return {
		input: { formId: "contact", data },
		storage: { forms: formStorage, submissions: storage() },
		requestMeta: { ip: "127.0.0.1", userAgent: "compatibility-test", referer: null },
	};
}

test("forms registers with EmDash and persists a valid submission", async () => {
	const plugin = forms.createPlugin(); // Uses the installed EmDash definePlugin API.
	assert.equal(plugin.id, forms.formsPlugin().id);
	const ctx = formContext({ email: "reader@example.test" });
	assert.equal((await plugin.routes.submit.handler(ctx)).success, true);
	assert.equal(ctx.storage.submissions.records.size, 1);
	assert.equal((await ctx.storage.forms.get("contact")).submissionCount, 1);
	assert.equal([...ctx.storage.submissions.records.values()][0].data.email, "reader@example.test");
});

test("forms rejects invalid input without storing a submission", async () => {
	const ctx = formContext({ email: "invalid" });
	assert.equal((await forms.createPlugin().routes.submit.handler(ctx)).success, false);
	assert.equal(ctx.storage.submissions.records.size, 0);
});

test("webhook descriptor matches sandbox implementation and delivers a content event", async () => {
	const ctx = {
		kv: { get: async (key) => ({ "settings:webhookUrl": "https://hooks.example.test/events", "settings:enabled": true })[key] },
		storage: { deliveries: storage() },
		log: { info() {}, warn() {}, error() {} },
		http: { fetch: async (url, init) => {
			assert.equal(url, "https://hooks.example.test/events");
			assert.equal(JSON.parse(init.body).event, "content:create");
			return new Response(null, { status: 204 });
		} },
	};
	assert.equal(webhookDescriptor.format, "standard");
	for (const hook of webhookDescriptor.hooks) assert.equal(typeof webhook.hooks[hook.name].handler, "function");
	await webhook.hooks["content:afterSave"].handler({ isNew: true, collection: "posts", content: { id: "post-1", slug: "post-1", status: "published" } }, ctx);
	assert.equal([...ctx.storage.deliveries.records.values()][0].status, "success");
});

test("webhook rejects a private destination before making a network request", async () => {
	await assert.rejects(webhook.routes.test.handler({ input: { url: "http://127.0.0.1/private" } }, {
		kv: { get: async () => null },
		http: { fetch: async () => assert.fail("private destination reached") },
		log: { info() {}, warn() {}, error() {} },
	}), /private IP/);
});
