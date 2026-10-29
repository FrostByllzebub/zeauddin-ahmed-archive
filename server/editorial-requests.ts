import { allowed, response, isEditor, rate, type MemoryEnv } from "./memories";
import { validateEditorialRequest } from "../lib/editorial-requests";
async function body(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  if (reader)
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 20000) {
        await reader.cancel();
        throw Error("size");
      }
      chunks.push(value);
    }
  const all = new Uint8Array(bytes);
  let i = 0;
  for (const chunk of chunks) {
    all.set(chunk, i);
    i += chunk.length;
  }
  const data: unknown = JSON.parse(new TextDecoder().decode(all));
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw Error("json");
  return data as Record<string, unknown>;
}
export async function handleEditorialRequest(request: Request, env: MemoryEnv) {
  const path = new URL(request.url).pathname;
  if (request.method === "OPTIONS")
    return new Response(null, {
      status: allowed(request) ? 204 : 403,
      headers: allowed(request)
        ? {
            "Access-Control-Allow-Origin": request.headers.get("origin")!,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            Vary: "Origin",
          }
        : {},
    });
  if (request.method === "POST" && !allowed(request))
    return response(
      request,
      { error: "এই উৎস থেকে অনুরোধ পাঠানো যাবে না।" },
      403,
    );
  const admin = path.startsWith("/api/editorial-requests/admin");
  if (admin && !isEditor(request, env))
    return response(request, { error: "সম্পাদকের সাইন-ইন প্রয়োজন।" }, 401);
  try {
    if (
      admin &&
      request.method === "GET" &&
      path === "/api/editorial-requests/admin"
    ) {
      const rows = await env.DB.prepare(
        "SELECT id,category,article_url,email,message,status,created_at FROM editorial_requests WHERE status='pending' ORDER BY created_at DESC LIMIT 100",
      ).all();
      return response(request, { requests: rows.results });
    }
    if (admin && request.method === "POST") {
      const id = path.match(
        /^\/api\/editorial-requests\/admin\/([a-f0-9-]{36})$/i,
      )?.[1];
      if (!id) return response(request, { error: "Not found" }, 404);
      const data = await body(request);
      if (data.action !== "resolve")
        return response(request, { error: "Invalid action" }, 400);
      const result = await env.DB.prepare(
        "UPDATE editorial_requests SET status='resolved',resolved_by=?,resolved_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'",
      )
        .bind(request.headers.get("oai-authenticated-user-email"), id)
        .run();
      if (!result.meta.changes)
        return response(request, { error: "Not found" }, 404);
      return response(request, { ok: true });
    }
    if (path !== "/api/editorial-requests" || request.method !== "POST")
      return response(request, { error: "Not found" }, 404);
    if (!env.MEMORY_PRIVACY_KEY)
      return response(
        request,
        { error: "এখন জমা নেওয়া যাচ্ছে না। পরে চেষ্টা করুন।" },
        503,
      );
    const data = await body(request);
    if (data.website)
      return response(request, { error: "অনুরোধটি গ্রহণ করা যায়নি।" }, 400);
    for (const k of ["email", "articleUrl", "message"])
      if (typeof data[k] === "string") data[k] = (data[k] as string).trim();
    const errors = validateEditorialRequest(data);
    if (Object.keys(errors).length)
      return response(
        request,
        { errors, error: "চিহ্নিত ঘরগুলো ঠিক করুন।" },
        400,
      );
    if (!(await rate(request, env, "editorial")))
      return response(
        request,
        { error: "অনেকবার অনুরোধ এসেছে। এক ঘণ্টা পরে চেষ্টা করুন।" },
        429,
      );
    const existing = await env.DB.prepare(
      "SELECT id,email,category,article_url,message FROM editorial_requests WHERE submission_key=?",
    )
      .bind(data.submissionKey)
      .first<Record<string, unknown>>();
    if (existing) {
      if (
        existing.email !== data.email ||
        existing.category !== data.category ||
        existing.article_url !== (data.articleUrl || "") ||
        existing.message !== data.message
      )
        return response(
          request,
          { error: "নতুন অনুরোধের জন্য পাতাটি নতুন করে খুলুন।" },
          409,
        );
      return response(request, { id: existing.id }, 200);
    }
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO editorial_requests (id,submission_key,category,article_url,email,message) VALUES (?,?,?,?,?,?) ON CONFLICT(submission_key) DO NOTHING",
    )
      .bind(
        id,
        data.submissionKey,
        data.category,
        data.articleUrl || "",
        data.email,
        data.message,
      )
      .run();
    const saved = await env.DB.prepare(
      "SELECT id FROM editorial_requests WHERE submission_key=?",
    )
      .bind(data.submissionKey)
      .first<{ id: string }>();
    return response(request, { id: saved!.id }, 201);
  } catch {
    return response(
      request,
      { error: "অনুরোধটি জমা হয়নি। তথ্য রেখে আবার চেষ্টা করুন।" },
      400,
    );
  }
}
