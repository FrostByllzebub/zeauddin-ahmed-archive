import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import {
  handleMemoryRequest,
  isEditor,
  type MemoryEnv,
} from "../server/memories";
import { publicMemory, transition, validateMemory } from "../lib/memory-policy";
function fixture() {
  const sqlite = new DatabaseSync(":memory:");
  const migration = readFileSync(
    new URL("../drizzle/0000_loose_human_cannonball.sql", import.meta.url),
    "utf8",
  );
  sqlite.exec(migration);
  const prepare = (sql: string) => {
    let args: unknown[] = [];
    const stmt = {
      bind(...values: unknown[]) {
        args = values;
        return stmt;
      },
      async first() {
        return sqlite.prepare(sql).get(...(args as never[])) || null;
      },
      async all() {
        return { results: sqlite.prepare(sql).all(...(args as never[])) };
      },
      async run() {
        const r = sqlite.prepare(sql).run(...(args as never[]));
        return { meta: { changes: r.changes } };
      },
    };
    return stmt;
  };
  const objects = new Map<string, { bytes: Uint8Array; type: string }>();
  const env = {
    DB: {
      prepare,
      async batch(statements: Array<{ run: () => Promise<unknown> }>) {
        sqlite.exec("BEGIN");
        try {
          const rows = [];
          for (const s of statements) rows.push(await s.run());
          sqlite.exec("COMMIT");
          return rows;
        } catch (e) {
          sqlite.exec("ROLLBACK");
          throw e;
        }
      },
    },
    BUCKET: {
      async put(
        key: string,
        data: Uint8Array,
        options: { httpMetadata: { contentType: string } },
      ) {
        objects.set(key, {
          bytes: data,
          type: options.httpMetadata.contentType,
        });
      },
      async get(key: string) {
        const r = objects.get(key);
        return r
          ? { body: r.bytes, httpMetadata: { contentType: r.type } }
          : null;
      },
      async delete(key: string) {
        objects.delete(key);
      },
    },
    MEMORY_EDITOR_EMAIL: "editor@example.org",
    MEMORY_PRIVACY_KEY: "private-test-secret",
  } as unknown as MemoryEnv;
  return { env, sqlite, objects };
}
const base = "https://zeauddinahmed.com";
const valid = {
  name: "Private contributor",
  publicName: "Chosen name",
  email: "private@example.org",
  phone: "+৮৮০ ১৭১২৩৪৫৬৭৮",
  relationship: "পাঠক",
  title: "A remembered moment",
  story:
    "This is a private test memory with enough detail to validate the workflow.",
  attribution: "named",
  consentStory: "true",
  consentPhoto: "false",
  consentContact: "false",
};
function request(
  path: string,
  method = "GET",
  body?: BodyInit,
  editor = false,
) {
  return new Request(base + path, {
    method,
    headers: {
      Origin: base,
      ...(editor
        ? {
            "oai-authenticated-user-id": "signed-in-editor",
            "oai-authenticated-user-email": "editor@example.org",
          }
        : {}),
      ...(typeof body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body,
  });
}
async function submit(
  env: MemoryEnv,
  extra: Record<string, string> = {},
  photo?: File,
  key = crypto.randomUUID(),
) {
  const form = new FormData();
  for (const [k, v] of Object.entries({
    ...valid,
    ...extra,
    submissionKey: key,
  }))
    form.set(k, v);
  if (photo) form.set("photo", photo);
  return handleMemoryRequest(request("/api/memories", "POST", form), env);
}
async function data(r: Response) {
  return (await r.json()) as Record<string, any>;
}
async function command(env: MemoryEnv, id: string, action: string, extra = {}) {
  return handleMemoryRequest(
    request(
      `/api/memories/admin/${id}`,
      "POST",
      JSON.stringify({ action, ...extra }),
      true,
    ),
    env,
  );
}
test("validation accepts Bengali phone digits and rejects absent consent and oversize fields", () => {
  assert.deepEqual(validateMemory(valid, false), {});
  assert.ok(
    validateMemory({ ...valid, consentStory: "false" }, false).consentStory,
  );
  assert.ok(validateMemory({ ...valid, phone: "secret words" }, false).phone);
  assert.ok(validateMemory({ ...valid, story: "x".repeat(6001) }, false).story);
  assert.ok(validateMemory(valid, true).consentPhoto);
});
test("public projection never includes private name, email, phone, hashes or unconsented photo", () => {
  const out = publicMemory({
    id: "a",
    name: "Private",
    public_name: "Name",
    anonymous: 1,
    email: "secret",
    phone: "private",
    token_hash: "secret",
    submission_key: "private",
    photo_key: "x",
    consent_photo: 0,
  });
  assert.equal(out.displayName, "নাম প্রকাশে অনিচ্ছুক");
  assert.equal(out.photoUrl, null);
  for (const key of ["name", "email", "phone", "token_hash", "submission_key"])
    assert.ok(!(key in out));
});
test("editor requires platform identity and exact owner email; pending records are protected", async () => {
  const { env } = fixture();
  assert.equal(isEditor(request("/api/memories/admin"), env), false);
  assert.equal(
    isEditor(
      new Request(base, {
        headers: { "oai-authenticated-user-email": "editor@example.org" },
      }),
      env,
    ),
    false,
  );
  assert.equal(
    isEditor(
      new Request(base, {
        headers: {
          "oai-authenticated-user-email": "intruder@example.org",
          "oai-authenticated-user-id": "x",
        },
      }),
      env,
    ),
    false,
  );
  assert.equal(
    (await handleMemoryRequest(request("/api/memories/admin"), env)).status,
    401,
  );
  const r = await data(await submit(env));
  assert.ok(r.id && r.code);
  assert.deepEqual(
    (await data(await handleMemoryRequest(request("/api/memories"), env)))
      .memories,
    [],
  );
  const admin = await data(
    await handleMemoryRequest(
      request("/api/memories/admin", "GET", undefined, true),
      env,
    ),
  );
  assert.equal(admin.memories[0].phone, "+880 1712345678");
  assert.ok(!("token_hash" in admin.memories[0]));
});
test("review must precede publication, duplicates are safe, and withdrawal immediately hides story", async () => {
  const { env } = fixture();
  const key = crypto.randomUUID();
  const receipt = await data(await submit(env, {}, undefined, key));
  assert.equal((await command(env, receipt.id, "publish")).status, 409);
  assert.equal((await command(env, receipt.id, "review")).status, 200);
  assert.equal((await command(env, receipt.id, "publish")).status, 200);
  const pub = await data(
    await handleMemoryRequest(request("/api/memories"), env),
  );
  assert.equal(pub.memories.length, 1);
  assert.equal(pub.memories[0].displayName, "Chosen name");
  assert.ok(!JSON.stringify(pub).includes(valid.email));
  assert.ok(!JSON.stringify(pub).includes("+880"));
  const duplicate = await data(await submit(env, {}, undefined, key));
  assert.equal(duplicate.id, receipt.id);
  assert.equal(duplicate.code, receipt.code);
  assert.equal(
    (
      await handleMemoryRequest(
        request(
          "/api/memories/manage",
          "POST",
          JSON.stringify({ id: receipt.id, code: "wrong", action: "withdraw" }),
        ),
        env,
      )
    ).status,
    403,
  );
  const withdrawn = await handleMemoryRequest(
    request(
      "/api/memories/manage",
      "POST",
      JSON.stringify({ ...receipt, action: "withdraw" }),
    ),
    env,
  );
  assert.equal(withdrawn.status, 200);
  assert.deepEqual(
    (await data(await handleMemoryRequest(request("/api/memories"), env)))
      .memories,
    [],
  );
  assert.equal((await command(env, receipt.id, "publish")).status, 409);
});
test("photo requires separate consent, valid bytes, and publication before public read", async () => {
  const { env } = fixture();
  const photo = new File(
    [
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==",
        "base64",
      ),
    ],
    "photo.png",
    { type: "image/png" },
  );
  assert.equal((await submit(env, {}, photo)).status, 400);
  assert.equal(
    (
      await submit(
        env,
        { consentPhoto: "true" },
        new File(["not an image"], "bad.jpg", { type: "image/jpeg" }),
      )
    ).status,
    400,
  );
  const r = await data(await submit(env, { consentPhoto: "true" }, photo));
  assert.equal(
    (await handleMemoryRequest(request(`/api/memories/photo/${r.id}`), env))
      .status,
    404,
  );
  await command(env, r.id, "review");
  await command(env, r.id, "publish");
  assert.equal(
    (await handleMemoryRequest(request(`/api/memories/photo/${r.id}`), env))
      .status,
    200,
  );
  await handleMemoryRequest(
    request(
      "/api/memories/manage",
      "POST",
      JSON.stringify({ ...r, action: "withdraw" }),
    ),
    env,
  );
  assert.equal(
    (await handleMemoryRequest(request(`/api/memories/photo/${r.id}`), env))
      .status,
    404,
  );
});
test("correction requests are private, edits unpublish and retain before/after audit", async () => {
  const { env, sqlite } = fixture();
  const r = await data(await submit(env));
  await command(env, r.id, "review");
  await command(env, r.id, "publish");
  const correction = await handleMemoryRequest(
    request(
      "/api/memories/manage",
      "POST",
      JSON.stringify({
        ...r,
        action: "correct",
        message: "Please correct the spelling in my story.",
      }),
    ),
    env,
  );
  assert.equal(correction.status, 200);
  const admin = await data(
    await handleMemoryRequest(
      request("/api/memories/admin", "GET", undefined, true),
      env,
    ),
  );
  assert.equal(admin.requests.length, 1);
  await command(env, r.id, "edit", {
    title: "Corrected title",
    story: valid.story + " Corrected.",
  });
  assert.deepEqual(
    (await data(await handleMemoryRequest(request("/api/memories"), env)))
      .memories,
    [],
  );
  const audit = sqlite
    .prepare("SELECT details FROM memory_events WHERE action='edited'")
    .get() as { details: string };
  assert.equal(JSON.parse(audit.details).before.title, valid.title);
  await command(env, r.id, "resolve_request", {
    requestId: admin.requests[0].id,
  });
  assert.equal(
    sqlite.prepare("SELECT status FROM memory_requests").get()?.status,
    "resolved",
  );
});
test("cross-origin writes and burst submissions are rejected without storing raw IP", async () => {
  const { env, sqlite } = fixture();
  assert.equal(
    (
      await handleMemoryRequest(
        new Request(base + "/api/memories", {
          method: "POST",
          headers: { Origin: "https://attacker.invalid" },
        }),
        env,
      )
    ).status,
    403,
  );
  for (let i = 0; i < 10; i++) assert.equal((await submit(env)).status, 201);
  assert.equal((await submit(env)).status, 429);
  const rows = sqlite.prepare("SELECT key FROM memory_rate_limits").all() as {
    key: string;
  }[];
  assert.match(rows[0].key, /^[a-f0-9]{64}$/);
});
test("state transitions do not restore contributor withdrawals or auto-publish", () => {
  assert.equal(transition("pending", "review", true), "reviewed");
  assert.equal(transition("pending", "publish", true), null);
  assert.equal(transition("reviewed", "publish", false), null);
  assert.equal(transition("withdrawn", "restore", true), null);
});

test("editor routes accept opaque uppercase IDs from the Worker runtime", async () => {
  const { env, sqlite } = fixture();
  const r = await data(await submit(env));
  const upper = r.id.toUpperCase();
  sqlite
    .prepare("UPDATE memory_submissions SET id=? WHERE id=?")
    .run(upper, r.id);
  assert.equal((await command(env, upper, "review")).status, 200);
});
