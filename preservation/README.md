# Original publisher preservation

Owner: archive maintainer. Audit completed: 2026-11-01.

The 490-article catalog contains 159 recorded original URLs. The browser audit preserved 115 visible published articles as screenshot/PDF pairs. Another 44 original URLs did not display the matching article after a second browser check. The previously blocked Bangladesh Pratidin article was successfully captured on retry in Edge; no sources remain blocked. The remaining 331 catalog articles have no original URL recorded. No homepage, error page or access challenge is represented as a preserved article.

`manifest.json` records all 159 outcomes. Each captured article has `originals/<slug>/source.jpg`, `source.pdf`, `visible-text.txt` and `provenance.json`. Most PDFs embed unchanged publisher screenshot pixels; the Bangladesh Pratidin retry uses Edge’s native Save as PDF output from its original print page. In either case, they are visual preservation captures, not re-typeset archive articles or publisher-issued native PDFs. For Daily Bangla's infinite related-news feed, captures include the publisher header and full first article column, excluding unrelated subsequent articles. The English-language Views Bangladesh source is retained in English and identified in its record.

These backend preservation assets are tracked in the source repository, outside `public/`, so readers do not download the entire preservation library with the website. `public/source-preservation-status.json` provides a lightweight deployed coverage index. Existing original scans and earlier public captures remain intact.

A second verified copy is stored in the owner's Reference Library under `Articles/Zeauddin Ahmed's Columns/Original Source Captures/`. Preservation does not grant broader reuse rights.

To verify coverage and asset integrity:

```powershell
node --import ./scripts/register-typescript.mjs scripts/validate-source-preservation.mjs
```

For subsequent catalog additions, capture the actual publisher page in the browser, verify its article identity and complete text, save an unchanged screenshot and image-based PDF, and append provenance and hashes. Record blocked/unavailable sources honestly. Recheck original URLs rather than silently substituting an archive transcription. Preserve previously saved captures when a source disappears. Do not bypass security challenges or paywalls.
