# GitHub Pages hybrid architecture

## Public repository

The public repository contains only the generated, approved archive website. It must not contain source scans, unpublished article text, private emails, rights notes, credentials, or moderation data.

## Private backend

Cloudflare Workers provides the API boundary. D1 stores article metadata, rights state, comments, moderation state, and audit events. R2 stores scans, PDFs, screenshots, and other source evidence. Public pages consume only approved records during the build.

## Publishing flow

1. Add source evidence to the private editorial workspace.
2. Review metadata, OCR, duplicates, and rights.
3. Approve the work for public display.
4. Export only approved public records.
5. Build the static site with GitHub Actions.
6. Deploy the `out/` directory to GitHub Pages.

## Safety rule

The GitHub Pages site is public and static. It is never the source of truth for editorial or rights data.
