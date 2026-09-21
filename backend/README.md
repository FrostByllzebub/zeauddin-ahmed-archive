# Private memory API

The public `zeauddin-memory-api` Worker is the submission boundary for the public memory-book form. A separate `zeauddin-admin-api` Worker serves the editorial queue and is protected as a whole service by Cloudflare Access. This keeps GitHub Pages static while using the free Cloudflare plan for a small D1 queue and private R2 photo storage.

## Setup

1. Create a D1 database and a private R2 bucket in the Cloudflare dashboard.
2. Copy `wrangler.toml.example` to `wrangler.toml` locally and replace the D1 database ID.
3. Apply the migration with `npx wrangler d1 migrations apply zeauddin-archive --remote`.
4. Deploy with `npx wrangler deploy`.
5. Add the public Worker URL as the GitHub Actions variable `NEXT_PUBLIC_MEMORY_API_URL`.
6. Deploy the dedicated admin Worker as `zeauddin-admin-api`, with the same D1 and private R2 bindings, attach the custom hostname `admin-api.zeauddinahmed.com`, and add that HTTPS URL as `NEXT_PUBLIC_ADMIN_API_URL`. Using a same-site custom hostname allows the GitHub Pages admin shell to send the Cloudflare Access session to the protected API reliably; do not use the `workers.dev` URL for browser-side admin calls.
7. Create a Cloudflare Zero Trust organization on the Free plan and protect the entire admin Worker with a Cloudflare Access application. Allow only the editor email.
8. Add these runtime variables to the admin Worker before using the editorial queue: `ADMIN_EMAIL`, `ACCESS_TEAM_DOMAIN`, and `ACCESS_AUDIENCE`.

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

The `/admin/` page is a static GitHub Pages shell; it never contains a database credential or admin token. Private operations are rejected unless the admin Worker verifies a Cloudflare Access RS256 JWT, matching its audience and the configured `ADMIN_EMAIL`. Keep the Access application in front of the entire admin Worker and never expose the D1 or R2 bindings directly. The public Worker remains open only for its validated submission and approved-public-read routes.

## Storage guardrails

- R2 objects are written through the Worker and are not made public by the bucket configuration.
- Each uploaded photo is limited to 5 MB and JPG, PNG, or WebP.
- The application stops accepting photos at 9 GB total, leaving headroom below the 10 GB monthly Standard-storage allowance.
- Before enabling public photo display, add a Cloudflare billing alert and review R2 usage monthly.
