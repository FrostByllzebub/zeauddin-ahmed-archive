const PUBLIC_ORIGINS = new Set([
  "https://zeauddinahmed.com",
  "https://www.zeauddinahmed.com",
  "http://localhost:3000",
]);
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_PHOTO_BYTES = 9 * 1024 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type Env = { DB: D1Database; BUCKET: R2Bucket };

type AccessEnv = Env & {
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUDIENCE?: string;
  ADMIN_EMAIL?: string;
};

type AccessClaims = { email?: string; aud?: string[] | string; exp?: number; iat?: number };

function corsHeaders(request: Request) {
  const origin = request.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": origin && PUBLIC_ORIGINS.has(origin) ? origin : "https://zeauddinahmed.com",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(request), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}

function clean(value: FormDataEntryValue | null, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(value))) as T;
}

async function requireEditor(request: Request, env: AccessEnv) {
  const token = request.headers.get("CF-Access-Jwt-Assertion");
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUDIENCE || !env.ADMIN_EMAIL) return null;
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
    if (!encodedHeader || !encodedPayload || !encodedSignature) return null;
    const header = decodeJson<{ kid?: string; alg?: string }>(encodedHeader);
    const claims = decodeJson<AccessClaims>(encodedPayload);
    const keysResponse = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
    if (!keysResponse.ok) return null;
    const keySet = (await keysResponse.json()) as { keys?: JsonWebKey[] };
    const key = keySet.keys?.find((candidate) => (candidate as JsonWebKey & { kid?: string }).kid === header.kid);
    if (!key || header.alg !== "RS256") return null;
    const cryptoKey = await crypto.subtle.importKey("jwk", key, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, base64UrlDecode(encodedSignature), new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`));
    const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!valid || !claims.email || claims.email.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase() || !audience.includes(env.ACCESS_AUDIENCE) || !claims.exp || claims.exp <= Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

function publicMemory(row: Record<string, unknown>) {
  return { id: row.id, firstName: row.first_name, lastName: row.last_name, relationship: row.relationship_to_zea, story: row.story, photoCaption: row.photo_caption, photoAvailable: Boolean(row.photo_key), publishedAt: row.moderated_at ?? row.created_at };
}

async function audit(env: Env, entityId: string, action: string, actorId: string, details: Record<string, unknown> = {}) {
  await env.DB.prepare("INSERT INTO audit_events (entity_type, entity_id, action, actor_id, details) VALUES ('memory', ?, ?, ?, ?)").bind(entityId, action, actorId, JSON.stringify(details)).run();
}

export default {
  async fetch(request: Request, env: AccessEnv): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
    if (request.method === "GET" && url.pathname === "/health") return json(request, { ok: true, service: "zeauddin-memory-api" });
    if (request.method === "GET" && url.pathname === "/api/public/memories") {
      const result = await env.DB.prepare("SELECT id, first_name, last_name, relationship_to_zea, story, photo_key, photo_caption, moderation_status, moderated_at, created_at FROM memories WHERE moderation_status = 'approved' AND consent_to_publish = 1 ORDER BY COALESCE(moderated_at, created_at) DESC").all();
      return json(request, { memories: result.results.map(publicMemory) });
    }

    if (url.pathname.startsWith("/api/admin/")) {
      const editor = await requireEditor(request, env);
      if (!editor) return json(request, { error: "Editor authentication required." }, 401);
      const actor = editor.email ?? "editor";
      const photoMatch = url.pathname.match(/^\/api\/admin\/memories\/([^/]+)\/photo$/);
      if (request.method === "GET" && photoMatch) {
        const row = await env.DB.prepare("SELECT photo_key FROM memories WHERE id = ?").bind(photoMatch[1]).first<{ photo_key: string | null }>();
        if (!row?.photo_key) return new Response("Not found", { status: 404 });
        const object = await env.BUCKET.get(row.photo_key);
        if (!object) return new Response("Not found", { status: 404 });
        return new Response(object.body, { headers: { "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream", "Cache-Control": "no-store" } });
      }
      if (request.method === "GET" && url.pathname === "/api/admin/memories") {
        const status = new URL(request.url).searchParams.get("status") ?? "pending";
        const result = await env.DB.prepare("SELECT id, first_name, last_name, email, relationship_to_zea, story, photo_key, photo_caption, consent_to_publish, consent_to_contact, moderation_status, moderation_note, moderated_at, moderated_by, created_at, updated_at FROM memories WHERE moderation_status = ? ORDER BY created_at DESC").bind(status).all();
        return json(request, { memories: result.results });
      }
      const match = url.pathname.match(/^\/api\/admin\/memories\/([^/]+)$/);
      if (!match) return json(request, { error: "Not found" }, 404);
      const memoryId = match[1];
      if (request.method === "PATCH") {
        const body = await request.json<{ action?: string; story?: string; firstName?: string; lastName?: string; relationship?: string; photoCaption?: string; moderationNote?: string }>();
        const existing = await env.DB.prepare("SELECT id FROM memories WHERE id = ?").bind(memoryId).first();
        if (!existing) return json(request, { error: "Memory not found." }, 404);
        const now = new Date().toISOString();
        const action = body.action;
        const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : action === "restore" ? "pending" : null;
        if (status) {
          await env.DB.prepare("UPDATE memories SET moderation_status = ?, moderation_note = ?, moderated_at = ?, moderated_by = ?, updated_at = ? WHERE id = ?").bind(status, clean(body.moderationNote ?? null, 1000) || null, now, actor, now, memoryId).run();
          await audit(env, memoryId, status, actor, { moderationNote: body.moderationNote ?? null });
        } else {
          const firstName = clean(body.firstName ?? null, 80);
          const lastName = clean(body.lastName ?? null, 80);
          const relationship = clean(body.relationship ?? null, 160);
          const story = clean(body.story ?? null, 6000);
          if (!firstName || !lastName || !relationship || story.length < 20) return json(request, { error: "Edited memory fields are incomplete." }, 400);
          await env.DB.prepare("UPDATE memories SET first_name = ?, last_name = ?, relationship_to_zea = ?, story = ?, photo_caption = ?, moderation_note = ?, updated_at = ? WHERE id = ?").bind(firstName, lastName, relationship, story, clean(body.photoCaption ?? null, 500) || null, clean(body.moderationNote ?? null, 1000) || null, now, memoryId).run();
          await audit(env, memoryId, "edit", actor, { fields: ["first_name", "last_name", "relationship_to_zea", "story", "photo_caption", "moderation_note"] });
        }
        return json(request, { ok: true });
      }
      if (request.method === "GET") {
        const row = await env.DB.prepare("SELECT id, first_name, last_name, email, relationship_to_zea, story, photo_key, photo_caption, consent_to_publish, consent_to_contact, moderation_status, moderation_note, moderated_at, moderated_by, created_at, updated_at FROM memories WHERE id = ?").bind(memoryId).first();
        return row ? json(request, { memory: row }) : json(request, { error: "Memory not found." }, 404);
      }
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/public/memories/") && url.pathname.endsWith("/photo")) {
      const memoryId = url.pathname.split("/")[4];
      const row = await env.DB.prepare("SELECT photo_key, moderation_status, consent_to_publish FROM memories WHERE id = ?").bind(memoryId).first<{ photo_key: string | null; moderation_status: string; consent_to_publish: number }>();
      if (!row?.photo_key || row.moderation_status !== "approved" || !row.consent_to_publish) return new Response("Not found", { status: 404 });
      const object = await env.BUCKET.get(row.photo_key);
      if (!object) return new Response("Not found", { status: 404 });
      return new Response(object.body, { headers: { ...corsHeaders(request), "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream", "Cache-Control": "public, max-age=3600" } });
    }

    if (request.method !== "POST" || url.pathname !== "/api/memories") return json(request, { error: "Not found" }, 404);

    try {
      const form = await request.formData();
      if (clean(form.get("website"), 200)) return json(request, { ok: true, message: "Received" });
      const firstName = clean(form.get("firstName"), 80);
      const lastName = clean(form.get("lastName"), 80);
      const relationshipToZea = clean(form.get("relationship"), 160);
      const email = clean(form.get("email"), 254).toLowerCase();
      const story = clean(form.get("story"), 6000);
      const photoCaption = clean(form.get("photoCaption"), 500);
      const consentToPublish = form.get("consentToPublish") === "true";
      const consentToContact = form.get("consentToContact") === "true";
      const photo = form.get("photo");

      if (!firstName || !lastName || !relationshipToZea || !isEmail(email) || story.length < 20 || !consentToPublish) {
        return json(request, { error: "Please complete the required fields and publication permission." }, 400);
      }
      if (photo && photo instanceof File) {
        if (!ALLOWED_PHOTO_TYPES.has(photo.type) || photo.size > MAX_PHOTO_BYTES) return json(request, { error: "Photos must be JPG, PNG, or WebP files smaller than 5 MB." }, 400);
      }

      const id = crypto.randomUUID();
      let photoKey: string | null = null;
      let photoSizeBytes: number | null = null;
      if (photo && photo instanceof File && photo.size > 0) {
        const usage = await env.DB.prepare("SELECT COALESCE(SUM(photo_size_bytes), 0) AS total FROM memories WHERE photo_key IS NOT NULL").first<{ total: number }>();
        if ((usage?.total ?? 0) + photo.size > MAX_TOTAL_PHOTO_BYTES) return json(request, { error: "The archive photo storage limit has been reached. Please contact the editor." }, 507);
        photoKey = `memories/${id}/original.${photo.type.split("/")[1]}`;
        photoSizeBytes = photo.size;
        await env.BUCKET.put(photoKey, photo.stream(), { httpMetadata: { contentType: photo.type }, customMetadata: { memoryId: id, caption: photoCaption } });
      }
      await env.DB.prepare(`INSERT INTO memories (id, first_name, last_name, email, relationship_to_zea, story, photo_key, photo_size_bytes, photo_caption, consent_to_publish, consent_to_contact, moderation_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`)
        .bind(id, firstName, lastName, email, relationshipToZea, story, photoKey, photoSizeBytes, photoCaption || null, consentToPublish ? 1 : 0, consentToContact ? 1 : 0).run();
      return json(request, { ok: true, message: "Your memory has been received for review." }, 201);
    } catch {
      return json(request, { error: "The submission could not be saved. Please try again later." }, 500);
    }
  },
};
