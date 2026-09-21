# Private memory API

This Worker is the submission boundary for the public memory-book form. It keeps GitHub Pages static while using the free Cloudflare plan for a small D1 queue and private R2 photo storage.

## Setup

1. Create a D1 database and a private R2 bucket in the Cloudflare dashboard.
2. Copy `wrangler.toml.example` to `wrangler.toml` locally and replace the D1 database ID.
3. Apply the migration with `npx wrangler d1 migrations apply zeauddin-archive --remote`.
4. Deploy with `npx wrangler deploy`.
5. Add the Worker URL as the GitHub Actions variable `NEXT_PUBLIC_MEMORY_API_URL` and rebuild the Pages site.

Do not commit `wrangler.toml`, API tokens, database IDs, or private R2 URLs. The public form sends only to an explicitly configured HTTPS endpoint.

## API

- `GET /health` — non-sensitive health check.
- `POST /api/memories` — accepts multipart form data, validates fields, stores an optional photo privately, and creates a `pending` D1 record.

The Worker intentionally has no public read endpoint for pending memories. A later authenticated editorial tool should moderate records and publish only approved, consented content.

## Storage guardrails

- R2 objects are written through the Worker and are not made public by the bucket configuration.
- Each uploaded photo is limited to 5 MB and JPG, PNG, or WebP.
- The application stops accepting photos at 9 GB total, leaving headroom below the 10 GB monthly Standard-storage allowance.
- Before enabling public photo display, add a Cloudflare billing alert and review R2 usage monthly.
