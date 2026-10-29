import {
  publicMemory,
  normalizePhone,
  validateMemory,
  validPhotoBytes,
  transition,
} from "../lib/memory-policy";
export type MemoryEnv = {
  DB: D1Database;
  BUCKET: R2Bucket;
  MEMORY_EDITOR_EMAIL?: string;
  MEMORY_PRIVACY_KEY?: string;
};
const MAX_FILE = 5 * 1024 * 1024,
  MAX_BODY = 6 * 1024 * 1024;
const origins = new Set([
  "https://zeauddinahmed.com",
  "https://www.zeauddinahmed.com",
  "https://zeas-bengali-column-archive.tanvir1990.chatgpt.site",
]);
function allowed(request: Request) {
  const u = new URL(request.url),
    o = request.headers.get("origin");
  return !!o && (origins.has(o) || o === u.origin);
}
function response(request: Request, data: unknown, status = 200) {
  const origin = request.headers.get("origin");
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      ...(origin && allowed(request)
        ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
        : {}),
    },
  });
}
export function isEditor(request: Request, env: MemoryEnv) {
  return (
    !!env.MEMORY_EDITOR_EMAIL &&
    !!request.headers.get("oai-authenticated-user-id") &&
    request.headers.get("oai-authenticated-user-email")?.toLowerCase() ===
      env.MEMORY_EDITOR_EMAIL.toLowerCase()
  );
}
async function digest(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  )
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
async function receiptCode(key: string, id: string) {
  const k = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return Array.from(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(id)),
    ),
  )
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
async function boundedBody(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY)
    throw new Error("বড় ফাইল: সর্বোচ্চ ৫ MB ছবি দিন।");
  let size = 0;
  const reader = request.body?.getReader(),
    chunks: Uint8Array[] = [];
  if (reader) {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BODY) {
        await reader.cancel();
        throw new Error("বড় ফাইল: সর্বোচ্চ ৫ MB ছবি দিন।");
      }
      chunks.push(value);
    }
  }
  const body = new Uint8Array(size);
  let i = 0;
  for (const c of chunks) {
    body.set(c, i);
    i += c.length;
  }
  return new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body,
  });
}
async function rate(request: Request, env: MemoryEnv, category: string) {
  const hour = Math.floor(Date.now() / 3600000);
  const key = await digest(
    `${env.MEMORY_PRIVACY_KEY}:${request.headers.get("CF-Connecting-IP") || "unknown"}:${category}:${hour}`,
  );
  const count = await env.DB.prepare(
    "INSERT INTO memory_rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count",
  )
    .bind(key, (hour + 2) * 3600)
    .first<{ count: number }>();
  await env.DB.prepare("DELETE FROM memory_rate_limits WHERE expires_at < ?")
    .bind(Math.floor(Date.now() / 1000))
    .run();
  return (count?.count || 100) <= (category === "submit" ? 10 : 30);
}
async function event(
  env: MemoryEnv,
  id: string,
  action: string,
  actor: string,
  details: unknown = {},
) {
  return env.DB.prepare(
    "INSERT INTO memory_events (memory_id,action,actor,details) VALUES (?,?,?,?)",
  ).bind(id, action, actor, JSON.stringify(details));
}
async function photo(
  request: Request,
  env: MemoryEnv,
  id: string,
  editor: boolean,
) {
  const row = await env.DB.prepare(
    "SELECT photo_key,photo_type,status,consent_photo,consent_story FROM memory_submissions WHERE id=?",
  )
    .bind(id)
    .first<Record<string, unknown>>();
  if (
    !row?.photo_key ||
    (!editor &&
      (row.status !== "published" || !row.consent_photo || !row.consent_story))
  )
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  const obj = await env.BUCKET.get(String(row.photo_key));
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "Content-Type": String(row.photo_type),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function handleMemoryRequest(
  request: Request,
  env: MemoryEnv,
): Promise<Response> {
  const path = new URL(request.url).pathname;
  try {
    if (request.method === "OPTIONS")
      return new Response(null, {
        status: allowed(request) ? 204 : 403,
        headers: allowed(request)
          ? {
              "Access-Control-Allow-Origin": request.headers.get("origin")!,
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            }
          : undefined,
      });
    if (request.method === "POST" && !allowed(request))
      return response(
        request,
        { error: "এই ওয়েবসাইট থেকে ফর্মটি জমা দিন।" },
        403,
      );
    if (path === "/api/memories" && request.method === "GET") {
      const rows = await env.DB.prepare(
        "SELECT id,title,story,public_name,anonymous,relationship,photo_key,photo_caption,photo_date,consent_photo,published_at FROM memory_submissions WHERE status='published' AND consent_story=1 ORDER BY published_at DESC LIMIT 100",
      ).all();
      return response(request, { memories: rows.results.map(publicMemory) });
    }
    if (path.startsWith("/api/memories/photo/") && request.method === "GET")
      return photo(request, env, path.split("/").pop()!, false);
    if (path === "/api/memories" && request.method === "POST") {
      if (!env.MEMORY_PRIVACY_KEY)
        return response(
          request,
          { error: "স্মৃতি জমাদান সাময়িকভাবে বন্ধ আছে। পরে চেষ্টা করুন।" },
          503,
        );
      const form = await (await boundedBody(request)).formData();
      if (form.get("website"))
        return response(
          request,
          { ok: true, id: "", code: "", message: "জমা হয়েছে।" },
          201,
        );
      const input = Object.fromEntries(
        Array.from(form.entries()).filter(([, v]) => typeof v === "string"),
      ) as Record<string, string>;
      const file = form.get("photo");
      const hasPhoto = file instanceof File && file.size > 0;
      const errors = validateMemory(input, hasPhoto);
      if (Object.keys(errors).length)
        return response(
          request,
          { error: "চিহ্নিত ঘরগুলো ঠিক করুন।", errors },
          400,
        );
      if (!/^[a-f0-9-]{36}$/.test((input.submissionKey || "").toLowerCase()))
        return response(
          request,
          { error: "পৃষ্ঠাটি আবার খুলে চেষ্টা করুন।" },
          400,
        );
      const submissionKey = await digest(input.submissionKey);
      const duplicate = await env.DB.prepare(
        "SELECT id FROM memory_submissions WHERE submission_key=?",
      )
        .bind(submissionKey)
        .first<{ id: string }>();
      if (duplicate)
        return response(
          request,
          {
            ok: true,
            id: duplicate.id,
            code: await receiptCode(env.MEMORY_PRIVACY_KEY, duplicate.id),
          },
          200,
        );
      if (!(await rate(request, env, "submit")))
        return response(
          request,
          { error: "অনেকবার চেষ্টা করা হয়েছে। এক ঘণ্টা পরে আবার চেষ্টা করুন।" },
          429,
        );
      let bytes: Uint8Array | undefined;
      if (hasPhoto) {
        if (file.size > MAX_FILE)
          return response(
            request,
            { errors: { photo: "ছবি সর্বোচ্চ ৫ MB হতে পারে।" } },
            400,
          );
        bytes = new Uint8Array(await file.arrayBuffer());
        if (!validPhotoBytes(bytes, file.type))
          return response(
            request,
            { errors: { photo: "সঠিক JPG, PNG বা WebP ছবি দিন।" } },
            400,
          );
        const usage = await env.DB.prepare(
          "SELECT COALESCE(SUM(photo_bytes),0) AS total FROM memory_submissions",
        ).first<{ total: number }>();
        if ((usage?.total || 0) + file.size > 9 * 1024 * 1024 * 1024)
          return response(
            request,
            { error: "ছবি সংরক্ষণের জায়গা পূর্ণ। ছবি ছাড়া জমা দিন।" },
            507,
          );
      }
      const id = crypto.randomUUID(),
        code = await receiptCode(env.MEMORY_PRIVACY_KEY, id),
        photoKey = hasPhoto ? `memories-v2/${id}/photo` : null,
        now = new Date().toISOString();
      if (photoKey && bytes)
        await env.BUCKET.put(photoKey, bytes, {
          httpMetadata: { contentType: (file as File).type },
        });
      try {
        await env.DB.batch([
          env.DB.prepare(
            "INSERT INTO memory_submissions (id,name,public_name,anonymous,email,phone,relationship,title,story,photo_key,photo_type,photo_bytes,photo_caption,photo_date,consent_story,consent_photo,consent_contact,status,token_hash,submission_key,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?,?,?,?)",
          ).bind(
            id,
            input.name.trim(),
            input.attribution === "anonymous" ? "" : input.publicName.trim(),
            input.attribution === "anonymous" ? 1 : 0,
            input.email.trim().toLowerCase(),
            input.phone ? normalizePhone(input.phone.trim()) : null,
            input.relationship,
            input.title?.trim() || "একটি স্মৃতি",
            input.story.trim(),
            photoKey,
            hasPhoto ? (file as File).type : null,
            hasPhoto ? (file as File).size : 0,
            input.photoCaption?.trim() || null,
            input.photoDate?.trim() || null,
            1,
            hasPhoto ? 1 : 0,
            input.consentContact === "true" ? 1 : 0,
            await digest(code),
            submissionKey,
            now,
            now,
          ),
          await event(env, id, "submitted", "contributor"),
        ]);
      } catch (error) {
        if (photoKey) await env.BUCKET.delete(photoKey);
        const old = await env.DB.prepare(
          "SELECT id FROM memory_submissions WHERE submission_key=?",
        )
          .bind(submissionKey)
          .first<{ id: string }>();
        if (old)
          return response(
            request,
            {
              ok: true,
              id: old.id,
              code: await receiptCode(env.MEMORY_PRIVACY_KEY, old.id),
            },
            200,
          );
        throw error;
      }
      return response(
        request,
        {
          ok: true,
          id,
          code,
          message: "আপনার স্মৃতি পর্যালোচনার জন্য জমা হয়েছে।",
        },
        201,
      );
    }
    if (path === "/api/memories/manage" && request.method === "POST") {
      if (!(await rate(request, env, "manage")))
        return response(request, { error: "পরে আবার চেষ্টা করুন।" }, 429);
      const data = (await (await boundedBody(request)).json()) as Record<
        string,
        string
      >;
      const row = await env.DB.prepare(
        "SELECT id,status,token_hash FROM memory_submissions WHERE id=?",
      )
        .bind(String(data.id || ""))
        .first<Record<string, unknown>>();
      if (!row || (await digest(String(data.code || ""))) !== row.token_hash)
        return response(
          request,
          { error: "জমার নম্বর বা গোপন কোড সঠিক নয়।" },
          403,
        );
      if (data.action === "status")
        return response(request, { id: row.id, status: row.status });
      if (data.action === "withdraw") {
        await env.DB.batch([
          env.DB.prepare(
            "UPDATE memory_submissions SET status='withdrawn',updated_at=? WHERE id=?",
          ).bind(new Date().toISOString(), row.id),
          await event(env, String(row.id), "withdrawn", "contributor"),
        ]);
        return response(request, {
          ok: true,
          message: "গল্প ও ছবি প্রকাশ থেকে প্রত্যাহার করা হয়েছে।",
          status: "withdrawn",
        });
      }
      if (
        data.action === "correct" &&
        data.message?.trim().length >= 10 &&
        data.message.length <= 2000
      ) {
        await env.DB.batch([
          env.DB.prepare(
            "INSERT INTO memory_requests (id,memory_id,message) VALUES (?,?,?)",
          ).bind(crypto.randomUUID(), row.id, data.message.trim()),
          await event(
            env,
            String(row.id),
            "correction_requested",
            "contributor",
          ),
        ]);
        return response(request, {
          ok: true,
          message: "সংশোধনের অনুরোধ সম্পাদকীয় তালিকায় জমা হয়েছে।",
        });
      }
      return response(
        request,
        { error: "সংশোধনের বিবরণ ১০ থেকে ২০০০ অক্ষরে লিখুন।" },
        400,
      );
    }
    if (path.startsWith("/api/memories/admin")) {
      if (!isEditor(request, env))
        return response(request, { error: "সম্পাদকের সাইন-ইন প্রয়োজন।" }, 401);
      const actor = request.headers.get("oai-authenticated-user-email")!;
      if (path === "/api/memories/admin" && request.method === "GET") {
        const status =
          new URL(request.url).searchParams.get("status") || "pending";
        const rows = await env.DB.prepare(
          "SELECT * FROM memory_submissions WHERE status=? ORDER BY created_at DESC LIMIT 100",
        )
          .bind(status)
          .all();
        const requests = await env.DB.prepare(
          "SELECT r.id,r.memory_id,r.message,r.status,r.created_at,s.title FROM memory_requests r JOIN memory_submissions s ON s.id=r.memory_id WHERE r.status='pending' ORDER BY r.created_at DESC LIMIT 100",
        ).all();
        return response(request, {
          memories: rows.results.map(
            ({ token_hash, submission_key, ...row }) => row,
          ),
          requests: requests.results,
        });
      }
      const m = path.match(
        /^\/api\/memories\/admin\/([a-f0-9-]+)(?:\/(photo|events))?$/i,
      );
      if (!m) return response(request, { error: "Not found" }, 404);
      const id = m[1];
      if (m[2] === "photo" && request.method === "GET")
        return photo(request, env, id, true);
      if (m[2] === "events" && request.method === "GET") {
        const rows = await env.DB.prepare(
          "SELECT action,actor,details,created_at FROM memory_events WHERE memory_id=? ORDER BY id DESC LIMIT 50",
        )
          .bind(id)
          .all();
        return response(request, { events: rows.results });
      }
      if (request.method === "POST") {
        const data = (await (await boundedBody(request)).json()) as Record<
          string,
          string
        >;
        const row = await env.DB.prepare(
          "SELECT * FROM memory_submissions WHERE id=?",
        )
          .bind(id)
          .first<Record<string, unknown>>();
        if (!row) return response(request, { error: "Not found" }, 404);
        const now = new Date().toISOString();
        if (data.action === "edit") {
          if (
            !data.story ||
            data.story.length < 20 ||
            data.story.length > 6000 ||
            !data.title?.trim() ||
            data.title.length > 160
          )
            return response(
              request,
              { error: "শিরোনাম ও গল্পের দৈর্ঘ্য ঠিক করুন।" },
              400,
            );
          await env.DB.batch([
            env.DB.prepare(
              "UPDATE memory_submissions SET title=?,story=?,note=?,status=CASE WHEN status='published' THEN 'reviewed' ELSE status END,updated_at=? WHERE id=?",
            ).bind(
              data.title.trim(),
              data.story.trim(),
              (data.note || "").slice(0, 1000),
              now,
              id,
            ),
            await event(env, id, "edited", actor, {
              before: { title: row.title, story: row.story },
              after: { title: data.title, story: data.story },
            }),
          ]);
        } else if (data.action === "resolve_request") {
          await env.DB.batch([
            env.DB.prepare(
              "UPDATE memory_requests SET status='resolved' WHERE id=? AND memory_id=?",
            ).bind(data.requestId, id),
            await event(env, id, "request_resolved", actor),
          ]);
        } else {
          const next = transition(
            String(row.status),
            data.action,
            !!row.consent_story,
          );
          if (!next)
            return response(
              request,
              { error: "এই অবস্থায় কাজটি করা যায় না।" },
              409,
            );
          await env.DB.batch([
            env.DB.prepare(
              "UPDATE memory_submissions SET status=?,note=?,published_at=CASE WHEN ?='published' THEN ? ELSE published_at END,updated_at=? WHERE id=? AND status=?",
            ).bind(
              next,
              (data.note || "").slice(0, 1000),
              next,
              now,
              now,
              id,
              row.status,
            ),
            await event(env, id, next, actor, {
              note: (data.note || "").slice(0, 1000),
            }),
          ]);
        }
        return response(request, { ok: true });
      }
    }
    return response(request, { error: "Not found" }, 404);
  } catch (error) {
    console.error(
      "Memory service failure",
      error instanceof Error ? error.name : "unknown",
    );
    return response(
      request,
      {
        error:
          "এই মুহূর্তে সংরক্ষণ করা যায়নি। আপনার লেখা রেখে পরে আবার চেষ্টা করুন।",
      },
      500,
    );
  }
}
