# Private memory API

This Worker is the submission boundary for the public memory-book form. It keeps GitHub Pages static while using the free Cloudflare plan for a small D1 queue and private R2 photo storage.

## Setup

1. Create a D1 database and a private R2 bucket in the Cloudflare dashboard.
2. Copy `wrangler.toml.example` to `wrangler.toml` locally and replace the D1 database ID.
3. Apply the migration with `npx wrangler d1 migrations apply zeauddin-archive --remote`.
4. Deploy with `npx wrangler deploy`.
5. Add the Worker URL as the GitHub Actions variable `NEXT_PUBLIC_MEMORY_API_URL` and rebuild the Pages site.
6. Create a Cloudflare Zero Trust organization on the Free plan and protect the editorial host/path with a Cloudflare Access application. Allow only the editor email.
7. Add these Worker runtime variables before using the editorial queue: `ADMIN_EMAIL`, `ACCESS_TEAM_DOMAIN`, and `ACCESS_AUDIENCE`.

Do not commit `wrangler.toml`, API tokens, database IDs, or private R2 URLs. The public form sends only to an explicitly configured HTTPS endpoint.

## API

- `GET /health` — non-sensitive health check.
- `POST /api/memories` — accepts multipart form data, validates fields, stores an optional photo privately, and creates a `pending` D1 record.
- `GET /api/public/memories` — returns only approved, consented memories without private contact fields.
- `GET /api/admin/memories?status=pending` — Access-JWT-protected editorial queue.
- `PATCH /api/admin/memories/:id` — Access-JWT-protected approve, reject, restore, or edit action.
- `GET /api/admin/memories/:id/photo` — Access-JWT-protected private photo review.
- `GET /api/admin/memories/:id/audit` — Access-JWT-protected audit history for the submission.

The Worker intentionally has no public read endpoint for pending memories. A later authenticated editorial tool should moderate records and publish only approved, consented content.

## Editorial security

The `/admin/` page is a static GitHub Pages shell; it never contains a database credential or admin token. Private operations are rejected unless the Worker verifies a Cloudflare Access RS256 JWT, matching its audience and the configured `ADMIN_EMAIL`. Keep the Access application in front of the admin surface and never expose the D1 or R2 bindings directly.

## Storage guardrails

- R2 objects are written through the Worker and are not made public by the bucket configuration.
- Each uploaded photo is limited to 5 MB and JPG, PNG, or WebP.
- The application stops accepting photos at 9 GB total, leaving headroom below the 10 GB monthly Standard-storage allowance.
- Before enabling public photo display, add a Cloudflare billing alert and review R2 usage monthly.
