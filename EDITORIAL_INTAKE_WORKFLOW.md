# Editorial intake workflow

This is the operating checklist for adding Zeauddin Ahmed archive records. The public GitHub Pages site must only receive records that have completed the first four stages.

## 1. Capture the source

- Create a stable `work_id`.
- Save the original title exactly as it appears in the source.
- Record publication name, issue/edition, date, page number, and original URL when available.
- Store the source location and discovery method in the private editorial workspace.

## 2. Verify the record

- Compare the title, byline, publication, and date against the source.
- Mark date confidence (`exact`, `approximate`, or `unknown`).
- Keep a short evidence note explaining what was checked.
- Do not infer missing facts from search snippets or secondary mentions.

## 3. Review rights

Choose one explicit status before publication:

- `full_text_permitted` — permission or a clear public-domain basis is recorded.
- `excerpt_only` — title, metadata, approved excerpt, and source link may be shown.
- `metadata_only` — only bibliographic metadata and the original source link may be shown.
- `hold` — do not publish until the rights question is resolved.

## 4. Editorial review

- Check Bengali spelling, punctuation, names, dates, and links.
- Confirm that OCR corrections are documented and that scans remain distinguishable from transcriptions.
- Check that no private personal data has entered the public record.
- Add the reviewer and review date to the audit trail.

## 5. Publish

Only records marked `verified` and with a rights status other than `hold` may be exported into the public archive. The export should include a source link and a visible rights note where the full text is not available.

## Minimum intake fields

```text
work_id
canonical_title
original_bengali_title
author
publication
publication_date
article_type
original_url
source_key
verification_status
date_confidence
rights_status
approved_excerpt
summary
evidence_notes
rights_notes
reviewer
reviewed_at
```
