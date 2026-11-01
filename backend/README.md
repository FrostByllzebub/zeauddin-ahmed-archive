# Memories: production ownership and operations

The active service is the Site Worker at `server/worker.ts`, which routes `/api/memories*` to `server/memories.ts` and delegates ordinary pages to Vinext. Both the Sites and GitHub static frontend use the canonical website API. Existing legacy Worker source in `backend/src/` is retained for history; it is not the active service and should not be deployed for the current memory book.

Owner: the website owner/editor. Last reviewed: 2026-10-29.

## Data and permission boundaries

- Sites provisions `DB` (D1) and `BUCKET` (private R2) through `.openai/hosting.json`.
- The `memory_submissions`, `memory_requests`, `memory_events` and `memory_rate_limits` tables own the current workflow. Drizzle migrations are schema-only and ship with publication. No demonstration stories are seeded in production.
- Private real name, email and optional phone remain server-side and are returned only by the authorized editor API. The public projection is an explicit allowlist. Contributors select a public name or anonymity.
- Story, photo and optional future-contact permissions are separate. No submission publishes automatically. `pending → reviewed → published` requires two explicit editorial actions. Editing a published story returns it to reviewed. Withdrawal cannot be undone by an editor.
- Original photos remain in private R2. Only an authorized editor, or a published and photo-consented public memory, can read the image. Responses use `no-store`, including photos, so withdrawal takes effect on subsequent reads.
- Contributors get an unguessable management receipt. Only its hash is stored. The receipt supports status, correction requests and immediate withdrawal from publication. The source record and audit history remain private after withdrawal. Lost-code requests must be verified manually by the owner using the original email; no unauthenticated reset is implemented.
- Abuse controls include request-size and file-type limits, file signatures, a honeypot, an hourly limit using a keyed IP digest (raw IPs are not stored), and a unique idempotency key to make network retries safe.

## Production configuration

Set `MEMORY_EDITOR_EMAIL` to the verified site owner's ChatGPT identity email and `MEMORY_PRIVACY_KEY` to a random secret through Sites runtime settings. Both are secrets; never commit values or put them in frontend environment variables. Preserve the privacy key across deployments: it also allows retry receipts to be recovered. An authorized identity needs both platform-supplied user ID and the exact owner email. Missing configuration fails closed. Public contribution requires no account; editorial actions require Sites sign-in at `/signin-with-chatgpt?return_to=%2Fadmin`.

The `/admin` HTML is only a public shell. All private reads and writes are authorized server-side. Neither frontend assets nor GitHub contain an editor credential. Do not add a client-side owner bypass.

## Local validation

Run `npm run db:generate` after schema edits, review generated SQL, and apply each pending migration once using Wrangler's local D1 command with `--config dist/server/wrangler.json --local --persist-to .wrangler/state --file <migration>`. Sites applies hosted migrations during publication. Never replay or rewrite an applied production migration.

For a built local preview, put dummy-only local configuration in `dist/server/.dev.vars` after building. It is a disposable build artifact, never an input for publication. Rebuild before packaging; confirm no `.dev.vars*` is included in the artifact. Runtime production secrets live only in Sites settings.

`tests/memory-workflow.test.ts` runs against real in-memory SQLite with a D1 adapter and private-object fixture. It covers private contact exclusion, anonymous attribution, consent, editor authorization, state transitions, idempotency, uploads, correction history, withdrawal and abuse limits. Browser checks cover desktop/mobile layout, form errors, preview, uploads, submission receipt, approved cards and contributor management. Local QA stories must never be copied into production.

## Editor workflow

1. Open `/admin` and sign in using the existing owner's ChatGPT account.
2. Review the story, chosen public identity, permissions and any photo. Use the internal note for context.
3. Mark review complete. Then explicitly approve and publish from the reviewed list, or reject.
4. Resolve correction requests after reviewing the referenced submission. Use the record ID to find it in the appropriate status list. Story edits retain before/after text in the private event history.
5. Unpublish when needed. Contributors can independently withdraw with their management code; their withdrawn stories remain private.

## Retention and monitoring

Review the queue and correction requests regularly. No response-time promise is made. Check private file storage usage; uploads stop at a conservative 9 GB application limit. Review rate-limit and rejection behavior if abuse increases. The present public list is bounded to 100 published memories; add server pagination before the collection approaches that size. Do not add filters or search until real content makes them useful.

## Private editorial requests (policy page)

`/policies#request-form` accepts corrections, rights/removal and privacy requests at `POST /api/editorial-requests`. Requests require a private email, category, 20–4000 character message and consent; corrections/rights require an archive article URL. An opaque submission key deduplicates network retries. No email is sent automatically. The receipt ID is a reference, not a public lookup capability.

The additive `0001_famous_pet_avengers.sql` migration creates `editorial_requests`. Only the existing owner identity can list pending requests (`GET /api/editorial-requests/admin`) or resolve a request (`POST /api/editorial-requests/admin/:id`, `action: resolve`). The `/admin` queue retains the original private request and resolution identity/time. No public reads, attachments or automatic content changes are available. The same origin check, secret-keyed rate limiter and owner identity check as memories apply; bodies are bounded to 20 KB. Review the queue regularly. No response-time promise is made.

The policy owner is the site owner. Update the visible policy date and section text whenever practice changes; preserve `#memory-privacy` and existing management links.

## Original publisher source preservation

See [the preservation workflow](../preservation/README.md) for the 159-URL audit, 114 source screenshot/PDF pairs, integrity checks and Reference Library backup. These backend source assets are separate from the reader-facing article text.
