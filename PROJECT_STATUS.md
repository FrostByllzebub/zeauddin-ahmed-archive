# Project status

## Current state

- Public Bengali-first archive shell implemented.
- Public routes: `/`, `/archive`, `/publications`, `/about`, `/policies`.
- Protected editorial route: `/admin` using platform sign-in.
- D1/R2 bindings declared for durable records and source files.
- Relational schema includes works, publication occurrences, sources, comments, and append-only audit events.
- Verified article count: 0.
- Link-only count: 0.
- Rights-pending count: 0.
- Duplicate-review count: 0.

## Blockers for a content-complete launch

- Source pack is required: article URLs, scans/PDFs/screenshots/text, verified byline/name variants, and rights decisions.
- Owner contact/correction address is required before publishing a public correction channel.
- The editorial write actions and comment moderation API still need to be connected to D1/R2 after the first source pack is supplied.
