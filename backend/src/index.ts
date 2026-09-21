const PUBLIC_ORIGINS = new Set([
  "https://zeauddinahmed.com",
  "https://www.zeauddinahmed.com",
  "http://localhost:3000",
]);
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_PHOTO_BYTES = 9 * 1024 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type Env = { DB: D1Database; BUCKET: R2Bucket };

function corsHeaders(request: Request) {
  const origin = request.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": origin && PUBLIC_ORIGINS.has(origin) ? origin : "https://zeauddinahmed.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
    if (request.method === "GET" && url.pathname === "/health") return json(request, { ok: true, service: "zeauddin-memory-api" });
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
