# Public feature specification

The archive is a Bengali-first reading and preservation site. The following behaviors are intentional and should guide future implementation.

## Article reading

Each verified article page should provide:

- Original Bengali title, normalized title, author, publication, date, edition, and article type.
- A readable transcription when publication rights permit it.
- An approved excerpt and summary when only limited republication is permitted.
- A prominent link to the original publication page.
- A source-health label such as `original link available`, `original link unavailable`, or `snapshot only`.
- A preserved snapshot reference when the source page is removed or changes materially.
- A visible provenance note explaining when the snapshot was captured and whether the text was transcribed or OCR-corrected.

The public site must never imply that a snapshot is the original publisher’s current page. The source link and preserved copy are separate objects.

## Source preservation

Snapshots belong in private/object storage, not in the Git repository. The editorial record should retain the storage key, capture timestamp, SHA-256 checksum, MIME type, and a short capture note. A public snapshot may be shown only after rights review.

For older articles whose links no longer work, the archive may still show verified metadata and a preservation notice. It should not silently replace a dead source with an unverified copy.

## Reader opinions

The reader-response form will request first name, last name, email, and opinion. Names and email addresses are private contact data and must not be rendered in public HTML, analytics payloads, URLs, or GitHub issues.

Responses should enter a moderated backend queue with:

- spam protection and rate limiting;
- explicit consent to future correspondence;
- a moderation state (`pending`, `approved`, `rejected`, or `withdrawn`);
- a private audit trail;
- a deletion/export process for contact requests.

The public article page may show only an approved opinion after editorial review, without exposing the reader’s email address.

## Context pages

The site can grow beyond articles through three evidence-aware sections:

- **পরিচিতি** — biography and introduction, with each factual claim linked to a source.
- **ছবির সংগ্রহ** — historical photographs with caption, date/approximation, photographer/source, rights status, and alt text.
- **যোগাযোগ** — a verified contact route for corrections, rights requests, and research contributions.

No biography, image caption, date, or contact address should be invented to make a page look complete.
