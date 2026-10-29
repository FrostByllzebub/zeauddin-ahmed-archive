import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import type { MemoryEnv } from "../server/memories";
import { handleEditorialRequest } from "../server/editorial-requests";
function fixture() {
  const sqlite = new DatabaseSync(":memory:");
  const migration = readFileSync(
    new URL("../drizzle/0000_loose_human_cannonball.sql", import.meta.url),
    "utf8",
  );
  sqlite.exec(migration);
  sqlite.exec(
    readFileSync(
      new URL("../drizzle/0001_famous_pet_avengers.sql", import.meta.url),
      "utf8",
    ),
  );
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
  category: "correction",
  articleUrl: base + "/articles/example",
  email: "private@example.org",
  message: "A spelling correction with enough detail.",
  consent: true,
  submissionKey: "11111111-1111-4111-8111-111111111111",
};
function req(path = "", data: unknown = valid, editor = false, origin = base) {
  return new Request(base + "/api/editorial-requests" + path, {
    method: data === null ? "GET" : "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...(editor
        ? {
            "oai-authenticated-user-id": "editor",
            "oai-authenticated-user-email": "editor@example.org",
          }
        : {}),
    },
    ...(data === null ? {} : { body: JSON.stringify(data) }),
  });
}
test("private requests persist once, remain owner-only and can be resolved", async () => {
  const { env, sqlite } = fixture();
  try {
    const r = await handleEditorialRequest(req(), env);
    assert.equal(r.status, 201);
    const { id } = (await r.json()) as { id: string };
    assert.deepEqual(await (await handleEditorialRequest(req(), env)).json(), {
      id,
    });
    assert.equal(
      sqlite.prepare("SELECT count(*) AS n FROM editorial_requests").get()!.n,
      1,
    );
    assert.equal(
      (await handleEditorialRequest(req("", null), env)).status,
      404,
    );
    assert.equal(
      (await handleEditorialRequest(req("/admin", null), env)).status,
      401,
    );
    assert.equal(
      (
        await handleEditorialRequest(
          req("/admin/" + id, { action: "resolve" }),
          env,
        )
      ).status,
      401,
    );
    const list = await handleEditorialRequest(req("/admin", null, true), env);
    assert.equal(list.status, 200);
    const data = (await list.json()) as { requests: Record<string, unknown>[] };
    assert.equal(data.requests[0].email, valid.email);
    assert(!("submission_key" in data.requests[0]));
    assert.equal(
      (
        await handleEditorialRequest(
          req("/admin/" + id, { action: "resolve" }, true),
          env,
        )
      ).status,
      200,
    );
    assert.equal(
      sqlite
        .prepare("SELECT status FROM editorial_requests WHERE id=?")
        .get(id)!.status,
      "resolved",
    );
    assert.equal(
      (
        await handleEditorialRequest(req("/admin", null, true), env)
      ).headers.get("Cache-Control"),
      "private, no-store",
    );
  } finally {
    sqlite.close();
  }
});
test("request validation, origin, bounded body and honeypot reject unsafe submissions", async () => {
  const { env, sqlite } = fixture();
  try {
    for (const changes of [
      { email: "bad" },
      { consent: false },
      { articleUrl: "https://evil.example/a" },
      { message: "short" },
      { website: "spam" },
      { message: "x".repeat(21000) },
    ])
      assert.equal(
        (await handleEditorialRequest(req("", { ...valid, ...changes }), env))
          .status,
        400,
      );
    assert.equal(
      (
        await handleEditorialRequest(
          req("", valid, false, "https://evil.example"),
          env,
        )
      ).status,
      403,
    );
    assert.equal(
      sqlite.prepare("SELECT count(*) AS n FROM editorial_requests").get()!.n,
      0,
    );
  } finally {
    sqlite.close();
  }
});
test("privacy requests need no article URL, conflicting retries fail and rate limits protect queue", async () => {
  const { env, sqlite } = fixture();
  try {
    assert.equal(
      (
        await handleEditorialRequest(
          req("", { ...valid, category: "privacy", articleUrl: "" }),
          env,
        )
      ).status,
      201,
    );
    assert.equal((await handleEditorialRequest(req(), env)).status, 409);
    for (let i = 0; i < 30; i++) await handleEditorialRequest(req(), env);
    assert.equal((await handleEditorialRequest(req(), env)).status, 429);
  } finally {
    sqlite.close();
  }
});
